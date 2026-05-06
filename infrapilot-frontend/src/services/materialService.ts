import api from "./api";

export interface MaterialItem {
  id: number;
  material_code: string;
  project_id: number;
  material_name: string;
  category: string;
  unit: string;
  supplier_id: number;
  supplier_name: string;
  purchase_rate: number;
  rate_type: string;
  quantity_purchased: number;
  quantity_used: number;
  remaining_stock: number;
  total_amount: number;
  payment_given: number;
  payment_pending: number;
  extra_paid: number;
  minimum_stock_level: number;
  alert_type: string;
}

export interface InventoryItem {
  material_id: number;
  material_name: string;
  remaining_stock: number;
  unit: string;
  avg_rate: number;
  total_value: number;
  project_id: number;
}

export interface MaterialLog {
  id: number;
  material_id: number;
  type: string;
  quantity: number;
  rate: number;
  avg_rate: number;
  total_amount: number;
  amount_paid: number;
  payment_pending: number;
  issue_type: string;
  project_id: number;
  created_at: string;
}

export interface MaterialReport {
  material_id: number;
  material_name: string;
  total_purchased: number;
  total_used: number;
  remaining_stock: number;
  total_cost: number;
  payment_pending: number;
}

export interface CreateMaterialRequest {
  project_id: number;
  material_name: string;
  category: string;
  unit: string;
  supplier_id: number;
  purchase_rate: number;
  rate_type: string;
  quantity_purchased: number;
  payment_given: number;
  minimum_stock_level: number;
}

export interface UpdateMaterialRequest {
  material_name: string;
  category: string;
  unit: string;
  supplier_id: number;
  purchase_rate: number;
  rate_type: string;
  minimum_stock_level: number;
}

export interface UsageRequest {
  quantity: number;
  project_id: number;
  issue_type: string;
}

export interface PurchaseRequest {
  quantity: number;
  amount_paid: number;
  project_id: number;
  issue_type: string;
}

export const materialService = {
  /**
   * List all materials for a project
   * GET /api/v1/materials
   */
  async listMaterials(project_id: number, skip: number = 0, limit: number = 50): Promise<MaterialItem[]> {
    const response = await api.get<MaterialItem[]>("/materials", {
      params: { project_id, skip, limit }
    });
    return response.data;
  },

  /**
   * Get single material by ID
   * GET /api/v1/materials/{id}
   */
  async getMaterial(id: number): Promise<MaterialItem> {
    const response = await api.get<MaterialItem>(`/materials/${id}`);
    return response.data;
  },

  /**
   * Create new material
   * POST /api/v1/materials
   */
  async createMaterial(data: CreateMaterialRequest): Promise<MaterialItem> {
    const response = await api.post<MaterialItem>("/materials", data);
    return response.data;
  },

  /**
   * Update existing material
   * PUT /api/v1/materials/{id}
   */
  async updateMaterial(id: number, data: UpdateMaterialRequest): Promise<MaterialItem> {
    const response = await api.put<MaterialItem>(`/materials/${id}`, data);
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
  async recordUsage(material_id: number, data: UsageRequest): Promise<MaterialItem> {
    const response = await api.post<MaterialItem>(`/materials/${material_id}/usage`, data);
    return response.data;
  },

  /**
   * Record material purchase
   * POST /api/v1/materials/{id}/purchase
   */
  async recordPurchase(material_id: number, data: PurchaseRequest): Promise<MaterialItem> {
    const response = await api.post<MaterialItem>(`/materials/${material_id}/purchase`, data);
    return response.data;
  },

  /**
   * Get inventory summary
   * GET /api/v1/materials/inventory
   */
  async getInventory(): Promise<InventoryItem[]> {
    const response = await api.get<InventoryItem[]>("/materials/inventory");
    return response.data;
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
  }): Promise<MaterialLog[]> {
    const response = await api.get<MaterialLog[]>("/materials/logs", { params });
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
  async exportPdf(): Promise<void> {
    const response = await api.get("/materials/reports/pdf", { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'material_report.pdf');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export report as Excel
   * GET /api/v1/materials/reports/excel
   */
  async exportExcel(): Promise<void> {
    const response = await api.get("/materials/reports/excel", { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'material_report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};
