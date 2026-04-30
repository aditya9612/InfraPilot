import api from './api'; // Updated imports
import type { 
  Material, MaterialCreate, MaterialUpdate, 
  Supplier, SupplierCreate, 
  PurchaseOrder, POCreate, 
  Transfer, TransferCreate,
  InventoryLog, MaterialReport, PriceHistory, InventorySummary
} from '../types/material';

export const materialService = {
  // --- Materials ---
  async createMaterial(data: MaterialCreate): Promise<Material> {
    const response = await api.post('/materials', data);
    return response.data;
  },

  async getMaterials(projectId?: number, skip = 0, limit = 50): Promise<Material[]> {
    const params = { project_id: projectId, skip, limit };
    const response = await api.get('/materials', { params });
    return response.data;
  },

  async getMaterial(id: number): Promise<Material> {
    const response = await api.get(`/materials/${id}`);
    return response.data;
  },

  async updateMaterial(id: number, data: MaterialUpdate): Promise<Material> {
    const response = await api.put(`/materials/${id}`, data);
    return response.data;
  },

  async deleteMaterial(id: number): Promise<void> {
    await api.delete(`/materials/${id}`);
  },

  async logUsage(id: number, data: { quantity: number; project_id: number; issue_type: string }): Promise<Material> {
    const response = await api.post(`/materials/${id}/usage`, data);
    return response.data;
  },

  async logPurchase(id: number, data: { quantity: number; amount_paid: number; project_id: number; issue_type: string }): Promise<Material> {
    const response = await api.post(`/materials/${id}/purchase`, data);
    return response.data;
  },

  // --- Suppliers ---
  async createSupplier(data: SupplierCreate): Promise<Supplier> {
    const response = await api.post('/materials/suppliers', data);
    return response.data;
  },

  async getSuppliers(limit = 50): Promise<Supplier[]> {
    const response = await api.get('/materials/suppliers', { params: { limit } });
    return response.data;
  },

  async getSupplier(id: number): Promise<Supplier> {
    const response = await api.get(`/materials/suppliers/${id}`);
    return response.data;
  },

  async updateSupplier(id: number, data: SupplierCreate): Promise<Supplier> {
    const response = await api.put(`/materials/suppliers/${id}`, data);
    return response.data;
  },

  async deleteSupplier(id: number): Promise<void> {
    await api.delete(`/materials/suppliers/${id}`);
  },

  async getSupplierMaterials(supplierId: number): Promise<Material[]> {
    const response = await api.get(`/materials/suppliers/${supplierId}/materials`);
    return response.data;
  },

  // --- Purchase Orders ---
  async createPO(data: POCreate): Promise<PurchaseOrder> {
    const response = await api.post('/materials/purchase-orders', data);
    return response.data;
  },

  async getPOs(skip = 0, limit = 50): Promise<PurchaseOrder[]> {
    const response = await api.get('/materials/purchase-orders', { params: { skip, limit } });
    return response.data;
  },

  async getPO(id: number): Promise<PurchaseOrder> {
    const response = await api.get(`/materials/purchase-orders/${id}`);
    return response.data;
  },

  async updatePO(id: number, data: POCreate): Promise<PurchaseOrder> {
    const response = await api.put(`/materials/purchase-orders/${id}`, data);
    return response.data;
  },

  async deletePO(id: number): Promise<void> {
    await api.delete(`/materials/purchase-orders/${id}`);
  },

  // --- Transfers ---
  async createTransfer(data: TransferCreate): Promise<Transfer> {
    const response = await api.post('/materials/transfers', data);
    return response.data;
  },

  async getTransfers(skip = 0, limit = 50): Promise<Transfer[]> {
    const response = await api.get('/materials/transfers', { params: { skip, limit } });
    return response.data;
  },

  async getTransfer(id: number): Promise<Transfer> {
    const response = await api.get(`/materials/transfers/${id}`);
    return response.data;
  },

  async updateTransferStatus(id: number, status: string): Promise<Transfer> {
    const response = await api.put(`/materials/transfers/${id}`, { status });
    return response.data;
  },

  // --- Inventory & Summary ---
  async getAllInventory(): Promise<any[]> {
    const response = await api.get('/materials/inventory');
    return response.data;
  },

  async adjustInventory(data: { material_id: number; new_stock: number; reason: string }): Promise<any> {
    const response = await api.post('/materials/inventory', data);
    return response.data;
  },

  async getInventoryValuation(): Promise<{ total_value: number }> {
    const response = await api.get('/materials/inventory/valuation');
    return response.data;
  },

  async getProjectInventory(projectId: number): Promise<any[]> {
    const response = await api.get(`/materials/inventory/${projectId}`);
    return response.data;
  },

  async getSummary(): Promise<InventorySummary> {
    const response = await api.get('/materials/summary');
    return response.data;
  },

  // --- Logs & Reports ---
  async getLogs(params: { limit?: number; material_id?: number; project_id?: number; type?: string }): Promise<InventoryLog[]> {
    const response = await api.get('/materials/logs', { params });
    return response.data;
  },

  async getMaterialReport(projectId: number): Promise<MaterialReport[]> {
    const response = await api.get('/materials/reports', { params: { project_id: projectId } });
    return response.data;
  },

  async getPriceHistory(materialId: number): Promise<PriceHistory[]> {
    const response = await api.get(`/materials/materials/price-history/${materialId}`);
    return response.data;
  },

  // Export URLs (these return the direct URL for downloading)
  getExportPdfUrl(): string {
    return `${api.defaults.baseURL}/materials/reports/pdf`;
  },

  getExportExcelUrl(): string {
    return `${api.defaults.baseURL}/materials/reports/excel`;
  }
};
