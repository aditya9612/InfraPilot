import api from "./api";
import type { User, RoleCounts } from "../types/user";

export const userService = {
  /**
   * Get list of users with pagination and search
   * GET /api/v1/users
   */
  async getAllUsers(limit = 20, skip = 0, search = "") {
    const params: any = { limit, skip };
    if (search) params.search = search;

    try {
      const response = await api.get("/users", { params });
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
    const formData = new FormData();
    const queryParams: any = { ...userData };
    delete queryParams.user_id;

    if (queryParams.joining_date === '') {
      queryParams.joining_date = null;
    }

    if (queryParams.aadhaar_number) {
      queryParams.aadhaar_number = queryParams.aadhaar_number.replace(/-/g, '');
    }

    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === undefined || queryParams[key] === null || queryParams[key] === '') {
        delete queryParams[key];
      }
    });

    // Only send the file in FormData, everything else must be in queryParams
    if (userData.profile_image && userData.profile_image instanceof File) {
      formData.append("profile_image", userData.profile_image);
      delete queryParams.profile_image;
    } else {
      delete queryParams.profile_image;
    }

    try {
      const response = await api.post("/users/create", formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: Object.keys(queryParams).length > 0 ? queryParams : undefined
      });
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
  async updateUser(userId: number, userData: Partial<User> & { password?: string, profile_image?: any }) {
    const formData = new FormData();
    const queryParams: any = { ...userData };
    delete queryParams.user_id;

    if (queryParams.aadhaar_number) {
      queryParams.aadhaar_number = queryParams.aadhaar_number.replace(/-/g, '');
    }

    if (queryParams.joining_date === '') {
      queryParams.joining_date = null;
    }

    Object.keys(queryParams).forEach(key => {
      if (queryParams[key] === undefined || queryParams[key] === null || queryParams[key] === '') {
        delete queryParams[key];
      }
    });

    if (userData.profile_image && userData.profile_image instanceof File) {
      formData.append("profile_image", userData.profile_image);
      delete queryParams.profile_image;
    } else {
      delete queryParams.profile_image;
    }

    const response = await api.put(`/users/${userId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined
    });
    return response.data;
  },

  /**
   * Delete user by ID
   * DELETE /api/v1/users/{user_id}
   */
  async deleteUser(userId: number) {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  /**
   * Get role-based user counts
   * GET /api/v1/users/role-counts
   */
  async getRoleCounts(): Promise<RoleCounts> {
    try {
      const response = await api.get("/users/role-counts");
      return response.data;
    } catch (error: any) {
      console.error("Get Role Counts Error:", error.response?.data || error.message);
      return {};
    }
  },

  /**
   * Get list of roles with optional active/inactive filter
   * GET /api/v1/users/roles
   */
  async getRoles(status?: "active" | "inactive") {
    try {
      const params: any = {};
      if (status) params.status = status;
      const response = await api.get("/users/roles", { params });
      const data = response.data;
      return Array.isArray(data) ? data : (data.items || data.data || []);
    } catch (error: any) {
      console.error("Get Roles Error:", error.response?.data || error.message);
      return [];
    }
  },

  /**
   * Toggle a role's active/inactive status
   * PUT /api/v1/users/roles/{role}/status
   */
  async toggleRoleStatus(role: string, is_active: boolean) {
    try {
      const response = await api.put(`/users/roles/${role}/status`, { is_active });
      return response.data;
    } catch (error: any) {
      console.error(`Toggle Role ${role} Status Error:`, error.response?.data || error.message);
      throw error;
    }
  },
};
