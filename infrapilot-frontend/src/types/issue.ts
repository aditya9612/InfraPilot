export interface IssueItem {
    id: number;
    business_id?: string;
    project_id: number;
    title: string;
    category: string;
    description: string;
    reported_date: string;
    priority: string;
    status: string;
    assigned_to: number | null;
    resolution: string | null;
}

export interface CreateIssueRequest {
    project_id: number;
    title: string;
    category: string;
    description: string;
    reported_date: string;
    priority: string;
}

export interface UpdateIssueRequest {
    title: string;
    category: string;
    description: string;
    priority: string;
    status: string;
    assigned_to: number | null;
    resolution: string | null;
    reported_date?: string;
}

export interface IssueResponse {
    items: IssueItem[];
    meta?: {
        total: number;
        limit: number;
        offset: number;
    };
}