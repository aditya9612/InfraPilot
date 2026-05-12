import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateMasterDataModal from "../../components/forms/CreateMasterDataModal";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import { Eye, Edit2, Trash2 } from "lucide-react";
import MasterDataDetailsModal from "../../components/dashboard/MasterDataDetailsModal";

const initialMasterData = [
  { id: 1, name: "Cement (OPC 53)", code: "MAT-CEM-01", category: "Construction Material", type: "Material" },
  { id: 2, name: "Skilled Mason", code: "LAB-SKL-01", category: "Human Resource", type: "Labour" },
  { id: 3, name: "Excavation", code: "ACT-CIV-01", category: "Civil Works", type: "Activity" },
  { id: 4, name: "Cubic Meter", code: "UNT-CUM", category: "Measurement", type: "Unit" },
];

const MasterDataPage = () => {
  const location = useLocation();
  const [items, setItems] = useState(initialMasterData);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  const filteredItems = items.filter(item =>
    (activeTab === "All" || item.type === activeTab) &&
    (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateOrUpdate = (data: any) => {
    if (editingItem) {
      setItems(prev => prev.map(item => item.id === editingItem.id ? { ...data, id: item.id } : item));
      toast.success("Entity updated successfully!");
    } else {
      const newItem = { ...data, id: items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1 };
      setItems(prev => [...prev, newItem]);
      toast.success("New entity added to master data!");
    }
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      setItems(prev => prev.filter(item => item.id !== itemToDelete));
      toast.success("Entity removed from master data.");
      setIsDeleteModalOpen(false);
      setItemToDelete(null);
    }
  };

  const downloadSchema = () => {
    const headers = ["Entity Name", "Unique Code", "Category", "System Tag"];
    const rows = filteredItems.map(item => [
      item.name,
      item.code,
      item.category,
      item.type
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Master_Data_Schema_${activeTab}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Schema downloaded successfully!");
  };

  return (
    <>
      <Navbar title="Master Data Console" breadcrumb={["Admin", "Master Data"]} />

      <PageTransition key={location.pathname} className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">System Master Data</h1>
            <p className="text-slate-500 text-sm">Manage reusable data entities across the entire platform.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={downloadSchema}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
            >
              Download Schema
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
            >
              + New Entry
            </button>
          </div>
        </div>

        {/* Master Data Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard title="Materials" value={items.filter(i => i.type === "Material").length.toString()} sub="Active SKUs" accent="text-primary" />
          <StatCard title="Labour Types" value={items.filter(i => i.type === "Labour").length.toString()} sub="Specialized roles" accent="text-violet-500" />
          <StatCard title="Activity Types" value={items.filter(i => i.type === "Activity").length.toString()} sub="Standard procedures" accent="text-amber-500" />
          <StatCard title="Units" value={items.filter(i => i.type === "Unit").length.toString()} sub="Measurement metrics" accent="text-emerald-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden min-h-[400px]">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              {["All", "Material", "Labour", "Activity", "Unit"].map((tab) => (
                <button
                  key={tab}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">Entity Name</th>
                  <th className="px-6 py-4">Unique Code</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">System Tag</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700 group-hover:text-primary transition-colors">{item.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">{item.code}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{item.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.type === "Material" ? "bg-blue-50 text-blue-600" :
                          item.type === "Labour" ? "bg-violet-50 text-violet-600" :
                            item.type === "Activity" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => {
                            setViewingItem(item);
                            setIsViewModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                          title="View Details"
                        >
                          <Eye className="w-4.5 h-4.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                          title="Edit Entity"
                        >
                          <Edit2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(item.id);
                            setIsDeleteModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                          title="Delete"
                        >
                          <Trash2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="p-20 text-center">
              <p className="text-slate-400 font-medium">No master data matches your search.</p>
            </div>
          )}
        </div>
      </PageTransition>

      <CreateMasterDataModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingItem}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDelete}
        title="Delete Master Entity"
        message="Are you sure you want to remove this entity from master data? This may affect linked projects and reports."
        confirmText="Remove Entity"
        type="danger"
      />

      <MasterDataDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewingItem(null);
        }}
        item={viewingItem}
      />
    </>
  );
};

export default MasterDataPage;
