import { useState, useEffect } from "react";
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
import { materialService } from "../../services/materialService";
import {
  Edit2,
  PlusCircle,
  MinusCircle,
  Trash2,
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
import InventoryLogsTable from "../../components/admin/inventory/InventoryLogsTable";

const projects: Record<number, string> = {
  1: "Site A - City Center Complex",
  2: "Site B - Riverside Apartments",
};

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
  const [valuation, setValuation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<
    "overview" | "inventory" | "suppliers" | "pos" | "transfers" | "logs"
  >(isMaster ? "suppliers" : "overview");
  const [searchTerm, setSearchTerm] = useState("");

  const [isSupplierModalOpen, setSupplierModalOpen] = useState(false);
  const [isTransferModalOpen, setTransferModalOpen] = useState(false);
  const [isMaterialFormOpen, setMaterialFormOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: any;
    type: "material" | "supplier";
  } | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching inventory data for Project 1...");
      const [invData, supData, poData, trData, logData, summaryData, valData] =
        await Promise.all([
          materialService.getMaterials(1), // Default to project 1
          materialService.getSuppliers(),
          materialService.getPOs(),
          materialService.getTransfers(),
          materialService.getLogs({ limit: 50, project_id: 1 }),
          materialService.getSummary(),
          materialService.getInventoryValuation(),
        ]);

      setInventory(invData);
      setSuppliers(supData);
      setPos(poData);
      setTransfers(trData);
      setLogs(logData);
      setSummary(summaryData);
      setValuation(valData.total_value || 0);
      console.log("Inventory data synchronized successfully.");
    } catch (error: any) {
      console.error("Critical API Error in InventoryPage:", error);
      const errorMsg =
        error.response?.data?.detail || error.response?.data || error.message;
      console.error("Error Detail:", errorMsg);
      toast.error(
        `Sync Failed: ${typeof errorMsg === "string" ? errorMsg : "Check console"}`,
      );
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
      i.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.contactPerson || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handlers
  const handleSupplierSubmit = async (data: any) => {
    try {
      if (selectedSupplier) {
        setSuppliers((prev) =>
          prev.map((s) =>
            s.id === selectedSupplier.id ? { ...data, id: s.id } : s,
          ),
        );
        toast.success("Supplier updated successfully!");
      } else {
        await materialService.createSupplier(data);
        setSuppliers((prev) => [
          ...prev,
          { ...data, id: `s${prev.length + 1}` },
        ]);
        toast.success("Supplier added successfully!");
      }
      setSupplierModalOpen(false);
      setSelectedSupplier(null);
    } catch (error) {
      toast.error("Failed to save supplier");
    }
  };

  const handleCreateOrUpdateMaterial = async (data: any) => {
    try {
      if (selectedMaterial) {
        await materialService.updateMaterial(selectedMaterial.id, data);
        toast.success("Material updated successfully!");
      } else {
        await materialService.createMaterial(data);
        toast.success("Material created successfully!");
      }
      fetchData();
      setMaterialFormOpen(false);
    } catch (error) {
      toast.error("Failed to save material");
    }
  };

  const handlePurchaseAction = async (data: any) => {
    try {
      if (data.actionType === "usage") {
        await materialService.logUsage(purchaseActionConfig.material.id, {
          quantity: data.quantity,
          project_id: data.project_id,
          issue_type: data.issue_type || "SITE",
        });
        toast.success("Usage logged successfully!");
      } else {
        await materialService.logPurchase(purchaseActionConfig.material.id, {
          quantity: data.quantity,
          amount_paid: data.payment,
          project_id: data.project_id,
          issue_type: data.issue_type || "SYSTEM",
        });
        toast.success("Purchase added successfully!");
      }
      fetchData();
      setPurchaseActionConfig({
        isOpen: false,
        type: "purchase",
        material: null,
      });
    } catch (error) {
      toast.error("Failed to log action");
    }
  };

  const handleTransferSubmit = async (data: any) => {
    try {
      await materialService.createTransfer(data);
      fetchData();
      setTransferModalOpen(false);
      toast.success("Material transferred successfully!");
    } catch (error) {
      toast.error("Failed to transfer material");
    }
  };

  const handleDeleteClick = (id: any, type: "material" | "supplier") => {
    setItemToDelete({ id, type });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "material") {
        await materialService.deleteMaterial(itemToDelete.id);
        toast.success("Material deleted successfully!");
      } else {
        await materialService.deleteSupplier(itemToDelete.id);
        toast.success("Supplier deleted successfully!");
      }
      fetchData();
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    } catch (error) {
      toast.error("Failed to delete item");
    }
  };

  // Stats Calculation based on exact API schema fields
  const totalStockUnits = inventory.reduce(
    (acc, m) => acc + m.remaining_stock,
    0,
  );
  const lowStockCount = inventory.filter((m) => m.remaining_stock < 10).length;
  const totalValuation = inventory.reduce((acc, m) => acc + m.total_amount, 0);

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
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeTab === tab.id
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
                            {projects[lowItem.project_id] || "Unknown Site"})
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
                value={`₹${valuation.toLocaleString()}`}
                sub="Across all sites"
                accent="text-emerald-500"
              />
              <StatCard
                title="Total Materials"
                value={summary?.total_materials.toLocaleString() || "0"}
                sub="Active catalog items"
                accent="text-primary"
              />
              <StatCard
                title="Pending Payments"
                value={`₹${summary?.total_pending_payments.toLocaleString() || "0"}`}
                sub="Supplier payables"
                accent="text-rose-500"
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-visible min-h-[500px]">
          <div className="p-4 border-b border-slate-50">
            <div className="relative max-w-md">
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
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
                {activeTab === "inventory" && (
                  <InventoryTable
                    materials={filteredInventory}
                    projects={projects}
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
                )}
                {activeTab === "suppliers" && (
                  <SupplierTable
                    suppliers={filteredSuppliers}
                    onEdit={(s) => {
                      setSelectedSupplier(s);
                      setSupplierModalOpen(true);
                    }}
                    onDelete={(id) => handleDeleteClick(id, "supplier")}
                  />
                )}
                {activeTab === "pos" && (
                  <PurchaseOrderTable
                    pos={pos.filter((p) =>
                      p.material_name
                        .toLowerCase()
                        .includes(searchTerm.toLowerCase()),
                    )}
                    onEdit={() => {}}
                    onDelete={(id) => {}}
                    onStatusUpdate={async (id, status) => {
                      try {
                        await materialService.updatePO(id, {
                          ...pos.find((p) => p.id === id)!,
                        }); // Simplistic update
                        fetchData();
                      } catch (error) {
                        toast.error("Failed to update status");
                      }
                    }}
                  />
                )}
                {activeTab === "transfers" && (
                  <TransferTable
                    transfers={transfers}
                    onStatusUpdate={async (id, status) => {
                      try {
                        await materialService.updateTransferStatus(id, status);
                        fetchData();
                      } catch (error) {
                        toast.error("Failed to update transfer");
                      }
                    }}
                  />
                )}
                {activeTab === "logs" && <InventoryLogsTable logs={logs} />}
              </>
            )}
          </div>
        </div>
      </PageTransition>

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => {
          setSupplierModalOpen(false);
          setSelectedSupplier(null);
        }}
        onSubmit={handleSupplierSubmit}
        initialData={selectedSupplier}
      />
      <AddMaterialModal
        isOpen={isMaterialFormOpen}
        onClose={() => setMaterialFormOpen(false)}
        onSubmit={handleCreateOrUpdateMaterial}
        initialData={selectedMaterial}
        suppliers={suppliers}
      />

      <MaterialCostReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        inventory={inventory}
        projects={projects}
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
        }))}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title={`Delete ${itemToDelete?.type === "material" ? "Material" : "Supplier"}`}
        message={`Are you sure you want to delete this ${itemToDelete?.type}? This action will permanently remove the record from the database.`}
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default InventoryPage;
