import api from "./api";
import type {
  ActivityItem,
  DailyEntry,
  ProjectSummary,
  CreateActivityRequest,
  UpdateActivityRequest,
  DailyProgressRequest
} from "../types/workProgress";

export const workProgressService = {
  /**
   * List all activities for a project and engineer
   */
  async listActivities(projectId: number, engineerId: number): Promise<ActivityItem[]> {
    const response = await api.get("/projects/work-progress/activities", {
      params: { project_id: projectId, engineer_id: engineerId }
    });
    return response.data;
  },

  /**
   * Get a single activity detail
   */
  async getActivity(id: number): Promise<ActivityItem> {
    const response = await api.get(`/projects/work-progress/activities/${id}`);
    return response.data;
  },

  /**
   * Create a new activity
   */
  async createActivity(data: CreateActivityRequest): Promise<ActivityItem> {
    const response = await api.post("/projects/work-progress/activities", data);
    return response.data.data;
  },

  /**
   * Update an existing activity
   */
  async updateActivity(id: number, data: UpdateActivityRequest): Promise<ActivityItem> {
    const response = await api.put(`/projects/work-progress/activities/${id}`, data);
    return response.data.data;
  },

  /**
   * Delete an activity
   */
  async deleteActivity(id: number): Promise<void> {
    await api.delete(`/projects/work-progress/activities/${id}`);
  },

  /**
   * Add a daily progress log entry
   */
  async addDailyProgress(data: DailyProgressRequest): Promise<any> {
    const response = await api.post("/projects/work-progress/daily-entry", data);
    return response.data;
  },

  /**
   * List daily progress entries
   */
  async listDailyEntries(activityId?: number, entryDate?: string): Promise<DailyEntry[]> {
    const response = await api.get("/projects/work-progress/daily-entry", {
      params: { activity_id: activityId, entry_date: entryDate }
    });
    return response.data;
  },

  /**
   * Update a daily progress entry
   */
  async updateDailyEntry(id: number, data: { today_progress: number; remarks: string }): Promise<any> {
    const response = await api.put(`/projects/work-progress/daily-entry/${id}`, data);
    return response.data;
  },

  /**
   * Delete a daily progress entry
   */
  async deleteDailyEntry(id: number): Promise<void> {
    await api.delete(`/projects/work-progress/daily-entry/${id}`);
  },

  /**
   * Get project-wide summary
   */
  async getProjectSummary(projectId: number): Promise<ProjectSummary> {
    const response = await api.get(`/projects/work-progress/project-summary/${projectId}`);
    return response.data;
  },

  /**
   * Get today's progress items for a site engineer
   */
  async getTodayProgress(engineerId: number): Promise<ActivityItem[]> {
    const response = await api.get("/projects/work-progress/site-engineer/today-progress", {
      params: { engineer_id: engineerId }
    });
    return response.data;
  },

  /**
   * Direct progress entry for site engineers
   */
  async siteEngineerProgressEntry(data: DailyProgressRequest): Promise<any> {
    const response = await api.post("/projects/work-progress/site-engineer/progress-entry", data);
    return response.data;
  }
};

export default workProgressService;
