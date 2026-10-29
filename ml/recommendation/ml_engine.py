"""
Content-based similarity and Random Forest satisfaction prediction
for Smart Curry Finder recommendation engine.
"""
from __future__ import annotations

import math
import os
import pickle
from datetime import datetime
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "models")
RF_MODEL_PATH = os.path.join(MODEL_DIR, "satisfaction_rf.pkl")
TFIDF_PATH = os.path.join(MODEL_DIR, "curry_tfidf.pkl")

CATEGORY_KEYWORDS = {
    "Veg": "paneer butter masala dal lentil mushroom vegetable vegetarian cottage cheese salad organic clean",
    "Non-Veg": "chicken mutton fish prawn seafood beef egg meat non-vegetarian spicy",
}


class RecommendationEngine:
    def __init__(self) -> None:
        os.makedirs(MODEL_DIR, exist_ok=True)
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        self.curry_ids: List[int] = []
        self.rf_model: Optional[RandomForestRegressor] = None
        self._load_models()

    def _load_models(self) -> None:
        if os.path.exists(TFIDF_PATH):
            try:
                with open(TFIDF_PATH, "rb") as f:
                    data = pickle.load(f)
                    self.vectorizer = data.get("vectorizer")
                    self.tfidf_matrix = data.get("matrix")
                    self.curry_ids = data.get("curry_ids", [])
            except Exception as exc:
                print(f"Error loading TF-IDF model: {exc}")

        if os.path.exists(RF_MODEL_PATH):
            try:
                with open(RF_MODEL_PATH, "rb") as f:
                    self.rf_model = pickle.load(f)
            except Exception as exc:
                print(f"Error loading Random Forest model: {exc}")

    def _curry_document(self, name: str, category: str, description: Optional[str]) -> str:
        base = CATEGORY_KEYWORDS.get(category, category.lower())
        return f"{name} {category} {base} {description or ''}".lower()

    def fit_content_index(self, curries: List[Any]) -> None:
        if not curries:
            return

        docs = [
            self._curry_document(c.name, c.category, c.description)
            for c in curries
        ]
        self.curry_ids = [c.id for c in curries]
        self.vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
        self.tfidf_matrix = self.vectorizer.fit_transform(docs)

        with open(TFIDF_PATH, "wb") as f:
            pickle.dump(
                {
                    "vectorizer": self.vectorizer,
                    "matrix": self.tfidf_matrix,
                    "curry_ids": self.curry_ids,
                },
                f,
            )

    def content_similarity(
        self,
        curry_id: int,
        query: Optional[str],
        preferred_category: Optional[str],
        dietary_pref: Optional[str] = None,
    ) -> float:
        if self.vectorizer is None or self.tfidf_matrix is None or curry_id not in self.curry_ids:
            return 0.5

        idx = self.curry_ids.index(curry_id)
        preference_parts = [
            query or "",
            preferred_category or "",
            dietary_pref or "",
        ]
        preference_text = " ".join(preference_parts).strip()
        if not preference_text:
            return 0.5

        pref_vec = self.vectorizer.transform([preference_text.lower()])
        sim = cosine_similarity(pref_vec, self.tfidf_matrix[idx : idx + 1])[0][0]
        return float(max(0.0, min(1.0, sim)))

    def train_satisfaction_model(self, training_rows: List[Dict[str, float]]) -> Dict[str, Any]:
        if len(training_rows) < 5:
            return {"status": "too_few_samples", "count": len(training_rows)}

        feature_names = [
            "distance_km",
            "price",
            "quantity",
            "seller_rating",
            "content_similarity",
            "freshness_hours",
        ]
        X = np.array([[row[name] for name in feature_names] for row in training_rows])
        y = np.array([row["rating"] for row in training_rows])

        self.rf_model = RandomForestRegressor(
            n_estimators=100,
            max_depth=8,
            random_state=42,
        )
        self.rf_model.fit(X, y)

        with open(RF_MODEL_PATH, "wb") as f:
            pickle.dump(self.rf_model, f)

        predictions = self.rf_model.predict(X)
        rmse = float(np.sqrt(np.mean((predictions - y) ** 2)))
        mae = float(np.mean(np.abs(predictions - y)))

        return {
            "status": "success",
            "samples": len(training_rows),
            "rmse": round(rmse, 4),
            "mae": round(mae, 4),
        }

    def predict_satisfaction(
        self,
        distance_meters: float,
        price: float,
        quantity: float,
        seller_rating: float,
        content_similarity: float,
        fresh_until: datetime,
    ) -> float:
        freshness_hours = max(0.0, (fresh_until - datetime.utcnow()).total_seconds() / 3600.0)
        features = np.array([[
            distance_meters / 1000.0,
            price,
            quantity,
            seller_rating,
            content_similarity,
            freshness_hours,
        ]])

        if self.rf_model is not None:
            pred = float(self.rf_model.predict(features)[0])
            return round(max(1.0, min(5.0, pred)), 2)

        heuristic = (
            0.25 * max(0.0, 1.0 - distance_meters / 3000.0) * 5.0
            + 0.20 * (seller_rating / 5.0) * 5.0
            + 0.20 * content_similarity * 5.0
            + 0.15 * min(1.0, quantity / 5.0) * 5.0
            + 0.20 * min(1.0, freshness_hours / 12.0) * 5.0
        )
        return round(max(1.0, min(5.0, heuristic)), 2)


recommendation_engine = RecommendationEngine()
