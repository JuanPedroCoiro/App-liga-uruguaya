from pydantic import BaseModel, ConfigDict


class GoalScorerStats(BaseModel):
    player_id: int
    player_name: str
    team_name: str
    position: str
    matches_played: int
    goals: int

    class Config:
        from_attributes = True


class AssistStats(BaseModel):
    player_id: int
    player_name: str
    team_name: str
    position: str
    matches_played: int
    assists: int

    class Config:
        from_attributes = True


class ExpulsionStats(BaseModel):
    player_id: int
    player_name: str
    team_name: str
    position: str
    matches_played: int
    yellow_cards: int
    red_cards: int

    class Config:
        from_attributes = True


class MinutesPlayedStats(BaseModel):
    player_id: int
    player_name: str
    team_name: str
    position: str
    matches_played: int
    minutes_played: int

    class Config:
        from_attributes = True


class StandingsStats(BaseModel):
    position: int
    team_id: int
    team_name: str
    played: int       # PJ
    won: int          # PG
    drawn: int        # PE
    lost: int         # PP
    goals_for: int    # GF
    goals_against: int # GC
    goal_difference: int # DG
    points: int       # Pts

    model_config = ConfigDict(from_attributes=True)