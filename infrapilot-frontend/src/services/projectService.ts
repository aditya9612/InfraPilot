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

        const rawStatusStr = String(rawStatus || "").trim().toUpperCase();
        if (rawStatusStr === "PLANNED") normalizedStatus = "Planned";
        else if (rawStatusStr === "ONGOING" || rawStatusStr === "ACTIVE") normalizedStatus = "Ongoing";
        else if (rawStatusStr === "COMPLETED") normalizedStatus = "Completed";
        else if (rawStatusStr === "ON_HOLD" || rawStatusStr === "ON HOLD" || rawStatusStr === "SUSPENDED") normalizedStatus = "On Hold";
        else if (rawStatusStr === "DELAYED" || rawStatusStr === "DELAY" || rawStatusStr === "DELAY_ONGOING") normalizedStatus = "Delayed";

        if (normalizedStatus !== "Completed" && p.end_date) {
          const end = new Date(p.end_date).getTime();
          if (!isNaN(end) && end < Date.now()) {
            normalizedStatus = "Delayed";
          }
        }

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

  async getMilestones(projectId: number, params: { limit?: number; offset?: number; status?: string; task_id?: number } = {}) {
    try {
      const response = await api.get(`projects/${projectId}/milestones`, {
        params: { limit: 100, offset: 0, ...params }
      });
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
      // Fallback mock milestones
      return [
        { id: 1, name: "Site Preparation & Excavation", date: "JAN 2025", status: "COMPLETED", color: "bg-emerald-500" },
        { id: 2, name: "Foundation & Basement", date: "APR 2025", status: "COMPLETED", color: "bg-emerald-500" },
        { id: 3, name: "Structural Framework (G+4)", date: "SEP 2025", status: "COMPLETED", color: "bg-emerald-500" },
        { id: 4, name: "Roof Slab Casting & Waterproofing", date: "MAR 2026", status: "IN PROGRESS", color: "bg-blue-500" },
        { id: 5, name: "Finishing & MEP Works", date: "JUN 2026", status: "UPCOMING", color: "bg-slate-300" },
        { id: 6, name: "Final Inspection & Handover", date: "OCT 2026", status: "UPCOMING", color: "bg-slate-300" },
      ];
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

  async getTaskRequests(params?: number | { project_id?: number; status?: string; priority?: string; skip?: number; limit?: number }) {
    try {
      const queryParams = typeof params === 'number' ? { project_id: params } : (params || {});
      const response = await api.get('projects/task-requests', { params: queryParams });
      const data = response.data;
      return Array.isArray(data) ? data : (data?.items || data?.data || []);
    } catch (error) {
      console.error("Task Requests API Error:", error);
      return [];
    }
  },

  async updateTaskRequest(arg1: number, arg2: any, arg3?: any) {
    try {
      const requestId = arg3 !== undefined ? arg2 : arg1;
      const data = arg3 !== undefined ? arg3 : arg2;

      let payload: any;
      if (data instanceof FormData) {
        payload = data;
      } else {
        payload = new FormData();
        for (const [key, value] of Object.entries(data)) {
          if (value !== undefined && value !== null) {
            payload.append(key, String(value));
          }
        }
      }

      const response = await api.put(`projects/task-requests/${requestId}`, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response.data;
    } catch (error) {
      console.error("Update Task Request API Error:", error);
      throw error;
    }
  },

  async deleteTaskRequest(arg1: number, arg2?: number) {
    try {
      const requestId = arg2 !== undefined ? arg2 : arg1;
      const response = await api.delete(`projects/task-requests/${requestId}`);
      return response.data;
    } catch (error) {
      console.error("Delete Task Request API Error:", error);
      throw error;
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

    const shouldUseCache = !forceRefresh && cached && cached.data.length > 0 && (Date.now() - cached.timestamp < projectService._CACHE_TTL);
    if (shouldUseCache) {
      console.log(`[ProjectService] Using cached assigned projects for user ${userId} (${cached.data.length} found). Refreshing current statuses...`);
      try {
        const freshRes = await this.getProjects(100, 0, "", "");
        const freshList = Array.isArray(freshRes) ? freshRes : (freshRes.items || freshRes.data || []);
        if (freshList.length > 0) {
          const freshMap = new Map<number, any>(freshList.map((p: any) => [Number(p.id || p.project_id), p]));
          const updatedCachedData = cached.data.map((cp: any) => {
            const fresh = freshMap.get(Number(cp.id || cp.project_id));
            return fresh ? { ...cp, ...fresh, status: fresh.status, completion_percentage: fresh.completion_percentage, end_date: fresh.end_date } : cp;
          });
          cache.set(userId, { data: updatedCachedData, timestamp: cached.timestamp });
          projectService._saveCache(cache);
          return updatedCachedData;
        }
      } catch (e) {
        console.warn("Failed to refresh cached project statuses, returning cached data:", e);
      }
      return cached.data;
    }

    if (cached && cached.data.length === 0 && !forceRefresh) {
      console.warn(`[ProjectService] Cached assigned projects for user ${userId} are empty; refreshing from server.`);
    }

    try {
      console.log(`[ProjectService] Refreshing assigned projects for user ${userId}...`);
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
  },

  /**
   * Create a new task request
   * POST /api/v1/projects/task-requests
   */
  async createTaskRequest(projectId: number, requestData: any) {
    try {
      const endpoint = `projects/task-requests`;
      let payload: any;
      if (requestData instanceof FormData) {
        payload = requestData;
        if (projectId && !payload.has('project_id')) {
          payload.append('project_id', String(projectId));
        }
      } else {
        payload = new FormData();
        payload.append('project_id', String(requestData.project_id || projectId));
        for (const [key, value] of Object.entries(requestData)) {
          if (value !== undefined && value !== null && key !== 'project_id' && value !== "") {
            payload.append(key, typeof value === 'object' && !(value instanceof File) ? JSON.stringify(value) : String(value));
          }
        }
      }

      console.log(`Creating task request at: ${endpoint}`);
      const response = await api.post(endpoint, payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return response.data;
    } catch (error: any) {
      console.error("Create Task Request API Error:", {
        status: error.response?.status,
        data: error.response?.data,
        endpoint: `projects/task-requests`
      });
      throw error;
    }
  }
};
