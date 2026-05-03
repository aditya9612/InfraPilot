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
        try {
            const response = await api.post<Payment>("/payments/salary", payload);
            return response.data;
        } catch (err) {
            console.log("paymentService: Salary payment failed. Using demo fallback.");
            return {
                id: Math.floor(Math.random() * 1000),
                labour_id: payload.labour_id,
                worker_name: "Ramesh Kumar",
                contractor_name: "Universal Construction",
                amount: payload.payment_amount,
                payment_type: 'salary',
                payment_method: payload.payment_method,
                status: 'paid',
                payment_date: new Date().toISOString()
            };
        }
    },

    /**
     * Submit advance payment request
     * POST /api/v1/payments/advance
     */
    async requestAdvance(payload: AdvanceRequestPayload): Promise<AdvanceRequest> {
        try {
            const response = await api.post<AdvanceRequest>("/payments/advance", payload);
            return response.data;
        } catch (err) {
            console.log("paymentService: Advance request failed. Using demo fallback.");
            return {
                id: Math.floor(Math.random() * 1000),
                labour_id: payload.labour_id,
                worker_name: "Suresh Yadav",
                advance_amount: payload.advance_amount,
                reason: payload.reason,
                status: 'pending'
            };
        }
    },

    /**
     * Get payment history
     * GET /api/v1/payments/history
     */
    async getPaymentHistory(params?: any): Promise<Payment[]> {
        try {
            const response = await api.get<Payment[]>("/payments/history", { params });
            return response.data;
        } catch (err) {
            return [
                {
                    id: 1,
                    labour_id: 1,
                    worker_name: "Ramesh Kumar",
                    contractor_name: "Universal Construction",
                    amount: 12000,
                    payment_type: 'salary',
                    payment_method: 'UPI',
                    status: 'paid',
                    payment_date: "2026-04-25"
                },
                {
                    id: 2,
                    labour_id: 2,
                    worker_name: "Suresh Yadav",
                    contractor_name: "Modern Builders",
                    amount: 3000,
                    payment_type: 'advance',
                    payment_method: 'Cash',
                    status: 'paid',
                    payment_date: "2026-04-20"
                }
            ];
        }
    },

    /**
     * Get pending dues report
     * GET /api/v1/payments/pending
     */
    async getPendingDues(): Promise<any[]> {
        try {
            const response = await api.get("/payments/pending");
            return response.data;
        } catch (err) {
            return [
                { contractor_name: "Universal Construction", total_due: 45000, paid_amount: 30000, pending_amount: 15000, last_payment_date: "2026-04-22" },
                { contractor_name: "Modern Builders", total_due: 28000, paid_amount: 20000, pending_amount: 8000, last_payment_date: "2026-04-18" }
            ];
        }
    },

    /**
     * Get Daily Payroll
     * GET /api/v1/payments/payroll/daily
     */
    async getDailyPayroll(): Promise<PayrollReport[]> {
        try {
            const response = await api.get("/payments/payroll/daily");
            return response.data;
        } catch (err) {
            return [{ date: "2026-04-26", total_wages: 8500, overtime_wages: 1200, total_payout: 9700 }];
        }
    },

    /**
     * Get Weekly Payroll
     * GET /api/v1/payments/payroll/weekly
     */
    async getWeeklyPayroll(): Promise<PayrollReport[]> {
        try {
            const response = await api.get("/payments/payroll/weekly");
            return response.data;
        } catch (err) {
            return [{ week: "Week 17", total_wages: 58000, overtime_wages: 4500, total_payout: 62500, attendance_summary: "Avg 42 Present/Day" }];
        }
    },

    /**
     * Get Monthly Payroll
     * GET /api/v1/payments/payroll/monthly
     */
    async getMonthlyPayroll(): Promise<PayrollReport[]> {
        try {
            const response = await api.get("/payments/payroll/monthly");
            return response.data;
        } catch (err) {
            return [{ month: "April 2026", total_wages: 245000, overtime_wages: 18000, total_payout: 263000, attendance_summary: "92% Occupancy" }];
        }
    },

    /**
     * Export Payroll to Excel
     * GET /api/v1/payments/export
     */
    async exportPayroll(filters?: any): Promise<Blob> {
        try {
            const response = await api.get("/payments/export", {
                params: filters,
                responseType: 'blob'
            });
            return response.data;
        } catch (err) {
            return new Blob(["Mock Payroll Export Content"], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        }
    },

    /**
     * Export Payroll to PDF
     * GET /api/v1/payments/export/pdf
     */
    async exportPayrollPDF(filters?: any): Promise<Blob> {
        try {
            const response = await api.get("/payments/export/pdf", {
                params: filters,
                responseType: 'blob'
            });
            return response.data;
        } catch (err) {
            return new Blob(["Mock Payroll PDF Content"], { type: "application/pdf" });
        }
    }
};

export default paymentService;
