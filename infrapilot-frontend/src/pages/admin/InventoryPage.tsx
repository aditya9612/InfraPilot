import { useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";

const inventoryData = [
  { id: 1, name: "Cement (OPC 53)", category: "Masonry", unit: "Bag", stock: 1250, min: 200, supplier: "UltraTech Cement", rate: 420 },
  { id: 2, name: "TMT Rebars 12mm", category: "Steel", unit: "MT", stock: 8.5, min: 2, supplier: "Tata Tiscon", rate: 68000 },
  { id: 3, name: "Coarse Aggregate", category: "Aggregates", unit: "Cum", stock: 45, min: 50, supplier: "Local Quarry", rate: 1200 },
];

const InventoryPage = () => {
  const location = useLocation();
  const isMaster = location.pathname.includes("/master") || location.pathname === "/admin/inventory";
  const [searchTerm, setSearchTerm] = useState("");

  const filteredInventory = inventoryData.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Navbar title="Material & Inventory Control" breadcrumb={["Admin", "Inventory", isMaster ? "Material Master" : "Stock Management"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{isMaster ? "Material Master Registry" : "Current Stock Management"}</h1>
            <p className="text-slate-500 text-sm">
              {isMaster ? "Central database of all construction materials and basic pricing." : "Real-time tracking of site inventory levels and low-stock alerts."}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">Stock Audit</button>
            <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
              {isMaster ? "+ Add Material" : "+ Update Stock"}
            </button>
          </div>
        </div>

        {/* Inventory Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total SKU Items" value="142" sub="Across 8 categories" accent="text-primary" />
          <StatCard title="Inventory Value" value="₹1.4Cr" sub="Total estimated value" accent="text-emerald-500" />
          <StatCard title="Critical Low Stock" value="4" sub="Immediate action required" accent="text-rose-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search materials, suppliers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              <button 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isMaster ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                onClick={() => window.history.pushState(null, "", "/admin/inventory/master")}
              >
                Master
              </button>
              <button 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!isMaster ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                onClick={() => window.history.pushState(null, "", "/admin/inventory/stock")}
              >
                Stock
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">Material & Category</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Current Stock</th>
                  <th className="px-6 py-4">Min. Level</th>
                  <th className="px-6 py-4">Primary Supplier</th>
                  <th className="px-6 py-4">Unit Rate</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">{item.name}</p>
                        <p className="text-slate-400 text-[10px] font-medium tracking-tight uppercase">{item.category}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.unit}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${item.stock <= item.min ? "text-rose-500" : "text-slate-700"}`}>
                          {item.stock.toLocaleString()}
                        </span>
                        {item.stock <= item.min && (
                          <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-400">{item.min}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{item.supplier}</td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">₹{item.rate.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 text-slate-400 hover:text-primary transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default InventoryPage;
