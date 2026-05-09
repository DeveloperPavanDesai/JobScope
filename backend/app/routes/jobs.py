from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.connection import get_db
from app.models.job import Job as JobModel
from app.schemas.job_schema import JobSchema

router = APIRouter()


@router.post("/")
def create_job(job: JobSchema, db: Session = Depends(get_db)):
    existing_job = (
        db.query(JobModel).filter(JobModel.job_url == str(job.job_url)).first()
    )
    if existing_job:
        raise HTTPException(status_code=400, detail="Job already exists")

    payload = job.model_dump(mode="json", exclude_none=True)
    new_job = JobModel(**payload)

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