from backend.api.auth import login
from backend.database.connection import SessionLocal
from backend.schemas.schemas import UserLogin
import traceback


db = SessionLocal()
try:
    login_data = UserLogin(email='test2@example.com', password='12345678')
    print(login(login_data, db))
except Exception as e:
    traceback.print_exc()
finally:
    db.close()
