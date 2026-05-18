import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import AddMaterialModal from "../../components/inventory/AddMaterialModal";
import toast from "react-hot-toast";
import { Edit2, PlusCircle, MinusCircle, Trash2, Package, Truck, AlertTriangle, Eye } from "lucide-react";

const MOCK_MATERIALS = [
  {
    id: 1,
    project_id: 1,
    material_name: "Cement (OPC 53)",
    category: "Construction",
    unit: "Bags",
    supplier_name: "UltraTech Cement",
    purchase_rate: 450,
    quantity_purchased: 2500,
    quantity_used: 1800,
    remaining_stock: 700,
    total_amount: 1125000,
  },
  {
    id: 2,
    project_id: 1,
    material_name: "TMT Steel 12mm",
    category: "Structure",
    unit: "MT",
    supplier_name: "JSW Steel",
    purchase_rate: 62000,
    quantity_purchased: 40,
    quantity_used: 35,
    remaining_stock: 5,
    total_amount: 2480000,
  },
  {
    id: 3,
    project_id: 1,
    material_name: "Fine Sand",
    category: "Construction",
    unit: "Brass",
    supplier_name: "Local Vendor",
    purchase_rate: 8500,
    quantity_purchased: 100,
    quantity_used: 40,
    remaining_stock: 60,
    total_amount: 850000,
  }
];

const ManagerMaterialsPage = () => {
  const [activeTab, setActiveTab] = useState<"inventory" | "suppliers" | "transfers">("inventory");
  const [inventory, setInventory] = useState(MOCK_MATERIALS);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMaterialFormOpen, setMaterialFormOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  const filteredInventory = inventory.filter(
    (i) =>
      i.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = inventory.filter((m) => m.remaining_stock < 10).length;

  return (
    <>
      <Navbar
        title="Materials Management"
        breadcrumb={["Manager", "Materials", "Inventory"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen pb-24">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Project Materials Tracking
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Monitor stock levels and procurement across all active project sites.
            </p>
          </div>
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Stock Value"
            value="₹4.2Cr"
            sub="Estimated current inventory"
            accent="text-emerald-500"
            icon={<Package className="w-5 h-5" />}
          />
          <StatCard
            title="Active Suppliers"
            value="18"
            sub="Verified partners"
            accent="text-primary"
            icon={<Truck className="w-5 h-5" />}
          />
          <StatCard
            title="Critical Stock Alerts"
            value={lowStockCount.toString()}
            sub="Action required"
            accent="text-rose-500"
            icon={<AlertTriangle className="w-5 h-5" />}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="flex border-b border-slate-100 bg-slate-50/30">
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "inventory"
                  ? "bg-white text-primary border-b-2 border-primary"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Inventory Tracking
            </button>
            <button
              onClick={() => setActiveTab("suppliers")}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "suppliers"
                  ? "bg-white text-primary border-b-2 border-primary"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Supplier List
            </button>
            <button
              onClick={() => setActiveTab("transfers")}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "transfers"
                  ? "bg-white text-primary border-b-2 border-primary"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Material Transfers
            </button>
          </div>

          <div className="p-4 border-b border-slate-50">
            <div className="relative max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search materials or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {activeTab === "inventory" ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Material Details</th>
                    <th className="px-6 py-4">Stock Level</th>
                    <th className="px-6 py-4">Consumption</th>
                    <th className="px-6 py-4">Value</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 group-hover:text-primary transition-colors">{item.material_name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{item.category} • {item.supplier_name}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${item.remaining_stock < 10 ? 'text-rose-500' : 'text-slate-700'}`}>
                            {item.remaining_stock} {item.unit}
                          </span>
                          {item.remaining_stock < 10 && <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-slate-500">Used: <span className="font-bold">{item.quantity_used}</span></p>
                        <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                          <div 
                            className="h-full bg-primary" 
                            style={{ width: `${(item.quantity_used / item.quantity_purchased) * 100}%` }}
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-700">₹{item.total_amount.toLocaleString()}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-medium">No {activeTab} data recorded yet</p>
                <button className="mt-4 text-primary text-xs font-bold hover:underline">
                  + Add {activeTab.slice(0, -1)}
                </button>
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      <AddMaterialModal
        isOpen={isMaterialFormOpen}
        onClose={() => setMaterialFormOpen(false)}
        onSubmit={(data) => {
          setInventory([...inventory, { ...data, id: inventory.length + 1, remaining_stock: data.quantity_purchased, quantity_used: 0, total_amount: data.quantity_purchased * data.purchase_rate }]);
          setMaterialFormOpen(false);
          toast.success("Material added successfully!");
        }}
        suppliers={[]}
      />
    </>
  );
};

export default ManagerMaterialsPage;
