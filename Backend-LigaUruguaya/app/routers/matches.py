from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.models.Match import Match, MatchPlayer, MatchEvent, EventType
from app.models.Team import Team
from app.models.Player import Player
from app.routers.stats import standings_manager, _compute_all_standings
from app.schemas.match import (
    MatchCreate,
    MatchUpdate,
    MatchResponse,
    MatchEventCreate,
    MatchEventResponse,
    MatchPlayerCreate,
    MatchPlayerResponse,
)

router = APIRouter(
    prefix="/matches",
    tags=["Matches"]
)


# ── Helpers ───────────────────────────────────────────────────────────────────

def get_match_or_404(match_id: int, db: Session) -> Match:
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    return match


def validate_team(team_id: int, db: Session) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail=f"Team {team_id} not found")
    return team


def validate_player(player_id: int, db: Session) -> Player:
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail=f"Player {player_id} not found")
    return player


def _event_to_response(event: MatchEvent, players_map: dict[int, str]) -> MatchEventResponse:
    return MatchEventResponse(
        id=event.id,
        match_id=event.match_id,
        minute=event.minute,
        event_type=event.event_type,
        player_id=event.player_id,
        player_name=players_map.get(event.player_id, ""),
        related_player_id=event.related_player_id,
        related_player_name=players_map.get(event.related_player_id) if event.related_player_id else None,
        team_id=event.team_id,
    )


def _to_response(match: Match, db: Session) -> MatchResponse:
    home_team = db.query(Team).filter(Team.id == match.home_team_id).first()
    away_team = db.query(Team).filter(Team.id == match.away_team_id).first()

    player_ids = set()
    for event in match.events:
        player_ids.add(event.player_id)
        if event.related_player_id:
            player_ids.add(event.related_player_id)

    players_map: dict[int, str] = {}
    if player_ids:
        players = db.query(Player).filter(Player.id.in_(player_ids)).all()
        players_map = {p.id: p.name for p in players}

    return MatchResponse(
        id=match.id,
        home_team_id=match.home_team_id,
        away_team_id=match.away_team_id,
        home_team_name=home_team.name if home_team else "",
        away_team_name=away_team.name if away_team else "",
        stadium=match.stadium,
        referee=match.referee,
        date=match.date,
        home_score=match.home_score,
        away_score=match.away_score,
        video_url=match.video_url,
        jornada=match.jornada,
        fase=match.fase,
        players=[MatchPlayerResponse.model_validate(p) for p in match.players],
        events=[_event_to_response(e, players_map) for e in match.events],
    )


# ── Matches ───────────────────────────────────────────────────────────────────

@router.post("/", response_model=MatchResponse)
def create_match(match: MatchCreate, db: Session = Depends(get_db)):
    validate_team(match.home_team_id, db)
    validate_team(match.away_team_id, db)

    db_match = Match(
        home_team_id=match.home_team_id,
        away_team_id=match.away_team_id,
        stadium=match.stadium,
        referee=match.referee,
        date=match.date,
        home_score=match.home_score,
        away_score=match.away_score,
        video_url=match.video_url,
        jornada=match.jornada,
        fase=match.fase,
    )
    db.add(db_match)
    db.flush()

    for p in match.players:
        validate_player(p.player_id, db)
        validate_team(p.team_id, db)
        db.add(MatchPlayer(
            match_id=db_match.id,
            player_id=p.player_id,
            team_id=p.team_id,
            role=p.role,
        ))

    db.commit()
    db.refresh(db_match)
    return _to_response(db_match, db)


@router.get("/", response_model=list[MatchResponse])
def get_matches(
    db: Session = Depends(get_db),
    jornada: Optional[int] = Query(None, description="Filtrar por número de jornada"),
    fase: Optional[str]    = Query(None, description="Filtrar por fase (ej: Apertura, Clausura)"),
):
    query = db.query(Match)
    if jornada is not None:
        query = query.filter(Match.jornada == jornada)
    if fase is not None:
        query = query.filter(Match.fase == fase)
    return [_to_response(m, db) for m in query.all()]


@router.get("/{match_id}", response_model=MatchResponse)
def get_match(match_id: int, db: Session = Depends(get_db)):
    return _to_response(get_match_or_404(match_id, db), db)


@router.patch("/{match_id}", response_model=MatchResponse)
def update_match(match_id: int, data: MatchUpdate, db: Session = Depends(get_db)):
    db_match = get_match_or_404(match_id, db)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(db_match, field, value)
    db.commit()
    db.refresh(db_match)
    return _to_response(db_match, db)


@router.delete("/{match_id}", status_code=204)
def delete_match(match_id: int, db: Session = Depends(get_db)):
    db_match = get_match_or_404(match_id, db)
    db.delete(db_match)
    db.commit()


# ── Players in match ──────────────────────────────────────────────────────────

@router.post("/{match_id}/players", response_model=MatchPlayerResponse)
def add_player_to_match(match_id: int, data: MatchPlayerCreate, db: Session = Depends(get_db)):
    get_match_or_404(match_id, db)
    validate_player(data.player_id, db)
    validate_team(data.team_id, db)

    already = db.query(MatchPlayer).filter(
        MatchPlayer.match_id  == match_id,
        MatchPlayer.player_id == data.player_id,
    ).first()
    if already:
        raise HTTPException(status_code=409, detail="Player already added to this match")

    db_mp = MatchPlayer(
        match_id=match_id,
        player_id=data.player_id,
        team_id=data.team_id,
        role=data.role,
    )
    db.add(db_mp)
    db.commit()
    db.refresh(db_mp)
    return db_mp


@router.delete("/{match_id}/players/{player_id}", status_code=204)
def remove_player_from_match(match_id: int, player_id: int, db: Session = Depends(get_db)):
    get_match_or_404(match_id, db)
    db_mp = db.query(MatchPlayer).filter(
        MatchPlayer.match_id  == match_id,
        MatchPlayer.player_id == player_id,
    ).first()
    if not db_mp:
        raise HTTPException(status_code=404, detail="Player not found in this match")
    db.delete(db_mp)
    db.commit()


# ── Events ────────────────────────────────────────────────────────────────────

@router.post("/{match_id}/events", response_model=MatchEventResponse)
async def add_event(match_id: int, data: MatchEventCreate, db: Session = Depends(get_db)):
    db_match = get_match_or_404(match_id, db)
    validate_player(data.player_id, db)
    validate_team(data.team_id, db)

    if data.related_player_id:
        validate_player(data.related_player_id, db)

    db_event = MatchEvent(
        match_id=match_id,
        minute=data.minute,
        event_type=data.event_type,
        player_id=data.player_id,
        related_player_id=data.related_player_id,
        team_id=data.team_id,
    )
    db.add(db_event)

    # ── Actualizar marcador automáticamente al registrar un gol ──────────────
    if data.event_type == EventType.goal:
        if data.team_id == db_match.home_team_id:
            db_match.home_score = (db_match.home_score or 0) + 1
        else:
            db_match.away_score = (db_match.away_score or 0) + 1

    db.commit()

    # Broadcast de todas las tablas en tiempo real
    await standings_manager.broadcast(_compute_all_standings(db))

    db.refresh(db_event)

    player = db.query(Player).filter(Player.id == db_event.player_id).first()
    related = db.query(Player).filter(Player.id == db_event.related_player_id).first() if db_event.related_player_id else None
    players_map = {}
    if player:   players_map[player.id] = player.name
    if related:  players_map[related.id] = related.name

    return _event_to_response(db_event, players_map)


@router.get("/{match_id}/events", response_model=list[MatchEventResponse])
def get_events(match_id: int, db: Session = Depends(get_db)):
    get_match_or_404(match_id, db)
    events = (
        db.query(MatchEvent)
        .filter(MatchEvent.match_id == match_id)
        .order_by(MatchEvent.minute)
        .all()
    )
    player_ids = set()
    for e in events:
        player_ids.add(e.player_id)
        if e.related_player_id:
            player_ids.add(e.related_player_id)

    players_map: dict[int, str] = {}
    if player_ids:
        players = db.query(Player).filter(Player.id.in_(player_ids)).all()
        players_map = {p.id: p.name for p in players}

    return [_event_to_response(e, players_map) for e in events]


@router.delete("/{match_id}/events/{event_id}", status_code=204)
def delete_event(match_id: int, event_id: int, db: Session = Depends(get_db)):
    get_match_or_404(match_id, db)
    db_event = db.query(MatchEvent).filter(
        MatchEvent.id       == event_id,
        MatchEvent.match_id == match_id,
    ).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")

    # ── Restar del marcador si era un gol ─────────────────────────────────────
    if db_event.event_type == EventType.goal:
        db_match = get_match_or_404(match_id, db)
        if db_event.team_id == db_match.home_team_id:
            db_match.home_score = max(0, (db_match.home_score or 0) - 1)
        else:
            db_match.away_score = max(0, (db_match.away_score or 0) - 1)

    db.delete(db_event)
    db.commit()