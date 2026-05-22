import bcrypt
import logging
import traceback
import uuid
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.database import get_db
from app.models import User

# Initialize security logger
logger = logging.getLogger("controlu.security")
logger.setLevel(logging.INFO)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)

def hash_password(password: str) -> str:
    """
    Hashes a plain password using bcrypt.
    """
    logger.info("[SECURITY] Hashing password with bcrypt...")
    try:
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')
    except Exception as e:
        logger.error(f"[SECURITY] Password hashing failed: {e}")
        logger.error(traceback.format_exc())
        raise

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain password against its hashed counterpart.
    """
    logger.info("[SECURITY] Verifying password match against hash...")
    try:
        match = bcrypt.checkpw(
            plain_password.encode('utf-8'), 
            hashed_password.encode('utf-8')
        )
        logger.info(f"[SECURITY] Password verification result: {'MATCHED' if match else 'MISMATCHED'}")
        return match
    except Exception as e:
        logger.error(f"[SECURITY] Exception occurred during password verification check: {e}")
        logger.error(traceback.format_exc())
        return False

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Generates a secure JSON Web Token (JWT) with expiration.
    """
    logger.info("[SECURITY] Generating access token...")
    try:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": int(expire.timestamp())})
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.JWT_SECRET_KEY, 
            algorithm=settings.JWT_ALGORITHM
        )
        logger.info(f"[SECURITY] Token created successfully. Expiration: {expire.isoformat()}")
        return encoded_jwt
    except Exception as e:
        logger.error(f"[SECURITY] Token creation failed: {e}")
        logger.error(traceback.format_exc())
        raise

async def get_current_user(token: str | None = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    """
    Retrieves the current authenticated user using the JWT token passed.
    """
    logger.info("[SECURITY] Received request to verify current user credentials.")
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials. Please log in.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not token:
        logger.warning("[SECURITY] Authentication failed: No Bearer token provided in headers.")
        raise credentials_exception
        
    logger.info("[SECURITY] Token provided. Starting JWT decoding...")
    print(f"=== [DEBUG] ABOUT TO VERIFY JWT TOKEN ===")
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        logger.info("[SECURITY] JWT token decoded successfully.")
        
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            logger.warning("[SECURITY] Authentication failed: Token subject ('sub' user ID) is missing.")
            raise credentials_exception
            
        logger.info(f"[SECURITY] Decoded user subject ID: '{user_id_str}'")
    except JWTError as e:
        print(f"=== [RAW JWT ERROR] FAILED TO DECODE/VERIFY TOKEN: {e} ===")
        logger.warning(f"[SECURITY] Authentication failed: JWT decoding error: {e}")
        logger.warning(f"[SECURITY] JWT decoding traceback:\n{traceback.format_exc()}")
        raise credentials_exception
        
    try:
        user_id = uuid.UUID(user_id_str)
    except ValueError as e:
        logger.warning(f"[SECURITY] Authentication failed: Invalid UUID string format parsed from token: '{user_id_str}' ({e})")
        raise credentials_exception

    logger.info(f"[SECURITY] Querying database for user record with ID: '{user_id}'")
    print(f"=== [DEBUG] ABOUT TO QUERY DB FOR CURRENT USER ID: {user_id} ===")
    try:
        try:
            stmt = select(User).where(User.id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
        except Exception as e:
            print(f"=== [RAW DB ERROR] FAILED TO QUERY DB FOR CURRENT USER: {e} ===")
            raise
        
        if user is None:
            logger.warning(f"[SECURITY] Authentication failed: User ID '{user_id}' does not exist in database.")
            raise credentials_exception
            
        logger.info(f"[SECURITY] Authentication successful. User found: email '{user.email}' (ID: '{user_id}')")
        return user
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[SECURITY] Unexpected database exception occurred during user verification check: {e}")
        logger.error(f"[SECURITY] Query traceback:\n{traceback.format_exc()}")
        raise credentials_exception
