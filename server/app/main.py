from contextlib import asynccontextmanager
from datetime import datetime

from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

from .utils import db
from .routers import detect, log


@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect_db()
    yield
    await db.close_db()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter()


@router.get("/")
def root():
    return "Welcome to License Plate Detection Server"


@router.get("/health")
def health():
    return {"status": "OK", "timestamp": datetime.now()}


app.include_router(router)
app.include_router(detect.router)
app.include_router(log.router)
