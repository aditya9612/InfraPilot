import api from "./api";
import type { Owner } from "../types/owner";

export const ownerService = {
  /**
   * Create a new owner
   * POST /api/v1/owners
   */
  async createOwner(ownerData: any): Promise<any> {
    try {
      const body = {
        owner_name: ownerData.name,
        mobile: ownerData.mobile,
        email: ownerData.email,
        address: ownerData.address,
        pan: ownerData.pan,
      };

      const response = await api.post("/owners", body);
      return response.data;
    } catch (error: any) {
      console.error(
        "Create Owner API Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Fetch all owners
   * GET /api/v1/owners
   */
  async getOwners(search = ""): Promise<Owner[]> {
    try {
      const response = await api.get("/owners", { params: { search: search || undefined, limit: 1000 } });
      const data = response.data;
      const items = Array.isArray(data) ? data : (data.items || data.data || []);

      let mapped: Owner[] = items.map((o: any) => ({
        id: String(o.id),
        name: o.owner_name || o.name || "",
        mobile: String(o.mobile || o.mobile_number || ""),
        email: o.email || o.email_id || o.owner_email || "",
        address: o.address || "",
        pan: o.pan || "",
        owner_code: o.owner_code || "",
        created_at: o.created_at || o.createdAt,
      }));

      // If search query is provided (e.g. searching by email address like rajesh.sharma@test.com)
      // and backend search returned 0 items because backend only filters on name/code,
      // fallback to fetching all and filtering across name, email, code, mobile, and PAN.
      if (search && mapped.length === 0) {
        try {
          const allRes = await api.get("/owners", { params: { limit: 1000 } });
          const allData = allRes.data;
          const allItems = Array.isArray(allData) ? allData : (allData.items || allData.data || []);
          const allMapped: Owner[] = allItems.map((o: any) => ({
            id: String(o.id),
            name: o.owner_name || o.name || "",
            mobile: String(o.mobile || o.mobile_number || ""),
            email: o.email || o.email_id || o.owner_email || "",
            address: o.address || "",
            pan: o.pan || "",
            owner_code: o.owner_code || "",
            created_at: o.created_at || o.createdAt,
          }));
          const term = search.toLowerCase().trim();
          mapped = allMapped.filter((o) =>
            (o.name || "").toLowerCase().includes(term) ||
            (o.email || "").toLowerCase().includes(term) ||
            (o.owner_code || "").toLowerCase().includes(term) ||
            (o.mobile || "").toLowerCase().includes(term) ||
            (o.pan || "").toLowerCase().includes(term)
          );
        } catch {
          // If fallback fails, return original mapped
        }
      }

      return mapped;
    } catch (error: any) {
      console.error(
        "Fetch Owners API Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Fetch a single owner by ID
   * GET /api/v1/owners/{id}
   */
  async getOwnerById(id: string): Promise<Owner> {
    try {
      const response = await api.get(`/owners/${id}`);
      const o = response.data;
      return {
        id: String(o.id),
        name: o.owner_name,
        mobile: String(o.mobile || ""),
        email: o.email,
        address: o.address,
        pan: o.pan,
        owner_code: o.owner_code,
        created_at: o.created_at || o.createdAt,
      };
    } catch (error: any) {
      console.error(
        `Fetch Owner ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Update owner by ID
   * PUT /api/v1/owners/{id}
   */
  async updateOwner(id: string, ownerData: any): Promise<any> {
    try {
      const body = {
        owner_name: ownerData.name,
        mobile: ownerData.mobile,
        email: ownerData.email,
        address: ownerData.address,
        pan: ownerData.pan,
      };
      const response = await api.put(`/owners/${id}`, body);
      return response.data;
    } catch (error: any) {
      console.error(
        `Update Owner ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Delete owner by ID
   * DELETE /api/v1/owners/{id}
   */
  async deleteOwner(id: string): Promise<any> {
    try {
      const response = await api.delete(`/owners/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Delete Owner ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Fetch owner payments
   * GET /api/v1/owners/{owner_id}/payments
   */
  async getOwnerPayments(ownerId: string): Promise<any[]> {
    try {
      const response = await api.get(`/owners/${ownerId}/payments`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Fetch Owner Payments Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Fetch owner ledger
   * GET /api/v1/owners/{owner_id}/ledger
   */
  async getOwnerLedger(ownerId: string): Promise<any> {
    try {
      const response = await api.get(`/owners/${ownerId}/ledger`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Fetch Owner Ledger Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Export owner ledger PDF
   * GET /api/v1/owners/{owner_id}/ledger/pdf
   */
  async exportLedgerPdf(ownerId: string): Promise<Blob> {
    try {
      const response = await api.get(`/owners/${ownerId}/ledger/pdf`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      console.error(
        `Export Ledger PDF Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Fetch owner ledger Excel
   * GET /api/v1/owners/{owner_id}/ledger/excel
   */
  async exportLedgerExcel(ownerId: string): Promise<Blob> {
    try {
      const response = await api.get(`/owners/${ownerId}/ledger/excel`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      console.error(
        `Export Ledger Excel Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get all payments for tracker
   * GET /api/v1/owners/payment-tracker
   */
  async getPaymentTracker(params: {
    owner_id?: string;
    project_id?: string;
    status?: string;
  }): Promise<any[]> {
    try {
      // Strip out empty string values — backend expects integers/valid strings or nothing
      const cleanParams: Record<string, string> = {};
      if (params.owner_id) cleanParams.owner_id = params.owner_id;
      if (params.project_id) cleanParams.project_id = params.project_id;
      if (params.status) cleanParams.status = params.status;

      const response = await api.get("/owners/payment-tracker", { params: cleanParams });
      return response.data;
    } catch (error: any) {
      console.error(
        "Fetch Payment Tracker API Error:",
        error.response?.data || error.message
      );
      throw error;
    }
  },
};
