import api from "./api";
import type {
  Material,
  MaterialCreate,
  MaterialUpdate,
  Supplier,
  SupplierCreate,
  UsagePayload,
  PurchasePayload,
  InventoryLog,
  MaterialReport
} from "../types/material";

export const materialService = {
  /**
   * List all materials for a project
   * GET /api/v1/materials
   */
  async listMaterials(project_id: number, skip: number = 0, limit: number = 50): Promise<Material[]> {
    const response = await api.get<Material[]>("/materials", {
      params: { project_id, skip, limit }
    });
    const data = response.data;
    return Array.isArray(data) ? data : ((data as any).items || (data as any).data || []);
  },

  /**
   * Get single material by ID
   * GET /api/v1/materials/{id}
   */
  async getMaterial(id: number): Promise<Material> {
    const response = await api.get<Material>(`/materials/${id}`);
    return response.data;
  },

  /**
   * Create new material
   * POST /api/v1/materials
   */
  async createMaterial(data: MaterialCreate): Promise<Material> {
    const response = await api.post<Material>("/materials", data);
    return response.data;
  },

  /**
   * Update existing material
   * PUT /api/v1/materials/{id}
   */
  async updateMaterial(id: number, data: MaterialUpdate): Promise<Material> {
    const response = await api.put<Material>(`/materials/${id}`, data);
    return response.data;
  },

  /**
   * Delete material
   * DELETE /api/v1/materials/{id}
   */
  async deleteMaterial(id: number): Promise<void> {
    await api.delete(`/materials/${id}`);
  },

  /**
   * Record material usage (consumption)
   * POST /api/v1/materials/{id}/usage
   */
  async recordUsage(material_id: number, data: UsagePayload): Promise<Material> {
    const response = await api.post<Material>(`/materials/${material_id}/usage`, data);
    return response.data;
  },

  /**
   * Record material purchase
   * POST /api/v1/materials/{id}/purchase
   */
  async recordPurchase(material_id: number, data: PurchasePayload): Promise<Material> {
    const response = await api.post<Material>(`/materials/${material_id}/purchase`, data);
    return response.data;
  },

  /**
   * Get inventory summary
   * GET /api/v1/materials/inventory
   */
  async getInventory(): Promise<any[]> {
    const response = await api.get<any[]>("/materials/inventory");
    const data = response.data;
    return Array.isArray(data) ? data : ((data as any).items || (data as any).data || []);
  },

  /**
   * Get transaction logs
   * GET /api/v1/materials/logs
   */
  async getLogs(params: {
    project_id: number;
    material_id?: number;
    type?: string;
    limit?: number;
  }): Promise<InventoryLog[]> {
    const response = await api.get<InventoryLog[]>("/materials/logs", { params });
    return response.data;
  },

  /**
   * Get specific material transactions
   * GET /api/v1/materials/{id}/transactions
   */
  async getTransactions(material_id: number): Promise<MaterialLog[]> {
    const response = await api.get<MaterialLog[]>(`/materials/${material_id}/transactions`);
    return response.data;
  },

  /**
   * Get material report
   * GET /api/v1/materials/reports
   */
  async getMaterialReport(project_id: number): Promise<MaterialReport[]> {
    const response = await api.get<MaterialReport[]>("/materials/reports", {
      params: { project_id }
    });
    return response.data;
  },

  /**
   * Export report as PDF
   * GET /api/v1/materials/reports/pdf
   */
  async exportPdf(project_id: number): Promise<void> {
    const response = await api.get("/materials/reports/pdf", { 
      params: { project_id },
      responseType: 'blob' 
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `material_report_project_${project_id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export report as Excel
   * GET /api/v1/materials/reports/excel
   */
  async exportExcel(project_id: number): Promise<void> {
    const response = await api.get("/materials/reports/excel", { 
      params: { project_id },
      responseType: 'blob' 
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `material_report_project_${project_id}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Create a new supplier
   * POST /api/v1/materials/suppliers
   */
  async createSupplier(data: SupplierCreate): Promise<Supplier> {
    const response = await api.post<Supplier>("/materials/suppliers", data);
    return response.data;
  },

  /**
   * Get list of suppliers
   * GET /api/v1/materials/suppliers
   */
  async getSuppliers(): Promise<Supplier[]> {
    const response = await api.get<Supplier[]>("/materials/suppliers");
    const data = response.data;
    return Array.isArray(data) ? data : ((data as any).items || (data as any).data || []);
  },
};
