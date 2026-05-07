import uuid
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.db.connection import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # platform_id links to your platforms table
    platform_id = Column(Integer, ForeignKey("platforms.id", ondelete="CASCADE"), index=True)
    
    title = Column(Text, nullable=True)
    company = Column(Text, nullable=True, index=True)
    location = Column(Text, nullable=True)
    experience = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    
    # Matching your schema 'job_url' which is unique
    job_url = Column(Text, unique=True, nullable=True)
    
    # raw_data uses the PostgreSQL specific JSONB type for performance
    raw_data = Column(JSONB, nullable=True)


    def __repr__(self):
        return f"<Job(title='{self.title}', company='{self.company}')>"