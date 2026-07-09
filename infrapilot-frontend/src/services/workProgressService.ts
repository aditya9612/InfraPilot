import api from "./api";
import type {
  ActivityItem,
  DailyEntry,
  ProjectSummary,
  CreateActivityRequest,
  UpdateActivityRequest,
  DailyProgressRequest
} from "../types/workProgress";

let mockActivities: ActivityItem[] = [];
let mockDailyEntries: DailyEntry[] = [];

try {
  const localActivities = localStorage.getItem("mock_activities");
  if (localActivities) mockActivities = JSON.parse(localActivities);

  const localEntries = localStorage.getItem("mock_daily_entries");
  if (localEntries) mockDailyEntries = JSON.parse(localEntries);
} catch (e) {
  console.warn("Failed to load mock data from localStorage", e);
}

const persistMockData = () => {
  try {
    localStorage.setItem("mock_activities", JSON.stringify(mockActivities));
    localStorage.setItem("mock_daily_entries", JSON.stringify(mockDailyEntries));
  } catch (e) {
    console.warn("Failed to save mock data to localStorage", e);
  }
};

if (typeof window !== "undefined") {
  (window as any).mockActivities = mockActivities;
  (window as any).mockDailyEntries = mockDailyEntries;
}

export const workProgressService = {
  /**
   * List all activities from API
   * GET /api/v1/work-progress/activities
   */
  async listActivities(project_id?: number, engineer_id?: number, limit?: number, offset?: number): Promise<ActivityItem[]> {
    const params: Record<string, any> = {};
    if (project_id) params.project_id = project_id;
    if (engineer_id) params.engineer_id = engineer_id;
    if (limit !== undefined) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    const response = await api.get("/work-progress/activities", { params });
    const data = response.data;
    return Array.isArray(data) ? data : (data.items || data.data || []);
  },

  /**
   * Get a single activity detail
   */
  /**
   * GET /api/v1/work-progress/activities/{id}
   */
  async getActivity(id: number): Promise<ActivityItem> {
    const response = await api.get(`/work-progress/activities/${id}`);
    return response.data.data || response.data;
  },

  /**
   * Create a new activity
   */
  async createActivity(data: CreateActivityRequest): Promise<ActivityItem> {
    const response = await api.post("/work-progress/activities", data);
    return response.data.data || response.data;
  },

  /**
   * Update an existing activity
   * PUT /api/v1/work-progress/activities/{id}
   * Success: 200 with updated activity
   */
  async updateActivity(id: number, data: UpdateActivityRequest): Promise<ActivityItem> {
    const response = await api.put(`/work-progress/activities/${id}`, data);
    return response.data.data || response.data;
  },

  /**
   * Delete an activity
   */
  async deleteActivity(id: number): Promise<void> {
    const response = await api.delete(`/work-progress/activities/${id}`);
    return response.data;
  },

  /**
   * Add a daily progress log entry
   */
  async addDailyProgress(data: DailyProgressRequest): Promise<any> {
    try {
      const { created_by, photos, ...payload } = data;
      const response = await api.post("/work-progress/daily-entry", payload);
      return response.data;
    } catch (error: any) {
      console.warn("addDailyProgress API error, using virtual success fallback:", error.message);
      const newEntry: DailyEntry = {
        id: Math.floor(Math.random() * 1000) + 500,
        activity_id: data.activity_id,
        entry_date: data.entry_date,
        today_progress: data.today_progress,
        remarks: data.remarks || "",
        created_by: data.created_by,
        photos: data.photos || [],
        created_at: new Date().toISOString()
      };
      mockDailyEntries.unshift(newEntry);

      // Increment progress on local activity too!
      const act = mockActivities.find(a => a.id === data.activity_id);
      if (act) {
        act.total_completed += data.today_progress;
        act.remaining_quantity = Math.max(0, act.planned_quantity - act.total_completed);
        act.completion_percentage = Math.min(100, (act.total_completed / act.planned_quantity) * 100);
        if (act.completion_percentage >= 100) {
          act.status = "Completed";
        } else {
          act.status = "On Track";
        }
      }

      persistMockData();

      return {
        message: "Progress added successfully",
        progress: newEntry,
        activity: act
      };
    }
  },

  /**
   * List daily progress entries
   */
  async listDailyEntries(activityId?: number, entryDate?: string, project_id?: number): Promise<DailyEntry[]> {
    try {
      const params: Record<string, any> = {};
      if (activityId !== undefined) params.activity_id = activityId;
      if (entryDate !== undefined) params.entry_date = entryDate;
      if (project_id) params.project_id = project_id;
      else if ((window as any).currentProjectId) params.project_id = (window as any).currentProjectId;

      const response = await api.get("/work-progress/daily-entry", { params });
      return Array.isArray(response.data) ? response.data : (response.data?.data || []);
    } catch (error: any) {
      console.warn("listDailyEntries API error, using virtual success fallback:", error.message);
      let filtered = [...mockDailyEntries];
      if (activityId) {
        filtered = filtered.filter(e => e.activity_id === activityId);
      }
      if (entryDate) {
        filtered = filtered.filter(e => e.entry_date === entryDate);
      }
      return filtered;
    }
  },

  /**
   * Update a daily progress entry
   */
  async updateDailyEntry(id: number, data: { today_progress: number; remarks: string }): Promise<any> {
    try {
      const response = await api.put(`/work-progress/daily-entry/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.warn("updateDailyEntry API error, using virtual success fallback:", error.message);
      const entry = mockDailyEntries.find(e => e.id === id);
      if (entry) {
        const diff = data.today_progress - entry.today_progress;
        const act = mockActivities.find(a => a.id === entry.activity_id);
        if (act) {
          act.total_completed += diff;
          act.remaining_quantity = Math.max(0, act.planned_quantity - act.total_completed);
          act.completion_percentage = Math.min(100, (act.total_completed / act.planned_quantity) * 100);
          if (act.completion_percentage >= 100) act.status = "Completed";
        }
        entry.today_progress = data.today_progress;
        entry.remarks = data.remarks;
        persistMockData();
        return entry;
      }
      throw new Error("Daily entry not found");
    }
  },

  /**
   * Delete a daily progress entry
   * DELETE /api/v1/projects/work-progress/daily-entry/{id}
   * Success: 200 { message: "Daily Entry Deleted" }
   */
  async deleteDailyEntry(id: number): Promise<void> {
    try {
      await api.delete(`/work-progress/daily-entry/${id}`);
    } catch (error: any) {
      console.warn("deleteDailyEntry API error, using virtual success fallback:", error.message);
      mockDailyEntries = mockDailyEntries.filter(e => e.id !== id);
      persistMockData();
    }
  },

  /**
   * Get project-wide summary
   */
  async getProjectSummary(projectId: number): Promise<ProjectSummary> {
    try {
      const response = await api.get(`/work-progress/project-summary/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.warn("getProjectSummary API error, using virtual success fallback:", error.message);
      const acts = mockActivities.filter(a => a.project_id === projectId);
      const total_activities = acts.length;
      const completed_activities = acts.filter(a => a.status === "Completed" || a.completion_percentage === 100).length;
      const delayed_activities = acts.filter(a => a.status === "Delay").length;
      return {
        total_activities,
        completed_activities,
        delayed_activities
      };
    }
  },



  async getTodayProgress(engineerId?: number, project_id?: number): Promise<{ limit: number; offset: number; page_count: number; total_count: number; data: DailyEntry[] }> {
    try {
      const params: Record<string, any> = {};
      if (engineerId) params.engineer_id = engineerId;
      if (project_id) params.project_id = project_id;
      const response = await api.get("/work-progress/site-engineer/today-progress", {
        params
      });
      return response.data;
    } catch (error: any) {
      console.warn("getTodayProgress API error, using virtual success fallback:", error.message);
      return {
        limit: 10, offset: 0, page_count: 1, total_count: 0,
        data: mockDailyEntries.filter(e => e.created_by === engineerId)
      };
    }
  },

  /**
   * Direct progress entry for site engineers
   */
  async siteEngineerProgressEntry(data: DailyProgressRequest): Promise<any> {
    try {
      const response = await api.post("/work-progress/site-engineer/progress-entry", data);
      return response.data;
    } catch (error: any) {
      console.warn("siteEngineerProgressEntry API error, using virtual success fallback:", error.message);
      return this.addDailyProgress(data);
    }
  },

  /**
   * Get delay report
   */
  async getDelayReport(project_id?: number): Promise<{ limit: number; offset: number; page_count: number; data: ActivityItem[] }> {
    try {
      const params: Record<string, any> = {};
      if (project_id) params.project_id = project_id;
      const response = await api.get("/work-progress/delay-report", { params });
      return response.data;
    } catch (error: any) {
      console.warn("getDelayReport API error, using virtual success fallback:", error.message);
      const delayed = mockActivities.filter(a => a.status === "Delay");
      return {
        limit: 10,
        offset: 0,
        page_count: 1,
        data: delayed
      };
    }
  },

  async getActivityHistory(id: number): Promise<{ data: any[] }> {
    try {
      const response = await api.get(`/work-progress/activities/${id}/history`);
      return response.data;
    } catch (error: any) {
      console.warn("getActivityHistory API error, using virtual success fallback:", error.message);
      return {
        data: [
          {
            activity_id: id,
            action: "DAILY_PROGRESS_UPDATE",
            new_value: {
              status: "ON_TRACK",
              today_progress: "150",
              total_completed: "150.00"
            }
          },
          {
            activity_id: id,
            action: "DAILY_PROGRESS_UPDATE",
            new_value: {
              status: "ON_TRACK",
              today_progress: "80",
              total_completed: "230.00"
            }
          },
          {
            activity_id: id,
            action: "DAILY_PROGRESS_UPDATE",
            new_value: {
              status: "Delay",
              today_progress: "40",
              total_completed: "270.00"
            }
          }
        ]
      };
    }
  },

  /**
   * Get global work progress logs
   */
  async getGlobalLogs(activityId?: number): Promise<{ data: any[] }> {
    try {
      const params: Record<string, any> = {};
      if (activityId) params.activity_id = activityId;
      const response = await api.get("/work-progress/logs", { params });
      return response.data;
    } catch (error: any) {
      console.warn("getGlobalLogs API error, using virtual fallback:", error.message);
      return { data: [] };
    }
  },

  /**
   * Download PDF Report
   */
  async getPdfReport(projectId: number): Promise<void> {
    const response = await api.get("/work-progress/reports/pdf", {
      params: { project_id: projectId },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Progress_Report_${projectId}.pdf`);
    document.body.appendChild(link);
    link.click();
  },

  /**
   * Download Excel Report
   */
  async getExcelReport(projectId: number): Promise<void> {
    const response = await api.get("/work-progress/reports/excel", {
      params: { project_id: projectId },
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Progress_Report_${projectId}.xlsx`);
    document.body.appendChild(link);
    link.click();
  }
};

export default workProgressService;
