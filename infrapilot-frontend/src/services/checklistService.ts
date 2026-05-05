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
    checklist_name?: string; // Optional for UI convenience if joined on backend
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
    listChecklists: async (): Promise<ChecklistItem[]> => {
        const response = await api.get('/checklists');
        return response.data;
    },

    createChecklist: async (data: CreateChecklistRequest): Promise<ChecklistItem> => {
        const response = await api.post('/checklists', data, {
            params: { project_id: data.project_id }
        });
        return response.data;
    },

    addItem: async (data: AddItemRequest): Promise<ChecklistItemEntry> => {
        const response = await api.post('/checklists/items', data);
        console.log("Add Item Success: 200 OK");
        return response.data;
    },

    executeChecklist: async (data: ExecuteChecklistRequest): Promise<ChecklistLog> => {
        const response = await api.post('/checklists/execute', data);
        return response.data;
    },

    listLogs: async (project_id: number): Promise<ChecklistLogResponse> => {
        const response = await api.get('/checklists/logs', {
            params: { project_id }
        });
        return response.data;
    },

    deleteChecklist: async (id: number): Promise<{ message: string }> => {
        const response = await api.delete(`/checklists/${id}`);
        return response.data;
    }
};
