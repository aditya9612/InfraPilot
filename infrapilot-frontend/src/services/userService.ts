import api from './api';
import type { User } from '../types/user';

export const userService = {
  /**
   * Get list of users with pagination and search
   * GET /api/v1/users
   */
  async getAllUsers(limit = 20, offset = 0, search = "") {
    const params: any = { limit, offset };
    if (search) params.search = search;
    
    const response = await api.get('/users', { params });
    return response.data;
  },

  /**
   * Create a new user
   * POST /api/v1/users/create
   */
  async createUser(userData: Partial<User>) {
    const response = await api.post('/users/create', userData);
    return response.data;
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
