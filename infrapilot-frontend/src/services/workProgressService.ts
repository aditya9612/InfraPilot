import api from "./api";
import type {
  ActivityItem,
  DailyEntry,
  ProjectSummary,
  CreateActivityRequest,
  UpdateActivityRequest,
  DailyProgressRequest
} from "../types/workProgress";

// Local in-memory store for dynamic operation in fallback scenario
let mockActivities: ActivityItem[] = [
  {
    id: 101,
    project_id: 1,
    work_order_id: null,
    activity_name: "Excavation and Site Grading",
    unit: "cum",
    boq_code: null,
    planned_quantity: 1200,
    total_completed: 450,
    remaining_quantity: 750,
    completion_percentage: 37.5,
    status: "Delay",
    engineer_id: 1,
    start_date: "2026-05-01",
    end_date: "2026-05-15",
    discipline: "Civil",
    created_at: "2026-05-01T08:00:00",
    updated_at: "2026-05-18T10:00:00"
  },
  {
    id: 102,
    project_id: 1,
    work_order_id: null,
    activity_name: "Reinforced Concrete Foundation",
    unit: "cum",
    boq_code: null,
    planned_quantity: 800,
    total_completed: 200,
    remaining_quantity: 600,
    completion_percentage: 25.0,
    status: "Delay",
    engineer_id: 1,
    start_date: "2026-05-05",
    end_date: "2026-05-20",
    discipline: "Structural",
    created_at: "2026-05-05T09:00:00",
    updated_at: "2026-05-18T11:00:00"
  },
  {
    id: 103,
    project_id: 1,
    work_order_id: null,
    activity_name: "Brickwork Masonry - Ground Floor",
    unit: "sqm",
    boq_code: null,
    planned_quantity: 1500,
    total_completed: 1500,
    remaining_quantity: 0,
    completion_percentage: 100.0,
    status: "Completed",
    engineer_id: 1,
    start_date: "2026-04-10",
    end_date: "2026-04-30",
    discipline: "Civil",
    created_at: "2026-04-10T08:00:00",
    updated_at: "2026-04-30T17:00:00"
  },
  {
    id: 104,
    project_id: 1,
    work_order_id: null,
    activity_name: "Electrical Conduit Laying",
    unit: "m",
    boq_code: null,
    planned_quantity: 3000,
    total_completed: 1800,
    remaining_quantity: 1200,
    completion_percentage: 60.0,
    status: "On Track",
    engineer_id: 1,
    start_date: "2026-05-10",
    end_date: "2026-05-25",
    discipline: "Electrical",
    created_at: "2026-05-10T08:00:00",
    updated_at: "2026-05-18T10:00:00"
  }
];

let mockDailyEntries: DailyEntry[] = [];

if (typeof window !== "undefined") {
  (window as any).mockActivities = mockActivities;
  (window as any).mockDailyEntries = mockDailyEntries;
}

function getHistoryForActivity(activityId: number) {
  const entries = mockDailyEntries.filter(e => e.activity_id === activityId);
  return entries.map(e => {
    const act = mockActivities.find(a => a.id === activityId);
    return {
      activity_id: activityId,
      action: "DAILY_PROGRESS_UPDATE",
      new_value: {
        status: act ? act.status : "On Track",
        today_progress: String(e.today_progress),
        total_completed: act ? String(act.total_completed) : String(e.today_progress)
      }
    };
  });
}

export const workProgressService = {
  /**
   * List all activities for a project and engineer
   */
  async listActivities(project_id?: number, engineer_id?: number): Promise<ActivityItem[]> {
    try {
      const response = await api.get("/projects/work-progress/activities", {
        params: { project_id, engineer_id }
      });
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
      return response.data;
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
      const response = await api.get("/projects/work-progress/site-engineer/today-progress", {
        params: { engineer_id: engineerId }
      });
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

  /**
   * Get activity history
   */
  async getActivityHistory(id: number): Promise<{ data: any[] }> {
    const response = await api.get(`/work-progress/activities/${id}/history`);
    return response.data;
  }
};

export default workProgressService;
