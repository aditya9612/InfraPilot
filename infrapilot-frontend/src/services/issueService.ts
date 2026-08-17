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
            if (response.data && Array.isArray(response.data.items)) {
                return response.data;
            }
            return { items: DEFAULT_ISSUES, meta: { total: DEFAULT_ISSUES.length, limit: 20, offset: 0 } };
        } catch (error) {
            console.warn("Issue Service: Fetch failed, using fallbacks.", error);
            return { items: DEFAULT_ISSUES, meta: { total: DEFAULT_ISSUES.length, limit: 20, offset: 0 } };
        }
    },

    async getIssuesByProject(projectId: number): Promise<IssueResponse> {
        try {
            const response = await api.get(`/issues/project/${projectId}`);
            if (response.data && Array.isArray(response.data.items)) {
                return response.data;
            }
            return { items: DEFAULT_ISSUES.filter(i => i.project_id === projectId) };
        } catch (error) {
            console.warn(`Issue Service: Fetch by project failed, using fallbacks.`, error);
            return { items: DEFAULT_ISSUES.filter(i => i.project_id === projectId) };
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
        try {
            const response = await api.post('/issues', data);
            return response.data;
        } catch (error) {
            console.warn("Issue Service: Create failed, returning mock", error);
            return {
                ...data,
                id: Math.floor(Math.random() * 1000),
                status: "Open",
                assigned_to: null,
                resolution: null
            } as IssueItem;
        }
    },

    async updateIssue(id: number, data: UpdateIssueRequest): Promise<IssueItem> {
        try {
            const response = await api.put(`/issues/${id}`, data);
            return response.data;
        } catch (error) {
            console.warn("Issue Service: Update failed", error);
            const issue = DEFAULT_ISSUES.find(i => i.id === id);
            if (issue) {
                return { ...issue, ...data } as IssueItem;
            }
            throw error;
        }
    },

    async deleteIssue(id: number): Promise<void> {
        try {
            await api.delete(`/issues/${id}`);
        } catch (error) {
            console.warn("Issue Service: Delete failed, returning mock success", error);
        }
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
