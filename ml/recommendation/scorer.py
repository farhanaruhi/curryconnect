import math
from datetime import datetime, timezone
from typing import Dict, Any, List

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great-circle distance between two points on the Earth's surface
    in meters.
    """
    # Convert latitude and longitude to radians
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    # Haversine formula
    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    # Earth's radius in meters
    r = 6371000.0
    return r * c

def calculate_recommendation_score(
    distance_meters: float,
    fresh_until: datetime,
    created_at: datetime,
    quantity: float,
    seller_rating: float,
    popularity_score: float  # e.g., view count or request count, normalized
) -> Dict[str, Any]:
    """
    Calculate recommendation score based on 5 factors:
    - Distance (40%)
    - Freshness (20%)
    - Quantity (15%)
    - Rating (15%)
    - Popularity (10%)
    """
    # 1. Distance Score (decay from 1.0 at 0m to 0.0 at 1000m)
    distance_score = max(0.0, 1.0 - (distance_meters / 1000.0))

    # 2. Freshness Score
    # fresh_until should be in future.
    now = datetime.utcnow()
    total_life = (fresh_until - created_at).total_seconds()
    time_left = (fresh_until - now).total_seconds()
    
    if total_life <= 0:
        freshness_score = 0.0
    else:
        freshness_score = max(0.0, min(1.0, time_left / total_life))

    # 3. Quantity Score (assume 5 servings is the ideal max quantity for sharing, cap at 1.0)
    quantity_score = max(0.0, min(1.0, quantity / 5.0))

    # 4. Rating Score (normalized from 5.0 scale)
    rating_score = max(0.0, min(1.0, seller_rating / 5.0))

    # 5. Popularity Score (cap at 10 requests/views, normalize)
    pop_score = max(0.0, min(1.0, popularity_score / 10.0))

    # Weighted calculation
    final_score = (
        0.40 * distance_score +
        0.20 * freshness_score +
        0.15 * quantity_score +
        0.15 * rating_score +
        0.10 * pop_score
    )

    return {
        "score": round(final_score, 4),
        "breakdown": {
            "distance": round(distance_score, 2),
            "freshness": round(freshness_score, 2),
            "quantity": round(quantity_score, 2),
            "rating": round(rating_score, 2),
            "popularity": round(pop_score, 2)
        }
    }
