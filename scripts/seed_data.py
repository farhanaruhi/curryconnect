"""
Seed demo users and curry listings around Bangalore for Smart Curry Finder demos.
Run: python scripts/seed_data.py
"""
from __future__ import annotations

import sys
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.database.connection import SessionLocal
from backend.database.models import User, Curry, Rating
from backend.auth.security import get_password_hash
from backend.services.curry_service import CurryService

# Bangalore center
CENTER_LAT = 12.9716
CENTER_LON = 77.5946

DEMO_USERS = [
    {
        "name": "Priya Sharma",
        "email": "priya.demo@example.com",
        "password": "demo1234",
        "phone": "+91 98765 43210",
        "latitude": 12.9720,
        "longitude": 77.5950,
    },
    {
        "name": "Rajesh Kumar",
        "email": "rajesh.demo@example.com",
        "password": "demo1234",
        "phone": "+91 91234 56789",
        "latitude": 12.9680,
        "longitude": 77.5920,
    },
    {
        "name": "Anita Reddy",
        "email": "anita.demo@example.com",
        "password": "demo1234",
        "phone": "+91 99887 76655",
        "latitude": 12.9800,
        "longitude": 77.6000,
    },
]

DEMO_CURRIES = [
    {
        "owner_email": "priya.demo@example.com",
        "name": "Andhra Special Chicken Curry",
        "category": "Chicken",
        "quantity": 4,
        "unit": "servings",
        "price": 0,
        "description": "Spicy Andhra-style chicken curry with curry leaves and tamarind.",
        "latitude": 12.9725,
        "longitude": 77.5960,
        "fresh_hours": 8,
        "pickup_time": "6:00 PM - 8:00 PM",
    },
    {
        "owner_email": "priya.demo@example.com",
        "name": "Homemade Fish Curry",
        "category": "Seafood",
        "quantity": 2,
        "unit": "bowls",
        "price": 120,
        "description": "Coastal-style fish curry, medium spicy, coconut-based gravy.",
        "latitude": 12.9708,
        "longitude": 77.5935,
        "fresh_hours": 5,
        "pickup_time": "5:30 PM - 7:30 PM",
    },
    {
        "owner_email": "rajesh.demo@example.com",
        "name": "Paneer Butter Masala",
        "category": "Paneer",
        "quantity": 3,
        "unit": "servings",
        "price": 80,
        "description": "Creamy paneer butter masala, mildly spiced, fresh from kitchen.",
        "latitude": 12.9810,
        "longitude": 77.5985,
        "fresh_hours": 6,
        "pickup_time": "7:00 PM - 9:00 PM",
    },
    {
        "owner_email": "rajesh.demo@example.com",
        "name": "Mutton Rogan Josh",
        "category": "Mutton",
        "quantity": 2,
        "unit": "plates",
        "price": 150,
        "description": "Rich Kashmiri mutton curry, slow-cooked with aromatic spices.",
        "latitude": 12.9850,
        "longitude": 77.6020,
        "fresh_hours": 4,
        "pickup_time": "6:30 PM - 8:30 PM",
    },
    {
        "owner_email": "anita.demo@example.com",
        "name": "Dal Tadka (Lentil Curry)",
        "category": "Lentil",
        "quantity": 5,
        "unit": "servings",
        "price": 0,
        "description": "Comfort food dal tadka, perfect with rice. Vegetarian.",
        "latitude": 12.9695,
        "longitude": 77.5910,
        "fresh_hours": 10,
        "pickup_time": "5:00 PM - 7:00 PM",
    },
    {
        "owner_email": "anita.demo@example.com",
        "name": "Mixed Veg Kurma",
        "category": "Veg",
        "quantity": 3,
        "unit": "servings",
        "price": 60,
        "description": "Mixed vegetables in coconut kurma, mild and aromatic.",
        "latitude": 12.9780,
        "longitude": 77.5970,
        "fresh_hours": 7,
        "pickup_time": "6:00 PM - 8:00 PM",
    },
    {
        "owner_email": "anita.demo@example.com",
        "name": "Beef Pepper Fry",
        "category": "Beef",
        "quantity": 2,
        "unit": "plates",
        "price": 180,
        "description": "Kerala-style beef pepper fry, extra spicy.",
        "latitude": 12.9900,
        "longitude": 77.6100,
        "fresh_hours": 5,
        "pickup_time": "7:00 PM - 9:00 PM",
    },
]

DEMO_RATINGS = [
    ("Andhra Special Chicken Curry", "rajesh.demo@example.com", 5, "Amazing spice level!"),
    ("Paneer Butter Masala", "priya.demo@example.com", 4, "Very creamy and fresh."),
    ("Dal Tadka (Lentil Curry)", "rajesh.demo@example.com", 5, "Perfect comfort food."),
]


def upsert_user(db, user_data: dict) -> User:
    existing = db.query(User).filter(User.email == user_data["email"]).first()
    if existing:
        existing.name = user_data["name"]
        existing.phone = user_data["phone"]
        existing.latitude = user_data["latitude"]
        existing.longitude = user_data["longitude"]
        existing.password_hash = get_password_hash(user_data["password"])
        db.commit()
        db.refresh(existing)
        return existing

    user = User(
        name=user_data["name"],
        email=user_data["email"],
        password_hash=get_password_hash(user_data["password"]),
        phone=user_data["phone"],
        latitude=user_data["latitude"],
        longitude=user_data["longitude"],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def seed() -> None:
    db = SessionLocal()
    try:
        users_by_email = {}
        for user_data in DEMO_USERS:
            user = upsert_user(db, user_data)
            users_by_email[user.email] = user
            print(f"  User ready: {user.email} (password: demo1234)")

        created_curries = []
        for item in DEMO_CURRIES:
            owner = users_by_email[item["owner_email"]]
            existing = (
                db.query(Curry)
                .filter(Curry.name == item["name"], Curry.user_id == owner.id)
                .first()
            )
            fresh_until = datetime.utcnow() + timedelta(hours=item["fresh_hours"])

            if existing:
                existing.category = item["category"]
                existing.quantity = item["quantity"]
                existing.unit = item["unit"]
                existing.price = item["price"]
                existing.description = item["description"]
                existing.latitude = item["latitude"]
                existing.longitude = item["longitude"]
                existing.fresh_until = fresh_until
                existing.pickup_time = item["pickup_time"]
                db.commit()
                created_curries.append(existing)
                print(f"  Updated curry: {existing.name}")
                continue

            curry = Curry(
                user_id=owner.id,
                name=item["name"],
                category=item["category"],
                quantity=item["quantity"],
                unit=item["unit"],
                price=item["price"],
                description=item["description"],
                latitude=item["latitude"],
                longitude=item["longitude"],
                fresh_until=fresh_until,
                pickup_time=item["pickup_time"],
            )
            db.add(curry)
            db.commit()
            db.refresh(curry)
            created_curries.append(curry)
            print(f"  Created curry: {curry.name}")

        curries_by_name = {c.name: c for c in created_curries}
        for curry_name, rater_email, stars, review in DEMO_RATINGS:
            curry = curries_by_name.get(curry_name)
            rater = users_by_email.get(rater_email)
            if not curry or not rater:
                continue
            existing_rating = (
                db.query(Rating)
                .filter(Rating.curry_id == curry.id, Rating.user_id == rater.id)
                .first()
            )
            if existing_rating:
                existing_rating.rating = stars
                existing_rating.review = review
            else:
                db.add(
                    Rating(
                        user_id=rater.id,
                        curry_id=curry.id,
                        rating=stars,
                        review=review,
                    )
                )
            db.commit()

        CurryService.retrain_kmeans(db)
        CurryService.retrain_ml_models(db)

        results_1km = CurryService.search_nearby(
            db, CENTER_LAT, CENTER_LON, radius_km=1.0, user_id=None
        )
        results_expanded = CurryService.search_nearby(
            db, CENTER_LAT, CENTER_LON, radius_km=1.0, query="Paneer", user_id=None
        )

        print("\n=== Seed complete ===")
        print(f"  Curries within 1 km: {len(results_1km)}")
        for r in results_1km:
            print(
                f"    - {r['curry'].name} ({r['distance_meters']:.0f}m, "
                f"score={r['recommendation_score']:.2f})"
            )
        print(f"  'Paneer' search (auto-expand): {len(results_expanded)} results")
        print("\nDemo login: priya.demo@example.com / demo1234")
        print(f"Search center: {CENTER_LAT}, {CENTER_LON} (Bangalore)")
    finally:
        db.close()


if __name__ == "__main__":
    print("Seeding Smart Curry Finder demo data...\n")
    seed()
