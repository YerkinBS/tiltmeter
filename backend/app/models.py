from sqlalchemy import Column, String, Integer, Text, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class Player(Base):
    __tablename__ = "players"

    faceit_player_id = Column(String(100), primary_key=True, index=True)
    nickname = Column(String(100), nullable=False, index=True)
    country = Column(String(10), nullable=True)
    game = Column(String(50), nullable=True)
    region = Column(String(20), nullable=True)
    skill_level = Column(Integer, nullable=True)
    faceit_elo = Column(Integer, nullable=True)
    game_player_id = Column(String(100), nullable=True)
    game_player_name = Column(String(100), nullable=True)
    faceit_url = Column(Text, nullable=True)
    avatar = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)