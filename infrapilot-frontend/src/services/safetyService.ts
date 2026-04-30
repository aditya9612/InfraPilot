import api from './api';

export interface IncidentItem {
    id: number;
    project_id: number;
    date: string;
    violation_type: string;
    description: string;
    injury_details: string;
    action_taken: string;
    responsible_person: string;
}

export interface CreateIncidentRequest {
    project_id: number;
    date: string;
    violation_type: string;
    description: string;
    injury_details: string;
    action_taken: string;
    responsible_person: string;
}

export type UpdateIncidentRequest = CreateIncidentRequest;

export interface IncidentResponse {
    items: IncidentItem[];
    meta: {
        total: number;
        limit: number;
        offset: number;
    };
}

export const listIncidents = async (project_id: number, violation_type?: string): Promise<IncidentResponse> => {
    const params: Record<string, any> = { project_id };
    if (violation_type) {
        params.violation_type = violation_type;
    }

    const response = await api.get('/safety', { params });
    return response.data;
};

export const getIncident = async (id: number): Promise<IncidentItem> => {
    const response = await api.get(`/safety/${id}`);
    return response.data;
};

export const createIncident = async (data: CreateIncidentRequest): Promise<IncidentItem> => {
    const response = await api.post('/safety', data);
    return response.data;
};

export const updateIncident = async (id: number, data: UpdateIncidentRequest): Promise<IncidentItem> => {
    const response = await api.put(`/safety/${id}`, data);
    return response.data;
};

export const deleteIncident = async (id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/safety/${id}`);
    return response.data;
};
