import api from "./api";
import type { 
    AdvanceRequestPayload, 
    Payment, 
    AdvanceRequest, 
    PayrollReport 
} from "../types/payment";

export const paymentService = {
    /**
     * Pay salary to labour directly
     * POST /api/v1/payments/salary
     */
    async paySalary(payload: any): Promise<any> {
        console.log("POST /api/v1/labour/payroll/pay Request Body:", payload);
        const response = await api.post<any>("/labour/payroll/pay", payload);
        console.log("POST /api/v1/labour/payroll/pay Raw Response Body:", response.data);
        return response.data;
    },

    /**
     * Submit advance payment request
     * POST /api/v1/payments/advance
     */
    async requestAdvance(payload: AdvanceRequestPayload): Promise<AdvanceRequest> {
        console.log("POST /api/v1/labour/payments/advance Request Body:", payload);
        const response = await api.post<AdvanceRequest>("/labour/payments/advance", payload);
        console.log("POST /api/v1/labour/payments/advance Raw Response Body:", response.data);
        return response.data;
    },

    async getPaymentHistory(params?: any): Promise<Payment[]> {
        try {
            // Standardize parameters to avoid 422 Validation Errors
            const cleanParams: any = {
                project_id: params?.project_id?.toString() || "36"
            };
            if (params?.limit) cleanParams.limit = Number(params.limit);
            if (params?.offset !== undefined) cleanParams.offset = Number(params.offset);
            
            console.log("GET /api/v1/labour/payments Request Params:", cleanParams);
            const response = await api.get<Payment[]>("/labour/payments", { params: cleanParams });
            console.log("GET /api/v1/labour/payments Raw Response Body:", response.data);
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
            console.log("GET /api/v1/labour/pending Request Params:", params);
            const response = await api.get("/labour/pending", { params });
            console.log("GET /api/v1/labour/pending Raw Response Body:", response.data);
            return response.data;
        } catch (err) {
            console.log("paymentService: Pending Dues fetch failed. Returning empty recordset.");
            return [];
        }
    },

    /**
     * Get Daily Payroll Report
     * GET /api/v1/labour/report/daily
     */
    async getDailyPayroll(projectId?: number | string): Promise<PayrollReport[]> {
        console.log(`GET /api/v1/labour/report/daily?project_id=${projectId}`);
        const response = await api.get("/labour/report/daily", {
            params: { project_id: projectId }
        });
        console.log("GET /api/v1/labour/report/daily Raw Response Body:", response.data);
        return response.data;
    },

    /**
     * Get Weekly Payroll Report
     * GET /api/v1/labour/report/weekly
     */
    async getWeeklyPayroll(projectId?: number | string): Promise<PayrollReport[]> {
        console.log(`GET /api/v1/labour/report/weekly?project_id=${projectId}`);
        const response = await api.get("/labour/report/weekly", {
            params: { project_id: projectId }
        });
        console.log("GET /api/v1/labour/report/weekly Raw Response Body:", response.data);
        return response.data;
    },

    /**
     * Get Monthly Payroll Report
     * GET /api/v1/labour/report/monthly
     */
    async getMonthlyPayroll(projectId?: number | string): Promise<PayrollReport[]> {
        console.log(`GET /api/v1/labour/report/monthly?project_id=${projectId}`);
        const response = await api.get("/labour/report/monthly", {
            params: { project_id: projectId }
        });
        console.log("GET /api/v1/labour/report/monthly Raw Response Body:", response.data);
        return response.data;
    },

    /**
     * Export Payroll to Excel
     * GET /api/v1/labour/payroll/export
     */
    async exportPayroll(filters?: any): Promise<Blob> {
        const now = new Date();
        const cleanParams: any = {
            month: (filters?.month || (now.getMonth() + 1)).toString(),
            year: (filters?.year || now.getFullYear()).toString()
        };
        // Only pass project_id if explicitly provided
        if (filters?.project_id) cleanParams.project_id = filters.project_id.toString();
        console.log("GET /api/v1/labour/payroll/export Request Params:", cleanParams);
        const response = await api.get("/labour/payroll/export", {
            params: cleanParams,
            responseType: 'blob'
        });
        console.log("Payroll Excel Export Success: 200 OK");
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
        console.log("Payroll PDF Export Success: 200 OK");
        return response.data;
    }
};

export default paymentService;
