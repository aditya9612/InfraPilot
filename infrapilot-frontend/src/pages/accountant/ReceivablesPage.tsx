import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";

import AccountantCreateInvoice from "./AccountantCreateInvoice";
import { quotationService } from "../../services/quotationService";
import api from "../../services/api";
import { projectService } from "../../services/projectService";
import { measurementService } from "../../services/measurementService";
import { financeService } from "../../services/financeService";
import { ownerService } from "../../services/ownerService";
import { Zap, Eye, Download, Trash, Pencil, CheckCircle, XCircle, ChevronLeft, ChevronRight, FileText, Send, Banknote, Check, X } from "lucide-react";
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

const statusBadge = (s: any) => {
  if (!s || typeof s !== 'string') return "bg-slate-100 text-slate-500";
  const map: Record<string, string> = {
    paid: "bg-emerald-100 text-emerald-700",
    partial: "bg-amber-100 text-amber-700",
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
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.created_at?.substring(0,10)}</td>
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
  const [activeSubTab, setActiveSubTab] = useState<"create_labour" | "labour_list" | "create_material" | "material_list">(
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
    { key: "material_list", label: "Material Invoice List" }
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
    end_date: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      } else {
        await api.post(`/invoices/material?project_id=${Number(formData.project_id)}`);
        toast.success("Material Invoice created successfully!");
        setActiveSubTab("material_list");
      }
      setFormData({ project_id: "", start_date: "", end_date: "" });
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

      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 flex-wrap">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => { setActiveSubTab(t.key as any); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        {(activeSubTab === "labour_list" || activeSubTab === "material_list") && (
          <div className="flex items-center gap-3">
            <select value={selectedTypeFilter} onChange={e => setSelectedTypeFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer">
              <option value="ALL INVOICE">ALL INVOICE</option>
              <option value="INVOICE">INVOICE</option>
              <option value="LABOUR">LABOUR</option>
              <option value="MATERIAL">MATERIAL</option>
            </select>
            <select value={selectedProjectFilter} onChange={e => setSelectedProjectFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer">
              <option value="All">All Projects</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.project_name}</option>
              ))}
            </select>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-44 bg-white" />
            <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer">
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
                )})}
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

      {(activeSubTab === "create_labour" || activeSubTab === "create_material") && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">
            {activeSubTab === "create_labour" ? "Create Labour Invoice" : "Create Material Invoice"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Select Project</label>
              <select 
                required
                value={formData.project_id} 
                onChange={e => setFormData({...formData, project_id: e.target.value})}
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
                    onChange={e => setFormData({...formData, start_date: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-semibold text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">End Date</label>
                  <input 
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={e => setFormData({...formData, end_date: e.target.value})}
                    className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-primary/20 bg-white font-semibold text-slate-700"
                  />
                </div>
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
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create" | "drafts" | "approval" | "certified" | "paid">(
    (initialSubTab as any) || "list"
  );

  // ── dropdown data ──
  const [projects, setProjects] = useState<any[]>([]);
  const [contractors, setContractors] = useState<any[]>([]);
  const [measurements, setMeasurements] = useState<any[]>([]);
  const [workOrders, setWorkOrders] = useState<any[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [dropdownLoading, setDropdownLoading] = useState(false);

  // ── form state matching API schema ──
  const defaultForm = {
    project_id: "" as any,
    contractor_id: "" as any,
    measurement_id: "" as any,
    work_order_id: "" as any,
    bill_number: "",
    work_description: "",
    quantity: "" as any,
    rate: "" as any,
    deductions: "" as any,
    gst_percent: 18 as any,
    bill_date: new Date().toISOString().split("T")[0],
  };
  const [formData, setFormData] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTabChange = (key: "list" | "create" | "drafts" | "approval" | "certified" | "paid") => {
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
  const [filter, setFilter] = useState("All");
  const [viewingRABill, setViewingRABill] = useState<any>(null);
  const [editingRABill, setEditingRABill] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [raCurrentPage, setRaCurrentPage] = useState(1);
  const [raRecordsPerPage, setRaRecordsPerPage] = useState(10);
  const [appCurrentPage, setAppCurrentPage] = useState(1);
  const [appRecordsPerPage, setAppRecordsPerPage] = useState(10);

  useEffect(() => {
    setRaCurrentPage(1);
    setAppCurrentPage(1);
  }, [search, filter, activeSubTab]);

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

      } catch (_) {}
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
      .catch(() => {}); // on error keep existing full list

    // re-fetch work orders for the selected project
    api.get("/work-orders", { params: { project_id: formData.project_id, limit: 200 } })
      .then(res => {
        const d = res.data;
        const list = Array.isArray(d) ? d : (d?.items || []);
        if (list.length > 0) setWorkOrders(list);
      })
      .catch(() => {}); // on error keep existing full list
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
          api.get("/quotations", { params: { limit: 200 } }).catch(() => ({ data: [] })),
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

  const handlePayRABill = async (id: number) => {
    setRaBills(prev => prev.map(rb => rb.id === id ? { ...rb, status: "Paid" } : rb));
    try {
      await api.put(`/billing/${id}/pay`);
      toast.success("RA Bill marked as paid!");
      setRefreshTrigger(prev => prev + 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || "Failed to mark RA Bill as paid");
      setRefreshTrigger(prev => prev + 1); // Revert on failure
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
    setRaBills(prev => prev.map(rb => rb.id === id ? { ...rb, status: "Rejected" } : rb));
    toast("RA Bill rejected.");
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
      await api.post("/billing", payload);
      toast.success(editingRABill ? "RA Bill updated!" : "RA Bill created successfully!");
      setFormData(defaultForm);
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
    if (initialSubTab) setActiveSubTab(initialSubTab as "list" | "create" | "drafts" | "approval" | "certified" | "paid");
  }, [initialSubTab]);

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-slate-300";
  const selectClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer";
  const readOnlyClasses = "w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none bg-slate-50 text-slate-400 cursor-not-allowed";

  const subTabs = [
    { key: "create", label: "Create Bill" },
    { key: "drafts", label: "Drafts (To Submit)" },
    { key: "approval", label: "Pending (To Approve)" },
    { key: "certified", label: "Certified (To Pay)" },
    { key: "list", label: "All Bills (History)" },
  ] as const;

  const filtered = raBills.filter(rb => {
    let tabMatch = true;
    if (activeSubTab === "drafts") tabMatch = rb.status === "Draft";
    else if (activeSubTab === "certified") tabMatch = rb.status === "Certified" || rb.status === "Approved";
    
    return tabMatch &&
      (filter === "All" || rb.status === filter) &&
      ((rb.bill_number?.toLowerCase() || "").includes(search.toLowerCase()) ||
       (rb.work_description?.toLowerCase() || "").includes(search.toLowerCase()));
  });

  const raTotalPages = Math.ceil(filtered.length / raRecordsPerPage);
  const paginatedRABills = filtered.slice((raCurrentPage - 1) * raRecordsPerPage, raCurrentPage * raRecordsPerPage);

  const pendingApprovalBills = raBills.filter(r => r.status === "Pending Approval" || r.status === "Submitted");
  const appTotalPages = Math.ceil(pendingApprovalBills.length / appRecordsPerPage);
  const paginatedAppBills = pendingApprovalBills.slice((appCurrentPage - 1) * appRecordsPerPage, appCurrentPage * appRecordsPerPage);

  // ── live bill summary calculations ──
  const qty = Number(formData.quantity) || 0;
  const rate = Number(formData.rate) || 0;
  const deductions = Number(formData.deductions) || 0;
  const gstPct = Number(formData.gst_percent) || 0;
  const grossAmount = qty * rate;
  const gstAmount = grossAmount * (gstPct / 100);
  const totalWithGST = grossAmount + gstAmount;
  const netPayable = totalWithGST - deductions;

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
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search RA Bills…"
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-44 bg-white" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer">
            {["All", "Submitted", "Pending", "Draft", "Rejected"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {(activeSubTab === "list" || activeSubTab === "drafts" || activeSubTab === "certified") && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">
                {activeSubTab === "drafts" ? "Draft Bills (Ready for Submission)" : 
                 activeSubTab === "certified" ? "Certified Bills (Ready for Payment)" : 
                 "Running Account Bills"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeSubTab === "drafts" ? "Review drafts and submit them for approval" : 
                 activeSubTab === "certified" ? "Record payments for certified bills" : 
                 "Progress billing based on site measurements"}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["project_id", "contractor_id", "measurement_id", "work_order_id", "quotation_id", "bill_number", "work_description", "quantity", "rate", "gross_amount", "deductions", "net_amount", "gst_percent", "total_amount", "bill_date", "status", "progress_percent", "total_billed_quantity", "remaining_quantity", "available_to_bill", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h.replace(/_id$/, '').replace(/_/g, ' ')}</th>
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
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {projects.find(p => p.id === rb.project_id)?.project_name || rb.project_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {contractors.find(c => c.id === rb.contractor_id)?.name || rb.contractor_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {measurements.find(m => m.id === rb.measurement_id) ? `Measurement #${rb.measurement_id}` : (rb.measurement_id || "-")}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {workOrders.find(w => w.id === rb.work_order_id)?.work_order_number || rb.work_order_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {quotations.find(q => q.id === rb.quotation_id)?.quotation_no || rb.quotation_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-primary">{rb.bill_number}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{rb.work_description || "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{rb.quantity}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{fmt(rb.rate)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 text-right">{fmt(rb.gross_amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{fmt(rb.deductions)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{fmt(rb.net_amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{rb.gst_percent}%</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{fmt(rb.total_amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rb.bill_date}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(rb.status)}`}>{rb.status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{rb.progress_percent ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{rb.total_billed_quantity ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{rb.remaining_quantity ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{rb.available_to_bill ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 justify-end">
                        {activeSubTab === "list" && <button onClick={() => handleView(rb.id)} className="text-slate-400 hover:text-primary transition-colors" title="View"><Eye className="w-4 h-4" /></button>}
                        
                        {(activeSubTab === "drafts" || activeSubTab === "list") && rb.status === "Draft" && (
                          <button onClick={() => handleSubmitRABill(rb.id)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Submit for Approval"><Send className="w-4 h-4" /></button>
                        )}
                        
                        {(activeSubTab === "certified" || activeSubTab === "list") && (rb.status === "Certified" || rb.status === "Approved") && (
                          <button onClick={() => handlePayRABill(rb.id)} className="text-slate-400 hover:text-emerald-500 transition-colors" title="Record Payment"><Banknote className="w-4 h-4" /></button>
                        )}
                        
                        {activeSubTab === "list" && <button onClick={() => setEditingRABill(rb)} className="text-slate-400 hover:text-amber-500 transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>}
                        
                        {activeSubTab === "list" && <button onClick={() => setDeleteRABillId(rb.id)} className="text-slate-400 hover:text-rose-600 transition-colors" title="Delete"><Trash className="w-4 h-4" /></button>}
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
                    placeholder="e.g. 1200"
                    value={formData.quantity}
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
                    placeholder="e.g. 45"
                    value={formData.rate}
                    onChange={e => setFormData({ ...formData, rate: e.target.value })}
                  />
                </div>

                {/* Deductions */}
                <div>
                  <label className={labelClasses}>Deductions (₹)</label>
                  <input
                    type="number"
                    min="0"
                    className={inputClasses}
                    placeholder="e.g. 0"
                    value={formData.deductions}
                    onChange={e => setFormData({ ...formData, deductions: e.target.value })}
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
                    value={formData.gst_percent}
                    onChange={e => setFormData({ ...formData, gst_percent: e.target.value })}
                  />
                </div>

              </div>
            </div>

          </div>

          {/* ── Bill Summary Sidebar ── */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
                Bill Summary
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Gross Amount", value: fmt(grossAmount) },
                  { label: `GST (${gstPct}%)`, value: fmt(gstAmount) },
                  { label: "Total with GST", value: fmt(totalWithGST), bold: true },
                  { label: "Deductions", value: `– ${fmt(deductions)}`, bold: false },
                  { label: "Net Payable", value: fmt(netPayable), bold: true, accent: true },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 ${i > 1 ? "border-t border-slate-100" : ""}`}>
                    <span className={`text-xs ${row.accent ? "font-black text-primary" : "text-slate-500"}`}>{row.label}</span>
                    <span className={`text-sm ${row.accent ? "font-black text-primary text-base" : row.bold ? "font-bold text-slate-800" : "text-slate-700"}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Payment Status */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Payment Status</label>
                <div className="flex gap-2">
                  {["Paid", "Partial", "Pending"].map(s => (
                    <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="payment_status" value={s} defaultChecked={s === "Pending"} className="accent-primary" />
                      <span className="text-xs font-semibold text-slate-600">{s}</span>
                    </label>
                  ))}
                </div>
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

      {activeSubTab === "approval" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">RA Bill Approval Queue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Bills pending PMC / client certification</p>
          </div>
          <div className="divide-y divide-slate-50">
            {paginatedAppBills.map(rb => {
              const projName = projects?.find((p: any) => p.id === rb.project_id)?.project_name || rb.project_id || "N/A";
              const contrName = contractors?.find((c: any) => c.id === rb.contractor_id)?.name || rb.contractor_id || "N/A";
              return (
              <div key={rb.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{rb.bill_number || "—"} — {contrName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{projName} · Date: {rb.bill_date || "—"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">{fmt(rb.total_amount)}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(rb.status)}`}>{rb.status}</span>
                  <button onClick={() => handleApprove(rb.id)} className="text-emerald-500 hover:text-emerald-600 transition-all active:scale-95" title="Approve">
                    <Check className="w-6 h-6" strokeWidth={2.5} />
                  </button>
                  <button onClick={() => handleReject(rb.id)} className="text-rose-500 hover:text-rose-600 transition-all active:scale-95 ml-2" title="Reject">
                    <X className="w-6 h-6" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select 
                value={appRecordsPerPage} 
                onChange={(e) => { setAppRecordsPerPage(Number(e.target.value)); setAppCurrentPage(1); }}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white"
              >
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Showing {pendingApprovalBills.length === 0 ? 0 : (appCurrentPage - 1) * appRecordsPerPage + 1} - {Math.min(appCurrentPage * appRecordsPerPage, pendingApprovalBills.length)} of {pendingApprovalBills.length} records
            </span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setAppCurrentPage(p => Math.max(1, p - 1))}
                disabled={appCurrentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">
                {appCurrentPage}
              </span>
              <button 
                onClick={() => setAppCurrentPage(p => Math.min(appTotalPages, p + 1))}
                disabled={appCurrentPage === appTotalPages || appTotalPages === 0}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white hover:text-slate-600 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
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
  const [isLoading, setIsLoading] = useState(true);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  const fetchCollectionsData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, collRes] = await Promise.all([
        financeService.getReceivablesSummary(),
        financeService.getReceivablesCollections()
      ]);
      setSummary(sumRes);
      setCollections(collRes);
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
    { label: "Portfolio Value", value: fmt(summary?.portfolio_value || 0), icon: "📊", color: "bg-blue-50 text-blue-600" },
    { label: "Total Billed", value: fmt(summary?.total_billed || 0), icon: "🧾", color: "bg-indigo-50 text-indigo-600" },
    { label: "Total Received", value: fmt(summary?.total_received || 0), icon: "💰", color: "bg-emerald-50 text-emerald-600" },
    { label: "Pending Amount", value: fmt(summary?.pending_amount || 0), icon: "⏳", color: "bg-amber-50 text-amber-600" },
    { label: "Overdue Amount", value: fmt(summary?.overdue_amount || 0), icon: "🚨", color: "bg-rose-50 text-rose-600" },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className={`w-12 h-12 min-w-[48px] rounded-xl ${k.color} flex items-center justify-center text-2xl`}>{k.icon}</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
              <p className="text-lg font-bold text-slate-800 mt-0.5">{k.value}</p>
            </div>
          </div>
        ))}
      </div>
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
                collections.map((c: any, idx: number) => (
                  <tr key={c.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-primary">{c.invoice || c.invoice_no || "—"}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{c.client || c.client_name || "—"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-right">{c.amount || c.amount_received ? fmt(c.amount || c.amount_received) : "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.received_on || c.date || "—"}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{c.mode || c.payment_mode || "—"}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-400">{c.ref || c.reference || "—"}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(c.status || c.payment_status || "PENDING")}`}>{c.status || c.payment_status || "PENDING"}</span></td>
                    <td className="px-4 py-3">
                      {(c.status || c.payment_status || "").toLowerCase() !== "received" && (
                        <button onClick={() => toast.success("Follow-up sent!")} className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-primary rounded-lg border border-blue-100 hover:bg-blue-100 transition-all">Follow Up</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
          { label: "Total Billed", value: fmt(totalBilled) },
          { label: "Total Received", value: fmt(totalReceived), green: true },
          { label: "Outstanding", value: fmt(outstanding), red: true },
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
                transactions.map((row: any, i: number) => {
                  const debit = Number(row.debit) || 0;
                  const credit = Number(row.credit) || 0;
                  const balance = Number(row.balance) || 0;
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">{row.date || "—"}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-700">{row.particulars || row.description || "—"}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-indigo-700 text-right">{debit > 0 ? fmt(debit) : "—"}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-emerald-700 text-right">{credit > 0 ? fmt(credit) : "—"}</td>
                      <td className={`px-5 py-3 text-xs font-bold text-right ${balance < 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmt(Math.abs(balance))}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
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
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
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

const ViewRABillModal = ({ bill, projects, contractors, workOrders, quotations, onClose }: any) => {
  if (!bill) return null;

  const projName = projects?.find((p: any) => p.id === bill.project_id)?.project_name || bill.project_id || "N/A";
  const contrName = contractors?.find((c: any) => c.id === bill.contractor_id)?.name || bill.contractor_id || "N/A";
  const woName = workOrders?.find((w: any) => w.id === bill.work_order_id)?.work_order_number || bill.work_order_id || "—";
  const quotName = quotations?.find((q: any) => q.id === bill.quotation_id)?.quotation_no || bill.quotation_id || "—";

  const fmt = (v: any) => v != null ? `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
  const isApproved = bill.status === 'Certified';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">RA Bill Profile</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 bg-white shadow-sm border border-slate-200 rounded-full text-slate-500 transition-all"><XCircle size={20}/></button>
        </div>
        
        <div className="p-6 font-inter bg-white">
          {/* Header card */}
          <div className="bg-primary rounded-2xl p-6 mb-6 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative flex-shrink-0">
                <FileText className="w-10 h-10 text-white" />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${isApproved ? 'bg-emerald-500' : 'bg-rose-500'} border-4 border-primary rounded-full`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold tracking-tight">{contrName}</h3>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${isApproved ? 'bg-emerald-500/30 text-emerald-100' : 'bg-amber-500/30 text-amber-100'}`}>{bill.status}</span>
                </div>
                <p className="text-white/70 text-xs font-bold mb-2">{bill.bill_number ? `RA Bill #${bill.bill_number}` : 'No Identifier'}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">{projName}</span>
                  <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">Grand Total: {fmt(bill.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* All fields */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {([
              { label: 'RA Bill No', value: bill.bill_number || '—' },
              { label: 'Contractor', value: contrName },
              { label: 'Project Name', value: projName },
              { label: 'Bill Date', value: bill.bill_date || '—' },
              { label: 'Status', value: bill.status || '—' },
              { label: 'Work Order', value: woName },
              { label: 'Quotation', value: quotName },
              { label: 'Quantity', value: bill.quantity != null ? bill.quantity : '—' },
              { label: 'Rate (₹)', value: bill.rate != null ? fmt(bill.rate) : '—' },
              { label: 'Gross Amount (₹)', value: bill.gross_amount != null ? fmt(bill.gross_amount) : '—' },
              { label: 'Deductions (₹)', value: bill.deductions != null && bill.deductions > 0 ? `-${fmt(bill.deductions)}` : '0' },
              { label: 'Net Amount (₹)', value: bill.net_amount != null ? fmt(bill.net_amount) : '—' },
              { label: 'GST %', value: bill.gst_percent != null ? String(bill.gst_percent) : '—' },
              { label: 'Total Payable Amount (₹)', value: bill.total_amount != null ? fmt(bill.total_amount) : '—', highlight: true },
              { label: 'Total Billed Qty', value: bill.total_billed_quantity != null ? String(bill.total_billed_quantity) : '—' },
              { label: 'Remaining Qty', value: bill.remaining_quantity != null ? String(bill.remaining_quantity) : '—' },
              { label: 'Available to Bill', value: bill.available_to_bill != null ? String(bill.available_to_bill) : '—' },
            ] as { label: string; value: any; highlight?: boolean }[]).map(({ label, value, highlight }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-sm font-bold truncate ${highlight ? 'text-emerald-600' : 'text-slate-800'}`}>{String(value)}</p>
              </div>
            ))}

            <div className="col-span-full bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Work Description</p>
              <p className="text-sm font-bold text-slate-800">{bill.work_description || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
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
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500"><XCircle size={20}/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className={labelClasses}>Work Order</label>
              <select className={inputClasses} value={formData.work_order_id} onChange={e => setFormData({...formData, work_order_id: e.target.value})}>
                <option value="">-- Select Work Order --</option>
                {workOrders.map(w => (
                  <option key={w.id} value={w.id}>{w.title || w.work_order_no || w.order_no || `Work Order #${w.id}`}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Work Description</label>
              <input type="text" className={inputClasses} value={formData.work_description} onChange={e => setFormData({...formData, work_description: e.target.value})} />
            </div>
            <div>
              <label className={labelClasses}>Quantity</label>
              <input type="number" step="any" className={inputClasses} value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
            </div>
            <div>
              <label className={labelClasses}>Rate</label>
              <input type="number" step="any" className={inputClasses} value={formData.rate} onChange={e => setFormData({...formData, rate: e.target.value})} />
            </div>
            <div>
              <label className={labelClasses}>Deductions</label>
              <input type="number" step="any" className={inputClasses} value={formData.deductions} onChange={e => setFormData({...formData, deductions: e.target.value})} />
            </div>
            <div>
              <label className={labelClasses}>GST Percent</label>
              <input type="number" step="any" className={inputClasses} value={formData.gst_percent} onChange={e => setFormData({...formData, gst_percent: e.target.value})} />
            </div>
            <div>
              <label className={labelClasses}>Status</label>
              <select className={inputClasses} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Certified">Certified</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className={labelClasses}>Bill Date</label>
              <input type="date" className={inputClasses} value={formData.bill_date} onChange={e => setFormData({...formData, bill_date: e.target.value})} />
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
