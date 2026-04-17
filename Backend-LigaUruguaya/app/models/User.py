from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at      = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    favorite_players = relationship("UserFavoritePlayer", back_populates="user", cascade="all, delete-orphan")
    favorite_teams   = relationship("UserFavoriteTeam",   back_populates="user", cascade="all, delete-orphan")


class UserFavoritePlayer(Base):
    __tablename__ = "user_favorite_players"

    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, ForeignKey("users.id"),   nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)

    user   = relationship("User",   back_populates="favorite_players")
    player = relationship("Player", foreign_keys=[player_id])


class UserFavoriteTeam(Base):
    __tablename__ = "user_favorite_teams"

    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"),  nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"),  nullable=False)

    user = relationship("User", back_populates="favorite_teams")
    team = relationship("Team", foreign_keys=[team_id])