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
      const response = await api.get("/owners", { params: { search } });
      const data = response.data;

      return (data || []).map((o: any) => ({
        id: String(o.id),
        name: o.owner_name,
        mobile: String(o.mobile || o.mobile_number || ""),
        email: o.email,
        address: o.address,
        pan: o.pan,
        owner_code: o.owner_code,
      }));
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
  async exportLedgerPdf(ownerId: string): Promise<void> {
    try {
      const response = await api.get(`/owners/${ownerId}/ledger/pdf`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Owner_Ledger_${ownerId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error(
        `Export Ledger PDF Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Export owner ledger Excel
   * GET /api/v1/owners/{owner_id}/ledger/excel
   */
  async exportLedgerExcel(ownerId: string): Promise<void> {
    try {
      const response = await api.get(`/owners/${ownerId}/ledger/excel`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Owner_Ledger_${ownerId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error: any) {
      console.error(
        `Export Ledger Excel Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};
