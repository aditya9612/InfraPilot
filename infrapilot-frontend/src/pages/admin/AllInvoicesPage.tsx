import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Eye,
  Trash2,
  Download,
  Plus,
  ChevronDown,
  Layers,
  Users,
  Package,
  Send
} from "lucide-react";
import SortDropdown from "../../components/common/SortDropdown";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { quotationService } from "../../services/quotationService";
import type { Quotation } from "../../types/quotation";
import toast from "react-hot-toast";
import { formatCompactCurrency } from "../../utils/currencyUtils";
import { exportToCSV } from "../../utils/csvExport";
import CreateInvoiceModal from "../../components/forms/CreateInvoiceModal";
import InvoiceDetailsModal from "../../components/dashboard/InvoiceDetailsModal";
import ClientSelectionModal from "../../components/forms/ClientSelectionModal";
import { financeService } from "../../services/financeService";
import { projectService } from "../../services/projectService";
import { ownerService } from "../../services/ownerService";
import type { Project } from "../../types/project";
import type { Invoice, InvoiceType } from "../../types/invoice";



const STATUS_BADGE: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-600",
  draft: "bg-slate-100 text-slate-600",
  converted: "bg-amber-100 text-amber-600",
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-orange-100 text-orange-700",
};

const AllInvoicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [owners, setOwners] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState(searchParams.get("type") || "all");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCreateType, setActiveCreateType] = useState<InvoiceType>("owner");
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState<"invoices" | "quotations">("invoices");
  const [sendTarget, setSendTarget] = useState<{ id: number; isQuotation: boolean } | null>(null);

  const PAGE_SIZE = 10;

  const setType = (type: string) => {
    setSearchParams({ type });
    setTypeFilter(type);
    setCurrentPage(0);
    setSearchTerm("");
    setStatusFilter("all");
  };

  useEffect(() => {
    const type = searchParams.get("type") || "all";
    if (type !== typeFilter) {
      setTypeFilter(type);
      setCurrentPage(0);
      setSearchTerm("");
      setStatusFilter("all");
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Fetch invoices, projects and owners first — don't block on slow quotation API
        const [invData, projData, ownersRes] = await Promise.all([
          financeService.getInvoices(200).catch(() => []),
          projectService.getProjects(100, 0).catch(() => []),
          ownerService.getOwners().catch(() => [])
        ]);
        setInvoices(Array.isArray(invData) ? invData : []);
        const projList = Array.isArray(projData)
          ? projData
          : projData.items || projData.data || [];
        setProjects(projList);
        setOwners(ownersRes);
      } catch (error) {
        console.error("Failed to load invoices/projects", error);
      } finally {
        setIsLoading(false);
      }

      // Fetch quotations independently — a timeout won't block the invoice tab
      quotationService.getQuotations()
        .then(quotData => setQuotations(quotData))
        .catch(error => {
          console.error("Failed to load quotations", error);
          toast.error("Quotations timed out — invoices still available. Try refreshing the page.");
        });
    };
    load();
  }, []);

  const handleCreateInvoice = async (data: any) => {
    try {
      if (data.type === "labour") {
        const { project_id, start_date, end_date } = data;
        await financeService.createLabourInvoice({ project_id, start_date, end_date });
      } else if (data.type === "material") {
        await financeService.createMaterialInvoice(data.project_id);
      } else if (data.type === "measurement") {
        await financeService.createInvoiceFromMeasurement(data.measurement_id);
      } else {
        await financeService.createInvoice(data);
      }
      toast.success("Invoice created successfully");
      setIsModalOpen(false);
      // Refresh invoice list
      const invData = await financeService.getInvoices(200);
      setInvoices(Array.isArray(invData) ? invData : []);
    } catch (error: any) {
      toast.error(error.message || "Failed to create invoice");
    }
  };



  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const itemToDelete = displayData.find((d: any) => d.id === deleteTarget);
      if (itemToDelete?.isQuotation) {
        await quotationService.deleteQuotation(deleteTarget);
        const data = await quotationService.getQuotations();
        setQuotations(data);
      } else {
        await financeService.deleteInvoice(deleteTarget);
        const invData = await financeService.getInvoices(200);
        setInvoices(Array.isArray(invData) ? invData : []);
      }
      toast.success("Deleted successfully");
    } catch (error) {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleSendItem = async (id: number, isQuotation: boolean, clientUserId?: number) => {
    try {
      if (isQuotation) {
        await quotationService.sendQuotation(id);
        toast.success("Quotation sent successfully!");
      } else {
        if (!clientUserId) {
          toast.error("Client selection required to send invoice");
          return;
        }
        await financeService.sendInvoice(id, { client_user_id: clientUserId });
        toast.success("Invoice sent successfully!");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.detail || "Failed to send item");
    }
  };

  const handleDownloadItemPDF = async (id: number) => {
    const toastId = toast.loading("Downloading PDF...");
    try {
      const blob = await financeService.getInvoicePdf(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_INV-${String(id).padStart(3, "0")}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("PDF Downloaded Successfully", { id: toastId });
    } catch (error: any) {
      toast.error("Failed to download PDF", { id: toastId });
      console.error("PDF Download error:", error);
    }
  };

  // Filtered data
  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchSearch =
        q.quotation_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        q.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchProject = projectFilter === "all" || String(q.project_id) === projectFilter;
      return matchSearch && matchStatus && matchProject;
    });
  }, [quotations, searchTerm, statusFilter, projectFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const proj = projects.find((p) => p.id === inv.project_id);
      const matchSearch =
        (proj?.project_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        `INV-${inv.id}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus =
        statusFilter === "all" ||
        inv.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchProject = projectFilter === "all" || String(inv.project_id) === projectFilter;
      return matchSearch && matchStatus && matchProject;
    });
  }, [invoices, projects, searchTerm, statusFilter, projectFilter]);

  const unifiedAllData = useMemo(() => {
    // Map converted quotations to invoice-like structure
    const mappedQuotations = filteredQuotations.map(q => ({
      id: q.id,
      isQuotation: true,
      invoice_no: q.quotation_no || `QTN-${q.id}`,
      project_name: q.project_name || "Unknown Project",
      description: "Converted from quotation",
      type: "invoice",
      amount: q.subtotal || 0,
      total_amount: q.grand_total || 0,
      status: "converted",
      created_at: q.created_at
    }));

    const mappedInvoices = filteredInvoices.map(inv => {
      const proj = projects.find(p => p.id === inv.project_id);
      const owner = owners.find((o: any) => String(o.id) === String(inv.owner_id));
      return {
        ...inv,
        isQuotation: false,
        invoice_no: `INV-${String(inv.id).padStart(3, "0")}`,
        project_name: proj?.project_name || `Project #${inv.project_id}`,
        owner_name: owner?.name || (inv.owner_id ? `Owner #${inv.owner_id}` : "-")
      };
    });

    const combined = [...mappedInvoices, ...mappedQuotations];

    const finalFiltered = combined.filter(item => {
      if (typeFilter === "all") return true;
      if (typeFilter === "invoice") return item.isQuotation || item.type === "owner";
      return item.type?.toLowerCase() === typeFilter.toLowerCase();
    });

    return finalFiltered.sort((a, b) => {
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return sortOrder === "latest" ? bDate - aDate : aDate - bDate;
    });
  }, [filteredInvoices, filteredQuotations, projects, sortOrder, typeFilter]);

  const displayData = activeTab === "quotations"
    ? filteredQuotations.map(q => ({
      id: q.id,
      isQuotation: true,
      client_user_id: q.client_user_id,
      invoice_no: q.quotation_no || `QTN-${q.id}`,
      project_name: q.project_name || "Unknown Project",
      client_name: q.client_name,
      description: "Quotation",
      type: "quotation",
      amount: q.subtotal || 0,
      gst_amount: q.gst_amount || 0,
      tax_amount: q.tds_amount || 0,
      total_amount: q.grand_total || 0,
      paid_amount: q.advance_paid || 0,
      pending_amount: q.balance_due || 0,
      status: q.status || "draft",
      created_at: q.created_at
    }))
    : unifiedAllData.filter(d => !d.isQuotation);

  const totalPages = Math.max(1, Math.ceil(displayData.length / PAGE_SIZE));
  const pagedData = displayData.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, statusFilter, typeFilter, activeTab, projectFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = displayData.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
    const pending = displayData.reduce((s, i: any) => s + (Number(i.pending_amount) || (Number(i.total_amount) - (Number(i.paid_amount) || 0)) || 0), 0);
    const paid = displayData.reduce((s, i: any) => s + (Number(i.paid_amount) || 0), 0);
    return { total, pending, paid };
  }, [displayData]);

  const handleExportAll = () => {
    if (displayData.length === 0) { toast.error("No data to export."); return; }
    const csvData = displayData.map((item) => ({
      id: item.invoice_no,
      type: item.type,
      project: item.project_name,
      description: item.description,
      amount: item.total_amount,
      status: item.status,
      date: item.created_at ? new Date(item.created_at).toLocaleDateString() : "-",
    }));
    exportToCSV(csvData, `invoice_portfolio_${new Date().toISOString().split("T")[0]}.csv`, {
      id: "Invoice #", type: "Type", project: "Project", description: "Description",
      amount: "Amount (₹)", status: "Status", date: "Date",
    });
    toast.success(`Exported ${displayData.length} records to CSV!`);
  };

  const openCreateModal = (type: InvoiceType) => {
    setActiveCreateType(type);
    setIsModalOpen(true);
  };

  return (
    <>
      <Navbar
        title={typeFilter === "labour" ? "Labour Invoices" : typeFilter === "material" ? "Material Invoices" : "Estimates & Invoices"}
        breadcrumb={["Dashboard", "Invoices", typeFilter === "all" ? "Portfolio" : typeFilter.charAt(0).toUpperCase() + typeFilter.slice(1)]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                {typeFilter === "labour" ? "Labour Invoices" : typeFilter === "material" ? "Material Invoices" : "Invoice Portfolio"}
              </h1>
              <p className="text-sm text-slate-500">Track and manage all client estimates and final invoices.</p>
            </div>
            <div className="flex gap-3">
              {/* 
              <button
                onClick={handleExportAll}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> Export
              </button>
              */}

              <div className="relative">
                <button
                  onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                  className="px-5 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-sm hover:bg-blue-600 transition-all flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Add Invoice <ChevronDown className={`w-4 h-4 transition-transform ${isAddDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAddDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsAddDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => { navigate("/admin/quotations"); setIsAddDropdownOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                        <FileText className="w-4 h-4 text-emerald-500" /> Quotation
                      </button>
                      <button
                        onClick={() => { openCreateModal("labour"); setIsAddDropdownOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                        <Users className="w-4 h-4 text-blue-500" /> Labour Invoice
                      </button>
                      <button
                        onClick={() => { openCreateModal("material"); setIsAddDropdownOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                        <Package className="w-4 h-4 text-purple-500" /> Material Invoice
                      </button>
                      <button
                        onClick={() => { openCreateModal("measurement" as any); setIsAddDropdownOpen(false); }}
                        className="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-3 transition-colors">
                        <Layers className="w-4 h-4 text-orange-500" /> Final Measurement
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>



          {/* TABS */}
          <div className="flex items-center gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm w-fit">
            <button
              onClick={() => { setActiveTab("invoices"); setCurrentPage(0); setSearchTerm(""); setStatusFilter("all"); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "invoices"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
            >
              <FileText className="w-4 h-4" />
              Invoices
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === "invoices" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>{invoices.length}</span>
            </button>
            <button
              onClick={() => { setActiveTab("quotations"); setCurrentPage(0); setSearchTerm(""); setStatusFilter("all"); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "quotations"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
            >
              <Layers className="w-4 h-4" />
              Quotations
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === "quotations" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>{quotations.length}</span>
            </button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Portfolio Value" value={formatCompactCurrency(stats.total)} sub={`${displayData.length} records`} accent="text-indigo-600" />
            <StatCard title="Pending" value={formatCompactCurrency(stats.pending)} sub="Requires action" accent="text-amber-500" />
            <StatCard title="Paid" value={formatCompactCurrency(stats.paid)} sub="Completed" accent="text-emerald-500" />
          </div>

          {/* TABLE CONTAINER */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search invoices, clients, descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                {activeTab !== "quotations" && (
                  <select
                    value={typeFilter}
                    onChange={(e) => setType(e.target.value)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
                  >
                    <option value="all">All Invoice</option>
                    <option value="invoice">Invoice</option>
                    <option value="labour">Labour</option>
                    <option value="material">Material</option>
                  </select>
                )}
                {activeTab !== "quotations" && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="partial">Partial</option>
                  </select>
                )}
                <select
                  value={projectFilter}
                  onChange={(e) => setProjectFilter(e.target.value)}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 outline-none shadow-sm md:max-w-[160px] truncate"
                >
                  <option value="all">All Projects</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={String(proj.id)}>
                      {proj.project_name}
                    </option>
                  ))}
                </select>
                <SortDropdown value={sortOrder} onChange={setSortOrder} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-4 py-4 whitespace-nowrap">Invoice #</th>
                    <th className="px-4 py-4 whitespace-nowrap">Project / Description</th>
                    <th className="px-4 py-4 whitespace-nowrap">Owner</th>
                    <th className="px-4 py-4 whitespace-nowrap">Type</th>
                    <th className="px-4 py-4 whitespace-nowrap">Source Type</th>
                    <th className="px-4 py-4 text-right whitespace-nowrap">Base Amount</th>
                    <th className="px-4 py-4 text-right whitespace-nowrap">GST Amount</th>
                    <th className="px-4 py-4 text-right whitespace-nowrap">Tax Amount</th>
                    <th className="px-4 py-4 text-right whitespace-nowrap">Total Amount</th>
                    <th className="px-4 py-4 text-right whitespace-nowrap">Paid Amount</th>
                    <th className="px-4 py-4 text-right whitespace-nowrap">Pending Amount</th>
                    <th className="px-4 py-4 whitespace-nowrap">Status</th>
                    <th className="px-4 py-4 whitespace-nowrap">Date</th>
                    <th className="px-4 py-4 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={16} className="px-6 py-20 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
                      </td>
                    </tr>
                  ) : pagedData.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="px-6 py-20 text-center">
                        <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No records found</p>
                      </td>
                    </tr>
                  ) : (
                    pagedData.map((inv: any) => {
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 py-4 text-sm font-black text-slate-800 whitespace-nowrap">
                            {inv.invoice_no}
                          </td>
                          <td className="px-4 py-4">
                            <p className="text-sm font-bold text-slate-700 whitespace-nowrap">{inv.project_name || "Unknown Project"}</p>
                            <p className="text-xs text-slate-400 line-clamp-1 max-w-[180px]">{inv.description}</p>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-700 whitespace-nowrap font-semibold">
                            {inv.owner_name || "-"}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest whitespace-nowrap ${inv.type === "labour" ? "bg-blue-100 text-blue-600" :
                              inv.type === "material" ? "bg-purple-100 text-purple-600" : "bg-emerald-100 text-emerald-600"
                              }`}>
                              {inv.type || "-"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                            {inv.source_type || "-"}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-slate-700 text-right tabular-nums whitespace-nowrap">
                            {formatCompactCurrency(Number(inv.amount) || 0)}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-indigo-600 text-right tabular-nums whitespace-nowrap">
                            {formatCompactCurrency(Number(inv.gst_amount) || 0)}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-purple-600 text-right tabular-nums whitespace-nowrap">
                            {formatCompactCurrency(Number(inv.tax_amount) || 0)}
                          </td>
                          <td className="px-4 py-4 text-sm font-black text-slate-800 text-right tabular-nums whitespace-nowrap">
                            {formatCompactCurrency(Number(inv.total_amount) || 0)}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-emerald-600 text-right tabular-nums whitespace-nowrap">
                            {formatCompactCurrency(Number(inv.paid_amount) || 0)}
                          </td>
                          <td className="px-4 py-4 text-sm font-bold text-amber-600 text-right tabular-nums whitespace-nowrap">
                            {formatCompactCurrency(Number(inv.pending_amount) || 0)}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${STATUS_BADGE[inv.status || "pending"] || "bg-emerald-100 text-emerald-600"}`}>
                              {inv.status || "pending"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500 whitespace-nowrap">
                            {inv.invoice_date || inv.created_at ? new Date(inv.invoice_date || inv.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  if (inv.id) {
                                    if (inv.isQuotation) {
                                      handleSendItem(inv.id, true);
                                    } else {
                                      setSendTarget({ id: inv.id, isQuotation: false });
                                    }
                                  }
                                }}
                                className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title={inv.isQuotation ? "Send Quotation" : "Send Invoice"}
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              {inv.isQuotation && (
                                <Link
                                  to={`/admin/quotations/view/${inv.id}`}
                                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Link>
                              )}
                              {!inv.isQuotation && (
                                <button
                                  onClick={async () => {
                                    try {
                                      const detailedInvoice = await financeService.getInvoiceById(inv.id);
                                      setViewingInvoice(detailedInvoice);
                                    } catch (error) {
                                      toast.error("Failed to fetch invoice details");
                                      setViewingInvoice(inv as Invoice);
                                    }
                                  }}
                                  className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                  title="View Invoice"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => inv.id && setDeleteTarget(inv.id)}
                                className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Delete Invoice"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, displayData.length)} of {displayData.length} records
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700">
                    {currentPage + 1}
                  </div>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </PageTransition>

      <ConfirmationModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete Record"
        message="Are you sure you want to permanently delete this record? This action cannot be undone."
        confirmLabel="Delete"
        confirmClass="bg-rose-500 hover:bg-rose-600 shadow-rose-200"
      />

      <ClientSelectionModal
        isOpen={sendTarget !== null}
        onClose={() => setSendTarget(null)}
        onSelect={(clientId) => {
          if (sendTarget) {
            handleSendItem(sendTarget.id, sendTarget.isQuotation, clientId);
            setSendTarget(null);
          }
        }}
        title={`Select Client to Send ${sendTarget?.isQuotation ? 'Quotation' : 'Invoice'}`}
      />

      <CreateInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateInvoice}
        initialType={activeCreateType}
        projects={projects}
      />

      <InvoiceDetailsModal
        isOpen={viewingInvoice !== null}
        onClose={() => setViewingInvoice(null)}
        invoice={viewingInvoice}
        projects={projects}
        owners={owners}
        onMarkPaid={async (id) => {
          try {
            await financeService.markInvoicePaid(id);
            toast.success("Invoice marked as paid!");
            const invData = await financeService.getInvoices(200);
            setInvoices(Array.isArray(invData) ? invData : []);
            setViewingInvoice(null);
          } catch { toast.error("Failed to update status"); }
        }}
        onDownloadPDF={handleDownloadItemPDF}
        onSendInvoice={(id) => {
          setViewingInvoice(null);
          setSendTarget({ id, isQuotation: false });
        }}
      />
    </>
  );
};

export default AllInvoicesPage;
