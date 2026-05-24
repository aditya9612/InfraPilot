import api from './api';
import type {
  EquipmentItem,
  EquipmentResponse,
  CreateEquipmentRequest,
  UpdateEquipmentRequest
} from '../types/equipment';

export const equipmentService = {
  /**
   * Get list of equipment
   * GET /api/v1/equipment
   */
  async getEquipment(projectId?: number | string, limit: number = 100, offset: number = 0) {
    const params: any = { limit, offset };
    if (projectId && Number(projectId) > 0) {
      params.project_id = Number(projectId);
    }
    const response = await api.get<EquipmentResponse>('/equipment', { params });
    // In case the backend just returns an array, wrap it in the expected format:
    if (Array.isArray(response.data)) {
      return {
        items: response.data,
        meta: { total: response.data.length, limit, offset }
      };
    }
    return response.data;
  },

  /**
   * Create new equipment
   * POST /api/v1/equipment
   */
  async createEquipment(data: CreateEquipmentRequest) {
    const response = await api.post<EquipmentItem>('/equipment', data);
    return response.data;
  },

  /**
   * Get single equipment by ID
   * GET /api/v1/equipment/{equipment_id}
   */
  async getEquipmentById(id: number) {
    const response = await api.get<EquipmentItem>(`/equipment/${id}`);
    return response.data;
  },

  /**
   * Update an existing equipment
   * PUT /api/v1/equipment/{equipment_id}
   */
  async updateEquipment(id: number, data: UpdateEquipmentRequest) {
    const response = await api.put<EquipmentItem>(`/equipment/${id}`, data);
    return response.data;
  },

  /**
   * Delete an equipment
   * DELETE /api/v1/equipment/{equipment_id}
   */
  async deleteEquipment(id: number) {
    const response = await api.delete(`/equipment/${id}`);
    return response.data;
  }
};

export default equipmentService;
export type { EquipmentItem as Equipment };
