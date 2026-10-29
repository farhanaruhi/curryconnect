import sys
import os
from datetime import datetime, timedelta

# Add backend root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database.connection import SessionLocal
from backend.database.models import User, Curry
from backend.auth.security import get_password_hash

def seed():
    db = SessionLocal()
    try:
        # Check if users already exist
        emails = ["priya@example.com", "rajesh@example.com", "anita@example.com", "amit@example.com"]
        existing_users = db.query(User).filter(User.email.in_(emails)).all()
        if existing_users:
            print("Demo users already exist. Re-seeding them...")
            for u in existing_users:
                db.delete(u)
            db.commit()

        print("Seeding demonstration users...")
        pwd_hash = get_password_hash("password123")

        # Bengaluru coordinates
        lat, lon = 12.9716, 77.5946

        user_priya = User(
            name="Chef Priya (Veg)",
            email="priya@example.com",
            password_hash=pwd_hash,
            phone="+919000000001",
            latitude=lat + 0.002,  # ~200m away
            longitude=lon - 0.002,
            rating=4.8,
            preference="Veg"
        )
        user_rajesh = User(
            name="Chef Rajesh (Non-Veg)",
            email="rajesh@example.com",
            password_hash=pwd_hash,
            phone="+919000000002",
            latitude=lat - 0.003,  # ~300m away
            longitude=lon + 0.003,
            rating=4.9,
            preference="Non-Veg"
        )
        user_anita = User(
            name="Chef Anita (Both)",
            email="anita@example.com",
            password_hash=pwd_hash,
            phone="+919000000003",
            latitude=lat + 0.004,  # ~400m away
            longitude=lon + 0.001,
            rating=4.7,
            preference="Both"
        )
        user_amit = User(
            name="Foodie Amit (Both)",
            email="amit@example.com",
            password_hash=pwd_hash,
            phone="+919000000004",
            latitude=lat,
            longitude=lon,
            rating=5.0,
            preference="Both"
        )

        db.add_all([user_priya, user_rajesh, user_anita, user_amit])
        db.commit()

        # Refresh to get IDs
        db.refresh(user_priya)
        db.refresh(user_rajesh)
        db.refresh(user_anita)

        print("Seeding curries for Priya (Veg)...")
        now = datetime.utcnow()
        curry_paneer = Curry(
            user_id=user_priya.id,
            name="Paneer Butter Masala",
            category="Veg",
            quantity=3.0,
            unit="servings",
            price=120.0,
            description="Creamy, tomato-based cottage cheese curry with buttery notes.",
            image_url="https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&q=80&w=400",
            restaurant="Priya's Curry Kitchen",
            latitude=user_priya.latitude,
            longitude=user_priya.longitude,
            fresh_until=now + timedelta(hours=6),
            pickup_time="6:00 PM - 8:00 PM"
        )
        curry_dal = Curry(
            user_id=user_priya.id,
            name="Yellow Dal Tadka",
            category="Veg",
            quantity=4.0,
            unit="servings",
            price=80.0,
            description="Smoky yellow lentils tempered with ghee, garlic, and cumin.",
            image_url="https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=400",
            restaurant="Priya's Curry Kitchen",
            latitude=user_priya.latitude,
            longitude=user_priya.longitude,
            fresh_until=now + timedelta(hours=8),
            pickup_time="5:00 PM - 7:00 PM"
        )

        print("Seeding curries for Rajesh (Non-Veg)...")
        curry_chicken = Curry(
            user_id=user_rajesh.id,
            name="Andhra Spicy Chicken Curry",
            category="Non-Veg",
            quantity=2.0,
            unit="plates",
            price=150.0,
            description="Highly spiced chicken curry made with freshly ground Guntur chillies.",
            image_url="https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=400",
            restaurant="Rajesh Spice House",
            latitude=user_rajesh.latitude,
            longitude=user_rajesh.longitude,
            fresh_until=now + timedelta(hours=5),
            pickup_time="7:00 PM - 9:00 PM"
        )
        curry_mutton = Curry(
            user_id=user_rajesh.id,
            name="Mutton Rogan Josh",
            category="Non-Veg",
            quantity=2.0,
            unit="plates",
            price=250.0,
            description="Slow-cooked tender mutton curry infused with Kashmiri red chillies.",
            image_url="https://images.unsplash.com/photo-1545247181-516773cae76d?auto=format&fit=crop&q=80&w=400",
            restaurant="Rajesh Spice House",
            latitude=user_rajesh.latitude,
            longitude=user_rajesh.longitude,
            fresh_until=now + timedelta(hours=4),
            pickup_time="7:00 PM - 9:00 PM"
        )

        print("Seeding curries for Anita (Both)...")
        curry_korma = Curry(
            user_id=user_anita.id,
            name="Mixed Vegetable Korma",
            category="Veg",
            quantity=3.0,
            unit="servings",
            price=100.0,
            description="Rich, mildly spiced vegetable korma cooked in coconut cream.",
            image_url="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?auto=format&fit=crop&q=80&w=400",
            restaurant="Anita's Bistro",
            latitude=user_anita.latitude,
            longitude=user_anita.longitude,
            fresh_until=now + timedelta(hours=6),
            pickup_time="6:00 PM - 8:00 PM"
        )
        curry_fish = Curry(
            user_id=user_anita.id,
            name="Goan Fish Curry",
            category="Non-Veg",
            quantity=2.0,
            unit="servings",
            price=200.0,
            description="Tangy coconut-tamarind fish curry made with fresh kingfish.",
            image_url="https://images.unsplash.com/photo-1626132647523-66f5bf380027?auto=format&fit=crop&q=80&w=400",
            restaurant="Anita's Bistro",
            latitude=user_anita.latitude,
            longitude=user_anita.longitude,
            fresh_until=now + timedelta(hours=5),
            pickup_time="6:30 PM - 8:30 PM"
        )

        db.add_all([curry_paneer, curry_dal, curry_chicken, curry_mutton, curry_korma, curry_fish])
        db.commit()
        print("Database seeded successfully with 4 users and 6 curries!")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
