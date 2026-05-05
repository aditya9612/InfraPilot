import api from "./api";

export const reportService = {
    /**
     * Get Daily Report (DSR summary)
     * GET /api/v1/reports/daily
     */
    async getDailyReport(projectId: number, date: string) {
        try {
            const response = await api.get("/reports/daily", {
                params: { project_id: projectId, report_date: date }
            });
            return response.data;
        } catch (error: any) {
            console.error("Daily Report API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get Weekly Progress
     * GET /api/v1/reports/weekly
     */
    async getWeeklyProgress(projectId: number) {
        try {
            const response = await api.get("/reports/weekly", {
                params: { project_id: projectId }
            });
            return response.data;
        } catch (error: any) {
            console.error("Weekly Progress API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get Labour Report
     * GET /api/v1/reports/labour
     */
    async getLabourReport(projectId: number) {
        try {
            const response = await api.get("/reports/labour", {
                params: { project_id: projectId }
            });
            return response.data;
        } catch (error: any) {
            console.error("Labour Report API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get Material Report
     * GET /api/v1/reports/material
     */
    async getMaterialReport(projectId: number) {
        try {
            const response = await api.get("/reports/material", {
                params: { project_id: projectId }
            });
            return response.data;
        } catch (error: any) {
            console.error("Material Report API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get Issue Report
     * GET /api/v1/reports/issues
     */
    async getIssueReport(projectId: number) {
        try {
            const response = await api.get("/reports/issues", {
                params: { project_id: projectId }
            });
            return response.data;
        } catch (error: any) {
            console.error("Issue Report API Error:", error.response?.data || error.message);
            throw error;
        }
    }
};
