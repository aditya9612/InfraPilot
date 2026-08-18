import api from './api';
import type { IssueItem, CreateIssueRequest, UpdateIssueRequest, IssueResponse } from '../types/issue';

const DEFAULT_ISSUES: IssueItem[] = [
    {
        id: 1,
        project_id: 92,
        title: "Material Shortage",
        category: "Material",
        description: "Shortage of TMT bars on site.",
        reported_date: "2026-05-15",
        priority: "High",
        status: "Open",
        assigned_to: 101,
        resolution: null
    },
    {
        id: 2,
        project_id: 92,
        title: "Crane Malfunction",
        category: "Delay",
        description: "Tower crane broke down during operation.",
        reported_date: "2026-05-16",
        priority: "Critical",
        status: "Open",
        assigned_to: null,
        resolution: null
    }
];

export const issueService = {
    async listIssues(params?: {
        status?: string;
        priority?: string;
        assigned_to?: number;
        project_id?: number;
        category?: string;
        search?: string;
        sort_by?: string;
        order?: 'asc' | 'desc';
        limit?: number;
        offset?: number;
    }): Promise<IssueResponse> {
        try {
            const response = await api.get('/issues', { params });
            if (response.data) {
                if (Array.isArray(response.data)) {
                    return { items: response.data, meta: { total: response.data.length, limit: params?.limit || response.data.length, offset: params?.offset || 0 } };
                }
                if (Array.isArray(response.data.items)) {
                    return response.data;
                }
                if (Array.isArray(response.data.data)) {
                    return { items: response.data.data, meta: response.data.meta || { total: response.data.data.length, limit: params?.limit || response.data.data.length, offset: 0 } };
                }
            }
            return { items: [], meta: { total: 0, limit: 20, offset: 0 } };
        } catch (error) {
            console.warn("Issue Service: Fetch failed, using fallbacks.", error);
            return { items: DEFAULT_ISSUES, meta: { total: DEFAULT_ISSUES.length, limit: 20, offset: 0 } };
        }
    },

    async getIssues(params?: {
        status?: string;
        priority?: string;
        assigned_to?: number;
        project_id?: number;
        category?: string;
        search?: string;
        sort_by?: string;
        order?: 'asc' | 'desc';
        limit?: number;
        offset?: number;
    }): Promise<IssueResponse> {
        return this.listIssues(params);
    },

    async getIssuesByProject(projectId: number): Promise<IssueResponse> {
        try {
            const response = await api.get(`/issues/project/${projectId}`);
            if (response.data) {
                if (Array.isArray(response.data)) {
                    return { items: response.data, meta: { total: response.data.length, limit: response.data.length, offset: 0 } };
                }
                if (Array.isArray(response.data.items)) {
                    return response.data;
                }
                if (Array.isArray(response.data.data)) {
                    return { items: response.data.data, meta: response.data.meta || { total: response.data.data.length, limit: response.data.data.length, offset: 0 } };
                }
            }
            return { items: [], meta: { total: 0, limit: 20, offset: 0 } };
        } catch (error) {
            console.warn(`Issue Service: Fetch by project /issues/project/${projectId} failed, falling back to /issues`, error);
            try {
                return await this.listIssues({ project_id: projectId, limit: 1000 });
            } catch (err) {
                return { items: DEFAULT_ISSUES.filter(i => i.project_id === projectId) };
            }
        }
    },

    async getIssue(id: number): Promise<IssueItem> {
        try {
            const response = await api.get(`/issues/${id}`);
            return response.data;
        } catch (error) {
            const issue = DEFAULT_ISSUES.find(i => i.id === id);
            if (issue) return issue;
            throw error;
        }
    },

    async createIssue(data: CreateIssueRequest): Promise<IssueItem> {
        const response = await api.post('/issues', data);
        return response.data;
    },

    async updateIssue(id: number, data: UpdateIssueRequest): Promise<IssueItem> {
        const response = await api.put(`/issues/${id}`, data);
        return response.data;
    },

    async deleteIssue(id: number): Promise<void> {
        await api.delete(`/issues/${id}`);
    },

    async exportIssuesPdf(params?: {
        project_id?: number;
        status?: string;
        priority?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<Blob> {
        const response = await api.get('/reports/issues/pdf', {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    async exportIssuesExcel(params?: {
        project_id?: number;
        status?: string;
        priority?: string;
        start_date?: string;
        end_date?: string;
    }): Promise<Blob> {
        const response = await api.get('/reports/issues/excel', {
            params,
            responseType: 'blob'
        });
        return response.data;
    }
};
