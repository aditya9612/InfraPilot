export interface ChecklistItem {
    id: string;
    task: string;
    status: "Done" | "Pending";
}

export interface ChecklistRecord {
    id: number;
    business_id?: string;
    project_id: number;
    checklist_name: string;
    item_list: ChecklistItem[];
    status: "Done" | "Pending";
    remarks: string;
    reported_date: string;
}

export interface CreateChecklistRequest {
    project_id: number;
    checklist_name: string;
    item_list: ChecklistItem[];
    remarks?: string;
}

export interface UpdateChecklistRequest {
    checklist_name?: string;
    item_list?: ChecklistItem[];
    remarks?: string;
    status?: "Done" | "Pending";
}

export interface ChecklistResponse {
    items: ChecklistRecord[];
    meta?: {
        total: number;
        limit: number;
        offset: number;
    };
}
