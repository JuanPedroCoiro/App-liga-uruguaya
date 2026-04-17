from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# ── Match ─────────────────────────────────────────────────────────────────────

class MatchPlayerCreate(BaseModel):
    player_id: int
    team_id: int
    role: str


class MatchPlayerResponse(BaseModel):
    id: int
    match_id: int
    player_id: int
    team_id: int
    role: str

    model_config = {"from_attributes": True}


class MatchEventCreate(BaseModel):
    minute: int
    event_type: str
    player_id: int
    related_player_id: Optional[int] = None
    team_id: int


class MatchEventResponse(BaseModel):
    id: int
    match_id: int
    minute: int
    event_type: str
    player_id: int
    player_name: str = ""
    related_player_id: Optional[int] = None
    related_player_name: Optional[str] = None
    team_id: int

    model_config = {"from_attributes": True}


class MatchCreate(BaseModel):
    home_team_id: int
    away_team_id: int
    stadium: str
    referee: str
    date: datetime
    home_score: int = 0
    away_score: int = 0
    video_url: Optional[str] = None
    jornada: Optional[int] = None
    fase: Optional[str] = None
    players: List[MatchPlayerCreate] = []


class MatchUpdate(BaseModel):
    stadium: Optional[str] = None
    referee: Optional[str] = None
    date: Optional[datetime] = None
    home_score: Optional[int] = None
    away_score: Optional[int] = None
    video_url: Optional[str] = None
    jornada: Optional[int] = None
    fase: Optional[str] = None


class MatchResponse(BaseModel):
    id: int
    home_team_id: int
    away_team_id: int
    home_team_name: str = ""               # ← nuevo
    away_team_name: str = ""               # ← nuevo
    stadium: str
    referee: str
    date: datetime
    home_score: int
    away_score: int
    video_url: Optional[str] = None
    jornada: Optional[int] = None
    fase: Optional[str] = None
    players: List[MatchPlayerResponse] = []
    events: List[MatchEventResponse] = []

    model_config = {"from_attributes": True}