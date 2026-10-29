from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.database.connection import get_db
from backend.database.models import User, Curry, Rating
from backend.schemas.schemas import (
    CurryCreate, CurryUpdate, CurryResponse, 
    CurrySearchResult, RatingCreate, RatingResponse
)
from backend.auth.dependencies import get_current_user
from backend.services.curry_service import CurryService

router = APIRouter(prefix="/curries", tags=["Curries"])

@router.post("/", response_model=CurryResponse, status_code=status.HTTP_201_CREATED)
def create_curry(
    curry_data: CurryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return CurryService.create_curry(db, curry_data, current_user.id)

@router.get("/", response_model=List[CurryResponse])
def get_all_curries(db: Session = Depends(get_db)):
    # Return all curries
    return db.query(Curry).all()

@router.get("/search", response_model=List[CurrySearchResult])
def search_curries(
    lat: float = Query(..., ge=-90.0, le=90.0),
    lon: float = Query(..., ge=-180.0, le=180.0),
    radius_km: float = Query(1.0, gt=0.0, le=50.0),
    category: Optional[str] = Query(None),
    query: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.id if current_user else None
    results = CurryService.search_nearby(
        db=db,
        lat=lat,
        lon=lon,
        radius_km=radius_km,
        category=category,
        query=query,
        user_id=user_id
    )
    return results

@router.get("/{curry_id}", response_model=CurryResponse)
def get_curry(curry_id: int, db: Session = Depends(get_db)):
    curry = CurryService.get_curry(db, curry_id)
    if not curry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curry not found")
    return curry

@router.put("/{curry_id}", response_model=CurryResponse)
def update_curry(
    curry_id: int,
    curry_data: CurryUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    curry = CurryService.update_curry(db, curry_id, curry_data, current_user.id)
    if not curry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Curry not found or not authorized to update"
        )
    return curry

@router.delete("/{curry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_curry(
    curry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = CurryService.delete_curry(db, curry_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Curry not found or not authorized to delete"
        )
    return

@router.post("/{curry_id}/rate", response_model=RatingResponse)
def rate_curry(
    curry_id: int,
    rating_data: RatingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify curry exists
    curry = CurryService.get_curry(db, curry_id)
    if not curry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curry not found")
        
    rating = CurryService.add_rating(db, current_user.id, curry_id, rating_data.rating, rating_data.review)
    return rating

@router.get("/{curry_id}/ratings", response_model=List[RatingResponse])
def get_curry_ratings(curry_id: int, db: Session = Depends(get_db)):
    ratings = db.query(Rating).filter(Rating.curry_id == curry_id).all()
    res = []
    for r in ratings:
        user = db.query(User).filter(User.id == r.user_id).first()
        rating_data = RatingResponse.model_validate(r)
        rating_data.reviewer_name = user.name if user else "Anonymous"
        res.append(rating_data)
    return res

from backend.database.models import Notification

@router.post("/{curry_id}/book", response_model=CurryResponse)
def book_curry(
    curry_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    curry = CurryService.get_curry(db, curry_id)
    if not curry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Curry not found")
        
    if curry.booked_by_id is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="This curry has already been booked"
        )
        
    if curry.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="You cannot book your own uploaded curry"
        )
        
    curry.booked_by_id = current_user.id
    
    # Create notification for uploader
    notif = Notification(
        user_id=curry.user_id,
        title="Curry Booked! 🍲",
        message=f"{current_user.name} has booked your curry '{curry.name}'. Recipient Contact: {current_user.phone or 'No phone'}. You can coordinate the pickup directly!"
    )
    db.add(notif)
    db.commit()
    db.refresh(curry)
    return curry
