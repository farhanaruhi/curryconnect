from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database.connection import engine
from backend.database.models import Base
from backend.api import auth, users, curries, analytics, notifications

# Create database tables
Base.metadata.create_all(bind=engine)

# Database migration: add preference to users and restaurant to curries if they don't exist, and normalize categories
from sqlalchemy import text
from backend.database.connection import SessionLocal

db = SessionLocal()
try:
    # 1. Check if preference column exists in users
    cursor = db.execute(text("PRAGMA table_info(users)"))
    user_columns = [row[1] for row in cursor.fetchall()]
    if "preference" not in user_columns:
        db.execute(text("ALTER TABLE users ADD COLUMN preference VARCHAR DEFAULT 'Veg'"))
        db.commit()
        print("Migration: Added 'preference' column to 'users' table.")
    
    # 2. Check if restaurant column exists in curries
    cursor_c = db.execute(text("PRAGMA table_info(curries)"))
    curry_columns = [row[1] for row in cursor_c.fetchall()]
    if "restaurant" not in curry_columns:
        db.execute(text("ALTER TABLE curries ADD COLUMN restaurant VARCHAR"))
        db.commit()
        print("Migration: Added 'restaurant' column to 'curries' table.")

    # 3. Check if booked_by_id column exists in curries
    if "booked_by_id" not in curry_columns:
        db.execute(text("ALTER TABLE curries ADD COLUMN booked_by_id INTEGER"))
        db.commit()
        print("Migration: Added 'booked_by_id' column to 'curries' table.")

    # 3. Normalize existing Curry categories to Veg/Non-Veg
    from backend.database.models import Curry
    curries_to_migrate = db.query(Curry).all()
    normalized_count = 0
    for c in curries_to_migrate:
        if c.category not in ["Veg", "Non-Veg"]:
            if c.category in ["Chicken", "Mutton", "Seafood", "Beef"]:
                c.category = "Non-Veg"
            else:
                c.category = "Veg"
            normalized_count += 1
    if normalized_count > 0:
        db.commit()
        print(f"Migration: Normalized {normalized_count} curry categories to Veg/Non-Veg.")
except Exception as e:
    print(f"Migration error: {e}")
finally:
    db.close()

app = FastAPI(
    title="CurryConnect API",
    description="AI-Powered Hyperlocal Homemade Curry Sharing & Discovery Platform",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder for ML visualizations
VISUALIZATIONS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml", "visualizations"
)
# Ensure directories exist
os.makedirs(VISUALIZATIONS_DIR, exist_ok=True)

app.mount(
    "/static/visualizations",
    StaticFiles(directory=VISUALIZATIONS_DIR),
    name="visualizations"
)

# Include routers under /api
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(curries.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "name": "CurryConnect API",
        "status": "healthy",
        "description": "Hyperlocal Curry Sharing & Discovery Backend active."
    }
