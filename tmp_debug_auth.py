from backend.api.auth import register
from backend.database.connection import SessionLocal
from backend.schemas.schemas import UserRegister
import traceback


db = SessionLocal()
try:
    user_data = UserRegister(
        name='Test User',
        email='test2@example.com',
        password='12345678',
        phone='+919999999999',
        latitude=12.9716,
        longitude=77.5946,
    )
    print(register(user_data, db))
except Exception as e:
    traceback.print_exc()
finally:
    db.close()
