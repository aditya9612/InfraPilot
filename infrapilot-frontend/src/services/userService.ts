import api from './api';
import type { User } from '../types/user';

export const userService = {
  /**
   * Get list of users with pagination and search
   * GET /api/v1/users
   */
  async getAllUsers(limit = 20, skip = 0, search = "") {
    const params: any = { limit, skip };
    if (search) params.search = search;
    
    try {
      const response = await api.get('/users', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Get Users API Error details:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Create a new user
   * POST /api/v1/users/create
   */
  async createUser(userData: any) {
    // Remove user_id so we don't send `user_id: 0` which often causes 422
    const payload = { ...userData };
    delete payload.user_id;

    try {
      const response = await api.post('/users/create', payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Create User API Error details:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Get user by ID
   * GET /api/v1/users/{user_id}
   */
  async getUserById(userId: number) {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  /**
   * Update user by ID
   * PUT /api/v1/users/{user_id}
   */
  async updateUser(userId: number, userData: Partial<User>) {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  /**
   * Delete user by ID
   * DELETE /api/v1/users/{user_id}
   */
  async deleteUser(userId: number) {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  }
};
