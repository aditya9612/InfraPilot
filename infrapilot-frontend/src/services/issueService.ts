import api from "./api";
import type { IssueItem, CreateIssueRequest, UpdateIssueRequest, IssueResponse } from "../types/issue";

export const issueService = {
    /**
     * Get List of Issues (by filters)
     * GET /api/v1/issues
     */
    async getIssues(params?: any): Promise<IssueResponse> {
        try {
            const response = await api.get("/issues", { params });
            return response.data;
        } catch (error: any) {
            console.error("Get Issues API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get Lists Issues By Project ID
     * GET /api/v1/issues?project_id=36
     */
    async listIssuesByProject(project_id: number, params?: any): Promise<IssueResponse> {
        try {
            const activeProjectId = project_id || 36;
            const response = await api.get(`/issues`, { 
                params: { ...params, project_id: activeProjectId } 
            });
            return response.data;
        } catch (error: any) {
            console.error("List Issues By Project API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get Issue By ID
     * GET /api/v1/issues/{id}
     */
    async getIssue(id: number): Promise<IssueItem> {
        try {
            const response = await api.get(`/issues/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Get Issue ${id} API Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Create Issue
     * POST /api/v1/issues?project_id=36
     */
    async createIssue(data: CreateIssueRequest): Promise<IssueItem> {
        try {
            console.log("Creating Issue with payload:", data);
            const { project_id, ...payload } = data;
            const response = await api.post("/issues", payload, {
                params: { project_id: 36 }
            });
            return response.data;
        } catch (error: any) {
            console.error("Create Issue API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Update Issue By ID
     * PUT /api/v1/issues/{id}?project_id=36
     */
    async updateIssue(id: number, data: UpdateIssueRequest): Promise<IssueItem> {
        try {
            const response = await api.put(`/issues/${id}`, data, {
                params: { project_id: 36 }
            });
            return response.data;
        } catch (error: any) {
            console.error(`Update Issue ${id} API Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Delete Issue By ID
     * DELETE /api/v1/issues/{id}
     */
    async deleteIssue(id: number): Promise<{ success: boolean; message: string }> {
        try {
            const response = await api.delete(`/issues/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Delete Issue ${id} API Error:`, error.response?.data || error.message);
            throw error;
        }
    }
};
