console.log("BOQ Service Loaded - Version FIX_V1");
import api from "./api";

import type {
  BoqFilters,
  BoqItem,
  BoqGroupItem,
  CreateBoqRequest,
  UpdateBoqRequest,
  BoqResponse,
} from "../types/boq";

export const boqService = {
  /**
   * Download BOQ Template
   * GET /api/v1/boq/template/excel
   */
  async downloadTemplate(): Promise<void> {
    try {
      const response = await api.get('/boq/template/excel', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'BOQ_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Download Template Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * List Boq items with pagination and filters
   * GET /api/v1/boq
   */
  async getBoqs(filters: BoqFilters): Promise<BoqResponse> {
    try {
      const response = await api.get("/boq", { params: filters });
      const data = response.data;

      // Handle array vs object response
      const items = Array.isArray(data) ? data : data.items || data.data || [];
      const total = data.meta?.total ?? data.total ?? items.length;

      return {
        items,
        total,
        limit: filters.limit || 20,
        offset: filters.offset || 0,
      };
    } catch (error: any) {
      console.error(
        "Get Boqs API Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get a single Boq item by ID
   * GET /api/v1/boq/{boq_id}
   */
  async getBoqById(boqId: number): Promise<BoqItem> {
    try {
      const response = await api.get(`/boq/${boqId}`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Get Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Create a new Boq item
   * POST /api/v1/boq
   */
  async createBoq(boqData: CreateBoqRequest): Promise<BoqItem> {
    try {
      const response = await api.post("/boq", boqData);
      return response.data;
    } catch (error: any) {
      console.error("Create Boq Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update an existing Boq item
   * PUT /api/v1/boq/{boq_id}
   */
  async updateBoq(boqId: number, boqData: UpdateBoqRequest): Promise<BoqItem> {
    try {
      const response = await api.put(`/boq/${boqId}`, boqData);
      return response.data;
    } catch (error: any) {
      console.error(
        `Update Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Delete a Boq item
   * DELETE /api/v1/boq/{boq_id}
   */
  async deleteBoq(boqId: number): Promise<void> {
    try {
      await api.delete(`/boq/${boqId}`);
    } catch (error: any) {
      console.error(
        `Delete Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get Boq items by project ID
   * GET /api/v1/boq/project/{project_id}
   */
  async getBoqsByProject(projectId: number): Promise<BoqItem[]> {
    try {
      const response = await api.get(`/boq/project/${projectId}`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Get Boqs for Project ${projectId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  async getBoqVersions(boqId: number): Promise<number[]> {
    try {
      const response = await api.get(`/boq/${boqId}/versions`);
      return response.data.versions || [];
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error(
          `Get versions for Boq ${boqId} Error:`,
          error.response?.data || error.message,
        );
      }
      return [];
    }
  },

  /**
   * Get versions by BOQ ID
   * GET /api/v1/boq/{boq_id}/versions
   */
  async getBoqVersionsByBoqId(boqId: number): Promise<number[]> {
    try {
      const response = await api.get(`/boq/${boqId}/versions`);
      return response.data.versions || [];
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error(
          `Get versions for BOQ ${boqId} Error:`,
          error.response?.data || error.message,
        );
      }
      return [];
    }
  },

  /**
   * Update actual quantity and cost for a BOQ item
   * POST /api/v1/boq/{boq_id}/actuals
   */
  async updateBoqActuals(
    boqId: number,
    data: { actual_quantity: number; actual_cost: number },
  ): Promise<BoqItem> {
    try {
      const response = await api.post(`/boq/${boqId}/actuals`, data);
      return response.data;
    } catch (error: any) {
      console.error(
        `Update Actuals for Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get summary statistics for a project's BOQ
   * GET /api/v1/boq/summary/{project_id}
   */
  async getBoqSummary(projectId: number, version_no?: number | "latest"): Promise<any> {
    try {
      const params = version_no && version_no !== "latest" ? { version_no } : {};
      const response = await api.get(`/boq/summary/${projectId}`, { params });
      return response.data;
    } catch (error: any) {
      console.error(
        `Get Summary for Project ${projectId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get comparison data (Estimated vs Actual) for a project
   * GET /api/v1/boq/comparison/{project_id}
   */
  async getBoqComparison(projectId: number, version_no?: number | "latest"): Promise<any[]> {
    try {
      const params = version_no && version_no !== "latest" ? { version_no } : {};
      const response = await api.get(`/boq/comparison/${projectId}`, { params });
      return response.data;
    } catch (error: any) {
      console.error(
        `Get Comparison for Project ${projectId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get audit logs for a specific BOQ item or document
   * GET /api/v1/boq/{boq_id}/logs
   */
  async getBoqLogs(id: number): Promise<any[]> {
    try {
      const response = await api.get(`/boq/${id}/logs`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Get Logs for BOQ ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Export BOQ logs to CSV
   * GET /api/v1/boq/{boq_id}/logs/export/csv
   */
  async exportBoqLogsCsv(boqId: number): Promise<Blob> {
    try {
      const response = await api.get(`/boq/${boqId}/logs/export/csv`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      console.error(
        `Export Logs CSV for Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Add a single item to a BOQ group
   * POST /api/v1/boq/groups/{group_id}/items
   */
  async addBoqItem(groupId: number, itemData: CreateBoqRequest): Promise<BoqItem> {
    try {
      const response = await api.post(`/boq/groups/${groupId}/items`, itemData);
      return response.data;
    } catch (error: any) {
      console.error(
        "Add Item Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get all items inside a specific BOQ group
   * GET /api/v1/boq/groups/{group_id}/items
   */
  async getGroupItems(groupId: number): Promise<BoqGroupItem[]> {
    try {
      const response = await api.get(`/boq/groups/${groupId}/items`);
      const data = response.data;
      const items = Array.isArray(data) ? data : data.items || data.data || [];
      return items;
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        // Try fallback: maybe groupId is actually the BOQ item ID, and we need its boq_group_id
        try {
          const itemRes = await api.get(`/boq/${groupId}`);
          const boqGroupId = itemRes.data?.boq_group_id;
          if (boqGroupId && boqGroupId !== groupId) {
            const fallbackRes = await api.get(`/boq/groups/${boqGroupId}/items`);
            const fallbackData = fallbackRes.data;
            return Array.isArray(fallbackData) ? fallbackData : fallbackData.items || fallbackData.data || [];
          }
        } catch (e) { }

        // Final Fallback for empty groups or missing endpoint
        return [];
      }
      console.error(
        `Get Group Items for ${groupId} Error:`,
        error.response?.data || error.message,
      );
      // Fail silently to prevent Promise.all from crashing the whole list
      return [];
    }
  },

  /**
   * Update a single item within a BOQ group
   * PUT /api/v1/boq/items/{item_id}
   */
  async updateGroupItem(itemId: number, itemData: any): Promise<any> {
    try {
      const response = await api.put(`/boq/items/${itemId}`, itemData);
      return response.data;
    } catch (error: any) {
      console.error(
        `Update Item ${itemId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Delete a single item within a BOQ group
   * DELETE /api/v1/boq/items/{item_id}
   */
  async deleteGroupItem(itemId: number): Promise<void> {
    try {
      await api.delete(`/boq/items/${itemId}`);
    } catch (error: any) {
      console.error(
        `Delete Item ${itemId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Import Excel file into a BOQ group
   * POST /api/v1/boq/groups/{group_id}/import/excel
   */
  async importGroupExcel(groupId: number, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post(`/boq/groups/${groupId}/import/excel`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      console.error(
        `Import Excel for Group ${groupId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * List all items for a specific BOQ document/project
   * GET /api/v1/boq?project_id={id}
   */
  async getBoqItems(projectId: number): Promise<BoqItem[]> {
    try {
      // Switch to the project-specific endpoint which is more reliable
      return await this.getBoqsByProject(projectId);
    } catch (error: any) {
      console.error(
        `Get Items for Project ${projectId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Update a specific BOQ line item
   * PUT /api/v1/boq/items/{item_id}
   */
  async updateBoqItem(itemId: number, itemData: UpdateBoqRequest): Promise<BoqItem> {
    try {
      const response = await api.put(`/boq/items/${itemId}`, itemData);
      return response.data;
    } catch (error: any) {
      console.error(
        `Update Boq Item ${itemId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Delete a specific BOQ line item
   * DELETE /api/v1/boq/items/{item_id}
   */
  async deleteBoqItem(itemId: number): Promise<void> {
    try {
      await api.delete(`/boq/items/${itemId}`);
    } catch (error: any) {
      console.error(
        `Delete Boq Item ${itemId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Create a new version of a BOQ
   * POST /api/v1/boq/{boq_id}/versions
   */
  async createBoqVersion(boqId: number): Promise<any> {
    try {
      const response = await api.post(`/boq/${boqId}/versions`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Create Version for Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get BOQ Report for a specific BOQ ID
   * GET /api/v1/boq/{boq_id}/report?format=pdf
   */
  async getBoqReport(
    boqId: number,
    format: "pdf" | "excel" | "csv" = "pdf",
  ): Promise<any> {
    try {
      const response = await api.get(`/boq/${boqId}/report`, {
        params: { format },
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      console.error(
        `Get Report for Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Export BOQ in different formats
   * GET /api/v1/boq/{boq_id}/export/{format}
   */
  async exportBoq(
    boqId: number,
    format: "excel" | "pdf" | "json",
    filters: any = {}
  ): Promise<any> {
    try {
      const responseType = format === "json" ? "json" : "blob";
      const response = await api.get(`/boq/${boqId}/export/${format}`, {
        responseType,
        params: filters
      });
      return response.data;
    } catch (error: any) {
      const status = error.response?.status;
      // Suppress 404 — endpoint may not be implemented on backend yet
      if (status !== 404) {
        console.error(
          `Export Boq ${boqId} as ${format} Error:`,
          error.response?.data || error.message,
        );
      }
      throw error;
    }
  },

  /**
   * Get optimization suggestions for a BOQ item
   * GET /api/v1/boq/{boq_id}/optimize
   */
  async getBoqSuggestions(boqId: number): Promise<any> {
    try {
      const response = await api.get(`/boq/${boqId}/optimize`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Get Suggestions for Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Bulk add items to a BOQ document
   * POST /api/v1/boq/{boq_id}/items/bulk
   */
  async bulkAddItems(boqId: number, items: CreateBoqRequest[]): Promise<any[]> {
    console.log("bulkAddItems called with:", { boqId, itemCount: items.length });
    try {
      // Adding dummy query parameters to bypass backend FastAPI dependency error 
      // expecting BOQImportResponse and BOQImportError as query params
      const response = await api.post(`/boq/groups/${boqId}/items/bulk`, { items }, {
        params: {
          BOQImportResponse: "",
          BOQImportError: ""
        }
      });
      return response.data;
    } catch (error: any) {
      console.error(
        `Bulk Add Items to Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Generate tasks from BOQ items
   * POST /api/v1/boq/{boq_id}/generate-tasks
   */
  async generateTasksFromBoq(boqId: number, milestoneId?: number): Promise<any> {
    try {
      const url = milestoneId
        ? `/boq/${boqId}/generate-tasks?milestone_id=${milestoneId}`
        : `/boq/${boqId}/generate-tasks`;
      // Send POST request with empty body, since parameters are in path and query
      const response = await api.post(url);
      return response.data;
    } catch (error: any) {
      console.error(
        `Generate Tasks from Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get BOQ alerts
   * GET /api/v1/boq/{boq_id}/alerts
   */
  async getBoqAlerts(boqId: number): Promise<any[]> {
    try {
      const response = await api.get(`/boq/${boqId}/alerts`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Get Alerts for Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      return [];
    }
  },

};
