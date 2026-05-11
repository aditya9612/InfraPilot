import type { 
  Material, 
  Supplier, 
  PurchaseOrder, 
  Transfer, 
  InventoryLog, 
  InventorySummary 
} from "../../../types/material";

export const mockSuppliers: Supplier[] = [
  {
    id: 1,
    name: "Mahalaxmi Steel",
    contact: "9876543210",
    contactPerson: "Rajesh Shah",
    phone: "9876543210",
    email: "rajesh@mahalaxmi.com",
    gst: "27AAAAA0000A1Z5",
    address: "Bhosari MIDC, Pune"
  },
  {
    id: 2,
    name: "UltraTech Cement Ltd",
    contact: "8888888888",
    contactPerson: "Suresh Kumar",
    phone: "8888888888",
    email: "suresh@ultratech.com",
    gst: "27BBBBB1111B1Z5",
    address: "Mumbai High"
  }
];

export const mockInventory: Material[] = [
  {
    id: 1,
    material_code: "MAT-101",
    project_id: 1,
    material_name: "TMT Steel 12mm",
    category: "Steel",
    unit: "MT",
    supplier_id: 1,
    supplier_name: "Mahalaxmi Steel",
    purchase_rate: 65000,
    rate_type: "Standard",
    quantity_purchased: 50,
    quantity_used: 20,
    remaining_stock: 30,
    total_amount: 3250000,
    payment_given: 2000000,
    payment_pending: 1250000,
    extra_paid: 0,
    minimum_stock_level: 10,
    alert_type: "IN_STOCK"
  },
  {
    id: 2,
    material_code: "MAT-102",
    project_id: 1,
    material_name: "OPC Cement",
    category: "Cement",
    unit: "Bags",
    supplier_id: 2,
    supplier_name: "UltraTech Cement Ltd",
    purchase_rate: 450,
    rate_type: "Standard",
    quantity_purchased: 1000,
    quantity_used: 950,
    remaining_stock: 50,
    total_amount: 450000,
    payment_given: 400000,
    payment_pending: 50000,
    extra_paid: 0,
    minimum_stock_level: 100,
    alert_type: "LOW_STOCK"
  }
];

export const mockProjects = [
  { id: 1, name: "Site A - City Center Complex" },
  { id: 2, name: "Site B - Riverside Apartments" }
];

export const mockPOs: PurchaseOrder[] = [
  {
    id: 1,
    material_id: 1,
    supplier_id: 1,
    project_id: 1,
    material_name: "TMT Steel 12mm",
    quantity: 10,
    rate: 65000,
    total_amount: 650000,
    status: "COMPLETED"
  }
];

export const mockTransfers: Transfer[] = [
  {
    id: 1,
    material: { id: 1, name: "TMT Steel 12mm" },
    from_project: { id: 1, name: "Site A" },
    to_project: { id: 2, name: "Site B" },
    quantity: 5,
    status: "COMPLETED",
    created_at: "2024-03-20"
  }
];

export const mockLogs: InventoryLog[] = [
  {
    id: 1,
    material_id: 1,
    type: "PURCHASE",
    quantity: 50,
    rate: 65000,
    avg_rate: 65000,
    total_amount: 3250000,
    amount_paid: 2000000,
    payment_pending: 1250000,
    issue_type: "SYSTEM",
    project_id: 1,
    created_at: "2024-03-01 10:00:00"
  }
];

export const mockSummary: InventorySummary = {
  total_materials: 2,
  total_stock_value: 3700000,
  total_pending_payments: 1300000
};
