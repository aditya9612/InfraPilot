import type {
  EquipmentItem,
  EquipmentResponse,
  CreateEquipmentRequest,
  UpdateEquipmentRequest
} from '../types/equipment';

// Stateful in-memory list seeded with default items
let localEquipmentList: EquipmentItem[] = [
  {
    id: 1,
    project_id: 92,
    equipment_name: "JCB Backhoe Loader",
    equipment_code: "MC-001",
    operator_name: "Rahul Sharma",
    working_hours: 140,
    fuel_used: 350,
    condition: "GOOD",
    rental_cost: 45000,
    maintenance_date: "2026-05-15",
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    project_id: 93,
    equipment_name: "Tower Crane 20T",
    equipment_code: "TC-004",
    operator_name: "Amit Singh",
    working_hours: 220,
    fuel_used: 0,
    condition: "GOOD",
    rental_cost: 120000,
    maintenance_date: "2026-05-10",
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    project_id: 94,
    equipment_name: "Concrete Mixer Truck",
    equipment_code: "CM-007",
    operator_name: "Vikram Patil",
    working_hours: 95,
    fuel_used: 480,
    condition: "REPAIR",
    rental_cost: 35000,
    maintenance_date: "2026-05-18",
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const equipmentService = {
  /**
   * Get list of equipment
   * GET /api/v1/equipment
   */
  async getEquipment(projectId?: number | string, limit: number = 100, offset: number = 0) {
    const projId = (projectId !== undefined && projectId !== null) ? Number(projectId) : 0;
    const filtered = projId 
      ? localEquipmentList.filter(item => item.project_id === projId && !item.is_deleted)
      : localEquipmentList.filter(item => !item.is_deleted);
      
    return {
      items: filtered,
      meta: {
        total: filtered.length,
        limit,
        offset
      }
    } as EquipmentResponse;
  },

  /**
   * Create new equipment
   * POST /api/v1/equipment
   */
  async createEquipment(data: CreateEquipmentRequest) {
    const newEquipment: EquipmentItem = {
      id: localEquipmentList.length + 1,
      project_id: data.project_id || 92,
      equipment_name: data.equipment_name || 'Unnamed Equipment',
      equipment_code: data.equipment_code || 'EQ-000',
      operator_name: data.operator_name || 'N/A',
      working_hours: Number(data.working_hours || 0),
      fuel_used: Number(data.fuel_used || 0),
      condition: data.condition || 'GOOD',
      rental_cost: Number(data.rental_cost || 0),
      maintenance_date: data.maintenance_date || new Date().toISOString().split('T')[0],
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    localEquipmentList.push(newEquipment);
    return newEquipment;
  },

  /**
   * Get single equipment by ID
   * GET /api/v1/equipment/{equipment_id}
   */
  async getEquipmentById(id: number) {
    const item = localEquipmentList.find(i => i.id === id && !i.is_deleted);
    if (item) return item;
    throw new Error("Equipment not found");
  },

  /**
   * Update an existing equipment
   * PUT /api/v1/equipment/{equipment_id}
   */
  async updateEquipment(id: number, data: UpdateEquipmentRequest) {
    const idx = localEquipmentList.findIndex(i => i.id === id && !i.is_deleted);
    if (idx !== -1) {
      localEquipmentList[idx] = {
        ...localEquipmentList[idx],
        ...data,
        updated_at: new Date().toISOString()
      };
      return localEquipmentList[idx];
    }
    throw new Error("Equipment not found");
  },

  /**
   * Delete an equipment
   * DELETE /api/v1/equipment/{equipment_id}
   */
  async deleteEquipment(id: number) {
    const idx = localEquipmentList.findIndex(i => i.id === id && !i.is_deleted);
    if (idx !== -1) {
      localEquipmentList[idx].is_deleted = true;
      return { message: "Equipment deleted (Local)" };
    }
    throw new Error("Equipment not found");
  }
};

export default equipmentService;
export type { EquipmentItem as Equipment };
