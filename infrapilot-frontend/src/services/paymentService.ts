import api from "./api";
import type { 
    SalaryPaymentPayload, 
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
    async paySalary(payload: SalaryPaymentPayload): Promise<Payment> {
        console.log("POST /api/v1/labour/payments/salary Request Body:", payload);
        const response = await api.post<Payment>("/labour/payments/salary", payload);
        console.log("POST /api/v1/labour/payments/salary Raw Response Body:", response.data);
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
        console.log("GET /api/v1/labour/payments Request Params:", params);
        const response = await api.get<Payment[]>("/labour/payments", { params });
        console.log("GET /api/v1/labour/payments Raw Response Body:", response.data);
        return response.data;
    },

    /**
     * Get pending dues report
     * GET /api/v1/payments/pending
     */
    async getPendingDues(params?: any): Promise<any[]> {
        console.log("GET /api/v1/labour/pending Request Params:", params);
        const response = await api.get("/labour/pending", { params });
        console.log("GET /api/v1/labour/pending Raw Response Body:", response.data);
        return response.data;
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
     * GET /api/v1/labour/report/payroll/export
     */
    async exportPayroll(filters?: any): Promise<Blob> {
        console.log("GET /api/v1/labour/report/payroll/export Request Params:", filters);
        const response = await api.get("/labour/report/payroll/export", {
            params: filters,
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
