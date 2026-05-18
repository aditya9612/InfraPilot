import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateBOQModal from "../../components/forms/CreateBOQModal";
import toast from "react-hot-toast";
import BOQDetailsModal from "../../components/dashboard/BOQDetailsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import type { BoqItem, BoqSummary } from "../../types/boq";
import type { Project } from "../../types/project";

const MOCK_PROJECTS: Project[] = [
  { id: 1, project_name: "Skyline Tower A", description: "Residential tower", location: "Mumbai", status: "Ongoing", start_date: "2026-01-01", end_date: "2027-12-31", total_budget: 50000000 },
  { id: 2, project_name: "Metro Ph-II", description: "Metro rail project", location: "Delhi", status: "Ongoing", start_date: "2026-06-01", end_date: "2029-12-31", total_budget: 250000000 },
];
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { exportToCSV } from "../../utils/csvExport";
import UpdateActualsModal from "../../components/forms/UpdateActualsModal";
import BOQHistoryModal from "../../components/dashboard/BOQHistoryModal";
import {
  FileJson,
  FileSpreadsheet,
  FileText,
  History,
  TrendingUp,
  Layers,
  Download,
  Sparkles,
  RefreshCcw,
  Upload,
  Eye,
  Edit2,
  Trash2,
} from "lucide-react";
import OptimizationModal from "../../components/dashboard/OptimizationModal";
import BulkImportBOQModal from "../../components/forms/BulkImportBOQModal";

const INITIAL_ACTIVITIES_DATA = [
  {
    id: 1,
    name: "Site Clearing",
    type: "Pre-construction",
    project: "Skyline Tower A",
    status: "Completed",
  },
  {
    id: 2,
    name: "Foundation Pouring",
    type: "Civil",
    project: "Skyline Tower A",
    status: "In Progress",
  },
  {
    id: 3,
    name: "Column Casting",
    type: "Structure",
    project: "Metro Ph-II",
    status: "Pending",
  },
];

const MOCK_BOQ_DATA: BoqItem[] = [
  {
    id: 1,
    project_id: 1,
    item_name: "Excavation for Foundation",
    category: "Civil",
    unit: "Cum",
    quantity: 1200,
    unit_cost: 450,
    total_cost: 540000,
    actual_cost: 520000,
    status: "ACTIVE",
    boq_group_id: 1,
  },
  {
    id: 2,
    project_id: 1,
    item_name: "Reinforcement Steel (TMT)",
    category: "Structure",
    unit: "MT",
    quantity: 45,
    unit_cost: 65000,
    total_cost: 2925000,
    actual_cost: 3100000,
    status: "ACTIVE",
    boq_group_id: 1,
  },
  {
    id: 3,
    project_id: 1,
    item_name: "Ready Mix Concrete M25",
    category: "Structure",
    unit: "Cum",
    quantity: 850,
    unit_cost: 5200,
    total_cost: 4420000,
    actual_cost: 4420000,
    status: "COMPLETED",
    boq_group_id: 1,
  },
];

const ManagerBOQPage = () => {
  const [activeTab, setActiveTab] = useState<"tracking" | "analysis" | "setup">("tracking");
  const location = useLocation();
  const navigate = useNavigate();
  const isSetup = true; // For manager, we focus on setup/tracking

  // Data States
  const [boqData, setBoqData] = useState<BoqItem[]>(MOCK_BOQ_DATA);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [projectMap, setProjectMap] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingItem, setViewingItem] = useState<BoqItem | null>(null);
  const [editingItem, setEditingItem] = useState<BoqItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);

  // Advanced Feature States
  const [summaryData, setSummaryData] = useState<BoqSummary | null>(null);
  const [versionsList, setVersionsList] = useState<number[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<number | "latest">(
    "latest",
  );
  const [isActualsModalOpen, setIsActualsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [activeItemForModal, setActiveItemForModal] = useState<BoqItem | null>(
    null,
  );
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isOptimizationModalOpen, setIsOptimizationModalOpen] = useState(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);

  // Fetch Projects and BOQs on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      setTimeout(() => {
        setProjectsList(MOCK_PROJECTS);
        const map: Record<number, string> = {};
        MOCK_PROJECTS.forEach((p) => {
          map[p.id] = p.project_name;
        });
        setProjectMap(map);
        setBoqData(MOCK_BOQ_DATA);
        setIsLoading(false);
      }, 800);
    };

    loadInitialData();
  }, []);

  const refreshBoqs = async () => {
    // Local filtering can be added here if needed, but for now we just use the local state
    console.log("Mock Refresh with filters:", { searchTerm, statusFilter, categoryFilter, projectFilter });
  };

  const handleCreateOrUpdateBOQ = async (data: any) => {
    setIsLoading(true);
    setTimeout(() => {
      if (editingItem) {
        setBoqData(prev => prev.map(item => item.id === editingItem.id ? { ...item, ...data } : item));
        toast.success("BOQ item updated successfully!");
      } else {
        const newItem = { id: Date.now(), ...data, status: "ACTIVE" };
        setBoqData(prev => [newItem, ...prev]);
        toast.success("BOQ item created successfully!");
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setIsLoading(false);
    }, 500);
  };

  const handleViewDetails = (item: BoqItem) => {
    setViewingItem(item);
    setIsViewModalOpen(true);
  };

  const handleEditClick = (item: BoqItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (itemToDelete) {
      setIsLoading(true);
      setTimeout(() => {
        setBoqData(prev => prev.filter(item => item.id !== itemToDelete));
        toast.success("BOQ item deleted successfully!");
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
        setIsLoading(false);
      }, 500);
    }
  };

  const handleUpdateActualsSubmit = async (data: {
    actual_quantity: number;
    actual_cost: number;
  }) => {
    if (activeItemForModal) {
      setBoqData(prev => prev.map(item => item.id === activeItemForModal.id ? { ...item, ...data } : item));
      toast.success("Actuals updated successfully!");
      setIsActualsModalOpen(false);
    }
  };

  const handleCreateVersion = async () => {
    toast.success("New BOQ version created! (Mock Mode)");
  };

  const handleExport = async (format: "excel" | "pdf" | "json") => {
    if (isExporting) return;
    if (boqData.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      setIsExporting(true);
      const firstItem = boqData[0];
      const isProjectLevel = projectFilter !== "all";

      const exportId =
        firstItem?.boq_group_id ||
        (isProjectLevel ? Number(projectFilter) : firstItem?.id);

      if (!exportId) {
        toast.error("Unable to determine export context");
        return;
      }

      const filters = {
        search: searchTerm || null,
        status: statusFilter === "all" ? null : statusFilter,
        category: categoryFilter === "all" ? null : categoryFilter,
        version_no:
          selectedVersion === "latest" ? null : Number(selectedVersion),
      };

      toast.loading(`Preparing ${format.toUpperCase()}...`, { id: "export" });
      const data = await boqService.exportBoq(
        exportId,
        format,
        isProjectLevel,
        filters,
      );

      const fileName = isProjectLevel
        ? `boq_project_${exportId}.${format === "json" ? "json" : format === "excel" ? "csv" : "pdf"}`
        : `boq_export_${exportId}.${format === "json" ? "json" : format === "excel" ? "csv" : "pdf"}`;

      if (format === "json") {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([data], {
          type:
            format === "excel"
              ? "text/csv;charset=utf-8;"
              : "application/pdf",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      toast.success(`${format.toUpperCase()} exported successfully!`, {
        id: "export",
      });
    } catch (apiError: any) {
      console.warn("Backend export failed, falling back to client-side generation", apiError);
      
      const dateStr = new Date().toISOString().split("T")[0];
      const projectName = projectFilter !== "all" ? projectMap[Number(projectFilter)] : "All_Projects";

      if (format === "pdf") {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("BOQ Management Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Project: ${projectName}`, 14, 30);
        doc.text(`Date: ${new Date().toLocaleString()}`, 14, 37);

        const tableData = boqData.map((item) => [
          item.item_name,
          item.category,
          `${item.quantity} ${item.unit}`,
          `₹${Number(item.unit_cost).toLocaleString()}`,
          `₹${Number(item.total_cost || 0).toLocaleString()}`,
          item.status,
        ]);

        autoTable(doc, {
          startY: 45,
          head: [["Item Name", "Category", "Qty & Unit", "Unit Cost", "Est. Total", "Status"]],
          body: tableData,
          headStyles: { fillColor: [37, 99, 235] },
        });

        doc.save(`BOQ_Report_${projectName}_${dateStr}.pdf`);
        toast.success("PDF generated successfully", { id: "export" });
      } else if (format === "excel") {
        exportToCSV(boqData, `BOQ_Report_${projectName}_${dateStr}.csv`, {
          item_name: "Item Name",
          category: "Category",
          quantity: "Quantity",
          unit: "Unit",
          unit_cost: "Unit Cost",
          total_cost: "Total Cost",
          status: "Status",
        });
        toast.success("Excel/CSV generated successfully", { id: "export" });
      } else {
        toast.error(`Export failed: ${apiError.message}`, { id: "export" });
      }
    } finally {
      setIsExporting(false);
      setIsExportMenuOpen(false);
    }
  };

  const openActualsModal = (item: BoqItem) => {
    setActiveItemForModal(item);
    setIsActualsModalOpen(true);
  };

  const openHistoryModal = (item: BoqItem) => {
    setActiveItemForModal(item);
    setIsHistoryModalOpen(true);
  };

  const filteredBoqData = useMemo(() => {
    return boqData;
  }, [boqData]);

  return (
    <>
      <Navbar
        title="Work & BOQ Management"
        breadcrumb={["Manager", "Work & BOQ", "BOQ Tracker"]}
      />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              BOQ & Cost Tracking
            </h1>
            <p className="text-slate-500 text-sm">
              Manage project estimations and track actual spending in real-time.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (projectFilter === "all") {
                  toast.error("Please select a project to analyze cost performance");
                  return;
                }
                setIsOptimizationModalOpen(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all ${
                projectFilter === "all"
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-blue-200 hover:scale-105"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Smart Cost Analysis
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
            >
              + Add BOQ Item
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Estimated Total"
            value={`₹${(summaryData?.estimated || filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.total_cost?.toString() || "0"), 0) / 10000000).toFixed(2)}Cr`}
            sub={summaryData ? `${summaryData.total_items} items` : "Across current items"}
            accent="text-primary"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Actual Spent"
            value={`₹${((summaryData?.actual || 0) / 10000000).toFixed(2)}Cr`}
            sub="Real-time recorded cost"
            accent="text-violet-500"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Cost Variance"
            value={`₹${((summaryData?.difference || 0) / 10000000).toFixed(2)}Cr`}
            sub="Budget efficiency"
            accent={(summaryData?.difference || 0) < 0 ? "text-rose-500" : "text-emerald-500"}
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Active Items"
            value={filteredBoqData.filter((i) => i.status === "ACTIVE" || i.status === "Ongoing").length.toString()}
            sub="Currently in progress"
            accent="text-amber-500"
            icon={<Layers className="w-5 h-5" />}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-slate-800">
          <div className="flex border-b border-slate-100 bg-slate-50/30">
            <button
              onClick={() => setActiveTab("tracking")}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "tracking"
                  ? "bg-white text-primary border-b-2 border-primary"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Cost Tracking
            </button>
            <button
              onClick={() => setActiveTab("analysis")}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "analysis"
                  ? "bg-white text-primary border-b-2 border-primary"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              Smart Analysis
            </button>
            <button
              onClick={() => setActiveTab("setup")}
              className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === "setup"
                  ? "bg-white text-primary border-b-2 border-primary"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              BOQ Master Setup
            </button>
          </div>

          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search items or categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none"
              >
                <option value="all">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="DRAFT">Draft</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none"
              >
                <option value="all">All Projects</option>
                {Object.entries(projectMap).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>

              <button
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50">
                  <button onClick={() => handleExport("excel")} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> CSV (.csv)
                  </button>
                  <button onClick={() => handleExport("pdf")} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                    <FileText className="w-4 h-4 text-rose-500" /> PDF Report
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-slate-500 font-medium">Loading data...</p>
              </div>
            ) : activeTab === "tracking" ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Qty & Unit</th>
                    <th className="px-6 py-4">Est. Total</th>
                    <th className="px-6 py-4">Actual Spent</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {boqData.length > 0 ? (
                    boqData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group text-slate-800">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">{item.item_name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{projectMap[item.project_id] || "N/A"}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{item.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">{item.quantity} <span className="text-slate-400 font-medium">{item.unit}</span></p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">₹{Number(item.total_cost || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">₹{Number(item.actual_cost || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                            item.status === "ACTIVE" || item.status === "Ongoing" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                            item.status === "COMPLETED" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                            "bg-slate-100 text-slate-500 border border-slate-200"
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleViewDetails(item)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleEditClick(item)} className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit Item">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteClick(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete Item">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                            <Layers className="w-8 h-8 text-slate-200" />
                          </div>
                          <p className="text-slate-400 font-medium">No BOQ items found</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="py-20 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-slate-400 font-medium">Analytics for {activeTab} are loading...</p>
                <button className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg">
                  Refresh {activeTab} Data
                </button>
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      <CreateBOQModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleCreateOrUpdateBOQ}
        projects={projectsList}
        initialData={editingItem || undefined}
      />

      <BOQDetailsModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        item={viewingItem}
        projectName={viewingItem ? projectMap[viewingItem.project_id] : ""}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete BOQ Item"
        message="Are you sure you want to delete this BOQ item? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      <OptimizationModal
        isOpen={isOptimizationModalOpen}
        onClose={() => setIsOptimizationModalOpen(false)}
        projectId={Number(projectFilter)}
      />
    </>
  );
};

export default ManagerBOQPage;
