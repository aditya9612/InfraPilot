import api from "./api";
import type {
  BoqFilters,
  BoqItem,
  CreateBoqRequest,
  UpdateBoqRequest,
  BoqResponse,
} from "../types/boq";

export const boqService = {
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
      const total = data.total || items.length;

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

  /**
   * Get all versions of BOQ for a project
   * GET /api/v1/boq/versions/{project_id}
   */
  async getBoqVersions(projectId: number): Promise<number[]> {
    try {
      const response = await api.get(`/boq/versions/${projectId}`);
      return response.data.versions || [];
    } catch (error: any) {
      console.error(
        `Get versions for Project ${projectId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
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
      console.error(
        `Get versions for BOQ ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
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
  async getBoqSummary(projectId: number): Promise<any> {
    try {
      const response = await api.get(`/boq/summary/${projectId}`);
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
  async getBoqComparison(projectId: number): Promise<any[]> {
    try {
      const response = await api.get(`/boq/comparison/${projectId}`);
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
   * Get audit logs for a specific BOQ item
   * GET /api/v1/boq/{boq_id}/logs
   */
  async getBoqLogs(boqId: number): Promise<any[]> {
    try {
      const response = await api.get(`/boq/${boqId}/logs`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Get Logs for Boq ${boqId} Error:`,
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
      console.error(
        `Export Boq ${boqId} as ${format} Error:`,
        error.response?.data || error.message,
      );
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
  async bulkAddItems(boqId: number, items: CreateBoqRequest[]): Promise<any> {
    try {
      const response = await api.post(`/boq/${boqId}/items/bulk`, { items });
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
  async generateTasksFromBoq(boqId: number): Promise<any> {
    try {
      const response = await api.post(`/boq/${boqId}/generate-tasks`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Generate Tasks from Boq ${boqId} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};
