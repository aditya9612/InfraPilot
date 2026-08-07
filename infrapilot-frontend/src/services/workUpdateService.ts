import api from "./api";

export interface WorkUpdatePayload {
  project_id?: number;
  task_id?: number;
  description: string;
  category?: string;
  location?: string;
  work_date?: string;
  start_time?: string;
  end_time?: string;
  before_remarks?: string;
  after_remarks?: string;
  before_images?: string[] | File[];
  after_images?: string[] | File[];
  [key: string]: any;
}

export interface WorkUpdateItem {
  id: number;
  project_id: number;
  task_id?: number;
  description: string;
  category?: string;
  location?: string;
  work_date?: string;
  start_time?: string;
  end_time?: string;
  before_remarks?: string;
  after_remarks?: string;
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
   */
  async createWorkUpdate(data: WorkUpdatePayload | FormData): Promise<any> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await api.post("/work-updates", data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined
    });
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
  async updateWorkUpdate(workUpdateId: number, data: Partial<WorkUpdatePayload> | FormData): Promise<any> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await api.put(`/work-updates/${workUpdateId}`, data, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined
    });
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
   */
  async uploadBeforeImage(workUpdateId: number, fileOrData: File | FormData | { image?: string; [key: string]: any }): Promise<any> {
    if (!workUpdateId) throw new Error("work_update_id is required");

    try {
      let payload: any;
      let config: any = {};

      if (typeof FormData !== 'undefined' && fileOrData instanceof FormData) {
        payload = fileOrData;
        config.headers = { "Content-Type": "multipart/form-data" };
      } else if (fileOrData instanceof File) {
        const formData = new FormData();
        formData.append("file", fileOrData);
        formData.append("image", fileOrData);
        formData.append("before_image", fileOrData);
        payload = formData;
        config.headers = { "Content-Type": "multipart/form-data" };
      } else {
        payload = fileOrData;
      }

      const response = await api.post(`/work-updates/${workUpdateId}/before-image`, payload, config);
      return response.data;
    } catch (err: any) {
      console.warn(`POST /work-updates/${workUpdateId}/before-image failed with FormData, trying json fallback:`, err?.message);
      if (fileOrData && typeof fileOrData === 'object' && !(fileOrData instanceof File) && !(fileOrData instanceof FormData)) {
        const response = await api.post(`/work-updates/${workUpdateId}/before-image`, fileOrData);
        return response.data;
      }
      throw err;
    }
  },

  /**
   * Upload After Image
   * POST /api/v1/work-updates/{work_update_id}/after-image
   */
  async uploadAfterImage(workUpdateId: number, fileOrData: File | FormData | { image?: string; [key: string]: any }): Promise<any> {
    if (!workUpdateId) throw new Error("work_update_id is required");

    try {
      let payload: any;
      let config: any = {};

      if (typeof FormData !== 'undefined' && fileOrData instanceof FormData) {
        payload = fileOrData;
        config.headers = { "Content-Type": "multipart/form-data" };
      } else if (fileOrData instanceof File) {
        const formData = new FormData();
        formData.append("file", fileOrData);
        formData.append("image", fileOrData);
        formData.append("after_image", fileOrData);
        payload = formData;
        config.headers = { "Content-Type": "multipart/form-data" };
      } else {
        payload = fileOrData;
      }

      const response = await api.post(`/work-updates/${workUpdateId}/after-image`, payload, config);
      return response.data;
    } catch (err: any) {
      console.warn(`POST /work-updates/${workUpdateId}/after-image failed with FormData, trying json fallback:`, err?.message);
      if (fileOrData && typeof fileOrData === 'object' && !(fileOrData instanceof File) && !(fileOrData instanceof FormData)) {
        const response = await api.post(`/work-updates/${workUpdateId}/after-image`, fileOrData);
        return response.data;
      }
      throw err;
    }
  },

  /**
   * Submit Work Update
   * POST /api/v1/work-updates/{work_update_id}/submit
   */
  async submitWorkUpdate(workUpdateId: number, data?: any): Promise<any> {
    const response = await api.post(`/work-updates/${workUpdateId}/submit`, data || {});
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
