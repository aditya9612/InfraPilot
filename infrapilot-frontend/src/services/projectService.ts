import api from './api';

export const projectService = {
  /**
   * Get list of projects with pagination and filtering
   * GET /api/v1/projects
   */
  async getProjects(limit = 100, skip = 0, search = "", status = "") {
    const params: any = {
      limit: limit,
      skip: skip
    };
    if (search) params.search = search;
    if (status && status !== "All" && status !== "") {
      params.status = status;
    }

    try {
      const response = await api.get('/projects', { params });
      const data = response.data;

      // Handle different possible response structures (array or wrapper object)
      const items = Array.isArray(data) ? data : (data.items || data.data || []);

      // Map project_id to id and normalize status for frontend compatibility
      const mappedItems = items.map((p: any) => {
        const rawStatus = p.status || "";
        let normalizedStatus = rawStatus;

        // Map backend UPPERCASE to frontend PascalCase if needed
        if (rawStatus === "PLANNED") normalizedStatus = "Planned";
        else if (rawStatus === "ONGOING") normalizedStatus = "Ongoing";
        else if (rawStatus === "COMPLETED") normalizedStatus = "Completed";
        else if (rawStatus === "ON_HOLD") normalizedStatus = "On Hold";
        else if (rawStatus === "DELAYED") normalizedStatus = "Delayed";
        else if (rawStatus === "delayed") normalizedStatus = "Delayed"; // Handle lowercase too

        return {
          ...p,
          id: p.project_id || p.id,
          status: normalizedStatus as any
        };
      });

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
    const { start_date, end_date } = scheduleData;
    const response = await api.post(`/projects/${projectId}/schedule`, null, {
      params: { start_date, end_date }
    });
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
    try {
      const response = await api.get('/projects/alerts/projects');
      const data = response.data;
      return Array.isArray(data) ? data : (data.items || data.data || []);
    } catch (error) {
      console.error("Get Project Alerts Error:", error);
      return [];
    }
  },

  async getTaskAlerts() {
    try {
      const response = await api.get('/projects/alerts/tasks');
      const data = response.data;
      return Array.isArray(data) ? data : (data.items || data.data || []);
    } catch (error) {
      console.error("Get Task Alerts Error:", error);
      return [];
    }
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
    try {
      const response = await api.get(`/projects/${projectId}/milestones`);
      const rawData = response.data;
      let items = Array.isArray(rawData) ? rawData : (rawData.items || rawData.data || []);

      // Normalize items: ensure name exists (from title or milestone_name)
      return items.map((item: any) => ({
        ...item,
        name: item.title || item.name || item.milestone_name || `Milestone ${item.id}`,
        status: (item.status || "Upcoming").toUpperCase()
      }));
    } catch (err) {
      console.error('Failed to fetch milestones:', err);
      // Fallback mock milestones
      return [
        { name: "Site Preparation & Excavation", date: "JAN 2025", status: "COMPLETED", color: "bg-emerald-500" },
        { name: "Foundation & Basement", date: "APR 2025", status: "COMPLETED", color: "bg-emerald-500" },
        { name: "Structural Framework (G+4)", date: "SEP 2025", status: "COMPLETED", color: "bg-emerald-500" },
        { name: "Roof Slab Casting & Waterproofing", date: "MAR 2026", status: "IN PROGRESS", color: "bg-blue-500" },
        { name: "Finishing & MEP Works", date: "JUN 2026", status: "UPCOMING", color: "bg-slate-300" },
        { name: "Final Inspection & Handover", date: "OCT 2026", status: "UPCOMING", color: "bg-slate-300" },
      ];
    }
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
    try {
      const response = await api.post(`/projects/${projectId}/tasks`, taskData);
      return response.data;
    } catch (error: any) {
      console.error("Create Task API Error:", error.response?.data || error.message);
      throw error;
    }
  },

  async getTask(projectId: number, taskId: number) {
    const response = await api.get(`/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  },

  async updateTask(projectId: number, taskId: number, taskData: any) {
    try {
      const response = await api.put(`/projects/${projectId}/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error: any) {
      console.error(`Update Task ${taskId} API Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  async updateTaskStatus(projectId: number, taskId: number, status: string) {
    try {
      const response = await api.patch(`/projects/${projectId}/tasks/${taskId}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error(`Update Task Status ${taskId} API Error:`, error.response?.data || error.message);
      throw error;
    }
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
  },

  /**
   * Get work progress activities for a project and engineer
   * GET /api/v1/projects/work-progress/activities
   */
  async getWorkProgressActivities(projectId: number, engineerId?: number) {
    try {
      const response = await api.get('/work-progress/activities', {
        params: { project_id: projectId, engineer_id: engineerId }
      });
      const rawData = response.data;

      // Handle the observed response structure { data: [...] }
      let items = Array.isArray(rawData) ? rawData : (rawData.data || rawData.items || []);

      // Normalize items: ensure activity_name and completion_percentage exist
      return items.map((item: any) => ({
        ...item,
        discipline: item.discipline || "General",
        activity_name: item.activity_name || `Activity ${item.id} (BOQ: ${item.boq_code})`,
        completion_percentage: item.completion_percentage !== undefined
          ? item.completion_percentage
          : (item.planned_quantity > 0
            ? Math.round((item.total_completed / item.planned_quantity) * 100)
            : 0)
      }));
    } catch (err) {
      console.error('Failed to fetch work progress activities:', err);
      // Fallback mock data
      return [
        {
          project_id: projectId,
          work_order_id: 1,
          created_at: '2026-05-14T19:25:56',
          id: 1,
          total_completed: 0,
          updated_at: '2026-05-14T19:25:56',
          boq_code: 1,
          remaining_quantity: 500,
          activity_name: 'Foundation Excavation',
          completion_percentage: 0,
          planned_quantity: 500,
          discipline: "Civil",
          unit: 'Cum',
          status: 'NOT_STARTED',
          engineer_id: engineerId,
          start_date: '2026-05-14',
          end_date: '2026-05-25'
        }
      ];
    }
  }
};
