import api from './api';

export type IssueType = "SYSTEM" | "SITE" | "DAMAGE" | "LOSS" | "VENDOR" | "TRANSFER" | "ADJUSTMENT" | "PURCHASE" | "MANUAL";
export type TransferStatus = "PENDING" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

export interface MaterialItem {
    id: number; material_code: string; project_id: number;
    material_name: string; category: string; unit: string;
    supplier_id: number; supplier_name: string;
    purchase_rate: number; rate_type: string;
    quantity_purchased: number; quantity_used: number;
    remaining_stock: number; total_amount: number;
    payment_given: number; payment_pending: number;
    extra_paid: number; minimum_stock_level: number;
    alert_type: string;
}

export interface SupplierItem {
    id: number; supplier_name: string; contact_person: string;
    phone_email: string; gst_number: string; address: string;
}

export interface PurchaseOrder {
    id: number; material_id: number; supplier_id: number; project_id: number;
    material_name: string; quantity: number; rate: number;
    total_amount: number; status: string;
}

export interface InventoryItem {
    material_id: number; material_name: string; remaining_stock: number;
    unit: string; avg_rate: number; total_value: number; project_id: number;
}

export interface TransferItem {
    id: number;
    material: { id: number; name: string };
    from_project: { id: number; name: string };
    to_project: { id: number; name: string };
    quantity: number; status: string; created_at?: string; remarks?: string;
}

export interface TransferListResponse {
    total: number; skip: number; limit: number; data: TransferItem[];
}

export interface MaterialLog {
    id: number; material_id: number; material_name?: string; type: string; quantity: number;
    rate: number; avg_rate: number; total_amount: number;
    amount_paid: number; payment_pending: number; issue_type: string;
    project_id: number; created_at: string;
}

export interface MaterialSummary {
    total_materials: number; total_stock_value: number; total_pending_payments: number;
}

export interface MaterialReport {
    material_id: number; material_name: string; total_purchased: number;
    total_used: number; remaining_stock: number; total_cost: number; payment_pending: number;
}

export interface PriceHistory { rate: number; date: string; }

export interface InventoryAdjustment {
    material_id: number; old_stock: number; new_stock: number;
    difference: number; reason: string; reference_id: string;
}

class MaterialService {
    // ─── MATERIALS CRUD ──────────────────────────────────────────────
    async listMaterials(projectId: number = 1, skip: number = 0, limit: number = 50): Promise<MaterialItem[]> {
        const response = await api.get('/materials', { params: { project_id: projectId, skip, limit } });
        return response.data;
    }

    async createMaterial(data: Partial<MaterialItem>): Promise<MaterialItem> {
        const response = await api.post('/materials', data);
        return response.data;
    }

    async getMaterial(id: number): Promise<MaterialItem> {
        const response = await api.get(`/materials/${id}`);
        return response.data;
    }

    async updateMaterial(id: number, data: Partial<MaterialItem>): Promise<MaterialItem> {
        const response = await api.put(`/materials/${id}`, data);
        return response.data;
    }

    async deleteMaterial(id: number): Promise<void> {
        await api.delete(`/materials/${id}`);
    }

    // ─── SUPPLIERS CRUD ──────────────────────────────────────────────
    async listSuppliers(limit: number = 100): Promise<SupplierItem[]> {
        const response = await api.get('/materials/suppliers', { params: { limit } });
        return response.data;
    }

    async createSupplier(data: Partial<SupplierItem>): Promise<SupplierItem> {
        const response = await api.post('/materials/suppliers', data);
        return response.data;
    }

    async getSupplier(id: number): Promise<SupplierItem> {
        const response = await api.get(`/materials/suppliers/${id}`);
        return response.data;
    }

    async updateSupplier(id: number, data: Partial<SupplierItem>): Promise<SupplierItem> {
        const response = await api.put(`/materials/suppliers/${id}`, data);
        return response.data;
    }

    async deleteSupplier(id: number): Promise<void> {
        await api.delete(`/materials/suppliers/${id}`);
    }

    async getSupplierMaterials(supplierId: number): Promise<MaterialItem[]> {
        const response = await api.get(`/materials/suppliers/${supplierId}/materials`);
        return response.data;
    }

    // ─── PURCHASE ORDERS ──────────────────────────────────────────────
    async listPurchaseOrders(skip: number = 0, limit: number = 50): Promise<PurchaseOrder[]> {
        const response = await api.get('/materials/purchase-orders', { params: { skip, limit } });
        return response.data;
    }

    async createPurchaseOrder(data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
        const response = await api.post('/materials/purchase-orders', data);
        return response.data;
    }

    async getPurchaseOrder(id: number): Promise<PurchaseOrder> {
        const response = await api.get(`/materials/purchase-orders/${id}`);
        return response.data;
    }

    async updatePurchaseOrder(id: number, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
        const response = await api.put(`/materials/purchase-orders/${id}`, data);
        return response.data;
    }

    async deletePurchaseOrder(id: number): Promise<void> {
        await api.delete(`/materials/purchase-orders/${id}`);
    }

    // ─── PURCHASE & USAGE ──────────────────────────────────────────────
    async recordPurchase(materialId: number, data: { quantity: number; rate: number; amount_paid: number; project_id: number; issue_type: string }): Promise<MaterialItem> {
        const response = await api.post(`/materials/${materialId}/purchase`, data);
        return response.data;
    }

    async recordUsage(materialId: number, data: { quantity: number; project_id: number; issue_type: string }): Promise<MaterialItem> {
        const response = await api.post(`/materials/${materialId}/usage`, data);
        return response.data;
    }

    // ─── INVENTORY ──────────────────────────────────────────────
    async getAllInventory(): Promise<InventoryItem[]> {
        const response = await api.get('/materials/inventory');
        return response.data;
    }

    async adjustInventory(data: { material_id: number; new_stock: number; reason: string }): Promise<InventoryAdjustment> {
        const response = await api.post('/materials/inventory', data);
        return response.data;
    }

    async getInventoryValuation(): Promise<{ total_value: number }> {
        const response = await api.get('/materials/inventory/valuation');
        return response.data;
    }

    async getProjectInventory(projectId: number): Promise<InventoryItem[]> {
        const response = await api.get(`/materials/inventory/${projectId}`);
        return response.data;
    }

    // ─── TRANSACTIONS & LOGS ──────────────────────────────────────────────
    async getMaterialTransactions(materialId: number): Promise<MaterialLog[]> {
        const response = await api.get(`/materials/${materialId}/transactions`);
        return response.data;
    }

    async getProjectTransactions(projectId: number): Promise<any[]> {
        const response = await api.get(`/materials/projects/${projectId}/transactions`);
        return response.data;
    }

    async getLogs(projectId: number = 1, type?: string, limit: number = 50): Promise<MaterialLog[]> {
        const params: any = { project_id: projectId, limit };
        if (type && type !== "All") params.type = type;
        const response = await api.get('/materials/logs', { params });
        return response.data;
    }

    // ─── TRANSFERS ──────────────────────────────────────────────
    async createTransfer(data: { material_id: number; from_project_id: number; to_project_id: number; quantity: number }): Promise<TransferItem> {
        const response = await api.post('/materials/transfers', data);
        return response.data;
    }

    async listTransfers(skip: number = 0, limit: number = 50): Promise<TransferListResponse> {
        const response = await api.get('/materials/transfers', { params: { skip, limit } });
        return response.data;
    }

    async getTransfer(id: number): Promise<TransferItem> {
        const response = await api.get(`/materials/transfers/${id}`);
        return response.data;
    }

    async updateTransferStatus(id: number, status: string): Promise<TransferItem> {
        const response = await api.put(`/materials/transfers/${id}`, { status });
        return response.data;
    }

    // ─── ALERTS & REPORTS ──────────────────────────────────────────────
    async getAlerts(threshold: number = 200): Promise<MaterialItem[]> {
        const response = await api.get('/materials/alerts', { params: { threshold } });
        return response.data;
    }

    async getSummary(): Promise<MaterialSummary> {
        const response = await api.get('/materials/summary');
        return response.data;
    }

    async getMaterialReport(projectId: number = 1): Promise<MaterialReport[]> {
        const response = await api.get('/materials/reports', { params: { project_id: projectId } });
        return response.data;
    }

    async getPriceHistory(materialId: number): Promise<PriceHistory[]> {
        const response = await api.get(`/materials/${materialId}/price-history`);
        return response.data;
    }

    async exportPDF(): Promise<Blob> {
        const response = await api.get('/materials/reports/materials/pdf', { responseType: 'blob' });
        return response.data;
    }

    async exportExcel(): Promise<Blob> {
        const response = await api.get('/materials/reports/materials/excel', { responseType: 'blob' });
        return response.data;
    }
}

export const materialService = new MaterialService();
