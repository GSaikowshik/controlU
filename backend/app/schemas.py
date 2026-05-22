from pydantic import BaseModel, EmailStr, Field
from uuid import UUID
from datetime import datetime

class UserRegister(BaseModel):
    email: EmailStr = Field(..., description="User's email address")
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")
    birth_year: int = Field(..., ge=1900, le=2026, description="Birth year to calculate generation tier")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: UUID
    email: EmailStr
    generation_tier: str
    aura_points: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: EmailStr | None = None
    user_id: UUID | None = None

class InterventionLogStart(BaseModel):
    category_id: UUID = Field(..., description="ID of the category that triggered the panic button")

class InterventionLogUpdate(BaseModel):
    duration_seconds: int = Field(..., ge=0, description="Duration in seconds of focus session completed")
    completed_full_session: bool = Field(..., description="True if focus succeeded, False if aborted/reset")

class InterventionLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    category_id: UUID
    started_at: datetime
    completed_full_session: bool
    duration_seconds: int

    class Config:
        from_attributes = True

