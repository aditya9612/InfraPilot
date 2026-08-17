import api from "./api";
import type {
    Payment
} from "../types/payment";

export const paymentService = {
    /**
     * Pay salary to labour directly
     * POST /api/v1/payments/salary
     */
    async paySalary(payload: any): Promise<any> {
        console.log("POST /api/v1/labour/payroll/pay Request Body:", payload);
        const response = await api.post<any>("labour/payroll/pay", payload);
        console.log("POST /api/v1/labour/payroll/pay Raw Response Body:", response.data);
        return response.data;
    },

    /**
     * Generate payroll for a given month
     * POST /api/v1/labour/payroll/generate
     */
    async generatePayroll(payload: { month: number; year: number; project_id?: number }): Promise<any> {
        console.log("POST /api/v1/labour/payroll/generate Request Body:", payload);
        const response = await api.post<any>("labour/payroll/generate", payload);
        console.log("POST /api/v1/labour/payroll/generate Raw Response Body:", response.data);
        return response.data;
    },

    /**
     * Export Payroll Excel
     * GET /api/v1/labour/payroll/export
     */
    async exportPayroll(options: { month?: number; year?: number; start_date?: string; end_date?: string; labour_id?: number; format?: string }): Promise<void> {
        console.log(`GET /api/v1/labour/payroll/export`, options);
        const response = await api.get("labour/payroll/export", {
            params: options,
            responseType: 'blob'
        });

        // Create a download link for the blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        const extension = options.format === 'pdf' ? 'pdf' : 'xlsx';
        const filename = `Payroll_Report_${options.month || 'all'}_${options.year || 'all'}.${extension}`;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Submit advance payment request
     * POST /api/v1/labour/advance
     */
    async requestAdvance(payload: any): Promise<any> {
        console.log("POST /api/v1/labour/advance Request Body:", payload);
        const response = await api.post<any>("labour/advance", payload);
        console.log("POST /api/v1/labour/advance Raw Response Body:", response.data);
        return response.data;
    },

    async getPaymentHistory(params?: any): Promise<Payment[]> {
        try {
            const now = new Date();
            // Standardize parameters to avoid 422 Validation Errors
            const cleanParams: any = {
                project_id: params?.project_id?.toString() || "1",
                month: params?.month?.toString() || (now.getMonth() + 1).toString().padStart(2, '0'),
                year: params?.year?.toString() || now.getFullYear().toString()
            };
            if (params?.limit) cleanParams.limit = Number(params.limit);
            if (params?.offset !== undefined) cleanParams.offset = Number(params.offset);

            console.log("GET /api/v1/labour/payroll/disbursement-history Request Params:", cleanParams);
            const response = await api.get<Payment[]>("labour/payroll/disbursement-history", { params: cleanParams });
            console.log("GET /api/v1/labour/payroll/disbursement-history Raw Response Body:", response.data);
            return response.data;
        } catch (err: any) {
            if (err.response?.status === 422) {
                console.error("422 Validation Error Details:", err.response.data);
            }
            console.log("paymentService: History fetch failed. Returning empty recordset.");
            return [];
        }
    },

    /**
     * Get pending dues report
     * GET /api/v1/payments/pending
     */
    async getPendingDues(params?: any): Promise<any[]> {
        try {
            const now = new Date();
            const cleanParams: any = {
                project_id: params?.project_id?.toString() || "1",
                month: params?.month?.toString() || (now.getMonth() + 1).toString().padStart(2, '0'),
                year: params?.year?.toString() || now.getFullYear().toString()
            };
            console.log("GET /api/v1/labour/payroll/contractor-liability Request Params:", cleanParams);
            const response = await api.get("labour/payroll/contractor-liability", { params: cleanParams });
            console.log("GET /api/v1/labour/payroll/contractor-liability Raw Response Body:", response.data);
            return response.data;
        } catch (err) {
            console.log("paymentService: Pending Dues fetch failed. Returning empty recordset.");
            return [];
        }
    },

    /**
     * Get Aggregate Payroll Report
     * GET /api/v1/labour/payroll/aggregate-report
     */
    async getAggregateReport(params?: any): Promise<any[]> {
        const now = new Date();
        const cleanParams: any = {
            project_id: params?.project_id?.toString() || "1",
            month: params?.month?.toString() || (now.getMonth() + 1).toString().padStart(2, '0'),
            year: params?.year?.toString() || now.getFullYear().toString()
        };
        console.log("GET /api/v1/labour/payroll/aggregate-report Request Params:", cleanParams);
        try {
            const response = await api.get("labour/payroll/aggregate-report", { params: cleanParams });
            console.log("GET /api/v1/labour/payroll/aggregate-report Raw Response Body:", response.data);
            return Array.isArray(response.data) ? response.data : (response.data?.items || []);
        } catch (err) {
            console.error("Failed to fetch aggregate report:", err);
            return [];
        }
    },

    /**
     * Get Fiscal Summary
     * GET /api/v1/labour/payroll/fiscal-summary
     */
    async getFiscalSummary(params?: any): Promise<any> {
        const now = new Date();
        const cleanParams: any = {
            project_id: params?.project_id?.toString() || "1",
            month: params?.month?.toString() || (now.getMonth() + 1).toString().padStart(2, '0'),
            year: params?.year?.toString() || now.getFullYear().toString()
        };
        console.log("GET /api/v1/labour/payroll/fiscal-summary Request Params:", cleanParams);
        try {
            const response = await api.get("labour/payroll/fiscal-summary", { params: cleanParams });
            console.log("GET /api/v1/labour/payroll/fiscal-summary Raw Response Body:", response.data);
            return response.data;
        } catch (err) {
            console.error("Failed to fetch fiscal summary:", err);
            return {
                total_payout: 0,
                high_payouts: 0,
                ot_intensive: 0,
                advance_adjusted: 0
            };
        }
    },

    /**
     * Get Payroll Momentum
     * GET /api/v1/labour/payroll/momentum
     */
    async getPayrollMomentum(params?: any): Promise<any[]> {
        const cleanParams: any = {
            project_id: params?.project_id?.toString() || "1"
        };
        console.log("GET /api/v1/labour/payroll/momentum Request Params:", cleanParams);
        try {
            const response = await api.get("labour/payroll/momentum", { params: cleanParams });
            console.log("GET /api/v1/labour/payroll/momentum Raw Response Body:", response.data);
            return Array.isArray(response.data) ? response.data : (response.data?.items || []);
        } catch (err) {
            console.error("Failed to fetch payroll momentum:", err);
            return [];
        }
    },

    /**
     * Get Weekly Velocity
     * GET /api/v1/labour/payroll/weekly-velocity
     */
    async getWeeklyVelocity(params?: any): Promise<any[]> {
        const now = new Date();
        const cleanParams: any = {
            project_id: params?.project_id?.toString() || "1",
            month: params?.month?.toString() || (now.getMonth() + 1).toString().padStart(2, '0'),
            year: params?.year?.toString() || now.getFullYear().toString()
        };
        console.log("GET /api/v1/labour/payroll/weekly-velocity Request Params:", cleanParams);
        const response = await api.get("labour/payroll/weekly-velocity", { params: cleanParams });
        console.log("GET /api/v1/labour/payroll/weekly-velocity Raw Response Body:", response.data);
        return response.data;
    },

    /**
     * Get Active Payroll List
     * GET /api/v1/labour/payroll
     */
    async getActivePayroll(params?: any): Promise<any[]> {
        const now = new Date();
        const cleanParams: any = {
            project_id: params?.project_id?.toString() || "1",
            month: params?.month?.toString() || (now.getMonth() + 1).toString().padStart(2, '0'),
            year: params?.year?.toString() || now.getFullYear().toString()
        };
        console.log("GET /api/v1/labour/payroll Request Params:", cleanParams);
        const response = await api.get("labour/payroll", { params: cleanParams });
        console.log("GET /api/v1/labour/payroll Raw Response Body:", response.data);
        const responseData = response.data;
        if (Array.isArray(responseData)) return responseData;
        if (Array.isArray(responseData?.data)) return responseData.data;
        if (Array.isArray(responseData?.items)) return responseData.items;
        if (Array.isArray(responseData?.payroll)) return responseData.payroll;
        if (Array.isArray(responseData?.results)) return responseData.results;
        if (responseData && typeof responseData === 'object') {
            const arrayProp = Object.values(responseData).find((value: any) => Array.isArray(value));
            if (Array.isArray(arrayProp)) return arrayProp;
        }
        return [];
    },

    /**
     * Get Payroll Stats
     * GET /api/v1/labour/payroll/stats
     */
    async getPayrollStats(params?: any): Promise<any> {
        const now = new Date();
        const cleanParams: any = {
            project_id: params?.project_id?.toString() || "1",
            month: params?.month?.toString() || (now.getMonth() + 1).toString().padStart(2, '0'),
            year: params?.year?.toString() || now.getFullYear().toString()
        };
        console.log("GET /api/v1/labour/payroll/stats Request Params:", cleanParams);
        const response = await api.get("labour/payroll/stats", { params: cleanParams });
        console.log("GET /api/v1/labour/payroll/stats Raw Response Body:", response.data);
        return response.data;
    },



    /**
     * Export Payroll to PDF
     * GET /api/v1/labour/report/payroll/export/pdf
     */
    async exportPayrollPDF(filters?: any): Promise<Blob> {
        console.log("GET /api/v1/labour/report/payroll/export/pdf Request Params:", filters);
        const response = await api.get("/labour/report/payroll/export/pdf", {
            params: filters,
            responseType: 'blob'
        });
        return response.data;
    },

    /**
     * Get Invoice Payment Summary
     * GET /api/v1/client-payments/invoice-summary
     */
    async getInvoiceSummary(projectId?: number | string, params?: any): Promise<any> {
        try {
            const pId = projectId || params?.project_id || 4;
            const response = await api.get("client-payments/invoice-summary", {
                params: { project_id: pId, ...params }
            });
            return response.data;
        } catch (err) {
            console.error("Failed to fetch invoice summary:", err);
            return null;
        }
    },

    /**
     * Get Pending Invoices
     * GET /api/v1/client-payments/pending-invoices
     */
    async getPendingInvoices(projectId?: number | string, params?: any): Promise<any[]> {
        try {
            const pId = projectId || params?.project_id || 4;
            const response = await api.get("client-payments/pending-invoices", {
                params: { project_id: pId, ...params }
            });
            const data = response.data;
            return Array.isArray(data) ? data : data?.items || data?.data || data?.invoices || [];
        } catch (err) {
            console.error("Failed to fetch pending invoices:", err);
            return [];
        }
    },

    /**
     * Export Client Payments to Excel
     * GET /api/v1/client-payments/export/excel
     */
    async exportClientPaymentsExcel(params?: Record<string, any>): Promise<void> {
        const pId = params?.project_id || 4;
        const response = await api.get("client-payments/export/excel", {
            params: { project_id: pId, ...params },
            responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Client_Payments_${new Date().toISOString().split("T")[0]}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Export Client Payments to PDF
     * GET /api/v1/client-payments/export/pdf
     */
    async exportClientPaymentsPdf(params?: Record<string, any>): Promise<void> {
        const pId = params?.project_id || 4;
        const response = await api.get("client-payments/export/pdf", {
            params: { project_id: pId, ...params },
            responseType: "blob",
        });
        const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Client_Payments_${new Date().toISOString().split("T")[0]}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.parentNode?.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Create Client Payment
     * POST /api/v1/client-payments
     */
    async createClientPayment(payload: {
        invoice_id: string;
        amount: number;
        paid_amount?: number;
        project_id?: string | number;
        project_name?: string;
        payment_method?: string;
        bank_name?: string;
        status?: string;
    }): Promise<any> {
        const pId = payload.project_id || 4;
        const response = await api.post("client-payments", { ...payload, project_id: pId });
        return response.data;
    },

    /**
     * Get Client Payment History
     * GET /api/v1/client-payments/history
     */
    async getClientPaymentHistory(projectId?: number | string | any, params?: any): Promise<any[]> {
        try {
            let pId: any;
            let queryParams = {};
            if (typeof projectId === "object" && projectId !== null) {
                queryParams = projectId;
                pId = projectId.project_id || 4;
            } else {
                pId = projectId || params?.project_id || 4;
                queryParams = { project_id: pId, ...params };
            }
            const response = await api.get("client-payments/history", { params: queryParams });
            const data = response.data;
            return Array.isArray(data) ? data : data?.items || data?.data || data?.history || [];
        } catch (err) {
            console.error("Failed to fetch client payment history:", err);
            return [];
        }
    },

    /**
     * List Client Payments
     * GET /api/v1/client-payments
     */
    async listClientPayments(params?: any): Promise<any[]> {
        try {
            const pId = params?.project_id || 4;
            const response = await api.get("client-payments", { params: { project_id: pId, ...params } });
            const data = response.data;
            return Array.isArray(data) ? data : data?.items || data?.data || data?.payments || [];
        } catch (err) {
            console.error("Failed to fetch client payments list:", err);
            return [];
        }
    },

    /**
     * Get Payment Analytics
     * GET /api/v1/client-payments/analytics
     */
    async getClientPaymentAnalytics(params?: any): Promise<any> {
        try {
            const pId = params?.project_id || 4;
            const response = await api.get("client-payments/analytics", { params: { project_id: pId, ...params } });
            return response.data;
        } catch (err) {
            console.error("Failed to fetch client payment analytics:", err);
            return null;
        }
    },

    /**
     * Update Client Payment
     * PUT /api/v1/client-payments/{payment_id}
     */
    async updateClientPayment(paymentId: string | number, payload: any): Promise<any> {
        const response = await api.put(`client-payments/${paymentId}`, payload);
        return response.data;
    },

    /**
     * Delete Client Payment
     * DELETE /api/v1/client-payments/{payment_id}
     */
    async deleteClientPayment(paymentId: string | number): Promise<any> {
        const response = await api.delete(`client-payments/${paymentId}`);
        return response.data;
    },

    /**
     * Download Payment Receipt
     * GET /api/v1/client-payments/{payment_id}/receipt
     */
    async downloadPaymentReceipt(paymentId: string | number): Promise<void> {
        const response = await api.get(`client-payments/${paymentId}/receipt`, {
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
    },
};

export default paymentService;
