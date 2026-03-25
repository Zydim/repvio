import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from models.database import create_tables
from routers.analysis import router as analysis_router
from routers.auth import router as auth_router
from routers.history import router as history_router
from routers.payment import router as payment_router

load_dotenv(override=True)

app = FastAPI(title="Repvio API", version="1.0.0")

# CORS
cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(history_router)
app.include_router(payment_router)


@app.on_event("startup")
def on_startup():
    create_tables()


@app.get("/")
def health_check():
    return {"status": "ok", "app": "Repvio API"}
