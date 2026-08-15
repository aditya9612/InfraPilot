import api from './api';

export interface EquipmentItem {
    id: number;
    project_id: number;
    equipment_name: string;
    equipment_code: string;
    operator_name: string;
    condition: string;
    rental_cost: number;
    maintenance_date: string;
    is_deleted: boolean;
    created_at: string;
    updated_at: string;
}

export interface EquipmentResponse {
    items: EquipmentItem[];
    meta: { total: number; limit: number; offset: number };
}

export interface UsageItem {
    id: number;
    equipment_id: number;
    working_hours: number;
    fuel_used: number;
    usage_date: string;
    notes: string;
    created_at: string;
}

export interface MaintenanceItem {
    id: number;
    equipment_id: number;
    description: string;
    maintenance_date: string;
    cost: number;
    next_maintenance_date: string;
    created_at: string;
    status: string;
}

export interface RentalItem {
    id: number;
    equipment_id: number;
    start_date: string;
    end_date: string;
    rental_cost: number;
    client_name: string;
    notes: string;
    status: string;
    duration: number;
    per_day_cost: number;
    created_at: string;
}

export interface AllocationStatus {
    equipment_id: number;
    project_id: number | null;
    allocated: boolean;
}

export interface MaintenanceAlert {
    equipment_id: number;
    equipment_code: string;
    maintenance_date: string;
    days_until: number;
    status: string;
}

export interface EquipmentAlert {
    equipment_id: number;
    equipment_code: string;
    equipment_name: string;
    project_id: number | null;
    issues: { type: string; severity: string; current_hours: number; limit: number }[];
    recommendation: string;
}

export interface UsageReport {
    equipment_id: number;
    equipment_code: string;
    total_hours: number;
    total_fuel: number;
    avg_hours: number;
    usage_count: number;
}

export interface CostReport {
    equipment_id: number;
    equipment_code: string;
    total_cost: number;
    rental_count: number;
    avg_cost: number;
    total_days: number;
    revenue_per_day: number;
}

export interface UtilizationReport {
    equipment_id: number;
    equipment_code: string;
    total_hours: number;
    utilization_rate: number;
}

export interface AvailabilityReport {
    equipment_id: number;
    equipment_code: string;
    equipment_name: string;
    is_available: boolean;
    project_id: number | null;
}

export interface AuditLog {
    id: number;
    equipment_id: number;
    action: string;
    old_values: Record<string, any> | null;
    new_values: Record<string, any> | null;
    user_id: number | null;
    ip_address: string | null;
    created_at: string;
}

export interface AuditLogResponse {
    items: AuditLog[];
    meta: { total: number; limit: number; offset: number };
}

export interface CreateEquipmentRequest {
    project_id?: number | null;
    equipment_name: string;
    equipment_code?: string;
    operator_name: string;
    condition: string;
    rental_cost: number;
    maintenance_date: string;
}

export interface EquipmentTransfer {
    id: number;
    equipment_id: number;
    source_project_id: number | null;
    target_project_id: number;
    transfer_date: string;
    transferred_by: number | null;
    reason: string;
    created_at: string;
}

export const equipmentService = {
    // ==========================================
    // 1. CRUD Equipment
    // ==========================================
    async listEquipment(params?: { limit?: number; project_id?: number, is_deleted?: boolean }): Promise<EquipmentResponse> {
        const response = await api.get<any>('/equipment', { params });
        const data = response.data;
        const items = Array.isArray(data) ? data : (data.items || data.data || []);
        const meta = data.meta || { total: items.length, limit: params?.limit || 50, offset: 0 };
        return { items, meta };
    },

    async getEquipment(id: number): Promise<EquipmentItem> {
        const response = await api.get<EquipmentItem>(`/equipment/${id}`);
        return response.data;
    },

    async createEquipment(data: CreateEquipmentRequest): Promise<EquipmentItem> {
        const response = await api.post<EquipmentItem>('/equipment', data);
        return response.data;
    },

    async updateEquipment(equipment_id: number, data: Partial<EquipmentItem>): Promise<EquipmentItem> {
        const response = await api.put<EquipmentItem>(`/equipment/${equipment_id}`, data);
        return response.data;
    },


    async deleteEquipment(equipment_id: number): Promise<any> {
        await api.delete(`/equipment/${equipment_id}`);
    },

    async restoreEquipment(equipment_id: number): Promise<any> {
        const response = await api.put(`/equipment/${equipment_id}/restore`);
        return response.data;
    },

    // ==========================================
    // 2. Allocation
    // ==========================================
    async allocateEquipment(id: number, project_id: number): Promise<AllocationStatus> {
        const response = await api.post<AllocationStatus>(`/equipment/allocate`, {
            equipment_ids: [id],
            project_id: project_id
        });
        return response.data;
    },

    async getAllocation(id: number): Promise<AllocationStatus> {
        const response = await api.get<AllocationStatus>(`/equipment/${id}/allocation`);
        return response.data;
    },

    async deallocateEquipment(id: number): Promise<AllocationStatus> {
        await api.put(`/equipment/deallocate`, { equipment_ids: [id], project_id: null });
        return { equipment_id: id, allocated: false, project_id: null };
    },

    // ==========================================
    // 3. Usage
    // ==========================================
    async createUsage(equipment_id: number, data: { working_hours: number, fuel_used: number, usage_date: string, notes?: string }): Promise<UsageItem> {
        const payload = {
            working_hours: data.working_hours,
            fuel_used: data.fuel_used,
            usage_date: data.usage_date,
            notes: data.notes
        };
        const response = await api.post<UsageItem>(`/equipment/${equipment_id}/usage`, payload);
        return response.data;
    },

    async updateUsage(usage_id: number, data: { equipment_id: number, working_hours: number, fuel_used: number, usage_date: string, notes?: string, boq_item_id?: number }): Promise<UsageItem> {
        const payload = {
            equipment_id: data.equipment_id,
            working_hours: data.working_hours,
            fuel_used: data.fuel_used,
            usage_date: data.usage_date,
            notes: data.notes,
            boq_item_id: data.boq_item_id || 0
        };
        const response = await api.put<UsageItem>(`/equipment/usage/${usage_id}`, payload);
        return response.data;
    },

    async deleteUsage(usage_id: number): Promise<void> {
        await api.delete(`/equipment/usage/${usage_id}`);
    },

    async getUsage(usage_id: number): Promise<UsageItem> {
        const response = await api.get<UsageItem>(`/equipment/usage/${usage_id}`);
        return response.data;
    },

    async listUsage(equipment_id?: number, params?: { project_id?: number }): Promise<UsageItem[]> {
        const queryParams: any = { ...params };
        if (equipment_id) queryParams.equipment_id = equipment_id;
        const response = await api.get<UsageItem[]>(`/equipment/usage`, { params: queryParams });
        return response.data;
    },

    async getUsageReport(params?: { project_id?: number }): Promise<UsageReport[]> {
        const response = await api.get<any>('/equipment/usage/report', { params });
        const data = response.data;
        return Array.isArray(data) ? data : (data.items || data.data || []);
    },

    // ==========================================
    // 4. Maintenance
    // ==========================================
    async createMaintenance(equipment_id: number, data: { description: string, maintenance_date: string, cost: number, next_maintenance_date?: string, project_id?: number, boq_item_id?: number }): Promise<MaintenanceItem> {
        const payload: any = {
            description: data.description,
            maintenance_date: data.maintenance_date,
            cost: data.cost,
            next_maintenance_date: data.next_maintenance_date || null
        };
        if (data.project_id) payload.project_id = data.project_id;
        if (data.boq_item_id) payload.boq_item_id = data.boq_item_id;

        const response = await api.post<MaintenanceItem>(`/equipment/${equipment_id}/maintenance`, payload);
        return response.data;
    },

    async updateMaintenance(maintenance_id: number, data: { description: string, maintenance_date: string, cost: number, next_maintenance_date?: string, project_id?: number, boq_item_id?: number }): Promise<MaintenanceItem> {
        const payload: any = {
            description: data.description,
            maintenance_date: data.maintenance_date,
            cost: data.cost,
            next_maintenance_date: data.next_maintenance_date || null
        };
        if (data.project_id) payload.project_id = data.project_id;
        if (data.boq_item_id) payload.boq_item_id = data.boq_item_id;
        const response = await api.put<MaintenanceItem>(`/equipment/maintenance/${maintenance_id}`, payload);
        return response.data;
    },

    async completeMaintenance(maintenance_id: number): Promise<any> {
        const response = await api.put<any>(`/equipment/maintenance/${maintenance_id}/complete`);
        return response.data;
    },

    async deleteMaintenance(maintenance_id: number): Promise<any> {
        const response = await api.delete<any>(`/equipment/maintenance/${maintenance_id}`);
        return response.data;
    },

    async getMaintenance(maintenance_id: number): Promise<MaintenanceItem> {
        const response = await api.get<MaintenanceItem>(`/equipment/maintenance/${maintenance_id}`);
        return response.data;
    },

    async listMaintenance(equipment_id?: number, params?: { project_id?: number }): Promise<MaintenanceItem[]> {
        const queryParams: any = { ...params };
        if (equipment_id) queryParams.equipment_id = equipment_id;
        const response = await api.get<MaintenanceItem[]>(`/equipment/maintenance`, { params: queryParams });
        return response.data;
    },

    async getAllMaintenance(params?: { project_id?: number }): Promise<MaintenanceItem[]> {
        try {
            try {
                const directRes = await api.get<MaintenanceItem[]>('/equipment/maintenance', { params });
                if (Array.isArray(directRes.data) && directRes.data.length > 0) {
                    return directRes.data.sort((a, b) => new Date(b.created_at || b.maintenance_date).getTime() - new Date(a.created_at || a.maintenance_date).getTime());
                }
            } catch (e) {
                // ignore and fallback
            }

            const eqRes = await api.get<any>('/equipment', { params: { project_id: params?.project_id, limit: 100 } });
            const data = eqRes.data;
            const eqList = Array.isArray(data) ? data : (data.items || data.data || []);

            const maintPromises = eqList.map((eq: any) => this.listMaintenance(eq.id));
            const results = await Promise.allSettled(maintPromises);

            const allMaint = results
                .filter((r): r is PromiseFulfilledResult<MaintenanceItem[]> => r.status === 'fulfilled')
                .map(r => r.value)
                .flat();

            return allMaint.sort((a, b) => new Date(b.created_at || b.maintenance_date).getTime() - new Date(a.created_at || a.maintenance_date).getTime());
        } catch (error) {
            console.error("Failed to fetch all maintenance:", error);
            return [];
        }
    },

    // ==========================================
    // 5. Rental
    // ==========================================
    async createRental(equipment_id: number, data: { start_date: string, end_date: string, rental_cost: number, client_name: string, notes?: string, project_id?: number, boq_item_id?: number }): Promise<RentalItem> {
        const payload = {
            start_date: data.start_date,
            end_date: data.end_date,
            rental_cost: data.rental_cost,
            client_name: data.client_name,
            notes: data.notes,
            project_id: data.project_id || null,
            boq_item_id: data.boq_item_id || null
        };
        const response = await api.post<RentalItem>(`/equipment/${equipment_id}/rental`, payload);
        return response.data;
    },

    async listRental(equipment_id?: number, params?: { project_id?: number }): Promise<RentalItem[]> {
        const queryParams: any = { ...params };
        if (equipment_id) queryParams.equipment_id = equipment_id;
        const response = await api.get<RentalItem[]>(`/equipment/rental`, { params: queryParams });
        return response.data;
    },

    async getAllRentals(params?: { project_id?: number }): Promise<RentalItem[]> {
        try {
            try {
                const directRes = await api.get<RentalItem[]>('/equipment/rental', { params });
                if (Array.isArray(directRes.data)) {
                    return directRes.data.sort((a, b) => new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime());
                }
            } catch (e) {
                // ignore and fallback
            }

            const eqRes = await api.get<any>('/equipment', { params: { project_id: params?.project_id, limit: 100 } });
            const data = eqRes.data;
            const eqList = Array.isArray(data) ? data : (data.items || data.data || []);

            const rentalPromises = eqList.map((eq: any) => this.listRental(eq.id));
            const results = await Promise.allSettled(rentalPromises);

            const allRentals = results
                .filter((r): r is PromiseFulfilledResult<RentalItem[]> => r.status === 'fulfilled')
                .map(r => r.value)
                .flat();

            return allRentals.sort((a, b) => new Date(b.created_at || b.start_date).getTime() - new Date(a.created_at || a.start_date).getTime());
        } catch (error) {
            console.error("Failed to fetch all rentals:", error);
            return [];
        }
    },

    async getRental(rental_id: number): Promise<RentalItem> {
        const response = await api.get<RentalItem>(`/equipment/rental/${rental_id}`);
        return response.data;
    },

    async updateRental(rental_id: number, data: { start_date: string, end_date: string, rental_cost: number, client_name: string, notes?: string, project_id?: number, boq_item_id?: number }): Promise<RentalItem> {
        const payload = {
            start_date: data.start_date,
            end_date: data.end_date,
            rental_cost: data.rental_cost,
            client_name: data.client_name,
            notes: data.notes,
            project_id: data.project_id || null,
            boq_item_id: data.boq_item_id || null
        };
        const response = await api.put<RentalItem>(`/equipment/rental/${rental_id}`, payload);
        return response.data;
    },

    async completeRental(rental_id: number): Promise<any> {
        const response = await api.put(`/equipment/rental/${rental_id}/complete`);
        return response.data;
    },

    async deleteRental(rental_id: number): Promise<void> {
        await api.delete(`/equipment/rental/${rental_id}`);
    },

    async generateQR(equipment_id: number): Promise<any> {
        const response = await api.get(`/equipment/${equipment_id}/qr`, { responseType: 'blob' });
        return new Blob([response.data as any]);
    },

    async getCostReport(params?: { project_id?: number }): Promise<CostReport[]> {
        const response = await api.get<any>('/equipment/cost/report', { params });
        const data = response.data;
        return Array.isArray(data) ? data : (data.items || data.data || []);
    },

    // ==========================================
    // 6. Purchases & Transfer
    // ==========================================
    async createPurchase(data: any): Promise<any> {
        const response = await api.post('/equipment/purchase', data);
        return response.data;
    },

    async listPurchase(params?: { purchase_type?: string, asset_id?: number, project_id?: number, boq_item_id?: number, vendor_name?: string, purchase_date_from?: string, purchase_date_to?: string, limit?: number; offset?: number }): Promise<any> {
        const response = await api.get('/equipment/purchase', { params });
        return response.data;
    },

    async getPurchase(purchase_id: number): Promise<any> {
        const response = await api.get(`/equipment/purchase/${purchase_id}`);
        return response.data;
    },

    async updatePurchase(purchase_id: number, data: any): Promise<any> {
        const response = await api.put(`/equipment/purchase/${purchase_id}`, data);
        return response.data;
    },

    async deletePurchase(purchase_id: number): Promise<void> {
        await api.delete(`/equipment/purchase/${purchase_id}`);
    },

    async getEquipmentPurchaseHistory(equipment_id: number): Promise<any> {
        const response = await api.get(`/equipment/purchase/history`, { params: { equipment_id } });
        return response.data;
    },

    async transferEquipment(data: { equipment_id: number, to_project_id: number, transfer_date: string, condition_notes?: string }): Promise<any> {
        const response = await api.post('/equipment/transfer', data);
        return response.data;
    },

    async getTransferHistory(equipment_id: number): Promise<any[]> {
        const response = await api.get<any>(`/equipment/${equipment_id}/transfer-history`);
        const data = response.data;
        return Array.isArray(data) ? data : (data.items || data.data || []);
    },

    async listTransferHistory(params?: { limit?: number; offset?: number, project_id?: number }): Promise<any[]> {
        const response = await api.get<any>('/equipment/transfer-history', { params });
        const data = response.data;
        if (Array.isArray(data)) return data;
        if (typeof data === 'object' && data !== null) {
            if (Array.isArray(data.items)) return data.items;
            if (Array.isArray(data.data)) return data.data;
            for (const key of Object.keys(data)) {
                if (Array.isArray(data[key])) return data[key];
            }
        }
        return [];
    },

    // ==========================================
    // 7. Reports & Alerts
    // ==========================================
    async getKpi(params?: { project_id?: number }): Promise<any> {
        const response = await api.get<any>('/equipment/kpi', { params });
        return response.data;
    },

    async getUtilizationReport(params?: { project_id?: number }): Promise<UtilizationReport[]> {
        const usageData = await this.getUsageReport(params);
        return usageData.map(u => ({
            equipment_id: u.equipment_id,
            equipment_code: u.equipment_code,
            total_hours: u.total_hours || 0,
            utilization_rate: Number((((u.total_hours || 0) / 208) * 100).toFixed(2))
        }));
    },

    async getPurchaseReport(params?: { project_id?: number }): Promise<any[]> {
        const response = await api.get<any[]>('/equipment/purchase/report', { params });
        return response.data;
    },

    async getAvailabilityReport(params?: { project_id?: number }): Promise<AvailabilityReport[]> {
        const response = await api.get<AvailabilityReport[]>('/equipment/eq/availability', { params });
        return response.data;
    },

    async getMaintenanceAlerts(params?: { project_id?: number }): Promise<MaintenanceAlert[]> {
        const response = await api.get<MaintenanceAlert[]>('/equipment/alerts/maintenance', { params });
        return response.data;
    },

    async getEquipmentAlerts(params?: { project_id?: number }): Promise<EquipmentAlert[]> {
        const response = await api.get<EquipmentAlert[]>('/equipment/alerts/equipment', { params });
        return response.data;
    },

    // ==========================================
    // 8. Audit Logs & Exports
    // ==========================================
    async getAuditLogs(equipment_id: number, params?: { limit?: number, offset?: number, action?: string }): Promise<AuditLogResponse> {
        const response = await api.get<AuditLogResponse>(`/equipment/${equipment_id}/logs`, { params });
        return response.data;
    },

    async exportPdf(project_id?: number): Promise<void> {
        const params = project_id ? { project_id } : {};
        const response = await api.get('/equipment/reports/pdf', { params, responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data as any]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'equipment_report.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    async exportExcel(project_id?: number): Promise<void> {
        const params = project_id ? { project_id } : {};
        const response = await api.get('/equipment/reports/excel', { params, responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data as any]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'equipment_report.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};

export default equipmentService;
export type { EquipmentItem as Equipment };
