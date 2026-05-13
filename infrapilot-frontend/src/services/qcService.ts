import api from "./api";

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
  report_file: string | null;
}

export interface QcResponse {
  items: QcItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface CreateQcRequest {
  project_id: number;
  inspection_type: string;
  test_type: string;
  result: number;
  standard_value: number;
  status: string;
  engineer_name: string;
  remarks?: string | null;
  task_id?: number | null;
  dsr_id?: number | null;
  report_file?: string | null;
}

export const qcService = {
  listQc: async (projectId: number): Promise<QcResponse> => {
    const response = await api.get("/qc", {
      params: { project_id: projectId }
    });
    return response.data;
  },

  getQc: async (qcId: number): Promise<QcItem> => {
    const response = await api.get(`/qc/${qcId}`);
    return response.data;
  },

  createQc: async (data: CreateQcRequest): Promise<any> => {
    // Backend expects all fields as QUERY PARAMETERS (not JSON body)
    // and optional file upload as multipart/form-data body
    const params: any = {
      project_id: Number(data.project_id),
      inspection_type: data.inspection_type,
      test_type: data.test_type,
      result: Number(data.result),
      standard_value: Number(data.standard_value),
      status: data.status,
      engineer_name: data.engineer_name,
    };

    if (data.remarks) params.remarks = data.remarks;
    if (data.task_id) params.task_id = Number(data.task_id);
    if (data.dsr_id) params.dsr_id = Number(data.dsr_id);

    const response = await api.post("/qc", null, { params });
    return response.data;
  },

  updateQc: async (qcId: number, data: CreateQcRequest): Promise<any> => {
    // Backend expects JSON body for PUT
    const payload: any = {
      project_id: Number(data.project_id),
      inspection_type: data.inspection_type,
      test_type: data.test_type,
      result: Number(data.result),
      standard_value: Number(data.standard_value),
      status: data.status,
      engineer_name: data.engineer_name,
    };

    if (data.remarks) payload.remarks = data.remarks;
    if (data.task_id) payload.task_id = Number(data.task_id);
    if (data.dsr_id) payload.dsr_id = Number(data.dsr_id);
    if (data.report_file) payload.report_file = data.report_file;

    const response = await api.put(`/qc/${qcId}`, payload);
    return response.data;
  },

  deleteQc: async (qcId: number): Promise<any> => {
    const response = await api.delete(`/qc/${qcId}`);
    return response.data;
  }
};
