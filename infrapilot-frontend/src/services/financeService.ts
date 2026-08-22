import api from "./api";
import type { Invoice, InvoiceCreateData, InvoiceSummary } from "../types/invoice";

export const financeService = {
  /**
   * Get all invoices
   * GET /api/v1/invoices
   */
  async getInvoices(
    limit: number = 100,
    offset: number = 0,
    owner_id?: number,
  ): Promise<Invoice[]> {
    try {
      const response = await api.get("/invoices", {
        params: { limit, offset, owner_id },
      });
      return Array.isArray(response.data)
        ? response.data
        : response.data.items || response.data.data || [];
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Fetch invoices by type
   * GET /api/v1/invoices/type/{type}
   */
  async getInvoicesByType(type: string, limit: number = 20, offset: number = 0): Promise<Invoice[]> {
    try {
      const response = await api.get(`/invoices/type/${type}`, {
        params: { limit, offset }
      });
      const data = response.data;
      return Array.isArray(data) ? data : (data.items || data.data || []);
    } catch (error: any) {
      console.error(
        `Fetch Invoices By Type (${type}) Error:`,
        error.response?.data || error.message,
      );
      throw error;
    }
  },

  /**
   * Get receivable summary
   * GET /api/v1/invoices/receivables/summary
   */
  async getReceivablesSummary(): Promise<any> {
    try {
      const response = await api.get('/invoices/receivables/summary');
      return response.data;
    } catch (error: any) {
      console.error("Get Receivables Summary Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/invoices/receivables/aging
   */
  async getReceivablesAging(): Promise<any> {
    try {
      const response = await api.get('/invoices/receivables/aging');
      return response.data;
    } catch (error: any) {
      console.warn("Get Receivables Aging API Error:", error.message);
      return [];
    }
  },

  /**
   * Get receivable collections
   * GET /api/v1/invoices/receivables/collections
   */
  async getReceivablesCollections(limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const response = await api.get('/invoices/receivables/collections', {
        params: { limit, offset }
      });
      const data = response.data;
      return Array.isArray(data) ? data : (data.items || data.data || []);
    } catch (error: any) {
      console.error("Get Receivables Collections Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get client ledger
   * GET /api/v1/invoices/receivables/client-ledger/{client_id}
   */
  async getClientLedger(clientId: number | string): Promise<any> {
    try {
      const response = await api.get(`/invoices/receivables/client-ledger/${clientId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Get Client Ledger Error (Client ${clientId}):`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create Manual Receivable
   * POST /api/v1/invoices/receivables/manual
   */
  async createManualReceivable(data: any): Promise<any> {
    try {
      const response = await api.post('/invoices/receivables/manual', data);
      return response.data;
    } catch (error: any) {
      console.error("Create Manual Receivable Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Import Receivables
   * POST /api/v1/invoices/receivables/import
   */
  async importReceivables(fileData: FormData): Promise<any> {
    try {
      const response = await api.post('/invoices/receivables/import', fileData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error: any) {
      console.error("Import Receivables Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Export Receivables
   * GET /api/v1/invoices/receivables/export
   */
  async exportReceivables(): Promise<Blob> {
    const response = await api.get('/invoices/receivables/export', { responseType: 'blob' });
    return response.data;
  },

  /**
   * Export Receivables Collections
   * GET /api/v1/invoices/receivables/collections/export
   */
  async exportReceivablesCollections(): Promise<Blob> {
    const response = await api.get('/invoices/receivables/collections/export', { responseType: 'blob' });
    return response.data;
  },

  /**
   * Export Client Ledger
   * GET /api/v1/invoices/receivables/client-ledger/{client_id}/export
   */
  async exportClientLedger(clientId: number | string): Promise<Blob> {
    const response = await api.get(`/invoices/receivables/client-ledger/${clientId}/export`, { responseType: 'blob' });
    return response.data;
  },
  /**
   * Get payment summary for a project
   * GET /api/v1/invoices/project/{project_id}/summary
   */
  async getProjectPaymentSummary(projectId: number): Promise<{ paid: number; pending: number }> {
    try {
      const response = await api.get(`/invoices/project/${projectId}/summary`);
      return response.data;
    } catch (error: any) {
      console.error(`Fetch Project Payment Summary (${projectId}) Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Fetch invoices within a date range
   * GET /api/v1/invoices/date-range?start=...&end=...
   */
  async getInvoicesByDateRange(start: string, end: string): Promise<Invoice[]> {
    try {
      const response = await api.get("/invoices/date-range", {
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
      const response = await api.post(`/invoices/${data.type}`, data);
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
      const response = await api.post(`/invoices/${id}/mark-paid`);
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
   * POST /api/v1/invoices/{id}/pay
   */
  async payInvoice(id: number, data: any): Promise<any> {
    try {
      const response = await api.post(`/invoices/${id}/pay`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Pay Invoice ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * GET /api/v1/invoices/{id}/transactions
   */
  async getInvoiceTransactions(id: number): Promise<any> {
    try {
      const response = await api.get(`/invoices/${id}/transactions`);
      return response.data;
    } catch (error: any) {
      console.error(`Get Invoice Transactions ${id} Error:`, error.response?.data || error.message);
      return [];
    }
  },

  /**
   * Get pending invoices
   * GET /api/v1/invoices/pending
   */
  async getPendingInvoices(): Promise<Invoice[]> {
    try {
      const response = await api.get("/invoices", {
        params: { limit: 100 }
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.items || response.data.data || [];

      return data.filter((inv: Invoice) => inv.status === "pending");
    } catch (error: any) {
      throw error;
    }
  },

  /**
   * Generate Invoice PDF
   * GET /api/v1/invoices/{id}/pdf
   */
  async getInvoicePdf(id: number): Promise<Blob> {
    try {
      const response = await api.get(`/invoices/${id}/pdf`, {
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
      const response = await api.post("/invoices/labour", data);
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
  async createMaterialInvoice(projectId: number): Promise<Invoice> {
    try {
      const response = await api.post("/invoices/material", null, {
        params: { project_id: projectId }
      });
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

  /**
   * Send an invoice
   * POST /api/v1/invoices/{id}/send
   */
  async sendInvoice(id: number, data: any = {}): Promise<any> {
    try {
      const response = await api.post(`/invoices/${id}/send`, data);
      return response.data;
    } catch (error: any) {
      console.error(`Send Invoice ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get invoice summary for a project
   * GET /api/v1/invoices/project/{project_id}/summary
   */
  async getProjectInvoiceSummary(projectId: number): Promise<InvoiceSummary> {
    try {
      const response = await api.get(`/invoices/project/${projectId}/summary`);
      const data = response.data;
      return {
        project_id: projectId,
        total_billing: (Number(data.paid) || 0) + (Number(data.pending) || 0),
        pending_collections: Number(data.pending) || 0,
        total_gst: Number(data.gst || data.total_gst) || 0,
      };
    } catch (error: any) {
      console.error(`Get Invoice Summary for Project ${projectId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Create Invoice From Quotation
   * POST /api/v1/invoices/from-quotation/{quotation_id}
   */
  async convertQuotationToInvoice(quotationId: number): Promise<Invoice> {
    try {
      const response = await api.post(`/invoices/from-quotation/${quotationId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Convert Quotation ${quotationId} to Invoice Error:`, error.response?.data || error.message);
      throw error;
    }
  },
};
