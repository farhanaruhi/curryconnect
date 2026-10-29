from datetime import datetime
from typing import Optional, List, Literal
from pydantic import BaseModel, EmailStr, Field

# --- User Schemas ---
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    preference: Literal["Veg", "Non-Veg", "Both"] = "Both"

class UserRegister(UserBase):
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = None
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    preference: Optional[Literal["Veg", "Non-Veg", "Both"]] = None

class UserResponse(UserBase):
    id: int
    rating: float
    created_at: datetime

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Rating Schemas ---
class RatingCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    review: Optional[str] = None

class RatingResponse(BaseModel):
    id: int
    user_id: int
    curry_id: int
    rating: int
    review: Optional[str]
    created_at: datetime
    reviewer_name: Optional[str] = None

    class Config:
        from_attributes = True

# --- Curry Schemas ---
class CurryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    category: Literal["Veg", "Non-Veg"]
    quantity: float = Field(..., gt=0.0)
    unit: str = Field("serving", min_length=1)
    price: float = Field(0.0, ge=0.0)  # 0.0 means free
    description: Optional[str] = None
    image_url: Optional[str] = None
    restaurant: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    fresh_until: datetime
    pickup_time: str

class CurryCreate(CurryBase):
    pass

class CurryUpdate(CurryBase):
    pass

class CurryResponse(CurryBase):
    id: int
    user_id: int
    uploadedBy: int
    booked_by_id: Optional[int] = None
    booked_by_name: Optional[str] = None
    booked_by_phone: Optional[str] = None
    created_at: datetime
    owner: UserResponse
    average_rating: float = 5.0

    class Config:
        from_attributes = True

# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    read: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Recommendation / Search Response ---
class CurrySearchResult(BaseModel):
    curry: CurryResponse
    distance_meters: float
    recommendation_score: float
    is_fresh: bool
    average_rating: float = 5.0
    content_similarity: float = 0.0
    predicted_satisfaction: float = 5.0
    expanded_radius: bool = False

# --- Search History Schemas ---
class SearchHistoryCreate(BaseModel):
    query: Optional[str] = None
    latitude: float
    longitude: float

class SearchHistoryResponse(BaseModel):
    id: int
    user_id: Optional[int]
    query: Optional[str]
    latitude: float
    longitude: float
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Cluster Schemas ---
class ClusterResponse(BaseModel):
    id: int
    center_latitude: float
    center_longitude: float
    curry_count: int
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Dashboard & Stats Schemas ---
class StatisticsResponse(BaseModel):
    total_uploaded: int
    nearby_count: int
    today_searches: int
    waste_prevented_servings: float

class AnalyticsResponse(BaseModel):
    upload_trends: List[dict]
    popular_categories: List[dict]
    cluster_stats: List[dict]
    recommendation_performance: dict
    search_success_rate: float
