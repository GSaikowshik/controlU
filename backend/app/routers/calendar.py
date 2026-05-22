from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, time, timezone
import calendar
import re

from app.database import get_db
from app.models import User, InterventionLog
from app.security import get_current_user

router = APIRouter(
    prefix="/api/calendar",
    tags=["Calendar Aggregations"]
)

@router.get("/summary")
async def get_calendar_summary(
    month: str = Query(..., description="Target month in YYYY-MM format"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Returns a daily array summarizing the focus habits of the user for the target month.
    Each day of the month is classified as:
    - 'clean': No intervention logs exist for the day (represented a calm, neutral day).
    - 'surfed': Intervention logs exist, and all focus sessions were successfully completed.
    - 'reset': Intervention logs exist, but the user aborted a session (manually resetting streak).
    Requires a valid JWT token.
    """
    # 1. Validate Month String Format
    if not re.match(r"^\d{4}-\d{2}$", month):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid month format. Please use 'YYYY-MM' format."
        )

    try:
        year_str, month_str = month.split("-")
        year = int(year_str)
        month_val = int(month_str)
        if month_val < 1 or month_val > 12:
            raise ValueError()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid year or month value."
        )

    # 2. Get total days in the month
    _, last_day = calendar.monthrange(year, month_val)

    # 3. Create start/end datetime constraints
    # Keep it timezone aware by referencing UTC for database queries
    start_dt = datetime(year, month_val, 1, 0, 0, 0, tzinfo=timezone.utc)
    end_dt = datetime(year, month_val, last_day, 23, 59, 59, 999999, tzinfo=timezone.utc)

    # 4. Fetch user's logs for the entire month
    stmt = select(InterventionLog).where(
        (InterventionLog.user_id == user.id) & 
        (InterventionLog.started_at >= start_dt) & 
        (InterventionLog.started_at <= end_dt)
    )
    res = await db.execute(stmt)
    logs = res.scalars().all()

    # 5. Group logs by day
    logs_by_day = {}
    for log in logs:
        # Convert timestamp to user's daily reference (extracting day)
        # Note: started_at is stored in UTC. We group by calendar day in UTC.
        day_num = log.started_at.day
        if day_num not in logs_by_day:
            logs_by_day[day_num] = []
        logs_by_day[day_num].append(log)

    # 6. Aggregate each day of the month
    daily_summaries = []
    for day in range(1, last_day + 1):
        date_str = f"{year}-{month_val:02d}-{day:02d}"
        day_logs = logs_by_day.get(day, [])

        if not day_logs:
            day_status = "clean"
        else:
            # Check if any log is a streak reset (aborted/failed focus)
            has_failed_session = any(not log.completed_full_session for log in day_logs)
            if has_failed_session:
                day_status = "reset"
            else:
                day_status = "surfed"

        daily_summaries.append({
            "date": date_str,
            "status": day_status,
            "log_count": len(day_logs)
        })

    return {
        "month": month,
        "days": daily_summaries
    }
