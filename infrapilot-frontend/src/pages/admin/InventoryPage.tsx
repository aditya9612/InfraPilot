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
import { Edit2, PlusCircle, MinusCircle, Trash2 } from "lucide-react";

// --- Mock Data (Exact API Schema) ---
const initialInventory = [
  {
    id: 1,
    project_id: 1,
    material_name: "Paint",
    category: "Finishing",
    unit: "Liters",
    supplier_name: "Asian Paints Dealer",
    purchase_rate: 250,
    rate_type: "per liter",
    quantity_purchased: 200,
    quantity_used: 50,
    remaining_stock: 150,
    total_amount: 50000,
    payment_given: 40000,
    payment_pending: 10000,
  },
  {
    id: 2,
    project_id: 2,
    material_name: "Bricks",
    category: "Construction",
    unit: "Pieces",
    supplier_name: "Sharma Bricks",
    purchase_rate: 8,
    rate_type: "per piece",
    quantity_purchased: 5000,
    quantity_used: 4995,
    remaining_stock: 5, // Low Stock Alert
    total_amount: 40000,
    payment_given: 40000,
    payment_pending: 0,
  },
];

const initialSuppliers = [
  {
    id: "s1",
    name: "Asian Paints Dealer",
    contactPerson: "Rajesh Kumar",
    phone: "+91 9876543210",
    email: "",
    gst: "",
    address: "Mumbai",
  },
  {
    id: "s2",
    name: "Sharma Bricks",
    contactPerson: "Amit Singh",
    phone: "+91 8765432109",
    email: "",
    gst: "",
    address: "Pune",
  },
];

const projects = {
  1: "Site A - City Center Complex",
  2: "Site B - Riverside Apartments",
};
// -----------------

const InventoryPage = () => {
  const location = useLocation();
  const isMaster =
    location.pathname.includes("/master") ||
    location.pathname === "/admin/inventory";

  const [inventory, setInventory] = useState(initialInventory);
  const [suppliers, setSuppliers] = useState(initialSuppliers);

  // Note: we're dropping the distinct 'pos' tab/state to streamline exactly with the API given which just logs purchases to the material directly.
  const [activeTab, setActiveTab] = useState<"inventory" | "suppliers">(
    isMaster ? "suppliers" : "inventory",
  );
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: any;
    type: "material" | "supplier";
  } | null>(null);

  useEffect(() => {
    if (isMaster) {
      if (activeTab !== "suppliers") setActiveTab("suppliers");
    } else {
      if (activeTab !== "inventory") setActiveTab("inventory");
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
      s.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Handlers
  const handleSupplierSubmit = async (data: any) => {
    try {
      await materialService.createSupplier(data);
      setSuppliers((prev) => [...prev, { ...data, id: `s${prev.length + 1}` }]);
      setSupplierModalOpen(false);
      toast.success("Supplier added successfully!");
    } catch (error) {
      toast.error("Failed to add supplier");
    }
  };

  const handleCreateOrUpdateMaterial = (data: any) => {
    // Corresponds to POST /materials and PUT /materials/{id}
    if (selectedMaterial) {
      // Logic for PUT
      setInventory((prev) =>
        prev.map((m) => {
          if (m.id === selectedMaterial.id) {
            const newPaymentGiven = m.payment_given + (data.payment_given || 0);
            return {
              ...m,
              material_name: data.material_name,
              category: data.category,
              unit: data.unit,
              supplier_name: data.supplier_name,
              purchase_rate: data.purchase_rate,
              rate_type: data.rate_type,
              payment_given: newPaymentGiven,
              payment_pending: m.total_amount - newPaymentGiven,
            };
          }
          return m;
        }),
      );
    } else {
      // Logic for POST
      const totalAmount = data.quantity_purchased * data.purchase_rate;
      const newMaterial = {
        ...data,
        id:
          inventory.length > 0
            ? Math.max(...inventory.map((m) => m.id)) + 1
            : 1,
        quantity_used: 0,
        remaining_stock: data.quantity_purchased,
        total_amount: totalAmount,
        payment_pending: totalAmount - (data.payment_given || 0),
      };
      setInventory((prev) => [...prev, newMaterial]);
    }
    setMaterialFormOpen(false);
    toast.success(
      selectedMaterial
        ? "Material updated successfully!"
        : "Material created successfully!",
    );
  };

  const handlePurchaseAction = (data: any) => {
    // Corresponds to POST .../purchase or POST .../usage
    setInventory((prev) =>
      prev.map((m) => {
        if (m.id === purchaseActionConfig.material.id) {
          if (data.actionType === "usage") {
            return {
              ...m,
              quantity_used: m.quantity_used + data.quantity,
              remaining_stock: m.remaining_stock - data.quantity,
              // The current api schema doesn't log payment directly to usage, but you could append data.payment logic if required.
            };
          } else {
            // purchase action increases qty, stock, and total amount
            const addedAmount = data.quantity * m.purchase_rate;
            const newPaymentGiven = m.payment_given + data.payment;
            const newTotalAmount = m.total_amount + addedAmount;

            return {
              ...m,
              quantity_purchased: m.quantity_purchased + data.quantity,
              remaining_stock: m.remaining_stock + data.quantity,
              total_amount: newTotalAmount,
              payment_given: newPaymentGiven,
              payment_pending: newTotalAmount - newPaymentGiven,
            };
          }
        }
        return m;
      }),
    );
    setPurchaseActionConfig({
      isOpen: false,
      type: "purchase",
      material: null,
    });
    toast.success(
      data.actionType === "usage"
        ? "Usage logged successfully!"
        : "Purchase added successfully!",
    );
  };

  const handleTransferSubmit = (data: any) => {
    // Custom simulated transfer
    setInventory((prev) => {
      const updated = [...prev];
      const sourceIndex = updated.findIndex((i) => i.id === data.materialId);
      if (sourceIndex >= 0) {
        updated[sourceIndex].remaining_stock -= data.quantity;
        updated[sourceIndex].quantity_used += data.quantity; // Technically transferred out, so it's "used" at site A

        // Spawn destination material at Site B
        updated.push({
          ...updated[sourceIndex],
          id: updated.length + 1,
          project_id: data.toProjectId,
          quantity_purchased: data.quantity,
          quantity_used: 0,
          remaining_stock: data.quantity,
          payment_given: 0,
          payment_pending: 0,
          total_amount: 0, // Financials usually stay with the original site accounting, or adjust as needed.
        });
      }
      return updated;
    });
    setTransferModalOpen(false);
    toast.success("Material transferred successfully!");
  };

  const handleDeleteClick = (id: any, type: "material" | "supplier") => {
    setItemToDelete({ id, type });
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "material") {
      setInventory((prev) => prev.filter((m) => m.id !== itemToDelete.id));
      toast.success("Material deleted successfully!");
    } else {
      setSuppliers((prev) => prev.filter((s) => s.id !== itemToDelete.id));
      toast.success("Supplier deleted successfully!");
    }
    setIsDeleteModalOpen(false);
    setItemToDelete(null);
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
        className="p-6 bg-slate-50 min-h-screen pb-24"
      >
        {/* Header Options */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 mt-2">
          <div>
            {isMaster ? (
              <>
                <h1 className="text-[28px] leading-tight font-extrabold text-slate-900 tracking-tight">
                  Supplier Database
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Manage all your material suppliers and contacts.
                </p>
              </>
            ) : (
              <>
                <h1 className="text-[28px] leading-tight font-extrabold text-slate-900 tracking-tight">
                  Project Site Inventory
                </h1>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  Track and secure inventory across multiple project sites.
                </p>
              </>
            )}
          </div>

          <div className="flex gap-2">
            {activeTab === "inventory" && (
              <>
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
                >
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
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Cost Report
                </button>
                <button
                  onClick={() => setTransferModalOpen(true)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
                >
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
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                  Transfer
                </button>
                <button
                  onClick={() => {
                    setSelectedMaterial(null);
                    setMaterialFormOpen(true);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
                >
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
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  New Material
                </button>
              </>
            )}
            {activeTab === "suppliers" && (
              <button
                onClick={() => setSupplierModalOpen(true)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
              >
                + Add Supplier
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Content based on Tab */}
        {activeTab === "inventory" && (
          <div className="flex flex-col gap-6 mb-8">
            {/* LOW STOCK ALERT BANNER */}
            {lowStockCount > 0 && (
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
                    The following items have dropped below the minimum threshold
                    (10 units) and require immediate procurement:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {inventory
                      .filter((m) => m.remaining_stock < 10)
                      .map((lowItem) => (
                        <span
                          key={lowItem.id}
                          className="bg-white border border-rose-200 text-rose-700 px-3 py-1 rounded-lg text-xs font-bold shadow-sm"
                        >
                          {lowItem.material_name}{" "}
                          <span className="text-rose-400 font-normal ml-1">
                            ({lowItem.remaining_stock} left @{" "}
                            {(projects as any)[lowItem.project_id] ||
                              "Unknown Site"}
                            )
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
                title="Total Inventory Value"
                value={`₹${totalValuation.toLocaleString()}`}
                sub="Across all sites"
                accent="text-emerald-500"
              />
              <StatCard
                title="Total Units in Inventory"
                value={totalStockUnits.toLocaleString()}
                sub="Sum of tracking units"
                accent="text-primary"
              />
              <StatCard
                title="Low Inventory Materials"
                value={lowStockCount.toString()}
                sub="Threshold < 10"
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
            {/* INVENTORY TABLE - ALIGNED TO API SCHEMA */}
            {activeTab === "inventory" && (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Site & Material (ID)</th>
                    <th className="px-6 py-4">
                      Inventory Ledger (Bought/Used)
                    </th>
                    <th className="px-6 py-4">Rate & Value</th>
                    <th className="px-6 py-4">Financials (Paid/Pending)</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {filteredInventory.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50"></span>
                          <span className="font-semibold text-slate-600 text-xs">
                            {(projects as any)[item.project_id] ||
                              "Unknown Site"}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800">
                          {item.material_name}{" "}
                          <span className="text-slate-400 font-medium">
                            #{item.id}
                          </span>
                        </p>
                        <p className="text-slate-500 text-[10px] font-bold tracking-tight uppercase mt-0.5">
                          {item.category} • {item.supplier_name}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-base font-bold ${item.remaining_stock < 10 ? "text-rose-500" : "text-emerald-600"}`}
                          >
                            {item.remaining_stock.toLocaleString()} {item.unit}
                          </span>
                          {item.remaining_stock < 10 && (
                            <span
                              className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"
                              title="Low Inventory Alert"
                            />
                          )}
                        </div>
                        <div className="text-xs text-slate-400 font-medium flex gap-2">
                          <span>Bought: {item.quantity_purchased}</span>
                          <span>|</span>
                          <span>Used: {item.quantity_used}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">
                          ₹{item.purchase_rate.toLocaleString()}{" "}
                          <span className="text-xs font-normal text-slate-400">
                            / {item.unit}
                          </span>
                        </p>
                        <p className="text-xs font-semibold text-slate-500 mt-1">
                          Total: ₹{item.total_amount.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-emerald-600 mb-1">
                          Paid: ₹{item.payment_given.toLocaleString()}
                        </p>
                        <p
                          className={`text-xs font-bold ${item.payment_pending > 0 ? "text-amber-500" : "text-slate-400"}`}
                        >
                          Pending: ₹{item.payment_pending.toLocaleString()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <button 
                            onClick={() => { setSelectedMaterial(item); setMaterialFormOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                            title="Edit / Update Payments"
                          >
                            <Edit2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                          </button>
                          <button 
                            onClick={() => setPurchaseActionConfig({ isOpen: true, type: "purchase", material: item })}
                            className="p-1.5 text-slate-400 hover:text-emerald-500 transition-all duration-200"
                            title="Add Purchase"
                          >
                            <PlusCircle className="w-4.5 h-4.5" strokeWidth={1.5} />
                          </button>
                          <button 
                            onClick={() => setPurchaseActionConfig({ isOpen: true, type: "usage", material: item })}
                            className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                            title="Log Usage"
                          >
                            <MinusCircle className="w-4.5 h-4.5" strokeWidth={1.5} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(item.id, "material")}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredInventory.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-slate-400"
                      >
                        No inventory matches search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* SUPPLIERS TABLE */}
            {activeTab === "suppliers" && (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Supplier Name</th>
                    <th className="px-6 py-4">Contact Person</th>
                    <th className="px-6 py-4">Phone / Email</th>
                    <th className="px-6 py-4">GST Number</th>
                    <th className="px-6 py-4">Address</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSuppliers.map((sup) => (
                    <tr
                      key={sup.id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-700">{sup.name}</p>
                        <p className="text-xs text-slate-400 font-medium">
                          ID: {sup.id.toUpperCase()}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                        {sup.contactPerson}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                        <p className="text-slate-700">{sup.phone}</p>
                        <p className="text-xs text-slate-400 font-normal">
                          {sup.email || "N/A"}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500 uppercase">
                        {sup.gst || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-[200px] truncate">
                        {sup.address}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button 
                            onClick={() => console.log("Edit supplier", sup.id)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                            title="Edit Supplier"
                          >
                            <Edit2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(sup.id, "supplier")}
                            className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                            title="Delete Supplier"
                          >
                            <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredSuppliers.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-12 text-center text-slate-400"
                      >
                        No suppliers match search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </PageTransition>

      <SupplierModal
        isOpen={isSupplierModalOpen}
        onClose={() => setSupplierModalOpen(false)}
        onSubmit={handleSupplierSubmit}
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
