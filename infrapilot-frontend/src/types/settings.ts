export interface UserSettings {
    user_id: number;
    default_project_id: number | null;
    unit: any; // Flexible for now
    notifications_enabled: any;
    preferences: any;
    financial_year?: string;
    currency?: string;
    tax_settings?: any;
    invoice_format?: string;
    payment_terms?: string;
}

export interface UserProfile {
    user_id: number;
    full_name: string;
    role: string;
    mobile_number: string;
    email: string;
    address: string;
    pan_number: string;
    aadhaar_number: string;
    profile_image: string | null;
    designation: string;
    joining_date: string;
    is_active: boolean;
}

export interface UpdateSettingsRequest {
    default_project_id: number | null;
    unit: any;
    notifications_enabled: any;
    preferences: any;
    financial_year?: string;
    currency?: string;
    tax_settings?: any;
    invoice_format?: string;
    payment_terms?: string;
}

export interface UpdateProfileRequest {
    user_id?: number;
    full_name?: string;
    role?: string;
    mobile_number?: string;
    email?: string;
    address?: string;
    pan_number?: string;
    aadhaar_number?: string;
    designation?: string;
    joining_date?: string;
    is_active?: boolean;
    profile_image?: File | string | null;
}

export interface CompanySettings {
    id: number;
    company_name: string | null;
    company_logo: string | null;
    gst_number: string | null;
    mobile_number: string | null;
    email: string | null;
    website: string | null;
    address: string | null;
    instagram_handle: string | null;
    whatsapp_number: string | null;
    bank_name: string | null;
    account_holder_name: string | null;
    account_number: string | null;
    ifsc_code: string | null;
    upi_id: string | null;
    signature_image: string | null;
    terms_conditions: string | null;
}

export interface UpdateCompanySettings {
    company_name?: string | null;
    company_logo?: string | null;
    gst_number?: string | null;
    mobile_number?: string | null;
    email?: string | null;
    website?: string | null;
    address?: string | null;
    instagram_handle?: string | null;
    whatsapp_number?: string | null;
    bank_name?: string | null;
    account_holder_name?: string | null;
    account_number?: string | null;
    ifsc_code?: string | null;
    upi_id?: string | null;
    signature_image?: string | null;
    terms_conditions?: string | null;
}
