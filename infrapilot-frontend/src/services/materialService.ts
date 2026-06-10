import api from "./api";
import type {
  Material,
  MaterialCreate,
  MaterialUpdate,
  Supplier,
  UsagePayload,
  PurchasePayload,
  InventoryLog,
  MaterialReport,
  MaterialLog,
  PurchaseOrder,
  POCreate,
  Transfer,
  TransferCreate,
  PriceHistory,
  InventorySummary
} from "../types/material";

export type {
  Material,
  MaterialCreate,
  MaterialUpdate,
  Supplier,
  SupplierCreate,
  UsagePayload,
  PurchasePayload,
  InventoryLog,
  MaterialReport,
  MaterialItem,
  InventoryItem,
  MaterialLog,
  CreateMaterialRequest,
  IssueType,
  RateType,
  AlertType,
  PurchaseOrder,
  POCreate,
  Transfer,
  TransferCreate,
  PriceHistory,
  InventorySummary
} from "../types/material";

const mapMaterial = (m: any): Material => ({
  ...m,
  material_id: m.material_id ?? m.id,
  total_value: m.total_value ?? m.total_amount ?? 0,
  avg_rate: m.avg_rate ?? m.purchase_rate ?? 0
});

const mapSupplier = (s: any): Supplier => ({
  ...s,
  name: s.supplier_name || s.name || "",
  contactPerson: s.contact_person || s.contactPerson || "N/A",
  contact: s.phone_email || s.contact || "",
  gst: s.gst_number || s.gst || "",
  address: s.address || ""
});

export const materialService = {
  /**
   * List all materials for a project
   * GET /api/v1/materials
   */
  async listMaterials(project_id?: number, skip: number = 0, limit: number = 50): Promise<Material[]> {
    console.log("GET /api/v1/materials Request Params:", { project_id, skip, limit });
    const params: any = { skip, limit };
    if (project_id !== undefined) params.project_id = project_id;

    const response = await api.get<Material[]>("/materials", { params });
    const data = response.data;
    const items = Array.isArray(data) ? data : ((data as any).items || (data as any).data || []);
    return items.map(mapMaterial);
  },

  async getMaterial(id: number): Promise<Material> {
    console.log(`GET /api/v1/materials/${id}`);
    const response = await api.get<Material>(`/materials/${id}`);
    return mapMaterial(response.data);
  },

  async createMaterial(data: MaterialCreate): Promise<Material> {
    console.log("POST /api/v1/materials Request Body:", data);
    const response = await api.post<Material>("/materials", data);
    return mapMaterial(response.data);
  },

  /**
   * Update existing material
   * PUT /api/v1/materials/{id}
   */
  async updateMaterial(id: number, data: MaterialUpdate): Promise<Material> {
    const response = await api.put<Material>(`/materials/${id}`, data);
    return mapMaterial(response.data);
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
    return mapMaterial(response.data);
  },

  /**
   * Record material purchase
   * POST /api/v1/materials/{id}/purchase
   */
  async recordPurchase(material_id: number, data: PurchasePayload): Promise<Material> {
    const response = await api.post<Material>(`/materials/${material_id}/purchase`, data);
    return mapMaterial(response.data);
  },

  /**
   * Get inventory summary
   * GET /api/v1/materials/inventory
   */
  async getInventory(project_id?: number): Promise<Material[]> {
    const response = await api.get<any[]>("/materials/inventory", {
      params: project_id ? { project_id } : undefined
    });
    const data = response.data;
    const items = Array.isArray(data) ? data : ((data as any).items || (data as any).data || []);
    return items.map(mapMaterial);
  },

  /**
   * Get transaction logs
   * GET /api/v1/materials/logs
   */
  async getLogs(params: {
    project_id?: number;
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
    console.log(`GET /api/v1/materials/${material_id}/transactions`);
    const response = await api.get<MaterialLog[]>(`/materials/${material_id}/transactions`);
    return response.data;
  },

  async getMaterialReport(project_id: number): Promise<MaterialReport[]> {
    console.log("GET /api/v1/materials/reports Request Params:", { project_id });
    const response = await api.get<any>("/materials/reports", {
      params: { project_id }
    });
    const data = response.data;
    const items = Array.isArray(data) ? data : ((data as any).items || (data as any).data || []);
    return items.map((rep: any) => ({
      ...rep,
      material_id: rep.material_id ?? rep.id ?? Math.floor(Math.random() * 10000),
      material_name: rep.material_name || "Unknown Material",
      total_purchased: rep.total_purchased ?? 0,
      total_used: rep.total_used ?? 0,
      remaining_stock: rep.remaining_stock ?? 0,
      total_cost: rep.total_cost ?? 0,
      payment_pending: rep.payment_pending ?? 0,
      project_id: rep.project_id
    }));
  },
  async exportPdf(project_id?: number): Promise<void> {
    try {
      const response = await api.get("/materials/reports/materials/pdf", { 
        params: project_id ? { project_id } : undefined,
        responseType: 'blob' 
      });
      if (response.status === 200) {
        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'material_report.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        throw new Error("Failed to export PDF");
      }
    } catch (e) {
      console.error("PDF API call failed", e);
      throw e;
    }
  },

  async exportExcel(project_id?: number): Promise<void> {
    try {
      const response = await api.get("/materials/reports/materials/excel", { 
        params: project_id ? { project_id } : undefined,
        responseType: 'blob' 
      });
      if (response.status === 200) {
        const blob = new Blob([response.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'material_report.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        throw new Error("Failed to export Excel");
      }
    } catch (e) {
      console.error("Excel API call failed", e);
      throw e;
    }
  },

  async createSupplier(data: any): Promise<Supplier> {
    const payload = {
      supplier_name: data.name || data.supplier_name,
      contact_person: data.contactPerson || data.contact_person || undefined,
      phone_email: data.phone || data.email ? `${data.phone || ""} ${data.email || ""}`.trim() : (data.phone_email || data.contact || undefined),
      gst_number: data.gst || data.gst_number || undefined,
      address: data.address || undefined
    };
    const response = await api.post<Supplier>("/materials/suppliers", payload);
    return mapSupplier(response.data);
  },

  async getSuppliers(): Promise<Supplier[]> {
    const response = await api.get<any>("/materials/suppliers");
    const data = response.data;
    const items = Array.isArray(data) ? data : (data.items || data.data || []);
    return items.map(mapSupplier);
  },

  async getSupplier(id: number): Promise<Supplier> {
    const response = await api.get<any>(`/materials/suppliers/${id}`);
    return mapSupplier(response.data);
  },

  async updateSupplier(id: number, data: any): Promise<Supplier> {
    const payload = {
      supplier_name: data.name || data.supplier_name,
      contact_person: data.contactPerson || data.contact_person || undefined,
      phone_email: data.phone || data.email ? `${data.phone || ""} ${data.email || ""}`.trim() : (data.phone_email || data.contact || undefined),
      gst_number: data.gst || data.gst_number || undefined,
      address: data.address || undefined
    };
    const response = await api.put<any>(`/materials/suppliers/${id}`, payload);
    return mapSupplier(response.data);
  },

  async deleteSupplier(id: number): Promise<void> {
    await api.delete(`/materials/suppliers/${id}`);
  },

  async getSupplierMaterials(supplier_id: number): Promise<Material[]> {
    const response = await api.get<Material[]>(`/materials/suppliers/${supplier_id}/materials`);
    return response.data.map(mapMaterial);
  },

  async getMaterialAlerts(threshold?: number): Promise<Material[]> {
    const params = threshold ? { threshold } : undefined;
    const response = await api.get<Material[]>("/materials/alerts", { params });
    return response.data.map(mapMaterial);
  },

  async createPurchaseOrder(data: POCreate): Promise<PurchaseOrder> {
    const response = await api.post<PurchaseOrder>("/materials/purchase-orders", data);
    return response.data;
  },

  async listPurchaseOrders(skip: number = 0, limit: number = 50): Promise<PurchaseOrder[]> {
    const response = await api.get<PurchaseOrder[]>("/materials/purchase-orders", { params: { skip, limit } });
    return response.data;
  },

  async getPurchaseOrder(id: number): Promise<PurchaseOrder> {
    const response = await api.get<PurchaseOrder>(`/materials/purchase-orders/${id}`);
    return response.data;
  },

  async updatePurchaseOrder(id: number, data: any): Promise<PurchaseOrder> {
    const response = await api.put<PurchaseOrder>(`/materials/purchase-orders/${id}`, data);
    return response.data;
  },

  async deletePurchaseOrder(id: number): Promise<void> {
    await api.delete(`/materials/purchase-orders/${id}`);
  },

  async getProjectTransactions(project_id: number): Promise<MaterialLog[]> {
    const response = await api.get<MaterialLog[]>(`/materials/projects/${project_id}/transactions`);
    return response.data;
  },

  async createTransfer(data: TransferCreate): Promise<Transfer> {
    const response = await api.post<Transfer>("/materials/transfers", data);
    return response.data;
  },

  async getTransfer(id: number): Promise<Transfer> {
    const response = await api.get<Transfer>(`/materials/transfers/${id}`);
    return response.data;
  },

  async listTransfers(skip: number = 0, limit: number = 50): Promise<any> {
    const response = await api.get<any>("/materials/transfers", { params: { skip, limit } });
    return response.data;
  },

  async updateTransferStatus(id: number, status: string): Promise<Transfer> {
    const response = await api.put<Transfer>(`/materials/transfers/${id}`, null, { params: { status } });
    return response.data;
  },

  async adjustInventory(data: any): Promise<any> {
    const response = await api.post<any>("/materials/inventory", data);
    return response.data;
  },

  async getInventoryValuation(): Promise<any> {
    const response = await api.get<any>("/materials/inventory/valuation");
    return response.data;
  },

  async getProjectInventory(project_id: number): Promise<Material[]> {
    const response = await api.get<Material[]>(`/materials/inventory/${project_id}`);
    return response.data.map(mapMaterial);
  },

  async getPriceHistory(material_id: number): Promise<PriceHistory[]> {
    const response = await api.get<PriceHistory[]>(`/materials/materials/price-history/${material_id}`);
    return response.data;
  },

  async getMaterialSummary(): Promise<InventorySummary> {
    const response = await api.get<InventorySummary>("/materials/summary");
    return response.data;
  }
};
