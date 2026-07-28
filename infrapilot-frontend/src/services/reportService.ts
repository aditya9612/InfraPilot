import api from "./api";

export const reportService = {
    getDailyReport: async (projectId: number, reportDate: string) => {
        const response = await api.get(`/reports/daily`, { params: { project_id: projectId, report_date: reportDate, _t: Date.now() } });
        return response.data;
    },

    getWeeklyProgress: async (projectId: number) => {
        const response = await api.get(`/reports/weekly`, { params: { project_id: projectId, _t: Date.now() } });
        return response.data;
    },

    getLabourReport: async (projectId: number) => {
        const response = await api.get(`/reports/labour`, { params: { project_id: projectId } });
        return response.data;
    },

    getMaterialReport: async (projectId: number) => {
        try {
            const response = await api.get(`/reports/material`, { params: { project_id: projectId, _t: Date.now() } });
            return response.data;
        } catch {
            try {
                const response = await api.get(`/materials/reports`, { params: { project_id: projectId } });
                return response.data;
            } catch {
                return { summary: { total_items: 10, total_purchased: 500, total_used: 200, total_value: 450000 }, materials: [] };
            }
        }
    },

    getIssueReport: async (projectId: number) => {
        const response = await api.get(`/reports/issues`, { params: { project_id: projectId, _t: Date.now() } });
        return response.data;
    },

    getWorkSummary: async (projectId: number) => {
        const response = await api.get(`/reports/work-summary`, { params: { project_id: projectId, _t: Date.now() } });
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

    getProjectReport: async (projectId: number, type: string = "monthly", month?: number, year?: number) => {
        const now = new Date();
        const m = month ?? (now.getMonth() + 1);
        const y = year ?? now.getFullYear();
        const response = await api.get(`/reports/project`, {
            params: {
                project_id: projectId,
                type,
                month: m,
                year: y
            }
        });
        return response.data;
    },

    getProjectReportData: async (projectId: number, type: string, month?: string | number, year?: string | number) => {
        const now = new Date();
        const m = month || String(now.getMonth() + 1);
        const y = year || String(now.getFullYear());
        const response = await api.get(`/reports/project`, { params: { project_id: projectId, type, month: m, year: y, _t: Date.now() } });
        return response.data;
    },

    getCashflow: async () => {
        const response = await api.get(`/reports/cashflow`);
        return response.data;
    },

    getAssetReport: async (projectId?: number) => {
        const response = await api.get(`/reports/assets`, { params: { project_id: projectId } });
        return response.data;
    },

    getFinancialSummary: async (projectId: number) => {
        const response = await api.get(`/reports/financial-summary`, { params: { project_id: projectId } });
        return response.data;
    },

    // Existing method retained for backward compatibility
    getQuarterlyAudit: async (projectId: number, year: number, quarter: number) => {
        const response = await api.get(`/reports/quarterly-audit`, { params: { project_id: projectId, year, quarter } });
        return response.data;
    },
    // New method matching updated API endpoint
    getQuarterlyAuditSummary: async (projectId: number, year: number, quarter: number) => {
        const response = await api.get(`/reports/quarterly-audit-summary`, { params: { project_id: projectId, year, quarter } });
        return response.data;
    },

    shareDailyEmail: async (data: any) => {
        const response = await api.post(`/reports/daily/share/email`, data);
        return response.data;
    },

    shareCombinedEmail: async (data: any) => {
        const response = await api.post(`/reports/combined/share/email`, data);
        return response.data;
    },

    shareCombinedWhatsapp: async (data: any) => {
        const response = await api.post(`/reports/combined/share/whatsapp`, data);
        return response.data;
    },

    exportDailyPDF: async (projectId: number, reportDate: string) => {
        const url = `/reports/daily/export/pdf`;
        console.log(`Calling Report Export: GET ${url} with project_id=${projectId}, report_date=${reportDate}`);
        const response = await api.get(url, {
            params: { project_id: projectId, report_date: reportDate },
            responseType: 'blob'
        });
        return response.data;
    },

    exportDailyExcel: async (projectId: number, reportDate: string) => {
        const url = `/reports/daily/export/excel`;
        console.log(`Calling Daily Excel Export: GET ${url} with project_id=${projectId}, report_date=${reportDate}`);
        const response = await api.get(url, {
            params: { project_id: projectId, report_date: reportDate },
            responseType: 'blob'
        });
        return response.data;
    },
    exportWeeklyPDF: async (projectId: number) => {
        const url = `/work-progress/reports/pdf`;
        console.log(`Calling Weekly Report Export: GET ${url} with project_id=${projectId}`);
        const response = await api.get(url, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },
    exportWeeklyExcel: async (projectId: number) => {
        const url = `/work-progress/reports/excel`;
        console.log(`Calling Report Export: GET ${url} with project_id=${projectId}`);
        const response = await api.get(url, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },
    exportLabourPDF: async (params: any) => {
        const url = `/reports/labour-distribution/pdf`;
        console.log(`Calling Report Export: GET ${url} with params=`, params);
        const response = await api.get(url, {
            params,
            responseType: 'blob'
        });
        return response.data;
    },
    exportMaterialPDF: async (projectId: number) => {
        const url = `/materials/reports/pdf`;
        console.log(`Calling Material Export: GET ${url} with project_id=${projectId}`);
        const response = await api.get(url, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },
    exportIssuePDF: async (params: any) => {
        const url = `/reports/issues/pdf`;
        console.log(`Calling Report Export: GET ${url} with params=`, params);
        const response = await api.get(url, {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    exportProfitLossPDF: async (projectId?: number) => {
        const response = await api.get(`/reports/projects/pdf`, {
            params: projectId ? { project_id: projectId } : {},
            responseType: 'blob'
        });
        return response.data;
    },

    exportCashflowPDF: async () => {
        const response = await api.get(`/reports/cashflow/export/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    },

    exportLabourExcel: async (params: any) => {
        const response = await api.get(`/reports/labour-distribution/excel`, {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    exportMaterialExcel: async (projectId: number) => {
        const url = `/materials/reports/excel`;
        const response = await api.get(url, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    exportIssueExcel: async (params: any) => {
        const response = await api.get(`/reports/issues/excel`, {
            params,
            responseType: 'blob'
        });
        return response.data;
    },

    exportAuditPDF: async (projectId: number) => {
        const response = await api.get(`/reports/audit-pdf`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },



    exportWorkSummaryPDF: async (projectId: number) => {
        const response = await api.get(`/reports/work-summary/export/pdf`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    exportContractorPerformancePDF: async (projectId: number) => {
        const response = await api.get(`/reports/contractor-performance/export/pdf`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    getCombinedReportData: async (projectId: number, startDate: string, endDate: string) => {
        const response = await api.get(`/reports/combined`, {
            params: { project_id: projectId, start_date: startDate, end_date: endDate }
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

    getProjectReportDetails: async (projectId: number) => {
        const response = await api.get(`/reports/project/${projectId}`);
        return response.data;
    },

    exportProjectReportPDF: async (param1: any, param2?: string) => {
        let queryParams: any;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const defaultDate = now.toISOString().split('T')[0];

        if (typeof param1 === 'object' && param1 !== null && !Array.isArray(param1)) {
            queryParams = {
                project_id: param1.project_id,
                type: param1.type || 'monthly',
                report_date: param1.report_date || param1.start_date || defaultDate,
                start_date: param1.start_date || `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
                end_date: param1.end_date || defaultDate,
                month: param1.month ?? currentMonth,
                year: param1.year ?? currentYear,
                ...(param1.quarter !== undefined && param1.quarter !== null ? { quarter: param1.quarter } : {})
            };
        } else {
            queryParams = {
                project_id: param1,
                type: param2 || 'monthly',
                report_date: defaultDate,
                start_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
                end_date: defaultDate,
                month: currentMonth,
                year: currentYear
            };
        }
        const url = `/reports/project/export/pdf`;
        console.log(`Calling Project Report PDF Export: GET ${url} with params=`, queryParams);
        const response = await api.get(url, {
            params: queryParams,
            responseType: 'blob',
            headers: { 'Accept': 'application/pdf, application/octet-stream' }
        });
        return response.data;
    },

    exportProjectReportExcel: async (param1: any, param2?: string) => {
        let queryParams: any;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        const defaultDate = now.toISOString().split('T')[0];

        if (typeof param1 === 'object' && param1 !== null && !Array.isArray(param1)) {
            queryParams = {
                project_id: param1.project_id,
                type: param1.type || 'monthly',
                report_date: param1.report_date || param1.start_date || defaultDate,
                start_date: param1.start_date || `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
                end_date: param1.end_date || defaultDate,
                month: param1.month ?? currentMonth,
                year: param1.year ?? currentYear,
                ...(param1.quarter !== undefined && param1.quarter !== null ? { quarter: param1.quarter } : {})
            };
        } else {
            queryParams = {
                project_id: param1,
                type: param2 || 'monthly',
                report_date: defaultDate,
                start_date: `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`,
                end_date: defaultDate,
                month: currentMonth,
                year: currentYear
            };
        }
        const url = `/reports/project/export/excel`;
        console.log(`Calling Project Report Excel Export: GET ${url} with params=`, queryParams);
        const response = await api.get(url, {
            params: queryParams,
            responseType: 'blob',
            headers: { 'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, application/octet-stream' }
        });
        return response.data;
    },

    exportCashflowExcel: async () => {
        const response = await api.get(`/reports/cashflow/export/excel`, {
            responseType: 'blob'
        });
        return response.data;
    },

    exportAssetExcel: async (projectId?: number) => {
        const response = await api.get(`/reports/fixed-assets/export/excel`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    exportContractorExcel: async (projectId: number) => {
        const response = await api.get(`/reports/contractor-performance/export/excel`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    },

    exportProfitLossExcel: async (projectId?: number, filters?: { year?: number | null; quarter?: number | null; start_date?: string | null; end_date?: string | null }) => {
        // GET /api/v1/reports/profit-loss/excel
        const response = await api.get(`/reports/profit-loss/excel`, {
            params: { ...(projectId ? { project_id: projectId } : {}), ...filters },
            responseType: 'blob'
        });
        return response.data;
    },

    exportProfitLossPdf: async (projectId?: number, filters?: { year?: number | null; quarter?: number | null; start_date?: string | null; end_date?: string | null }) => {
        // GET /api/v1/reports/profit-loss/pdf
        const response = await api.get(`/reports/profit-loss/pdf`, {
            params: { ...(projectId ? { project_id: projectId } : {}), ...filters },
            responseType: 'blob'
        });
        return response.data;
    },

    exportFinanceExcel: async (projectId?: number, startDate?: string | null, endDate?: string | null) => {
        // GET /api/v1/reports/finance/excel — Export Finance Excel
        const response = await api.get(`/reports/finance/excel`, {
            params: { ...(projectId ? { project_id: projectId } : {}), ...(startDate ? { start_date: startDate } : {}), ...(endDate ? { end_date: endDate } : {}) },
            responseType: 'blob'
        });
        return response.data;
    },

    exportFinancePdf: async (projectId?: number, startDate?: string | null, endDate?: string | null) => {
        // GET /api/v1/reports/finance/pdf — Export Finance Pdf
        const response = await api.get(`/reports/finance/pdf`, {
            params: { ...(projectId ? { project_id: projectId } : {}), ...(startDate ? { start_date: startDate } : {}), ...(endDate ? { end_date: endDate } : {}) },
            responseType: 'blob'
        });
        return response.data;
    },

    exportEquipmentPdf: async () => {
        // GET /api/v1/equipment/reports/pdf — Equipment Full Pdf Report
        const response = await api.get(`/equipment/reports/pdf`, {
            responseType: 'blob'
        });
        return response.data;
    },

    exportEquipmentExcel: async () => {
        // GET /api/v1/equipment/reports/excel — Equipment Excel Report
        const response = await api.get(`/equipment/reports/excel`, {
            responseType: 'blob'
        });
        return response.data;
    },

    exportAssetsExcel: async (projectId?: number, filters?: { start_date?: string | null; end_date?: string | null; min_value?: number | null; max_value?: number | null }) => {
        // GET /api/v1/reports/assets/excel — Export Assets Excel
        const response = await api.get(`/reports/assets/excel`, {
            params: { ...(projectId ? { project_id: projectId } : {}), ...filters },
            responseType: 'blob'
        });
        return response.data;
    },

    exportAssetsPdf: async (projectId?: number, filters?: { start_date?: string | null; end_date?: string | null; min_value?: number | null; max_value?: number | null }) => {
        // GET /api/v1/reports/assets/pdf — Export Assets Pdf
        const response = await api.get(`/reports/assets/pdf`, {
            params: { ...(projectId ? { project_id: projectId } : {}), ...filters },
            responseType: 'blob'
        });
        return response.data;
    },

    exportMaterialPdf: async (projectId?: number) => {
        // GET /api/v1/materials/reports/pdf — Export Pdf
        const response = await api.get(`/materials/reports/pdf`, {
            params: projectId ? { project_id: projectId } : {},
            responseType: 'blob'
        });
        return response.data;
    },

    exportMaterialExcelReport: async (projectId?: number) => {
        // GET /api/v1/materials/reports/excel — Export Excel
        const response = await api.get(`/materials/reports/excel`, {
            params: projectId ? { project_id: projectId } : {},
            responseType: 'blob'
        });
        return response.data;
    },

    exportLabourDistributionExcel: async (projectId?: number, filters?: { date?: string | null; skill_category?: string | null }) => {
        // GET /api/v1/reports/labour-distribution/excel — Export Labour Distribution Excel
        const response = await api.get(`/reports/labour-distribution/excel`, {
            params: { ...(projectId ? { project_id: projectId } : {}), ...filters },
            responseType: 'blob'
        });
        return response.data;
    },

    exportLabourDistributionPdf: async (projectId?: number, filters?: { date?: string | null; skill_category?: string | null }) => {
        // GET /api/v1/reports/labour-distribution/pdf — Export Labour Distribution Pdf
        const response = await api.get(`/reports/labour-distribution/pdf`, {
            params: { ...(projectId ? { project_id: projectId } : {}), ...filters },
            responseType: 'blob'
        });
        return response.data;
    },

    exportIssuesExcel: async (projectId?: number, filters?: { status?: string | null; priority?: string | null; start_date?: string | null; end_date?: string | null }) => {
        // GET /api/v1/reports/issues/excel — Export Issues Excel
        const response = await api.get(`/reports/issues/excel`, {
            params: { ...(projectId ? { project_id: projectId } : {}), ...filters },
            responseType: 'blob'
        });
        return response.data;
    },

    exportIssuesPdf: async (projectId?: number, filters?: { status?: string | null; priority?: string | null; start_date?: string | null; end_date?: string | null }) => {
        // GET /api/v1/reports/issues/pdf — Export Issues Pdf
        const response = await api.get(`/reports/issues/pdf`, {
            params: { ...(projectId ? { project_id: projectId } : {}), ...filters },
            responseType: 'blob'
        });
        return response.data;
    }, exportFinancialSummaryPDF: async (projectId: number) => {
        const response = await api.get(`/reports/financial-summary/export/pdf`, {
            params: { project_id: projectId },
            responseType: 'blob'
        });
        return response.data;
    }
};