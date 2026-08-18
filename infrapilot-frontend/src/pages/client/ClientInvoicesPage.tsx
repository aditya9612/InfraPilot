import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  FileSpreadsheet,
  Eye,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  CreditCard,
  Calendar,
  X,
  Filter,
  ChevronDown
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import InvoiceDetailsModal from "../../components/dashboard/InvoiceDetailsModal";
import { financeService } from "../../services/financeService";
import { projectService } from "../../services/projectService";
import { paymentService } from "../../services/paymentService";
import { useClientProjectId } from "../../hooks/useClientProjectId";
import type { Project } from "../../types/project";
import type { Invoice } from "../../types/invoice";
import { generateInvoicePDF, generateInvoicesReportPDF } from "../../utils/invoicePDFGenerator";
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
  const { projectId } = useClientProjectId();

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(0);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);

  // Close download dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        downloadDropdownRef.current &&
        !downloadDropdownRef.current.contains(event.target as Node)
      ) {
        setIsDownloadOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const PAGE_SIZE = 10;

  // ── Initial Fetch ──
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [invData, projData, invSummary, paymentHistory] = await Promise.all([
          financeService.getInvoices(200).catch(() => []),
          projectService.getProjects(100, 0).catch(() => []),
          paymentService.getInvoiceSummary(projectId || undefined).catch(() => null),
          paymentService.getClientPaymentHistory(projectId || undefined).catch(() => []),
        ]);

        const paidInvIds = new Set<string>();
        if (Array.isArray(paymentHistory)) {
          paymentHistory.forEach((p: any) => {
            const s = String(p.payment_status || p.status || "").toUpperCase();
            if (s === "VERIFIED" || s === "PAID" || s === "APPROVED" || s === "COMPLETED" || s === "SUCCESS" || p.verified_by || p.verified_at) {
              if (p.invoice_id != null) paidInvIds.add(String(p.invoice_id));
              if (p.invoice_no) {
                const digits = String(p.invoice_no).replace(/\D/g, "");
                if (digits) paidInvIds.add(digits);
              }
              if (p.invoiceNo) {
                const digits = String(p.invoiceNo).replace(/\D/g, "");
                if (digits) paidInvIds.add(digits);
              }
            }
          });
        }

        const rawList = Array.isArray(invData) ? invData : (invData as any)?.items || [];
        const syncedInvoices: Invoice[] = rawList.map((inv: any) => {
          const invDigits = String(inv.id || "").replace(/\D/g, "");
          const isPaid = paidInvIds.has(String(inv.id)) || (invDigits && paidInvIds.has(invDigits)) || (inv.status || "").toLowerCase() === "paid";
          return isPaid ? { ...inv, status: "paid" } : inv;
        });
        setInvoices(syncedInvoices);

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
  }, [projectId]);

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

  // ── Invoices Scoped to Selected Project ──
  const selectedProjectInvoices = useMemo(() => {
    if (!projectId) return invoices;
    return invoices.filter((inv) => Number(inv.project_id) === Number(projectId));
  }, [invoices, projectId]);

  // ── Statistics calculation ──
  const stats = useMemo(() => {
    const totalCount = selectedProjectInvoices.length;
    const totalBilled = selectedProjectInvoices.reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);
    const totalPaid = selectedProjectInvoices
      .filter((inv) => inv.status?.toLowerCase() === "paid")
      .reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);
    const totalPending = selectedProjectInvoices
      .filter((inv) => inv.status?.toLowerCase() === "pending" || inv.status?.toLowerCase() === "partial")
      .reduce((acc, inv) => acc + (Number(inv.total_amount) || 0), 0);

    return {
      totalCount: summaryData?.total_invoices ?? totalCount,
      totalBilled: summaryData?.total_billed ?? totalBilled,
      totalPaid: summaryData?.paid_amount ?? totalPaid,
      totalPending: summaryData?.pending_amount ?? totalPending,
    };
  }, [selectedProjectInvoices, summaryData]);

  // ── Filtered & Paginated List ──
  const filteredInvoices = useMemo(() => {
    return selectedProjectInvoices.filter((inv) => {
      // Search
      const search = searchTerm.toLowerCase().trim();
      const proj = projects.find((p) => Number(p.id) === Number(inv.project_id));
      const projName = (proj?.project_name || (proj as any)?.name || "").toLowerCase();
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

      return matchesSearch && matchesStatus;
    });
  }, [selectedProjectInvoices, projects, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / PAGE_SIZE) || 1;
  const pagedInvoices = filteredInvoices.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  const handleDownloadPDF = (invoice: Invoice) => {
    try {
      const proj = projects.find((p) => Number(p.id) === Number(invoice.project_id));
      generateInvoicePDF(invoice, proj);
      toast.success(`Invoice INV-${String(invoice.id).padStart(3, "0")} downloaded`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF");
    }
  };

  const handleExportPDF = () => {
    if (filteredInvoices.length === 0) {
      toast.error("No invoices to export");
      return;
    }
    try {
      generateInvoicesReportPDF(filteredInvoices, projects, stats);
      toast.success("Invoices report PDF downloaded");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF report");
    }
  };

  const handleExportCSV = () => {
    if (filteredInvoices.length === 0) {
      toast.error("No invoices to export");
      return;
    }
    const data = filteredInvoices.map((inv) => {
      const proj = projects.find((p) => Number(p.id) === Number(inv.project_id));
      return {
        "Invoice ID": `INV-${String(inv.id).padStart(3, "0")}`,
        "Project": proj?.project_name || (proj as any)?.name || `Project #${inv.project_id}`,
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

        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
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
              {/* Download Dropdown */}
              <div className="relative" ref={downloadDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDownloadOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-primary" />
                  <span>Download</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                      isDownloadOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDownloadOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        handleExportPDF();
                        setIsDownloadOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-rose-50/60 transition-colors flex items-center gap-3 group cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-rose-600 transition-colors">
                          Download PDF
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Invoices statement (.pdf)
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleExportCSV();
                        setIsDownloadOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-emerald-50/60 transition-colors flex items-center gap-3 group cursor-pointer mt-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-emerald-600 transition-colors">
                          Download CSV
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Spreadsheet data (.csv)
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
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
                  <option value="all">Status</option>
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
                      const proj = projects.find((p) => Number(p.id) === Number(inv.project_id));
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
                            {proj?.project_name || (proj as any)?.name || `Project #${inv.project_id}`}
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
