import api from './api';

export const materialService = {
  /**
   * Create a new supplier
   * POST /api/v1/materials/suppliers
   */
  async createSupplier(supplierData: any) {
    // Map to specific schema requested: { name, contact }
    const payload = {
      name: supplierData.name,
      contact: supplierData.phone || supplierData.contact || "",
    };
    try {
      const response = await api.post('/materials/suppliers', payload);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Create Supplier API Error details:", error.response.data);
      }
      throw error;
    }
  },

  /**
   * Get all suppliers
   * GET /api/v1/materials/suppliers
   */
  async getSuppliers() {
    try {
      const response = await api.get('/materials/suppliers');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        console.error("Get Suppliers API Error details:", error.response.data);
      }
      throw error;
    }
  }
};
