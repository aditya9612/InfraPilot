import api from './api';

export const projectService = {
  /**
   * Get list of projects with pagination and filtering
   * GET /api/v1/projects
   */
  async getProjects(limit = 100, skip = 0, search = "", status = "", offset?: number) {
    const params: any = {
      limit: limit,
      offset: offset !== undefined ? offset : skip
    };
    if (search) params.search = search;
    if (status && status !== "All" && status !== "") {
      params.status = status;
    }

    try {
      const response = await api.get('projects', { params });
      const data = response.data;
      if (!data) return { items: [], data: [], total: 0 };

      // Handle different possible response structures (array or wrapper object)
      const items = Array.isArray(data) ? data : (data?.items || data?.data || []);

      // Map project_id to id and normalize status for frontend compatibility
      const mappedItems = items.map((p: any) => {
        if (!p) return null;
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
          name: p.name || p.project_name || `Project ${p.project_id || p.id}`,
          status: normalizedStatus as any
        };
      }).filter(Boolean);

      if (Array.isArray(data)) return mappedItems;

      return {
        ...data,
        items: mappedItems,
        // Also ensure data property is updated if it exists
        data: data.data ? mappedItems : data.data
      };
    } catch (error: any) {
      console.warn("Get Projects API Error (Falling back to empty list):", error.message);
      return { items: [], data: [], total: 0 };
    }
  },

  /**
   * Get project by ID
   * GET /api/v1/projects/{project_id}
   */
  async getProjectById(projectId: number) {
    try {
      const response = await api.get(`projects/${projectId}`);
      if (!response.data) throw new Error("Empty response from server");
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
      const response = await api.post('projects', projectData);
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
      const response = await api.put(`projects/${projectId}`, projectData);
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
      const response = await api.delete(`projects/${projectId}`);
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
    const response = await api.post(`projects/${projectId}/schedule`, null, {
      params: { start_date, end_date }
    });
    return response.data;
  },

  async getProjectSchedule(projectId: number) {
    const response = await api.get(`projects/${projectId}/schedule`);
    return response.data;
  },

  async getProjectProgress(projectId: number) {
    const response = await api.get(`projects/${projectId}/progress`);
    return response.data;
  },

  async getProjectAlerts() {
    try {
      const response = await api.get('projects/alerts/projects');
      const data = response.data;
      if (!data) return [];
      return Array.isArray(data) ? data : (data?.items || data?.data || []);
    } catch (error) {
      console.error("Get Project Alerts Error:", error);
      return [];
    }
  },

  async getTaskAlerts() {
    try {
      const response = await api.get('projects/alerts/tasks');
      const data = response.data;
      if (!data) return [];
      return Array.isArray(data) ? data : (data?.items || data?.data || []);
    } catch (error) {
      console.error("Get Task Alerts Error:", error);
      return [];
    }
  },

  // === Member Management ===

  async assignMember(projectId: number, userId: number) {
    const response = await api.post(`projects/${projectId}/members/${userId}`);
    return response.data;
  },

  async removeMember(projectId: number, userId: number) {
    const response = await api.delete(`projects/${projectId}/members/${userId}`);
    return response.data;
  },

  // Map to track in-flight members requests per project to prevent duplicate network calls
  _membersFetchPromises: new Map<number, Promise<any>>(),

  /**
   * Get members of a project
   * GET /api/v1/projects/{project_id}/members
   */
  async getProjectMembers(projectId: number) {
    // 1. Check if a request for this projectId is already in progress
    const existingPromise = projectService._membersFetchPromises.get(projectId);
    if (existingPromise) return existingPromise;

    // 2. Start new request and store its promise
    const fetchPromise = (async () => {
      try {
        const response = await api.get(`/projects/${projectId}/members`);
        return response.data || [];
      } catch (error: any) {
        console.warn(`Failed to fetch members for project ${projectId}:`, error.message);
        return [];
      } finally {
        // 3. Clean up the promise from the map once finished
        projectService._membersFetchPromises.delete(projectId);
      }
    })();

    projectService._membersFetchPromises.set(projectId, fetchPromise);
    return fetchPromise;
  },

  // === Reporting & Finance ===

  async getProjectLogs(projectId: number) {
    const response = await api.get(`projects/${projectId}/logs`);
    return response.data;
  },

  async getProjectProfitLoss(projectId: number) {
    const response = await api.get(`projects/${projectId}/profit-loss`);
    return response.data;
  },

  async exportProjectExcel(projectId: number) {
    const response = await api.get(`reports/projects/excel`, { params: { project_id: projectId }, responseType: 'blob' });
    return response.data;
  },

  async exportProjectPdf(projectId: number) {
    const response = await api.get(`reports/projects/pdf`, { params: { project_id: projectId }, responseType: 'blob' });
    return response.data;
  },

  // === Milestones ===

  async getMilestones(projectId: number) {
    try {
      const response = await api.get(`projects/${projectId}/milestones`);
      const rawData = response.data;
      if (!rawData) return [];
      let items = Array.isArray(rawData) ? rawData : (rawData?.items || rawData?.data || []);

      // Normalize items: ensure name exists (from title or milestone_name)
      return items.map((item: any) => ({
        ...item,
        name: item?.title || item?.name || item?.milestone_name || `Milestone ${item?.id}`,
        status: (item?.status || "Upcoming").toUpperCase()
      }));
    } catch (err) {
      console.error('Failed to fetch milestones:', err);
      return [];
    }
  },

  async createMilestone(projectId: number, milestoneData: any) {
    const response = await api.post(`projects/${projectId}/milestones`, milestoneData);
    return response.data;
  },

  async getMilestone(projectId: number, milestoneId: number) {
    const response = await api.get(`projects/${projectId}/milestones/${milestoneId}`);
    return response.data;
  },

  async updateMilestone(projectId: number, milestoneId: number, milestoneData: any) {
    const response = await api.put(`projects/${projectId}/milestones/${milestoneId}`, milestoneData);
    return response.data;
  },

  async deleteMilestone(projectId: number, milestoneId: number) {
    const response = await api.delete(`projects/${projectId}/milestones/${milestoneId}`);
    return response.data;
  },

  // === Tasks ===

  async getTasks(projectId: number, params: { limit?: number; offset?: number; assigned_user_id?: number; status?: string } = {}) {
    try {
      const response = await api.get(`projects/${projectId}/tasks`, {
        params: { limit: 100, offset: 0, ...params }
      });
      const data = response.data;
      if (!data) return { items: [], data: [], total: 0 };
      const items = Array.isArray(data) ? data : (data?.items || data?.data || []);

      // Map assigned_users to assigned_user_id for frontend compatibility
      const mappedItems = items.map((item: any) => ({
        ...item,
        assigned_user_id: item?.assigned_user_id || (item?.assigned_users && item?.assigned_users.length > 0 ? (item?.assigned_users[0]?.id || item?.assigned_users[0]) : null)
      }));

      if (Array.isArray(data)) return mappedItems;

      return {
        ...data,
        items: mappedItems
      };
    } catch (error: any) {
      console.error(`Get Tasks API Error:`, error.response?.data || error.message);
      return { items: [], total: 0 };
    }
  },

  async createTask(projectId: number, taskData: any) {
    try {
      const response = await api.post(`projects/${projectId}/tasks`, taskData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error: any) {
      console.error("Create Task API Error:", error.response?.data || error.message);
      throw error;
    }
  },

  async getTask(projectId: number, taskId: number) {
    try {
      const response = await api.get(`projects/${projectId}/tasks/${taskId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Get Task ${taskId} API Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  async updateTask(projectId: number, taskId: number, taskData: any) {
    try {
<<<<<<< HEAD
      const isFormData = taskData instanceof FormData;
=======
      // Backend requires multipart/form-data for this endpoint
      // If plain object passed, convert it to FormData
      let payload: FormData;
      if (taskData instanceof FormData) {
        payload = taskData;
      } else {
        payload = new FormData();
        for (const [key, value] of Object.entries(taskData)) {
          if (value !== undefined && value !== null) {
            payload.append(key, String(value));
          }
        }
      }
>>>>>>> testing
      const response = await api.put(
        `/projects/${projectId}/tasks/${taskId}`,
        payload,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return response.data;
    } catch (error: any) {
      console.error(`Update Task ${taskId} API Error:`, error.response?.data || error.message);
      throw error;
    }
  },


  async updateTaskStatus(projectId: number, taskId: number, status: string) {
    try {
      const response = await api.patch(`projects/${projectId}/tasks/${taskId}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error(`Update Task Status ${taskId} API Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  async deleteTask(projectId: number, taskId: number) {
    try {
      const response = await api.delete(`projects/${projectId}/tasks/${taskId}`);
      return response.data;
    } catch (error: any) {
      console.warn(`Delete Task ${taskId} API Error:`, error.message);
      return { message: "Task deleted successfully" };
    }
  },

  async passTask(projectId: number, taskId: number, passData: any) {
    try {
      const response = await api.post(`projects/${projectId}/tasks/${taskId}/pass`, passData);
      return response.data;
    } catch (error: any) {
      console.error(`Pass Task ${taskId} API Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  async updateTaskProgress(projectId: number, taskId: number, progressData: any) {
    try {
      const response = await api.post(`projects/${projectId}/tasks/${taskId}/progress`, progressData);
      return response.data;
    } catch (error: any) {
      console.error(`Update Task Progress ${taskId} API Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  async getTaskProgressHistory(projectId: number, taskId: number, limit = 20, offset = 0) {
    try {
      const response = await api.get(`projects/${projectId}/tasks/${taskId}/progress`, {
        params: { limit, offset }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Get Task Progress History ${taskId} API Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  async createTaskComment(projectId: number, taskId: number, commentData: any) {
    try {
      const response = await api.post(`projects/${projectId}/tasks/${taskId}/comments`, commentData);
      return response.data;
    } catch (error: any) {
      console.error(`Create Task Comment ${taskId} API Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  async getTaskComments(projectId: number, taskId: number, limit = 20, offset = 0) {
    try {
      const response = await api.get(`projects/${projectId}/tasks/${taskId}/comments`, {
        params: { limit, offset }
      });
      return response.data;
    } catch (error: any) {
      console.error(`Get Task Comments ${taskId} API Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get work progress activities for a project and engineer
   * GET /api/v1/projects/work-progress/activities
   */
  async getWorkProgressActivities(projectId: number, engineerId?: number, limit?: number, offset?: number) {
    try {
      const response = await api.get('work-progress/activities', {
        params: { project_id: projectId, engineer_id: engineerId, limit, offset }
      });
      const rawData = response.data;
      if (!rawData) return [];

      // Handle the observed response structure { data: [...] }
      let items = Array.isArray(rawData) ? rawData : (rawData?.data || rawData?.items || []);

      // Normalize items: ensure activity_name and completion_percentage exist
      return items.map((item: any) => ({
        ...item,
        discipline: item?.discipline || "General",
        activity_name: item?.activity_name || "Untitled Activity",
        completion_percentage: item?.completion_percentage !== undefined
          ? item?.completion_percentage
          : (item?.planned_quantity > 0
            ? Math.round((item?.total_completed / item?.planned_quantity) * 100)
            : 0)
      }));
    } catch (err) {
      console.error('Failed to fetch work progress activities:', err);
      return [];
    }
  },
  // Persistent cache for assigned projects to prevent excessive membership API calls
  _getCache() {
    try {
      const stored = localStorage.getItem('infrapilot_assigned_projects');
      if (stored) {
        const parsed = JSON.parse(stored);
        const cache = new Map<number, { data: any[], timestamp: number }>();
        Object.keys(parsed).forEach(k => cache.set(Number(k), parsed[k]));
        return cache;
      }
    } catch (e) {
      console.error("Failed to load assigned projects cache", e);
    }
    return new Map<number, { data: any[], timestamp: number }>();
  },

  _saveCache(cache: Map<number, { data: any[], timestamp: number }>) {
    try {
      const obj: any = {};
      cache.forEach((v, k) => { obj[k] = v; });
      localStorage.setItem('infrapilot_assigned_projects', JSON.stringify(obj));
    } catch (e) {
      console.error("Failed to save assigned projects cache", e);
    }
  },

  _CACHE_TTL: 30 * 60 * 1000, // 30 minutes

  /**
   * Get list of projects assigned to a specific user (Manager/Engineer)
   * This is optimized to handle membership verification without overloading the browser's network stack.
   */
  async getAssignedProjects(userId: number, forceRefresh = false) {
    const cache = projectService._getCache();
    const cached = cache.get(userId);

    if (!forceRefresh && cached && (Date.now() - cached.timestamp < projectService._CACHE_TTL)) {
      console.log(`[ProjectService] Using cached assigned projects for user ${userId} (${cached.data.length} found)`);
      return cached.data;
    }

    try {
      console.log(`[ProjectService] Refreshing assigned projects for user ${userId}...`);
<<<<<<< HEAD
      // 1. Fetch projects (limit 100)
      const pRes = await projectService.getProjects(100, 0);
      const projectList = Array.isArray(pRes) ? pRes : (pRes?.items || pRes?.data || []);
=======
      // 1. Fetch ALL projects in chunks to bypass the backend 100-limit
      let projectList: any[] = [];
      let offset = 0;
      const limit = 100;
      while (true) {
        const pRes = await this.getProjects(limit, undefined, "", "", offset);
        const chunk = Array.isArray(pRes) ? pRes : (pRes.items || pRes.data || []);
        if (chunk.length === 0) break;
        projectList = [...projectList, ...chunk];
        if (chunk.length < limit || projectList.length >= 2000) break; // circuit breaker
        offset += limit;
      }
>>>>>>> testing

      if (projectList.length === 0) return [];

      // 2. Concurrency-limited verification
      const assigned: any[] = [];
      const CONCURRENCY_LIMIT = 5;

      for (let i = 0; i < projectList.length; i += CONCURRENCY_LIMIT) {
        const batch = projectList.slice(i, i + CONCURRENCY_LIMIT);
        const results = await Promise.all(
          batch.map(async (p: any) => {
            if (!p || !p.id) return null;
            try {
              const mems = await projectService.getProjectMembers(p.id);
              const memberList = Array.isArray(mems) ? mems : (mems?.items || mems?.data || []);
              const isAssigned = memberList.some((m: any) =>
                String(m?.user_id) === String(userId) ||
                String(m?.user?.id) === String(userId) ||
                String(m?.userId) === String(userId)
              );
              return isAssigned ? p : null;
            } catch (err) {
              return null;
            }
          })
        );
        assigned.push(...results.filter(p => p !== null));

        if (i + CONCURRENCY_LIMIT < projectList.length) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      console.log(`[ProjectService] Verified ${assigned.length} assigned projects for user ${userId}`);

      cache.set(userId, { data: assigned, timestamp: Date.now() });
      projectService._saveCache(cache);

      return assigned;
    } catch (error) {
      console.error("Failed to fetch assigned projects:", error);
      return cached?.data || [];
    }
  },

  clearAssignedProjectsCache(userId?: number) {
    const cache = projectService._getCache();
    if (userId) {
      cache.delete(userId);
    } else {
      cache.clear();
    }
    projectService._saveCache(cache);
  }
};
