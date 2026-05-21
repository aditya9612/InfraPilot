import api from "./api";

export const reportService = {
    getDailyReport: async (projectId: number, reportDate: string) => {
        const response = await api.get(`/reports/daily`, { params: { project_id: projectId, report_date: reportDate } });
        return response.data;
    },

    getWeeklyProgress: async (projectId: number) => {
        const response = await api.get(`/reports/weekly`, { params: { project_id: projectId } });
        return response.data;
    },

    getLabourReport: async (projectId: number) => {
        const response = await api.get(`/reports/labour`, { params: { project_id: projectId } });
        return response.data;
    },

    getMaterialReport: async (projectId: number) => {
        const response = await api.get(`/reports/material`, { params: { project_id: projectId } });
        return response.data;
    },

    getIssueReport: async (projectId: number) => {
        const response = await api.get(`/reports/issues`, { params: { project_id: projectId } });
        return response.data;
    },

    getWorkSummary: async (projectId: number) => {
        const response = await api.get(`/reports/work-summary`, { params: { project_id: projectId } });
        return response.data;
    },

    getContractorPerformance: async (projectId: number) => {
        const response = await api.get(`/reports/contractor-performance`, { params: { project_id: projectId } });
        return response.data;
    },

    getProfitLoss: async () => {
        const response = await api.get(`/reports/profit-loss`);
        return response.data;
    },

    getProjectReport: async (projectId: number) => {
        const response = await api.get(`/reports/project-report`, { params: { project_id: projectId } });
        return response.data;
    },

    getCashflow: async () => {
        const response = await api.get(`/reports/cashflow`);
        return response.data;
    },

    getAssetReport: async () => {
        const response = await api.get(`/reports/assets`);
        return response.data;
    },

    getFinancialSummary: async (projectId: number) => {
        const response = await api.get(`/reports/financial-summary`, { params: { project_id: projectId } });
        return response.data;
    },

    getQuarterlyAudit: async (projectId: number, year: number, quarter: number) => {
        const response = await api.get(`/reports/quarterly-audit`, { params: { project_id: projectId, year, quarter } });
        return response.data;
    },

    shareDailyEmail: async (data: any) => {
        const response = await api.post(`/reports/share/daily-email`, data);
        return response.data;
    },

    shareCombinedEmail: async (data: any) => {
        const response = await api.post(`/reports/share/combined-email`, data);
        return response.data;
    },

    shareCombinedWhatsapp: async (data: any) => {
        const response = await api.post(`/reports/share/combined-whatsapp`, data);
        return response.data;
    },

    exportDailyPDF: async (projectId: number, reportDate: string) => {
        const response = await api.get(`/reports/export/daily-pdf`, {
            params: { project_id: projectId, report_date: reportDate },
            responseType: 'blob'
        });
        return response.data;
    },

    exportWeeklyPDF: async (projectId: number) => {
        const response = await api.get(`/reports/export/weekly-pdf`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    exportProfitLossPDF: async () => {
        const response = await api.get(`/reports/export/profit-loss-pdf`, {
            responseType: 'blob'
        });
        return response.data;
    },

    exportCashflowPDF: async () => {
        const response = await api.get(`/reports/export/cashflow-pdf`, {
            responseType: 'blob'
        });
        return response.data;
    },

    exportLabourExcel: async (projectId: number) => {
        const response = await api.get(`/reports/export/labour-excel`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    exportMaterialExcel: async (projectId: number) => {
        const response = await api.get(`/reports/export/material-excel`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    exportIssueExcel: async (projectId: number) => {
        const response = await api.get(`/reports/export/issues-excel`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    exportAuditPDF: async (projectId: number) => {
        const response = await api.get(`/reports/export/audit-pdf`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    exportWorkSummaryPDF: async (projectId: number) => {
        const response = await api.get(`/reports/export/work-summary-pdf`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    exportContractorPerformancePDF: async (projectId: number) => {
        const response = await api.get(`/reports/export/contractor-performance-pdf`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    downloadCombinedReport: async (projectId: number, startDate: string, endDate: string) => {
        const response = await api.get(`/reports/combined`, {
            params: { project_id: projectId, start_date: startDate, end_date: endDate },
            responseType: 'blob'
        });
        return response.data;
    },

    downloadClientReport: async (projectId: number, startDate: string, endDate: string) => {
        const response = await api.get(`/reports/download`, {
            params: { project_id: projectId, start_date: startDate, end_date: endDate },
            responseType: 'blob'
        });
        return response.data;
    },
};
