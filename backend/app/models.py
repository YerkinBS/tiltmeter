from sqlalchemy import Column, String, Integer, Text, DateTime, BigInteger, Float
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


class Match(Base):
    __tablename__ = "matches"

    match_id = Column(String, primary_key=True)
    player_id = Column(String, index=True, nullable=False)

    game_id = Column(String, nullable=True)
    region = Column(String, nullable=True)
    competition_name = Column(String, nullable=True)
    game_mode = Column(String, nullable=True)
    status = Column(String, nullable=True)

    started_at = Column(BigInteger, nullable=True)
    finished_at = Column(BigInteger, nullable=True)

    team_faction = Column(String, nullable=True)
    result = Column(String, nullable=True)  # WIN / LOSS
    team_score = Column(Integer, nullable=True)
    enemy_score = Column(Integer, nullable=True)

    map_name = Column(String, nullable=True)

    kills = Column(Integer, nullable=True)
    deaths = Column(Integer, nullable=True)
    assists = Column(Integer, nullable=True)
    kd = Column(Float, nullable=True)
    elo = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class PlayerSummary(Base):
    __tablename__ = "player_summaries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String, index=True, nullable=False)

    window_size = Column(Integer, nullable=False)
    matches_analyzed = Column(Integer, nullable=False)

    winrate = Column(Float, nullable=True)
    avg_kd = Column(Float, nullable=True)
    avg_kills = Column(Float, nullable=True)
    avg_deaths = Column(Float, nullable=True)
    avg_assists = Column(Float, nullable=True)

    current_streak = Column(Integer, nullable=True)

    best_map = Column(String, nullable=True)
    worst_map = Column(String, nullable=True)

    form_score = Column(Float, nullable=True)
    form_label = Column(String, nullable=True)
    tilt_level = Column(String, nullable=True)

    last_results = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class PlayerIngestionState(Base):
    __tablename__ = "player_ingestion_state"

    player_id = Column(String, primary_key=True)

    last_history_from_ts = Column(BigInteger)
    last_refresh_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)