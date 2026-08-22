import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ConfirmModal from "../../components/common/ConfirmModal";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

import AccountantCreateInvoice from "./AccountantCreateInvoice";
import { quotationService } from "../../services/quotationService";
import api from "../../services/api";
import { projectService } from "../../services/projectService";
import { measurementService } from "../../services/measurementService";
import { financeService } from "../../services/financeService";
import { ownerService } from "../../services/ownerService";
import { Zap, Eye, Download, Trash, Pencil, CheckCircle, XCircle, ChevronLeft, ChevronRight, FileText, Send, Banknote, Check, X, User, Briefcase, AlertCircle } from "lucide-react";
import QuotationViewModal from "./QuotationViewModal";
import InvoiceViewModal from "./InvoiceViewModal";
import InvoiceEditModal from "./InvoiceEditModal";
import CreateManualReceivableModal from "../../components/forms/CreateManualReceivableModal";

const ProjectNameCell = ({ projectId, projects }: { projectId: number | string, projects: any[] }) => {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!projectId) {
      setName("—");
      return;
    }
    const p = projects.find(proj => String(proj.id) === String(projectId));
    if (p) {
      setName(p.name || p.project_name || p.client_name || String(projectId));
    } else {
      projectService.getProjectById(Number(projectId)).then(proj => {
        setName(proj.name || proj.project_name || String(projectId));
      }).catch(() => {
        setName(String(projectId));
      });
    }
  }, [projectId, projects]);

  return <>{name}</>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (v: any) => {
  const num = Number(v);
  if (isNaN(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(num);
};

const fmtExact = (v: any) => {
  const num = Number(v);
  if (isNaN(num)) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

const statusBadge = (s: any) => {
  if (!s || typeof s !== 'string') return "bg-slate-100 text-slate-500";
  const map: Record<string, string> = {
    paid: "bg-emerald-200 text-emerald-800",
    partial: "bg-amber-100 text-amber-700",
    draft: "bg-slate-100 text-slate-600",
    pending: "bg-slate-100 text-slate-600",
    overdue: "bg-rose-100 text-rose-700",
    received: "bg-emerald-100 text-emerald-700",
    certified: "bg-emerald-100 text-emerald-700",
    submitted: "bg-blue-100 text-blue-700",
    "pending approval": "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-700",
  };
  return map[s.toLowerCase()] || "bg-slate-100 text-slate-500";
};



// ─────────────────────────────────────────────────────────────────────────────
// Sub-sections
// ─────────────────────────────────────────────────────────────────────────────



const InvoicesSection = ({
  initialSubTab,
}: {
  initialSubTab?: string;
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"quotation_list" | "create" | "approval" | "invoice_list">(
    (initialSubTab as any) || "quotation_list"
  );
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const [viewQuotationId, setViewQuotationId] = useState<number | null>(null);

  const [deleteModalId, setDeleteModalId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportReceivables = async () => {
    try {
      toast.loading("Exporting receivables...", { id: "export-rec" });
      const blob = await financeService.exportReceivables();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Receivables_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Receivables Exported!", { id: "export-rec" });
    } catch (err: any) {
      toast.error(err.message || "Failed to export receivables", { id: "export-rec" });
    }
  };

  const handleImportReceivables = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading("Importing receivables...", { id: "import-rec" });
      const formData = new FormData();
      formData.append("file", file);
      await financeService.importReceivables(formData);
      toast.success("Receivables imported successfully!", { id: "import-rec" });
      // Optionally trigger a refresh
      const data = await quotationService.getQuotations();
      setInvoices(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to import receivables", { id: "import-rec" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    const fetchQuotations = async () => {
      try {
        const data = await quotationService.getQuotations();
        setInvoices(data);
      } catch (err) {
        console.error("Failed to fetch quotations:", err);
      }
    };
    const fetchProjects = async () => {
      try {
        const data = await projectService.getProjects();
        setProjects(Array.isArray(data) ? data : data.items || []);
      } catch (err) {
        console.error("Failed to fetch projects:", err);
      }
    };
    fetchQuotations();
    fetchProjects();
  }, []);

  const handleApprove = async (id: number) => {
    // Optimistic update to hide immediately
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, is_approved: true, status: "approved", payment_status: "Paid" } : inv));
    try {
      await quotationService.approveQuotation(id, "Quotation approved");
      toast.success("Quotation approved!");
    } catch (error: any) {
      toast.error(error.message || "Failed to approve quotation");
      // Revert on error
      const data = await quotationService.getQuotations();
      setInvoices(data);
    }
  };

  const handleReject = async (id: number) => {
    // Optimistic update to hide immediately
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, is_approved: false, status: "rejected", payment_status: "Overdue" } : inv));
    try {
      await quotationService.rejectQuotation(id, "Rejected");
      toast.success("Quotation rejected!");
    } catch (error: any) {
      toast.error(error.message || "Failed to reject quotation");
      // Revert on error
      const data = await quotationService.getQuotations();
      setInvoices(data);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalId) return;
    try {
      setIsDeleting(true);
      await quotationService.deleteQuotation(deleteModalId);

      // Refetch from server as requested
      const data = await quotationService.getQuotations();
      setInvoices(data);

      toast.success("Quotation deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete quotation");
    } finally {
      setIsDeleting(false);
      setDeleteModalId(null);
    }
  };

  const handleConvertToInvoice = async (inv: any) => {
    try {
      toast.loading("Converting to invoice...", { id: "convert-invoice" });
      const res = await api.post(`/invoices/from-quotation/${inv.id}`);
      const newInvoice = res.data;

      setInvoices(prev => {
        const updated = prev.map(p => p.id === inv.id ? { ...p, status: "converted" } : p);
        return [newInvoice, ...updated];
      });

      toast.success("Converted to invoice successfully!", { id: "convert-invoice" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to convert to invoice", { id: "convert-invoice" });
    }
  };

  const handleDownloadPDF = async (inv: any) => {
    try {
      toast.loading("Generating PDF...", { id: `pdf-${inv.id}` });
      const blob = await quotationService.downloadQuotationPDF(inv.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quotation_${inv.quotation_no || inv.invoice_number || inv.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("PDF Downloaded!", { id: `pdf-${inv.id}` });
    } catch (err: any) {
      toast.error(err.message || "Failed to download PDF", { id: `pdf-${inv.id}` });
    }
  };

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as any);
  }, [initialSubTab]);

  const subTabs = [
    { key: "create", label: "Create Quotation" },
    { key: "quotation_list", label: "Quotation List" },
    { key: "invoice_list", label: "Invoice List" },
  ] as const;

  const isConverted = (inv: any) => inv.status?.toLowerCase() === "converted" || inv.status?.toLowerCase() === "invoice";
  const isApprovedOrRejected = (inv: any) => inv.is_approved || inv.status?.toLowerCase() === "approved" || inv.status?.toLowerCase() === "rejected";

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedProject, selectedStatus, activeSubTab]);

  const filtered = [...invoices].filter(inv => {
    const matchSearch = (inv.quotation_no || inv.invoice_number || "").toLowerCase().includes(search.toLowerCase()) ||
      (inv.client_name || "").toLowerCase().includes(search.toLowerCase());
    const matchProject = selectedProject === "All" || inv.project_name === selectedProject;
    const matchStatus = selectedStatus === "All" || (inv.status || inv.payment_status || "draft").toLowerCase() === selectedStatus.toLowerCase();

    if (!matchSearch || !matchProject || !matchStatus) return false;

    if (activeSubTab === "quotation_list") return !isConverted(inv);
    if (activeSubTab === "invoice_list") return isConverted(inv);
    return true; // For "create"
  }).sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (dateA !== dateB) return dateB - dateA;
    return (b.id || 0) - (a.id || 0);
  });

  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const paginatedInvoices = filtered.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  // Stat calculations
  const allQuotations = invoices.filter(inv => !isConverted(inv));
  const activeQuotations = allQuotations.filter(inv => inv.status?.toLowerCase() !== "rejected" && inv.status?.toLowerCase() !== "declined");
  const totalPipelineValue = activeQuotations.reduce((sum, inv) => sum + (Number(inv.grand_total) || Number(inv.total_with_gst) || 0), 0);

  const approvedQuotationsCount = allQuotations.filter(inv => inv.status?.toLowerCase() === "approved" || inv.is_approved).length;
  const winRate = allQuotations.length > 0 ? Math.round((approvedQuotationsCount / allQuotations.length) * 100) : 0;

  const pendingDraftsCount = allQuotations.filter(inv => !inv.status || inv.status?.toLowerCase() === "draft").length;

  return (
    <div className="space-y-5">
      {activeSubTab === "quotation_list" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Pipeline Value</p>
            <p className="text-2xl font-bold text-blue-600">{fmt(totalPipelineValue)}</p>
            <p className="text-xs text-slate-400 mt-2">{activeQuotations.length} Active Quotations</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Win / Approval Rate</p>
            <p className="text-2xl font-bold text-emerald-500">{winRate}%</p>
            <p className="text-xs text-slate-400 mt-2">Based on all time</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Drafts</p>
            <p className="text-2xl font-bold text-orange-500">{pendingDraftsCount}</p>
            <p className="text-xs text-slate-400 mt-2">Requires admin review</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 flex-wrap">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => { setActiveSubTab(t.key); if (t.key !== 'create') setEditingInvoice(null); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-44 bg-white" />
          {activeSubTab === "quotation_list" && (
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer">
              <option value="All">ALL STATUS</option>
              <option value="Draft">DRAFT</option>
              <option value="Approved">APPROVED</option>
              <option value="Rejected">REJECTED</option>
            </select>
          )}
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer">
            <option value="All">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.project_name || p.name}>{p.project_name || p.name}</option>)}
          </select>
          <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.xlsx,.xls" onChange={handleImportReceivables} />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl hover:border-primary/30 hover:text-primary transition-all active:scale-95">
            📥 Import
          </button>
          <button
            onClick={handleExportReceivables}
            className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-3 py-2 rounded-xl hover:border-primary/30 hover:text-primary transition-all active:scale-95">
            📤 Export
          </button>
        </div>
      </div>

      {(activeSubTab === "quotation_list" || activeSubTab === "invoice_list") && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto pb-3 scrollbar-thin">
            <table className="w-full text-left min-w-max">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Quotation No", "Client Name", "Company Name", "Mobile Number", "Site Address", "Project Name", "Project Type", "Subtotal", "GST Amt", "TDS Amt", "Discount", "Grand Total", "Advance Paid", "Balance Due", "Payment Mode", "Status", "Created At", "Due Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap">
                    <td className="px-4 py-3 text-xs font-bold text-primary">{inv.quotation_no || inv.invoice_number}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{inv.client_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px] truncate">{inv.company_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.mobile_number}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{inv.site_address}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px] truncate">{inv.project_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.project_type}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmt(inv.subtotal ?? inv.amount ?? 0)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmt(inv.gst_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmt(inv.tds_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmt(inv.discount_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{fmt(inv.grand_total ?? inv.total_with_gst ?? 0)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-700">{fmt(inv.advance_paid ?? inv.received_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-rose-600">{fmt(inv.balance_due ?? inv.pending_amount ?? 0)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.payment_mode}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(inv.status || inv.payment_status)}`}>{inv.status || inv.payment_status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.created_at?.substring(0, 10)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.due_date}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-row gap-3 items-center justify-start flex-nowrap">
                        {activeSubTab === "quotation_list" && (
                          <>
                            {!isApprovedOrRejected(inv) && (
                              <>
                                <button onClick={() => handleApprove(inv.id)} className="text-emerald-500 hover:text-emerald-600 transition-colors" title="Approve">
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleReject(inv.id)} className="text-rose-500 hover:text-rose-600 transition-colors" title="Reject">
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {inv.status?.toLowerCase() !== "rejected" && (
                              <button onClick={() => handleConvertToInvoice(inv)} className="text-indigo-500 hover:text-indigo-600 transition-colors" title="Convert to Invoice">
                                <Zap className="w-4 h-4" />
                              </button>
                            )}
                          </>
                        )}

                        <button onClick={() => setViewQuotationId(inv.id)} className="text-slate-400 hover:text-primary transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {activeSubTab !== "invoice_list" && (
                          <button onClick={() => { setEditingInvoice(inv); setActiveSubTab("create"); }} className="text-slate-400 hover:text-amber-500 transition-colors" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDownloadPDF(inv)} className="text-slate-400 hover:text-slate-700 transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteModalId(inv.id)} className="text-slate-400 hover:text-rose-600 transition-colors" title="Delete">
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select
                value={recordsPerPage}
                onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white"
              >
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} - {Math.min(currentPage * recordsPerPage, filtered.length)} of {filtered.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "create" && (
        <AccountantCreateInvoice
          editingInvoice={editingInvoice}
          onCancel={() => { setActiveSubTab("quotation_list"); setEditingInvoice(null); }}
          onSave={async (data) => {
            try {
              if (editingInvoice) {
                const res = await quotationService.updateQuotation(editingInvoice.id, data);
                setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? { ...inv, ...res, amount: res.subtotal || data.subtotal, total_with_gst: res.grand_total || data.grand_total, pending_amount: res.balance_due || data.balance_due } : inv));
                toast.success("Invoice updated successfully!");
              } else {
                const res = await quotationService.createQuotation(data);

                const newInv = { ...res, amount: res.subtotal || data.subtotal, total_with_gst: res.grand_total || data.grand_total, pending_amount: res.balance_due || data.balance_due };
                setInvoices(prev => [newInv, ...prev]);
                toast.success("Quotation created successfully!");
              }
              setActiveSubTab("quotation_list");
              setEditingInvoice(null);
            } catch (err: any) {
              toast.error(err.message || "Failed to save quotation/invoice");
            }
          }}
        />
      )}

      {viewQuotationId && (
        <QuotationViewModal
          quotationId={viewQuotationId}
          onClose={() => setViewQuotationId(null)}
        />
      )}


      <ConfirmModal
        isOpen={!!deleteModalId}
        onClose={() => setDeleteModalId(null)}
        onConfirm={handleDeleteConfirm}
        title="Remove Quotation / Invoice"
        message="Are you sure you want to delete this record?"
        confirmText="Confirm Deletion"
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

// 2.5 Client Invoices Section
const ClientInvoicesSection = ({ initialSubTab }: { initialSubTab?: string; }) => {
  const [activeSubTab, setActiveSubTab] = useState<"create_labour" | "labour_list" | "create_material" | "material_list" | "create_measurement">(
    (initialSubTab as any) || "labour_list"
  );
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const [projects, setProjects] = useState<any[]>([]);
  const [labourInvoices, setLabourInvoices] = useState<any[]>([]);
  const [materialInvoices, setMaterialInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("All");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL INVOICE");

  const [viewInvoiceId, setViewInvoiceId] = useState<number | null>(null);
  const [editInvoiceId, setEditInvoiceId] = useState<number | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<number | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedProjectFilter, selectedStatus, selectedTypeFilter, activeSubTab]);

  useEffect(() => {
    if (activeSubTab === "labour_list") setSelectedTypeFilter("LABOUR");
    else if (activeSubTab === "material_list") setSelectedTypeFilter("MATERIAL");
  }, [activeSubTab]);

  // Fetch logic for list endpoints
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const projPromise = projectService.getProjects();
        let pRes: any = [];
        try { pRes = await projPromise; } catch (e) { console.error(e); }

        const projList = Array.isArray(pRes) ? pRes : (pRes.data || pRes.items || []);
        setProjects(projList);

        let invRes: any = { data: [] };
        try { invRes = await api.get('/invoices'); } catch (e) { console.error(e); }

        const allInvoices = Array.isArray(invRes.data) ? invRes.data : (invRes.data?.items || []);
        const sortedInvoices = [...allInvoices].sort((a: any, b: any) => b.id - a.id);
        setLabourInvoices(sortedInvoices);
        setMaterialInvoices(sortedInvoices);
      } catch (err: any) {
        console.error("Failed to fetch invoices data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeSubTab]);

  const refreshInvoices = async () => {
    try {
      const invRes = await api.get('/invoices');
      const allInvoices = Array.isArray(invRes.data) ? invRes.data : (invRes.data?.items || []);
      const sortedInvoices = [...allInvoices].sort((a: any, b: any) => b.id - a.id);
      setLabourInvoices(sortedInvoices);
      setMaterialInvoices(sortedInvoices);
    } catch (e) { console.error(e); }
  };

  const handleDeleteInvoice = async () => {
    if (!deleteInvoiceId) return;
    try {
      await api.delete(`/invoices/${deleteInvoiceId}`);
      toast.success("Invoice deleted successfully!");
      setDeleteInvoiceId(null);
      refreshInvoices();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete invoice");
    }
  };

  const handleDownloadPdf = async (id: number) => {
    try {
      toast.loading("Generating PDF...", { id: "pdf-toast" });
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));

      // Create a temporary link element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${id}.pdf`);
      document.body.appendChild(link);
      link.click();

      // Clean up
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("PDF downloaded successfully!", { id: "pdf-toast" });
    } catch (error) {
      console.error(error);
      toast.error("Failed to download PDF", { id: "pdf-toast" });
    }
  };

  const subTabs = [
    { key: "create_labour", label: "Create Labour Invoice" },
    { key: "labour_list", label: "Labour Invoice List" },
    { key: "create_material", label: "Create Material Invoice" },
    { key: "material_list", label: "Material Invoice List" },
    { key: "create_measurement", label: "Create from Measurement" }
  ];

  const activeInvoices = activeSubTab.includes("labour") ? labourInvoices : materialInvoices;

  const filtered = activeInvoices.filter(inv => {
    const pName = projects.find(p => p.id === inv.project_id)?.project_name || "";
    const cName = projects.find(p => p.id === inv.project_id)?.client_name || "";

    const matchType = selectedTypeFilter === "ALL INVOICE" ||
      inv.type?.toUpperCase() === selectedTypeFilter ||
      (selectedTypeFilter === "INVOICE" && (inv.type?.toUpperCase() === "INVOICE" || inv.type?.toUpperCase() === "OWNER"));
    const matchProject = selectedProjectFilter === "All" || String(inv.project_id) === selectedProjectFilter;
    const matchSearch = `INV-${inv.id}`.toLowerCase().includes(search.toLowerCase()) ||
      pName.toLowerCase().includes(search.toLowerCase()) ||
      cName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = selectedStatus === "All" || inv.status?.toLowerCase() === selectedStatus.toLowerCase();
    return matchType && matchProject && matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filtered.length / recordsPerPage);
  const paginatedInvoices = filtered.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  const portfolioValue = filtered.reduce((s, i) => s + (Number(i.total_amount) || 0), 0);
  const pendingValue = filtered.reduce((s, i) => s + (Number(i.pending_amount) || 0), 0);
  const paidValue = filtered.reduce((s, i) => s + (Number(i.paid_amount) || 0), 0);

  // Form states
  const [formData, setFormData] = useState({
    project_id: "",
    start_date: "",
    end_date: "",
    measurement_id: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [measurements, setMeasurements] = useState<any[]>([]);

  useEffect(() => {
    if (formData.project_id && activeSubTab === "create_measurement") {
      measurementService.getMeasurementsByProject(Number(formData.project_id))
        .then(data => setMeasurements(data))
        .catch(err => console.error("Failed to load measurements:", err));
    }
  }, [formData.project_id, activeSubTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id) {
      toast.error("Please select a project.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeSubTab === "create_labour") {
        await api.post('/invoices/labour', {
          project_id: Number(formData.project_id),
          start_date: formData.start_date,
          end_date: formData.end_date
        });
        toast.success("Labour Invoice created successfully!");
        setActiveSubTab("labour_list");
      } else if (activeSubTab === "create_measurement") {
        if (!formData.measurement_id) {
          toast.error("Please enter a measurement ID.");
          setIsSubmitting(false);
          return;
        }
        await financeService.createInvoiceFromMeasurement(Number(formData.measurement_id));
        toast.success("Measurement Invoice created successfully!");
        setActiveSubTab("labour_list"); // fallback list
      } else {
        await api.post(`/invoices/material?project_id=${Number(formData.project_id)}`);
        toast.success("Material Invoice created successfully!");
        setActiveSubTab("material_list");
      }
      setFormData({ project_id: "", start_date: "", end_date: "", measurement_id: "" });
    } catch (err: any) {
      let errorMsg = "Failed to create invoice";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMsg = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMsg = err.response.data.detail.map((d: any) => `${d.loc?.[1] || d.loc?.[0] || 'Field'}: ${d.msg}`).join(", ");
        }
      }
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {(activeSubTab === "labour_list" || activeSubTab === "material_list") && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Portfolio Value</p>
            <p className="text-2xl font-bold text-blue-600">{fmt(portfolioValue)}</p>
            <p className="text-xs text-slate-400 mt-2">{filtered.length} records</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending</p>
            <p className="text-2xl font-bold text-orange-500">{fmt(pendingValue)}</p>
            <p className="text-xs text-slate-400 mt-2">Requires action</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paid</p>
            <p className="text-2xl font-bold text-emerald-500">{fmt(paidValue)}</p>
            <p className="text-xs text-slate-400 mt-2">Completed</p>
          </div>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 flex-wrap h-fit">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => { setActiveSubTab(t.key as any); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        {(activeSubTab === "labour_list" || activeSubTab === "material_list") && (
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <select value={selectedTypeFilter} onChange={e => setSelectedTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer w-full sm:w-auto flex-1 sm:flex-none">
              <option value="ALL INVOICE">ALL INVOICE</option>
              <option value="INVOICE">INVOICE</option>
              <option value="LABOUR">LABOUR</option>
              <option value="MATERIAL">MATERIAL</option>
            </select>
            <select value={selectedProjectFilter} onChange={e => setSelectedProjectFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer w-full sm:w-auto flex-1 sm:flex-none max-w-full sm:max-w-[200px]">
              <option value="All">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-full sm:w-44 bg-white flex-1 sm:flex-none" />
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer w-full sm:w-auto flex-1 sm:flex-none">
              <option value="All">ALL STATUS</option>
              <option value="Pending">PENDING</option>
              <option value="Paid">PAID</option>
              <option value="Partial">PARTIAL</option>
            </select>
          </div>
        )}
      </div>

      {(activeSubTab === "labour_list" || activeSubTab === "material_list") && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto pb-3 scrollbar-thin">
            <table className="w-full text-left min-w-max">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["project_name", "type", "amount", "gst_percent", "gst_amount", "tax_percent", "tax_amount", "total_amount", "paid_amount", "pending_amount", "status", "description", "created_at", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={14} className="px-4 py-8 text-center text-slate-400 text-sm">Loading invoices...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-4 py-8 text-center text-slate-400 text-sm">No invoices found.</td>
                  </tr>
                ) : paginatedInvoices.map(inv => {
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap">
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <ProjectNameCell projectId={inv.project_id} projects={projects} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.type}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.amount}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.gst_percent}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.gst_amount}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.tax_percent}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.tax_amount}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.total_amount}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.paid_amount}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.pending_amount}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(inv.status)}`}>{inv.status || "PENDING"}</span></td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.description}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{inv.created_at ? new Date(inv.created_at).toLocaleString() : ''}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-row gap-3 items-center justify-start">
                          <button onClick={() => setViewInvoiceId(inv.id)} title="View" className="text-slate-400 hover:text-primary transition-colors"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleDownloadPdf(inv.id)} title="Download PDF" className="text-slate-400 hover:text-emerald-500 transition-colors"><Download className="w-4 h-4" /></button>
                          <button onClick={() => setEditInvoiceId(inv.id)} title="Edit" className="text-slate-400 hover:text-blue-500 transition-colors"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteInvoiceId(inv.id)} title="Delete" className="text-slate-400 hover:text-red-500 transition-colors"><Trash className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select
                value={recordsPerPage}
                onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white"
              >
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} - {Math.min(currentPage * recordsPerPage, filtered.length)} of {filtered.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {(activeSubTab === "create_labour" || activeSubTab === "create_material" || activeSubTab === "create_measurement") && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
            {activeSubTab === "create_labour" ? "Create Labour Invoice" : activeSubTab === "create_measurement" ? "Create Measurement Invoice" : "Create Material Invoice"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Project</label>
              <select
                required
                value={formData.project_id}
                onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-semibold text-slate-700"
              >
                <option value="">-- Choose Project --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name} {p.client_name ? `(${p.client_name})` : ''}</option>
                ))}
              </select>
            </div>

            {activeSubTab === "create_labour" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Start Date</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">End Date</label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-semibold text-slate-700"
                  />
                </div>
              </div>
            )}

            {activeSubTab === "create_measurement" && (
              <div className="mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Select Measurement</label>
                <select
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white disabled:opacity-50"
                  value={formData.measurement_id}
                  onChange={e => setFormData({ ...formData, measurement_id: e.target.value })}
                  disabled={!formData.project_id}
                >
                  <option value="">-- Choose Measurement --</option>
                  {measurements.map(m => (
                    <option key={m.id} value={m.id}>Measurement #{m.id} - {m.status}</option>
                  ))}
                </select>
                {!formData.project_id && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    Please select a project first to view its measurements.
                  </p>
                )}
                {formData.project_id && measurements.length === 0 && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    No measurements found for this project.
                  </p>
                )}
                <p className="text-xs text-blue-600 mt-2">
                  Invoice will be generated using the approved quantities and rates from this measurement record.
                </p>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveSubTab(activeSubTab === "create_labour" ? "labour_list" : "material_list")}
                className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create Invoice"}
              </button>
            </div>
          </form>
        </div>
      )}

      {viewInvoiceId && (
        <InvoiceViewModal invoiceId={viewInvoiceId} projects={projects} onClose={() => setViewInvoiceId(null)} />
      )}

      {editInvoiceId && (
        <InvoiceEditModal invoiceId={editInvoiceId} onClose={() => setEditInvoiceId(null)} onSuccess={() => { setEditInvoiceId(null); refreshInvoices(); }} />
      )}

      <ConfirmModal
        isOpen={!!deleteInvoiceId}
        onClose={() => setDeleteInvoiceId(null)}
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action cannot be undone."
      />
    </div>
  );
};
const RABillsSection = ({ initialSubTab }: { initialSubTab?: string; }) => {
  const [, setSearchParams] = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create" | "approval" | "payments">(
    (initialSubTab as any) || "list"
  );

  // ── dropdown data ──
  const [projects, setProjects] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  const defaultForm = {
    project_id: "" as any,
    contractor_id: "" as any,
    measurement_id: "" as any,
    work_order_id: "" as any,
    bill_number: "",
    work_description: "",
    gross_amount: "" as any,
    gst_percent: 18 as any,
    tds_amount: "" as any,
    retention_amount: "" as any,
    security_deposit_recovery: "" as any,
    bill_date: new Date().toISOString().split("T")[0],
  };
  const [formData, setFormData] = useState<any>(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (key: "list" | "create" | "approval" | "payments") => {
    setActiveSubTab(key);
    setSearchParams({ sub: key }, { replace: true });
    if (key !== "create") {
      setEditingRABill(null);
      setFormData(defaultForm);
    }
  };
  const [raBills, setRaBills] = useState<any[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterProject, setFilterProject] = useState("All");
  const [filterContractor, setFilterContractor] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [viewingRABill, setViewingRABill] = useState<any>(null);
  const [editingRABill, setEditingRABill] = useState<any>(null);
  const [rejectingRABill, setRejectingRABill] = useState<any>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [payingRABill, setPayingRABill] = useState<any>(null);
  const [payForm, setPayForm] = useState({ date: new Date().toISOString().split("T")[0], mode: "Bank Transfer", reference: "", remarks: "" });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [raCurrentPage, setRaCurrentPage] = useState(1);
  const [raRecordsPerPage, setRaRecordsPerPage] = useState(10);

  useEffect(() => {
    setRaCurrentPage(1);
  }, [search, filterStatus, filterProject, filterContractor, filterDateFrom, filterDateTo, activeSubTab]);

  // ── fetch ALL dropdown data when "create" tab opens ──
  useEffect(() => {
    if (activeSubTab !== "create") return;
    const fetchAll = async () => {
      setDropdownLoading(true);
      try {
        // 1. Projects
        const projRes = await projectService.getProjects(100, 0).catch(() => []);
        const projList: any[] = Array.isArray(projRes) ? projRes : (projRes as any).items || [];
        setProjects(projList);

        // 2. Contractors — GET /api/v1/contractors (requires auth, returns ContractorOut[])
        const contrRes = await api.get("/contractors", { params: { limit: 200 } }).catch(() => ({ data: [] }));
        const contrRaw = Array.isArray(contrRes.data) ? contrRes.data : (contrRes.data?.items || []);
        setContractors(contrRaw.map((c: any) => ({
          id: c.id,
          name: c.name || "Unknown Contractor",
          code: c.contractor_id || "",
          work_type: c.work_type || "",
        })));

        // 3. Measurements — no global GET exists, fetch for all projects concurrently
        if (projList.length > 0) {
          const measResults = await Promise.allSettled(
            projList.slice(0, 10).map((p: any) =>   // limit to first 10 projects
              measurementService.getMeasurementsByProject(Number(p.id)).catch(() => [])
            )
          );
          const allMeas: any[] = [];
          measResults.forEach(r => {
            if (r.status === "fulfilled") allMeas.push(...(r.value || []));
          });
          setMeasurements(allMeas);
        }

        // 4. Work Orders — GET /api/v1/work-orders (auth required, no project filter needed)
        const woRes = await api.get("/work-orders").catch(() => ({ data: [] }));
        const woList = Array.isArray(woRes.data) ? woRes.data : (woRes.data?.items || []);
        setWorkOrders(woList);

      } catch (_) { }
      setDropdownLoading(false);
    };
    fetchAll();
  }, [activeSubTab]);

  // ── when project changes, re-filter measurements & work-orders by project ──
  useEffect(() => {
    if (!formData.project_id) return; // keep the full list when no project

    // re-fetch measurements for the selected project
    measurementService.getMeasurementsByProject(Number(formData.project_id))
      .then(d => { if (d.length > 0) setMeasurements(Array.isArray(d) ? d : []); })
      .catch(() => { }); // on error keep existing full list

    // re-fetch work orders for the selected project
    api.get("/work-orders", { params: { project_id: formData.project_id, limit: 200 } })
      .then(res => {
        const d = res.data;
        const list = Array.isArray(d) ? d : (d?.items || []);
        if (list.length > 0) setWorkOrders(list);
      })
      .catch(() => { }); // on error keep existing full list
  }, [formData.project_id]);

  // ── fetch RA bills list when "list" tab is active ──
  useEffect(() => {
    if (activeSubTab === "create") return;
    const fetchList = async () => {
      setListLoading(true);
      try {
        const projRes = await projectService.getProjects(100, 0).catch(() => []);
        const loadedProjects = Array.isArray(projRes) ? projRes : (projRes as any).items || [];
        setProjects(loadedProjects);

        const [billsRes, contrRes, woRes, quotRes, measResults] = await Promise.allSettled([
          api.get("/billing", { params: { limit: 200 } }).catch(() => ({ data: [] })),
          api.get("/contractors", { params: { limit: 200 } }).catch(() => ({ data: [] })),
          api.get("/work-orders", { params: { limit: 200 } }).catch(() => ({ data: [] })),
          api.get("/quotations/", { params: { limit: 200 } }).catch(() => ({ data: [] })),
          loadedProjects.length > 0 ? Promise.allSettled(
            loadedProjects.slice(0, 10).map((p: any) =>
              measurementService.getMeasurementsByProject(Number(p.id)).catch(() => [])
            )
          ) : Promise.resolve([])
        ]);

        if (contrRes.status === "fulfilled") {
          const raw = contrRes.value?.data;
          const contrList = Array.isArray(raw) ? raw : (raw?.items || []);
          setContractors(contrList.map((c: any) => ({
            id: c.id,
            name: c.name || "Unknown Contractor",
            code: c.contractor_id || "",
            work_type: c.work_type || "",
          })));
        }

        if (measResults.status === "fulfilled") {
          const allMeas: any[] = [];
          (measResults.value as any[]).forEach((r: any) => {
            if (r.status === "fulfilled") allMeas.push(...(r.value || []));
          });
          setMeasurements(allMeas);
        }

        if (woRes.status === "fulfilled") {
          const raw = woRes.value?.data;
          setWorkOrders(Array.isArray(raw) ? raw : (raw?.items || []));
        }
        if (quotRes.status === "fulfilled") {
          const raw = quotRes.value?.data;
          setQuotations(Array.isArray(raw) ? raw : (raw?.items || []));
        }

        if (billsRes.status === "fulfilled") {
          const raw = billsRes.value.data;
          const billsList = Array.isArray(raw) ? raw : (raw?.items || []);
          setRaBills(billsList);
        }
      } catch (e) {
        console.error("Failed to load RA bills", e);
      } finally {
        setListLoading(false);
      }
    };
    fetchList();
  }, [activeSubTab, refreshTrigger]);

  const handleView = async (id: number) => {
    try {
      const res = await api.get(`/billing/${id}`);
      setViewingRABill(res.data);
    } catch (e) {
      toast.error("Failed to load RA Bill details");
    }
  };
  const handleSubmitRABill = async (id: number) => {
    setRaBills(prev => prev.map(rb => rb.id === id ? { ...rb, status: "Pending Approval" } : rb));
    try {
      await api.put(`/billing/${id}/submit`);
      toast.success("RA Bill submitted for approval!");
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to submit RA Bill");
      setRefreshTrigger(prev => prev + 1); // Revert on failure
    }
  };

  const handlePayRABill = (id: number) => {
    const b = raBills.find(x => x.id === id);
    if (b) {
      setPayingRABill(b);
      setPayForm({ date: new Date().toISOString().split("T")[0], mode: "Bank Transfer", reference: "", remarks: "" });
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingRABill) return;
    const id = payingRABill.id;
    setRaBills(prev => prev.map(rb => rb.id === id ? { ...rb, status: "Paid" } : rb));
    try {
      // Pass payment details if the API supports it
      await api.put(`/billing/${id}/pay`, payForm);
      toast.success("RA Bill marked as paid!");
      setRefreshTrigger(prev => prev + 1);
      setPayingRABill(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to mark RA Bill as paid");
      setRefreshTrigger(prev => prev + 1);
    }
  };


  const handleApprove = async (id: number) => {
    setRaBills(prev => prev.map(rb => rb.id === id ? { ...rb, status: "Certified" } : rb));
    try {
      await api.put(`/billing/${id}/approve`);
      toast.success("RA Bill approved!");
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to approve RA Bill");
      setRefreshTrigger(prev => prev + 1); // Revert on failure
    }
  };

  const handleReject = (id: number) => {
    const b = raBills.find(x => x.id === id);
    if (b) {
      setRejectingRABill(b);
      setRejectRemarks("");
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectRemarks.trim()) {
      toast.error("Remarks are mandatory for rejection.");
      return;
    }
    const id = rejectingRABill.id;
    setRaBills(prev => prev.map(rb => rb.id === id ? { ...rb, status: "Rejected" } : rb));
    try {
      await api.put(`/billing/${id}/reject`, { remarks: rejectRemarks });
      toast.success("RA Bill rejected.");
      setRefreshTrigger(prev => prev + 1);
      setRejectingRABill(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to reject RA Bill");
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const [deleteRABillId, setDeleteRABillId] = useState<number | null>(null);
  const [isDeletingRABill, setIsDeletingRABill] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!deleteRABillId) return;
    try {
      setIsDeletingRABill(true);
      await api.delete(`/billing/${deleteRABillId}`);
      toast.success("RA Bill deleted successfully!");
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to delete RA Bill");
    } finally {
      setIsDeletingRABill(false);
      setDeleteRABillId(null);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id) { toast.error("Please select a Project"); return; }
    if (!formData.bill_number) { toast.error("Bill Number is required"); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        project_id: Number(formData.project_id),
        contractor_id: formData.contractor_id ? Number(formData.contractor_id) : undefined,
        measurement_id: formData.measurement_id ? Number(formData.measurement_id) : undefined,
        work_order_id: formData.work_order_id ? Number(formData.work_order_id) : undefined,
        bill_number: formData.bill_number,
        work_description: formData.work_description,
        quantity: formData.quantity ? Number(formData.quantity) : 0,
        rate: formData.rate ? Number(formData.rate) : 0,
        deductions: formData.deductions ? Number(formData.deductions) : 0,
        gst_percent: formData.gst_percent ? Number(formData.gst_percent) : 0,
        bill_date: formData.bill_date,
      };
      if (editingRABill) {
        await api.put(`/billing/${editingRABill.id}`, payload);
      } else {
        await api.post("/billing", payload);
      }
      toast.success(editingRABill ? "RA Bill updated!" : "RA Bill created successfully!");
      setFormData(defaultForm);
      setRefreshTrigger(prev => prev + 1);
      handleTabChange("list");
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to create RA Bill";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sync when sidebar item changes
  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as "list" | "create" | "approval" | "payments");
  }, [initialSubTab]);

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-300";
  const selectClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer";
  const readOnlyClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-slate-50 text-slate-400 cursor-not-allowed";

  const subTabs = [
    { key: "create", label: "Create RA Bill" },
    { key: "list", label: "RA Bills" },
    { key: "approval", label: "Approval Queue" },
    { key: "payments", label: "Payment Queue" },
  ] as const;

  const filtered = raBills.filter(rb => {
    let tabMatch = true;
    if (activeSubTab === "approval") tabMatch = rb.status === "Submitted" || rb.status === "Pending Approval";
    else if (activeSubTab === "payments") tabMatch = rb.status === "Approved" || rb.status === "Certified";

    // Check Date Range
    let dateMatch = true;
    if (filterDateFrom && rb.bill_date < filterDateFrom) dateMatch = false;
    if (filterDateTo && rb.bill_date > filterDateTo) dateMatch = false;

    return tabMatch && dateMatch &&
      (filterStatus === "All" || rb.status === filterStatus) &&
      (filterProject === "All" || rb.project_id?.toString() === filterProject) &&
      (filterContractor === "All" || rb.contractor_id?.toString() === filterContractor) &&
      ((rb.bill_number?.toLowerCase() || "").includes(search.toLowerCase()) ||
        (rb.work_description?.toLowerCase() || "").includes(search.toLowerCase()));
  });

  const raTotalPages = Math.ceil(filtered.length / raRecordsPerPage);
  const paginatedRABills = filtered.slice((raCurrentPage - 1) * raRecordsPerPage, raCurrentPage * raRecordsPerPage);



  // ── live bill summary calculations ──
  const qty = Number(formData.quantity) || 0;
  const rate = Number(formData.rate) || 0;
  const grossAmount = qty * rate;
  const gstPct = Number(formData.gst_percent) || 0;
  const gstAmount = grossAmount * (gstPct / 100);
  const totalAmount = grossAmount + gstAmount;

  const totalDeductions = Number(formData.deductions) || 0;
  const netPayable = totalAmount - totalDeductions;

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => handleTabChange(t.key)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto mt-3 sm:mt-0">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search RA Bills…"
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-44 bg-white" />
          <select value={filterProject} onChange={e => setFilterProject(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer max-w-[120px]">
            <option value="All">All Projects</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
          </select>
          <select value={filterContractor} onChange={e => setFilterContractor(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer max-w-[120px]">
            <option value="All">All Contractors</option>
            {contractors.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer max-w-[100px]">
            <option value="All">All Status</option>
            {["Draft", "Submitted", "Approved", "Paid", "Rejected"].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-2 py-2 outline-none bg-white text-slate-600" />
            <span className="text-slate-300">-</span>
            <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="text-xs border border-slate-200 rounded-xl px-2 py-2 outline-none bg-white text-slate-600" />
          </div>
        </div>
      </div>

      {(activeSubTab === "list" || activeSubTab === "approval" || activeSubTab === "payments") && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">
                {activeSubTab === "approval" ? "Approval Queue" :
                  activeSubTab === "payments" ? "Payment Queue" :
                    "Running Account Bills"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeSubTab === "approval" ? "Review bills pending your approval" :
                  activeSubTab === "payments" ? "Record payments for approved bills" :
                    "Progress billing based on site measurements"}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Bill No", "Contractor", "Project", "Bill Date", "Gross Amount", "Net Amount", "Status", "Actions"].map(h => (
                    <th key={h} className={`px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${["Gross Amount", "Net Amount", "Actions"].includes(h) ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {listLoading ? (
                  <tr>
                    <td colSpan={21} className="text-center py-8 text-slate-400">Loading bills...</td>
                  </tr>
                ) : paginatedRABills.length === 0 ? (
                  <tr>
                    <td colSpan={21} className="text-center py-8 text-slate-400">No RA bills found.</td>
                  </tr>
                ) : paginatedRABills.map(rb => (
                  <tr key={rb.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap">
                    <td className="px-4 py-3 text-xs font-bold text-primary">{rb.bill_number}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {contractors.find(c => c.id === rb.contractor_id)?.name || rb.contractor_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {projects.find(p => p.id === rb.project_id)?.project_name || rb.project_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rb.bill_date}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 text-right">{fmt(rb.gross_amount)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{fmt(rb.net_amount)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(rb.status)}`}>{rb.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        <button onClick={() => handleView(rb.id)} className="text-slate-400 hover:text-primary transition-colors" title="View"><Eye className="w-4 h-4" /></button>

                        {activeSubTab === "approval" && (
                          <>
                            <button onClick={() => handleApprove(rb.id)} className="text-emerald-500 hover:text-emerald-600 transition-colors" title="Approve"><Check className="w-4 h-4" /></button>
                            <button onClick={() => handleReject(rb.id)} className="text-rose-500 hover:text-rose-600 transition-colors" title="Reject"><X className="w-4 h-4" /></button>
                          </>
                        )}

                        {activeSubTab === "payments" && (
                          <button onClick={() => handlePayRABill(rb.id)} className="text-blue-500 hover:text-blue-600 transition-colors" title="Record Payment"><Banknote className="w-4 h-4" /></button>
                        )}

                        {activeSubTab === "list" && rb.status === "Draft" && (
                          <button onClick={() => handleSubmitRABill(rb.id)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Submit for Approval"><Send className="w-4 h-4" /></button>
                        )}

                        {activeSubTab === "list" && (
                          <>
                            <button onClick={() => setEditingRABill(rb)} className="text-slate-400 hover:text-amber-500 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => setDeleteRABillId(rb.id)} className="text-slate-400 hover:text-rose-600 transition-colors" title="Delete"><Trash className="w-4 h-4" /></button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select
                value={raRecordsPerPage}
                onChange={(e) => { setRaRecordsPerPage(Number(e.target.value)); setRaCurrentPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white"
              >
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {filtered.length === 0 ? 0 : (raCurrentPage - 1) * raRecordsPerPage + 1} - {Math.min(raCurrentPage * raRecordsPerPage, filtered.length)} of {filtered.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setRaCurrentPage(p => Math.max(1, p - 1))}
                disabled={raCurrentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
                {raCurrentPage}
              </span>
              <button
                onClick={() => setRaCurrentPage(p => Math.min(raTotalPages, p + 1))}
                disabled={raCurrentPage === raTotalPages || raTotalPages === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "create" && (
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workflow Indicator */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center mb-[-10px]">
            {["Draft", "Submitted", "Approved", "Paid"].map((step, idx, arr) => (
              <div key={step} className="flex-1 flex items-center">
                <div className={`flex flex-col items-center flex-1 ${idx === 0 ? "text-primary" : "text-slate-400"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 ${idx === 0 ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-400"}`}>
                    {idx + 1}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{step}</span>
                </div>
                {idx < arr.length - 1 && <div className="h-1 flex-1 bg-slate-100 mx-2 rounded-full" />}
              </div>
            ))}
          </div>

          {/* Left: Form panels */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── Section 1: Project Details ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
                Project Details
              </h3>
              {dropdownLoading && (
                <p className="text-xs text-slate-400 mb-4">Loading dropdown options…</p>
              )}
              <div className="grid grid-cols-2 gap-4">

                {/* RA Bill Number - auto */}
                <div>
                  <label className={labelClasses}>RA Bill Number</label>
                  <input
                    type="text"
                    className={readOnlyClasses}
                    value={formData.bill_number || `Auto: RA/PRJ/${String(Math.floor(Math.random() * 900) + 100)}`}
                    readOnly
                    placeholder="Auto: RA/PRJ/005"
                  />
                </div>

                {/* Project dropdown */}
                <div>
                  <label className={labelClasses}>Project Name</label>
                  <select
                    required
                    className={selectClasses}
                    value={formData.project_id}
                    onChange={e => setFormData({ ...formData, project_id: e.target.value, measurement_id: "", work_order_id: "" })}
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.project_name || p.name}{p.client_name ? ` (${p.client_name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contractor dropdown */}
                <div>
                  <label className={labelClasses}>Contractor</label>
                  <select
                    className={selectClasses}
                    value={formData.contractor_id}
                    onChange={e => setFormData({ ...formData, contractor_id: e.target.value })}
                  >
                    <option value="">-- Select Contractor --</option>
                    {contractors.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name}{c.code ? ` (${c.code})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Measurement dropdown */}
                <div>
                  <label className={labelClasses}>Measurement</label>
                  <select
                    className={selectClasses}
                    value={formData.measurement_id}
                    onChange={e => setFormData({ ...formData, measurement_id: e.target.value })}
                  >
                    <option value="">-- Select Measurement --</option>
                    {measurements.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.measurement_no || m.title || `Measurement #${m.id}  (Qty: ${m.measured_qty ?? m.certified_qty ?? ""})`.trim()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Work Order dropdown */}
                <div>
                  <label className={labelClasses}>Work Order</label>
                  <select
                    className={selectClasses}
                    value={formData.work_order_id}
                    onChange={e => setFormData({ ...formData, work_order_id: e.target.value })}
                  >
                    <option value="">-- Select Work Order --</option>
                    {workOrders.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.title || w.work_order_no || w.order_no || `Work Order #${w.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bill Date */}
                <div>
                  <label className={labelClasses}>Bill Date</label>
                  <input
                    type="date"
                    required
                    className={inputClasses}
                    value={formData.bill_date}
                    onChange={e => setFormData({ ...formData, bill_date: e.target.value })}
                  />
                </div>

              </div>
            </div>

            {/* ── Section 2: Work Details ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
                Work Details
              </h3>
              <div className="grid grid-cols-2 gap-4">

                {/* Work Description */}
                <div className="col-span-2">
                  <label className={labelClasses}>Work Description</label>
                  <input
                    type="text"
                    className={inputClasses}
                    placeholder="e.g. Earthwork Excavation – Phase 2"
                    value={formData.work_description}
                    onChange={e => setFormData({ ...formData, work_description: e.target.value })}
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className={labelClasses}>Quantity</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClasses}
                    placeholder="e.g. 100"
                    value={formData.quantity || ''}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                {/* Rate */}
                <div>
                  <label className={labelClasses}>Rate (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClasses}
                    placeholder="e.g. 1500"
                    value={formData.rate || ''}
                    onChange={e => setFormData({ ...formData, rate: e.target.value })}
                  />
                </div>

                {/* GST Percent */}
                <div>
                  <label className={labelClasses}>GST (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className={inputClasses}
                    placeholder="18"
                    value={formData.gst_percent || ''}
                    onChange={e => setFormData({ ...formData, gst_percent: e.target.value })}
                  />
                </div>

                {/* Deductions */}
                <div>
                  <label className={labelClasses}>Deductions (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClasses}
                    placeholder="e.g. 5000"
                    value={formData.deductions || ''}
                    onChange={e => setFormData({ ...formData, deductions: e.target.value })}
                  />
                </div>

              </div>
            </div>

          </div>

          {/* ── Bill Summary Sidebar ── */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">4</span>
                Bill Summary
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Quantity × Rate", value: `${fmt(qty)} × ${fmt(rate)}` },
                  { label: "Gross Amount", value: fmt(grossAmount), bold: true },
                  { label: `GST (${gstPct}%)`, value: `+ ${fmt(gstAmount)}` },
                  { label: "Total Amount", value: fmt(totalAmount), bold: true },
                  { label: "Total Deductions", value: `– ${fmt(totalDeductions)}`, bold: true, border: true },
                  { label: "Net Payable", value: fmt(netPayable), bold: true, accent: true },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 ${row.border ? "border-t border-slate-100 mt-2 pt-2" : ""}`}>
                    <span className={`text-xs ${row.accent ? "font-black text-primary" : "text-slate-500"}`}>{row.label}</span>
                    <span className={`text-sm ${row.accent ? "font-black text-primary text-base" : row.bold ? "font-bold text-slate-800" : "text-slate-700"}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-6 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all active:scale-95 shadow-md shadow-primary/20 disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? "Saving…" : editingRABill ? "Update RA Bill" : "Create RA Bill"}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("list")}
                className="w-full mt-2 bg-slate-50 text-slate-500 py-2.5 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-100 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}



      {viewingRABill && (
        <ViewRABillModal
          bill={viewingRABill}
          projects={projects}
          contractors={contractors}
          measurements={measurements}
          workOrders={workOrders}
          quotations={quotations}
          onClose={() => setViewingRABill(null)}
        />
      )}

      {editingRABill && activeSubTab === "list" && (
        <EditRABillModal
          bill={editingRABill}
          workOrders={workOrders}
          onClose={() => setEditingRABill(null)}
          onSuccess={() => { setEditingRABill(null); setRefreshTrigger(prev => prev + 1); }}
        />
      )}

      {/* Reject Modal */}
      {rejectingRABill && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">Reject RA Bill</h3>
              <button onClick={() => setRejectingRABill(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">Please provide a reason for rejecting Bill <strong>{rejectingRABill.bill_number}</strong>.</p>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Remarks <span className="text-rose-500">*</span></label>
                <textarea
                  value={rejectRemarks}
                  onChange={e => setRejectRemarks(e.target.value)}
                  rows={3}
                  placeholder="Mandatory rejection reason..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all bg-white text-slate-700 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
                />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setRejectingRABill(null)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
              <button onClick={handleRejectSubmit} className="px-5 py-2.5 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all">Confirm Reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {payingRABill && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <form onSubmit={handlePaySubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800">Record Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bill: {payingRABill.bill_number}</p>
              </div>
              <button type="button" onClick={() => setPayingRABill(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Payment Date</label>
                <input type="date" value={payForm.date} onChange={e => setPayForm({ ...payForm, date: e.target.value })} required className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Payment Mode</label>
                <select value={payForm.mode} onChange={e => setPayForm({ ...payForm, mode: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer">
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Reference Number / UTR</label>
                <input type="text" value={payForm.reference} onChange={e => setPayForm({ ...payForm, reference: e.target.value })} placeholder="e.g. UTR123456789" className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Remarks</label>
                <textarea value={payForm.remarks} onChange={e => setPayForm({ ...payForm, remarks: e.target.value })} rows={2} placeholder="Optional notes..." className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setPayingRABill(null)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
              <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all">Submit Payment</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteRABillId}
        onClose={() => setDeleteRABillId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete RA Bill"
        message="Are you sure you want to delete this RA Bill? This action cannot be undone."
        confirmText="Confirm Deletion"
        type="danger"
        isLoading={isDeletingRABill}
      />
    </div>
  );
};



// 5. Collections
const CollectionsSection = () => {
  const [summary, setSummary] = useState<any>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [aging, setAging] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const fetchCollectionsData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, collRes, agingRes] = await Promise.all([
        financeService.getReceivablesSummary(),
        financeService.getReceivablesCollections(),
        financeService.getReceivablesAging()
      ]);
      setSummary(sumRes);
      setCollections(collRes);
      setAging(agingRes);
    } catch (error) {
      toast.error("Failed to fetch collections data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectionsData();
  }, []);

  const handleExportCollections = async () => {
    try {
      toast.loading("Exporting collections...", { id: "export-col" });
      const blob = await financeService.exportReceivablesCollections();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Collections_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Collections Exported!", { id: "export-col" });
    } catch (err: any) {
      toast.error(err.message || "Failed to export collections", { id: "export-col" });
    }
  };

  const stats = [
    { label: "Portfolio Value", value: fmtExact(summary?.portfolio_value || 0), icon: "📊", color: "bg-blue-50 text-blue-600" },
    { label: "Total Billed", value: fmtExact(summary?.total_billed || 0), icon: "🧾", color: "bg-indigo-50 text-indigo-600" },
    { label: "Total Received", value: fmtExact(summary?.total_received || 0), icon: "💰", color: "bg-emerald-50 text-emerald-600" },
    { label: "Pending Amount", value: fmtExact(summary?.pending_amount || 0), icon: "⏳", color: "bg-amber-50 text-amber-600" },
    { label: "Overdue Amount", value: fmtExact(summary?.overdue_amount || 0), icon: "🚨", color: "bg-rose-50 text-rose-600" },
  ];

  const totalPages = Math.ceil(collections.length / recordsPerPage);
  const paginatedCollections = collections.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 lg:p-5 shadow-sm border border-slate-100 flex items-center gap-3 lg:gap-4 overflow-hidden">
            <div className={`w-10 h-10 lg:w-12 lg:h-12 min-w-[40px] lg:min-w-[48px] rounded-xl ${k.color} flex items-center justify-center text-xl lg:text-2xl`}>{k.icon}</div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate" title={k.label}>{k.label}</p>
              <p className="text-sm lg:text-base xl:text-lg font-bold text-slate-800 mt-0.5 truncate" title={k.value}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Receivable Aging Summary */}
      {aging && (
        <div className="bg-white rounded-2xl p-5 lg:p-6 shadow-sm border border-slate-100 mb-6">
          <div className="mb-4">
            <h3 className="font-bold text-slate-800">Receivable Aging Summary</h3>
            <p className="text-xs text-slate-400 mt-0.5">Aging analysis of overdue receivables</p>
          </div>
          <div className="flex flex-wrap gap-4">
            {Array.isArray(aging) ? aging.map((item, i) => (
              <div key={i} className="flex-1 min-w-[120px] p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.bucket || item.range || `Bucket ${i + 1}`}</span>
                <span className="text-lg font-black text-rose-600 mt-1">{fmt(item.amount || item.value || 0)}</span>
              </div>
            )) : Object.entries(aging).map(([key, value]) => (
              <div key={key} className="flex-1 min-w-[120px] p-4 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                <span className="text-lg font-black text-rose-600 mt-1">{fmt(value as any || 0)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-slate-800">Collection Records</h3>
            <p className="text-xs text-slate-400 mt-0.5">Payment received & pending follow-ups</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportCollections} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl hover:border-primary/30 hover:text-primary transition-all active:scale-95">
              📤 Export Collections
            </button>
            <button onClick={() => setIsManualModalOpen(true)} className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-600 transition-all active:scale-95">
              + Add Manual Entry
            </button>
            <button onClick={() => toast.success("Payment recorded!")} className="flex items-center gap-2 bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-slate-700 transition-all active:scale-95">
              + Record Payment
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["Invoice", "Client", "Amount Received", "Received On", "Mode", "Reference", "Status", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm font-semibold">Loading collections...</td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm font-semibold">No collection records found.</td>
                </tr>
              ) : (
                paginatedCollections.map((c: any, idx: number) => (
                  <tr key={c.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-primary">{c.invoice || c.invoice_no || "—"}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{c.client || c.client_name || "—"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-right">{c.amount || c.amount_received ? fmt(c.amount || c.amount_received) : "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.received_on || c.date || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.mode || c.payment_mode || "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{c.ref || c.reference || "—"}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(c.status || c.payment_status || "PENDING")}`}>{c.status || c.payment_status || "PENDING"}</span></td>
                    <td className="px-4 py-3">
                      {(c.status || c.payment_status || "").toLowerCase() !== "received" ? (
                        <button onClick={() => toast.success("Follow-up sent!")} className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-primary rounded-lg border border-blue-100 hover:bg-blue-100 transition-all">Follow Up</button>
                      ) : (
                        <button onClick={() => toast.success("Receipt downloaded!")} className="text-[10px] font-bold px-2.5 py-1 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 hover:bg-slate-100 transition-all mx-auto">Download</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
            <select
              value={recordsPerPage}
              onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white"
            >
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Showing {collections.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} - {Math.min(currentPage * recordsPerPage, collections.length)} of {collections.length} records
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      {isManualModalOpen && (
        <CreateManualReceivableModal
          onClose={() => setIsManualModalOpen(false)}
          onSuccess={() => {
            setIsManualModalOpen(false);
            fetchCollectionsData();
          }}
        />
      )}
    </div>
  );
};

// 6. Client Ledger
const ClientLedgerSection = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await ownerService.getOwners();
        const clientsList = ((response as any)?.items || response || []).map((owner: any) => ({
          id: String(owner.id),
          name: owner.name || owner.company_name || `Client ${owner.id}`
        }));

        setClients(clientsList);
        if (clientsList.length > 0) {
          setSelectedClientId(clientsList[0].id);
        }
      } catch (error) {
        toast.error("Failed to load clients");
      } finally {
        setIsLoadingClients(false);
      }
    };
    fetchClients();
  }, []);

  useEffect(() => {
    if (!selectedClientId) return;
    const fetchLedger = async () => {
      setIsLoadingLedger(true);
      try {
        const data = await financeService.getClientLedger(selectedClientId);
        setLedgerData(data);
      } catch (error) {
        toast.error("Failed to fetch client ledger");
        setLedgerData(null);
      } finally {
        setIsLoadingLedger(false);
      }
    };
    fetchLedger();
  }, [selectedClientId]);

  const selectedClientName = clients.find(c => c.id === selectedClientId)?.name || "—";

  const totalBilled = ledgerData?.total_billed || ledgerData?.transactions?.reduce((sum: number, t: any) => sum + (Number(t.debit) || 0), 0) || 0;
  const totalReceived = ledgerData?.total_received || ledgerData?.transactions?.reduce((sum: number, t: any) => sum + (Number(t.credit) || 0), 0) || 0;
  const outstanding = ledgerData?.outstanding || (totalBilled - totalReceived);
  const transactions = ledgerData?.transactions || (Array.isArray(ledgerData) ? ledgerData : []);

  const handleExportLedger = async () => {
    if (!selectedClientId) return toast.error("Please select a client first");
    try {
      toast.loading("Exporting client ledger...", { id: "export-ledger" });
      const blob = await financeService.exportClientLedger(selectedClientId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ClientLedger_${selectedClientId}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Client Ledger Exported!", { id: "export-ledger" });
    } catch (err: any) {
      toast.error(err.message || "Failed to export client ledger", { id: "export-ledger" });
    }
  };

  return (
    <div className="space-y-5">
      {/* Client Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="space-y-1.5 flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Client</label>
            <select
              value={selectedClientId}
              onChange={e => setSelectedClientId(e.target.value)}
              disabled={isLoadingClients}
              className="w-full max-w-sm px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer disabled:opacity-50">
              {isLoadingClients ? <option>Loading clients...</option> : clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              {!isLoadingClients && clients.length === 0 && <option value="">No clients found</option>}
            </select>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-5">
            <button onClick={handleExportLedger} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:border-primary/30 hover:text-primary transition-all active:scale-95">📤 Export Ledger</button>
            <button onClick={() => toast.success("Client statement downloaded!")} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:border-primary/30 hover:text-primary transition-all active:scale-95">📥 Client Statement</button>
            <button onClick={() => toast.success("Outstanding summary downloaded!")} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:border-primary/30 hover:text-primary transition-all active:scale-95">📊 Outstanding Summary</button>
          </div>
        </div>
      </div>

      {/* Outstanding Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Billed", value: fmtExact(totalBilled) },
          { label: "Total Received", value: fmtExact(totalReceived), green: true },
          { label: "Outstanding", value: fmtExact(outstanding), red: true },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.green ? "text-emerald-600" : s.red ? "text-rose-600" : "text-slate-800"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Transaction History — {selectedClientName}</h3>
          <p className="text-xs text-slate-400 mt-0.5">All debits and credits in chronological order</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["Date", "Particulars", "Debit (₹)", "Credit (₹)", "Balance (₹)"].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoadingLedger ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm font-semibold">Loading ledger...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm font-semibold">No transactions found.</td>
                </tr>
              ) : (
                (() => {
                  const paginatedTransactions = transactions.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);
                  return paginatedTransactions.map((row: any, i: number) => {
                    const debit = Number(row.debit) || 0;
                    const credit = Number(row.credit) || 0;
                    const balance = Number(row.balance) || 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{row.date || "—"}</td>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-700">{row.particulars || row.description || "—"}</td>
                        <td className="px-5 py-3 text-xs font-semibold text-indigo-700 text-right">{debit > 0 ? fmtExact(debit) : "—"}</td>
                        <td className="px-5 py-3 text-xs font-semibold text-emerald-700 text-right">{credit > 0 ? fmtExact(credit) : "—"}</td>
                        <td className={`px-5 py-3 text-xs font-bold text-right ${balance < 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmtExact(Math.abs(balance))}</td>
                      </tr>
                    )
                  })
                })()
              )}
            </tbody>
          </table>
        </div>
        {transactions.length > 0 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select
                value={recordsPerPage}
                onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white"
              >
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {transactions.length === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} - {Math.min(currentPage * recordsPerPage, transactions.length)} of {transactions.length} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
                {currentPage}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(transactions.length / recordsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(transactions.length / recordsPerPage) || Math.ceil(transactions.length / recordsPerPage) === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};



// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

type TabKey = "quotations" | "invoices" | "ra-bills" | "collections" | "client-ledger";

const TABS: { key: TabKey; label: string }[] = [
  { key: "quotations", label: "Quotations" },
  { key: "invoices", label: "Invoices" },
  { key: "ra-bills", label: "RA Bills" },
  { key: "collections", label: "Collections" },
  { key: "client-ledger", label: "Client Ledger" },
];

const ReceivablesPage = () => {
  const { subpage } = useParams<{ subpage?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const resolveTab = (): TabKey => {
    // Fallback to parsing the URL path if subpage is masked by exact legacy routes
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = subpage || lastPart;

    const map: Record<string, TabKey> = {
      invoices: "invoices",
      quotations: "quotations",
      "ra-bills": "ra-bills",
      collections: "collections",
      "client-ledger": "client-ledger",
    };
    return map[currentSub || ""] || "quotations";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const subTab = searchParams.get("sub") || undefined;

  // Sync tab when URL changes (including ?sub= param from sidebar)
  useEffect(() => {
    setActiveTab(resolveTab());
  }, [subpage, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/receivables/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Receivables (Client Billing)" breadcrumb={["Accountant", "Receivables"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Receivables</h1>
            <p className="text-slate-500 text-sm mt-1">Manage invoices, running bills, collections, client ledger &amp; reports.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
          </div>
        </div>

        {/* Tab Navigation — matches sidebar hierarchy exactly */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.key
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold"
                  : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Section Label */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Receivables
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
            {TABS.find(t => t.key === activeTab)?.label}
          </span>
        </div>

        {/* Tab Content — key={subTab} forces remount when sidebar sub-item changes */}
        {activeTab === "quotations" && <InvoicesSection key={subTab || "list"} initialSubTab={subTab} />}
        {activeTab === "invoices" && <ClientInvoicesSection key={subTab || "list"} initialSubTab={subTab} />}
        {activeTab === "ra-bills" && <RABillsSection key={subTab || "list"} initialSubTab={subTab} />}
        {activeTab === "collections" && <CollectionsSection />}
        {activeTab === "client-ledger" && <ClientLedgerSection />}
      </PageTransition>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => { toast.success("Deleted."); setIsDeleteOpen(false); }}
        title="Delete Record"
        message="Are you sure? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

const ViewRABillModal = ({ bill, projects, contractors, workOrders, onClose }: any) => {
  if (!bill) return null;

  const projName = projects?.find((p: any) => p.id === bill.project_id)?.project_name || bill.project_id || "N/A";
  const contrName = contractors?.find((c: any) => c.id === bill.contractor_id)?.name || bill.contractor_id || "N/A";
  const woName = workOrders?.find((w: any) => w.id === bill.work_order_id)?.work_order_number || bill.work_order_id || "—";

  const fmt = (v: any) => v != null ? `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

  const statuses = ["Draft", "Submitted", "Approved", "Paid"];
  let currentStep = statuses.indexOf(bill.status);
  if (currentStep === -1) currentStep = bill.status === "Certified" ? 2 : bill.status === "Pending Approval" ? 1 : 0;
  if (bill.status === "Rejected") currentStep = -1; // special case

  const grossAmount = bill.gross_amount || 0;
  const gstAmount = grossAmount * ((bill.gst_percent || 0) / 100);
  const totalAmount = grossAmount + gstAmount;

  const tds = bill.tds_amount || 0;
  const retention = bill.retention_amount || 0;
  const sec = bill.security_deposit_recovery || 0;
  const totalDeductions = tds + retention + sec;
  const netPayable = totalAmount - totalDeductions;

  return (
    <Modal isOpen={!!bill} onClose={onClose} title="RA Bill Profile" maxWidth="max-w-4xl">
      <div className="p-6 font-inter h-full overflow-y-auto space-y-6">

        {/* Header card */}
        <div className="bg-primary rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative flex-shrink-0">
              <FileText className="w-10 h-10 text-white" />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${bill.status === 'Paid' || bill.status === 'Approved' ? 'bg-emerald-500' : bill.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'} border-4 border-primary rounded-full`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-xl font-bold tracking-tight">RA Bill {bill.bill_number}</h3>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${bill.status === 'Paid' ? 'bg-emerald-500/30 text-emerald-100' :
                    bill.status === 'Approved' ? 'bg-emerald-500/30 text-emerald-100' :
                      bill.status === 'Rejected' ? 'bg-rose-500/30 text-rose-100' :
                        'bg-amber-500/30 text-amber-100'
                  }`}>{bill.status}</span>
              </div>
              <p className="text-white/70 text-xs font-bold mb-2">Generated on {bill.bill_date || "—"}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">{projName}</span>
                <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">Total Amount: {fmt(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workflow Indicator */}
        {bill.status !== "Rejected" && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center">
            {statuses.map((step, idx, arr) => {
              const isPast = idx <= currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div key={step} className="flex-1 flex items-center">
                  <div className={`flex flex-col items-center flex-1 ${isPast ? "text-primary" : "text-slate-300"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mb-2 transition-all ${isCurrent ? "bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/10" :
                        isPast ? "bg-primary text-white" : "bg-slate-100 text-slate-400"
                      }`}>
                      {isPast && !isCurrent ? <Check size={16} /> : idx + 1}
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{step}</span>
                  </div>
                  {idx < arr.length - 1 && <div className={`h-1 flex-1 mx-2 rounded-full ${idx < currentStep ? "bg-primary/50" : "bg-slate-100"}`} />}
                </div>
              );
            })}
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><User size={14} /> Contractor Details</p>
            <p className="text-sm font-bold text-slate-800">{contrName}</p>
            <p className="text-xs text-slate-500 mt-1">Vendor ID: {bill.contractor_id || "—"}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Briefcase size={14} /> Project Details</p>
            <p className="text-sm font-bold text-slate-800">{projName}</p>
            <p className="text-xs text-slate-500 mt-1">Project ID: {bill.project_id || "—"}</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm col-span-2 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2"><FileText size={14} /> Work Order</p>
              <p className="text-sm font-bold text-slate-800">{woName}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Description</p>
              <p className="text-sm font-semibold text-slate-700">{bill.work_description || "—"}</p>
            </div>
          </div>
        </div>

        {/* Amount Summary */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Banknote size={14} /> Amount Summary</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">Gross Amount</span>
              <span className="text-sm font-bold text-slate-800">{fmt(grossAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">GST ({bill.gst_percent || 0}%)</span>
              <span className="text-sm font-bold text-slate-700">+ {fmt(gstAmount)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500 font-semibold">Total Amount</span>
              <span className="text-sm font-black text-slate-800">{fmt(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Deductions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2"><AlertCircle size={14} /> Deductions</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">TDS Amount</span>
              <span className="text-sm font-bold text-rose-600">– {fmt(tds)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">Retention Amount</span>
              <span className="text-sm font-bold text-rose-600">– {fmt(retention)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">Security Deposit Recovery</span>
              <span className="text-sm font-bold text-rose-600">– {fmt(sec)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500 font-semibold">Total Deductions</span>
              <span className="text-sm font-black text-rose-600">– {fmt(totalDeductions)}</span>
            </div>
          </div>
        </div>

        {/* Final Net Payable */}
        <div className="bg-primary rounded-2xl p-6 shadow-md shadow-primary/20 text-white flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary-200 mb-1">Net Payable Amount</p>
            <p className="text-3xl font-black tracking-tight">{fmt(netPayable)}</p>
          </div>
          {bill.status === "Paid" && <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><Check className="w-6 h-6 text-white" /></div>}
        </div>



      </div>
    </Modal>
  );
};

const EditRABillModal = ({ bill, workOrders, onClose, onSuccess }: { bill: any, workOrders: any[], onClose: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    work_order_id: bill.work_order_id || "",
    work_description: bill.work_description || "",
    quantity: bill.quantity || 0,
    rate: bill.rate || 0,
    deductions: bill.deductions || 0,
    gst_percent: bill.gst_percent || 0,
    status: bill.status || "Draft",
    bill_date: bill.bill_date || new Date().toISOString().split("T")[0]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        work_order_id: formData.work_order_id ? Number(formData.work_order_id) : undefined,
        work_description: formData.work_description,
        quantity: Number(formData.quantity),
        rate: Number(formData.rate),
        deductions: Number(formData.deductions),
        gst_percent: Number(formData.gst_percent),
        status: formData.status,
        bill_date: formData.bill_date
      };
      await api.put(`/billing/${bill.id}`, payload);
      toast.success("RA Bill updated successfully!");
      onSuccess();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to update RA Bill");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary";
  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-slate-800">Edit RA Bill</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><XCircle size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClasses}>Work Order</label>
              <select className={inputClasses} value={formData.work_order_id} onChange={e => setFormData({ ...formData, work_order_id: e.target.value })}>
                <option value="">-- Select Work Order --</option>
                {workOrders.map(w => (
                  <option key={w.id} value={w.id}>{w.title || w.work_order_no || w.order_no || `Work Order #${w.id}`}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Work Description</label>
              <input type="text" className={inputClasses} value={formData.work_description} onChange={e => setFormData({ ...formData, work_description: e.target.value })} />
            </div>
            <div>
              <label className={labelClasses}>Quantity</label>
              <input type="number" step="any" className={inputClasses} value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
            </div>
            <div>
              <label className={labelClasses}>Rate</label>
              <input type="number" step="any" className={inputClasses} value={formData.rate} onChange={e => setFormData({ ...formData, rate: e.target.value })} />
            </div>
            <div>
              <label className={labelClasses}>Deductions</label>
              <input type="number" step="any" className={inputClasses} value={formData.deductions} onChange={e => setFormData({ ...formData, deductions: e.target.value })} />
            </div>
            <div>
              <label className={labelClasses}>GST Percent</label>
              <input type="number" step="any" className={inputClasses} value={formData.gst_percent} onChange={e => setFormData({ ...formData, gst_percent: e.target.value })} />
            </div>
            <div>
              <label className={labelClasses}>Status</label>
              <select className={inputClasses} value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Certified">Certified</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className={labelClasses}>Bill Date</label>
              <input type="date" className={inputClasses} value={formData.bill_date} onChange={e => setFormData({ ...formData, bill_date: e.target.value })} />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceivablesPage;
