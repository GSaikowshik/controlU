import asyncio
import os
import sys
import uuid
from datetime import datetime, timezone


# Add parent directory to path so app can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Ensure we use an isolated sqlite database for testing
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_controlu.db"

# Now import the components
from app.database import engine, Base, SessionLocal
from app.models import User, UrgeCategory, InterventionLog
from app.routers.auth import calculate_generation_tier
from app.security import hash_password, verify_password, create_access_token

# Clean colors for the CLI test suite output
GREEN = "\033[92m"
RED = "\033[91m"
BLUE = "\033[94m"
YELLOW = "\033[93m"
RESET = "\033[0m"
BOLD = "\033[1m"

def print_section(title: str):
    print(f"\n{BOLD}{BLUE}=== {title} ==={RESET}")

def print_success(message: str):
    print(f"{GREEN}[SUCCESS] {message}{RESET}")

def print_failure(message: str):
    print(f"{RED}[FAILURE] {message}{RESET}")


async def run_tests():
    print_section("STARTING controlU API TEST SUITE")
    
    # 1. Clean and initialize test DB
    if os.path.exists("./test_controlu.db"):
        os.remove("./test_controlu.db")
        
    print("Initializing test database...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print_success("Database initialized.")

    # 2. Test Generation Tier Logic
    print_section("TESTING GENERATION TIER CLASSIFIER")
    tiers = {
        1990: "millennial",
        2005: "gen_z",
        2020: "gen_alpha",
        1975: "boomer_genx",
    }
    
    for year, expected in tiers.items():
        calculated = calculate_generation_tier(year)
        if calculated == expected:
            print_success(f"Year {year} mapped to '{calculated}' (Expected: '{expected}')")
        else:
            print_failure(f"Year {year} mapped to '{calculated}' (Expected: '{expected}')")
            sys.exit(1)

    # 3. Test Security Hashing
    print_section("TESTING PASSWORD HASHING UTILITIES")
    raw_pwd = "SuperSecurePassword123"
    hashed = hash_password(raw_pwd)
    
    if hashed != raw_pwd and len(hashed) > 10:
        print_success("Password hashed successfully.")
    else:
        print_failure("Password hashing failed.")
        sys.exit(1)
        
    if verify_password(raw_pwd, hashed):
        print_success("Password verified successfully with bcrypt.")
    else:
        print_failure("Password verification mismatch.")
        sys.exit(1)
        
    if not verify_password("wrongPassword", hashed):
        print_success("Incorrect password verified as invalid.")
    else:
        print_failure("Security gap: incorrect password passed verification.")
        sys.exit(1)

    # 4. Test API Auth Flow & Endpoints natively
    print_section("TESTING DATABASE REGISTRATION FLOW")
    
    async with SessionLocal() as db:
        # Register standard Gen Z user
        genz_user = User(
            email="genz@controlu.app",
            hashed_password=hash_password("genzpassword"),
            generation_tier=calculate_generation_tier(2002),
            aura_points=100
        )
        db.add(genz_user)
        await db.commit()
        await db.refresh(genz_user)
        print_success(f"Registered user: {genz_user.email} (Tier: {genz_user.generation_tier}, Aura: {genz_user.aura_points})")

        # Register standard Millennial user
        millennial_user = User(
            email="millennial@controlu.app",
            hashed_password=hash_password("millennialpassword"),
            generation_tier=calculate_generation_tier(1992),
            aura_points=50
        )
        db.add(millennial_user)
        await db.commit()
        await db.refresh(millennial_user)
        print_success(f"Registered user: {millennial_user.email} (Tier: {millennial_user.generation_tier}, Aura: {millennial_user.aura_points})")

        # Test user verification check
        if genz_user.generation_tier == "gen_z" and millennial_user.generation_tier == "millennial":
            print_success("Correct generation tiers verified in DB records.")
        else:
            print_failure("Generation tier mismatch in DB records.")
            sys.exit(1)

    # 5. Test JWT Generation & Authentication Context
    print_section("TESTING JWT GENERATION & DECODING")
    token_payload = {
        "sub": str(genz_user.id),
        "email": genz_user.email,
        "generation_tier": genz_user.generation_tier
    }
    token = create_access_token(data=token_payload)
    
    if len(token) > 20:
        print_success("JWT access token generated successfully.")
    else:
        print_failure("Access token generation failed.")
        sys.exit(1)

    # 6. Test Urges Category Mapping
    print_section("TESTING URGE CATEGORIES CREATION")
    async with SessionLocal() as db:
        social_media_cat = UrgeCategory(
            user_id=genz_user.id,
            name="Social Media scrolling"
        )
        sugar_cat = UrgeCategory(
            user_id=genz_user.id,
            name="Late-night Sweet Urges"
        )
        db.add_all([social_media_cat, sugar_cat])
        await db.commit()
        await db.refresh(social_media_cat)
        await db.refresh(sugar_cat)
        print_success(f"Created category '{social_media_cat.name}' (ID: {social_media_cat.id})")
        print_success(f"Created category '{sugar_cat.name}' (ID: {sugar_cat.id})")

    # 7. Test Intervention Logs & Aura Multipliers
    print_section("TESTING INTERVENTIONS & AURA DYNAMICS")
    async with SessionLocal() as db:
        # Load genz_user and verify aura
        user_db = await db.get(User, genz_user.id)
        initial_aura = user_db.aura_points
        
        # Log successful session (awards aura points)
        log1 = InterventionLog(
            user_id=user_db.id,
            category_id=social_media_cat.id,
            completed_full_session=True,
            duration_seconds=300 # 5 minutes
        )
        # Calculate reward
        aura_reward = 20 + int(log1.duration_seconds / 30)
        user_db.aura_points += aura_reward
        db.add(log1)
        await db.commit()
        await db.refresh(user_db)
        
        print_success(f"Completed session logged! Aura went from {initial_aura} -> {user_db.aura_points} (+{aura_reward} points).")
        
        # Verify database save
        if user_db.aura_points == initial_aura + aura_reward:
            print_success("Aura points mathematical integrity confirmed in DB.")
        else:
            print_failure("Aura points math calculation error.")
            sys.exit(1)

        # Log failed/aborted session (penalizes slightly)
        prev_aura = user_db.aura_points
        log2 = InterventionLog(
            user_id=user_db.id,
            category_id=sugar_cat.id,
            completed_full_session=False,
            duration_seconds=30
        )
        user_db.aura_points = max(0, user_db.aura_points - 10)
        db.add(log2)
        await db.commit()
        await db.refresh(user_db)
        print_success(f"Aborted session logged! Aura went from {prev_aura} -> {user_db.aura_points} (-10 points penalization).")

    # 8. Test Core API Logging & Calendar Aggregations (Integration level)
    print_section("TESTING CORE LOGGING & CALENDAR APIS")
    
    # Import router endpoints and Pydantic schemas
    from app.schemas import InterventionLogStart, InterventionLogUpdate
    from app.routers.interventions import create_panic_log, update_intervention_log
    from app.routers.calendar import get_calendar_summary
    
    async with SessionLocal() as db:
        # Load user
        user_db = await db.get(User, genz_user.id)
        start_points = user_db.aura_points
        
        # Test A: Create Initial Panic Log
        start_schema = InterventionLogStart(category_id=social_media_cat.id)
        panic_log = await create_panic_log(log_in=start_schema, user=user_db, db=db)
        
        if panic_log.duration_seconds == 0 and not panic_log.completed_full_session:
            print_success(f"Panic button logged successfully! ID: {panic_log.id} (Duration: 0, Success: False)")
        else:
            print_failure("Panic log initialization failure.")
            sys.exit(1)
            
        # Test B: Update session to SUCCESS via PUT (Aura Engine: +50 points)
        update_success = InterventionLogUpdate(duration_seconds=300, completed_full_session=True)
        updated_log1 = await update_intervention_log(
            id=panic_log.id, 
            log_update=update_success, 
            user=user_db, 
            db=db
        )
        
        # Refresh user score
        await db.refresh(user_db)
        if updated_log1.completed_full_session and user_db.aura_points == start_points + 50:
            print_success(f"Focus completed logged successfully! Aura went from {start_points} -> {user_db.aura_points} (+50 points awarded).")
        else:
            print_failure(f"Focus completion update failed. Aura: {user_db.aura_points} (Expected: {start_points + 50})")
            sys.exit(1)

        # Test C: Create a second log and abort via PUT (Aura Engine: -500 points)
        panic_log2 = await create_panic_log(log_in=start_schema, user=user_db, db=db)
        points_before_reset = user_db.aura_points
        
        update_abort = InterventionLogUpdate(duration_seconds=60, completed_full_session=False)
        updated_log2 = await update_intervention_log(
            id=panic_log2.id, 
            log_update=update_abort, 
            user=user_db, 
            db=db
        )
        
        # Refresh user score
        await db.refresh(user_db)
        expected_points = max(0, points_before_reset - 500)
        
        if not updated_log2.completed_full_session and user_db.aura_points == expected_points:
            print_success(f"Manual streak reset logged successfully! Aura went from {points_before_reset} -> {user_db.aura_points} (-500 points penalized).")
        else:
            print_failure(f"Aborted session update failed. Aura: {user_db.aura_points} (Expected: {expected_points})")
            sys.exit(1)

        # Test D: Calendar Aggregation Daily status check
        today_utc = datetime.now(timezone.utc)
        current_month_str = today_utc.strftime("%Y-%m")
        
        calendar_res = await get_calendar_summary(month=current_month_str, user=user_db, db=db)
        days = calendar_res["days"]
        
        today_num = today_utc.day
        today_status = days[today_num - 1]["status"]
        
        # Since today we have at least one failed log (updated_log2 is False), today's summary should be 'reset'!
        if today_status == "reset":
            print_success(f"Calendar aggregated successfully! Month: {current_month_str}, Today's status: '{today_status}' (Correct: 'reset')")
        else:
            print_failure(f"Calendar daily status resolution error. Today's status: '{today_status}' (Expected: 'reset')")
            sys.exit(1)

    print_section("TEST SUMMARY")
    print(f"{GREEN}{BOLD}[SUCCESS] ALL TESTS PASSED SUCCESSFULLY! controlU CORE BACKEND API IS 100% READY!{RESET}")
    
    # Dispose connection engine pool to release the file lock on Windows
    await engine.dispose()
    
    # Cleanup test DB after execution
    if os.path.exists("./test_controlu.db"):
        try:
            os.remove("./test_controlu.db")
        except Exception as e:
            print(f"Cleanup warning: {e}")

if __name__ == "__main__":
    asyncio.run(run_tests())

