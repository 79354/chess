import api from './api';

class UserService {
  async getUserProfile(username) {
    try {
      const response = await api.get(`/auth/users/${username}/`, { auth: false });
      return { success: true, user: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async searchUsers(query) {
    try {
      const response = await api.get('/auth/users/search/', {
        params: { q: query }
      });
      return { success: true, users: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getUserStats(username) {
    try {
      const response = await api.get(`/auth/users/${username}/stats/`);
      return { success: true, stats: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateUserStatus(isOnline) {
    try {
      const response = await api.patch('/auth/me/', {
        is_online: isOnline
      });
      return { success: true, user: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getFriends() {
    try {
      const response = await api.get('/auth/friends/');
      return { success: true, friends: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendFriendRequest(userId) {
    try {
      const response = await api.post('/auth/friends/request/', {
        user_id: userId
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async acceptFriendRequest(requestId) {
    try {
      const response = await api.post('/auth/friends/accept/', {
        request_id: requestId
      });
      return { success: true, data: response };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async rejectFriendRequest(requestId) {
    try {
      const response = await api.post('/auth/friends/reject/', {
        request_id: requestId
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async removeFriend(userId) {
    try {
      const response = await api.delete(`/auth/friends/${userId}/`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default new UserService();