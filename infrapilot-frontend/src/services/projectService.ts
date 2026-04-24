import api from './api';

export const projectService = {
  /**
   * Get list of projects with pagination and filtering
   * GET /api/v1/projects
   */
  async getProjects(limit = 10, skip = 0, search = "", status = "") {
    const params: any = {};
    if (limit && limit !== 10) params.limit = limit;
    if (skip && skip !== 0) params.skip = skip;
    if (search) params.search = search;
    if (status && status !== "All") params.status = status;
    
    try {
      const response = await api.get('/projects', { params });
      const data = response.data;
      
      // Handle different possible response structures (array or wrapper object)
      const items = Array.isArray(data) ? data : (data.items || data.data || []);
      
      // Map project_id to id for frontend compatibility
      const mappedItems = items.map((p: any) => ({
        ...p,
        id: p.project_id || p.id
      }));
      
      if (Array.isArray(data)) return mappedItems;
      
      return { 
        ...data, 
        items: mappedItems,
        // Also ensure data property is updated if it exists
        data: data.data ? mappedItems : data.data 
      };
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Get Projects API Error details:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Get project by ID
   * GET /api/v1/projects/{project_id}
   */
  async getProjectById(projectId: number) {
    try {
      const response = await api.get(`/projects/${projectId}`);
      const p = response.data;
      return { ...p, id: p.project_id || p.id };
    } catch (error: any) {
      console.error(`Get Project ${projectId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create a new project
   * POST /api/v1/projects
   */
  async createProject(projectData: any) {
    try {
      const response = await api.post('/projects', projectData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Create Project API Error details:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Update project by ID
   * PUT /api/v1/projects/{project_id}
   */
  async updateProject(projectId: number, projectData: any) {
    try {
      // Ensure we don't send project_id in body if it causes issues, 
      // though the user request includes it in the sample body.
      const response = await api.put(`/projects/${projectId}`, projectData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Update Project API Error details:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Delete project by ID
   * DELETE /api/v1/projects/{project_id}
   */
  async deleteProject(projectId: number) {
    try {
      const response = await api.delete(`/projects/${projectId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Delete Project API Error details:", error.response.data);
      }
      throw error;
    }
  },

  // === Scheduling & Monitoring ===

  async scheduleProject(projectId: number, scheduleData: any) {
    const response = await api.post(`/projects/${projectId}/schedule`, scheduleData);
    return response.data;
  },

  async getProjectSchedule(projectId: number) {
    const response = await api.get(`/projects/${projectId}/schedule`);
    return response.data;
  },

  async getProjectProgress(projectId: number) {
    const response = await api.get(`/projects/${projectId}/progress`);
    return response.data;
  },

  async getProjectAlerts() {
    const response = await api.get('/projects/alerts/projects');
    return response.data;
  },

  async getTaskAlerts() {
    const response = await api.get('/projects/alerts/tasks');
    return response.data;
  },

  // === Member Management ===

  async assignMember(projectId: number, userId: number) {
    const response = await api.post(`/projects/${projectId}/members/${userId}`);
    return response.data;
  },

  async removeMember(projectId: number, userId: number) {
    const response = await api.delete(`/projects/${projectId}/members/${userId}`);
    return response.data;
  },

  async getProjectMembers(projectId: number) {
    const response = await api.get(`/projects/${projectId}/members`);
    return response.data;
  },

  // === Reporting & Finance ===

  async getProjectLogs(projectId: number) {
    const response = await api.get(`/projects/${projectId}/logs`);
    return response.data;
  },

  async getProjectProfitLoss(projectId: number) {
    const response = await api.get(`/projects/${projectId}/profit-loss`);
    return response.data;
  },

  async exportProjectExcel(projectId: number) {
    const response = await api.get(`/projects/${projectId}/report/excel`, { responseType: 'blob' });
    return response.data;
  },

  async exportProjectPdf(projectId: number) {
    const response = await api.get(`/projects/${projectId}/report/pdf`, { responseType: 'blob' });
    return response.data;
  },

  // === Milestones ===

  async getMilestones(projectId: number) {
    const response = await api.get(`/projects/${projectId}/milestones`);
    return response.data;
  },

  async createMilestone(projectId: number, milestoneData: any) {
    const response = await api.post(`/projects/${projectId}/milestones`, milestoneData);
    return response.data;
  },

  async getMilestone(projectId: number, milestoneId: number) {
    const response = await api.get(`/projects/${projectId}/milestones/${milestoneId}`);
    return response.data;
  },

  async updateMilestone(projectId: number, milestoneId: number, milestoneData: any) {
    const response = await api.put(`/projects/${projectId}/milestones/${milestoneId}`, milestoneData);
    return response.data;
  },

  async deleteMilestone(projectId: number, milestoneId: number) {
    const response = await api.delete(`/projects/${projectId}/milestones/${milestoneId}`);
    return response.data;
  },

  // === Tasks ===

  async getTasks(projectId: number) {
    const response = await api.get(`/projects/${projectId}/tasks`);
    return response.data;
  },

  async createTask(projectId: number, taskData: any) {
    const response = await api.post(`/projects/${projectId}/tasks`, taskData);
    return response.data;
  },

  async getTask(projectId: number, taskId: number) {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  async updateTask(projectId: number, taskId: number, taskData: any) {
    const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, taskData);
    return response.data;
  },

  async deleteTask(projectId: number, taskId: number) {
    const response = await api.delete(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  async updateTaskProgress(projectId: number, taskId: number, progressData: any) {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/progress`, progressData);
    return response.data;
  },

  async getTaskProgressHistory(projectId: number, taskId: number) {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}/progress`);
    return response.data;
  },

  async createTaskComment(projectId: number, taskId: number, commentData: any) {
    const response = await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, commentData);
    return response.data;
  },

  async getTaskComments(projectId: number, taskId: number) {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}/comments`);
    return response.data;
  }
};
