import api from "./api";
import type {
  DsrItem,
  CreateDsrRequest,
  UpdateDsrRequest,
  DsrResponse,
  DsrPhoto,
  DsrMapPoint,
  LabourTrend,
  ContractorAnalytics,
  IssueAnalytics,
} from "../types/dsr";

export const dsrService = {
  /**
   * Get all DSRs (Cross-project)
   * GET /api/v1/dsr
   */
  async getDsr(params?: { limit?: number; offset?: number }): Promise<DsrResponse> {
    const response = await api.get<DsrResponse>("/dsr", { params });
    return response.data;
  },

  /**
   * Create new DSR
   * POST /api/v1/dsr
   */
  async createDsr(data: CreateDsrRequest): Promise<DsrItem> {
    const { dsr_image, total_labour, skilled_labour, unskilled_labour, resolved_address, ...queryParams } = data;

    // Build the query parameters for the POST request
    const params: Record<string, any> = {};
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === "string" && value.trim() === "") {
          return;
        }
        params[key] = value;
      }
    });

    // Add labour fields to query params in case the backend accepts them in query parameters
    if (total_labour !== undefined && total_labour !== null) params.total_labour = total_labour;
    if (skilled_labour !== undefined && skilled_labour !== null) params.skilled_labour = skilled_labour;
    if (unskilled_labour !== undefined && unskilled_labour !== null) params.unskilled_labour = unskilled_labour;

    // Defensively ensure weather is a valid WeatherType enum value
    if (params.weather && !["Sunny", "Rainy", "Cloudy", "Windy"].includes(params.weather)) {
      params.weather = "Sunny";
    }

    let createdDsr: DsrItem;

    if (dsr_image instanceof File) {
      const formData = new FormData();
      formData.append("photos", dsr_image);

      const response = await api.post<DsrItem>("/dsr", formData, {
        params,
        headers: { "Content-Type": "multipart/form-data" },
      });
      createdDsr = response.data;
    } else {
      const response = await api.post<DsrItem>("/dsr", null, {
        params,
      });
      createdDsr = response.data;
    }

    // Since POST /dsr might not accept total_labour, skilled_labour, unskilled_labour in some backend schemas,
    // we also call PUT /dsr/{id} to save these labour statistics right after creation if they are provided.
    if (
      (total_labour !== undefined && total_labour !== null) ||
      (skilled_labour !== undefined && skilled_labour !== null) ||
      (unskilled_labour !== undefined && unskilled_labour !== null)
    ) {
      try {
        createdDsr = await this.updateDsr(createdDsr.id, {
          total_labour,
          skilled_labour,
          unskilled_labour,
        });
      } catch (err) {
        console.error("Failed to persist labour metrics during DSR creation:", err);
      }
    }

    return createdDsr;
  },

  /**
   * Get all DSRs for a project
   * GET /api/v1/dsr/project/{project_id}
   */
  async getDsrByProject(
    projectId: number,
    params?: { 
      limit?: number; 
      offset?: number;
      start_date?: string;
      end_date?: string;
      contractor_name?: string;
    }
  ): Promise<DsrResponse> {
    const response = await api.get<DsrResponse>(`/dsr/project/${projectId}`, {
      params,
    });
    return response.data;
  },

  /**
   * Get single DSR by ID
   * GET /api/v1/dsr/{id}
   */
  async getDsrById(id: number): Promise<DsrItem> {
    const response = await api.get<DsrItem>(`/dsr/${id}`);
    return response.data;
  },

  /**
   * Update DSR
   * PUT /api/v1/dsr/{id}
   */
  async updateDsr(id: number, data: UpdateDsrRequest): Promise<DsrItem> {
    const { dsr_image, resolved_address, ...payload } = data;
    
    // We send payload in the body, but also copy fields to params just in case the backend reads them from query string
    const params: Record<string, any> = {};
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (typeof value === "string" && value.trim() === "") {
          return;
        }
        params[key] = value;
      }
    });

    // Defensively ensure weather is a valid WeatherType enum value
    if (params.weather && !["Sunny", "Rainy", "Cloudy", "Windy"].includes(params.weather)) {
      params.weather = "Sunny";
    }

    const response = await api.put<DsrItem>(`/dsr/${id}`, payload, { params });
    return response.data;
  },

  /**
   * Delete DSR
   * DELETE /api/v1/dsr/{id}
   */
  async deleteDsr(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete<{ success: boolean; message: string }>(
      `/dsr/${id}`
    );
    return response.data;
  },

  /**
   * Submit DSR (Draft → Submitted)
   * PUT /api/v1/dsr/{id}/submit
   */
  async submitDsr(id: number): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>(`/dsr/${id}/submit`);
    return response.data;
  },

  /**
   * Approve DSR (Submitted → Approved)
   * PUT /api/v1/dsr/{id}/approve
   */
  async approveDsr(id: number): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>(`/dsr/${id}/approve`);
    return response.data;
  },

  /**
   * Reject DSR (Submitted → Draft)
   * PUT /api/v1/dsr/{id}/reject
   */
  async rejectDsr(id: number): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>(`/dsr/${id}/reject`);
    return response.data;
  },

  /**
   * Upload photo for a DSR
   * POST /api/v1/dsr/{dsr_id}/photos
   * Field name must be "file"
   */
  async uploadDsrPhoto(
    dsr_id: number,
    file: File
  ): Promise<{ status: string; uploaded: string[] }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ status: string; uploaded: string[] }>(
      `/dsr/${dsr_id}/photos`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return response.data;
  },

  /**
   * Get all photos for a DSR
   * GET /api/v1/dsr/{dsr_id}/photos
   */
  async getDsrPhotos(dsr_id: number): Promise<DsrPhoto[]> {
    const response = await api.get<DsrPhoto[]>(`/dsr/${dsr_id}/photos`);
    return response.data;
  },

  /**
   * Delete a DSR photo
   * DELETE /api/v1/dsr/photo/{photo_id}
   */
  async deleteDsrPhoto(photo_id: number): Promise<{ status: string }> {
    const response = await api.delete<{ status: string }>(
      `/dsr/photo/${photo_id}`
    );
    return response.data;
  },

  /**
   * Get DSR map points for a project
   * GET /api/v1/dsr/project/{project_id}/map
   */
  async getDsrMapPoints(project_id: number): Promise<DsrMapPoint[]> {
    const response = await api.get<DsrMapPoint[]>(
      `/dsr/project/${project_id}/map`
    );
    return response.data;
  },

  /**
   * Get labour trend analytics
   * GET /api/v1/dsr/project/{project_id}/analytics/labour
   */
  async getLabourTrend(
    project_id: number,
    start_date?: string,
    end_date?: string
  ): Promise<LabourTrend[]> {
    const response = await api.get<LabourTrend[]>(
      `/dsr/project/${project_id}/analytics/labour`,
      { params: { start_date, end_date } }
    );
    return response.data;
  },

  /**
   * Get contractor analytics
   * GET /api/v1/dsr/project/{project_id}/analytics/contractor
   */
  async getContractorAnalytics(
    project_id: number,
    start_date?: string,
    end_date?: string
  ): Promise<ContractorAnalytics[]> {
    const response = await api.get<ContractorAnalytics[]>(
      `/dsr/project/${project_id}/analytics/contractor`,
      { params: { start_date, end_date } }
    );
    return response.data;
  },

  /**
   * Get issue analytics
   * GET /api/v1/dsr/project/{project_id}/analytics/issues
   */
  async getIssueAnalytics(project_id: number): Promise<IssueAnalytics> {
    const response = await api.get<IssueAnalytics>(
      `/dsr/project/${project_id}/analytics/issues`
    );
    return response.data;
  },

  /**
   * Export DSR to Excel — triggers browser download automatically
   * GET /api/v1/dsr/project/{project_id}/export
   */
  async exportDsrExcel(
    project_id: number,
    params?: {
      start_date?: string;
      end_date?: string;
      contractor_name?: string;
    }
  ): Promise<void> {
    const response = await api.get(`/dsr/project/${project_id}/export`, {
      params,
      responseType: "blob",
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "dsr_export.xlsx");
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
