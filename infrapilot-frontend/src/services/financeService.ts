import api from "./api";
import type { Invoice, InvoiceCreateData } from "../types/invoice";

export const financeService = {
  /**
   * Get all invoices
   * GET /api/v1/invoices
   */
  async getInvoices(
    limit: number = 100,
    offset: number = 0,
  ): Promise<Invoice[]> {
    try {
      const response = await api.get("/invoices/", {
        params: { limit, offset },
      });
      return Array.isArray(response.data)
        ? response.data
        : response.data.items || response.data.data || [];
    } catch (error: any) {
      console.error(
        "Get Invoices API Error:",
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Fetch invoices by type
   * GET /api/v1/invoices/type/{type}
   */
  async getInvoicesByType(type: string): Promise<Invoice[]> {
    try {
      const response = await api.get(`/invoices/type/${type}/`);
      return response.data || [];
    } catch (error: any) {
      console.error(
        `Fetch Invoices By Type (${type}) Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Fetch invoices within a date range
   * GET /api/v1/invoices/date-range?start=...&end=...
   */
  async getInvoicesByDateRange(start: string, end: string): Promise<Invoice[]> {
    try {
      const response = await api.get("/invoices/date-range/", {
        params: { start, end },
      });
      return Array.isArray(response.data)
        ? response.data
        : response.data.items || response.data.data || [];
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      console.error(`Get Invoices By Date Range (${start} → ${end}) Error:`);
      if (Array.isArray(detail)) {
        detail.forEach((d: any) =>
          console.error(`  [${d.loc?.join(" → ")}] ${d.msg} (type: ${d.type})`)
        );
      } else {
        console.error(error.response?.data || error.message);
      }
      throw error;
    }
  },

  /**
   * Get a single invoice by ID
   * GET /api/v1/invoices/{id}
   */
  async getInvoiceById(id: number): Promise<Invoice> {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Get Invoice ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Create a new invoice
   * POST /api/v1/invoices/{type}
   */
  async createInvoice(data: InvoiceCreateData): Promise<Invoice> {
    try {
      // The API endpoint expects the type in the URL: /api/v1/invoices/{type}
      const response = await api.post(`/invoices/${data.type}/`, data);
      return response.data;
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string' ? detail :
        (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
          (error.response?.data?.message || error.message));

      console.error(
        `Create Invoice (${data.type}) Error:`,
        error.response?.data || error.message,
      );

      // Throw a new error with the extracted detail message
      const enhancedError = new Error(message);
      (enhancedError as any).response = error.response;
      throw enhancedError;
    }
  },

  /**
   * Update an invoice
   * PUT /api/v1/invoices/{id}
   */
  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice> {
    try {
      const response = await api.put(`/invoices/${id}`, data);
      return response.data;
    } catch (error: any) {
      console.error(
        `Update Invoice ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Mark an invoice as paid
   * POST /api/v1/invoices/{id}/mark-paid
   */
  async markInvoicePaid(id: number): Promise<Invoice> {
    try {
      const response = await api.post(`/invoices/${id}/mark-paid/`);
      return response.data;
    } catch (error: any) {
      console.error(
        `Mark Invoice ${id} As Paid Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get pending invoices
   * GET /api/v1/invoices/pending
   */
  async getPendingInvoices(): Promise<Invoice[]> {
    try {
      // Use query parameter to avoid route collision with /invoices/{id}
      const response = await api.get("/invoices/", {
        params: { status: "pending" }
      });
      return Array.isArray(response.data)
        ? response.data
        : response.data.items || response.data.data || [];
    } catch (error: any) {
      const detail = error.response?.data?.detail;
      console.error("Get Pending Invoices API Error:");
      if (Array.isArray(detail)) {
        detail.forEach((d: any) =>
          console.error(`  [${d.loc?.join(" → ")}] ${d.msg} (type: ${d.type})`)
        );
      } else {
        console.error(error.response?.data || error.message);
      }
      throw error;
    }
  },

  /**
   * Generate Invoice PDF
   * GET /api/v1/invoices/{id}/pdf
   */
  async getInvoicePdf(id: number): Promise<Blob> {
    try {
      const response = await api.get(`/invoices/${id}/pdf/`, {
        responseType: "blob",
      });
      return response.data;
    } catch (error: any) {
      console.error(`Get Invoice PDF ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create Labour Invoice
   * POST /api/v1/invoices/labour
   */
  async createLabourInvoice(data: {
    project_id: number;
    start_date: string;
    end_date: string;
  }): Promise<Invoice> {
    try {
      const response = await api.post("/invoices/labour/", data);
      return response.data;
    } catch (error: any) {
      console.error("Create Labour Invoice Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create Material Invoice
   * POST /api/v1/invoices/material
   */
  async createMaterialInvoice(data: InvoiceCreateData): Promise<Invoice> {
    try {
      const response = await api.post("/invoices/material/", data);
      return response.data;
    } catch (error: any) {
      console.error("Create Material Invoice Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create Invoice From Measurement
   * POST /api/v1/invoices/from-measurement/{measurement_id}
   */
  async createInvoiceFromMeasurement(measurementId: number): Promise<Invoice> {
    try {
      const response = await api.post(`/invoices/from-measurement/${measurementId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Create Invoice from Measurement ${measurementId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete an invoice
   * DELETE /api/v1/invoices/{id}
   */
  async deleteInvoice(id: number): Promise<void> {
    try {
      await api.delete(`/invoices/${id}`);
    } catch (error: any) {
      console.error(
        `Delete Invoice ${id} Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },
};
