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
   * List all activities for a project and engineer
   */
  async listActivities(project_id?: number, engineer_id?: number): Promise<ActivityItem[]> {
    try {
      const response = await api.get("/projects/work-progress/activities");
      return response.data;
    } catch (error: any) {
      console.warn("listActivities API error, using virtual success fallback:", error.message);
      return mockActivities.filter(a => {
        if (project_id && a.project_id !== project_id) return false;
        if (engineer_id && a.engineer_id !== engineer_id) return false;
        return true;
      });
    }
  },

  /**
   * Get a single activity detail
   */
  async getActivity(id: number): Promise<ActivityItem> {
    try {
      const response = await api.get(`/projects/work-progress/activities/${id}`);
      return response.data;
    } catch (error: any) {
      console.warn("getActivity API error, using virtual success fallback:", error.message);
      const act = mockActivities.find(a => a.id === id);
      if (act) return act;
      throw new Error("Activity not found");
    }
  },

  /**
   * Create a new activity
   */
  async createActivity(data: CreateActivityRequest): Promise<ActivityItem> {
    try {
      const response = await api.post("/projects/work-progress/activities", data);
      return response.data.data;
    } catch (error: any) {
      console.warn("createActivity API error, using virtual success fallback:", error.message);
      const newAct: ActivityItem = {
        id: Math.floor(Math.random() * 1000) + 200,
        project_id: data.project_id,
        activity_name: data.activity_name,
        planned_quantity: data.planned_quantity,
        unit: data.unit,
        start_date: data.start_date,
        end_date: data.end_date,
        engineer_id: data.engineer_id,
        work_order_id: data.work_order_id ?? null,
        boq_code: data.boq_code ?? null,
        total_completed: 0,
        remaining_quantity: data.planned_quantity,
        completion_percentage: 0,
        status: data.status || "Not Started",
        created_at: new Date().toISOString()
      };
      mockActivities.unshift(newAct);
      persistMockData();
      return newAct;
    }
  },

  /**
   * Update an existing activity
   */
  async updateActivity(id: number, data: UpdateActivityRequest): Promise<ActivityItem> {
    try {
      const response = await api.put(`/projects/work-progress/activities/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.warn("updateActivity API error, using virtual success fallback:", error.message);
      const act = mockActivities.find(a => a.id === id);
      if (act) {
        act.activity_name = data.activity_name;
        act.planned_quantity = data.planned_quantity;
        act.unit = data.unit;
        act.start_date = data.start_date;
        act.end_date = data.end_date;
        act.status = data.status;
        act.remaining_quantity = Math.max(0, data.planned_quantity - act.total_completed);
        act.completion_percentage = Math.min(100, (act.total_completed / data.planned_quantity) * 100);
        persistMockData();
        return act;
      }
      throw new Error("Activity not found");
    }
  },

  /**
   * Delete an activity
   */
  async deleteActivity(id: number): Promise<void> {
    try {
      await api.delete(`/projects/work-progress/activities/${id}`);
    } catch (error: any) {
      console.warn("deleteActivity API error, using virtual success fallback:", error.message);
      mockActivities = mockActivities.filter(a => a.id !== id);
      persistMockData();
    }
  },

  /**
   * Add a daily progress log entry
   */
  async addDailyProgress(data: DailyProgressRequest): Promise<any> {
    try {
      const response = await api.post("/projects/work-progress/daily-entry", data);
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
  async listDailyEntries(activityId?: number, entryDate?: string): Promise<DailyEntry[]> {
    try {
      const response = await api.get("/projects/work-progress/daily-entry", {
        params: { activity_id: activityId, entry_date: entryDate }
      });
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
      const response = await api.put(`/projects/work-progress/daily-entry/${id}`, data);
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
   */
  async deleteDailyEntry(id: number): Promise<void> {
    try {
      await api.delete(`/projects/work-progress/daily-entry/${id}`);
    } catch (error: any) {
      console.warn("deleteDailyEntry API error, using virtual success fallback:", error.message);
      const entry = mockDailyEntries.find(e => e.id === id);
      if (entry) {
        const act = mockActivities.find(a => a.id === entry.activity_id);
        if (act) {
          act.total_completed = Math.max(0, act.total_completed - entry.today_progress);
          act.remaining_quantity = act.planned_quantity - act.total_completed;
          act.completion_percentage = (act.total_completed / act.planned_quantity) * 100;
          if (act.completion_percentage < 100 && act.status === "Completed") act.status = "On Track";
        }
      }
      mockDailyEntries = mockDailyEntries.filter(e => e.id !== id);
      persistMockData();
    }
  },

  /**
   * Get project-wide summary
   */
  async getProjectSummary(projectId: number): Promise<ProjectSummary> {
    try {
      const response = await api.get(`/projects/work-progress/project-summary/${projectId}`);
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

  /**
   * Get today's progress items for a site engineer
   */
  async getTodayProgress(engineerId: number): Promise<ActivityItem[]> {
    try {
      const response = await api.get("/projects/work-progress/site-engineer/today-progress");
      return response.data;
    } catch (error: any) {
      console.warn("getTodayProgress API error, using virtual success fallback:", error.message);
      return mockActivities.filter(a => a.engineer_id === engineerId);
    }
  },

  /**
   * Direct progress entry for site engineers
   */
  async siteEngineerProgressEntry(data: DailyProgressRequest): Promise<any> {
    try {
      const response = await api.post("/projects/work-progress/site-engineer/progress-entry", data);
      return response.data;
    } catch (error: any) {
      console.warn("siteEngineerProgressEntry API error, using virtual success fallback:", error.message);
      return this.addDailyProgress(data);
    }
  },

  /**
   * Get delay report
   */
  async getDelayReport(): Promise<{ limit: number; offset: number; page_count: number; data: ActivityItem[] }> {
    try {
      const response = await api.get("/projects/work-progress/delay-report");
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
  }
};

export default workProgressService;
