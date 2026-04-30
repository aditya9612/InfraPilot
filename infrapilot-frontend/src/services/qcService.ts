import api from './api';

export interface QcItem {
    id: number;
    project_id: number;
    task_id: number | null;
    dsr_id: number | null;
    inspection_type: string;
    test_type: string;
    result: number;
    standard_value: number;
    status: string;
    engineer_name: string;
    remarks: string | null;
}

export interface CreateQcRequest {
    project_id: number;
    inspection_type: string;
    test_type: string;
    result: number;
    standard_value: number;
    status: string;
    engineer_name: string;
    task_id?: number | null;
    dsr_id?: number | null;
    remarks?: string | null;
}

export type UpdateQcRequest = CreateQcRequest;

export interface QcResponse {
    items: QcItem[];
    meta: {
        total: number;
        limit: number;
        offset: number;
    };
}

export const listQc = async (project_id: number, filters?: { task_id?: number; status?: string }): Promise<QcResponse> => {
    const response = await api.get('/quality', {
        params: {
            project_id,
            ...filters,
        },
    });
    return response.data;
};

export const getQc = async (qc_id: number): Promise<QcItem> => {
    const response = await api.get(`/quality/${qc_id}`);
    return response.data;
};

export const createQc = async (data: CreateQcRequest): Promise<QcItem> => {
    const formData = new FormData();
    formData.append('project_id', String(data.project_id));
    formData.append('inspection_type', data.inspection_type);
    formData.append('test_type', data.test_type);
    formData.append('result', String(data.result));
    formData.append('standard_value', String(data.standard_value));
    formData.append('status', data.status);
    formData.append('engineer_name', data.engineer_name);

    if (data.task_id !== undefined && data.task_id !== null) {
        formData.append('task_id', String(data.task_id));
    }
    if (data.dsr_id !== undefined && data.dsr_id !== null) {
        formData.append('dsr_id', String(data.dsr_id));
    }
    formData.append('remarks', data.remarks ?? '');

    const response = await api.post('/quality', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const updateQc = async (qc_id: number, data: UpdateQcRequest): Promise<QcItem> => {
    const formData = new FormData();
    formData.append('project_id', String(data.project_id));
    formData.append('inspection_type', data.inspection_type);
    formData.append('test_type', data.test_type);
    formData.append('result', String(data.result));
    formData.append('standard_value', String(data.standard_value));
    formData.append('status', data.status);
    formData.append('engineer_name', data.engineer_name);

    if (data.task_id !== undefined && data.task_id !== null) {
        formData.append('task_id', String(data.task_id));
    }
    if (data.dsr_id !== undefined && data.dsr_id !== null) {
        formData.append('dsr_id', String(data.dsr_id));
    }
    formData.append('remarks', data.remarks ?? '');

    const response = await api.put(`/quality/${qc_id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};

export const deleteQc = async (qc_id: number): Promise<{ message: string }> => {
    const response = await api.delete(`/quality/${qc_id}`);
    return response.data;
};
