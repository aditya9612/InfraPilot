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
    async generatePayroll(payload: { month: number; year: number }): Promise<any> {
        console.log("POST /api/v1/labour/payroll/generate Request Body:", payload);
        const response = await api.post<any>("labour/payroll/generate", payload);
        console.log("POST /api/v1/labour/payroll/generate Raw Response Body:", response.data);
        return response.data;
    },

    /**
     * Export Payroll Excel
     * GET /api/v1/labour/payroll/export
     */
    async exportPayroll(month: number, year: number): Promise<void> {
        console.log(`GET /api/v1/labour/payroll/export?month=${month}&year=${year}`);
        const response = await api.get("labour/payroll/export", {
            params: { month, year },
            responseType: 'blob'
        });

        // Create a download link for the blob
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Payroll_Report_${month}_${year}.xlsx`);
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
            month: params?.month ? params.month.toString().padStart(2, '0') : (now.getMonth() + 1).toString().padStart(2, '0'),
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
            month: params?.month ? params.month.toString().padStart(2, '0') : (now.getMonth() + 1).toString().padStart(2, '0'),
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
            month: params?.month ? params.month.toString().padStart(2, '0') : (now.getMonth() + 1).toString().padStart(2, '0'),
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
            month: params?.month ? params.month.toString().padStart(2, '0') : (now.getMonth() + 1).toString().padStart(2, '0'),
            year: params?.year?.toString() || now.getFullYear().toString()
        };
        console.log("GET /api/v1/labour/payroll Request Params:", cleanParams);
        const response = await api.get("labour/payroll", { params: cleanParams });
        console.log("GET /api/v1/labour/payroll Raw Response Body:", response.data);
        return response.data;
    },

    /**
     * Get Payroll Stats
     * GET /api/v1/labour/payroll/stats
     */
    async getPayrollStats(params?: any): Promise<any> {
        const now = new Date();
        const cleanParams: any = {
            project_id: params?.project_id?.toString() || "1",
            month: params?.month ? params.month.toString().padStart(2, '0') : (now.getMonth() + 1).toString().padStart(2, '0'),
            year: params?.year?.toString() || now.getFullYear().toString()
        };
        console.log("GET /api/v1/labour/payroll/stats Request Params:", cleanParams);
        const response = await api.get("labour/payroll/stats", { params: cleanParams });
        console.log("GET /api/v1/labour/payroll/stats Raw Response Body:", response.data);
        return response.data;
    },



    /**
     * Export Payroll to Excel
     * GET /api/v1/labour/payroll/export
     */
    async exportPayrollExcel(filters?: { month?: number; year?: number; project_id?: number | string }): Promise<Blob> {
        const cleanFilters: any = {};
        if (filters?.month !== undefined) cleanFilters.month = Number(filters.month);
        if (filters?.year !== undefined) cleanFilters.year = Number(filters.year);
        if (filters?.project_id !== undefined) cleanFilters.project_id = Number(filters.project_id);

        console.log("GET /api/v1/labour/payroll/export Request Params:", cleanFilters);
        try {
            const response = await api.get("labour/payroll/export", {
                params: cleanFilters,
                responseType: 'blob'
            });
            return response.data;
        } catch (err: any) {
            if (err.response?.data instanceof Blob) {
                const text = await err.response.data.text();
                try {
                    const parsed = JSON.parse(text);
                    throw new Error(parsed.message || parsed.detail || "Validation failed on the backend.");
                } catch (e) {
                    throw new Error(text || "Failed to export payroll Excel.");
                }
            }
            throw err;
        }
    },

    /**
     * Export Payroll to PDF
     * GET /api/v1/labour/report/payroll/export/pdf
     */
    async exportPayrollPDF(filters?: any): Promise<Blob> {
        const cleanFilters: any = {};
        if (filters?.month !== undefined) cleanFilters.month = Number(filters.month);
        if (filters?.year !== undefined) cleanFilters.year = Number(filters.year);
        if (filters?.project_id !== undefined) cleanFilters.project_id = Number(filters.project_id);

        console.log("GET /api/v1/labour/report/payroll/export/pdf Request Params:", cleanFilters);
        try {
            const response = await api.get("labour/report/payroll/export/pdf", {
                params: cleanFilters,
                responseType: 'blob'
            });
            return response.data;
        } catch (err: any) {
            if (err.response?.data instanceof Blob) {
                const text = await err.response.data.text();
                try {
                    const parsed = JSON.parse(text);
                    throw new Error(parsed.message || parsed.detail || "Validation failed on the PDF export.");
                } catch (e) {
                    throw new Error(text || "Failed to export payroll PDF.");
                }
            }
            throw err;
        }
    },
};

export default paymentService;
