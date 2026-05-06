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
  report_file?: File | null;
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
    const formData = new FormData();
    formData.append("project_id", String(data.project_id));
    formData.append("inspection_type", data.inspection_type);
    formData.append("test_type", data.test_type);
    formData.append("result", String(data.result));
    formData.append("standard_value", String(data.standard_value));
    formData.append("status", data.status);
    formData.append("engineer_name", data.engineer_name);
    formData.append("remarks", data.remarks ?? "");
    formData.append("task_id", "");
    formData.append("dsr_id", "");
    if (data.report_file) {
      formData.append("report_file", data.report_file);
    }

    const response = await api.post("/qc", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },

  updateQc: async (qcId: number, data: CreateQcRequest): Promise<any> => {
    const formData = new FormData();
    formData.append("project_id", String(data.project_id));
    formData.append("inspection_type", data.inspection_type);
    formData.append("test_type", data.test_type);
    formData.append("result", String(data.result));
    formData.append("standard_value", String(data.standard_value));
    formData.append("status", data.status);
    formData.append("engineer_name", data.engineer_name);
    formData.append("remarks", data.remarks ?? "");
    formData.append("task_id", "");
    formData.append("dsr_id", "");
    if (data.report_file) {
      formData.append("report_file", data.report_file);
    }

    const response = await api.put(`/qc/${qcId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return response.data;
  },

  deleteQc: async (qcId: number): Promise<any> => {
    const response = await api.delete(`/qc/${qcId}`);
    return response.data;
  }
};
