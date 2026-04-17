from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from app.database.database import Base
import enum


class EventType(str, enum.Enum):
    goal = "goal"
    assist = "assist"
    yellow_card = "yellow_card"
    red_card = "red_card"
    substitution_in = "substitution_in"
    substitution_out = "substitution_out"


class PlayerRole(str, enum.Enum):
    starter = "starter"
    substitute = "substitute"


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    home_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    away_team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    stadium = Column(String, nullable=False)
    referee = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    home_score = Column(Integer, default=0)
    away_score = Column(Integer, default=0)
    video_url= Column(String, nullable=True)
    jornada = Column(Integer, nullable=True)
    fase = Column(String, nullable=True)


    home_team = relationship("Team", foreign_keys=[home_team_id])
    away_team = relationship("Team", foreign_keys=[away_team_id])
    players = relationship("MatchPlayer", back_populates="match", cascade="all, delete-orphan")
    events = relationship("MatchEvent", back_populates="match", order_by="MatchEvent.minute", cascade="all, delete-orphan")

    


class MatchPlayer(Base):
    __tablename__ = "match_players"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)
    role = Column(Enum(PlayerRole), nullable=False)  # starter / substitute

    match = relationship("Match", back_populates="players")
    player = relationship("Player", foreign_keys=[player_id])
    team = relationship("Team", foreign_keys=[team_id])


class MatchEvent(Base):
    __tablename__ = "match_events"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=False)
    minute = Column(Integer, nullable=False)
    event_type = Column(Enum(EventType), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id"), nullable=False)  # jugador principal del evento
    related_player_id = Column(Integer, ForeignKey("players.id"), nullable=True)  # ej: quien asistió, o quien entra en sustitución
    team_id = Column(Integer, ForeignKey("teams.id"), nullable=False)

    match = relationship("Match", back_populates="events")
    player = relationship("Player", foreign_keys=[player_id])
    related_player = relationship("Player", foreign_keys=[related_player_id])
    team = relationship("Team", foreign_keys=[team_id])