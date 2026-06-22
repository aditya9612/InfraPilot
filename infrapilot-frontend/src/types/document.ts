export interface Document {
    id: number;
    project_id: number;
    project_name?: string;
    title: string;
    document_type: string | null;
    file_url: string | null;
    file_size: number | null;
    version: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    is_folder: boolean;
    parent_id: number | null;
    uploaded_by_user_id: number;
    uploaded_at: string;
    remarks: string | null;
}

export interface DocumentStats {
    total_storage_bytes: number;
    total_storage_gb: number;
    pending_approvals: number;
    total_documents: number;
}

export interface DocumentListResponse {
    items: Document[];
    meta: {
        total: number;
        limit: number;
        offset: number;
    };
}

export interface DocumentUploadParams {
    project_id: number;
    title: string;
    document_type: string;
    parent_id?: number | null;
    remarks?: string;
    file: File;
}

export interface FolderCreateParams {
    project_id: number;
    title: string;
    parent_id?: number | null;
}

export interface DocumentUpdateParams {
    title?: string;
    document_type?: string;
    status?: string;
    remarks?: string;
    version?: string;
    file_url?: string | null;
    file_size?: number;
    file?: File;
}
