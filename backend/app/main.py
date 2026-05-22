from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, dashboard, interventions, calendar

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan events. Runs database table creations automatically 
    on startup to ensure the system is ready immediately.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown logic goes here if needed

app = FastAPI(
    title=settings.APP_NAME,
    debug=settings.DEBUG,
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False
)

# CORS Middleware setup - crucial for smooth React frontend integration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

if settings.CORS_ORIGINS:
    extra_origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",") if origin.strip()]
    origins.extend(extra_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(interventions.router)
app.include_router(calendar.router)


@app.get("/")
async def root():
    return {
        "status": "online",
        "app": settings.APP_NAME,
        "message": "Welcome to controlU. Lock in your urges, stack your aura points.",
        "documentation": "/docs"
    }
