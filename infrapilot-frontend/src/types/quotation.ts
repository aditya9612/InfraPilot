export interface Measurement {
    id?: number;
    length: number;
    width: number;
    height: number;
    unit: string;
    cubic_feet?: number;
    cubic_meter?: number;
    brass?: number;
    quantity?: number;
    formula_used?: string;
}

export interface QuotationItem {
    id?: number;
    item_type: string;
    title: string;
    description: string;
    unit: string;
    quantity?: number; // Calculated by backend or provided
    rate: number;
    amount?: number;
    measurements: Measurement[];
}

export interface LabourItem {
    id?: number;
    skill_type: string;
    labour_count: number;
    daily_wage: number;
    labour_days: number;
    overtime_hours: number;
    overtime_rate: number;
    amount?: number;
    notes?: string;
}

export interface MaterialItem {
    id?: number;
    material_name: string;
    category: string;
    unit: string;
    estimated_quantity: number;
    estimated_rate: number;
    estimated_amount?: number;
    notes?: string;
}

export interface ExtraChargeItem {
    id?: number;
    expense_type: string;
    description: string;
    quantity: number;
    rate: number;
    amount?: number;
    notes?: string;
}

export interface Quotation {
    id?: number;
    quotation_no?: string;
    client_name: string;
    company_name: string;
    mobile_number: string;
    email: string;
    billing_address: string;
    site_address: string;
    gst_number: string;

    project_name: string;
    project_type: string;
    project_start_date: string;
    project_end_date: string;
    engineer_name: string;
    work_order_no: string;

    items: QuotationItem[];
    labour_items: LabourItem[];
    material_items: MaterialItem[];
    extra_charge_items: ExtraChargeItem[];

    subtotal?: number;
    gst_percent: number;
    cgst_percent: number;
    sgst_percent: number;
    gst_amount?: number;
    cgst_amount?: number;
    sgst_amount?: number;

    tds_percent: number;
    tds_amount?: number;

    discount_amount: number;
    grand_total?: number;
    advance_paid: number;
    balance_due?: number;

    payment_mode: string;
    upi_id?: string;
    bank_name?: string;
    account_holder_name?: string;
    account_number?: string;
    ifsc_code?: string;
    due_date: string;

    notes?: string;
    terms_conditions?: string;

    status?: "draft" | "sent" | "approved" | "declined" | "converted";
    is_approved?: boolean;
    created_at?: string;
}

export type QuotationCreateData = Omit<Quotation, "id" | "quotation_no" | "subtotal" | "gst_amount" | "cgst_amount" | "sgst_amount" | "tds_amount" | "grand_total" | "balance_due" | "created_at">;
