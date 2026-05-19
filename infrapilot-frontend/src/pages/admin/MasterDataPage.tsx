import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateMasterDataModal from "../../components/forms/CreateMasterDataModal";
import toast from "react-hot-toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import { Eye, Edit2, Trash2 } from "lucide-react";
import MasterDataDetailsModal from "../../components/dashboard/MasterDataDetailsModal";
import { masterService } from "../../services/masterService";
import type { MasterEntity, MasterStats } from "../../services/masterService";

const MasterDataPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState<MasterEntity[]>([]);
  const [stats, setStats] = useState<MasterStats>({
    total_materials: 0,
    total_labour_types: 0,
    total_activity_types: 0,
    total_units: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("All");

  // Sync tab state with URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.endsWith("/materials")) setActiveTab("Material");
    else if (path.endsWith("/labour")) setActiveTab("Labour");
    else if (path.endsWith("/activities")) setActiveTab("Activity");
    else if (path.endsWith("/units")) setActiveTab("Unit");
    else setActiveTab("All");
  }, [location.pathname]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [viewingItem, setViewingItem] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MasterEntity | null>(null);

  const fetchMasterData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (activeTab === "All") {
        const [materials, labour, activities, units] = await Promise.all([
          masterService.getEntities("materials"),
          masterService.getEntities("labour-types"),
          masterService.getEntities("activity-types"),
          masterService.getEntities("units")
        ]);

        const combined = [
          ...materials.map(i => ({ ...i, system_tag: "MATERIAL" })),
          ...labour.map(i => ({ ...i, system_tag: "LABOR" })),
          ...activities.map(i => ({ ...i, system_tag: "ACTIVITY" })),
          ...units.map(i => ({ ...i, system_tag: "UNIT" }))
        ];

        const filtered = combined.filter(i =>
          i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.unique_code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setItems(filtered);
        setStats({
          total_materials: materials.length,
          total_labour_types: labour.length,
          total_activity_types: activities.length,
          total_units: units.length
        });
      } else {
        const entityMap: Record<string, "materials" | "labour-types" | "activity-types" | "units"> = {
          "Material": "materials",
          "Labour": "labour-types",
          "Activity": "activity-types",
          "Unit": "units"
        };
        const tagMap: Record<string, string> = {
          "Material": "MATERIAL",
          "Labour": "LABOR",
          "Activity": "ACTIVITY",
          "Unit": "UNIT"
        };

        const entityType = entityMap[activeTab];
        const data = await masterService.getEntities(entityType);

        const filtered = data
          .map(i => ({ ...i, system_tag: tagMap[activeTab] }))
          .filter(i =>
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.unique_code.toLowerCase().includes(searchTerm.toLowerCase())
          );

        setItems(filtered);

        try {
          const sysStats = await masterService.getMasterStats();
          setStats(sysStats);
        } catch (e) {
          // Keep current stats if /stats is 404
        }
      }
    } catch (error) {
      console.error("Master Data Fetch Error:", error);
      toast.error("Failed to load master data. Individual endpoints are being checked.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  const handleCreateOrUpdate = async (data: any) => {
    try {
      const entityMap: Record<string, "units" | "labour-types" | "activity-types" | "materials"> = {
        "Material": "materials",
        "Labour": "labour-types",
        "Activity": "activity-types",
        "Unit": "units"
      };

      const entityType = entityMap[data.type] || "materials";

      if (editingItem) {
        await masterService.updateEntity(entityType, editingItem.id, data);
        toast.success("Entity updated successfully!");
      } else {
        await masterService.createEntity(entityType, data);
        toast.success("New entity added to master data!");
      }
      fetchMasterData();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast.error("Failed to save master entity");
    }
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      try {
        const entityMap: Record<string, string> = {
          "MATERIAL": "materials",
          "LABOR": "labour-types",
          "ACTIVITY": "activity-types",
          "UNIT": "units"
        };
        const entityType = entityMap[itemToDelete.system_tag || ""] || "materials";
        await masterService.deleteEntity(entityType, itemToDelete.id);
        toast.success("Entity removed from master data.");
        fetchMasterData();
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      } catch (error) {
        toast.error("Failed to delete master entity");
      }
    }
  };

  const downloadSchema = () => {
    const headers = ["Entity Name", "Unique Code", "Category", "System Tag"];
    const rows = items.map(item => [
      item.name,
      item.unique_code,
      item.category,
      item.system_tag || ""
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

  if (isLoading && items.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Navbar
        title={`${activeTab === "All" ? "Master Data Console" : `${activeTab} Master`}`}
        breadcrumb={["Admin", "Master Data", activeTab === "All" ? "" : activeTab].filter(Boolean)}
      />

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
          <StatCard title="Materials" value={(stats.total_materials || 0).toString()} sub="Active SKUs" accent="text-primary" />
          <StatCard title="Labour Types" value={(stats.total_labour_types || 0).toString()} sub="Specialized roles" accent="text-violet-500" />
          <StatCard title="Activity Types" value={(stats.total_activity_types || 0).toString()} sub="Standard procedures" accent="text-amber-500" />
          <StatCard title="Units" value={(stats.total_units || 0).toString()} sub="Measurement metrics" accent="text-emerald-500" />
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
                  onClick={() => {
                    const paths: Record<string, string> = {
                      "All": "/admin/master-data",
                      "Material": "/admin/master-data/materials",
                      "Labour": "/admin/master-data/labour",
                      "Activity": "/admin/master-data/activities",
                      "Unit": "/admin/master-data/units"
                    };
                    navigate(paths[tab]);
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading && items.length > 0 && <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}
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
                {items.map((item) => (
                  <tr key={`${item.system_tag}-${item.id}`} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700 group-hover:text-primary transition-colors">{item.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">{item.unique_code}</span>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-500">{item.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${item.system_tag === "MATERIAL" ? "bg-blue-50 text-blue-600" :
                        item.system_tag === "LABOR" ? "bg-violet-50 text-violet-600" :
                          item.system_tag === "ACTIVITY" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                        }`}>
                        {item.system_tag}
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
                            setEditingItem({
                              ...item,
                              type: item.system_tag === "MATERIAL" ? "Material" :
                                item.system_tag === "LABOR" ? "Labour" :
                                  item.system_tag === "ACTIVITY" ? "Activity" : "Unit"
                            });
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                          title="Edit Entity"
                        >
                          <Edit2 className="w-4.5 h-4.5" strokeWidth={1.5} />
                        </button>
                        <button
                          onClick={() => {
                            setItemToDelete(item);
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
          {items.length === 0 && !isLoading && (
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
