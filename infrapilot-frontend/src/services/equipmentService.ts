// import api from "./api";
// export type EquipmentCondition = "good" | "fair" | "poor";
// export interface EquipmentItem {
//   id: number;
//   project_id: number;
//   equipment_name: string;
//   equipment_code: string;
//   operator_name: string;
//   working_hours: number;
//   fuel_used: number;
//   condition: EquipmentCondition;
//   rental_cost: number;
//   maintenance_date: string;
//   is_deleted: boolean;
//   created_at: string;
//   updated_at: string;
// }

// export interface CreateEquipmentRequest {
//   project_id: number;
//   equipment_name: string;
//   equipment_code: string;
//   operator_name: string;
//   working_hours: number;
//   fuel_used: number;
//   condition: EquipmentCondition;
//   rental_cost: number;
//   maintenance_date: string;
// }

// export interface UpdateEquipmentRequest {
//   project_id: number;
//   equipment_name: string;
//   equipment_code: string;
//   operator_name: string;
//   working_hours: number;
//   fuel_used: number;
//   condition: EquipmentCondition;
//   rental_cost: number;
//   maintenance_date: string;
// }

// export interface EquipmentResponse {
//   items: EquipmentItem[];
//   meta: {
//     total: number;
//     limit: number;
//     offset: number;
//   };
// }

// export const equipmentService = {
//   /**
//    * List Equipment
//    * GET /equipment
//    */
//   async listEquipment(project_id: number, limit: number = 20): Promise<EquipmentResponse> {
//     console.log("Fetching equipment list for project:", project_id);
//     const response = await api.get("/equipment", {
//       params: { project_id, limit }
//     });
//     console.log("Equipment list response:", response.data);
//     return response.data;
//   },

//   /**
//    * Get Single Equipment
//    * GET /equipment/{id}
//    */
//   async getEquipment(equipment_id: number): Promise<EquipmentItem> {
//     const response = await api.get(`/equipment/${equipment_id}`);
//     return response.data;
//   },

//   /**
//    * Create Equipment
//    * POST /equipment
//    */
//   async createEquipment(data: CreateEquipmentRequest): Promise<EquipmentItem> {
//     console.log("Creating equipment with data:", data);
//     const response = await api.post("/equipment", data);
//     return response.data;
//   },

//   /**
//    * Update Equipment
//    * PUT /equipment/{id}
//    */
//   async updateEquipment(equipment_id: number, data: UpdateEquipmentRequest): Promise<EquipmentItem> {
//     console.log(`Updating equipment ${equipment_id} with data:`, data);
//     const response = await api.put(`/equipment/${equipment_id}`, data);
//     return response.data;
//   },

//   /**
//    * Delete Equipment
//    * DELETE /equipment/{id}
//    */
//   async deleteEquipment(equipment_id: number): Promise<void> {
//     await api.delete(`/equipment/${equipment_id}`);
//   }
// };

import api from './api';

export interface Equipment {
  id: number;
  project_id: number;
  equipment_name: string;
  equipment_code: string;
  operator_name: string;
  working_hours: number;
  fuel_used: number;
  condition: string;
  rental_cost: number;
  maintenance_date: string;
  is_deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EquipmentCreateData {
  project_id: number;
  equipment_name: string;
  equipment_code: string;
  operator_name: string;
  working_hours: number;
  fuel_used: number;
  condition: string;
  rental_cost: number;
  maintenance_date: string;
}

export interface EquipmentUpdateData {
  project_id: number;
  equipment_name: string;
  equipment_code: string;
  operator_name: string;
  working_hours: number;
  fuel_used: number;
  condition: string;
  rental_cost: number;
  maintenance_date: string;
}

export const equipmentService = {
  /**
   * Get list of equipment
   * GET /api/v1/equipment
   */
  async getEquipment(projectId: number, limit: number = 20) {
    try {
      const response = await api.get(`/equipment`, {
        params: { project_id: projectId, limit }
      });
      const data = response.data;

      // Handle wrapper objects or direct arrays
      const items = Array.isArray(data) ? data : (data.items || data.data || []);

      return {
        ...data,
        items
      };
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Get Equipment API Error details:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Create new equipment
   * POST /api/v1/equipment
   */
  async createEquipment(data: EquipmentCreateData) {
    try {
      const response = await api.post('/equipment', data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Create Equipment API Error details:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Get single equipment by ID
   * GET /api/v1/equipment/{equipment_id}
   */
  async getEquipmentById(id: number) {
    try {
      const response = await api.get(`/equipment/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Get Equipment ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update an existing equipment
   * PUT /api/v1/equipment/{equipment_id}
   */
  async updateEquipment(id: number, data: EquipmentUpdateData) {
    try {
      const response = await api.put(`/equipment/${id}`, data);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error(`Update Equipment ${id} API Error details:`, error.response.data);
      }
      throw error;
    }
  },

  /**
   * Delete an equipment
   * DELETE /api/v1/equipment/{equipment_id}
   */
  async deleteEquipment(id: number) {
    try {
      const response = await api.delete(`/equipment/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error(`Delete Equipment ${id} API Error details:`, error.response.data);
      }
      throw error;
    }
  }
};

export default equipmentService;
