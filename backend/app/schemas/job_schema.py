from pydantic import BaseModel, HttpUrl, Field
from typing import Optional, Any, Dict
from uuid import UUID
from datetime import datetime

class JobSchema(BaseModel):
    # Optional because the DB generates this if not provided
    id: Optional[UUID] = None 
    
    # Matches your DB foreign key
    platform_id: Optional[int] = None
    
    title: Optional[str] = None
    company: Optional[str] = None
    location: Optional[str] = None
    experience: Optional[str] = None
    description: Optional[str] = None
    
    job_url: Optional[HttpUrl] = None 
    
    # Matches the JSONB column for the nested data
    raw_data: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True