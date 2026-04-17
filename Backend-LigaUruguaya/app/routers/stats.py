import asyncio
import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.deps import get_db
from app.models.Player import Player
from app.models.Team import Team
from app.models.Match import Match, MatchEvent, MatchPlayer, EventType, PlayerRole
from app.schemas.stats import (
    GoalScorerStats,
    AssistStats,
    ExpulsionStats,
    MinutesPlayedStats,
    StandingsStats,
)

router = APIRouter(
    prefix="/stats",
    tags=["Stats"]
)


# ── Manager de conexiones WebSocket ──────────────────────────────────────────

class StandingsConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, data: dict):
        """Envía todas las tablas a todos los clientes conectados."""
        payload = json.dumps(data)
        for ws in list(self.active):
            try:
                await ws.send_text(payload)
            except Exception:
                self.disconnect(ws)


standings_manager = StandingsConnectionManager()


# ── Helper: partidos jugados por jugador ──────────────────────────────────────

def _matches_played_subquery(db: Session) -> dict[int, int]:
    starters = (
        db.query(
            MatchPlayer.player_id,
            func.count(MatchPlayer.match_id.distinct()).label("cnt"),
        )
        .filter(MatchPlayer.role == PlayerRole.starter)
        .group_by(MatchPlayer.player_id)
        .all()
    )
    subs = (
        db.query(
            MatchEvent.player_id,
            func.count(MatchEvent.match_id.distinct()).label("cnt"),
        )
        .filter(MatchEvent.event_type == EventType.substitution_in)
        .group_by(MatchEvent.player_id)
        .all()
    )
    matches_map: dict[int, int] = {}
    for row in starters:
        matches_map[row.player_id] = matches_map.get(row.player_id, 0) + row.cnt
    for row in subs:
        matches_map[row.player_id] = matches_map.get(row.player_id, 0) + row.cnt
    return matches_map


# ── Helper central: calcular tabla para una lista de partidos ─────────────────

def _build_table(matches: list, db: Session) -> list[StandingsStats]:
    now = datetime.now(timezone.utc)
    table: dict[int, dict] = {}

    def ensure(team_id: int):
        if team_id not in table:
            table[team_id] = dict(played=0, won=0, drawn=0, lost=0, gf=0, gc=0)

    for match in matches:
        home_id = match.home_team_id
        away_id = match.away_team_id
        match_date = match.date
        if match_date.tzinfo is None:
            match_date = match_date.replace(tzinfo=timezone.utc)
        finished = match_date < now

        if finished:
            hg = match.home_score or 0
            ag = match.away_score or 0
        else:
            goal_events = (
                db.query(MatchEvent.team_id, func.count(MatchEvent.id).label("cnt"))
                .filter(
                    MatchEvent.match_id == match.id,
                    MatchEvent.event_type == EventType.goal,
                )
                .group_by(MatchEvent.team_id)
                .all()
            )
            goals_by_team = {row.team_id: row.cnt for row in goal_events}
            hg = goals_by_team.get(home_id, 0)
            ag = goals_by_team.get(away_id, 0)

        ensure(home_id)
        ensure(away_id)

        if finished or (hg > 0 or ag > 0):
            table[home_id]["played"] += 1
            table[away_id]["played"] += 1
            table[home_id]["gf"] += hg
            table[home_id]["gc"] += ag
            table[away_id]["gf"] += ag
            table[away_id]["gc"] += hg
            if hg > ag:
                table[home_id]["won"] += 1
                table[away_id]["lost"] += 1
            elif ag > hg:
                table[away_id]["won"] += 1
                table[home_id]["lost"] += 1
            else:
                table[home_id]["drawn"] += 1
                table[away_id]["drawn"] += 1

    if not table:
        return []

    teams = db.query(Team).filter(Team.id.in_(table.keys())).all()
    team_names = {t.id: t.name for t in teams}

    rows: list[StandingsStats] = []
    for team_id, stats in table.items():
        pts = stats["won"] * 3 + stats["drawn"]
        dg  = stats["gf"] - stats["gc"]
        rows.append(StandingsStats(
            position=0,
            team_id=team_id,
            team_name=team_names.get(team_id, "?"),
            played=stats["played"],
            won=stats["won"],
            drawn=stats["drawn"],
            lost=stats["lost"],
            goals_for=stats["gf"],
            goals_against=stats["gc"],
            goal_difference=dg,
            points=pts,
        ))

    rows.sort(key=lambda r: (r.points, r.goal_difference, r.goals_for), reverse=True)
    for i, row in enumerate(rows, start=1):
        row.position = i
    return rows


def _compute_standings(db: Session) -> list[StandingsStats]:
    return _build_table(db.query(Match).all(), db)


def _compute_standings_by_fase(db: Session, fase: str) -> list[StandingsStats]:
    return _build_table(db.query(Match).filter(Match.fase == fase).all(), db)


# ── Helper: calcular todas las tablas de una vez ──────────────────────────────

def _compute_all_standings(db: Session) -> dict:
    """
    Devuelve un dict con todas las tablas:
    {
      apertura:     [...],
      intermedio_a: [...],
      intermedio_b: [...],
      clausura:     [...],
      anual:        [...],
    }
    """
    apertura_standings = _compute_standings_by_fase(db, "Apertura")

    # Grupos del Intermedio por posición en Apertura
    grupo_a_ids = {r.team_id for r in apertura_standings if r.position % 2 != 0}
    grupo_b_ids = {r.team_id for r in apertura_standings if r.position % 2 == 0}

    intermedio_matches = db.query(Match).filter(Match.fase == "Intermedio").all()
    intermedio_a = _build_table(
        [m for m in intermedio_matches
         if m.home_team_id in grupo_a_ids and m.away_team_id in grupo_a_ids],
        db
    )
    intermedio_b = _build_table(
        [m for m in intermedio_matches
         if m.home_team_id in grupo_b_ids and m.away_team_id in grupo_b_ids],
        db
    )

    clausura = _compute_standings_by_fase(db, "Clausura")

    # Anual: suma de puntos de las tres fases
    stats_map: dict[int, dict] = {}
    for fase_rows in [apertura_standings, intermedio_a, intermedio_b, clausura]:
        for row in fase_rows:
            if row.team_id not in stats_map:
                stats_map[row.team_id] = dict(
                    team_name=row.team_name,
                    played=0, won=0, drawn=0, lost=0, gf=0, gc=0, points=0
                )
            stats_map[row.team_id]["played"]  += row.played
            stats_map[row.team_id]["won"]     += row.won
            stats_map[row.team_id]["drawn"]   += row.drawn
            stats_map[row.team_id]["lost"]    += row.lost
            stats_map[row.team_id]["gf"]      += row.goals_for
            stats_map[row.team_id]["gc"]      += row.goals_against
            stats_map[row.team_id]["points"]  += row.points

    anual_rows: list[StandingsStats] = []
    for team_id, s in stats_map.items():
        dg = s["gf"] - s["gc"]
        anual_rows.append(StandingsStats(
            position=0,
            team_id=team_id,
            team_name=s["team_name"],
            played=s["played"],
            won=s["won"],
            drawn=s["drawn"],
            lost=s["lost"],
            goals_for=s["gf"],
            goals_against=s["gc"],
            goal_difference=dg,
            points=s["points"],
        ))
    anual_rows.sort(key=lambda r: (r.points, r.goal_difference, r.goals_for), reverse=True)
    for i, row in enumerate(anual_rows, start=1):
        row.position = i

    return {
        "apertura":     [r.model_dump() for r in apertura_standings],
        "intermedio_a": [r.model_dump() for r in intermedio_a],
        "intermedio_b": [r.model_dump() for r in intermedio_b],
        "clausura":     [r.model_dump() for r in clausura],
        "anual":        [r.model_dump() for r in anual_rows],
    }


# ── Goleadores ────────────────────────────────────────────────────────────────

@router.get("/scorers", response_model=list[GoalScorerStats])
def get_scorers(db: Session = Depends(get_db)):
    matches_map = _matches_played_subquery(db)
    rows = (
        db.query(
            Player.id.label("player_id"),
            Player.name.label("player_name"),
            Team.name.label("team_name"),
            Player.position,
            func.count(MatchEvent.id).label("goals"),
        )
        .join(MatchEvent, MatchEvent.player_id == Player.id)
        .join(Team, Team.id == Player.team_id)
        .filter(MatchEvent.event_type == EventType.goal)
        .group_by(Player.id, Player.name, Team.name, Player.position)
        .order_by(func.count(MatchEvent.id).desc())
        .all()
    )
    return [
        GoalScorerStats(
            player_id=r.player_id, player_name=r.player_name,
            team_name=r.team_name, position=r.position,
            matches_played=matches_map.get(r.player_id, 0), goals=r.goals,
        ) for r in rows
    ]


# ── Asistidores ───────────────────────────────────────────────────────────────

@router.get("/assists", response_model=list[AssistStats])
def get_assists(db: Session = Depends(get_db)):
    matches_map = _matches_played_subquery(db)
    rows = (
        db.query(
            Player.id.label("player_id"),
            Player.name.label("player_name"),
            Team.name.label("team_name"),
            Player.position,
            func.count(MatchEvent.id).label("assists"),
        )
        .join(MatchEvent, MatchEvent.player_id == Player.id)
        .join(Team, Team.id == Player.team_id)
        .filter(MatchEvent.event_type == EventType.assist)
        .group_by(Player.id, Player.name, Team.name, Player.position)
        .order_by(func.count(MatchEvent.id).desc())
        .all()
    )
    return [
        AssistStats(
            player_id=r.player_id, player_name=r.player_name,
            team_name=r.team_name, position=r.position,
            matches_played=matches_map.get(r.player_id, 0), assists=r.assists,
        ) for r in rows
    ]


# ── Expulsiones ───────────────────────────────────────────────────────────────

@router.get("/expulsions", response_model=list[ExpulsionStats])
def get_expulsions(db: Session = Depends(get_db)):
    matches_map = _matches_played_subquery(db)
    yellow_rows = (
        db.query(Player.id.label("player_id"), func.count(MatchEvent.id).label("cnt"))
        .join(MatchEvent, MatchEvent.player_id == Player.id)
        .filter(MatchEvent.event_type == EventType.yellow_card)
        .group_by(Player.id).all()
    )
    yellow_map = {r.player_id: r.cnt for r in yellow_rows}
    red_rows = (
        db.query(Player.id.label("player_id"), func.count(MatchEvent.id).label("cnt"))
        .join(MatchEvent, MatchEvent.player_id == Player.id)
        .filter(MatchEvent.event_type == EventType.red_card)
        .group_by(Player.id).all()
    )
    red_map = {r.player_id: r.cnt for r in red_rows}
    all_player_ids = set(yellow_map.keys()) | set(red_map.keys())
    if not all_player_ids:
        return []
    players = (
        db.query(Player, Team.name.label("team_name"))
        .join(Team, Team.id == Player.team_id)
        .filter(Player.id.in_(all_player_ids)).all()
    )
    result = [
        ExpulsionStats(
            player_id=p.Player.id, player_name=p.Player.name,
            team_name=p.team_name, position=p.Player.position,
            matches_played=matches_map.get(p.Player.id, 0),
            yellow_cards=yellow_map.get(p.Player.id, 0),
            red_cards=red_map.get(p.Player.id, 0),
        ) for p in players
    ]
    result.sort(key=lambda x: (x.red_cards, x.yellow_cards), reverse=True)
    return result


# ── Minutos jugados ───────────────────────────────────────────────────────────

@router.get("/minutes", response_model=list[MinutesPlayedStats])
def get_minutes_played(db: Session = Depends(get_db)):
    matches_map = _matches_played_subquery(db)
    starters = (
        db.query(MatchPlayer.player_id, MatchPlayer.match_id)
        .filter(MatchPlayer.role == PlayerRole.starter).all()
    )
    subs_out = (
        db.query(MatchEvent.player_id, MatchEvent.match_id, MatchEvent.minute)
        .filter(MatchEvent.event_type == EventType.substitution_out).all()
    )
    subs_out_map = {(r.player_id, r.match_id): r.minute for r in subs_out}
    subs_in = (
        db.query(MatchEvent.player_id, MatchEvent.match_id, MatchEvent.minute)
        .filter(MatchEvent.event_type == EventType.substitution_in).all()
    )
    subs_in_map = {(r.player_id, r.match_id): r.minute for r in subs_in}
    minutes_map: dict[int, int] = {}
    for s in starters:
        key = (s.player_id, s.match_id)
        minute_out = subs_out_map.get(key)
        mins = minute_out if minute_out is not None else 90
        minutes_map[s.player_id] = minutes_map.get(s.player_id, 0) + mins
    for key, minute_in in subs_in_map.items():
        player_id = key[0]
        mins = 90 - minute_in
        minutes_map[player_id] = minutes_map.get(player_id, 0) + mins
    if not minutes_map:
        return []
    players = (
        db.query(Player, Team.name.label("team_name"))
        .join(Team, Team.id == Player.team_id)
        .filter(Player.id.in_(minutes_map.keys())).all()
    )
    result = [
        MinutesPlayedStats(
            player_id=p.Player.id, player_name=p.Player.name,
            team_name=p.team_name, position=p.Player.position,
            matches_played=matches_map.get(p.Player.id, 0),
            minutes_played=minutes_map.get(p.Player.id, 0),
        ) for p in players
    ]
    result.sort(key=lambda x: x.minutes_played, reverse=True)
    return result


# ── Endpoints REST de tablas ──────────────────────────────────────────────────

@router.get("/standings", response_model=list[StandingsStats])
def get_standings(db: Session = Depends(get_db)):
    return _compute_standings(db)

@router.get("/standings/apertura", response_model=list[StandingsStats])
def get_standings_apertura(db: Session = Depends(get_db)):
    return _compute_standings_by_fase(db, "Apertura")

@router.get("/standings/clausura", response_model=list[StandingsStats])
def get_standings_clausura(db: Session = Depends(get_db)):
    return _compute_standings_by_fase(db, "Clausura")

@router.get("/standings/intermedio/{grupo}", response_model=list[StandingsStats])
def get_standings_intermedio(grupo: str, db: Session = Depends(get_db)):
    from fastapi import HTTPException
    if grupo.upper() not in ("A", "B"):
        raise HTTPException(status_code=400, detail="Grupo debe ser 'A' o 'B'")
    apertura_standings = _compute_standings_by_fase(db, "Apertura")
    grupo_ids = {
        r.team_id for r in apertura_standings
        if (grupo.upper() == "A") == (r.position % 2 != 0)
    }
    if not grupo_ids:
        return []
    matches = db.query(Match).filter(
        Match.fase == "Intermedio",
        Match.home_team_id.in_(grupo_ids),
        Match.away_team_id.in_(grupo_ids),
    ).all()
    return _build_table(matches, db)

@router.get("/standings/anual", response_model=list[StandingsStats])
def get_standings_anual(db: Session = Depends(get_db)):
    all_data = _compute_all_standings(db)
    rows = []
    seen = {}
    for key in ["apertura", "intermedio_a", "intermedio_b", "clausura"]:
        for r in all_data[key]:
            if r["team_id"] not in seen:
                seen[r["team_id"]] = {**r, "played": 0, "won": 0, "drawn": 0,
                                       "lost": 0, "goals_for": 0, "goals_against": 0, "points": 0}
            seen[r["team_id"]]["played"]       += r["played"]
            seen[r["team_id"]]["won"]          += r["won"]
            seen[r["team_id"]]["drawn"]        += r["drawn"]
            seen[r["team_id"]]["lost"]         += r["lost"]
            seen[r["team_id"]]["goals_for"]    += r["goals_for"]
            seen[r["team_id"]]["goals_against"]+= r["goals_against"]
            seen[r["team_id"]]["points"]       += r["points"]
    return all_data["anual"]


# ── WebSocket: todas las tablas en tiempo real ────────────────────────────────

@router.websocket("/standings/live")
async def standings_live(websocket: WebSocket, db: Session = Depends(get_db)):
    """
    Emite un objeto con todas las tablas cada POLL_INTERVAL segundos:
    {
      apertura, intermedio_a, intermedio_b, clausura, anual
    }

    Para broadcast inmediato al registrar un gol:
        from app.routers.stats import standings_manager, _compute_all_standings
        await standings_manager.broadcast(_compute_all_standings(db))
    """
    POLL_INTERVAL = 15

    await standings_manager.connect(websocket)
    try:
        await websocket.send_text(json.dumps(_compute_all_standings(db)))
        while True:
            try:
                await asyncio.wait_for(websocket.receive_text(), timeout=POLL_INTERVAL)
            except asyncio.TimeoutError:
                pass
            except WebSocketDisconnect:
                break
            await websocket.send_text(json.dumps(_compute_all_standings(db)))
    finally:
        standings_manager.disconnect(websocket)