export interface Agreement {
    id: number;
    document_id: string | null;
    project_id: number;
    owner_id: number;
    project_name: string | null;
    owner_name: string | null;
    type: string;
    status: string;
    uploaded_at: string;
    file_url: string;
}

export interface AgreementCreate {
    owner_id: number;
    project_id: number;
    type: string;
    file: File;
}

export interface AgreementStats {
    total_agreements: number;
    active_contracts: number;
    storage_used: string;
    missing_docs: number;
    recent_uploads: number;
}
