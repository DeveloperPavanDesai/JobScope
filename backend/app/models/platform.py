from sqlalchemy import Column, Integer, String, Text

from app.db.connection import Base


class Platform(Base):
    __tablename__ = "platforms"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=True)
    slug = Column(String(64), nullable=True, unique=True, index=True)
    base_url = Column(Text, nullable=True)
