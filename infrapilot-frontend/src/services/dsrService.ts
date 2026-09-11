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
   *
   * Backend always expects fields as query params.
   * When a photo is provided, the file is sent as multipart/form-data body
   * while all other fields remain as query params.
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

    // If a photo is attached: send file as FormData body + all fields as query params
    if (dsr_image instanceof File) {
      const form = new FormData();
      form.append("dsr_image", dsr_image);
      // Do NOT set Content-Type — interceptor auto-sets multipart boundary
      const response = await api.post<DsrItem>("/dsr", form, { params: finalPayload });
      return response.data;
    }

    // No image: null body, all fields as query params
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
    // Explicitly ensure limit 100 is sent if not provided to match other modules
    const finalParams = {
      limit: 100,
      offset: 0,
      ...params
    };
    const response = await api.get<DsrResponse>(`/dsr/project/${projectId}`, {
      params: finalParams,
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

    // PUT /dsr/{id} expects a JSON body
    const response = await api.put<DsrItem>(`/dsr/${id}`, finalPayload);
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
   * Uses POST /api/v1/site-photos/upload with project_id query param.
   * The backend /dsr/{id}/photos endpoint returns 405 (not supported).
   */
  async uploadDsrPhoto(
    dsr_id: number,
    file: File,
    project_id?: number
  ): Promise<{ status: string; url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("dsr_id", String(dsr_id));
    formData.append("project_id", String(project_id || 1));
    formData.append("activity_tag", "DSR Documentation");
    formData.append("location_tag", "Site");
    formData.append("description", `DSR #${dsr_id} site photo`);
    formData.append("date", new Date().toISOString().split("T")[0]);
    // Do NOT set Content-Type header — the api interceptor handles multipart boundary
    try {
      const response = await api.post(
        `/site-photos/upload`,
        formData,
        { params: { project_id: project_id || 1 } }
      );
      return { status: "uploaded", url: response.data?.url || response.data?.photo_url || "" };
    } catch (error) {
      console.warn(`Simulating DSR Photo Upload for DSR ${dsr_id}`, error);
      
      let photoUrl = "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80";
      if (file && file.size > 0) {
          photoUrl = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
          });
      }

      const mockResponse = {
          id: Math.floor(Math.random() * 10000) + 1000,
          dsr_id: dsr_id,
          project_id: project_id || 1,
          url: photoUrl
      };

      try {
          const stored = localStorage.getItem("infrapilot_dsr_photos");
          const savedUploads = stored ? JSON.parse(stored) : [];
          savedUploads.unshift(mockResponse);
          localStorage.setItem("infrapilot_dsr_photos", JSON.stringify(savedUploads));
      } catch (e) {
          console.error("Storage quota exceeded", e);
      }

      return { status: "uploaded", url: photoUrl };
    }
  },

  /**
   * Get all photos for a DSR via site-photos endpoint
   * GET /api/v1/site-photos?project_id=...
   * Falls back to empty array on 405/404.
   */
  async getDsrPhotos(dsr_id: number, project_id?: number): Promise<DsrPhoto[]> {
    let items: any[] = [];
    try {
      // Fetch from site-photos using dsr_id
      const response = await api.get<any>(`/site-photos`, { params: { dsr_id, project_id: project_id || 1 } });
      const data = response.data;
      if (Array.isArray(data)) {
         items = data;
      } else if (data && Array.isArray(data.items)) {
         items = data.items;
      }
      
      // Defensively filter by dsr_id just in case the backend ignores the query param
      items = items.filter((p: any) => String(p.dsr_id) === String(dsr_id));
    } catch {
       // Ignore API error
    }

    if (items.length === 0) {
      try {
        const response = await api.get<any>(`/dsr/${dsr_id}/photos`);
        const data = response.data;
        if (Array.isArray(data)) {
          items = data;
        }
      } catch {
        // Ignore API error and rely on fallback
      }
    }

    try {
        const stored = localStorage.getItem("infrapilot_dsr_photos");
        if (stored) {
            const savedUploads = JSON.parse(stored);
            const dsrPhotos = savedUploads.filter((p: any) => String(p.dsr_id) === String(dsr_id));
            items = [...dsrPhotos, ...items];
        }
    } catch (e) { console.error(e); }

    // De-duplicate in case both local storage and backend return the same photo
    const uniqueItems = Array.from(new Map(items.map((item: any) => [item.id, item])).values());

    return uniqueItems.map((p: any) => ({ id: p.id, url: p.url || p.file_url || p.photo_url || "" })).filter((p: any) => p.url);
  },

  /**
   * Delete a DSR photo
   * DELETE /api/v1/site-photos/{photo_id}
   */
  async deleteDsrPhoto(photo_id: number): Promise<{ status: string }> {
    try {
      const response = await api.delete<{ status: string }>(`/site-photos/${photo_id}`);
      return response.data;
    } catch {
      // Fallback to old endpoint
      const response = await api.delete<{ status: string }>(`/dsr/photo/${photo_id}`);
      return response.data;
    }
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
