from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.models.Player import Player
from app.models.Team import Team
from app.schemas.player import PlayerCreate, PlayerUpdate, PlayerResponse

router = APIRouter(prefix="/players", tags=["Players"])


# ── Helper ────────────────────────────────────────────────────────────────────


def get_player_or_404(player_id: int, db: Session) -> Player:
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    return player


def validate_team(team_id: int, db: Session) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("/", response_model=PlayerResponse)
def create_player(player: PlayerCreate, db: Session = Depends(get_db)):
    validate_team(player.team_id, db)
    db_player = Player(
        name=player.name,
        position=player.position,
        team_id=player.team_id,
        dorsal=player.dorsal,
        preferred_foot=player.preferred_foot,
        height=player.height,
        weight=player.weight,
        birth_date=player.birth_date,
        country=player.country,
    )
    db.add(db_player)
    db.commit()
    db.refresh(db_player)
    return db_player


@router.get("/", response_model=list[PlayerResponse])
def get_players(db: Session = Depends(get_db)):
    return db.query(Player).all()


@router.get("/position/{position}", response_model=list[PlayerResponse])
def get_players_by_position(position: str, db: Session = Depends(get_db)):
    players = db.query(Player).filter(Player.position.ilike(position)).all()
    if not players:
        raise HTTPException(
            status_code=404, detail=f"No players found with position '{position}'"
        )
    return players


@router.get("/team/{team_id}", response_model=list[PlayerResponse])
def get_players_by_team(team_id: int, db: Session = Depends(get_db)):
    validate_team(team_id, db)
    return db.query(Player).filter(Player.team_id == team_id).all()


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(player_id: int, db: Session = Depends(get_db)):
    return get_player_or_404(player_id, db)


@router.patch("/{player_id}", response_model=PlayerResponse)
def update_player(player_id: int, data: PlayerUpdate, db: Session = Depends(get_db)):
    db_player = get_player_or_404(player_id, db)

    if data.team_id is not None:
        validate_team(data.team_id, db)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(db_player, field, value)

    db.commit()
    db.refresh(db_player)
    return db_player


@router.delete("/{player_id}", status_code=204)
def delete_player(player_id: int, db: Session = Depends(get_db)):
    db_player = get_player_or_404(player_id, db)
    db.delete(db_player)
    db.commit()
