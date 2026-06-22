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
    report_file?: string | null;
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
    report_file?: string | null;
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

export const qcService = {
    listQc: async (project_id: number, filters?: { task_id?: number; status?: string; inspection_type?: string }): Promise<QcResponse> => {
        const params: any = { project_id };
        if (filters?.task_id) params.task_id = filters.task_id;
        if (filters?.status) params.status = filters.status;
        if (filters?.inspection_type) params.inspection_type = filters.inspection_type;

        const response = await api.get('/qc', { params });
        return response.data;
    },

    getQc: async (qc_id: number): Promise<QcItem> => {
        const response = await api.get(`/qc/${qc_id}`);
        return response.data;
    },

    createQc: async (data: CreateQcRequest): Promise<QcItem> => {
        const payload = {
            ...data,
            task_id: data.task_id || null,
            dsr_id: data.dsr_id || null,
            remarks: data.remarks || null
        };
        const response = await api.post('/qc', null, {
            params: payload
        });
        return response.data;
    },

    updateQc: async (qc_id: number, data: UpdateQcRequest): Promise<QcItem> => {
        const payload = {
            ...data,
            id: qc_id,
            task_id: data.task_id || null,
            dsr_id: data.dsr_id || null,
            remarks: data.remarks || null
        };
        const response = await api.put(`/qc/${qc_id}`, null, {
            params: payload
        });
        return response.data;
    },

    deleteQc: async (qc_id: number): Promise<{ message: string }> => {
        const response = await api.delete(`/qc/${qc_id}`);
        return response.data;
    }
};