from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware

from app.db.connection import engine, Base
from app.models.platform import Platform  # noqa: F401
from app.models.job import Job  # noqa: F401
from app.routes.jobs import router as job_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Job Assistant API",
    description="Backend for storing and managing scraped job listings",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; narrow this down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(job_router, prefix="/jobs", tags=["Jobs"])

@app.get("/")
def health_check():
    return {"status": "online", "database": "connected"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)