import api from "./api";

export interface MasterEntity {
    id: number;
    name: string;
    unique_code: string;
    category: string;
    system_tag?: string;
    unit?: string | null;
}

export interface MasterStats {
    total_materials: number;
    total_labour_types: number;
    total_activity_types: number;
    total_units: number;
}

export const masterService = {
    /**
     * Get overall master data statistics
     * GET /api/v1/master/stats
     */
    async getMasterStats(): Promise<MasterStats> {
        try {
            const response = await api.get("/master/stats");
            return response.data;
        } catch (error: any) {
            console.error("Get Master Stats Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get all master data with search and optional tag filter
     * GET /api/v1/master/all
     */
    async getAllMasterData(search: string = "", tag: string = ""): Promise<MasterEntity[]> {
        try {
            const response = await api.get("/master/all", {
                params: { search, tag }
            });
            return response.data;
        } catch (error: any) {
            console.error("Get All Master Data Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get entities for a specific master category
     * GET /api/v1/master/{entity}
     */
    async getEntities(entity: "units" | "labour-types" | "activity-types" | "materials"): Promise<MasterEntity[]> {
        try {
            const response = await api.get(`/master/${entity}`);
            return response.data;
        } catch (error: any) {
            console.error(`Get ${entity} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Create a new master entity
     * POST /api/v1/master/{entity}
     */
    async createEntity(entity: "units" | "labour-types" | "activity-types" | "materials", data: Partial<MasterEntity>): Promise<MasterEntity> {
        try {
            const response = await api.post(`/master/${entity}`, data);
            return response.data;
        } catch (error: any) {
            console.error(`Create ${entity} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Update an existing master entity
     * PUT /api/v1/master/{entity}/{id}
     */
    async updateEntity(entity: string, id: number, data: Partial<MasterEntity>): Promise<{ message: string }> {
        try {
            const response = await api.put(`/master/${entity.toLowerCase()}/${id}`, data);
            return response.data;
        } catch (error: any) {
            console.error(`Update ${entity} ${id} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Delete a master entity
     * DELETE /api/v1/master/{entity}/{id}
     */
    async deleteEntity(entity: string, id: number): Promise<{ message: string }> {
        try {
            const response = await api.delete(`/master/${entity.toLowerCase()}/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Delete ${entity} ${id} Error:`, error.response?.data || error.message);
            throw error;
        }
    }
};
