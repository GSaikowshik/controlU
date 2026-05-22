from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, Field
from uuid import UUID
from datetime import datetime, timezone
import random

from app.database import get_db
from app.models import User, UrgeCategory, InterventionLog
from app.security import get_current_user

router = APIRouter(
    prefix="/api/dashboard",
    tags=["Dashboard & Urges"]
)

# Input schemas for dashboard endpoints
class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Name of the urge category (e.g. Social Media)")

class InterventionCreate(BaseModel):
    category_id: UUID = Field(..., description="ID of the urge category being managed")
    duration_seconds: int = Field(..., ge=0, description="Duration of the intervention in seconds")
    completed_full_session: bool = Field(..., description="Whether the user successfully completed the entire session")

# Response schemas
class CategoryResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    class Config:
        from_attributes = True

class InterventionResponse(BaseModel):
    id: UUID
    user_id: UUID
    category_id: UUID
    started_at: datetime
    completed_full_session: bool
    duration_seconds: int
    class Config:
        from_attributes = True

def get_generation_roast_and_advice(tier: str) -> dict:
    """
    Returns highly curated, funny and motivational advice/roasts suited to each generation.
    """
    roasts = {
        "gen_z": [
            {"roast": "Your attention span is shorter than a TikTok transition.", "advice": "No cap, lock in and stay focused. Your future self is begging you not to flop."},
            {"roast": "Caught you scrolling through vertical video slop again.", "advice": "Put down the screen, touch some organic grass, and raise your vibe status."},
            {"roast": "High key losing aura points by giving in to the urge.", "advice": "Remember, letting the urge win is major NPC behavior. Be the main character."}
        ],
        "gen_alpha": [
            {"roast": "Bro thinks they have infinite rizz but can't focus for 5 minutes.", "advice": "Stay focused! Don't let the urges turn you into a certified Skibidi Ohio citizen."},
            {"roast": "Gym class hero, but your attention is cooked.", "advice": "Fanum tax the distraction before it fanum taxes your whole day. Lock in."}
        ],
        "millennial": [
            {"roast": "Closing that tab doesn't cost extra, unlike your avocado toast.", "advice": "Take a deep breath. Close the 35 open browser tabs. You don't need another mug or another spreadsheet right now."},
            {"roast": "You're checking notifications like you're still on MySpace in 2006.", "advice": "Sit up straight. Your lower back will thank you. Now log off social media and do a 5-minute stretch."}
        ],
        "boomer_genx": [
            {"roast": "Searching for where the double space goes after a period.", "advice": "It's okay to take a break from the political posts. Drink some water and relax your shoulders."}
        ]
    }
    
    tier_options = roasts.get(tier, roasts["gen_z"])
    return random.choice(tier_options)

@router.get("/stats")
async def get_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Fetches comprehensive dashboard statistics for the user.
    """
    # 1. Fetch count of categories
    cat_stmt = select(UrgeCategory).where(UrgeCategory.user_id == user.id)
    cat_res = await db.execute(cat_stmt)
    categories = cat_res.scalars().all()
    
    # 2. Fetch recent intervention logs
    log_stmt = select(InterventionLog).where(InterventionLog.user_id == user.id).order_by(InterventionLog.started_at.desc()).limit(10)
    log_res = await db.execute(log_stmt)
    recent_logs = log_res.scalars().all()

    # 3. Dynamic Roasts/Advice
    roast_advice = get_generation_roast_and_advice(user.generation_tier)

    return {
        "user_info": {
            "email": user.email,
            "generation_tier": user.generation_tier,
            "aura_points": user.aura_points,
            "created_at": user.created_at
        },
        "statistics": {
            "total_categories": len(categories),
            "total_interventions": len(recent_logs),
            "successful_interventions": sum(1 for log in recent_logs if log.completed_full_session)
        },
        "roast": roast_advice["roast"],
        "advice": roast_advice["advice"],
        "recent_logs": [
            {
                "id": log.id,
                "category_name": next((c.name for c in categories if c.id == log.category_id), "Unknown"),
                "started_at": log.started_at,
                "completed_full_session": log.completed_full_session,
                "duration_seconds": log.duration_seconds
            } for log in recent_logs
        ]
    }

@router.get("/categories", response_model=list[CategoryResponse])
async def get_categories(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Retrieves all urge categories created by the current user.
    """
    stmt = select(UrgeCategory).where(UrgeCategory.user_id == user.id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/categories", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(category_in: CategoryCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Creates a new urge category for the user if it doesn't already exist.
    """
    # Check for duplicate names
    stmt = select(UrgeCategory).where(
        (UrgeCategory.user_id == user.id) & 
        (UrgeCategory.name == category_in.name)
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Category '{category_in.name}' already exists."
        )

    new_cat = UrgeCategory(
        user_id=user.id,
        name=category_in.name
    )
    db.add(new_cat)
    await db.commit()
    await db.refresh(new_cat)
    return new_cat

@router.post("/interventions", response_model=InterventionResponse, status_code=status.HTTP_201_CREATED)
async def create_intervention(log_in: InterventionCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Logs an urge intervention session. Completing a full session grants Aura points!
    """
    # Verify category belongs to user
    stmt = select(UrgeCategory).where(
        (UrgeCategory.id == log_in.category_id) & 
        (UrgeCategory.user_id == user.id)
    )
    result = await db.execute(stmt)
    category = result.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Urge category not found or unauthorized access."
        )

    # Calculate Aura Points to reward
    aura_reward = 0
    if log_in.completed_full_session:
        # Base reward + multiplier for duration (e.g. +1 point per 30 seconds)
        aura_reward = 20 + int(log_in.duration_seconds / 30)
        # Cap reward to prevent hacking
        aura_reward = min(aura_reward, 100)
        user.aura_points += aura_reward
    else:
        # Penalize slightly for failing to lock in
        user.aura_points = max(0, user.aura_points - 10)

    new_log = InterventionLog(
        user_id=user.id,
        category_id=log_in.category_id,
        completed_full_session=log_in.completed_full_session,
        duration_seconds=log_in.duration_seconds
    )
    
    db.add(new_log)
    # We also updated user aura points, so SQLAlchemy will save both
    await db.commit()
    await db.refresh(new_log)
    return new_log
