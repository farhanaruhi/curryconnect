import os
import pickle
import numpy as np
from typing import List, Tuple, Dict, Any, Optional
from sklearn.cluster import KMeans

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "kmeans_model.pkl")

class KMeansService:
    def __init__(self):
        os.makedirs(MODEL_DIR, exist_ok=True)
        self.model: Optional[KMeans] = None
        self.cluster_centers: List[Tuple[float, float]] = []
        self.load_model()

    def load_model(self) -> bool:
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, "rb") as f:
                    data = pickle.load(f)
                    self.model = data.get("model")
                    self.cluster_centers = data.get("centers", [])
                return True
            except Exception as e:
                print(f"Error loading KMeans model: {e}")
        return False

    def save_model(self) -> None:
        if self.model:
            try:
                data = {
                    "model": self.model,
                    "centers": self.cluster_centers
                }
                with open(MODEL_PATH, "wb") as f:
                    pickle.dump(data, f)
            except Exception as e:
                print(f"Error saving KMeans model: {e}")

    def train(self, coordinates: List[Tuple[float, float]], n_clusters: int = None) -> Dict[str, Any]:
        """
        Train KMeans model on coordinates. If coordinates length is small, do not cluster.
        """
        n_samples = len(coordinates)
        if n_samples < 3:
            self.model = None
            self.cluster_centers = coordinates
            return {"status": "too_few_samples", "n_clusters": 0}

        # Select optimal cluster count if not specified
        if n_clusters is None:
            n_clusters = min(int(np.sqrt(n_samples / 2)) + 1, 10)
            n_clusters = max(n_clusters, 2)
            n_clusters = min(n_clusters, n_samples)

        X = np.array(coordinates)
        self.model = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
        self.model.fit(X)
        self.cluster_centers = [tuple(c) for c in self.model.cluster_centers_]
        self.save_model()

        return {
            "status": "success",
            "n_clusters": n_clusters,
            "inertia": float(self.model.inertia_),
            "labels": self.model.labels_.tolist()
        }

    def predict_cluster(self, lat: float, lon: float) -> int:
        """
        Predict cluster for a given coordinate. If no model, return -1.
        """
        if self.model is None or not hasattr(self.model, "cluster_centers_"):
            return -1
        
        X = np.array([[lat, lon]])
        return int(self.model.predict(X)[0])

    def get_nearby_clusters(self, lat: float, lon: float, radius_km: float = 1.0) -> List[int]:
        """
        Find all clusters whose centers are within (radius_km + cluster_radius) from user.
        To avoid edge effects, we search clusters within a reasonable distance.
        """
        if not self.cluster_centers:
            return []
        
        # Calculate distance to all cluster centers
        from ml.recommendation.scorer import haversine_distance
        nearby = []
        for i, center in enumerate(self.cluster_centers):
            dist = haversine_distance(lat, lon, center[0], center[1])
            # If cluster center is within 5 km, search in it (broad sweep, then precise haversine filter)
            if dist <= 5000: # 5 km
                nearby.append(i)
                
        return nearby
