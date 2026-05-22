import logging
import traceback
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import User
from app.schemas import UserRegister, UserLogin, UserResponse, Token
from app.security import hash_password, verify_password, create_access_token, get_current_user

# Initialize auth router logger
logger = logging.getLogger("controlu.auth")
logger.setLevel(logging.INFO)

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
    logger.info(f"[AUTH] Registration request received for email: '{user_in.email}'")
    try:
        # 1. Check if user already exists
        logger.info(f"[AUTH] Checking existing user status for email: '{user_in.email}'")
        print(f"=== [DEBUG] ABOUT TO QUERY DB FOR REGISTER: {user_in.email} ===")
        try:
            stmt = select(User).where(User.email == user_in.email)
            result = await db.execute(stmt)
            existing_user = result.scalar_one_or_none()
        except Exception as e:
            print(f"=== [RAW DB ERROR] FAILED TO QUERY DB DURING REGISTER: {e} ===")
            raise
        
        if existing_user:
            logger.warning(f"[AUTH] Registration conflict: email '{user_in.email}' is already registered.")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists."
            )

        # 2. Calculate the generation tier
        tier = calculate_generation_tier(user_in.birth_year)
        logger.info(f"[AUTH] Computed birth generation tier: '{tier}' for birth year {user_in.birth_year}")

        # 3. Hash the password
        hashed_pwd = hash_password(user_in.password)

        # 4. Give starter aura points
        starter_aura = 100 if tier == "gen_z" else 150 if tier == "gen_alpha" else 50 if tier == "millennial" else 10

        # 5. Create user database record
        new_user = User(
            email=user_in.email,
            hashed_password=hashed_pwd,
            generation_tier=tier,
            aura_points=starter_aura
        )

        logger.info(f"[AUTH] Inserting new user record into database for '{user_in.email}'")
        print(f"=== [DEBUG] ABOUT TO COMMIT NEW USER TO DB: {user_in.email} ===")
        try:
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
        except Exception as e:
            print(f"=== [RAW DB ERROR] FAILED TO COMMIT NEW USER: {e} ===")
            raise
        logger.info(f"[AUTH] User '{user_in.email}' registered successfully. Created ID: {new_user.id}")
        return new_user

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AUTH] Unhandled exception occurred during registration for '{user_in.email}': {e}")
        logger.error(f"[AUTH] Registration Traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal registration error: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    logger.info(f"[AUTH] Login request received for email: '{credentials.email}'")
    try:
        # 1. Look up user by email
        logger.info(f"[AUTH] Querying database for user: '{credentials.email}'")
        print(f"=== [DEBUG] ABOUT TO QUERY DB FOR LOGIN: {credentials.email} ===")
        try:
            stmt = select(User).where(User.email == credentials.email)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
        except Exception as e:
            print(f"=== [RAW DB ERROR] FAILED TO QUERY DB DURING LOGIN: {e} ===")
            raise

        # 2. Verify existence and password correctness
        if not user:
            logger.warning(f"[AUTH] Authentication failed: email '{credentials.email}' not found in database.")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        logger.info(f"[AUTH] Verifying password hash for user: '{credentials.email}'")
        if not verify_password(credentials.password, user.hashed_password):
            logger.warning(f"[AUTH] Authentication failed: incorrect password provided for '{credentials.email}'.")
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
        
        logger.info(f"[AUTH] Generating access token for user ID: {user.id}")
        access_token = create_access_token(data=token_payload)
        logger.info(f"[AUTH] Login succeeded for user: '{credentials.email}' (ID: {user.id})")
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AUTH] Unhandled exception occurred during login for '{credentials.email}': {e}")
        logger.error(f"[AUTH] Login Traceback:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal login error: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the authenticated user's profile details.
    """
    logger.info(f"[AUTH] Fetching current user details for authenticated user ID: {current_user.id}")
    return current_user
