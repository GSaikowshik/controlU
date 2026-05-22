from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.database import get_db
from app.models import User, UrgeCategory, InterventionLog
from app.schemas import InterventionLogStart, InterventionLogUpdate, InterventionLogResponse
from app.security import get_current_user

router = APIRouter(
    prefix="/api/interventions",
    tags=["Interventions Core"]
)

def apply_aura_engine_rules(user: User, completed_full_session: bool) -> int:
    """
    The Aura Engine Utility.
    Adjusts user's aura_points based on the focus outcome:
    - If completed_full_session is True, awards +50 aura points.
    - If completed_full_session is False (manual streak reset), penalizes -500 aura points.
    Ensures aura points never drop below 0.
    Returns the points adjusted (positive or negative).
    """
    if completed_full_session:
        points_change = 50
        user.aura_points += points_change
    else:
        points_change = -500
        # Clamp aura points to 0 minimum to avoid negative numbers
        user.aura_points = max(0, user.aura_points + points_change)
        
    return points_change

@router.post("/log", response_model=InterventionLogResponse, status_code=status.HTTP_201_CREATED)
async def create_panic_log(
    log_in: InterventionLogStart,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates an initial intervention log representing the 'Panic Button' being pressed.
    Automatically sets starting duration to 0 and completed_full_session to False.
    Requires a valid JWT token.
    """
    # 1. Security Check: Verify category exists and belongs to the current user
    cat_stmt = select(UrgeCategory).where(
        (UrgeCategory.id == log_in.category_id) & 
        (UrgeCategory.user_id == user.id)
    )
    cat_res = await db.execute(cat_stmt)
    category = cat_res.scalar_one_or_none()
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Urge category not found or unauthorized access."
        )

    # 2. Instantiate and persist initial log
    new_log = InterventionLog(
        user_id=user.id,
        category_id=log_in.category_id,
        completed_full_session=False,
        duration_seconds=0
    )
    
    db.add(new_log)
    await db.commit()
    await db.refresh(new_log)
    
    return new_log

@router.put("/log/{id}", response_model=InterventionLogResponse)
async def update_intervention_log(
    id: UUID,
    log_update: InterventionLogUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the final duration and success status of an existing intervention session log.
    Triggers the Aura Engine utility rules automatically based on focus success.
    Requires a valid JWT token.
    """
    # 1. Fetch the log and verify permissions
    log_stmt = select(InterventionLog).where(
        (InterventionLog.id == id) & 
        (InterventionLog.user_id == user.id)
    )
    log_res = await db.execute(log_stmt)
    log = log_res.scalar_one_or_none()
    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Intervention log not found or unauthorized access."
        )

    # 2. Update log duration and outcome status
    log.duration_seconds = log_update.duration_seconds
    log.completed_full_session = log_update.completed_full_session

    # 3. Trigger Aura Engine Rules to recalculate user's Aura points
    apply_aura_engine_rules(user, log_update.completed_full_session)

    # Save changes (SQLAlchemy automatically dirty-checks and saves both user and log)
    await db.commit()
    await db.refresh(log)
    
    return log
