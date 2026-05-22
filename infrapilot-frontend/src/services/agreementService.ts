import api from "./api";
import type { Agreement, AgreementCreate, AgreementStats } from "../types/agreement";

export const agreementService = {
    /**
     * List all agreements with optional filters
     * GET /api/v1/agreements/
     */
    async listAgreements(filters: { search?: string; owner_id?: number; project_id?: number } = {}): Promise<Agreement[]> {
        try {
            const response = await api.get("/agreements/", { params: filters });
            return response.data;
        } catch (error: any) {
            console.error("List Agreements API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Upload a new agreement
     * POST /api/v1/agreements/
     */
    async uploadAgreement(data: AgreementCreate): Promise<Agreement> {
        try {
            const formData = new FormData();
            formData.append("owner_id", data.owner_id.toString());
            formData.append("project_id", data.project_id.toString());
            formData.append("type", data.type);
            formData.append("file", data.file);

            const response = await api.post("/agreements/", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error: any) {
            console.error("Upload Agreement API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get agreement statistics
     * GET /api/v1/agreements/stats
     */
    async getAgreementStats(): Promise<AgreementStats> {
        try {
            const response = await api.get("/agreements/stats");
            return response.data;
        } catch (error: any) {
            console.error("Get Agreement Stats API Error:", error.response?.data || error.message);
            throw error;
        }
    },
};
