from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.deps import get_db
from app.models.User import User, UserFavoritePlayer, UserFavoriteTeam
from app.models.Player import Player
from app.models.Team import Team
from app.routers.auth import get_current_user
from app.schemas.player import PlayerResponse
from app.schemas.team import TeamResponse

router = APIRouter(
    prefix="/users/me",
    tags=["Favoritos"]
)


# ── Jugadores favoritos ───────────────────────────────────────────────────────

@router.get("/players", response_model=list[PlayerResponse])
def get_favorite_players(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devuelve los jugadores favoritos del usuario autenticado."""
    favorites = (
        db.query(Player)
        .join(UserFavoritePlayer, UserFavoritePlayer.player_id == Player.id)
        .filter(UserFavoritePlayer.user_id == current_user.id)
        .all()
    )
    return favorites


@router.post("/players/{player_id}", status_code=status.HTTP_201_CREATED)
def add_favorite_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Agrega un jugador a favoritos."""
    if not db.query(Player).filter(Player.id == player_id).first():
        raise HTTPException(status_code=404, detail="Jugador no encontrado")

    already = db.query(UserFavoritePlayer).filter(
        UserFavoritePlayer.user_id   == current_user.id,
        UserFavoritePlayer.player_id == player_id,
    ).first()
    if already:
        raise HTTPException(status_code=409, detail="El jugador ya está en favoritos")

    db.add(UserFavoritePlayer(user_id=current_user.id, player_id=player_id))
    db.commit()
    return {"detail": "Jugador agregado a favoritos"}


@router.delete("/players/{player_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite_player(
    player_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina un jugador de favoritos."""
    favorite = db.query(UserFavoritePlayer).filter(
        UserFavoritePlayer.user_id   == current_user.id,
        UserFavoritePlayer.player_id == player_id,
    ).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="El jugador no está en favoritos")

    db.delete(favorite)
    db.commit()


# ── Equipos favoritos ─────────────────────────────────────────────────────────

@router.get("/teams", response_model=list[TeamResponse])
def get_favorite_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Devuelve los equipos favoritos del usuario autenticado."""
    favorites = (
        db.query(Team)
        .join(UserFavoriteTeam, UserFavoriteTeam.team_id == Team.id)
        .filter(UserFavoriteTeam.user_id == current_user.id)
        .all()
    )
    return favorites


@router.post("/teams/{team_id}", status_code=status.HTTP_201_CREATED)
def add_favorite_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Agrega un equipo a favoritos."""
    if not db.query(Team).filter(Team.id == team_id).first():
        raise HTTPException(status_code=404, detail="Equipo no encontrado")

    already = db.query(UserFavoriteTeam).filter(
        UserFavoriteTeam.user_id == current_user.id,
        UserFavoriteTeam.team_id == team_id,
    ).first()
    if already:
        raise HTTPException(status_code=409, detail="El equipo ya está en favoritos")

    db.add(UserFavoriteTeam(user_id=current_user.id, team_id=team_id))
    db.commit()
    return {"detail": "Equipo agregado a favoritos"}


@router.delete("/teams/{team_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Elimina un equipo de favoritos."""
    favorite = db.query(UserFavoriteTeam).filter(
        UserFavoriteTeam.user_id == current_user.id,
        UserFavoriteTeam.team_id == team_id,
    ).first()
    if not favorite:
        raise HTTPException(status_code=404, detail="El equipo no está en favoritos")

    db.delete(favorite)
    db.commit()