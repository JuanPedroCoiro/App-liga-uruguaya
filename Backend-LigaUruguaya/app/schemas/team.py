from pydantic import BaseModel
from typing import List, Optional
from app.schemas.player import PlayerResponse


class TeamBase(BaseModel):
    name: str
    city: str
    stadium: str


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    stadium: Optional[str] = None


class TeamResponse(TeamBase):
    id: int
    players: List[PlayerResponse] = []

    class Config:
        from_attributes = True