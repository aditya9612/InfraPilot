import api from "./api";
import type { InventoryResponse } from "../types/inventory";

export const inventoryService = {
    /**
     * Get Live Stock
     * GET /api/v1/inventory/stock
     */
    async getStock(params?: any): Promise<InventoryResponse> {
        try {
            const response = await api.get("/inventory/stock", { params });
            return response.data;
        } catch (error: any) {
            console.error("Get Inventory Stock API Error:", error.response?.data || error.message);
            throw error;
        }
    }
};

export default inventoryService;
