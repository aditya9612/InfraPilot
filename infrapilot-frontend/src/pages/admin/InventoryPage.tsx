import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";

import SupplierModal from "../../components/inventory/SupplierModal";
import TransferMaterialModal from "../../components/inventory/TransferMaterialModal";
import AddMaterialModal from "../../components/inventory/AddMaterialModal";
import PurchaseActionModal from "../../components/inventory/PurchaseActionModal";
import MaterialCostReportModal from "../../components/inventory/MaterialCostReportModal";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import SortDropdown from "../../components/common/SortDropdown";
import { materialService } from "../../services/materialService";
import { projectService } from "../../services/projectService";
import {
  PlusCircle,
  FileText,
  History,
  ShoppingCart,
  Truck,
  LayoutDashboard,
} from "lucide-react";
import type {
  Material,
  Supplier,
  PurchaseOrder,
  Transfer,
  InventoryLog,
  InventorySummary,
} from "../../types/material";

// New modular components
import InventoryTable from "../../components/admin/inventory/InventoryTable";
import SupplierTable from "../../components/admin/inventory/SupplierTable";
import PurchaseOrderTable from "../../components/admin/inventory/PurchaseOrderTable";
import TransferTable from "../../components/admin/inventory/TransferTable";
import ViewTransferModal from "../../components/admin/inventory/ViewTransferModal";
import InventoryLogsTable from "../../components/admin/inventory/InventoryLogsTable";
import EditPOModal from "../../components/admin/inventory/EditPOModal";
import CreatePOModal from "../../components/admin/inventory/CreatePOModal";

interface Project {
  id: number;
  name: string;
}

const InventoryPage = () => {
  console.log("InventoryPage Rendered");
  const location = useLocation();
  const isMaster =
    location.pathname.includes("/master") ||
    location.pathname === "/admin/inventory";

  const [inventory, setInventory] = useState<Material[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [masterMaterials, setMasterMaterials] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "overview" | "inventory" | "suppliers" | "pos" | "transfers" | "logs"
  >(isMaster ? "suppliers" : "overview");
  const [searchTerm, setSearchTerm] = useState("");

  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [supplierApiErrors, setSupplierApiErrors] = useState<Record<string, string>>({});
  const [supplierPage, setSupplierPage] = useState(0);
  const [logsPage, setLogsPage] = useState(0);
  const [materialPage, setMaterialPage] = useState(0);
  const [poPage, setPoPage] = useState(0);
  const [transferPage, setTransferPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const PAGE_SIZE = 10;
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isMaterialFormOpen, setMaterialFormOpen] = useState(false);
  const [materialApiErrors, setMaterialApiErrors] = useState<Record<string, string>>({});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCreatePOModalOpen, setIsCreatePOModalOpen] = useState(false);

  const [purchaseActionConfig, setPurchaseActionConfig] = useState<{
    isOpen: boolean;
    type: "purchase" | "usage";
    material: any | null;
  }>({
    isOpen: false,
    type: "purchase", // Default
    material: null,
  });

  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [isEditPOModalOpen, setIsEditPOModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [projectMap, setProjectMap] = useState<Record<number, string>>({});
  const [itemToDelete, setItemToDelete] = useState<{
    id: any;
    type: "material" | "supplier" | "po";
  } | null>(null);

  const [logProjectId, setLogProjectId] = useState<number | "all">("all");
  const [logType, setLogType] = useState<string>("all");
  const [isLogsRefreshing, setIsLogsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [invData, supData, poData, transferData, summaryData, logsData, allMaterials, projectsResponse] = await Promise.all([
        materialService.listMaterials(),
        materialService.getSuppliers(),
        materialService.listPurchaseOrders(),
        materialService.listTransfers(),
        materialService.getMaterialSummary(),
        materialService.getLogs({}),
        materialService.listMaterials(), // Fetch all for PO creation
        projectService.getProjects(100) // Correct method name
      ]);

      setInventory(invData);
      setMasterMaterials(allMaterials);
      setSuppliers(supData);
      setPos(Array.isArray(poData) ? poData : []);
      const transferItems = Array.isArray(transferData) ? transferData : (transferData?.data || []);
      setTransfers(transferItems);
      setSummary(summaryData);
      setLogs(Array.isArray(logsData) ? logsData : []);

      // Update projects
      const projects = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse.items || projectsResponse.data || []);
      setProjectList(projects);
      const map: Record<number, string> = {};
      projects.forEach((p: any) => {
        map[p.id] = p.name || p.project_name;
      });
      setProjectMap(map);
    } catch (error) {
      console.error("Failed to fetch inventory data:", error);
      toast.error("Failed to sync inventory data. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (isMaster) {
      if (activeTab === "overview" || activeTab === "inventory")
        setActiveTab("suppliers");
    }
  }, [isMaster]);

  // Filters
  const filteredInventory = inventory.filter(
    (i) =>
      (i.material_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (i.supplier_name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      (s.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactPerson || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contact || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.gst || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.address || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedInventory = useMemo(() => {
    return [...filteredInventory].sort((a, b) => {
      return sortOrder === "latest" ? b.id - a.id : a.id - b.id;
    });
  }, [filteredInventory, sortOrder]);

  const sortedSuppliers = useMemo(() => {
    return [...filteredSuppliers].sort((a, b) => {
      return sortOrder === "latest" ? b.id - a.id : a.id - b.id;
    });
  }, [filteredSuppliers, sortOrder]);

  const sortedPOs = useMemo(() => {
    const filtered = pos.filter((p) =>
      p.material_name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return [...filtered].sort((a, b) => {
      return sortOrder === "latest" ? b.id - a.id : a.id - b.id;
    });
  }, [pos, searchTerm, sortOrder]);

  const sortedTransfers = useMemo(() => {
    return [...transfers].sort((a, b) => {
      return sortOrder === "latest" ? b.id - a.id : a.id - b.id;
    });
  }, [transfers, sortOrder]);

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const aTime = new Date(a.created_at || 0).getTime();
      const bTime = new Date(b.created_at || 0).getTime();
      return sortOrder === "latest" ? bTime - aTime : aTime - bTime;
    });
  }, [logs, sortOrder]);

  const refreshLogs = async () => {
    setIsLogsRefreshing(true);
    try {
      const params: any = {};
      if (logProjectId !== "all") params.project_id = logProjectId;
      if (logType !== "all") params.type = logType;

      const logsData = await materialService.getLogs(params);
      setLogs(Array.isArray(logsData) ? logsData : []);
      setLogsPage(0);
    } catch (error) {
      console.error("Failed to refresh logs:", error);
      toast.error("Failed to filter logs");
    } finally {
      setIsLogsRefreshing(false);
    }
  };

  useEffect(() => {
    if (activeTab === "logs") {
      refreshLogs();
    }
  }, [logProjectId, logType, activeTab]);

  // Handlers
  const handleSupplierSubmit = async (data: any) => {
    setSupplierApiErrors({});
    try {
      const payload = {
        supplier_name: data.name,
        contact_person: data.contactPerson,
        phone_email: data.phone || data.email ? `${data.phone || ""} ${data.email || ""}`.trim() : "",
        gst_number: data.gst,
        address: data.address,
      };
      if (selectedSupplier) {
        const updated = await materialService.updateSupplier(selectedSupplier.id, payload);
        setSuppliers((prev) =>
          prev.map((s) => s.id === selectedSupplier.id ? { ...s, ...updated } : s)
        );
        toast.success("Supplier updated successfully!");
      } else {
        const newSupplier = await materialService.createSupplier(payload);
        setSuppliers((prev) => [...prev, newSupplier]);
        toast.success("Supplier added successfully!");
      }
      setSupplierModalOpen(false);
      setSelectedSupplier(null);
    } catch (error: any) {
      // Parse backend validation error and highlight the field
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        const fieldErrors: Record<string, string> = {};
        detail.forEach((err: any) => {
          const field = err?.loc?.[err.loc.length - 1];
          if (field === 'gst_number') fieldErrors.gst = err.msg || "Invalid GST number format";
          else if (field) fieldErrors[field] = err.msg;
        });
        if (Object.keys(fieldErrors).length > 0) {
          setSupplierApiErrors(fieldErrors);
          return; // Keep modal open to show errors
        }
      }
      toast.error(typeof detail === 'string' ? detail : "Failed to save supplier");
    }
  };

  const handleCreatePOSubmit = async (data: any) => {
    try {
      const newPO = await materialService.createPurchaseOrder(data);
      setPos((prev) => [newPO, ...prev]);
      toast.success("Purchase Order issued successfully!");

      // Refresh summary as this might affect financial data
      const newSummary = await materialService.getMaterialSummary();
      setSummary(newSummary);
    } catch (error) {
      console.error("Failed to create PO:", error);
      toast.error("Failed to issue Purchase Order. Please check your data.");
    }
  };

  const handleCreateOrUpdateMaterial = async (data: any) => {
    try {
      if (selectedMaterial) {
        const supplier = suppliers.find(s => s.name === data.supplier_name);
        // Note: some backend APIs don't take all fields in put request, so we pick the relevant ones
        const payload = {
          ...data,
          supplier_id: supplier?.id || selectedMaterial.supplier_id,
        };
        const updatedMaterial = await materialService.updateMaterial(selectedMaterial.id, payload);

        setInventory((prev) =>
          prev.map((m) =>
            m.id === selectedMaterial.id ? { ...m, ...updatedMaterial } : m,
          ),
        );
        toast.success("Material updated successfully!");
      } else {
        const supplier = suppliers.find(s =>
          s.name === data.supplier_name ||
          s.contactPerson === data.supplier_name
        );

        // Strict payload construction based on user provided API spec
        const payload = {
          project_id: Number(data.project_id || 1),
          material_name: data.material_name,
          category: data.category,
          unit: data.unit,
          supplier_id: supplier?.id || 0,
          purchase_rate: Number(data.purchase_rate),
          rate_type: data.rate_type || "FIXED",
          quantity_purchased: Number(data.quantity_purchased),
          payment_given: Number(data.payment_given || 0),
          minimum_stock_level: Number(data.minimum_stock_level || 200)
        };

        const createdMaterial = await materialService.createMaterial(payload as any);

        // Ensure the UI has all necessary fields
        const newMaterial: Material = {
          ...createdMaterial,
          supplier_name: data.supplier_name,
          alert_type: (createdMaterial as any).alert_type || "IN_STOCK"
        };

        setInventory((prev) => [...prev, newMaterial]);
        toast.success("Material created successfully!");
      }
      setMaterialFormOpen(false);
      setMaterialApiErrors({});
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      if (Array.isArray(detail)) {
        const fieldErrors: Record<string, string> = {};
        detail.forEach((err: any) => {
          const field = err?.loc?.[err.loc.length - 1];
          if (field) fieldErrors[field] = err.msg;
        });
        setMaterialApiErrors(fieldErrors);
      } else if (typeof detail === "string") {
        if (detail.toLowerCase().includes("already exists")) {
          setMaterialApiErrors({ material_name: detail });
        } else {
          toast.error(detail);
        }
      } else {
        toast.error("Failed to save material");
      }
    }
  };

  const handlePurchaseAction = async (data: any) => {
    try {
      const material = purchaseActionConfig.material;
      if (data.actionType === "usage") {
        const payload = {
          quantity: data.quantity,
          project_id: data.project_id || material.project_id,
          task_id: data.task_id || 0,
          issue_type: data.issue_type || "SITE"
        };
        const updatedMaterial = await materialService.recordUsage(material.id, payload);

        setInventory((prev) =>
          prev.map((m) =>
            m.id === material.id ? { ...m, ...updatedMaterial } : m
          ),
        );
        toast.success("Usage logged successfully!");

        // Refresh logs to get the new transaction
        const newLogs = await materialService.getLogs({});
        setLogs(Array.isArray(newLogs) ? newLogs : []);
      } else {
        const payload = {
          quantity: data.quantity,
          rate: Number(data.rate) || material.purchase_rate || 0,
          amount_paid: data.payment,
          project_id: data.project_id || material.project_id,
          issue_type: data.issue_type || "PURCHASE"
        };
        const updatedMaterial = await materialService.recordPurchase(material.id, payload);

        // Also create a formal PO record so it appears in the "Orders" tab
        try {
          await materialService.createPurchaseOrder({
            supplier_id: Number(data.supplier_id) || material.supplier_id,
            project_id: payload.project_id,
            material_id: material.id,
            quantity: payload.quantity,
            rate: payload.rate
          });
        } catch (poError) {
          console.error("Failed to create background PO:", poError);
          // We don't fail the whole action if the background PO fails, 
          // as the material purchase itself succeeded.
        }

        setInventory((prev) =>
          prev.map((m) =>
            m.id === material.id ? { ...m, ...updatedMaterial } : m
          ),
        );
        toast.success("Purchase added successfully!");

        // Refresh logs to get the new transaction
        const newLogs = await materialService.getLogs({});
        setLogs(Array.isArray(newLogs) ? newLogs : []);
      }

      // Refresh POs to show the new order entry
      const newPOs = await materialService.listPurchaseOrders();
      setPos(Array.isArray(newPOs) ? newPOs : []);

      // Update summary
      const newSummary = await materialService.getMaterialSummary();
      setSummary(newSummary);

      setPurchaseActionConfig({
        isOpen: false,
        type: "purchase", // Default
        material: null,
      });
    } catch (error) {
      console.error(error);
      toast.error("Failed to log action");
    }
  };

  const handleTransferSubmit = async (data: any) => {
    try {
      const materialId = Number(data.materialId || data.material_id);
      const fromProjectId = Number(data.fromProjectId || data.from_project_id);
      const toProjectId = Number(data.toProjectId || data.to_project_id);
      const quantity = Number(data.quantity);

      const material = inventory.find(i => i.id === materialId);
      if (!material) {
        toast.error("Material not found in inventory");
        return;
      }

      setInventory((prev) =>
        prev.map((m) =>
          m.id === materialId
            ? { ...m, remaining_stock: m.remaining_stock - quantity }
            : m,
        ),
      );

      const newTransfer = await materialService.createTransfer({
        material_id: material.id,
        from_project_id: fromProjectId,
        to_project_id: toProjectId,
        quantity: quantity
      });

      setTransfers((prev) => [newTransfer, ...prev]);

      setTransferModalOpen(false);
      toast.success("Material transfer recorded!");
    } catch (error) {
      toast.error("Failed to transfer material");
    }
  };

  const handleDeleteClick = (id: any, type: "material" | "supplier" | "po") => {
    setItemToDelete({ id, type });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "material") {
        await materialService.deleteMaterial(itemToDelete.id);
        setInventory((prev) => prev.filter((m) => m.id !== itemToDelete.id));
        toast.success("Material deleted successfully!");
      } else if (itemToDelete.type === "po") {
        await materialService.deletePurchaseOrder(itemToDelete.id);
        setPos((prev) => prev.filter((p) => p.id !== itemToDelete.id));
        toast.success("Purchase Order deleted successfully!");
      } else {
        await materialService.deleteSupplier(itemToDelete.id);
        setSuppliers((prev) => prev.filter((s) => s.id !== itemToDelete.id));
        toast.success("Supplier deleted successfully!");
      }
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  // Remove local calculate, rely on API summary for stat cards

  return (
    <>
      <Navbar
        title="Material & Inventory Management"
        breadcrumb={[
          "Admin",
          "Materials",
          isMaster ? "Master Data" : "Inventory Registry",
        ]}
      />

      <PageTransition
        key={location.pathname}
        className="p-6 bg-slate-50 min-h-screen pb-24 font-inter"
      >
        {/* Header Options */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            {isMaster ? (
              <>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Supplier Database
                </h1>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  Manage all your material suppliers and strategic contacts.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Project Site Inventory
                </h1>
                <p className="text-slate-500 text-sm font-medium mt-1">
                  Track and secure inventory across multiple project sites.
                </p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
              {[
                { id: "overview", label: "Overview", icon: LayoutDashboard },
                { id: "inventory", label: "Inventory", icon: FileText },
                { id: "suppliers", label: "Suppliers", icon: Truck },
                { id: "pos", label: "Orders", icon: ShoppingCart },
                { id: "transfers", label: "Transfers", icon: Truck },
                { id: "logs", label: "Logs", icon: History },
              ]
                .filter(
                  (tab) =>
                    !isMaster || tab.id === "suppliers" || tab.id === "logs",
                )
                .map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id as any);
                      setSupplierPage(0);
                      setLogsPage(0);
                      setMaterialPage(0);
                      setPoPage(0);
                      setTransferPage(0);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id
                      ? "bg-primary text-white shadow-md shadow-primary/20"
                      : "text-slate-500 hover:bg-slate-50"
                      }`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
            </div>

            {activeTab === "inventory" && (
              <>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Cost Report
                </button>
                <button
                  onClick={() => setTransferModalOpen(true)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" />
                  Transfer
                </button>
                <button
                  onClick={() => {
                    setSelectedMaterial(null);
                    setMaterialFormOpen(true);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Material
                </button>
              </>
            )}

            {activeTab === "suppliers" && (
              <button
                onClick={() => {
                  setSelectedSupplier(null);
                  setSupplierModalOpen(true);
                }}
                className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
              >
                + Add Supplier
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Content based on Tab */}
        {activeTab === "overview" && (
          <div className="flex flex-col gap-6 mb-8">
            {/* LOW STOCK ALERT BANNER */}
            {inventory.filter((m) => m.remaining_stock < m.minimum_stock_level)
              .length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                    <span className="text-rose-500 font-bold text-xl block animate-pulse">
                      ⚠️
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-rose-800 text-sm">
                      Critical Inventory Alert
                    </h3>
                    <p className="text-rose-600 text-xs mt-0.5 mb-2 font-medium">
                      The following items have dropped below their minimum
                      threshold and require immediate procurement:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {inventory
                        .filter((m) => m.remaining_stock < m.minimum_stock_level)
                        .map((lowItem) => (
                          <span
                            key={lowItem.id}
                            className="bg-white border border-rose-200 text-rose-700 px-3 py-1 rounded-lg text-xs font-bold shadow-sm"
                          >
                            {lowItem.material_name}{" "}
                            <span className="text-rose-400 font-normal ml-1">
                              ({lowItem.remaining_stock} left @{" "}
                              {projectMap[lowItem.project_id] || "Unknown Site"})
                            </span>
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
              )}

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatCard
                title="Total Stock Valuation"
                value={`₹${(summary?.total_stock_value || 0).toLocaleString()}`}
                sub="Across all sites"
                accent="text-emerald-500"
              />
              <StatCard
                title="Total Materials"
                value={(summary?.total_materials || 0).toLocaleString()}
                sub="Active catalog items"
                accent="text-primary"
              />
              <StatCard
                title="Pending Payments"
                value={`₹${(summary?.total_pending_payments || 0).toLocaleString()}`}
                sub="Supplier payables"
                accent="text-rose-500"
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible min-h-[500px]">
          <div className="p-4 border-b border-slate-50">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </span>
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setMaterialPage(0);
                    setSupplierPage(0);
                    setLogsPage(0);
                    setPoPage(0);
                    setTransferPage(0);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <SortDropdown value={sortOrder} onChange={setSortOrder} />

              {activeTab === "logs" && (
                <div className="flex items-center gap-2">
                  <select
                    value={logProjectId}
                    onChange={(e) => setLogProjectId(e.target.value === "all" ? "all" : Number(e.target.value))}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    <option value="all">All Projects</option>
                    {projectList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    <option value="all">All Action Types</option>
                    <option value="PURCHASE">Purchase</option>
                    <option value="USAGE">Usage</option>
                    <option value="TRANSFER_IN">Transfer In</option>
                    <option value="TRANSFER_OUT">Transfer Out</option>
                    <option value="ADJUSTMENT">Adjustment</option>
                    <option value="ISSUE">Issue</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto min-h-[300px]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-bold text-slate-400 animate-pulse">
                  Synchronizing inventory data...
                </p>
              </div>
            ) : (
              <>
                {(activeTab === "inventory" || activeTab === "overview") && (() => {
                  const totalPages = Math.max(1, Math.ceil(sortedInventory.length / PAGE_SIZE));
                  const paged = sortedInventory.slice(materialPage * PAGE_SIZE, (materialPage + 1) * PAGE_SIZE);
                  return (
                    <>
                      <InventoryTable
                        materials={paged}
                        projects={projectMap}
                        onEdit={(m) => {
                          setSelectedMaterial(m);
                          setMaterialFormOpen(true);
                        }}
                        onPurchase={(m) =>
                          setPurchaseActionConfig({
                            isOpen: true,
                            type: "purchase",
                            material: m,
                          })
                        }
                        onUsage={(m) =>
                          setPurchaseActionConfig({
                            isOpen: true,
                            type: "usage",
                            material: m,
                          })
                        }
                        onDelete={(id) => handleDeleteClick(id, "material")}
                      />
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/30">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Showing {materialPage * PAGE_SIZE + 1}–{Math.min((materialPage + 1) * PAGE_SIZE, sortedInventory.length)} of {sortedInventory.length} Materials
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setMaterialPage((p) => Math.max(0, p - 1))}
                              disabled={materialPage === 0}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                              {materialPage + 1}
                            </div>
                            <button
                              onClick={() => setMaterialPage((p) => Math.min(totalPages - 1, p + 1))}
                              disabled={materialPage >= totalPages - 1}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                {activeTab === "suppliers" && (() => {
                  const totalPages = Math.max(1, Math.ceil(sortedSuppliers.length / PAGE_SIZE));
                  const paged = sortedSuppliers.slice(supplierPage * PAGE_SIZE, (supplierPage + 1) * PAGE_SIZE);
                  return (
                    <>
                      <SupplierTable
                        suppliers={paged}
                        onEdit={(s) => { setSelectedSupplier(s); setSupplierModalOpen(true); }}
                        onDelete={(id) => handleDeleteClick(id, "supplier")}
                      />
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/30">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Showing {supplierPage * PAGE_SIZE + 1}–{Math.min((supplierPage + 1) * PAGE_SIZE, sortedSuppliers.length)} of {sortedSuppliers.length} Suppliers
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSupplierPage((p) => Math.max(0, p - 1))}
                              disabled={supplierPage === 0}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                              {supplierPage + 1}
                            </div>
                            <button
                              onClick={() => setSupplierPage((p) => Math.min(totalPages - 1, p + 1))}
                              disabled={supplierPage >= totalPages - 1}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                {activeTab === "pos" && (() => {
                  const totalPages = Math.max(1, Math.ceil(sortedPOs.length / PAGE_SIZE));
                  const paged = sortedPOs.slice(poPage * PAGE_SIZE, (poPage + 1) * PAGE_SIZE);
                  return (
                    <>
                      <PurchaseOrderTable
                        pos={paged}
                        onEdit={(po) => {
                          setSelectedPO(po);
                          setIsEditPOModalOpen(true);
                        }}
                        onDelete={(id) => handleDeleteClick(id, "po")}
                      />
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/30">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Showing {poPage * PAGE_SIZE + 1}–{Math.min((poPage + 1) * PAGE_SIZE, sortedPOs.length)} of {sortedPOs.length} Orders
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setPoPage((p) => Math.max(0, p - 1))}
                              disabled={poPage === 0}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                              {poPage + 1}
                            </div>
                            <button
                              onClick={() => setPoPage((p) => Math.min(totalPages - 1, p + 1))}
                              disabled={poPage >= totalPages - 1}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                {activeTab === "transfers" && (() => {
                  const totalPages = Math.max(1, Math.ceil(sortedTransfers.length / PAGE_SIZE));
                  const paged = sortedTransfers.slice(transferPage * PAGE_SIZE, (transferPage + 1) * PAGE_SIZE);
                  return (
                    <>
                      <TransferTable
                        transfers={paged}
                        onStatusUpdate={async (id, status) => {
                          try {
                            await materialService.updateTransferStatus(id, status);
                            setTransfers(prev => prev.map(t => t.id === id ? { ...t, status } : t));
                            toast.success(`Transfer marked as ${status.toLowerCase()}!`);
                          } catch {
                            toast.error("Failed to update transfer status");
                          }
                        }}
                        onView={(t) => setSelectedTransfer(t)}
                      />
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/30">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Showing {transferPage * PAGE_SIZE + 1}–{Math.min((transferPage + 1) * PAGE_SIZE, sortedTransfers.length)} of {sortedTransfers.length} Transfers
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setTransferPage((p) => Math.max(0, p - 1))}
                              disabled={transferPage === 0}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                              {transferPage + 1}
                            </div>
                            <button
                              onClick={() => setTransferPage((p) => Math.min(totalPages - 1, p + 1))}
                              disabled={transferPage >= totalPages - 1}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
                {activeTab === "logs" && (() => {
                  const totalPages = Math.max(1, Math.ceil(sortedLogs.length / PAGE_SIZE));
                  const paged = sortedLogs.slice(logsPage * PAGE_SIZE, (logsPage + 1) * PAGE_SIZE);
                  return (
                    <>
                      {isLogsRefreshing ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                          <div className="w-10 h-10 border-4 border-slate-100 border-t-primary rounded-full animate-spin" />
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">
                            Filtering transaction logs...
                          </p>
                        </div>
                      ) : (
                        <InventoryLogsTable logs={paged} projectMap={projectMap} />
                      )}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-slate-50/30">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Showing {logsPage * PAGE_SIZE + 1}–{Math.min((logsPage + 1) * PAGE_SIZE, sortedLogs.length)} of {sortedLogs.length} Logs
                          </p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setLogsPage((p) => Math.max(0, p - 1))}
                              disabled={logsPage === 0}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                              {logsPage + 1}
                            </div>
                            <button
                              onClick={() => setLogsPage((p) => Math.min(totalPages - 1, p + 1))}
                              disabled={logsPage >= totalPages - 1}
                              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </PageTransition>

      <ViewTransferModal
        isOpen={selectedTransfer !== null}
        onClose={() => setSelectedTransfer(null)}
        transfer={selectedTransfer}
      />
      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setSupplierModalOpen(false);
          setSelectedSupplier(null);
          setSupplierApiErrors({});
        }}
        onSubmit={handleSupplierSubmit}
        initialData={selectedSupplier}
        apiErrors={supplierApiErrors}
      />
      <AddMaterialModal
        isOpen={isMaterialFormOpen}
        onClose={() => {
          setMaterialFormOpen(false);
          setMaterialApiErrors({});
        }}
        onSubmit={handleCreateOrUpdateMaterial}
        initialData={selectedMaterial}
        suppliers={suppliers}
        apiErrors={materialApiErrors}
        projects={projectList}
      />

      <MaterialCostReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        inventory={inventory}
        projects={projectMap}
      />
      <PurchaseActionModal
        isOpen={purchaseActionConfig.isOpen}
        onClose={() =>
          setPurchaseActionConfig({
            isOpen: false,
            type: "purchase",
            material: null,
          })
        }
        onSubmit={handlePurchaseAction}
        actionType={purchaseActionConfig.type}
        material={purchaseActionConfig.material}
        projects={projectList}
        suppliers={suppliers}
        allMaterials={masterMaterials}
      />
      {/* Passing inventory strictly styled as what TransferMaterial expects or reformatted locally */}
      <TransferMaterialModal
        isOpen={isTransferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onSubmit={handleTransferSubmit}
        inventory={inventory.map((i) => ({
          id: i.id,
          name: i.material_name,
          stock: i.remaining_stock,
          unit: i.unit,
          project_id: i.project_id
        }))}
        projects={projectList}
      />

      <EditPOModal
        isOpen={isEditPOModalOpen}
        po={selectedPO}
        onClose={() => {
          setIsEditPOModalOpen(false);
          setSelectedPO(null);
        }}
        onSubmit={async (id, data) => {
          const updated = await materialService.updatePurchaseOrder(id, data);
          setPos(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
          toast.success("Purchase Order updated successfully!");
        }}
      />

      <CreatePOModal
        isOpen={isCreatePOModalOpen}
        onClose={() => setIsCreatePOModalOpen(false)}
        onSubmit={handleCreatePOSubmit}
        suppliers={suppliers}
        projects={projectList}
        inventory={masterMaterials}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${itemToDelete?.type === "material" ? "Material" : itemToDelete?.type === "po" ? "Purchase Order" : "Supplier"}`}
        message={`Are you sure you want to delete this ${itemToDelete?.type === "po" ? "purchase order" : itemToDelete?.type}? This action will permanently remove the record.`}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default InventoryPage;
