import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Search,
  FileText,
  Eye,
  Trash2,
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
import CreateInvoiceModal from "../../components/forms/CreateInvoiceModal";
import InvoiceDetailsModal from "../../components/dashboard/InvoiceDetailsModal";
import ClientSelectionModal from "../../components/forms/ClientSelectionModal";
import { financeService } from "../../services/financeService";
import { projectService } from "../../services/projectService";
import { ownerService } from "../../services/ownerService";
import { paymentService } from "../../services/paymentService";
import type { Project } from "../../types/project";
import type { Invoice, InvoiceType } from "../../types/invoice";



const STATUS_BADGE: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold",
  draft: "bg-slate-100 text-slate-700 border border-slate-300 font-bold",
  converted: "bg-blue-100 text-blue-700 border border-blue-300 font-bold",
  paid: "bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold",
  pending: "bg-amber-100 text-amber-700 border border-amber-300 font-bold",
  partial: "bg-orange-100 text-orange-700 border border-orange-300 font-bold",
  rejected: "bg-rose-100 text-rose-700 border border-rose-300 font-bold",
  declined: "bg-rose-100 text-rose-700 border border-rose-300 font-bold",
  cancelled: "bg-rose-100 text-rose-700 border border-rose-300 font-bold",
};

const AllInvoicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [dummyQuotations, setDummyQuotations] = useState<Quotation[]>([]);
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
  const initialTab = useMemo<"invoices" | "quotations" | "dummy_quotations">(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "dummy_quotations" || tabParam === "draft" || tabParam === "draft_quotations") {
      return "dummy_quotations";
    }
    if (tabParam === "quotations") {
      return "quotations";
    }
    const sessionTab = sessionStorage.getItem("admin_invoices_active_tab");
    if (sessionTab === "dummy_quotations" || sessionTab === "quotations" || sessionTab === "invoices") {
      return sessionTab as any;
    }
    return "invoices";
  }, [searchParams]);
  const [activeTab, setActiveTab] = useState<"invoices" | "quotations" | "dummy_quotations">(initialTab);
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
    const tabParam = searchParams.get("tab");
    if (tabParam === "dummy_quotations" || tabParam === "draft" || tabParam === "draft_quotations") {
      setActiveTab("dummy_quotations");
      sessionStorage.setItem("admin_invoices_active_tab", "dummy_quotations");
    } else if (tabParam === "quotations") {
      setActiveTab("quotations");
      sessionStorage.setItem("admin_invoices_active_tab", "quotations");
    } else if (tabParam === "invoices") {
      setActiveTab("invoices");
      sessionStorage.setItem("admin_invoices_active_tab", "invoices");
    }
  }, [searchParams]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // Fetch invoices, projects, owners and payment history to accurately sync payment statuses
        const [invData, projData, ownersRes, paymentHistory] = await Promise.all([
          financeService.getInvoices(200).catch(() => []),
          projectService.getProjects(100, 0).catch(() => []),
          ownerService.getOwners().catch(() => []),
          paymentService.getClientPaymentHistory().catch(() => [])
        ]);

        const projList = Array.isArray(projData)
          ? projData
          : projData.items || projData.data || [];

        const paidInvIds = new Set<string>();
        const paidProjectIds = new Set<string>();
        const paidProjectNames = new Set<string>();
        const paidInvoiceNumbers = new Set<string>();

        if (Array.isArray(paymentHistory)) {
          paymentHistory.forEach((p: any) => {
            const s = String(p.payment_status || p.status || p.invoice_status || "").toUpperCase();
            const isCompletedPayment =
              s === "VERIFIED" ||
              s === "PAID" ||
              s === "APPROVED" ||
              s === "COMPLETED" ||
              s === "SUCCESS" ||
              Boolean(p.verified_by) ||
              Boolean(p.verified_at) ||
              Number(p.amount) > 0;

            if (isCompletedPayment) {
              if (p.invoice_id != null) {
                paidInvIds.add(String(p.invoice_id));
                const digits = String(p.invoice_id).replace(/\D/g, "");
                if (digits) paidInvIds.add(digits);
              }
              if (p.project_id != null) {
                paidProjectIds.add(String(p.project_id));
              }
              if (p.project_name || p.projectName) {
                paidProjectNames.add(String(p.project_name || p.projectName).toLowerCase().trim());
              }
              if (p.invoice_no) {
                paidInvoiceNumbers.add(String(p.invoice_no).toUpperCase().trim());
                const digits = String(p.invoice_no).replace(/\D/g, "");
                if (digits) paidInvIds.add(digits);
              }
              if (p.invoiceNo) {
                paidInvoiceNumbers.add(String(p.invoiceNo).toUpperCase().trim());
                const digits = String(p.invoiceNo).replace(/\D/g, "");
                if (digits) paidInvIds.add(digits);
              }
            }
          });
        }

        const locallyPaidSet = new Set<string>();
        try {
          const stored = JSON.parse(localStorage.getItem("infrapilot_paid_invoices") || "[]");
          if (Array.isArray(stored)) {
            stored.forEach((id: any) => {
              locallyPaidSet.add(String(id));
              const d = String(id).replace(/\D/g, "");
              if (d) locallyPaidSet.add(d);
            });
          }
        } catch { }

        const rawList = Array.isArray(invData) ? invData : (invData as any)?.items || [];
        const syncedInvoices: Invoice[] = rawList.map((inv: any) => {
          const invIdStr = String(inv.id || "");
          const invDigits = invIdStr.replace(/\D/g, "");
          const invNo = String(inv.invoice_number || inv.invoice_no || `INV-${invIdStr.padStart(3, "0")}`).toUpperCase().trim();

          const isDirectlyPaid =
            (inv.status || "").toLowerCase() === "paid" ||
            (inv.payment_status || "").toLowerCase() === "paid" ||
            (Number(inv.total_amount) > 0 && Number(inv.paid_amount) >= Number(inv.total_amount));

          const invProj = projList.find((p: any) => String(p.id) === String(inv.project_id));
          const invProjName = (invProj?.project_name || (inv as any).project_name || "").toLowerCase().trim();
          const desc = String(inv.description || "").toLowerCase().trim();

          const isPaymentMatch =
            locallyPaidSet.has(invIdStr) ||
            (invDigits && locallyPaidSet.has(invDigits)) ||
            paidInvIds.has(invIdStr) ||
            (invDigits && paidInvIds.has(invDigits)) ||
            paidInvoiceNumbers.has(invNo) ||
            (inv.project_id != null && paidProjectIds.has(String(inv.project_id))) ||
            (invProjName && Array.from(paidProjectNames).some(name => invProjName.includes(name) || name.includes(invProjName))) ||
            Array.from(paidProjectNames).some(name => desc.includes(name));

          const isPaid = isDirectlyPaid || isPaymentMatch;

          return isPaid
            ? { ...inv, status: "paid" as any, payment_status: "paid", paid_amount: Number(inv.paid_amount) || Number(inv.total_amount) || 0, pending_amount: 0 }
            : inv;
        });

        setInvoices(syncedInvoices);
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

      // Dummy quotations
      quotationService.getDummyQuotations()
        .then(dummyData => setDummyQuotations(dummyData))
        .catch(error => {
          console.error("Failed to load dummy quotations", error);
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
      const detail = error.response?.data?.detail;
      const message = typeof detail === 'string'
        ? detail
        : (Array.isArray(detail)
            ? detail.map((d: any) => d.msg || d.message).join(', ')
            : (typeof detail === 'object' && detail?.message ? detail.message : (error.response?.data?.message || error.message || "Failed to create invoice")));
      toast.error(message);
    }
  };



  const handleDelete = async () => {
    if (!deleteTarget) return;

    const itemToDelete = displayData.find((d: any) => d.id === deleteTarget);
    if (itemToDelete?.isQuotation) {
      const qStatus = (itemToDelete.status || "").toLowerCase();
      if (qStatus === "approved") {
        toast.error("Approved quotations cannot be deleted.");
        setDeleteTarget(null);
        return;
      }
      if (qStatus === "converted") {
        toast.error("Converted quotations cannot be deleted.");
        setDeleteTarget(null);
        return;
      }
    }

    setIsDeleting(true);
    try {
      if (itemToDelete?.isQuotation) {
        if (activeTab === "dummy_quotations") {
          await quotationService.deleteDummyQuotation(deleteTarget);
          const data = await quotationService.getDummyQuotations();
          setDummyQuotations(data);
        } else {
          await quotationService.deleteQuotation(deleteTarget);
          const data = await quotationService.getQuotations();
          setQuotations(data);
        }
      } else {
        await financeService.deleteInvoice(deleteTarget);
        const invData = await financeService.getInvoices(200);
        setInvoices(Array.isArray(invData) ? invData : []);
      }
      toast.success("Deleted successfully");
    } catch (error: any) {
      const detail = error.response?.data?.detail || error.response?.data?.message || error.message;
      toast.error(typeof detail === "string" ? detail : "Failed to delete");
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
    const term = searchTerm.toLowerCase().trim();
    return quotations.filter((q) => {
      const rawId = String(q.id || "").toLowerCase();
      const qtnId = `qtn-${q.id}`.toLowerCase();
      const formattedId = q.id ? `qt/2026/${String(q.id).padStart(4, "0")}`.toLowerCase() : "";
      const matchSearch = !term ||
        (q.quotation_no || "").toLowerCase().includes(term) ||
        (q.client_name || "").toLowerCase().includes(term) ||
        (q.project_name || "").toLowerCase().includes(term) ||
        rawId === term || rawId.includes(term) ||
        qtnId.includes(term) ||
        formattedId.includes(term);
      const matchStatus =
        statusFilter === "all" ||
        q.status?.toLowerCase() === statusFilter.toLowerCase();
      const matchProject = projectFilter === "all" || String(q.project_id) === projectFilter;
      return matchSearch && matchStatus && matchProject;
    });
  }, [quotations, searchTerm, statusFilter, projectFilter]);

  const filteredDummyQuotations = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return dummyQuotations.filter((q) => {
      const rawId = String(q.id || "").toLowerCase();
      const qtnId = `qtn-${q.id}`.toLowerCase();
      const formattedId = q.id ? `qt/2026/${String(q.id).padStart(4, "0")}`.toLowerCase() : "";
      const matchSearch = !term ||
        (q.quotation_no || "").toLowerCase().includes(term) ||
        (q.client_name || "").toLowerCase().includes(term) ||
        (q.project_name || "").toLowerCase().includes(term) ||
        rawId === term || rawId.includes(term) ||
        qtnId.includes(term) ||
        formattedId.includes(term);
      const matchStatus =
        statusFilter === "all" ||
        (q.status || "draft").toLowerCase() === statusFilter.toLowerCase();
      const matchProject = projectFilter === "all" || String(q.project_id) === projectFilter;
      return matchSearch && matchStatus && matchProject;
    });
  }, [dummyQuotations, searchTerm, statusFilter, projectFilter]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const proj = projects.find((p) => String(p.id) === String(inv.project_id));
      const projName = proj?.project_name || "";
      const matchSearch =
        projName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inv.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        `INV-${inv.id}`.toLowerCase().includes(searchTerm.toLowerCase());

      const isPaid =
        String(inv.status || inv.payment_status || "").toLowerCase() === "paid" ||
        (Number(inv.total_amount) > 0 && Number(inv.paid_amount) >= Number(inv.total_amount));

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter.toLowerCase() === "paid"
          ? isPaid
          : statusFilter.toLowerCase() === "pending"
          ? !isPaid
          : String(inv.status || "").toLowerCase() === statusFilter.toLowerCase());

      const selectedProject = projects.find((p) => String(p.id) === projectFilter);
      const selectedProjName = (selectedProject?.project_name || "").toLowerCase().trim();

      const matchProject =
        projectFilter === "all" ||
        String(inv.project_id) === projectFilter ||
        (proj && String(proj.id) === projectFilter) ||
        (selectedProjName !== "" && (
          projName.toLowerCase().includes(selectedProjName) ||
          selectedProjName.includes(projName.toLowerCase()) ||
          (inv.description || "").toLowerCase().includes(selectedProjName)
        ));

      return matchSearch && matchStatus && matchProject;
    });
  }, [invoices, projects, searchTerm, statusFilter, projectFilter]);

  const unifiedAllData = useMemo(() => {
    // Map converted quotations to invoice-like structure
    const mappedQuotations = filteredQuotations.map(q => ({
      id: q.id,
      isQuotation: true,
      invoice_no: q.quotation_no || (q.id ? `QT/2026/${String(q.id).padStart(4, "0")}` : "-"),
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
      if (typeFilter === "invoice") return item.type !== "labour" && item.type !== "material";
      return item.type?.toLowerCase() === typeFilter.toLowerCase();
    });

    return finalFiltered.sort((a, b) => {
      const aDate = new Date(a.created_at || 0).getTime();
      const bDate = new Date(b.created_at || 0).getTime();
      return sortOrder === "latest" ? bDate - aDate : aDate - bDate;
    });
  }, [filteredInvoices, filteredQuotations, projects, sortOrder, typeFilter]);
  const displayData = activeTab === "dummy_quotations"
    ? filteredDummyQuotations.map(q => {
      const gstVal = q.cgst_amount != null && q.cgst_amount > 0
        ? q.cgst_amount
        : (q.gst_amount || ((q.cgst_amount || 0) + (q.sgst_amount || 0)) || 0);
      const taxVal = q.sgst_amount != null && q.sgst_amount > 0
        ? q.sgst_amount
        : ((q as any).tax_amount || q.tds_amount || 0);

      return {
        id: q.id,
        isQuotation: true,
        client_user_id: q.client_user_id,
        invoice_no: q.quotation_no || "",
        project_name: q.project_name || "Unknown Project",
        client_name: q.client_name,
        description: "Dummy Quotation",
        type: "quotation",
        amount: q.subtotal || 0,
        gst_amount: gstVal,
        tax_amount: taxVal,
        total_amount: q.grand_total || 0,
        paid_amount: q.advance_paid || 0,
        pending_amount: q.balance_due || 0,
        status: q.status || "draft",
        created_at: q.created_at
      };
    })
    : activeTab === "quotations"
      ? filteredQuotations.map(q => ({
        id: q.id,
        isQuotation: true,
        client_user_id: q.client_user_id,
        invoice_no: q.quotation_no || (q.id ? `QT/2026/${String(q.id).padStart(4, "0")}` : "-"),
        project_name: q.project_name || "Unknown Project",
        client_name: q.client_name,
        description: "Quotation",
        type: "quotation",
        amount: q.subtotal || 0,
        gst_amount: q.gst_amount || ((q.cgst_amount || 0) + (q.sgst_amount || 0)) || 0,
        tax_amount: (q as any).tax_amount || q.tds_amount || 0,
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
              onClick={() => {
                setActiveTab("invoices");
                setCurrentPage(0);
                setSearchTerm("");
                setStatusFilter("all");
                setType("all");
                setProjectFilter("all");
                sessionStorage.setItem("admin_invoices_active_tab", "invoices");
                setSearchParams({ tab: "invoices" });
              }}
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
              onClick={() => {
                setActiveTab("quotations");
                setCurrentPage(0);
                setSearchTerm("");
                setStatusFilter("all");
                setType("all");
                setProjectFilter("all");
                sessionStorage.setItem("admin_invoices_active_tab", "quotations");
                setSearchParams({ tab: "quotations" });
              }}
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
            <button
              onClick={() => {
                setActiveTab("dummy_quotations");
                setCurrentPage(0);
                setSearchTerm("");
                setStatusFilter("all");
                setType("all");
                setProjectFilter("all");
                sessionStorage.setItem("admin_invoices_active_tab", "dummy_quotations");
                setSearchParams({ tab: "dummy_quotations" });
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "dummy_quotations"
                ? "bg-primary text-white shadow-md shadow-primary/20"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}
            >
              <Layers className="w-4 h-4" />
              Draft Quotation
              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${activeTab === "dummy_quotations" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                }`}>{dummyQuotations.length}</span>
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
                  placeholder={
                    activeTab === "quotations"
                      ? "Search quotations, clients, descriptions..."
                      : activeTab === "dummy_quotations"
                        ? "Search draft quotations, clients, descriptions..."
                        : "Search invoices, clients, descriptions..."
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                {activeTab === "invoices" && (
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
                {activeTab !== "quotations" && activeTab !== "dummy_quotations" && (
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
                {activeTab !== "dummy_quotations" && (
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
                )}
                <SortDropdown value={sortOrder} onChange={setSortOrder} />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-4 py-4 whitespace-nowrap">
                      {activeTab === "dummy_quotations" ? "Quotation ID" : activeTab === "quotations" ? "Quotation No" : "Invoice #"}
                    </th>
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
                      <td colSpan={14} className="px-6 py-20 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading...</p>
                      </td>
                    </tr>
                  ) : pagedData.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="px-6 py-20 text-center">
                        <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No records found</p>
                      </td>
                    </tr>
                  ) : (
                    pagedData.map((inv: any) => {
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-4 py-4 text-sm font-black text-slate-800 whitespace-nowrap">
                            {activeTab === "dummy_quotations" ? (inv.invoice_no || `QTN-${inv.id}`) : inv.invoice_no}
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
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${STATUS_BADGE[String(inv.status || "pending").toLowerCase()] || (String(inv.status).toLowerCase().includes("reject") ? "bg-rose-100 text-rose-600 border border-rose-200" : "bg-slate-100 text-slate-600 border border-slate-200")}`}>
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
                                  to={activeTab === 'dummy_quotations' ? `/admin/quotations/draft/${inv.id}` : `/admin/quotations/view/${inv.id}`}
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
                              {(() => {
                                const isQuotation = inv.isQuotation;
                                const isApproved = isQuotation && (inv.status || "").toLowerCase() === "approved";
                                const isConverted = isQuotation && (inv.status || "").toLowerCase() === "converted";
                                const isProtected = isApproved || isConverted;
                                const deleteTitle = isApproved
                                  ? "Approved quotations cannot be deleted"
                                  : isConverted
                                  ? "Converted quotations cannot be deleted"
                                  : isQuotation ? "Delete Quotation" : "Delete Invoice";

                                return (
                                  <button
                                    onClick={() => {
                                      if (isApproved) {
                                        toast.error("Approved quotations cannot be deleted.");
                                        return;
                                      }
                                      if (isConverted) {
                                        toast.error("Converted quotations cannot be deleted.");
                                        return;
                                      }
                                      if (inv.id) setDeleteTarget(inv.id);
                                    }}
                                    className={`p-2 rounded-lg transition-all ${
                                      isProtected
                                        ? "text-slate-300 opacity-40 cursor-not-allowed hover:text-slate-300"
                                        : "text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                                    }`}
                                    title={deleteTitle}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                );
                              })()}
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
          const t = toast.loading("Marking invoice as paid...");
          try {
            const currentInv = invoices.find(inv => inv.id === id) || viewingInvoice;
            const updated = await financeService.markInvoicePaid(id, currentInv || undefined);
            toast.success("Invoice marked as paid!", { id: t });
            setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...(updated || {}), status: "paid", payment_status: "PAID", paid_amount: inv.total_amount, pending_amount: 0 } : inv));
            if (viewingInvoice && viewingInvoice.id === id) {
              setViewingInvoice(prev => prev ? { ...prev, ...(updated || {}), status: "paid", payment_status: "PAID", paid_amount: prev.total_amount, pending_amount: 0 } : null);
            }
            // Background refresh without overwriting paid status
            financeService.getInvoices(200).then(invData => {
              const rawList = Array.isArray(invData) ? invData : (invData as any)?.items || [];
              if (rawList.length > 0) {
                setInvoices(prev => rawList.map((inv: any) => {
                  const existing = prev.find(p => p.id === inv.id);
                  const isPaid = existing && ((existing.status || "").toLowerCase() === "paid" || (existing.payment_status || "").toLowerCase() === "paid");
                  return isPaid
                    ? { ...inv, status: "paid" as any, payment_status: "PAID", paid_amount: inv.total_amount || inv.amount, pending_amount: 0 }
                    : inv;
                }));
              }
            }).catch(() => {});
            setViewingInvoice(null);
          } catch (err: any) {
            toast.error(err?.message || "Failed to update status", { id: t });
          }
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
