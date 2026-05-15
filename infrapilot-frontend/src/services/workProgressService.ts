import api from "./api";

export interface ActivityProgress {
  project_id: number;
  work_order_id: number;
  created_at: string;
  id: number;
  total_completed: number;
  updated_at: string;
  boq_code: number;
  remaining_quantity: number;
  activity_name: string;
  completion_percentage: number;
  planned_quantity: number;
  discipline: string | null;
  unit: string;
  status: string;
  engineer_id: number;
  start_date: string;
  end_date: string;
}

export const workProgressService = {
  getWorkProgress: async (projectId: number): Promise<ActivityProgress[]> => {
    try {
      const response = await api.get("/work-progress", {
        params: { project_id: projectId }
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching work progress for project ${projectId}:`, error);
      throw error;
    }
  }
};
