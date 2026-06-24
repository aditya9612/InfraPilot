import api from "./api";
import type { Quotation, QuotationCreateData } from "../types/quotation";

export const quotationService = {
    /**
     * Get all quotations
     * GET /api/v1/quotations/
     */
    async getQuotations(limit: number = 100, offset: number = 0): Promise<Quotation[]> {
        try {
            const response = await api.get("/quotations/", {
                params: { limit, offset }
            });
            return Array.isArray(response.data) ? response.data : (response.data.items || []);
        } catch (error: any) {
            console.error("Get Quotations Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get quotation by ID
     * GET /api/v1/quotations/{id}
     */
    async getQuotationById(id: number): Promise<Quotation> {
        try {
            const response = await api.get(`/quotations/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Get Quotation ${id} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Preview a quotation with all nested items
     * GET /api/v1/quotations/{id}/preview
     */
    async getQuotationPreview(id: number): Promise<Quotation> {
        try {
            const response = await api.get(`/quotations/${id}/preview`);
            return response.data;
        } catch (error: any) {
            console.error(`Get Quotation Preview ${id} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Update an existing quotation
     * PUT /api/v1/quotations/{id}
     */
    async updateQuotation(id: number, data: Partial<QuotationCreateData>): Promise<Quotation> {
        try {
            const response = await api.put(`/quotations/${id}`, data);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    (error.response?.data?.message || error.message));

            console.error(`Update Quotation ${id} Error:`, error.response?.data || error.message);
            throw new Error(message);
        }
    },

    /**
     * Add Item to existing quotation
     * POST /api/v1/quotations/{quotation_id}/items
     */
    async addQuotationItem(quotationId: number, data: any): Promise<any> {
        try {
            const response = await api.post(`/quotations/${quotationId}/items`, data);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    (error.response?.data?.message || error.message));

            console.error(`Add Quotation ${quotationId} Item Error:`, error.response?.data || error.message);
            throw new Error(message);
        }
    },

    /**
     * Update Item of an existing quotation
     * PUT /api/v1/quotations/quotation-items/{item_id}
     */
    async updateQuotationItem(itemId: number, data: any): Promise<any> {
        try {
            const response = await api.put(`/quotations/quotation-items/${itemId}`, data);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    (error.response?.data?.message || error.message));

            console.error(`Update Quotation Item ${itemId} Error:`, error.response?.data || error.message);
            throw new Error(message);
        }
    },

    /**
     * Delete Item from an existing quotation
     * DELETE /api/v1/quotations/quotation-items/{item_id}
     */
    async deleteQuotationItem(itemId: number): Promise<void> {
        try {
            await api.delete(`/quotations/quotation-items/${itemId}`);
        } catch (error: any) {
            console.error(`Delete Quotation Item ${itemId} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Create a new quotation
     * POST /api/v1/quotations/
     */
    async createQuotation(data: QuotationCreateData): Promise<Quotation> {
        try {
            const response = await api.post("/quotations/", data);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    (error.response?.data?.message || error.message));

            console.error("Create Quotation Error:", error.response?.data || error.message);
            throw new Error(message);
        }
    },

    /**
     * Delete a quotation
     * DELETE /api/v1/quotations/{id}
     */
    async deleteQuotation(id: number): Promise<void> {
        try {
            await api.delete(`/quotations/${id}`);
        } catch (error: any) {
            console.error(`Delete Quotation ${id} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Approve a quotation
     * PUT /api/v1/quotations/{id}/approve
     */
    async approveQuotation(id: number, message?: string): Promise<any> {
        try {
            const response = await api.put(`/quotations/${id}/approve`, { message: message || "Quotation approved", reason: message || "Quotation approved" });
            return response.data;
        } catch (error: any) {
            console.error(`Approve Quotation ${id} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Reject a quotation
     * PUT /api/v1/quotations/{id}/reject
     */
    async rejectQuotation(id: number, reason?: string): Promise<any> {
        try {
            const response = await api.put(`/quotations/${id}/reject`, { reason: reason || "Quotation rejected" });
            return response.data;
        } catch (error: any) {
            console.error(`Reject Quotation ${id} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Convert quotation to bill
     * POST /api/v1/quotations/{id}/convert-to-bill
     */
    async convertToBill(id: number, projectId: number, contractorId: number): Promise<any> {
        try {
            const response = await api.post(`/quotations/${id}/convert-to-bill`, { quotation_id: id }, {
                params: { project_id: projectId, contractor_id: contractorId }
            });
            return response.data;
        } catch (error: any) {
            console.error(`Convert to Bill ${id} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Convert quotation to invoice
     * POST /api/v1/quotations/{id}/convert-to-invoice
     */
    async convertToInvoice(id: number, projectId: number, contractorId: number): Promise<any> {
        try {
            const response = await api.post(`/quotations/${id}/convert-to-invoice`, { 
                quotation_id: id,
                project_id: projectId,
                contractor_id: contractorId
            });
            return response.data;
        } catch (error: any) {
            console.error(`Convert to Invoice ${id} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Convert quotation to work order
     * POST /api/v1/quotations/{id}/convert-to-work-order
     */
    async convertToWorkOrder(id: number, projectId: number, contractorId: number): Promise<any> {
        try {
            const response = await api.post(`/quotations/${id}/convert-to-work-order`, {
                quotation_id: id,
                project_id: projectId,
                contractor_id: contractorId
            });
            return response.data;
        } catch (error: any) {
            console.error(`Convert to Work Order Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Convert Quotation To Project
     * POST /api/v1/quotations/{id}/convert-to-project
     */
    async convertToProject(id: number, data: any): Promise<any> {
        try {
            const response = await api.post(`/quotations/${id}/convert-to-project`, data);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    (error.response?.data?.message || error.message));

            console.error(`Convert to Project Error:`, error.response?.data || error.message);
            throw new Error(message);
        }
    },

    /**
     * Add Labour Item to existing quotation
     * POST /api/v1/quotations/{quotation_id}/labour
     */
    async addLabourItem(quotationId: number, data: any): Promise<any> {
        try {
            const response = await api.post(`/quotations/${quotationId}/labour`, data);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    (error.response?.data?.message || error.message));

            console.error(`Add Quotation ${quotationId} Labour Item Error:`, error.response?.data || error.message);
            throw new Error(message);
        }
    },

    /**
     * Update Labour Item of an existing quotation
     * PUT /api/v1/quotations/labour/{labour_item_id}
     */
    async updateLabourItem(itemId: number, data: any): Promise<any> {
        try {
            const response = await api.put(`/quotations/labour/${itemId}`, data);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    (error.response?.data?.message || error.message));

            console.error(`Update Quotation Labour Item ${itemId} Error:`, error.response?.data || error.message);
            throw new Error(message);
        }
    },

    /**
     * Delete Labour Item from an existing quotation
     * DELETE /api/v1/quotations/labour/{labour_item_id}
     */
    async deleteLabourItem(itemId: number): Promise<void> {
        try {
            await api.delete(`/api/v1/quotations/labour/${itemId}`);
        } catch (error: any) {
            console.error(`Delete Quotation Labour Item ${itemId} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Add Material Item to existing quotation
     * POST /api/v1/quotations/{quotation_id}/materials
     */
    async addMaterialItem(quotationId: number, data: any): Promise<any> {
        try {
            const response = await api.post(`/quotations/${quotationId}/materials`, data);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    (error.response?.data?.message || error.message));

            console.error(`Add Quotation ${quotationId} Material Item Error:`, error.response?.data || error.message);
            throw new Error(message);
        }
    },

    /**
     * Update Material Item of an existing quotation
     * PUT /api/v1/quotations/quotation-materials/{material_item_id}
     */
    async updateMaterialItem(itemId: number, data: any): Promise<any> {
        try {
            const response = await api.put(`/quotations/quotation-materials/${itemId}`, data);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    (error.response?.data?.message || error.message));

            console.error(`Update Quotation Material Item ${itemId} Error:`, error.response?.data || error.message);
            throw new Error(message);
        }
    },

    /**
     * Delete Material Item from an existing quotation
     * DELETE /api/v1/quotations/quotation-materials/{material_item_id}
     */
    async deleteMaterialItem(itemId: number): Promise<void> {
        try {
            await api.delete(`/quotations/quotation-materials/${itemId}`);
        } catch (error: any) {
            console.error(`Delete Quotation Material Item ${itemId} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Add Extra Charge to existing quotation
     * POST /api/v1/quotations/{quotation_id}/extra-charges
     */
    async addExtraCharge(quotationId: number, data: any): Promise<any> {
        try {
            const response = await api.post(`/quotations/${quotationId}/extra-charges`, data);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    (error.response?.data?.message || error.message));

            console.error(`Add Quotation ${quotationId} Extra Charge Error:`, error.response?.data || error.message);
            throw new Error(message);
        }
    },

    /**
     * Update Extra Charge of an existing quotation
     * PUT /api/v1/quotations/quotation-extra-charges/{extra_charge_id}
     */
    async updateExtraCharge(itemId: number, data: any): Promise<any> {
        try {
            const response = await api.put(`/quotations/quotation-extra-charges/${itemId}`, data);
            return response.data;
        } catch (error: any) {
            const detail = error.response?.data?.detail;
            const message = typeof detail === 'string' ? detail :
                (Array.isArray(detail) ? detail.map(d => d.msg).join(', ') :
                    (error.response?.data?.message || error.message));

            console.error(`Update Quotation Extra Charge ${itemId} Error:`, error.response?.data || error.message);
            throw new Error(message);
        }
    },

    /**
     * Delete Extra Charge from an existing quotation
     * DELETE /api/v1/quotations/quotation-extra-charges/{extra_charge_id}
     */
    async deleteExtraCharge(itemId: number): Promise<void> {
        try {
            await api.delete(`/quotations/quotation-extra-charges/${itemId}`);
        } catch (error: any) {
            console.error(`Delete Quotation Extra Charge ${itemId} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Download Quotation PDF from backend
     * GET /api/v1/quotations/{id}/pdf
     */
    async downloadQuotationPDF(id: number): Promise<Blob> {
        try {
            const response = await api.get(`/quotations/${id}/pdf`, {
                responseType: 'blob'
            });
            return response.data;
        } catch (error: any) {
            console.error(`Download Quotation PDF ${id} Error:`, error.response?.data || error.message);
            throw error;
        }
    }
};
