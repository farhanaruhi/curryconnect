import pytest
from datetime import datetime, timedelta
from ml.recommendation.scorer import haversine_distance, calculate_recommendation_score
from ml.clustering.kmeans_service import KMeansService

def test_haversine_distance():
    # Coordinates of Vidhana Soudha, Bangalore
    lat1, lon1 = 12.9796, 77.5906
    # Coordinates of MG Road Metro Station, Bangalore (approx 1.5 km away)
    lat2, lon2 = 12.9755, 77.6068
    
    dist = haversine_distance(lat1, lon1, lat2, lon2)
    # Distance should be around 1.8 km (1800 meters) +/- 200m
    assert 1500.0 <= dist <= 2200.0

def test_recommendation_score():
    now = datetime.utcnow()
    created = now - timedelta(hours=1)
    fresh_until = now + timedelta(hours=5)
    
    # Perfect score inputs (0m distance, fresh, high quantity, high seller rating, popular)
    perf_result = calculate_recommendation_score(
        distance_meters=0.0,
        fresh_until=fresh_until,
        created_at=created,
        quantity=5.0,
        seller_rating=5.0,
        popularity_score=10.0
    )
    
    # Score should be very close to 1.0 (perfect)
    assert perf_result["score"] >= 0.95
    assert perf_result["breakdown"]["distance"] == 1.0
    assert perf_result["breakdown"]["rating"] == 1.0

    # Far away listing (should decay distance component)
    far_result = calculate_recommendation_score(
        distance_meters=1200.0,
        fresh_until=fresh_until,
        created_at=created,
        quantity=2.0,
        seller_rating=4.0,
        popularity_score=2.0
    )
    
    assert far_result["breakdown"]["distance"] == 0.0
    assert far_result["score"] < perf_result["score"]

def test_kmeans_service_fallback():
    service = KMeansService()
    
    # Train with fewer than 3 samples (should fall back and not train model)
    res = service.train([(12.97, 77.59), (12.98, 77.60)])
    assert res["status"] == "too_few_samples"
    assert service.predict_cluster(12.97, 77.59) == -1
