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
    const { 
      dsr_image, total_labour, skilled_labour, unskilled_labour, resolved_address, 
      ...payload 
    } = data;

    // Defensively ensure weather is a valid value
    if (payload.weather && !["Sunny", "Rainy", "Cloudy", "Windy", "Foggy", "Stormy"].includes(payload.weather)) {
      payload.weather = "Sunny";
    }

    // Convert empty strings and 0 for optional foreign keys to null
    const finalPayload: any = { ...payload };
    Object.keys(finalPayload).forEach(key => {
      if (finalPayload[key] === "" || (key === "contractor_id" && finalPayload[key] === 0)) {
        finalPayload[key] = null;
      }
    });

    // POST /dsr expects query parameters, NOT a JSON body
    const response = await api.post<DsrItem>("/dsr", null, { params: finalPayload });
    return response.data;
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
      status?: string;
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
    const { 
      dsr_image, resolved_address, total_labour, skilled_labour, unskilled_labour, 
      ...payload 
    } = data;

    if (payload.weather && !["Sunny", "Rainy", "Cloudy", "Windy", "Foggy", "Stormy"].includes(payload.weather)) {
      payload.weather = "Sunny";
    }

    // Convert empty strings and 0 for optional foreign keys to null
    const finalPayload: any = { ...payload };
    Object.keys(finalPayload).forEach(key => {
      if (finalPayload[key] === "" || (key === "contractor_id" && finalPayload[key] === 0)) {
        finalPayload[key] = null;
      }
    });

    // PUT /dsr/{id} expects query parameters, NOT a JSON body
    const response = await api.put<DsrItem>(`/dsr/${id}`, null, { params: finalPayload });
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
    const response = await api.put<{ message: string }>(`/dsr/${id}/submit`, {});
    return response.data;
  },

  /**
   * Approve DSR (Submitted → Approved)
   * PUT /api/v1/dsr/{id}/approve
   */
  async approveDsr(id: number): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>(`/dsr/${id}/approve`, {});
    return response.data;
  },

  /**
   * Reject DSR (Submitted → Draft/Rejected)
   * PUT /api/v1/dsr/{id}/reject
   */
  async rejectDsr(id: number): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>(`/dsr/${id}/reject`, {});
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

  /**
   * Export individual DSR to PDF
   * GET /api/v1/dsr/{dsr_id}/pdf (assuming typical convention)
   */
  async exportDsrPdf(dsr_id: number): Promise<void> {
    try {
      const response = await api.get(`/dsr/${dsr_id}/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `DSR_Report_${dsr_id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export DSR PDF from API:", error);
      throw error;
    }
  },
};
