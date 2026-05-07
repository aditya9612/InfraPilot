import api from "./api";
import type { Material, MaterialCreate, Supplier, SupplierCreate } from "../types/material";

export const materialService = {
  /**
   * Create a new material
   * POST /api/v1/materials
   */
  createMaterial: async (data: MaterialCreate): Promise<Material> => {
    try {
      const response = await api.post("/materials", data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Create Material API Error details:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Get list of materials
   * GET /api/v1/materials
   */
  getMaterials: async (projectId?: number): Promise<Material[]> => {
    try {
      const params = projectId ? { project_id: projectId } : {};
      const response = await api.get("/materials", { params });
      const data = response.data;
      return Array.isArray(data) ? data : (data.items || data.data || []);
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Get Materials API Error details:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Create a new supplier
   * POST /api/v1/materials/suppliers
   */
  createSupplier: async (data: SupplierCreate): Promise<Supplier> => {
    try {
      const response = await api.post("/materials/suppliers", data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Create Supplier API Error details:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Get list of suppliers
   * GET /api/v1/materials/suppliers
   */
  getSuppliers: async (): Promise<Supplier[]> => {
    try {
      const response = await api.get("/materials/suppliers");
      const data = response.data;
      return Array.isArray(data) ? data : (data.items || data.data || []);
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Get Suppliers API Error details:", error.response.data);
      }
      throw error;
    }
  },
};
