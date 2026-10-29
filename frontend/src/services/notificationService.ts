import api from './api';

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export const notificationService = {
  getMyNotifications: async (): Promise<NotificationItem[]> => {
    const response = await api.get<NotificationItem[]>('/notifications/');
    return response.data;
  },

  markAsRead: async (id: number): Promise<NotificationItem> => {
    const response = await api.put<NotificationItem>(`/notifications/${id}/read`);
    return response.data;
  }
};
