import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateBOQModal from "../../components/forms/CreateBOQModal";
import toast from "react-hot-toast";
import BOQDetailsModal from "../../components/dashboard/BOQDetailsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import { boqService } from "../../services/boqService";
import { approvalService } from "../../services/approvalService";
import { projectService } from "../../services/projectService";
import type { BoqItem, BoqSummary } from "../../types/boq";
import type { Project } from "../../types/project";
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
  Trash2,
  Pencil,
  FileCheck,
} from "lucide-react";
import OptimizationModal from "../../components/dashboard/OptimizationModal";
import BulkImportBOQModal from "../../components/forms/BulkImportBOQModal";
import ActivityDetailsModal from "../../components/dashboard/ActivityDetailsModal";
import { BOQ_CATEGORIES } from "../../config/constants";
import { formatCompactCurrency } from "../../utils/currencyUtils";

// Removing INITIAL_ACTIVITIES_DATA as we fetch from API

const BOQPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isSetup =
    location.pathname.includes("/setup") || location.pathname === "/admin/boq";

  // Data States
  const [boqData, setBoqData] = useState<BoqItem[]>([]);
  const [projectsList, setProjectsList] = useState<Project[]>([]);
  const [projectMap, setProjectMap] = useState<Record<number, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

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
  const [isActivityViewModalOpen, setIsActivityViewModalOpen] = useState(false);
  const [viewingActivity, setViewingActivity] = useState<any>(null);
  const [isActivityDeleteModalOpen, setIsActivityDeleteModalOpen] =
    useState(false);
  const [activityToDelete, setActivityToDelete] = useState<number | null>(null);

  // Fetch Projects and BOQs on mount
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        // Fetch projects first for the mapping
        const projectsRes = await projectService.getProjects(100);
        console.log("BOQ Page: Fetching projects...", projectsRes);
        const rawItems = (projectsRes as any)?.items || (Array.isArray(projectsRes) ? projectsRes : []);
        console.log(`BOQ Page: Found ${rawItems.length} projects.`);

        const sortedItems = [...rawItems].sort((a: any, b: any) => {
          const idA = a.id || a.project_id || 0;
          const idB = b.id || b.project_id || 0;
          return Number(idB) - Number(idA);
        });

        setProjectsList(sortedItems);

        const map: Record<number, string> = {};
        sortedItems.forEach((p: any) => {
          const pid = p.id || p.project_id;
          if (pid) map[pid] = p.project_name;
        });
        setProjectMap(map);

        // Fetch BOQ items
        await refreshBoqs();
      } catch (error) {
        toast.error("Failed to load initial data");
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const refreshBoqs = async () => {
    setIsLoading(true);
    try {
      const filters: any = {
        search: searchTerm || null,
        status: statusFilter === "all" ? null : statusFilter,
        category: categoryFilter === "all" ? null : categoryFilter,
        project_id: projectFilter === "all" ? null : Number(projectFilter),
        version_no:
          selectedVersion === "latest" ? null : Number(selectedVersion),
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };

      const res = await boqService.getBoqs(filters);

      // Filter out deleted and inactive items from the local state
      const activeItems = res.items.filter((item: any) =>
        item.status?.toLowerCase() !== 'deleted' &&
        item.status?.toLowerCase() !== 'inactive'
      );

      setBoqData(activeItems);
      // We set totalItems to the backend total if not filtered, 
      // or to the local length if we filtered out items to keep pagination consistent.
      setTotalItems(res.total || activeItems.length);

      // Also refresh summary if project is selected
      if (projectFilter !== "all") {
        const summary = await boqService.getBoqSummary(Number(projectFilter));
        setSummaryData(summary);
      } else {
        setSummaryData(null);
      }
    } catch (error) {
      console.error("Failed to refresh BOQs", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch versions when project filter changes
  useEffect(() => {
    const fetchVersions = async () => {
      if (projectFilter !== "all") {
        try {
          const versions = await boqService.getBoqVersions(
            Number(projectFilter),
          );
          setVersionsList(versions);
        } catch (error: any) {
          if (error.response?.status === 404) {
            setVersionsList([]);
          } else {
            console.error("Failed to fetch versions", error);
          }
        }
      } else {
        setVersionsList([]);
        setSelectedVersion("latest");
      }
    };
    fetchVersions();
  }, [projectFilter]);

  // Re-fetch when filters or page change
  useEffect(() => {
    if (!isLoading) {
      refreshBoqs();
    }
  }, [
    searchTerm,
    statusFilter,
    categoryFilter,
    projectFilter,
    selectedVersion,
    currentPage,
  ]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, categoryFilter, projectFilter, selectedVersion]);

  const handleCreateOrUpdateBOQ = async (data: any) => {
    try {
      if (editingItem) {
        await boqService.updateBoqItem(editingItem.id, data);
        toast.success("BOQ item updated successfully!");
      } else {
        const newItem = await boqService.createBoq(data);
        toast.success("BOQ item created successfully!");

        // Automatically request approval for new items
        try {
          await approvalService.createApproval({
            entity_type: "boq",
            entity_id: newItem.id,
            remarks: `Initial approval request for ${newItem.item_name}`,
          });
          toast.success("Approval request initiated!");
        } catch (approveErr) {
          console.error("Auto-approval error:", approveErr);
          toast.error("Failed to auto-initiate approval. Use manual action.");
        }
      }
      await refreshBoqs();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      toast.error(
        editingItem ? "Failed to update BOQ" : "Failed to create BOQ",
      );
    }
  };

  const handleViewDetails = (item: BoqItem) => {
    navigate(`/admin/boq/${item.project_id}`);
  };

  const handleRequestApproval = async (item: BoqItem) => {
    try {
      await approvalService.createApproval({
        entity_type: "boq",
        entity_id: item.id,
        remarks: `Requesting approval for BOQ item: ${item.item_name}`,
      });
      toast.success("Approval request sent successfully!");
      refreshBoqs();
    } catch (error) {
      toast.error("Failed to send approval request");
      console.error("Approval Request Error:", error);
    }
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
      try {
        await boqService.deleteBoq(itemToDelete);
        toast.success("BOQ item deleted successfully!");
        await refreshBoqs();
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
      } catch (error) {
        toast.error("Failed to delete BOQ item");
      }
    }
  };

  const handleDeleteActivityClick = (id: number) => {
    setActivityToDelete(id);
    setIsActivityDeleteModalOpen(true);
  };

  const handleDeleteActivityConfirm = async () => {
    if (activityToDelete) {
      try {
        await boqService.deleteBoq(activityToDelete);
        toast.success("Activity removed successfully!");
        await refreshBoqs();
        setIsActivityDeleteModalOpen(false);
        setActivityToDelete(null);
      } catch (error) {
        toast.error("Failed to delete activity");
      }
    }
  };

  const handleUpdateActualsSubmit = async (data: {
    actual_quantity: number;
    actual_cost: number;
  }) => {
    if (activeItemForModal) {
      try {
        await boqService.updateBoqActuals(activeItemForModal.id, data);
        toast.success("Actuals updated successfully!");
        await refreshBoqs();
      } catch (error) {
        toast.error("Failed to update actuals");
      }
    }
  };

  const handleCreateVersion = async () => {
    if (projectFilter === "all") {
      toast.error("Please select a project first");
      return;
    }

    const firstItem = boqData[0];
    if (!firstItem) {
      toast.error("No items found to version");
      return;
    }

    try {
      const res = await boqService.createBoqVersion(firstItem.id);
      toast.success(res.message || "New version created!");
      await refreshBoqs();
      if (res.version) {
        setSelectedVersion(res.version);
      }
    } catch (error) {
      toast.error("Failed to create new version");
    }
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
      console.warn(
        "Backend export failed, falling back to client-side generation",
        apiError,
      );

      const dateStr = new Date().toISOString().split("T")[0];
      const projectName =
        projectFilter !== "all"
          ? projectMap[Number(projectFilter)]
          : "All_Projects";

      if (format === "pdf") {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("BOQ Master Setup Report", 14, 22);
        doc.setFontSize(11);
        doc.text(`Project: ${projectName}`, 14, 30);
        doc.text(`Date: ${new Date().toLocaleString()}`, 14, 37);

        const tableData = boqData.map((item) => [
          item.item_name,
          item.category,
          `${item.quantity} ${item.unit}`,
          `₹${Number(item.unit_cost).toLocaleString()}`,
          `₹${Number(item.total_cost || 0).toLocaleString()}`,
          item.status === "Ongoing" || item.status === "ACTIVE"
            ? "Ongoing"
            : item.status,
        ]);

        autoTable(doc, {
          startY: 45,
          head: [
            [
              "Item Name",
              "Category",
              "Qty & Unit",
              "Unit Cost",
              "Est. Total",
              "Status",
            ],
          ],
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
        toast.error(
          `Export failed: ${apiError.response?.data?.detail || "Connection error"}`,
          { id: "export" },
        );
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

  // Memoized Filtered Logic (Frontend fallback filtering if needed,
  // but we are using server-side filtering now via refreshBoqs)
  const filteredBoqData = useMemo(() => {
    return [...boqData].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;

      if (dateA !== dateB) {
        return sortOrder === "latest" ? dateB - dateA : dateA - dateB;
      }
      return sortOrder === "latest" ? b.id - a.id : a.id - b.id;
    });
  }, [boqData, sortOrder]);

  // Filtered Activities Logic (Frontend filtering for mock/local data)
  const filteredActivities = useMemo(() => {
    return filteredBoqData.map(item => ({
      id: item.id,
      name: item.item_name,
      type: item.category,
      project: projectMap[item.project_id] || "N/A",
      status: item.is_completed ? "Completed" : (item.status === 'ACTIVE' || item.status === 'Ongoing') ? "Active" : item.status || "In Progress",
      created_at: item.created_at
    }));
  }, [
    filteredBoqData,
    projectMap,
  ]);

  return (
    <>
      <Navbar
        title="Work & BOQ Management"
        breadcrumb={[
          "Admin",
          "Work & BOQ",
          isSetup ? "BOQ Setup" : "Activity List",
        ]}
      />

      <PageTransition
        key={location.pathname}
        className="p-6 bg-slate-50 min-h-screen"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 h-8">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                {isSetup ? "BOQ Master Setup" : "Project Activity List"}
              </h1>
              <div className={`transition-all duration-300 ${projectFilter === "all" ? "w-0 opacity-0 overflow-hidden" : "w-24 opacity-100"}`}>
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider rounded-md border border-emerald-100 animate-pulse whitespace-nowrap">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                  Live Data
                </span>
              </div>
            </div>
            <p className="text-slate-500 text-sm">
              {isSetup
                ? "Define Bill of Quantities and cost estimates for projects."
                : "Track site activities and progress against BOQ items."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className={`min-w-[200px] px-4 py-2 border rounded-xl text-sm font-bold outline-none focus:ring-4 transition-all duration-300 ${projectFilter === "all"
                ? "bg-slate-50/50 border-slate-200 text-slate-500 hover:bg-slate-100"
                : "bg-white border-primary/30 text-primary shadow-lg shadow-primary/5 ring-2 ring-primary/5"
                }`}
            >
              <option value="all">📁 All Projects View</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.project_name}
                </option>
              ))}
            </select>
            <div className="h-6 w-px bg-slate-200 hidden md:block mx-1" />
            <button
              onClick={() => {
                if (projectFilter === "all") {
                  toast.error(
                    "Please select a project to analyze cost performance",
                  );
                  return;
                }
                setIsOptimizationModalOpen(true);
              }}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-lg transition-all duration-300 min-w-48 ${projectFilter === "all"
                ? "bg-slate-100 text-slate-400 cursor-not-allowed opacity-70"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-200 hover:scale-105"
                }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="truncate">
                {projectFilter === "all"
                  ? "Select Project for Analysis"
                  : "Smart Analysis"}
              </span>
            </button>
            <button
              onClick={() => {
                if (projectFilter === "all") {
                  toast.error("Please select a project before importing");
                  return;
                }
                setIsBulkImportModalOpen(true);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${projectFilter === "all"
                ? "bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed opacity-60"
                : "bg-white border border-primary/20 text-slate-700 hover:bg-slate-50 shadow-sm active:scale-95"
                }`}
            >
              <Download className={`w-4 h-4 ${projectFilter === "all" ? "text-slate-300" : "text-primary"}`} />
              Import Excel
            </button>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
            >
              {isSetup ? "+ Add BOQ Item" : "+ New Activity"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Estimated Total"
            value={formatCompactCurrency(summaryData?.estimated || filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.total_cost?.toString() || "0"), 0))}
            sub={
              summaryData
                ? `${summaryData.total_items} items total`
                : "Across filtered items"
            }
            accent="text-primary"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Actual Total"
            value={formatCompactCurrency(summaryData?.actual || filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.actual_cost?.toString() || "0"), 0))}
            sub="Recorded real-world costs"
            accent="text-violet-500"
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Variance/Difference"
            value={formatCompactCurrency(Math.abs(summaryData?.difference || (filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.total_cost?.toString() || "0"), 0) - filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.actual_cost?.toString() || "0"), 0))))}
            sub="Budget gap analysis"
            accent={
              (summaryData?.difference || (filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.total_cost?.toString() || "0"), 0) - filteredBoqData.reduce((acc, curr) => acc + parseFloat(curr.actual_cost?.toString() || "0"), 0))) < 0
                ? "text-rose-500"
                : "text-emerald-500"
            }
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <StatCard
            title="Pending Approval"
            value={filteredBoqData
              .filter((i) => i.status?.toLowerCase().includes("review") || i.status?.toLowerCase().includes("draft") || i.status?.toLowerCase().includes("pending"))
              .length.toString()}
            sub="Awaiting rate review"
            accent="text-amber-500"
            icon={<TrendingUp className="w-5 h-5" />}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden text-slate-800">
          {/* Enhanced Filter Bar */}
          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="relative flex-1 max-w-md">
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
                placeholder={
                  isSetup
                    ? "Search items or descriptions..."
                    : "Search activities..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="under review">Under Review</option>
                <option value="pending">Pending</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <option value="all">All Categories</option>
                {BOQ_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
              </select>


              {projectFilter !== "all" && versionsList.length > 0 && (
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={selectedVersion}
                      onChange={(e) =>
                        setSelectedVersion(
                          e.target.value === "latest"
                            ? "latest"
                            : Number(e.target.value),
                        )
                      }
                      className="bg-transparent text-xs font-bold text-slate-600 outline-none pr-1"
                    >
                      <option value="latest">Latest Ver.</option>
                      {versionsList.map((v) => (
                        <option key={v} value={v}>
                          Ver. {v}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  <button
                    onClick={handleCreateVersion}
                    title="Create New Version"
                    className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="relative">
                <button
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Export
                </button>

                {isExportMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={() => handleExport("excel")}
                      disabled={isExporting}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors ${isExporting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      CSV (.csv)
                    </button>
                    <button
                      onClick={() => handleExport("pdf")}
                      disabled={isExporting}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-all ${isExporting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <FileText className="w-4 h-4 text-rose-500" />
                      PDF Report
                    </button>
                    <button
                      onClick={() => handleExport("json")}
                      disabled={isExporting}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-all ${isExporting ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <FileJson className="w-4 h-4 text-amber-500" />
                      JSON Data
                    </button>
                  </div>
                )}
              </div>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block" />

              <div className="flex gap-2">
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isSetup ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  onClick={() => navigate("/admin/boq/setup")}
                >
                  BOQ Setup
                </button>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!isSetup ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  onClick={() => navigate("/admin/boq/activities")}
                >
                  Activities
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-slate-500 font-medium">
                  Loading BOQ data...
                </p>
              </div>
            ) : isSetup ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Qty & Unit</th>
                    <th className="px-6 py-4">Unit Cost</th>
                    <th className="px-6 py-4">Est. Total</th>
                    <th className="px-6 py-4">Variance</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Approval</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredBoqData.length > 0 ? (
                    filteredBoqData.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/50 transition-colors group text-slate-800"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-700 group-hover:text-primary transition-colors line-clamp-1">
                                {item.item_name}
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium line-clamp-1">
                              {projectMap[item.project_id] || "N/A"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                          {parseFloat(
                            item.quantity?.toString() || "0",
                          ).toLocaleString()}{" "}
                          <span className="text-[10px] text-slate-400 font-bold">
                            {item.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700">
                          {formatCompactCurrency(Number(item.unit_cost) || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-primary">
                          {formatCompactCurrency(Number(item.total_cost) || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-rose-500">
                          {formatCompactCurrency(Number(item.variance_cost) || 0)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${item.status?.toUpperCase() === "ONGOING" ||
                              item.status?.toUpperCase() === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-600"
                              : item.status?.toUpperCase() === "COMPLETED"
                                ? "bg-blue-100 text-blue-600"
                                : item.status?.toUpperCase() === "DRAFT"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-amber-100 text-amber-600"
                              }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.approval_status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                            item.approval_status === 'REJECTED' ? 'bg-rose-100 text-rose-600' :
                              item.approval_status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-600' :
                                'bg-slate-100 text-slate-500 border border-slate-200'
                            }`}>
                            {item.approval_status || 'PENDING'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openActualsModal(item)}
                              className="p-1.5 text-slate-400 hover:text-emerald-500 transition-all duration-200"
                              title="Update Actuals"
                            >
                              <TrendingUp
                                className="w-4.5 h-4.5"
                                strokeWidth={1.5}
                              />
                            </button>
                            {(item.approval_status === "PENDING" ||
                              item.approval_status === "DRAFT" ||
                              !item.approval_status) && (
                                <button
                                  onClick={() => handleRequestApproval(item)}
                                  className="p-1.5 text-slate-400 hover:text-blue-500 transition-all duration-200"
                                  title="Request Approval"
                                >
                                  <FileCheck
                                    className="w-4.5 h-4.5"
                                    strokeWidth={1.5}
                                  />
                                </button>
                              )}
                            <button
                              onClick={() => openHistoryModal(item)}
                              className="p-1.5 text-slate-400 hover:text-violet-500 transition-all duration-200"
                              title="View History"
                            >
                              <History
                                className="w-4.5 h-4.5"
                                strokeWidth={1.5}
                              />
                            </button>
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                              title="View Details"
                            >
                              <Eye className="w-4.5 h-4.5" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 text-slate-400 hover:text-amber-500 transition-all duration-200"
                              title="Update BOQ"
                            >
                              <Pencil
                                className="w-4.5 h-4.5"
                                strokeWidth={1.5}
                              />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                              title="Delete BOQ"
                            >
                              <Trash2
                                className="w-4.5 h-4.5"
                                strokeWidth={1.5}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-6 py-12 text-center text-slate-400 font-medium"
                      >
                        No items found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Activity Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Linked Project</th>
                    <th className="px-6 py-4">Progress Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((act) => (
                      <tr
                        key={act.id}
                        className="hover:bg-slate-50/50 transition-colors group text-slate-800"
                      >
                        <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-primary transition-colors">
                          {act.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                          {act.type}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                          {act.project}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${act.status === "Completed"
                              ? "bg-emerald-100 text-emerald-600"
                              : act.status === "In Progress"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-slate-100 text-slate-600"
                              }`}
                          >
                            {act.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => {
                                setViewingActivity(act);
                                setIsActivityViewModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-primary transition-all duration-200"
                              title="View Activity"
                            >
                              <Eye className="w-4.5 h-4.5" strokeWidth={1.5} />
                            </button>
                            <button
                              onClick={() => handleDeleteActivityClick(act.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-500 transition-all duration-200"
                              title="Delete Activity"
                            >
                              <Trash2
                                className="w-4.5 h-4.5"
                                strokeWidth={1.5}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-12 text-center text-slate-400 font-medium"
                      >
                        No activities found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination UI - Matched with UsersPage style */}
          <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} Entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter">
                {currentPage}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalItems / itemsPerPage), p + 1))}
                disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </PageTransition>

      <CreateBOQModal
        isOpen={isModalOpen}
        projects={projectsList}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSubmit={handleCreateOrUpdateBOQ}
        initialData={editingItem}
      />

      {viewingItem && (
        <BOQDetailsModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setViewingItem(null);
          }}
          boqItem={viewingItem}
          projectName={viewingItem ? projectMap[viewingItem.project_id] : ""}
        />
      )}

      <ActivityDetailsModal
        isOpen={isActivityViewModalOpen}
        onClose={() => {
          setIsActivityViewModalOpen(false);
          setViewingActivity(null);
        }}
        activity={viewingActivity}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setItemToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete BOQ Item"
        message="Are you sure you want to delete this BOQ item? This will remove the cost estimation for this specific item."
        confirmText="Delete"
        type="danger"
      />

      <ConfirmModal
        isOpen={isActivityDeleteModalOpen}
        onClose={() => {
          setIsActivityDeleteModalOpen(false);
          setActivityToDelete(null);
        }}
        onConfirm={handleDeleteActivityConfirm}
        title="Delete Activity"
        message="Are you sure you want to delete this activity? This will remove it from the project timeline."
        confirmText="Delete"
        type="danger"
      />

      <UpdateActualsModal
        isOpen={isActualsModalOpen}
        onClose={() => setIsActualsModalOpen(false)}
        onSubmit={handleUpdateActualsSubmit}
        initialData={
          activeItemForModal
            ? {
              item_name: activeItemForModal.item_name,
              actual_quantity: activeItemForModal.actual_quantity,
              actual_cost: activeItemForModal.actual_cost,
              quantity: activeItemForModal.quantity,
              unit: activeItemForModal.unit,
              total_cost: activeItemForModal.total_cost || "0",
            }
            : undefined
        }
      />

      {activeItemForModal && (
        <BOQHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          boqId={activeItemForModal.id}
          itemName={activeItemForModal.item_name}
        />
      )}

      <OptimizationModal
        isOpen={isOptimizationModalOpen}
        onClose={() => setIsOptimizationModalOpen(false)}
        projectId={projectFilter === "all" ? undefined : Number(projectFilter)}
      />

      <BulkImportBOQModal
        isOpen={isBulkImportModalOpen}
        onClose={() => setIsBulkImportModalOpen(false)}
        projectId={projectFilter === "all" ? 0 : Number(projectFilter)}
        onSuccess={refreshBoqs}
      />
    </>
  );
};

export default BOQPage;
