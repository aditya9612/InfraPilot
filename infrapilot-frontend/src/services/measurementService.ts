import api from "./api";
import type { Measurement, MeasurementCreateData, MeasurementUpdateData } from "../types/measurement";

export const measurementService = {


  /**
   * Get all measurements for a project
   * GET /api/v1/measurements/project/{project_id}
   */
  async getMeasurementsByProject(projectId: number): Promise<Measurement[]> {
    try {
      const response = await api.get(`/measurements/project/${projectId}`);
      return Array.isArray(response.data) ? response.data : response.data.items || [];
    } catch (error: any) {
      console.error(`Fetch Measurements for Project ${projectId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },


  /**
   * Get a single measurement
   * GET /api/v1/measurements/{id}
   */
  async getMeasurementById(id: number): Promise<Measurement> {
    try {
      const response = await api.get(`/measurements/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Fetch Measurement ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create a new measurement
   * POST /api/v1/measurements
   */
  async createMeasurement(data: MeasurementCreateData): Promise<Measurement> {
    try {
      const response = await api.post("/measurements", data);
      return response.data;
    } catch (error: any) {
      console.error("Create Measurement Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update a measurement
   * PUT /api/v1/measurements/{id}
   */
  async updateMeasurement(id: number, data: MeasurementUpdateData): Promise<Measurement> {
    try {
      const response = await api.put(`/measurements/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Update Measurement ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update only the status of a measurement
   * PUT /api/v1/measurements/{id}/status
   */
  async updateMeasurementStatus(id: number, status: string): Promise<Measurement> {
    try {
      const response = await api.put(`/measurements/${id}/status`, { status });
      return response.data;
    } catch (error: any) {
      console.error(`Update Measurement Status ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete a measurement
   * DELETE /api/v1/measurements/{id}
   */
  async deleteMeasurement(id: number): Promise<void> {
    try {
      await api.delete(`/measurements/${id}`);
    } catch (error: any) {
      console.error(`Delete Measurement ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },
};
