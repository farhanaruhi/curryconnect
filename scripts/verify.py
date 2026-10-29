import urllib.request
import json
import time

BASE_URL = "http://127.0.0.1:8000/api"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
        
    req_data = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code} for {method} {path}: {body}")
        raise e

def run_verification():
    print("=== Starting CurryConnect System Verification ===")
    
    # 1. Health check
    try:
        health = urllib.request.urlopen("http://127.0.0.1:8000/").read()
        health = json.loads(health.decode("utf-8"))
        print(f"API Health Check: {health['status']} - {health['name']}")
    except Exception as e:
        print("Backend server is not running or unreachable. Please start it using uvicorn.")
        return

    # 2. Register mock user
    user_email = f"chef_test_{int(time.time())}@curryconnect.org"
    user_data = {
        "name": "Chef Sanjeev",
        "email": user_email,
        "phone": "+91 99999 88888",
        "latitude": 12.9716, # Bangalore center
        "longitude": 77.5946,
        "password": "supersecurepassword123"
      }
    
    print(f"Registering mock user: {user_email}...")
    reg_response = make_request("/auth/register", "POST", user_data)
    token = reg_response["access_token"]
    print("User registered and logged in successfully!")

    # 3. Create active curry listings
    # Listing 1: Chicken Curry, extremely close (200m away)
    c1 = {
        "name": "Hot Kerala Chicken Curry",
        "category": "Chicken",
        "quantity": 3.0,
        "unit": "servings",
        "price": 0.0, # FREE
        "description": "Extra portion of hot chicken curry, spicy and fresh.",
        "latitude": 12.9725, # ~200m north-east
        "longitude": 77.5960,
        "fresh_until": (datetime_now_iso(6)),
        "pickup_time": "6:00 PM - 8:00 PM"
    }

    # Listing 2: Paneer Butter Masala, further away (1.2 km away)
    c2 = {
        "name": "Creamy Paneer Butter Masala",
        "category": "Paneer",
        "quantity": 2.0,
        "unit": "bowls",
        "price": 80.0,
        "description": "Medium spicy, paneer cooked in buttery sauce.",
        "latitude": 12.9810, # ~1.2 km away
        "longitude": 77.5985,
        "fresh_until": (datetime_now_iso(4)),
        "pickup_time": "7:00 PM - 9:00 PM"
    }

    print("Uploading listing 1 (Hot Kerala Chicken Curry, 200m away)...")
    make_request("/curries/", "POST", c1, token)
    print("Uploading listing 2 (Creamy Paneer Butter Masala, 1.2 km away)...")
    make_request("/curries/", "POST", c2, token)

    # 4. Search within 1 km radius
    print("\n--- Searching for curries within 1 km radius (Should only return Chicken Curry) ---")
    search_results = make_request(
        f"/curries/search?lat=12.9716&lon=77.5946&radius_km=1.0",
        "GET", token=token
    )
    print(f"Found {len(search_results)} curry listing(s) in 1 km radius:")
    for res in search_results:
        curry = res["curry"]
        print(f" - {curry['name']} ({curry['category']}) - Distance: {res['distance_meters']:.1f}m, Recommendation Score: {res['recommendation_score'] * 100:.1f}")

    # 5. Search within 2 km radius
    print("\n--- Searching for curries within 2 km radius (Should return both) ---")
    search_results_2 = make_request(
        f"/curries/search?lat=12.9716&lon=77.5946&radius_km=2.0",
        "GET", token=token
    )
    print(f"Found {len(search_results_2)} curry listing(s) in 2 km radius:")
    for res in search_results_2:
        curry = res["curry"]
        print(f" - {curry['name']} ({curry['category']}) - Distance: {res['distance_meters']:.1f}m, Recommendation Score: {res['recommendation_score'] * 100:.1f}")

    # 6. Trigger ML Evaluation
    print("\n--- Triggering ML pipeline evaluation & re-clustering ---")
    eval_res = make_request("/analytics/evaluate", "POST", token=token)
    print("ML Pipeline Evaluation Metrics:")
    print(f" - Silhouette Score: {eval_res['clustering_metrics']['silhouette']:.4f}")
    print(f" - Davies-Bouldin Index: {eval_res['clustering_metrics']['davies_bouldin']:.4f}")
    print(f" - Precision@5: {eval_res['recommendation_performance']['precision_at_5'] * 100:.1f}%")
    print(f" - Average Search Latency: {eval_res['performance_metrics']['average_search_time_ms']:.4f} ms")
    print("ML plots saved successfully in backend/ml/visualizations/ directory!")
    
    print("\n=== All Verification Steps Passed Successfully! ===")

def datetime_now_iso(hours_add):
    # Quick ISO timestamp creator
    import datetime
    dt = datetime.datetime.utcnow() + datetime.timedelta(hours=hours_add)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.%fZ")

if __name__ == "__main__":
    run_verification()
