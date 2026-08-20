import { create } from 'zustand';
import { mainApi } from '../utils/apiClient';

export const useNotificationStore = create((set) => ({
  notifications: [], // All notifications (for dashboard)
  recentNotifications: [], // Only 2 most recent (for bell icon)
  unreadCount: 0,

  // Fetch recent notifications (for bell icon - 2 most recent)
  fetchRecentNotifications: async () => {
    try {
      const response = await mainApi.get('/notifications/recent');
      const data = response.data;
      if (!Array.isArray(data)) throw new Error('Expected array of notifications');
      // Deduplicate fetched data
      const uniqueData = data.filter((n, i, arr) => arr.findIndex(x => x._id === n._id) === i);
      set({ recentNotifications: uniqueData });
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
    }
  },

  // Fetch all notifications (for dashboard)
  fetchNotifications: async () => {
    try {
      const response = await mainApi.get('/notifications');
      const data = response.data;
      if (!Array.isArray(data)) throw new Error('Expected array of notifications');
      // Deduplicate fetched data
      const uniqueData = data.filter((n, i, arr) => arr.findIndex(x => x._id === n._id) === i);
      set({ notifications: uniqueData });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  },

  // Fetch unread count
  fetchUnreadCount: async () => {
    try {
      const response = await mainApi.get('/notifications/unread-count');
      const data = response.data;
      if (!data || typeof data.count !== 'number') throw new Error('Invalid unread count structure');
      set({ unreadCount: data.count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  },

  // Mark single notification as read
  markAsRead: async (id) => {
    try {
      const response = await mainApi.patch(`/notifications/${id}/read`);

      if (response.status !== 200) throw new Error('Failed to mark as read');

      // Update both lists
      set((state) => ({
        notifications: state.notifications.map(n =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        recentNotifications: state.recentNotifications.map(n =>
          n._id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      const response = await mainApi.patch('/notifications/read-all');

      if (response.status !== 200) throw new Error('Failed to mark all as read');

      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, isRead: true })),
        recentNotifications: state.recentNotifications.map(n => ({ ...n, isRead: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  },

  // Delete a notification
  deleteNotification: async (id) => {
    try {
      const response = await mainApi.delete(`/notifications/${id}`);

      if (response.status !== 200) throw new Error('Failed to delete notification');

      set((state) => {
        const deletedNotif = state.notifications.find(n => n._id === id);
        return {
          notifications: state.notifications.filter(n => n._id !== id),
          recentNotifications: state.recentNotifications.filter(n => n._id !== id),
          unreadCount: deletedNotif && !deletedNotif.isRead
            ? Math.max(0, state.unreadCount - 1)
            : state.unreadCount
        };
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  },

  // Add new notification from socket (real-time)
  addNotification: (notification) =>
    set((state) => {
      // ⛔ Prevent duplicates by ID
      if (state.notifications.some(n => n._id === notification._id)) {
        return state;
      }

      // ⛔ Prevent duplicates by Content (type, message, title)
      // EXCEPT for system notifications like ticket updates
      if (notification.type !== 'system') {
        const isDuplicateContent = state.notifications.some(n =>
          n.type === notification.type &&
          n.title === notification.title &&
          n.message === notification.message
        );

        if (isDuplicateContent) {
          return state;
        }
      }

      return {
        notifications: [notification, ...state.notifications],
        recentNotifications: [notification, ...state.recentNotifications]
          .filter((n, i, arr) => arr.findIndex(x => x._id === n._id) === i)
          .slice(0, 2),
        unreadCount: notification.isRead
          ? state.unreadCount
          : state.unreadCount + 1,
      };
    }),
}));