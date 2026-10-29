import api from './api';

export interface DashboardStats {
  total_uploaded: number;
  nearby_count: number;
  today_searches: number;
  waste_prevented_servings: number;
}

export interface AnalyticsData {
  upload_trends: { date: string; count: number }[];
  popular_categories: { name: string; value: number }[];
  cluster_stats: { id: number; center: [number, number]; count: number }[];
  recommendation_performance: {
    precision: number;
    recall: number;
    f1_score: number;
    ndcg: number;
    avg_search_time_ms: number;
  };
  search_success_rate: number;
}

export interface MLEvaluationResult {
  status: string;
  clustering_metrics: {
    silhouette: number;
    davies_bouldin: number;
    calinski_harabasz: number;
  };
  recommendation_performance: {
    precision_at_5: number;
    recall_at_5: number;
    f1_score_at_5: number;
    ndcg_at_5: number;
  };
  performance_metrics: {
    average_search_time_ms: number;
    latency_ms: number;
  };
  charts: {
    kmeans_clusters: string;
    elbow_curve: string;
    recommendation_score_dist: string;
  };
}

export const analyticsService = {
  getStats: async (lat: number, lon: number): Promise<any> => {
    const response = await api.get('/analytics/stats', { params: { lat, lon } });
    return response.data;
  },

  getDashboardAnalytics: async (): Promise<AnalyticsData> => {
    const response = await api.get<AnalyticsData>('/analytics/dashboard');
    return response.data;
  },

  runEvaluation: async (): Promise<MLEvaluationResult> => {
    const response = await api.post<MLEvaluationResult>('/analytics/evaluate');
    return response.data;
  }
};
