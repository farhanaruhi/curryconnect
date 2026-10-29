from typing import List, Literal
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from backend.database.connection import get_db
from backend.database.models import User, SearchHistory
from backend.schemas.schemas import UserUpdate, UserResponse, SearchHistoryResponse
from backend.auth.dependencies import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=UserResponse)
def update_me(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    for key, value in user_data.model_dump(exclude_unset=True).items():
        setattr(current_user, key, value)
        
    db.commit()
    db.refresh(current_user)
    return current_user

@router.put("/me/preference", response_model=UserResponse)
def update_preference(
    preference: Literal["Veg", "Non-Veg", "Both"] = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    current_user.preference = preference
    db.commit()
    db.refresh(current_user)
    return current_user

@router.get("/me/search-history", response_model=List[SearchHistoryResponse])
def get_my_search_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 20,
):
    return (
        db.query(SearchHistory)
        .filter(SearchHistory.user_id == current_user.id)
        .order_by(SearchHistory.timestamp.desc())
        .limit(limit)
        .all()
    )
