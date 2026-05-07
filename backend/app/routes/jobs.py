from fastapi import FastAPI, Depends, HTTPException
from app.schemas.job_schema import JobSchema
from app.models.job import Job as JobModel
from app.db.connection import get_db
from fastapi import APIRouter
from sqlalchemy.orm import Session
from typing import List

router = APIRouter()

@router.post('/')
def create_job(job: JobSchema, db: Session = Depends(get_db)):
    
    existing_job = db.query(job).filter(JobModel.job_url == str(job.job_url)).first()
    if existing_job:
        raise HTTPException(status_code=400, detail="Job already exist")
    
    new_job = JobModel(
        **job.model_dump(exclude_none=True)
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return {
        "status": "success",
        "message": "Job stored successfully",
        "job_id": new_job.id
    }

@router.get("/")
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(JobModel).all()
    return jobs