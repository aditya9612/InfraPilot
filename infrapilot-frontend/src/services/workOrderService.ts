import api from './api';

export interface WorkOrder {
  id: number;
  project_id: number;
  contractor_id: number | null;
  work_order_number: string;
  work_description: string;
  total_quantity: number;
  completed_quantity: number;
  rate: number;
  total_amount: number;
  status: string;
  quotation_id: number | null;
  created_at?: string;
  updated_at?: string;
}

export const workOrderService = {
  async getWorkOrders(params?: { project_id?: number, contractor_id?: number }) {
    const response = await api.get('/work-orders', { params });
    const data = response.data;
    const items = Array.isArray(data) ? data : (data.items || data.data || []);

    // Deduplicate items based on ID to fix React map key errors
    const seen = new Set();
    return items.filter((item: any) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  },

  async getWorkOrder(id: number) {
    const response = await api.get(`/work-orders/${id}`);
    return response.data;
  },

  async createWorkOrder(data: {
    project_id: number;
    contractor_id: number | null;
    work_description: string;
    total_quantity: number;
    rate: number;
  }) {
    const response = await api.post('/work-orders', data);
    return response.data;
  },

  async updateWorkOrder(id: number, data: {
    contractor_id: number | null;
    work_description: string;
    total_quantity: number;
    completed_quantity: number;
    rate: number;
    status: string;
  }) {
    const response = await api.put(`/work-orders/${id}`, data);
    return response.data;
  },

  async deleteWorkOrder(id: number) {
    const response = await api.delete(`/work-orders/${id}`);
    return response.data;
  }
};
