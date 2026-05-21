export interface MaterialStock {
    id: number;
    material_name: string;
    category: string;
    current_stock: number;
    unit: string;
    min_stock_level: number;
    last_updated: string;
    status: "Available" | "Low Stock" | "Out of Stock";
}

export interface InventoryResponse {
    items: MaterialStock[];
    meta?: {
        total: number;
        limit: number;
        offset: number;
    };
}
