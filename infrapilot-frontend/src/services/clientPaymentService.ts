import api from "./api";

// Matches the backend schemas based on typical payment configurations
export interface ClientPayment {
    id: number;
    payment_no: string;
    invoice_id?: number | null;
    project_id?: number | null;
    amount: string | number;
    payment_method?: string;
    method?: string;
    bank_name?: string | null;
    cheque_no?: string | null;
    reference_no?: string | null;
    remarks?: string | null;
    payment_status: string;
    transaction_id?: string | null;
    receipt_url?: string | null;
    payment_date: string;
    verified_by?: number | null;
    verified_at?: string | null;
    created_at?: string;
    updated_at?: string;
    user_name?: string;
    client_name?: string;
    project_name?: string;
    invoice_no?: string;
    invoice_status?: string;
    pending_amount?: string | number;
}

export interface ClientPaymentAnalytics {
    payment_methods?: Record<string, string>;
    monthly_collection?: any[];
    total_collection: string;
    successful_payments: number;
    rejected_payments: number;
    pending_verification: number;
    total_invoices: number;
    overdue_invoices: number;
    average_payment: string;
    highest_payment: string;
}

export interface InvoiceSummary {
    total_invoices: number;
    total_amount: number;
    amount_paid: number;
    amount_pending: number;
}

// Helper to prepare params
const parseParams = (params: any) => params || {};

export const clientPaymentService = {
    /**
     * Get Invoice Payment Summary
     * GET /api/v1/client-payments/invoice-summary
     */
    async getInvoiceSummary(params?: any): Promise<InvoiceSummary> {
        const p = parseParams(params);
        console.log("GET /api/v1/client-payments/invoice-summary", p);
        try {
            const response = await api.get("/client-payments/invoice-summary", { params: p });
            return response.data;
        } catch (e: any) {
            if (e.response?.status === 422) {
                return { total_invoices: 0, total_amount: 0, amount_paid: 0, amount_pending: 0 };
            }
            throw e;
        }
    },

    /**
     * Get Payment History
     * GET /api/v1/client-payments/history
     */
    async getPaymentHistory(params?: any): Promise<ClientPayment[]> {
        const p = parseParams(params);
        console.log("GET /api/v1/client-payments/history", p);
        try {
            const response = await api.get("/client-payments/history", { params: p });
            return Array.isArray(response.data) ? response.data : (response.data.items || response.data.history || []);
        } catch (e: any) {
            if (e.response?.status === 422) {
                console.error("422 Validation Error on history:", JSON.stringify(e.response.data));
            }
            throw e;
        }
    },

    /**
     * Get Pending Invoices
     * GET /api/v1/client-payments/pending-invoices
     */
    async getPendingInvoices(params?: any): Promise<any[]> {
        const p = parseParams(params);
        console.log("GET /api/v1/client-payments/pending-invoices", p);
        const response = await api.get("/client-payments/pending-invoices", { params: p });
        return Array.isArray(response.data) ? response.data : (response.data.invoices || response.data.items || []);
    },

    /**
     * Payment Analytics
     * GET /api/v1/client-payments/analytics
     */
    async getAnalytics(params?: any): Promise<ClientPaymentAnalytics> {
        const p = parseParams(params);
        console.log("GET /api/v1/client-payments/analytics", p);
        const response = await api.get("/client-payments/analytics", { params: p });
        return response.data;
    },

    /**
     * Export Client Payments to Excel
     * GET /api/v1/client-payments/export/excel
     */
    async exportExcel(params?: any): Promise<void> {
        const p = parseParams(params);
        console.log("GET /api/v1/client-payments/export/excel", p);
        const response = await api.get("/client-payments/export/excel", {
            params: p,
            responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Client_Payments_Export_${new Date().toISOString().split("T")[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Export Client Payments to PDF
     * GET /api/v1/client-payments/export/pdf
     */
    async exportPdf(params?: any): Promise<void> {
        const p = parseParams(params);
        console.log("GET /api/v1/client-payments/export/pdf", p);
        const response = await api.get("/client-payments/export/pdf", {
            params: p,
            responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Client_Payments_Export_${new Date().toISOString().split("T")[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    /**
     * List Client Payments
     * GET /api/v1/client-payments/history
     */
    async listPayments(params?: any): Promise<{ items: ClientPayment[]; total: number }> {
        const p = parseParams(params);
        console.log("GET /api/v1/client-payments/history", p);
        const response = await api.get("/client-payments/history", { params: p });

        let items = [];
        if (Array.isArray(response.data)) {
            items = response.data;
        } else {
            items = response.data.items || response.data.history || response.data.payments || [];
        }

        return { items, total: response.data.total || items.length };
    },

    /**
     * Get Client Payment
     * GET /api/v1/client-payments/{payment_id}
     */
    async getPayment(paymentId: number): Promise<ClientPayment> {
        console.log(`GET /api/v1/client-payments/${paymentId}`);
        const response = await api.get(`/client-payments/${paymentId}`);
        return response.data;
    },

    /**
     * Verify Client Payment
     * POST /api/v1/client-payments/{payment_id}/verify
     */
    async verifyPayment(paymentId: number, action: "approve" | "reject" = "approve"): Promise<ClientPayment> {
        console.log(`POST /api/v1/client-payments/${paymentId}/verify`);
        const response = await api.post(`/client-payments/${paymentId}/verify`, { action });
        return response.data;
    },

    /**
     * Download Payment Receipt
     * GET /api/v1/client-payments/{payment_id}/receipt
     */
    async downloadReceipt(paymentId: number): Promise<void> {
        console.log(`GET /api/v1/client-payments/${paymentId}/receipt`);
        const response = await api.get(`/client-payments/${paymentId}/receipt`, {
            responseType: "blob",
        });

        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Receipt_${paymentId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
};
