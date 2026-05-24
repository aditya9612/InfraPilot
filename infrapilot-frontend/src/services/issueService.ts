import api from "./api";
import type { IssueItem, CreateIssueRequest, IssueResponse } from "../types/issue";

export const issueService = {
    /**
     * Get List of Issues (by filters)
     * GET /api/v1/issues
     */
    async getIssues(params?: any): Promise<IssueResponse> {
        try {
            const queryParams: any = {};

            // Omit empty fields to prevent 422 errors
            if (params?.project_id) queryParams.project_id = params.project_id;
            if (params?.status && params.status !== "All") queryParams.status = params.status;
            if (params?.priority && params.priority !== "All") queryParams.priority = params.priority;
            if (params?.category) queryParams.category = params.category;
            if (params?.assigned_to) queryParams.assigned_to = params.assigned_to;
            if (params?.search) queryParams.search = params.search;
            if (params?.sort_by) queryParams.sort_by = params.sort_by;
            if (params?.order) queryParams.order = params.order;
            if (params?.limit) queryParams.limit = params.limit;
            if (params?.offset !== undefined) queryParams.offset = params.offset;

            console.log("GET /api/v1/issues - Params:", queryParams);
            const response = await api.get("/issues", { params: queryParams });
            console.log("GET /api/v1/issues - Response:", response.data);
            
            return response.data;
        } catch (error: any) {
            console.error("Get Issues API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get Lists Issues By Project ID
     * GET /api/v1/issues/project/{project_id}
     */
    async listIssuesByProject(projectId: number, params?: any): Promise<IssueResponse> {
        try {
            const queryParams: any = {};
            if (params?.search) queryParams.search = params.search;

            const response = await api.get(`/issues/project/${projectId}`, { 
                params: queryParams 
            });
            return response.data;
        } catch (error: any) {
            console.error(`List Issues By Project ${projectId} API Error:`, error.response?.data || error.message);
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
     * POST /api/v1/issues?project_id=92
     */
    async createIssue(data: CreateIssueRequest): Promise<IssueItem> {
        try {
            console.log("Creating Issue with payload:", data);
            const response = await api.post("/issues", data);
            return response.data;
        } catch (error: any) {
            console.error("Create Issue API Error:", error.response?.data || error.message);
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
