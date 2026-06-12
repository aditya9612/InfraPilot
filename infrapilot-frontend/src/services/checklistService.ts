import api from './api';

export interface ChecklistItem {
    id: number;
    project_id: number;
    name: string;
    type: string;
}

export interface ChecklistItemEntry {
    id: number;
    checklist_id: number;
    item: string;
}

export interface ChecklistLog {
    id: number;
    project_id: number;
    checklist_id: number;
    status: string;
    remarks: string;
    created_at?: string;
    checklist_name?: string;
}

export interface ChecklistLogResponse {
    items: ChecklistLog[];
    meta: {
        total: number;
        limit: number;
        offset: number;
    };
}

export interface CreateChecklistRequest {
    project_id: number;
    name: string;
    type: string;
}

export interface AddItemRequest {
    checklist_id: number;
    item: string;
}

export interface ExecuteChecklistRequest {
    project_id: number;
    checklist_id: number;
    status: string;
    remarks: string;
}



export const checklistService = {
    listChecklists: async (projectId?: number): Promise<ChecklistItem[]> => {
        const response = await api.get('/checklists', {
            params: projectId ? { project_id: projectId } : {}
        });
        return response.data;
    },

    createChecklist: async (data: CreateChecklistRequest): Promise<ChecklistItem> => {
        const response = await api.post('/checklists', data);
        return response.data;
    },

    addItem: async (data: AddItemRequest): Promise<ChecklistItemEntry> => {
        const response = await api.post('/checklists/items', data);
        return response.data;
    },

    executeChecklist: async (data: ExecuteChecklistRequest): Promise<ChecklistLog> => {
        const response = await api.post('/checklists/execute', data);
        return response.data;
    },

    listLogs: async (projectId?: number): Promise<ChecklistLogResponse> => {
        const response = await api.get('/checklists/logs', {
            params: projectId ? { project_id: projectId } : {}
        });
        return response.data;
    },

    deleteChecklist: async (id: number): Promise<{ message: string }> => {
        const response = await api.delete(`/checklists/${id}`);
        return response.data;
    }
};
