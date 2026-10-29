import numpy as np
from typing import List, Dict, Any, Tuple
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
from sklearn.cluster import KMeans

def evaluate_clustering_metrics(X: np.ndarray, labels: np.ndarray) -> Dict[str, float]:
    """
    Calculate Silhouette, Davies-Bouldin, and Calinski-Harabasz metrics.
    """
    if len(np.unique(labels)) < 2:
        return {
            "silhouette": 0.0,
            "davies_bouldin": 0.0,
            "calinski_harabasz": 0.0
        }
    
    sil = float(silhouette_score(X, labels))
    db = float(davies_bouldin_score(X, labels))
    ch = float(calinski_harabasz_score(X, labels))
    
    return {
        "silhouette": round(sil, 4),
        "davies_bouldin": round(db, 4),
        "calinski_harabasz": round(ch, 4)
    }

def run_elbow_method(X: np.ndarray, max_k: int = 10) -> Dict[str, List[float]]:
    """
    Run KMeans for K from 2 to max_k to compute inertia and silhouette scores for the Elbow method.
    """
    k_values = list(range(2, min(max_k + 1, len(X))))
    inertias = []
    silhouettes = []
    
    for k in k_values:
        km = KMeans(n_clusters=k, random_state=42, n_init='auto')
        labels = km.fit_predict(X)
        inertias.append(float(km.inertia_))
        silhouettes.append(float(silhouette_score(X, labels)))
        
    return {
        "k": k_values,
        "inertias": inertias,
        "silhouettes": silhouettes
    }

def calculate_precision_recall_at_k(
    recommended_ids: List[int],
    relevant_ids: List[int],
    k: int = 5
) -> Tuple[float, float, float]:
    """
    Compute Precision@K, Recall@K, and F1@K.
    """
    if not relevant_ids or not recommended_ids:
        return 0.0, 0.0, 0.0
        
    top_k = recommended_ids[:k]
    hits = len(set(top_k) & set(relevant_ids))
    
    precision = hits / k
    recall = hits / len(relevant_ids)
    
    f1 = 0.0
    if (precision + recall) > 0:
        f1 = 2 * (precision * recall) / (precision + recall)
        
    return precision, recall, f1

def calculate_ndcg_at_k(
    recommended_ids: List[int],
    relevant_ids: List[int],
    k: int = 5
) -> float:
    """
    Calculate Normalized Discounted Cumulative Gain (NDCG) at K.
    Binary relevance is assumed (1 if relevant, 0 otherwise).
    """
    if not relevant_ids or not recommended_ids:
        return 0.0
        
    top_k = recommended_ids[:k]
    dcg = 0.0
    for i, item_id in enumerate(top_k):
        if item_id in relevant_ids:
            dcg += 1.0 / np.log2(i + 2) # i + 2 because index starts at 0, so position is i + 1
            
    # Calculate IDCG (Ideal DCG)
    idcg = 0.0
    n_relevant = min(len(relevant_ids), k)
    for i in range(n_relevant):
        idcg += 1.0 / np.log2(i + 2)
        
    if idcg == 0.0:
        return 0.0
        
    return float(dcg / idcg)
