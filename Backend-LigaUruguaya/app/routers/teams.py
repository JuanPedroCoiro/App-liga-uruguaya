from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.deps import get_db
from app.models.Team import Team
from app.models.Player import Player
from app.schemas.team import TeamCreate, TeamUpdate, TeamResponse
from app.schemas.player import PlayerResponse

router = APIRouter(
    prefix="/teams",
    tags=["Teams"]
)


# ── Helper ────────────────────────────────────────────────────────────────────

def get_team_or_404(team_id: int, db: Session) -> Team:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/", response_model=TeamResponse)
def create_team(team: TeamCreate, db: Session = Depends(get_db)):
    db_team = Team(
        name=team.name,
        city=team.city,
        stadium=team.stadium,
    )
    db.add(db_team)
    db.commit()
    db.refresh(db_team)
    return db_team


@router.get("/", response_model=list[TeamResponse])
def get_teams(db: Session = Depends(get_db)):
    return db.query(Team).all()


@router.get("/{team_id}", response_model=TeamResponse)
def get_team(team_id: int, db: Session = Depends(get_db)):
    return get_team_or_404(team_id, db)


@router.patch("/{team_id}", response_model=TeamResponse)
def update_team(team_id: int, data: TeamUpdate, db: Session = Depends(get_db)):
    db_team = get_team_or_404(team_id, db)

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(db_team, field, value)

    db.commit()
    db.refresh(db_team)
    return db_team


@router.delete("/{team_id}", status_code=204)
def delete_team(team_id: int, db: Session = Depends(get_db)):
    db_team = get_team_or_404(team_id, db)
    db.delete(db_team)
    db.commit()


@router.get("/{team_id}/players", response_model=list[PlayerResponse])
def get_players_by_team(team_id: int, db: Session = Depends(get_db)):
    get_team_or_404(team_id, db)
    return db.query(Player).filter(Player.team_id == team_id).all()