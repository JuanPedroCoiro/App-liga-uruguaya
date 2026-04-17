from sqlalchemy import Column, Integer, String, ForeignKey, Date
from sqlalchemy.orm import relationship
from app.database.database import Base


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    position = Column(String)
    dorsal = Column(Integer, nullable=True)
    preferred_foot = Column(String, nullable=True)
    height = Column(Integer, nullable=True)
    weight = Column(Integer, nullable=True)
    birth_date = Column(Date, nullable=True)
    country = Column(String, nullable=True)

    team_id = Column(Integer, ForeignKey("teams.id"))
    team = relationship("Team", back_populates="players")
