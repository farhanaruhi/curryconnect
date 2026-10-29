from datetime import datetime, timedelta
from typing import List, Tuple, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_
from backend.database.models import User, Curry, Rating, SearchHistory, Cluster
from backend.schemas.schemas import CurryCreate, CurryUpdate
from ml.clustering.kmeans_service import KMeansService
from ml.recommendation.scorer import haversine_distance, calculate_recommendation_score
from ml.recommendation.ml_engine import recommendation_engine
import time

kmeans_service = KMeansService()

class CurryService:
    @staticmethod
    def create_curry(db: Session, curry_data: CurryCreate, user_id: int) -> Curry:
        db_curry = Curry(
            user_id=user_id,
            name=curry_data.name,
            category=curry_data.category,
            quantity=curry_data.quantity,
            unit=curry_data.unit,
            price=curry_data.price,
            description=curry_data.description,
            image_url=curry_data.image_url,
            restaurant=curry_data.restaurant,
            latitude=curry_data.latitude,
            longitude=curry_data.longitude,
            fresh_until=curry_data.fresh_until,
            pickup_time=curry_data.pickup_time
        )
        db.add(db_curry)
        db.commit()
        db.refresh(db_curry)
        
        # Trigger retraining of KMeans when a new curry is uploaded
        CurryService.retrain_kmeans(db)
        CurryService.retrain_ml_models(db)
        
        return db_curry

    @staticmethod
    def update_curry(db: Session, curry_id: int, curry_data: CurryUpdate, user_id: int) -> Optional[Curry]:
        db_curry = db.query(Curry).filter(Curry.id == curry_id, Curry.user_id == user_id).first()
        if not db_curry:
            return None
            
        for key, value in curry_data.model_dump().items():
            setattr(db_curry, key, value)
            
        db.commit()
        db.refresh(db_curry)
        return db_curry

    @staticmethod
    def delete_curry(db: Session, curry_id: int, user_id: int) -> bool:
        db_curry = db.query(Curry).filter(Curry.id == curry_id, Curry.user_id == user_id).first()
        if not db_curry:
            return False
        db.delete(db_curry)
        db.commit()
        
        # Retrain after deletion
        CurryService.retrain_kmeans(db)
        return True

    @staticmethod
    def get_curry(db: Session, curry_id: int) -> Optional[Curry]:
        return db.query(Curry).filter(Curry.id == curry_id).first()

    @staticmethod
    def retrain_kmeans(db: Session) -> Dict[str, Any]:
        """
        Retrain KMeans model on all active, fresh curries and save cluster details to db.
        """
        now = datetime.utcnow()
        active_curries = db.query(Curry).filter(Curry.fresh_until > now).all()
        
        coords = [(c.latitude, c.longitude) for c in active_curries]
        
        # Train model
        train_result = kmeans_service.train(coords)
        
        # Sync database clusters table
        db.query(Cluster).delete()
        
        if train_result["status"] == "success" and kmeans_service.model:
            centers = kmeans_service.cluster_centers
            labels = train_result["labels"]
            
            # Count elements per cluster
            counts = {}
            for label in labels:
                counts[label] = counts.get(label, 0) + 1
                
            for i, center in enumerate(centers):
                db_cluster = Cluster(
                    id=i,
                    center_latitude=center[0],
                    center_longitude=center[1],
                    curry_count=counts.get(i, 0)
                )
                db.add(db_cluster)
            db.commit()
            
        return train_result

    @staticmethod
    def retrain_ml_models(db: Session) -> Dict[str, Any]:
        now = datetime.utcnow()
        active_curries = db.query(Curry).filter(Curry.fresh_until > now).all()
        recommendation_engine.fit_content_index(active_curries)

        training_rows = []
        ratings = db.query(Rating).all()
        for rating in ratings:
            curry = db.query(Curry).filter(Curry.id == rating.curry_id).first()
            if not curry or not curry.owner:
                continue
            content_sim = recommendation_engine.content_similarity(
                curry.id, curry.name, curry.category
            )
            training_rows.append({
                "distance_km": 0.5,
                "price": curry.price,
                "quantity": curry.quantity,
                "seller_rating": curry.owner.rating,
                "content_similarity": content_sim,
                "freshness_hours": max(
                    0.0,
                    (curry.fresh_until - datetime.utcnow()).total_seconds() / 3600.0,
                ),
                "rating": float(rating.rating),
            })

        if len(training_rows) < 5:
            for curry in active_curries[:10]:
                if not curry.owner:
                    continue
                content_sim = recommendation_engine.content_similarity(
                    curry.id, curry.name, curry.category
                )
                training_rows.append({
                    "distance_km": 0.8,
                    "price": curry.price,
                    "quantity": curry.quantity,
                    "seller_rating": curry.owner.rating,
                    "content_similarity": content_sim,
                    "freshness_hours": max(
                        0.0,
                        (curry.fresh_until - datetime.utcnow()).total_seconds() / 3600.0,
                    ),
                    "rating": max(3.5, min(5.0, curry.owner.rating)),
                })

        return recommendation_engine.train_satisfaction_model(training_rows)

    @staticmethod
    def _build_search_results(
        db: Session,
        candidate_curries: List[Curry],
        lat: float,
        lon: float,
        radius_km: float,
        category: Optional[str],
        query: Optional[str],
        expanded_radius: bool,
    ) -> List[Dict[str, Any]]:
        now = datetime.utcnow()
        results = []
        radius_meters = radius_km * 1000.0

        for c in candidate_curries:
            if query and query.lower() not in c.name.lower() and (
                not c.description or query.lower() not in c.description.lower()
            ):
                continue

            if category and c.category != category:
                continue

            dist = haversine_distance(lat, lon, c.latitude, c.longitude)
            if dist > radius_meters:
                continue

            owner_rating = c.owner.rating if c.owner else 5.0
            popularity = db.query(SearchHistory).filter(
                SearchHistory.query.like(f"%{c.name}%")
            ).count()

            content_sim = recommendation_engine.content_similarity(
                c.id, query, category or c.category
            )
            predicted = recommendation_engine.predict_satisfaction(
                distance_meters=dist,
                price=c.price,
                quantity=c.quantity,
                seller_rating=owner_rating,
                content_similarity=content_sim,
                fresh_until=c.fresh_until,
            )

            score_info = calculate_recommendation_score(
                distance_meters=dist,
                fresh_until=c.fresh_until,
                created_at=c.created_at,
                quantity=c.quantity,
                seller_rating=owner_rating,
                popularity_score=float(popularity),
            )

            avg_rating = 5.0
            ratings = db.query(Rating).filter(Rating.curry_id == c.id).all()
            if ratings:
                avg_rating = sum(r.rating for r in ratings) / len(ratings)

            weighted_score = (
                0.30 * score_info["score"]
                + 0.25 * content_sim
                + 0.20 * (predicted / 5.0)
                + 0.15 * (avg_rating / 5.0)
                + 0.10 * max(0.0, 1.0 - (dist / radius_meters))
            )

            results.append({
                "curry": c,
                "distance_meters": dist,
                "recommendation_score": round(weighted_score, 4),
                "score_breakdown": score_info["breakdown"],
                "is_fresh": c.fresh_until > now,
                "average_rating": avg_rating,
                "content_similarity": round(content_sim, 4),
                "predicted_satisfaction": predicted,
                "expanded_radius": expanded_radius,
            })

        results.sort(key=lambda x: x["recommendation_score"], reverse=True)
        return results

    @staticmethod
    def _get_candidate_curries(
        db: Session,
        lat: float,
        lon: float,
        user_pref: Optional[str] = None,
        exclude_user_id: Optional[int] = None
    ) -> List[Curry]:
        now = datetime.utcnow()
        has_clustering = kmeans_service.model is not None

        # Build SQL filters
        filters = [Curry.fresh_until > now]
        if user_pref and user_pref != "Both":
            filters.append(Curry.category == user_pref)
        if exclude_user_id:
            filters.append(Curry.user_id != exclude_user_id)

        all_fresh_curries = db.query(Curry).filter(*filters).all()

        if has_clustering:
            nearby_cluster_ids = kmeans_service.get_nearby_clusters(lat, lon)

            candidate_curries = []
            for c in all_fresh_curries:
                c_cluster = kmeans_service.predict_cluster(c.latitude, c.longitude)
                if c_cluster in nearby_cluster_ids:
                    candidate_curries.append(c)

            if not candidate_curries:
                candidate_curries = all_fresh_curries
        else:
            candidate_curries = all_fresh_curries

        return candidate_curries

    @staticmethod
    def search_nearby(
        db: Session,
        lat: float,
        lon: float,
        radius_km: float = 1.0,
        category: Optional[str] = None,
        query: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Perform a location-based search using K-Means clustering + Haversine filtering.
        """
        start_time = time.perf_counter()
        
        # Save to search history
        search_log = SearchHistory(
            user_id=user_id,
            query=query,
            latitude=lat,
            longitude=lon
        )
        db.add(search_log)
        db.commit()

        # Fetch user preference if logged in
        user_pref = None
        if user_id:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user_pref = user.preference

        candidate_curries = CurryService._get_candidate_curries(
            db, lat, lon, user_pref=user_pref, exclude_user_id=user_id
        )
        results = CurryService._build_search_results(
            db, candidate_curries, lat, lon, radius_km, category, query, expanded_radius=False
        )

        if not results and radius_km <= 1.0:
            expanded_radius_km = 3.0
            results = CurryService._build_search_results(
                db,
                candidate_curries,
                lat,
                lon,
                expanded_radius_km,
                category,
                query,
                expanded_radius=True,
            )

            if not results and query:
                similar_results = []
                for c in candidate_curries:
                    content_sim = recommendation_engine.content_similarity(
                        c.id, query, category
                    )
                    if content_sim >= 0.15:
                        dist = haversine_distance(lat, lon, c.latitude, c.longitude)
                        if dist <= expanded_radius_km * 1000.0:
                            similar_results.append((content_sim, c, dist))

                similar_results.sort(key=lambda x: x[0], reverse=True)
                for content_sim, c, dist in similar_results[:5]:
                    owner_rating = c.owner.rating if c.owner else 5.0
                    predicted = recommendation_engine.predict_satisfaction(
                        distance_meters=dist,
                        price=c.price,
                        quantity=c.quantity,
                        seller_rating=owner_rating,
                        content_similarity=content_sim,
                        fresh_until=c.fresh_until,
                    )
                    avg_rating = 5.0
                    ratings = db.query(Rating).filter(Rating.curry_id == c.id).all()
                    if ratings:
                        avg_rating = sum(r.rating for r in ratings) / len(ratings)

                    results.append({
                        "curry": c,
                        "distance_meters": dist,
                        "recommendation_score": round(content_sim * 0.6 + (predicted / 5.0) * 0.4, 4),
                        "score_breakdown": {},
                        "is_fresh": c.fresh_until > datetime.utcnow(),
                        "average_rating": avg_rating,
                        "content_similarity": round(content_sim, 4),
                        "predicted_satisfaction": predicted,
                        "expanded_radius": True,
                    })
        
        latency_ms = (time.perf_counter() - start_time) * 1000.0
        print(
            f"Search completed in {latency_ms:.2f} ms. "
            f"Results: {len(results)} (expanded={any(r.get('expanded_radius') for r in results)})"
        )
        
        return results

    @staticmethod
    def add_rating(db: Session, user_id: int, curry_id: int, rating_val: int, review: Optional[str]) -> Rating:
        db_rating = Rating(
            user_id=user_id,
            curry_id=curry_id,
            rating=rating_val,
            review=review
        )
        db.add(db_rating)
        db.commit()
        db.refresh(db_rating)

        # Recalculate seller's overall rating
        curry = db.query(Curry).filter(Curry.id == curry_id).first()
        if curry:
            seller = db.query(User).filter(User.id == curry.user_id).first()
            if seller:
                # Get all ratings for all curries owned by this seller
                all_ratings = db.query(Rating).join(Curry).filter(Curry.user_id == seller.id).all()
                if all_ratings:
                    seller.rating = sum(r.rating for r in all_ratings) / len(all_ratings)
                    db.commit()
                    
        return db_rating
