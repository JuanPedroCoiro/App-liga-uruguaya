from pydantic import BaseModel
from typing import Optional
from datetime import date


class PlayerBase(BaseModel):
    name: str
    position: str


class PlayerCreate(PlayerBase):
    team_id: int
    dorsal: Optional[int] = None
    preferred_foot: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    birth_date: Optional[date] = None
    country: Optional[str] = None

class PlayerUpdate(BaseModel):
    name: Optional[str] = None
    position: Optional[str] = None
    team_id: Optional[int] = None
    dorsal: Optional[int] = None
    referred_foot: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    birth_date: Optional[date] = None
    country: Optional[str] = None


class PlayerResponse(PlayerBase):
    id: int
    team_id: Optional[int]
    dorsal: Optional[int] = None
    preferred_foot: Optional[str] = None
    height: Optional[int] = None
    weight: Optional[int] = None
    birth_date: Optional[date] = None
    country: Optional[str] = None

    class Config:
        from_attributes = True