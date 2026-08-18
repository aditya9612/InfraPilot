import api from "./api";

export interface CreateWorkUpdatePayload {
  project_id: number;
  task_id: number;
  activity_type_id: number;
  work_description: string;
  before_remarks?: string;
  work_date?: string;
  start_time?: string;
  location?: string;
}

export interface SubmitWorkUpdatePayload {
  end_time?: string;
  after_remarks?: string;
  total_hours: number | string;
}

export interface WorkUpdateItem {
  id: number;
  business_id?: string;
  project_id: number;
  task_id?: number;
  activity_type_id?: number;
  created_by_id?: number;
  work_description: string;
  before_remarks?: string;
  after_remarks?: string;
  work_date?: string;
  start_time?: string;
  end_time?: string;
  total_hours?: number;
  location?: string;
  status?: string;
  images?: any[];
  before_images?: string[];
  after_images?: string[];
  created_at?: string;
  user_id?: number;
  user_name?: string;
  [key: string]: any;
}

export interface ExportWorkUpdatesParams {
  project_id?: number;
  format?: 'csv' | 'pdf' | 'json' | string;
  start_date?: string;
  end_date?: string;
  [key: string]: any;
}

export const workUpdateService = {
  /**
   * Create Work Update
   * POST /api/v1/work-updates
   * Content-Type: application/json
   */
  async createWorkUpdate(data: CreateWorkUpdatePayload): Promise<any> {
    const response = await api.post("/work-updates", data);
    return response.data;
  },

  /**
   * Get my work updates
   * GET /api/v1/work-updates/my
   */
  async getMyWorkUpdates(params?: { project_id?: number; limit?: number; offset?: number }): Promise<WorkUpdateItem[]> {
    const response = await api.get("/work-updates/my", { params });
    const data = response.data;
    return Array.isArray(data) ? data : (data?.items || data?.data || data?.work_updates || []);
  },

  /**
   * Get project work-update timeline
   * GET /api/v1/work-updates/project/{project_id}/timeline
   */
  async getProjectTimeline(projectId: number, params?: { limit?: number; offset?: number }): Promise<any[]> {
    const response = await api.get(`/work-updates/project/${projectId}/timeline`, { params });
    const data = response.data;
    return Array.isArray(data) ? data : (data?.items || data?.timeline || data?.data || []);
  },

  /**
   * Export Work Updates
   * GET /api/v1/work-updates/export
   */
  async exportWorkUpdates(params?: ExportWorkUpdatesParams): Promise<Blob | any> {
    const response = await api.get("/work-updates/export", {
      params,
      responseType: params?.format === 'csv' || params?.format === 'pdf' ? 'blob' : 'json'
    });
    return response.data;
  },

  /**
   * Get Work Update
   * GET /api/v1/work-updates/{work_update_id}
   */
  async getWorkUpdate(workUpdateId: number): Promise<WorkUpdateItem> {
    const response = await api.get(`/work-updates/${workUpdateId}`);
    return response.data?.data || response.data;
  },

  /**
   * Update Work Update
   * PUT /api/v1/work-updates/{work_update_id}
   */
  async updateWorkUpdate(workUpdateId: number, data: Partial<CreateWorkUpdatePayload>): Promise<any> {
    const response = await api.put(`/work-updates/${workUpdateId}`, data);
    return response.data;
  },

  /**
   * Delete Work Update
   * DELETE /api/v1/work-updates/{work_update_id}
   */
  async deleteWorkUpdate(workUpdateId: number): Promise<any> {
    const response = await api.delete(`/work-updates/${workUpdateId}`);
    return response.data;
  },

  /**
   * Upload Before Image
   * POST /api/v1/work-updates/{work_update_id}/before-image
   * Content-Type: multipart/form-data
   * Form field: image
   */
  async uploadBeforeImage(workUpdateId: number, file: File): Promise<any> {
    if (!workUpdateId) throw new Error("work_update_id is required");

    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post(`/work-updates/${workUpdateId}/before-image`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },

  /**
   * Upload After Image
   * POST /api/v1/work-updates/{work_update_id}/after-image
   * Content-Type: multipart/form-data
   * Form field: image
   */
  async uploadAfterImage(workUpdateId: number, file: File): Promise<any> {
    if (!workUpdateId) throw new Error("work_update_id is required");

    const formData = new FormData();
    formData.append("image", file);

    const response = await api.post(`/work-updates/${workUpdateId}/after-image`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },

  /**
   * Submit Work Update
   * POST /api/v1/work-updates/{work_update_id}/submit
   * Content-Type: application/json
   */
  async submitWorkUpdate(workUpdateId: number, data: SubmitWorkUpdatePayload): Promise<any> {
    const response = await api.post(`/work-updates/${workUpdateId}/submit`, data);
    return response.data;
  },

  /**
   * Delete Work Update Image
   * DELETE /api/v1/work-updates/images/{image_id}
   */
  async deleteWorkUpdateImage(imageId: number | string): Promise<any> {
    const response = await api.delete(`/work-updates/images/${imageId}`);
    return response.data;
  },

  /**
   * Replace Work Update Image
   * PUT /api/v1/work-updates/images/{image_id}
   */
  async replaceWorkUpdateImage(imageId: number | string, fileOrData: File | FormData | { image?: string; [key: string]: any }): Promise<any> {
    let payload: any;
    let config: any = {};

    if (typeof FormData !== 'undefined' && fileOrData instanceof FormData) {
      payload = fileOrData;
      config.headers = { "Content-Type": "multipart/form-data" };
    } else if (fileOrData instanceof File) {
      const formData = new FormData();
      formData.append("file", fileOrData);
      formData.append("image", fileOrData);
      payload = formData;
      config.headers = { "Content-Type": "multipart/form-data" };
    } else {
      payload = fileOrData;
    }

    const response = await api.put(`/work-updates/images/${imageId}`, payload, config);
    return response.data;
  }
};
