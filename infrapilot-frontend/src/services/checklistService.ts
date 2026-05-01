import api from "./api";
import type { ChecklistRecord, CreateChecklistRequest, UpdateChecklistRequest, ChecklistResponse } from "../types/checklist";

export const checklistService = {
    /**
     * Get List of Checklists (by filters)
     * GET /api/v1/checklists
     */
    async getChecklists(params?: any): Promise<ChecklistResponse> {
        try {
            const response = await api.get("/checklists", { params });
            return response.data;
        } catch (error: any) {
            console.error("Get Checklists API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get Lists Checklists By Project ID
     * GET /api/v1/checklists/project/{project_id}
     */
    async listChecklistsByProject(project_id: number, params?: any): Promise<ChecklistResponse> {
        try {
            const response = await api.get(`/checklists/project/${project_id}`, { params });
            return response.data;
        } catch (error: any) {
            console.error("List Checklists By Project API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get Checklist By ID
     * GET /api/v1/checklists/{id}
     */
    async getChecklist(id: number): Promise<ChecklistRecord> {
        try {
            const response = await api.get(`/checklists/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Get Checklist ${id} API Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Create Checklist
     * POST /api/v1/checklists
     */
    async createChecklist(data: CreateChecklistRequest): Promise<ChecklistRecord> {
        try {
            const response = await api.post("/checklists", data);
            return response.data;
        } catch (error: any) {
            console.error("Create Checklist API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Update Checklist By ID
     * PUT /api/v1/checklists/{id}
     */
    async updateChecklist(id: number, data: UpdateChecklistRequest): Promise<ChecklistRecord> {
        try {
            const response = await api.put(`/checklists/${id}`, data);
            return response.data;
        } catch (error: any) {
            console.error(`Update Checklist ${id} API Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Delete Checklist By ID
     * DELETE /api/v1/checklists/{id}
     */
    async deleteChecklist(id: number): Promise<{ success: boolean; message: string }> {
        try {
            const response = await api.delete(`/checklists/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Delete Checklist ${id} API Error:`, error.response?.data || error.message);
            throw error;
        }
    }
};
