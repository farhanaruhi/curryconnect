import os
import matplotlib
matplotlib.use('Agg')  # Headless backend to prevent GUI errors on servers
import matplotlib.pyplot as plt
import numpy as np
from typing import List, Tuple

VIS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "visualizations")
os.makedirs(VIS_DIR, exist_ok=True)

def generate_kmeans_scatter(
    coordinates: List[Tuple[float, float]],
    labels: List[int],
    centers: List[Tuple[float, float]],
    filename: str = "kmeans_clusters.png"
) -> str:
    """
    Generate and save a scatter plot of coordinates colored by cluster, with cluster centers highlighted.
    """
    plt.figure(figsize=(8, 6))
    coords = np.array(coordinates)
    labels = np.array(labels)
    centers = np.array(centers)
    
    unique_labels = np.unique(labels)
    scatter = plt.scatter(
        coords[:, 1], coords[:, 0], # x=longitude, y=latitude
        c=labels, cmap='tab10', alpha=0.6, edgecolors='none', s=50
    )
    
    # Draw centers
    if len(centers) > 0:
        plt.scatter(
            centers[:, 1], centers[:, 0],
            c='red', marker='x', s=200, linewidths=3, label='Centroids'
        )
        
    plt.title("Geographical Curry Clusters (K-Means)", fontsize=14, pad=15)
    plt.xlabel("Longitude", fontsize=12)
    plt.ylabel("Latitude", fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.5)
    if len(centers) > 0:
        plt.legend()
        
    # Apply modern aesthetics (minimal borders)
    plt.gca().spines['top'].set_visible(False)
    plt.gca().spines['right'].set_visible(False)
    
    path = os.path.join(VIS_DIR, filename)
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()
    return path

def generate_elbow_curve(
    k_values: List[int],
    inertias: List[float],
    filename: str = "elbow_curve.png"
) -> str:
    """
    Generate and save the Elbow Curve plot (inertia vs K).
    """
    plt.figure(figsize=(7, 5))
    plt.plot(k_values, inertias, 'o-', color='#e67e22', linewidth=2, markersize=8)
    plt.title("Elbow Method for Optimal K", fontsize=14, pad=15)
    plt.xlabel("Number of Clusters (K)", fontsize=12)
    plt.ylabel("Inertia / WCSS", fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.5)
    plt.xticks(k_values)
    
    plt.gca().spines['top'].set_visible(False)
    plt.gca().spines['right'].set_visible(False)
    
    path = os.path.join(VIS_DIR, filename)
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()
    return path

def generate_recommendation_score_dist(
    scores: List[float],
    filename: str = "recommendation_score_distribution.png"
) -> str:
    """
    Generate and save a histogram of recommendation scores.
    """
    plt.figure(figsize=(7, 5))
    plt.hist(scores, bins=15, color='#2ecc71', edgecolor='white', alpha=0.7)
    plt.title("Recommendation Score Distribution", fontsize=14, pad=15)
    plt.xlabel("Recommendation Score", fontsize=12)
    plt.ylabel("Count", fontsize=12)
    plt.grid(True, linestyle='--', alpha=0.5)
    
    plt.gca().spines['top'].set_visible(False)
    plt.gca().spines['right'].set_visible(False)
    
    path = os.path.join(VIS_DIR, filename)
    plt.tight_layout()
    plt.savefig(path, dpi=150)
    plt.close()
    return path
