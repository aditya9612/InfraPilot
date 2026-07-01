import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";

import AccountantCreateInvoice from "./AccountantCreateInvoice";
import { quotationService } from "../../services/quotationService";
import api from "../../services/api";
import { projectService } from "../../services/projectService";
import { Zap, Eye, Download, Trash, Pencil, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import QuotationViewModal from "./QuotationViewModal";
import InvoiceViewModal from "./InvoiceViewModal";
import InvoiceEditModal from "./InvoiceEditModal";

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_INVOICES = [
  { id: 1, invoice_number: "INV-2026-001", client_name: "Aditya Enterprises", project_name: "Skyline Residency", billing_date: "2026-05-15", due_date: "2026-06-15", work_description: "Excavation & PCC Work – Phase 1", quantity: 1200, unit: "Sqft", rate: 15, amount: 18000, gst_percent: 18, gst_amount: 3240, total_with_gst: 21240, payment_status: "Paid", received_amount: 21240, pending_amount: 0 },
  { id: 2, invoice_number: "INV-2026-002", client_name: "BuildCorp Solutions", project_name: "Metropolis Hub", billing_date: "2026-05-20", due_date: "2026-06-20", work_description: "RCC Column Casting – Ground Floor", quantity: 500, unit: "CuM", rate: 200, amount: 100000, gst_percent: 18, gst_amount: 18000, total_with_gst: 118000, payment_status: "Partial", received_amount: 60000, pending_amount: 58000 },
  { id: 3, invoice_number: "INV-2026-003", client_name: "Zenith Infrastructures", project_name: "NH-48 Expansion", billing_date: "2026-06-01", due_date: "2026-07-01", work_description: "Bitumen Laying – Km 22 to 28", quantity: 250, unit: "Km", rate: 450, amount: 112500, gst_percent: 18, gst_amount: 20250, total_with_gst: 132750, payment_status: "Pending", received_amount: 0, pending_amount: 132750 },
  { id: 4, invoice_number: "INV-2026-004", client_name: "Greenfield Developers", project_name: "Green Valley Township", billing_date: "2026-06-05", due_date: "2026-06-25", work_description: "Plumbing & Electrical Rough-in", quantity: 800, unit: "Sqft", rate: 90, amount: 72000, gst_percent: 18, gst_amount: 12960, total_with_gst: 84960, payment_status: "Overdue", received_amount: 0, pending_amount: 84960 },
];

const MOCK_RA_BILLS = [
  { id: 1, bill_no: "RA/SKY/001", client: "Aditya Enterprises", project: "Skyline Residency", billing_from: "2026-04-01", billing_to: "2026-04-30", billing_date: "2026-05-02", gross_amount: 1250000, gst_percent: 18, gst_amount: 225000, total_with_gst: 1475000, net_payable: 1475000, status: "Certified", certified_by: "PMC – Tata Projects" },
  { id: 2, bill_no: "RA/MET/004", client: "BuildCorp Solutions", project: "Metropolis Hub", billing_from: "2026-04-01", billing_to: "2026-04-30", billing_date: "2026-05-05", gross_amount: 850000, gst_percent: 18, gst_amount: 153000, total_with_gst: 1003000, net_payable: 1003000, status: "Pending Approval", certified_by: "—" },
  { id: 3, bill_no: "RA/SKY/002", client: "Aditya Enterprises", project: "Skyline Residency", billing_from: "2026-05-01", billing_to: "2026-05-31", billing_date: "2026-06-01", gross_amount: 2100000, gst_percent: 18, gst_amount: 378000, total_with_gst: 2478000, net_payable: 2478000, status: "Submitted", certified_by: "Internal Audit" },
];



const MOCK_COLLECTIONS = [
  { id: 1, invoice: "INV-2026-001", client: "Aditya Enterprises", amount: 21240, received_on: "2026-06-05", mode: "NEFT", ref: "HDFC20260605001", status: "Received" },
  { id: 2, invoice: "INV-2026-002", client: "BuildCorp Solutions", amount: 60000, received_on: "2026-06-10", mode: "Cheque", ref: "CHQ-004521", status: "Received" },
  { id: 3, invoice: "INV-2026-003", client: "Zenith Infrastructures", amount: 0, received_on: "—", mode: "—", ref: "—", status: "Pending" },
  { id: 4, invoice: "INV-2026-004", client: "Greenfield Developers", amount: 0, received_on: "—", mode: "—", ref: "—", status: "Overdue" },
];

const MOCK_LEDGER = [
  { date: "2026-05-15", particulars: "Invoice INV-2026-001 Raised", debit: 21240, credit: 0, balance: 21240 },
  { date: "2026-05-20", particulars: "Credit Note CN-2026-001 Issued", debit: 0, credit: 5900, balance: 15340 },
  { date: "2026-06-05", particulars: "Payment Received – NEFT", debit: 0, credit: 21240, balance: -5900 },
  { date: "2026-05-20", particulars: "Invoice INV-2026-002 Raised", debit: 118000, credit: 0, balance: 112100 },
  { date: "2026-06-10", particulars: "Partial Payment Received – Cheque", debit: 0, credit: 60000, balance: 52100 },
];



// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

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
        </div>
      </div>

      {(activeSubTab === "quotation_list" || activeSubTab === "invoice_list") && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto pb-3 scrollbar-thin">
            <table className="w-full text-left min-w-max">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Quotation No", "Project ID", "Client Name", "Company Name", "Mobile Number", "Site Address", "Project Name", "Project Type", "Subtotal", "GST Amt", "TDS Amt", "Discount", "Grand Total", "Advance Paid", "Balance Due", "Payment Mode", "Status", "Created At", "Due Date", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginatedInvoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap">
                    <td className="px-4 py-3 text-xs font-bold text-primary">{inv.quotation_no || inv.invoice_number}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.project_id || '-'}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{inv.client_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px] truncate">{inv.company_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.mobile_number}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{inv.site_address}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px] truncate">{inv.project_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.project_type}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmt(inv.subtotal || inv.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmt(inv.gst_amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmt(inv.tds_amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{fmt(inv.discount_amount)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{fmt(inv.grand_total || inv.total_with_gst)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-700">{fmt(inv.advance_paid || inv.received_amount)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-rose-600">{fmt(inv.balance_due || inv.pending_amount)}</td>
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

        const projList = Array.isArray(pRes) ? pRes : (pRes.items || []);
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
                  const p = projects.find(proj => proj.id === inv.project_id);
                  const projName = p ? (p.project_name || p.name) : inv.project_id;
                  return (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap">
                    <td className="px-4 py-3 text-xs text-slate-600">{projName}</td>
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

// 3. RA Bills
const RABillsSection = ({ initialSubTab }: { initialSubTab?: string; }) => {
  const [, setSearchParams] = useSearchParams();
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create" | "approval">(
    (initialSubTab as any) || "list"
  );

  const handleTabChange = (key: "list" | "create" | "approval") => {
    setActiveSubTab(key);
    setSearchParams({ sub: key }, { replace: true });
    if (key !== "create") setEditingRABill(null);
  };
  const [raBills, setRaBills] = useState<any[]>(MOCK_RA_BILLS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingRABill, setEditingRABill] = useState<any>(null);

  const handleApprove = (id: number) => {
    setRaBills(prev => prev.map(rb => rb.id === id ? { ...rb, status: "Certified" } : rb));
    toast.success("RA Bill certified!");
  };

  const handleReject = (id: number) => {
    setRaBills(prev => prev.map(rb => rb.id === id ? { ...rb, status: "Rejected" } : rb));
    toast("RA Bill rejected.");
  };

  const handleDelete = (id: number) => {
    setRaBills(prev => prev.filter(rb => rb.id !== id));
    toast.success("RA Bill deleted!");
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRb: any = {};
    formData.forEach((value, key) => { newRb[key] = value; });

    if (editingRABill) {
      setRaBills(prev => prev.map(rb => rb.id === editingRABill.id ? { ...rb, ...newRb } : rb));
      toast.success("RA Bill updated successfully!");
    } else {
      newRb.id = Date.now();
      newRb.bill_no = newRb.bill_no || `RAB-${Math.floor(Math.random() * 1000)}`;
      // use mock calculated amounts
      newRb.amount = BOQ_ITEMS.reduce((s, item) => s + item.curr_qty * item.rate, 0);
      newRb.status = "Pending";
      setRaBills(prev => [newRb, ...prev]);
      toast.success("RA Bill created successfully!");
    }
    handleTabChange("list");
  };

  // Sync when sidebar item changes (e.g., "RA Bill List" → "Create RA Bill")
  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as "list" | "create" | "approval");
  }, [initialSubTab]);

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = (readOnly?: boolean) => `w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 ${readOnly ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary"}`;

  const subTabs = [
    { key: "create", label: "Create RA Bill" },
    { key: "list", label: "RA Bill List" },
    { key: "approval", label: "Bill Approval" },
  ] as const;

  const filtered = raBills.filter(rb =>
    (filter === "All" || rb.status === filter) &&
    (rb.bill_no.toLowerCase().includes(search.toLowerCase()) ||
      rb.client.toLowerCase().includes(search.toLowerCase()))
  );

  const BOQ_ITEMS = [
    { id: 1, item: "Earthwork Excavation", unit: "CuM", rate: 45, prev_qty: 1200, curr_qty: 400 },
    { id: 2, item: "PCC 1:4:8 Work", unit: "CuM", rate: 4200, prev_qty: 80, curr_qty: 30 },
    { id: 3, item: "RCC M25 Column", unit: "CuM", rate: 8500, prev_qty: 40, curr_qty: 15 },
    { id: 4, item: "Brick Masonry", unit: "CuM", rate: 3200, prev_qty: 120, curr_qty: 60 },
  ];

  const grossAmount = BOQ_ITEMS.reduce((s, item) => s + item.curr_qty * item.rate, 0);
  const gstAmount = grossAmount * 0.18;
  const totalWithGST = grossAmount + gstAmount;

  return (
    <div className="space-y-5">
      {/* Header Row: Sub-tabs + Action Button — same layout as InvoicesSection */}
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
            {["All", "Certified", "Pending", "Draft", "Rejected"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {activeSubTab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Running Account Bills</h3>
              <p className="text-xs text-slate-400 mt-0.5">Progress billing based on site measurements</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["RA Bill No", "Client", "Project", "Billing Period", "Billing Date", "Gross Amt", "GST %", "GST Amt", "Total w/ GST", "Net Payable", "Status", "Certified By", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(rb => (
                  <tr key={rb.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap">
                    <td className="px-4 py-3 text-xs font-bold text-primary">{rb.bill_no}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{rb.client}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{rb.project}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rb.billing_from} to {rb.billing_to}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rb.billing_date}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 text-right">{fmt(rb.gross_amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{rb.gst_percent}%</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{fmt(rb.gst_amount)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{fmt(rb.total_with_gst)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{fmt(rb.net_payable)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(rb.status)}`}>{rb.status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rb.certified_by}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-primary transition-all" title="View">👁</button>
                        <button onClick={() => { setEditingRABill(rb); handleTabChange("create"); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Edit">✏️</button>
                        <button onClick={() => toast.success("RA Bill PDF downloaded!")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all" title="PDF">📄</button>
                        <button onClick={() => handleDelete(rb.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "create" && (
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Project Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
                Project Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "RA Bill Number", name: "bill_no", placeholder: "Auto: RA/PRJ/005", readOnly: true, val: editingRABill?.bill_no },
                  { label: "Client Name", name: "client", placeholder: "Select client…", val: editingRABill?.client },
                  { label: "Project Name", name: "project", placeholder: "Select project…", val: editingRABill?.project },
                  { label: "Billing Period From", name: "billing_from", placeholder: "2026-06-01", type: "date", val: editingRABill?.billing_from },
                  { label: "Billing Period To", name: "billing_to", placeholder: "2026-06-30", type: "date", val: editingRABill?.billing_to },
                  { label: "Billing Date", name: "billing_date", placeholder: "2026-07-01", type: "date", val: editingRABill?.billing_date },
                ].map((f, i) => (
                  <div key={i}>
                    <label className={labelClasses}>{f.label}</label>
                    <input type={f.type || "text"} name={f.name} placeholder={f.placeholder} readOnly={f.readOnly} defaultValue={f.val || ""}
                      className={inputClasses(f.readOnly)} />
                  </div>
                ))}
              </div>
            </div>

            {/* BOQ Work Progress Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
                BOQ Work Progress
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {[
                        { label: "#", align: "text-left" },
                        { label: "BOQ Item", align: "text-left" },
                        { label: "Unit", align: "text-left" },
                        { label: "Rate (₹)", align: "text-right" },
                        { label: "Prev Qty", align: "text-right" },
                        { label: "Curr Qty", align: "text-right" },
                        { label: "Total Qty", align: "text-right" },
                        { label: "Amount (₹)", align: "text-right" },
                      ].map(h => (
                        <th key={h.label} className={`px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap ${h.align}`}>{h.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {BOQ_ITEMS.map((item, idx) => {
                      const totalQty = item.prev_qty + item.curr_qty;
                      const amount = item.curr_qty * item.rate;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2.5 text-xs text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-slate-700">{item.item}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-500">{item.unit}</td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-slate-700 text-right">{item.rate.toLocaleString("en-IN")}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-500 text-right">{item.prev_qty.toLocaleString("en-IN")}</td>
                          <td className="px-3 py-2.5 text-right">
                            <input type="number" defaultValue={editingRABill ? item.curr_qty : ""}
                              className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right" />
                          </td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-slate-700 text-right">{totalQty.toLocaleString("en-IN")}</td>
                          <td className="px-3 py-2.5 text-xs font-bold text-slate-800 text-right">{fmt(amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">4</span>
                Attachments
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {["Measurement Sheet", "BOQ Reference", "RA Bill PDF"].map(att => (
                  <label key={att} className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-blue-50/30 transition-all group">
                    <div className="text-2xl mb-2">📎</div>
                    <p className="text-xs font-semibold text-slate-500 group-hover:text-primary">{att}</p>
                    <input type="file" className="hidden" />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Bill Summary Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
                Bill Summary
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Gross Amount", value: fmt(grossAmount) },
                  { label: "GST (18%)", value: fmt(gstAmount) },
                  { label: "Total with GST", value: fmt(totalWithGST), bold: true },
                  { label: "Net Payable", value: fmt(totalWithGST), bold: true, accent: true },
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
                      <input type="radio" name="payment_status" value={s} defaultChecked={editingRABill?.payment_status === s || s === "Pending"} className="accent-primary" />
                      <span className="text-xs font-semibold text-slate-600">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit"
                className="w-full mt-6 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all active:scale-95 shadow-md shadow-primary/20">
                {editingRABill ? "Update RA Bill" : "Create RA Bill"}
              </button>
              <button type="button" onClick={() => handleTabChange("list")}
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
            {raBills.filter(r => r.status !== "Certified").map(rb => (
              <div key={rb.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{rb.bill_no} — {rb.client}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{rb.project} · Period: {rb.billing_from} to {rb.billing_to}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">{fmt(rb.total_with_gst)}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${statusBadge(rb.status)}`}>{rb.status}</span>
                  <button onClick={() => handleApprove(rb.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all active:scale-95">Certify</button>
                  <button onClick={() => handleReject(rb.id)} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 hover:bg-rose-100 transition-all active:scale-95">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};



// 5. Collections
const CollectionsSection = () => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Total Collected", value: fmt(81240), icon: "💰", color: "bg-emerald-50 text-emerald-600" },
        { label: "Pending Collection", value: fmt(132750), icon: "⏳", color: "bg-amber-50 text-amber-600" },
        { label: "Overdue", value: fmt(84960), icon: "🚨", color: "bg-rose-50 text-rose-600" },
        { label: "Follow-ups Today", value: "3", icon: "📞", color: "bg-blue-50 text-blue-600" },
      ].map((k, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${k.color} flex items-center justify-center text-2xl`}>{k.icon}</div>
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
        <button onClick={() => toast.success("Payment recorded!")} className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-600 transition-all active:scale-95">+ Record Payment</button>
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
            {MOCK_COLLECTIONS.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs font-bold text-primary">{c.invoice}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">{c.client}</td>
                <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-right">{c.amount > 0 ? fmt(c.amount) : "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{c.received_on}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{c.mode}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{c.ref}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(c.status)}`}>{c.status}</span></td>
                <td className="px-4 py-3">
                  {c.status !== "Received" && (
                    <button onClick={() => toast.success("Follow-up sent!")} className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-primary rounded-lg border border-blue-100 hover:bg-blue-100 transition-all">Follow Up</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// 6. Client Ledger
const ClientLedgerSection = () => {
  const [selectedClient, setSelectedClient] = useState("Aditya Enterprises");
  const clients = [...new Set(MOCK_INVOICES.map(i => i.client_name))];

  return (
    <div className="space-y-5">
      {/* Client Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="space-y-1.5 flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Client</label>
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
              className="w-full max-w-sm px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
              {clients.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-5">
            <button onClick={() => toast.success("Client statement downloaded!")} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:border-primary/30 hover:text-primary transition-all">📥 Client Statement</button>
            <button onClick={() => toast.success("Outstanding summary downloaded!")} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:border-primary/30 hover:text-primary transition-all">📊 Outstanding Summary</button>
          </div>
        </div>
      </div>

      {/* Outstanding Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Billed", value: fmt(21240 + 118000 + 132750 + 84960) },
          { label: "Total Received", value: fmt(21240 + 60000), green: true },
          { label: "Outstanding", value: fmt(118000 - 60000 + 132750 + 84960), red: true },
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
          <h3 className="font-bold text-slate-800">Transaction History — {selectedClient}</h3>
          <p className="text-xs text-slate-400 mt-0.5">All debits and credits in chronological order</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["Date", "Particulars", "Debit (₹)", "Credit (₹)", "Balance (₹)"].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_LEDGER.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-xs text-slate-500">{row.date}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-700">{row.particulars}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-indigo-700 text-right">{row.debit > 0 ? fmt(row.debit) : "—"}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-emerald-700 text-right">{row.credit > 0 ? fmt(row.credit) : "—"}</td>
                  <td className={`px-5 py-3 text-xs font-bold text-right ${row.balance < 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmt(Math.abs(row.balance))}</td>
                </tr>
              ))}
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
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📥</span> Import
            </button>
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📤</span> Export
            </button>
            <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
              <span className="text-base leading-none">+</span> New Receivable
            </button>
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

export default ReceivablesPage;
