from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, UserResponse, Token
from app.security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"]
)

def calculate_generation_tier(birth_year: int) -> str:
    """
    Classifies the user's birth year into their correct generation tier.
    """
    if 1981 <= birth_year <= 1996:
        return "millennial"
    elif 1997 <= birth_year <= 2012:
        return "gen_z"
    elif birth_year >= 2013:
        return "gen_alpha"
    else:
        # Fallback tier for older generations to ensure graceful compatibility
        return "boomer_genx"

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister, db: AsyncSession = Depends(get_db)):
    # 1. Check if user already exists
    stmt = select(User).where(User.email == user_in.email)
    result = await db.execute(stmt)
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # 2. Calculate the generation tier
    tier = calculate_generation_tier(user_in.birth_year)

    # 3. Hash the password
    hashed_pwd = hash_password(user_in.password)

    # 4. Give some thematic default starter aura points based on tier!
    # Gen Z and Gen Alpha get a funny high starting premium aura.
    starter_aura = 100 if tier == "gen_z" else 150 if tier == "gen_alpha" else 50 if tier == "millennial" else 10

    # 5. Create user database record
    new_user = User(
        email=user_in.email,
        hashed_password=hashed_pwd,
        generation_tier=tier,
        aura_points=starter_aura
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    # 1. Look up user by email
    stmt = select(User).where(User.email == credentials.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    # 2. Verify existence and password correctness
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3. Create access token payload
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "generation_tier": user.generation_tier
    }
    
    access_token = create_access_token(data=token_payload)
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the authenticated user's profile details.
    """
    return current_user

