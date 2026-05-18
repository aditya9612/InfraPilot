export interface UserSettings {
    user_id: number;
    default_project_id: number | null;
    unit: string;
    notifications_enabled: boolean;
    preferences: any;
    financial_year: string;
    currency: string;
    tax_settings: any;
    invoice_format: string;
    payment_terms: string;
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
    unit: string;
    notifications_enabled: boolean;
    preferences: any;
    financial_year: string;
    currency: string;
    tax_settings: any;
    invoice_format: string;
    payment_terms: string;
}

export interface UpdateProfileRequest {
    full_name: string;
    role: string;
    mobile_number: string;
    email: string;
    address: string;
    pan_number: string;
    aadhaar_number: string;
    designation: string;
    joining_date: string;
    is_active: boolean;
    profile_image?: File | string | null;
}
