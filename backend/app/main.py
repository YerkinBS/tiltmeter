from fastapi import FastAPI
from app.db import check_db_connection

app = FastAPI(title="Tiltmeter API")


@app.get("/")
def root():
    return {"message": "Tiltmeter backend is running"}


@app.get("/health")
def health():
    db_ok = check_db_connection()
    return {
        "status": "ok" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected"
    }
