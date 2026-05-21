export type PaymentType = 'salary' | 'advance';
export type PaymentMethod = 'UPI' | 'Cash' | 'Bank';
export type PaymentStatus = 'paid' | 'pending';
export type AdvanceStatus = 'pending' | 'approved' | 'rejected';

export interface Payment {
    id: number;
    labour_id: number;
    worker_name: string;
    contractor_name: string;
    amount: number;
    payment_type: PaymentType;
    payment_method: PaymentMethod;
    status: PaymentStatus;
    payment_date: string;
}

export interface AdvanceRequest {
    id: number;
    labour_id: number;
    worker_name: string;
    advance_amount: number;
    reason: string;
    status: AdvanceStatus;
}

export interface SalaryPaymentPayload {
    labour_id: number;
    payment_amount: number;
    payment_method: PaymentMethod;
}

export interface AdvanceRequestPayload {
    labour_id: number;
    advance_amount: number;
    reason: string;
}

export interface PayrollReport {
    date?: string;
    week?: string;
    month?: string;
    total_wages: number;
    overtime_wages: number;
    total_payout: number;
    attendance_summary?: string;
}
