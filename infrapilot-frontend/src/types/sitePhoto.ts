export interface SitePhoto {
    id: number;
    project_id?: number;
    task_id?: number | null;
    url?: string;
    photo_url?: string;
    date: string;
    time: string;
    activity_tag: string;
    location_tag: string;
    description: string;
    uploaded_by: string;
}

export interface UploadPhotoRequest {
    date: string;
    activity_tag: string;
    location_tag: string;
    description: string;
    photo: File | null;
}

export interface SitePhotoResponse {
    items: SitePhoto[];
    meta?: {
        total: number;
        limit: number;
        offset: number;
    };
}
