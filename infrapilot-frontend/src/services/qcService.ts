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
    project_id: number;          // required
    inspection_type: string;     // required
    test_type: string;           // required
    result: number;              // required
    task_id?: number | null;     // optional
    dsr_id?: number | null;      // optional
    standard_value?: number | null; // optional
    status?: string | null;      // optional
    engineer_name?: string | null; // optional
    remarks?: string | null;     // optional
    report_file?: File | string | null; // optional
}

export interface UpdateQcRequest {
    project_id: number;          // required
    inspection_type: string;     // required
    test_type: string;           // required
    result: number;              // required
    task_id?: number | null;     // optional
    dsr_id?: number | null;      // optional
    standard_value?: number | null; // optional
    status?: string | null;      // optional
    engineer_name?: string | null; // optional
    remarks?: string | null;     // optional
    report_file?: File | string | null; // optional
}

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

        try {
            const response = await api.get('/qc', { params });
            return response.data;
        } catch (error: any) {
            console.warn("QC List Fetch Failed (Falling back to empty list):", error.message);
            return { items: [], meta: { total: 0, limit: 10, offset: 0 } };
        }
    },

    getQc: async (qc_id: number): Promise<QcItem> => {
        const response = await api.get(`/qc/${qc_id}`);
        return response.data;
    },

    createQc: async (data: CreateQcRequest): Promise<QcItem> => {
        // POST /api/v1/qc — all fields as query params + optional file as multipart
        const params: any = {
            project_id: data.project_id,
            inspection_type: data.inspection_type,
            test_type: data.test_type,
            result: data.result,
        };
        if (data.task_id != null) params.task_id = data.task_id;
        if (data.dsr_id != null) params.dsr_id = data.dsr_id;
        if (data.standard_value != null) params.standard_value = data.standard_value;
        if (data.status) params.status = data.status;
        if (data.engineer_name) params.engineer_name = data.engineer_name;
        if (data.remarks) params.remarks = data.remarks;

        const formData = new FormData();
        if (data.report_file && typeof data.report_file !== 'string') {
            formData.append("report_file", data.report_file as Blob);
        }

        const response = await api.post('/qc', formData, {
            params,
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    updateQc: async (qc_id: number, data: UpdateQcRequest): Promise<QcItem> => {
        // PUT /api/v1/qc/{qc_id} — request body as application/json
        const body: any = {
            project_id: data.project_id,
            inspection_type: data.inspection_type,
            test_type: data.test_type,
            result: data.result,
            task_id: data.task_id ?? null,
            dsr_id: data.dsr_id ?? null,
            standard_value: data.standard_value ?? null,
            status: data.status ?? null,
            engineer_name: data.engineer_name ?? null,
            remarks: data.remarks ?? null,
        };

        // If there's a new file, use multipart; otherwise send JSON
        if (data.report_file && typeof data.report_file !== 'string') {
            const formData = new FormData();
            formData.append("report_file", data.report_file as Blob);
            const response = await api.put(`/qc/${qc_id}`, formData, {
                params: body,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        }

        const response = await api.put(`/qc/${qc_id}`, body, {
            headers: { 'Content-Type': 'application/json' }
        });
        return response.data;
    },

    deleteQc: async (qc_id: number): Promise<{ message: string }> => {
        const response = await api.delete(`/qc/${qc_id}`);
        return response.data;
    }
};
