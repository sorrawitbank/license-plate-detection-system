from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import APIRouter, FastAPI

from .utils import db
from .routers import detect


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect_db()
    yield
    await db.close_db()


app = FastAPI(lifespan=lifespan)
router = APIRouter()


@router.get("/")
def root():
    return "Welcome to License Plate Detection Server"


@router.get("/health")
def health():
    return {"status": "OK", "timestamp": datetime.now()}


app.include_router(router)
app.include_router(detect.router)
