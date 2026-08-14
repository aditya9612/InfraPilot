import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Building2,
  Calendar,
  X,
  Filter
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import InvoiceDetailsModal from "../../components/dashboard/InvoiceDetailsModal";
import { financeService } from "../../services/financeService";
import { projectService } from "../../services/projectService";
import { paymentService } from "../../services/paymentService";
import type { Project } from "../../types/project";
import type { Invoice } from "../../types/invoice";
import { generateInvoicePDF } from "../../utils/invoicePDFGenerator";
import { formatCompactCurrency } from "../../utils/currencyUtils";
import { exportToCSV } from "../../utils/csvExport";
import toast from "react-hot-toast";

const STATUS_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  approved: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  paid: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  partial: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  pending: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  draft: { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200" },
  cancelled: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
  overdue: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" },
};

const ClientInvoicesPage = () => {
  const { invoiceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const PAGE_SIZE = 10;

  // ── Initial Fetch ──
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [invData, projData, invSummary] = await Promise.all([
          financeService.getInvoices(200).catch(() => []),
          projectService.getProjects(100, 0).catch(() => []),
          paymentService.getInvoiceSummary().catch(() => null),
        ]);

        const invList = Array.isArray(invData) ? invData : (invData as any)?.items || [];
        setInvoices(invList);

        const projList = Array.isArray(projData)
          ? projData
          : (projData as any)?.items || (projData as any)?.data || [];
        setProjects(projList);

        if (invSummary) {
          setSummaryData(invSummary);
        }
      } catch (err) {
        console.error("Failed to fetch client invoices:", err);
        toast.error("Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // ── Deep Linking: Handle :invoiceId param or ?id= query param ──
  useEffect(() => {
    const targetId = invoiceId || searchParams.get("id") || searchParams.get("invoice_id");
    if (!targetId) return;

    // Try finding in loaded invoices
    const cleanId = String(targetId).replace(/\D/g, "");
    const found = invoices.find(
      (inv) =>
        String(inv.id) === String(targetId) ||
        String(inv.id) === cleanId ||
        inv.invoice_number === targetId ||
        `INV-${String(inv.id).padStart(3, "0")}` === targetId
    );

    if (found) {
      setViewingInvoice(found);
    } else if (!isLoading && cleanId) {
      // Direct fetch if not yet in array
      financeService
        .getInvoiceById(Number(cleanId))
        .then((singleInv) => {
          if (singleInv) setViewingInvoice(singleInv);
        })
        .catch((e) => console.warn("Could not find deep-linked invoice:", e));
    }
  }, [invoiceId, searchParams, invoices, isLoading]);

  // ── Statistics calculation ──
  const stats = useMemo(() => {
    const totalCount = invoices.length;
    const totalBilled = invoices.reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);
    const totalPaid = invoices
      .filter((inv) => inv.status?.toLowerCase() === "paid")
      .reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);
    const totalPending = invoices
      .filter((inv) => inv.status?.toLowerCase() === "pending" || inv.status?.toLowerCase() === "partial")
      .reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);

    return {
      totalCount: summaryData?.total_invoices ?? totalCount,
      totalBilled: summaryData?.total_billed ?? totalBilled,
      totalPaid: summaryData?.paid_amount ?? totalPaid,
      totalPending: summaryData?.pending_amount ?? totalPending,
    };
  }, [invoices, summaryData]);

  // ── Filtered & Paginated List ──
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      // Search
      const search = searchTerm.toLowerCase().trim();
      const proj = projects.find((p) => p.id === inv.project_id);
      const projName = (proj?.name || "").toLowerCase();
      const invNum = `inv-${String(inv.id).padStart(3, "0")}`.toLowerCase();
      const desc = (inv.description || "").toLowerCase();
      const amtStr = String(inv.total_amount || "");

      const matchesSearch =
        !search ||
        String(inv.id).includes(search) ||
        invNum.includes(search) ||
        projName.includes(search) ||
        desc.includes(search) ||
        amtStr.includes(search);

      // Status
      const matchesStatus =
        statusFilter === "all" ||
        inv.status?.toLowerCase() === statusFilter.toLowerCase();

      // Project
      const matchesProject =
        projectFilter === "all" || String(inv.project_id) === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [invoices, projects, searchTerm, statusFilter, projectFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / PAGE_SIZE) || 1;
  const pagedInvoices = filteredInvoices.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const handleDownloadPDF = (invoice: Invoice) => {
    try {
      const proj = projects.find((p) => p.id === invoice.project_id);
      generateInvoicePDF(invoice, proj);
      toast.success(`Invoice INV-${String(invoice.id).padStart(3, "0")} downloaded`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF");
    }
  };

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.error("No invoices to export");
      return;
    }
    const data = filteredInvoices.map((inv) => {
      const proj = projects.find((p) => p.id === inv.project_id);
      return {
        "Invoice ID": `INV-${String(inv.id).padStart(3, "0")}`,
        "Project": proj?.name || `Project #${inv.project_id}`,
        "Issue Date": inv.created_at?.split("T")[0] || "—",
        "Due Date": inv.due_date || "—",
        "Amount (INR)": inv.total_amount || 0,
        "Status": inv.status?.toUpperCase() || "PENDING",
        "Description": inv.description || "Service",
      };
    });
    exportToCSV(data, `Client_Invoices_${new Date().toISOString().split("T")[0]}`);
    toast.success("Invoices exported to CSV");
  };

  const handleCloseDetailModal = () => {
    setViewingInvoice(null);
    if (invoiceId) {
      navigate("/client/invoices", { replace: true });
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50/60 pb-16 font-inter">
        <Navbar title="Invoices" breadcrumb={["Client", "Invoices"]} />

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                <span>Client Portal</span>
                <span>&gt;</span>
                <span className="text-primary font-black">Invoices</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Client Invoices
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Review, monitor, and download project invoices & billing schedules.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Invoices"
              value={stats.totalCount.toString()}
              icon={<FileText className="w-5 h-5" />}
              variant="default"
              subtitle="All billed records"
            />
            <StatCard
              title="Total Billed"
              value={formatCompactCurrency(stats.totalBilled)}
              icon={<TrendingUp className="w-5 h-5" />}
              variant="default"
              subtitle="Aggregate billing volume"
            />
            <StatCard
              title="Paid Amount"
              value={formatCompactCurrency(stats.totalPaid)}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              variant="success"
              subtitle="Successfully settled"
            />
            <StatCard
              title="Pending Amount"
              value={formatCompactCurrency(stats.totalPending)}
              icon={<Clock className="w-5 h-5 text-amber-600" />}
              variant="warning"
              subtitle="Awaiting payment"
            />
          </div>

          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by invoice ID, project, description..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(0);
                }}
                className="w-full pl-10 pr-4 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-primary focus:bg-white transition-all text-slate-800 placeholder:text-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Project Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={projectFilter}
                  onChange={(e) => {
                    setProjectFilter(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer text-xs"
                >
                  <option value="all">All Projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(0);
                  }}
                  className="bg-transparent font-semibold text-slate-700 outline-none cursor-pointer text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                  <option value="approved">Approved</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="px-5 py-4">Invoice No</th>
                    <th className="px-5 py-4">Project</th>
                    <th className="px-5 py-4">Issue Date</th>
                    <th className="px-5 py-4">Due Date</th>
                    <th className="px-5 py-4">Description</th>
                    <th className="px-5 py-4 text-right">Amount</th>
                    <th className="px-5 py-4 text-center">Status</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {isLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <p>Loading invoices...</p>
                        </div>
                      </td>
                    </tr>
                  ) : pagedInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText className="w-10 h-10 text-slate-300 stroke-[1.5]" />
                          <p className="text-slate-600 font-bold text-sm">No Invoices Found</p>
                          <p className="text-xs text-slate-400">
                            {searchTerm || statusFilter !== "all"
                              ? "Try adjusting your filters or search terms."
                              : "No invoice records have been generated for your projects yet."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pagedInvoices.map((inv) => {
                      const proj = projects.find((p) => p.id === inv.project_id);
                      const statusStyle =
                        STATUS_BADGE[inv.status?.toLowerCase()] || STATUS_BADGE.pending;

                      return (
                        <tr
                          key={inv.id}
                          className="hover:bg-blue-50/20 transition-colors group cursor-pointer"
                          onClick={() => setViewingInvoice(inv)}
                        >
                          <td className="px-5 py-4 font-bold text-slate-900 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-blue-50 text-primary rounded-lg group-hover:scale-110 transition-transform">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <span className="font-mono text-xs font-black text-slate-900">
                                INV-{String(inv.id).padStart(3, "0")}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-700 font-semibold max-w-[200px] truncate">
                            {proj?.name || `Project #${inv.project_id}`}
                          </td>
                          <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{inv.created_at ? inv.created_at.split("T")[0] : "—"}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-slate-500 whitespace-nowrap">
                            {inv.due_date ? (
                              <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{inv.due_date}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-slate-600 max-w-[220px] truncate">
                            {inv.description || `${inv.type?.toUpperCase() || "Service"} billing`}
                          </td>
                          <td className="px-5 py-4 text-right font-black text-slate-900 whitespace-nowrap">
                            ₹{Number(inv.total_amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                            >
                              {inv.status || "Pending"}
                            </span>
                          </td>
                          <td
                            className="px-5 py-4 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setViewingInvoice(inv)}
                                className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="View Specifications"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDownloadPDF(inv)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4" />
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

            {/* Pagination Controls */}
            {filteredInvoices.length > PAGE_SIZE && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-400">
                  Showing {currentPage * PAGE_SIZE + 1}–
                  {Math.min((currentPage + 1) * PAGE_SIZE, filteredInvoices.length)} of{" "}
                  {filteredInvoices.length} Invoices
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    disabled={currentPage === 0}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-bold text-slate-700 px-2">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Invoice Specifications Detail Modal */}
        <InvoiceDetailsModal
          isOpen={!!viewingInvoice}
          onClose={handleCloseDetailModal}
          invoice={viewingInvoice}
          projects={projects}
          onMarkPaid={() => {}}
          onDownloadPDF={(id) => {
            const inv = invoices.find((i) => i.id === id);
            if (inv) handleDownloadPDF(inv);
          }}
        />
      </div>
    </PageTransition>
  );
};

export default ClientInvoicesPage;
