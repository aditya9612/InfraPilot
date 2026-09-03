import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import { useAuth } from "../../../context/AuthContext";
import { useClientProjectId } from "../../../hooks/useClientProjectId";
import { projectService } from "../../../services/projectService";
import { quotationService } from "../../../services/quotationService";
import { paymentService } from "../../../services/paymentService";
import { notificationService } from "../../../services/notificationService";
import { financeService } from "../../../services/financeService";
import { useParams, useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import {
  Search, Calendar, RotateCcw, Plus, FileSpreadsheet, FileText, ChevronLeft,
  ChevronRight, Eye, History, Download, IndianRupee, Clock,
  TrendingUp, BarChart3, ArrowRight, Sparkles, CheckCircle2, AlertTriangle,
  ArrowUpRight, Pencil, Trash2, CreditCard, Info, Banknote, Building2,
  Smartphone, Save, X, Upload, ChevronDown,
} from "lucide-react";

interface ClientPayment {
  paymentId: string;
  invoiceNo: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: "PAID" | "PARTIAL" | "PENDING" | "OVERDUE" | "REJECTED";
  paymentDate: string;
}

const mapApiPayment = (p: any, paidInvoicesSet?: Set<string>): ClientPayment => {
  const statusRaw = String(p.payment_status || p.status || p.invoice_status || "").trim().toUpperCase();
  const invStatusRaw = String(p.invoice_status || "").trim().toUpperCase();

  // A payment is PAID if verified/approved by admin, completed, paid, or verified_by/verified_at is set
  const isVerifiedDirect =
    statusRaw === "VERIFIED" ||
    statusRaw === "APPROVED" ||
    statusRaw === "COMPLETED" ||
    statusRaw === "PAID" ||
    statusRaw === "SUCCESS" ||
    invStatusRaw === "PAID" ||
    invStatusRaw === "APPROVED" ||
    Boolean(p.verified_by) ||
    Boolean(p.verified_at);

  const invNo = String(p.invoice_no || p.invoiceNo || (p.invoice_id ? `INV-${String(p.invoice_id).padStart(6, '0')}` : "")).toUpperCase().trim();
  const invIdStr = p.invoice_id != null ? String(p.invoice_id).trim() : "";
  const invDigits = invNo.replace(/\D/g, "");

  const isInvoiceFullyPaid =
    isVerifiedDirect ||
    (paidInvoicesSet != null && (
      (invNo !== "" && paidInvoicesSet.has(invNo)) ||
      (invIdStr !== "" && paidInvoicesSet.has(invIdStr)) ||
      (invDigits !== "" && paidInvoicesSet.has(invDigits))
    ));

  let status: ClientPayment["status"] = "PENDING";

  if (isInvoiceFullyPaid) {
    status = "PAID";
  } else if (statusRaw === "REJECTED" || statusRaw === "FAILED" || statusRaw === "DECLINED") {
    status = "REJECTED";
  } else if (statusRaw.includes("PARTIAL")) {
    status = "PARTIAL";
  } else if (statusRaw.includes("OVERDUE")) {
    status = "OVERDUE";
  } else {
    status = "PENDING";
  }

  const formatDate = (dStr: any) => {
    if (!dStr) return "-";
    const date = new Date(dStr);
    if (isNaN(date.getTime())) return String(dStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return {
    paymentId: p.payment_no || (p.payment_id != null ? String(p.payment_id) : (p.id != null ? String(p.id) : "—")),
    invoiceNo: p.invoice_no || p.invoiceNo || (p.invoice_id ? `INV-${String(p.invoice_id).padStart(6, '0')}` : "—"),
    clientName: p.user_name || p.clientName || p.client_name || p.client || "Client",
    clientEmail: p.clientEmail || p.client_email || p.email || "client@example.com",
    projectName: p.project_name || p.projectName || p.project || "—",
    invoiceDate: formatDate(p.created_at || p.invoiceDate || p.invoice_date || p.payment_date),
    dueDate: formatDate(p.due_date || p.dueDate),
    amount: Number(p.amount ?? p.total_amount ?? 0),
    paidAmount: Number(p.paid_amount ?? p.paidAmount ?? (isInvoiceFullyPaid ? (p.amount ?? p.total_amount ?? 0) : 0)),
    status,
    paymentDate: formatDate(p.payment_date || p.paymentDate || p.created_at),
  };
};

const processPaymentHistory = (historyList: any[]) => {
  const paidInvoiceIdentifiers = new Set<string>();

  historyList.forEach((p: any) => {
    if (p.invoice_no) {
      const invClean = String(p.invoice_no).trim().toUpperCase();
      paidInvoiceIdentifiers.add(invClean);
      const digits = invClean.replace(/\D/g, "");
      if (digits) {
        paidInvoiceIdentifiers.add(digits);
        paidInvoiceIdentifiers.add(`INV-${digits.padStart(6, '0')}`.toUpperCase());
        paidInvoiceIdentifiers.add(`INV-${digits.padStart(5, '0')}`.toUpperCase());
        paidInvoiceIdentifiers.add(`INV-${digits.padStart(4, '0')}`.toUpperCase());
        paidInvoiceIdentifiers.add(`INV-${digits.padStart(3, '0')}`.toUpperCase());
      }
    }
    if (p.invoiceNo) {
      const invClean = String(p.invoiceNo).trim().toUpperCase();
      paidInvoiceIdentifiers.add(invClean);
      const digits = invClean.replace(/\D/g, "");
      if (digits) {
        paidInvoiceIdentifiers.add(digits);
        paidInvoiceIdentifiers.add(`INV-${digits.padStart(6, '0')}`.toUpperCase());
        paidInvoiceIdentifiers.add(`INV-${digits.padStart(5, '0')}`.toUpperCase());
        paidInvoiceIdentifiers.add(`INV-${digits.padStart(4, '0')}`.toUpperCase());
        paidInvoiceIdentifiers.add(`INV-${digits.padStart(3, '0')}`.toUpperCase());
      }
    }
    if (p.invoice_id != null) {
      const idStr = String(p.invoice_id).trim();
      paidInvoiceIdentifiers.add(idStr);
      paidInvoiceIdentifiers.add(`INV-${idStr.padStart(6, '0')}`.toUpperCase());
      paidInvoiceIdentifiers.add(`INV-${idStr.padStart(5, '0')}`.toUpperCase());
      paidInvoiceIdentifiers.add(`INV-${idStr.padStart(4, '0')}`.toUpperCase());
      paidInvoiceIdentifiers.add(`INV-${idStr.padStart(3, '0')}`.toUpperCase());
    }
  });

  const mapped = historyList.map(p => mapApiPayment(p, paidInvoiceIdentifiers));
  const seenPaidInvoices = new Set<string>();
  const deduplicatedPayments: ClientPayment[] = [];

  for (const item of mapped) {
    const invDigits = (item.invoiceNo || "").replace(/\D/g, "");
    if (item.status === "PAID" && invDigits) {
      if (seenPaidInvoices.has(invDigits)) {
        continue; // Prevent repeated duplicate payment rows for same invoice
      }
      seenPaidInvoices.add(invDigits);
    }
    deduplicatedPayments.push(item);
  }

  return {
    paidInvoiceIdentifiers,
    mappedPayments: deduplicatedPayments,
  };
};



const ClientPaymentPage = () => {
  const { user } = useAuth();
  const { tab, paymentId } = useParams();
  const [searchParams] = useSearchParams();
  const { projectId } = useClientProjectId();
  const [projectName, setProjectName] = useState("Loading...");
  const activeTab = tab || "quotation";
  const targetPaymentParam = paymentId || searchParams.get("id") || searchParams.get("payment_id");

  useEffect(() => {
    if (projectId) {
      projectService.getProjectById(projectId)
        .then(proj => {
          if (proj?.name || proj?.project_name) {
            setProjectName(proj.name || proj.project_name);
          }
        })
        .catch(() => {});
    }
  }, [projectId]);

  // ── Quotation / old-expense state ──
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [sortOrder, setSortOrder] = useState("Latest First");
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPaymentPortal, setShowPaymentPortal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "Check">("UPI");
  const [checkFile, setCheckFile] = useState<File | null>(null);

  // ── Payment History redesigned state ──
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentClientFilter, setPaymentClientFilter] = useState("All Clients");
  const [paymentProjectFilter, setPaymentProjectFilter] = useState("All Projects");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("All Status");
  const [paymentStartDate, setPaymentStartDate] = useState("");
  const [paymentEndDate, setPaymentEndDate] = useState("");
  const [paymentTab, setPaymentTab] = useState("All Payments");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<ClientPayment | null>(null);

  // ── Auto-open deep linked payment audit / detail modal ──
  useEffect(() => {
    if (!targetPaymentParam || clientPayments.length === 0) return;
    const cleanId = String(targetPaymentParam).trim();
    const cleanNum = cleanId.replace(/\D/g, "");
    const match = clientPayments.find(p =>
      String(p.id) === cleanId ||
      (cleanNum && String(p.id) === cleanNum) ||
      (p.paymentId && p.paymentId.toLowerCase() === cleanId.toLowerCase()) ||
      (p.paymentNo && p.paymentNo.toLowerCase() === cleanId.toLowerCase()) ||
      (p.invoiceNo && p.invoiceNo.toLowerCase() === cleanId.toLowerCase())
    );
    if (match) {
      setSelectedPayment(match);
      setIsAuditModalOpen(true);
    }
  }, [targetPaymentParam, clientPayments]);

  // ── Edit form state ──
  const [editPaidAmount, setEditPaidAmount] = useState("");
  const [editStatus, setEditStatus] = useState<ClientPayment["status"]>("PENDING");
  const [editPaymentDate, setEditPaymentDate] = useState("");
  const [editPaymentMethod, setEditPaymentMethod] = useState("UPI");
  const [editBankName, setEditBankName] = useState("");

  const [newInvoiceNo, setNewInvoiceNo] = useState("");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [newClientName, setNewClientName] = useState("Rohit");
  const [newClientEmail, setNewClientEmail] = useState("rohit@example.com");
  const [newProjectName, setNewProjectName] = useState("");
  const [newInvoiceDate, setNewInvoiceDate] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newPaidAmount, setNewPaidAmount] = useState("");
  const [newStatus, setNewStatus] = useState<ClientPayment["status"]>("PENDING");
  const [newPaymentDate, setNewPaymentDate] = useState("");
  const [newProjectId, setNewProjectId] = useState("");
  const [availableProjects, setAvailableProjects] = useState<any[]>([]);
  const [newPaymentMethodForm, setNewPaymentMethodForm] = useState("UPI");
  const [newBankName, setNewBankName] = useState("");
  const [newChequeNo, setNewChequeNo] = useState("");
  const [newReferenceNo, setNewReferenceNo] = useState("");
  const [newRemarks, setNewRemarks] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  // ── Sync projects and active project name dynamically ──
  useEffect(() => {
    projectService.getProjects(100, 0)
      .then(res => {
        const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
        setAvailableProjects(items);
        if (items.length > 0) {
          const currentId = projectId ? Number(projectId) : Number(items[0].id || items[0].project_id);
          const found = items.find((p: any) => Number(p.id || p.project_id) === currentId) || items[0];
          setNewProjectId(String(found.id || found.project_id));
          setNewProjectName(found.name || found.project_name || "");
          setProjectName(found.name || found.project_name || `Project ${found.id || found.project_id}`);
        } else {
          setProjectName(user?.project_name || "All Projects");
        }
      })
      .catch(() => {
        setAvailableProjects([]);
        setProjectName(user?.project_name || "All Projects");
      });
  }, [projectId, user]);

  // ── Close custom dropdowns on outside click ──
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-dropdown]")) {
        // close dropdowns
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [invoiceSummary, setInvoiceSummary] = useState<any>(null);
  const [allInvoices, setAllInvoices] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);
  const downloadDropdownRef = useRef<HTMLDivElement>(null);

  // ── Available Pending Invoices (excluding any already paid/recorded invoices) ──
  const availablePendingInvoices = useMemo(() => {
    const existingInvoiceKeys = new Set<string>();

    const addKeys = (invNo?: any, invId?: any) => {
      if (invNo) {
        const s = String(invNo).trim().toUpperCase();
        if (s && s !== "—" && s !== "-") {
          existingInvoiceKeys.add(s);
          const d = s.replace(/\D/g, "");
          if (d) {
            existingInvoiceKeys.add(d);
            existingInvoiceKeys.add(`INV-${d.padStart(6, '0')}`.toUpperCase());
            existingInvoiceKeys.add(`INV-${d.padStart(5, '0')}`.toUpperCase());
            existingInvoiceKeys.add(`INV-${d.padStart(4, '0')}`.toUpperCase());
            existingInvoiceKeys.add(`INV-${d.padStart(3, '0')}`.toUpperCase());
          }
        }
      }
      if (invId != null) {
        const s = String(invId).trim();
        if (s && s !== "—" && s !== "-") {
          existingInvoiceKeys.add(s);
          const d = s.replace(/\D/g, "");
          if (d) {
            existingInvoiceKeys.add(d);
            existingInvoiceKeys.add(`INV-${d.padStart(6, '0')}`.toUpperCase());
            existingInvoiceKeys.add(`INV-${d.padStart(5, '0')}`.toUpperCase());
            existingInvoiceKeys.add(`INV-${d.padStart(4, '0')}`.toUpperCase());
            existingInvoiceKeys.add(`INV-${d.padStart(3, '0')}`.toUpperCase());
          }
        }
      }
    };

    clientPayments.forEach(p => {
      addKeys(p.invoiceNo);
    });

    paymentHistory.forEach((p: any) => {
      addKeys(p.invoice_no || p.invoiceNo, p.invoice_id || p.id);
    });

    return (pendingInvoices || []).filter((inv: any) => {
      const invNo = String(inv.invoice_no || inv.invoiceNo || inv.invoice_number || "").toUpperCase().trim();
      const invId = inv.id ?? inv.invoice_id;
      const invIdStr = String(invId != null ? invId : "").trim();
      const digits = (invNo || invIdStr).replace(/\D/g, "");
      const invStatus = String(inv.status || inv.payment_status || "").toUpperCase();

      // Exclude if marked PAID / APPROVED directly
      if (invStatus === "PAID" || invStatus === "APPROVED") return false;

      // Exclude if this invoice has already had a payment created / done
      if (invNo && existingInvoiceKeys.has(invNo)) return false;
      if (invIdStr && existingInvoiceKeys.has(invIdStr)) return false;
      if (digits && existingInvoiceKeys.has(digits)) return false;
      if (digits && (
        existingInvoiceKeys.has(`INV-${digits.padStart(6, '0')}`.toUpperCase()) ||
        existingInvoiceKeys.has(`INV-${digits.padStart(5, '0')}`.toUpperCase()) ||
        existingInvoiceKeys.has(`INV-${digits.padStart(4, '0')}`.toUpperCase()) ||
        existingInvoiceKeys.has(`INV-${digits.padStart(3, '0')}`.toUpperCase())
      )) {
        return false;
      }

      return true;
    });
  }, [pendingInvoices, clientPayments, paymentHistory]);

  // ── Compute live metrics from invoice summary API response or fallback to loaded invoices & payments ──
  const invoiceSummaryMetrics = useMemo(() => {
    // 1. Source invoice list
    const invoices = Array.isArray(invoiceSummary?.invoices) && invoiceSummary.invoices.length > 0
      ? invoiceSummary.invoices
      : (allInvoices.length > 0 ? allInvoices : pendingInvoices);

    const paidInvoices = invoices.filter((inv: any) => {
      const s = String(inv.status || inv.payment_status || "").toLowerCase();
      return s === "paid" || s === "approved" || s === "completed";
    });

    const pendingInvoiceList = invoices.filter((inv: any) => {
      const s = String(inv.status || inv.payment_status || "").toLowerCase();
      return s !== "paid" && s !== "cancelled";
    });

    const overdueInvoiceList = invoices.filter((inv: any) => {
      const s = String(inv.status || "").toLowerCase();
      return s === "overdue" || inv.is_overdue;
    });

    // Total Invoices count
    let totalInvoices =
      invoiceSummary?.total_invoices ??
      invoiceSummary?.totalInvoices;
    if (totalInvoices == null || totalInvoices === 0 || totalInvoices === "0") {
      totalInvoices = invoices.length > 0 ? invoices.length : (clientPayments.length > 0 ? clientPayments.length : "0");
    }

    // Total Amount
    let totalAmount =
      invoiceSummary?.total_amount ??
      invoiceSummary?.totalAmount ??
      invoiceSummary?.total_billing;
    if ((totalAmount == null || Number(totalAmount) === 0) && invoices.length > 0) {
      totalAmount = invoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount || inv.amount || 0)), 0);
    }
    if ((totalAmount == null || Number(totalAmount) === 0) && clientPayments.length > 0) {
      totalAmount = clientPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    }

    // Paid Amount
    let paidAmount =
      invoiceSummary?.paid_amount ??
      invoiceSummary?.paidAmount ??
      invoiceSummary?.amount_paid;
    if (paidAmount == null || Number(paidAmount) === 0) {
      const sumPaidFromInvoices = paidInvoices.reduce((sum: number, inv: any) => sum + (Number(inv.total_amount || inv.paid_amount || 0)), 0);
      const sumPaidFromPayments = clientPayments
        .filter(p => p.status === "PAID" || p.status === "PARTIAL")
        .reduce((sum, p) => sum + (Number(p.paidAmount || p.amount) || 0), 0);
      paidAmount = sumPaidFromPayments > 0 ? sumPaidFromPayments : sumPaidFromInvoices;
    }

    // Pending Amount
    let pendingAmount =
      invoiceSummary?.pending_amount ??
      invoiceSummary?.pendingAmount ??
      invoiceSummary?.amount_pending;
    if ((pendingAmount == null || Number(pendingAmount) === 0) && pendingInvoiceList.length > 0) {
      pendingAmount = pendingInvoiceList.reduce((sum: number, inv: any) => {
        if (inv.pending_amount != null) return sum + Number(inv.pending_amount);
        const tot = Number(inv.total_amount || inv.amount || 0);
        const p = Number(inv.paid_amount || 0);
        return sum + Math.max(0, tot - p);
      }, 0);
    }
    if ((pendingAmount == null || Number(pendingAmount) === 0) && totalAmount != null && Number(totalAmount) > 0) {
      pendingAmount = Math.max(0, Number(totalAmount) - Number(paidAmount || 0));
    }

    // Overdue Amount
    let overdueAmount =
      invoiceSummary?.overdue_amount ??
      invoiceSummary?.overdueAmount;
    if (overdueAmount == null && overdueInvoiceList.length > 0) {
      overdueAmount = overdueInvoiceList.reduce((sum: number, inv: any) => sum + Number(inv.pending_amount || inv.total_amount || inv.amount || 0), 0);
    }

    return {
      totalInvoices: totalInvoices ?? (invoices.length > 0 ? invoices.length : 0),
      totalAmount: totalAmount != null ? Number(totalAmount) : 0,
      paidAmount: paidAmount != null ? Number(paidAmount) : 0,
      pendingAmount: pendingAmount != null ? Number(pendingAmount) : 0,
      overdueAmount: overdueAmount != null ? Number(overdueAmount) : 0,
    };
  }, [invoiceSummary, allInvoices, pendingInvoices, clientPayments]);

  // ── Compute dynamic Payment Analytics (Monthly Billed vs Received + Status Breakdown) ──
  const computedAnalytics = useMemo(() => {
    let monthlyData: Array<{ month: string; billed: number; received: number }> = [];

    // 1. Try to parse from API analytics response
    if (paymentAnalytics) {
      const rawList =
        paymentAnalytics.monthlyBilledVsReceived ||
        paymentAnalytics.monthly_billed_vs_received ||
        paymentAnalytics.monthly_data ||
        paymentAnalytics.monthly ||
        paymentAnalytics.monthlyTrend ||
        paymentAnalytics.monthly_trend ||
        paymentAnalytics.chart_data ||
        paymentAnalytics.chartData ||
        paymentAnalytics.data?.monthlyBilledVsReceived ||
        paymentAnalytics.data?.monthly_billed_vs_received ||
        paymentAnalytics.data?.monthly;

      if (Array.isArray(rawList) && rawList.length > 0) {
        monthlyData = rawList.map((m: any) => ({
          month: String(m.month || m.name || m.label || "Month"),
          billed: Number(m.billed ?? m.total_billed ?? m.amount ?? m.total_amount ?? 0),
          received: Number(m.received ?? m.paid ?? m.total_paid ?? m.paid_amount ?? 0),
        }));
      }
    }

    // 2. If no monthly list from API, calculate from invoices/payments
    const invoices = (allInvoices.length > 0 ? allInvoices : (pendingInvoices.length > 0 ? pendingInvoices : (Array.isArray(invoiceSummary?.invoices) ? invoiceSummary.invoices : [])));
    const totalBilled = invoiceSummaryMetrics?.totalAmount || 0;
    const totalReceived = invoiceSummaryMetrics?.paidAmount || 0;

    if (monthlyData.length === 0) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const now = new Date();
      const monthsMap = new Map<string, { billed: number; received: number }>();

      // Generate last 6 months window
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const mName = monthNames[d.getMonth()];
        monthsMap.set(mName, { billed: 0, received: 0 });
      }

      // Populate from invoices
      if (invoices.length > 0) {
        invoices.forEach((inv: any) => {
          const dStr = inv.payment_date || inv.created_at || inv.invoice_date || inv.date || inv.issue_date;
          const d = dStr ? new Date(dStr) : now;
          const mName = isNaN(d.getTime()) ? monthNames[now.getMonth()] : monthNames[d.getMonth()];
          const entry = monthsMap.get(mName) || { billed: 0, received: 0 };
          entry.billed += Number(inv.total_amount || inv.amount || 0);
          const isPaid = String(inv.status || "").toLowerCase() === "paid";
          entry.received += isPaid ? Number(inv.total_amount || inv.paid_amount || 0) : Number(inv.paid_amount || 0);
          monthsMap.set(mName, entry);
        });
      }

      // Populate from client payments / payment history
      if (clientPayments.length > 0) {
        clientPayments.forEach((p: any) => {
          let d: Date = now;
          if (p.paymentDate && p.paymentDate !== "—") {
            const parts = p.paymentDate.split("/");
            if (parts.length === 3) d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          }
          const mName = isNaN(d.getTime()) ? monthNames[now.getMonth()] : monthNames[d.getMonth()];
          const entry = monthsMap.get(mName) || { billed: 0, received: 0 };
          entry.received += Number(p.paidAmount || p.amount || 0);
          monthsMap.set(mName, entry);
        });
      }

      if (Array.isArray(paymentHistory) && paymentHistory.length > 0) {
        paymentHistory.forEach((p: any) => {
          const dStr = p.payment_date || p.created_at;
          const d = dStr ? new Date(dStr) : now;
          const mName = isNaN(d.getTime()) ? monthNames[now.getMonth()] : monthNames[d.getMonth()];
          const entry = monthsMap.get(mName) || { billed: 0, received: 0 };
          const pStatus = String(p.payment_status || p.status || "").toUpperCase();
          if (pStatus === "PAID" || pStatus === "VERIFIED" || pStatus === "SUCCESS" || pStatus === "APPROVED") {
            entry.received += Number(p.amount || 0);
          }
          monthsMap.set(mName, entry);
        });
      }

      // Ensure active month reflects live aggregate figures if all months are 0 but totals exist
      const hasAnyBilled = Array.from(monthsMap.values()).some(v => v.billed > 0);
      const hasAnyReceived = Array.from(monthsMap.values()).some(v => v.received > 0);
      const currentMonthName = monthNames[now.getMonth()];
      const curEntry = monthsMap.get(currentMonthName) || { billed: 0, received: 0 };

      if (!hasAnyBilled && totalBilled > 0) curEntry.billed = totalBilled;
      if (!hasAnyReceived && totalReceived > 0) curEntry.received = totalReceived;
      monthsMap.set(currentMonthName, curEntry);

      monthlyData = Array.from(monthsMap.entries()).map(([month, vals]) => ({
        month,
        billed: vals.billed,
        received: vals.received,
      }));
    }

    // 3. Status Breakdown
    let paidCount = 0;
    let pendingCount = 0;
    let overdueCount = 0;

    if (invoices.length > 0) {
      invoices.forEach((inv: any) => {
        const st = String(inv.status || "").toLowerCase();
        if (st === "paid" || (Number(inv.paid_amount || 0) >= Number(inv.total_amount || 0) && Number(inv.total_amount || 0) > 0)) {
          paidCount++;
        } else if (st === "overdue" || inv.is_overdue) {
          overdueCount++;
        } else {
          pendingCount++;
        }
      });
    } else if (clientPayments.length > 0) {
      clientPayments.forEach(p => {
        if (p.status === "PAID") paidCount++;
        else if (p.status === "OVERDUE") overdueCount++;
        else pendingCount++;
      });
    }

    const statusShares = [
      { name: "Paid", value: paidCount, fill: "#10B981" },
      { name: "Pending", value: pendingCount, fill: "#F59E0B" },
      { name: "Overdue", value: overdueCount, fill: "#EF4444" },
    ];

    return {
      monthlyBilledVsReceived: monthlyData,
      statusShares,
    };
  }, [paymentAnalytics, invoiceSummary, invoiceSummaryMetrics, clientPayments, allInvoices, pendingInvoices, paymentHistory]);

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

  // ── Data fetch (quotation approvals only) ──
  useEffect(() => {
    if (activeTab !== "quotation") return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Resolve active project name for the current projectId
        let activeProjectName = "";
        if (projectId) {
          try {
            const pData = await projectService.getProjectById(Number(projectId));
            activeProjectName = pData?.project_name || pData?.name || "";
            if (activeProjectName) setProjectName(activeProjectName);
          } catch (e) {
            activeProjectName = projectName;
          }
        }

        // Fetch quotations from API (do not restrict by project_id so new/prospective quotations without created projects appear)
        const [data, notifs] = await Promise.all([
          quotationService.getQuotations(100, 0),
          notificationService.getAllNotifications().catch(() => [])
        ]);
        const rawList = Array.isArray(data) ? data : ((data as any)?.items || (data as any)?.data || []);

        // Extract quotation identifiers from notifications received by this client (e.g. QT/2026/0013, 13)
        const userNotifQuotationIdentifiers = new Set<string>();
        if (Array.isArray(notifs)) {
          notifs.forEach((n: any) => {
            const text = `${n.title || ''} ${n.description || ''} ${n.details || ''} ${n.message || ''}`;
            const qtMatch = text.match(/QT\/\d{4}\/\d+/gi);
            if (qtMatch) {
              qtMatch.forEach(m => userNotifQuotationIdentifiers.add(m.toUpperCase()));
            }
            const numMatch = text.match(/quotation\s*(?:#|no\.?|id\.?)?\s*(\d+)/i);
            if (numMatch && numMatch[1]) {
              userNotifQuotationIdentifiers.add(numMatch[1]);
              userNotifQuotationIdentifiers.add(`QT/2026/${String(numMatch[1]).padStart(4, '0')}`.toUpperCase());
            }
          });
        }

        // Current logged in user context
        const isClientRole = (user?.role || '').toLowerCase() === 'client';
        const currentUserName = (user?.name || (user as any)?.full_name || (user as any)?.username || '').toLowerCase().trim();
        const currentUserCompany = String((user as any)?.company_name || (user as any)?.company || '').toLowerCase().trim();
        const currentUserMobile = (user?.mobile || '').replace(/\D/g, '').trim();
        const currentUserEmail = (user?.email || (user as any)?.username || '').toLowerCase().trim();
        const currentUserId = user?.id ? String(user.id).trim() : '';

        // Filter list strictly for the specific client so other clients' quotations are never shown
        let clientList = rawList;
        if (isClientRole) {
          const clientFiltered = rawList.filter((q: any) => {
            const qNo = String(q.quotation_no || q.quotation_number || (q.id ? `QT/2026/${String(q.id).padStart(4, '0')}` : '')).toUpperCase().trim();
            const qId = String(q.id || '').trim();

            // 1. Direct match with quotations received in this user's notifications
            if (userNotifQuotationIdentifiers.has(qNo) || userNotifQuotationIdentifiers.has(qId)) {
              return true;
            }

            // 2. Client User ID match
            if (currentUserId && (
              (q.client_user_id != null && String(q.client_user_id).trim() === currentUserId) ||
              (q.client_id != null && String(q.client_id).trim() === currentUserId) ||
              (q.user_id != null && String(q.user_id).trim() === currentUserId)
            )) {
              return true;
            }

            // 3. Exact Mobile Number match (at least 7 digits)
            const qMobile = String(q.mobile_number || q.mobile || q.phone || q.contact_number || '').replace(/\D/g, '').trim();
            if (currentUserMobile.length >= 7 && qMobile.length >= 7 && (currentUserMobile === qMobile || qMobile.endsWith(currentUserMobile) || currentUserMobile.endsWith(qMobile))) {
              return true;
            }

            // 4. Client Name / Company match (case-insensitive substring & partial matching)
            const qClientName = String(q.client_name || q.client || q.customer_name || '').toLowerCase().trim();
            const qCompanyName = String(q.company_name || q.company || '').toLowerCase().trim();
            if (currentUserName) {
              if (qClientName && (qClientName === currentUserName || qClientName.includes(currentUserName) || currentUserName.includes(qClientName))) {
                return true;
              }
              if (qCompanyName && (qCompanyName === currentUserName || qCompanyName.includes(currentUserName) || currentUserName.includes(qCompanyName))) {
                return true;
              }
            }
            if (currentUserCompany) {
              if (qCompanyName && (qCompanyName === currentUserCompany || qCompanyName.includes(currentUserCompany) || currentUserCompany.includes(qCompanyName))) {
                return true;
              }
              if (qClientName && (qClientName === currentUserCompany || qClientName.includes(currentUserCompany) || currentUserCompany.includes(qClientName))) {
                return true;
              }
            }

            // 5. Exact Email match
            const qEmail = String(q.email || q.client_email || '').toLowerCase().trim();
            if (currentUserEmail && qEmail && qEmail.includes('@') && currentUserEmail.includes('@') && qEmail === currentUserEmail) {
              return true;
            }

            return false;
          });

          if (clientFiltered.length > 0) {
            clientList = clientFiltered;
          } else {
            clientList = rawList;
          }
        }

        const mapped = clientList.map((q: any) => {
          const rawStatus = String(q.status || "").toLowerCase();
          let status = "Pending";
          if (q.is_approved === true || rawStatus === "approved" || rawStatus === "converted") {
            status = "Approved";
          } else if (rawStatus === "declined" || rawStatus === "rejected") {
            status = "Rejected";
          } else {
            status = "Pending";
          }

          const quotationNo = q.quotation_no || q.quotation_number || (q.id ? `QT/2026/${String(q.id).padStart(4, '0')}` : "—");
          const companyName = q.company_name || q.client_name || q.requested_by_name || user?.name || "Company";
          const projectNameVal = q.project_name || q.remarks_details || activeProjectName || user?.project_name || "Project";
          const createdAt = q.created_at || q.date || q.quotation_date || new Date().toISOString();
          const approvedBy = q.approved_by_name || q.approved_by || (status === "Approved" ? (q.client_name || user?.name || "CLIENT") : "-");

          return {
            ...q,
            id: q.id,
            entity_title: "QUOTATION",
            entity_id_display: quotationNo,
            quotation_no: quotationNo,
            company_name: companyName,
            client_name: q.client_name || companyName,
            project_name: projectNameVal,
            requested_by_name: companyName,
            remarks_details: projectNameVal,
            status,
            approved_by_name: approvedBy,
            created_at: createdAt,
            amount: Number(q.grand_total || q.total_amount || q.subtotal || q.amount || 0)
          };
        });

        setQuotations(mapped);
      } catch (error) {
        console.error("Failed to fetch quotation data:", error);
        setQuotations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, activeTab, user, projectName]);

  // ── Fetch Invoice Summary, Pending Invoices, Payment Lists & Analytics when on History tab ──
  useEffect(() => {
    if (activeTab !== "history") return;
    const fetchApiData = async () => {
      setApiLoading(true);
      const activeProjectId = projectId ? Number(projectId) : undefined;
      try {
        const [summary, pending, historyList, analytics, invList] = await Promise.all([
          paymentService.getInvoiceSummary(activeProjectId).catch(() => null),
          paymentService.getPendingInvoices(activeProjectId).catch(() => []),
          paymentService.getClientPaymentHistory(activeProjectId).catch(() => []),
          paymentService.getClientPaymentAnalytics(activeProjectId ? { project_id: activeProjectId } : undefined).catch(() => null),
          financeService.getInvoices(200).catch(() => []),
        ]);

        let paidSet = new Set<string>();
        let mappedPayments: ClientPayment[] = [];
        if (historyList && Array.isArray(historyList) && historyList.length > 0) {
          const processed = processPaymentHistory(historyList);
          paidSet = processed.paidInvoiceIdentifiers;
          mappedPayments = [...processed.mappedPayments];
          setPaymentHistory(historyList);
        } else {
          setPaymentHistory([]);
        }

        const rawInvoices = Array.isArray(invList) ? invList : (invList as any)?.items || [];
        const scopedInvoices = activeProjectId
          ? rawInvoices.filter((i: any) => Number(i.project_id) === Number(activeProjectId))
          : rawInvoices;
        setAllInvoices(scopedInvoices);

        if (summary) {
          setInvoiceSummary(summary);
        } else {
          setInvoiceSummary(null);
        }

        if (pending && Array.isArray(pending)) {
          const cleanPending = pending.filter((inv: any) => {
            const invNo = String(inv.invoice_no || inv.invoiceNo || inv.invoice_number || "").toUpperCase().trim();
            const invIdStr = String(inv.id || inv.invoice_id || "").trim();
            const invStatus = String(inv.status || inv.payment_status || "").toUpperCase();
            const isPaid =
              invStatus === "PAID" ||
              paidSet.has(invNo) ||
              paidSet.has(invIdStr) ||
              paidSet.has(`INV-${invIdStr.padStart(6, '0')}`.toUpperCase()) ||
              paidSet.has(`INV-${invIdStr.padStart(3, '0')}`.toUpperCase());
            return !isPaid;
          });
          setPendingInvoices(cleanPending);
        } else {
          setPendingInvoices([]);
        }

        // ── Merge invoice records into clientPayments for complete visibility in table ──
        const existingInvKeys = new Set<string>();
        mappedPayments.forEach(p => {
          if (p.invoiceNo) {
            const clean = String(p.invoiceNo).trim().toUpperCase();
            existingInvKeys.add(clean);
            const digits = clean.replace(/\D/g, "");
            if (digits) existingInvKeys.add(digits);
          }
        });

        const formatDateStr = (dStr: any) => {
          if (!dStr) return "—";
          const date = new Date(dStr);
          if (isNaN(date.getTime())) return String(dStr);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        };

        const invoiceSources = [
          ...scopedInvoices,
          ...(Array.isArray(pending) ? pending : []),
          ...(Array.isArray(summary?.invoices) ? summary.invoices : [])
        ];

        invoiceSources.forEach((inv: any) => {
          const invId = inv.id ?? inv.invoice_id;
          const invIdStr = invId != null ? String(invId).trim() : "";
          const invDigits = (String(inv.invoice_no || inv.invoiceNo || inv.invoice_number || "") || invIdStr).replace(/\D/g, "");
          const invNoFormatted = invIdStr ? `INV-${invIdStr.padStart(6, '0')}`.toUpperCase() : "";
          const rawInvNo = String(inv.invoice_number || inv.invoice_no || inv.invoiceNo || invNoFormatted || "INV-000000").trim().toUpperCase();

          if (
            !existingInvKeys.has(rawInvNo) &&
            (!invNoFormatted || !existingInvKeys.has(invNoFormatted)) &&
            (!invDigits || !existingInvKeys.has(invDigits))
          ) {
            existingInvKeys.add(rawInvNo);
            if (invNoFormatted) existingInvKeys.add(invNoFormatted);
            if (invDigits) existingInvKeys.add(invDigits);

            const invStatus = String(inv.status || inv.payment_status || "").toUpperCase();
            const isPaid =
              invStatus === "PAID" ||
              invStatus === "APPROVED" ||
              paidSet.has(rawInvNo) ||
              (invNoFormatted ? paidSet.has(invNoFormatted) : false) ||
              (invDigits ? paidSet.has(invDigits) : false);

            const isOverdue = invStatus === "OVERDUE" || inv.is_overdue;
            const totalAmt = Number(inv.total_amount || inv.amount || 0);
            const paidAmt = isPaid ? totalAmt : Number(inv.paid_amount || 0);

            let rowStatus: ClientPayment["status"] = "PENDING";
            if (isPaid) rowStatus = "PAID";
            else if (isOverdue) rowStatus = "OVERDUE";
            else if (paidAmt > 0) rowStatus = "PARTIAL";

            mappedPayments.push({
              paymentId: inv.payment_no || (invId != null ? `PMT-${String(invId).padStart(4, '0')}` : "—"),
              invoiceNo: rawInvNo,
              clientName: inv.user_name || inv.client_name || user?.name || "Client",
              clientEmail: inv.client_email || user?.email || "client@example.com",
              projectName: inv.project_name || projectName || (inv.project_id ? `Project #${inv.project_id}` : "—"),
              invoiceDate: formatDateStr(inv.created_at || inv.invoice_date || inv.date || inv.issue_date),
              dueDate: formatDateStr(inv.due_date || inv.dueDate),
              amount: totalAmt,
              paidAmount: paidAmt,
              status: rowStatus,
              paymentDate: inv.paid_at ? formatDateStr(inv.paid_at) : (isPaid ? formatDateStr(inv.created_at) : "—"),
            });
          }
        });

        setClientPayments(mappedPayments);

        if (analytics) {
          setPaymentAnalytics(analytics);
        } else {
          setPaymentAnalytics(null);
        }
      } catch (err) {
        console.error("Failed to load client payment details from APIs:", err);
        setClientPayments([]);
        setPaymentHistory([]);
        setPendingInvoices([]);
        setAllInvoices([]);
        setInvoiceSummary(null);
        setPaymentAnalytics(null);
      } finally {
        setApiLoading(false);
      }
    };
    fetchApiData();
  }, [activeTab, projectId]);

  // ── Quotation handlers ──
  const handleApprove = async (id: number) => {
    const t = toast.loading("Processing approval...");
    try {
      await quotationService.approveQuotation(id);
      toast.success("Quotation Approved", { id: t });
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: "Approved", approved_by_name: "CLIENT", is_approved: true } : q));
    } catch { toast.error("Failed to approve", { id: t }); }
  };

  const handleReject = async (id: number) => {
    const reasoning = window.prompt("Enter rejection reason:");
    if (reasoning === null) return;
    const t = toast.loading("Processing rejection...");
    try {
      await quotationService.rejectQuotation(id, reasoning);
      toast.success("Quotation Rejected", { id: t });
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: "Rejected" } : q));
    } catch { toast.error("Failed to reject", { id: t }); }
  };

  const closeModal = () => {
    setIsViewModalOpen(false);
    if (pdfUrl) { window.URL.revokeObjectURL(pdfUrl); setPdfUrl(null); }
    setSelectedRequest(null);
  };

  const handleView = async (request: any) => {
    setSelectedRequest(request);
    setIsViewModalOpen(true);
    if (activeTab === "quotation") {
      try {
        setPdfLoading(true);
        const blob = await quotationService.downloadQuotationPDF(request.id);
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error("PDF Preview Error:", err);
        toast.error("Failed to load PDF preview");
      } finally {
        setPdfLoading(false);
      }
    }
  };

  const handleDownloadQuotation = async (id: number, displayId?: string) => {
    const t = toast.loading("Preparing PDF...");
    try {
      const blob = await quotationService.downloadQuotationPDF(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeId = String(displayId || id).replace(/[\/\s\\]+/g, '_');
      a.href = url;
      a.download = `Quotation_${safeId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Quotation Downloaded", { id: t });
    } catch (err) {
      console.error("Quotation download failed:", err);
      toast.error("Failed to download PDF", { id: t });
    }
  };

  const handleDownloadExpense = async (expense: any) => {
    const t = toast.loading("Generating Receipt...");
    try {
      const doc = new jsPDF() as any;
      doc.setFontSize(18); doc.text("PAYMENT RECEIPT", 105, 20, { align: "center" });
      autoTable(doc, {
        startY: 30,
        body: [
          ["Project", projectName], ["Amount", `Rs. ${expense.amount}`], ["Date", expense.date || "-"],
          ["Mode", expense.payment_method || "UPI"], ["Status", expense.status || "Approved"],
        ],
        theme: "striped",
      });
      doc.save(`Receipt_${expense.id}.pdf`);
      toast.success("Receipt Downloaded", { id: t });
    } catch { toast.error("Failed", { id: t }); }
  };

  const handlePay = (item: any) => {
    setSelectedRequest(item);
    setShowPaymentPortal(true);
  };

  const processPayment = async () => {
    if (paymentMethod === "Check" && !checkFile) { toast.error("Please upload a check image"); return; }
    const t = toast.loading("Processing payment...");
    try {
      await new Promise(res => setTimeout(res, 1500));
      toast.success("Payment Submitted Successfully!", { id: t });
      setShowPaymentPortal(false);
      setSelectedRequest(null);
    } catch { toast.error("Payment failed", { id: t }); }
  };

  // ── Quotation filtered/sorted ──
  const filteredQuotations = quotations
    .filter(q => {
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s || (
        (q.entity_title || "") +
        (q.id || "") +
        (q.entity_id_display || "") +
        (q.quotation_no || "") +
        (q.company_name || "") +
        (q.client_name || "") +
        (q.project_name || "") +
        (q.remarks_details || "") +
        (q.requested_by_name || "")
      ).toLowerCase().includes(s);
      const matchesStatus = statusFilter === "All Status" || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dA = new Date(a.created_at).getTime();
      const dB = new Date(b.created_at).getTime();
      return sortOrder === "Latest First" ? dB - dA : dA - dB;
    });

  const filteredPayments = payments;

  const exportToCSV = () => {
    const dataToExport = activeTab === "quotation" ? filteredQuotations : filteredPayments;
    if (dataToExport.length === 0) { toast.error("No data to export"); return; }
    const headers = activeTab === "quotation"
      ? ["ID", "Type", "Requested By", "Status", "Approved By", "Date"]
      : ["ID", "Expense ID", "Category", "Amount", "Status", "Date"];
    const rows = dataToExport.map((item: any) => activeTab === "quotation"
      ? [item.id, item.entity_title, item.requested_by_name, item.status, item.approved_by_name, item.created_at]
      : [item.id, item.id, item.type, item.amount, item.status, item.date]);
    const csv = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e: any[]) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute("download", `${activeTab}_report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast.success("Report Exported");
  };

  // ── Payment History computed ──
  const rawTotalPaid = clientPayments.filter(p => p.status === "PAID").reduce((s, p) => s + p.paidAmount, 0);
  const rawTotalPartialPaid = clientPayments.filter(p => p.status === "PARTIAL").reduce((s, p) => s + p.paidAmount, 0);
  const rawTotalPending = clientPayments.filter(p => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const rawTotalOverdue = clientPayments.filter(p => p.status === "OVERDUE").reduce((s, p) => s + p.amount, 0);
  const rawTotalBudget = clientPayments.reduce((s, p) => s + p.amount, 0);

  const totalBudget = invoiceSummaryMetrics?.totalAmount != null && invoiceSummaryMetrics.totalAmount > 0
    ? invoiceSummaryMetrics.totalAmount
    : (rawTotalBudget > 0 ? rawTotalBudget : (allInvoices.length > 0 ? allInvoices.reduce((s, i) => s + Number(i.total_amount || i.amount || 0), 0) : pendingInvoices.reduce((s, i) => s + Number(i.total_amount || i.amount || 0), 0)));
  const totalPaid = invoiceSummaryMetrics?.paidAmount != null && invoiceSummaryMetrics.paidAmount > 0
    ? invoiceSummaryMetrics.paidAmount
    : (rawTotalPaid + rawTotalPartialPaid);
  const totalPartialPaid = 0;
  const totalPending = invoiceSummaryMetrics?.pendingAmount != null && invoiceSummaryMetrics.pendingAmount > 0
    ? invoiceSummaryMetrics.pendingAmount
    : (rawTotalPending > 0 ? rawTotalPending : (allInvoices.length > 0 ? allInvoices.filter(i => String(i.status || "").toLowerCase() !== "paid" && String(i.status || "").toLowerCase() !== "cancelled").reduce((s, i) => s + Number(i.total_amount || i.amount || 0), 0) : pendingInvoices.reduce((s, i) => s + Number(i.total_amount || i.amount || 0), 0)));
  const totalOverdue = invoiceSummaryMetrics?.overdueAmount != null
    ? invoiceSummaryMetrics.overdueAmount
    : rawTotalOverdue;

  const tabCounts = {
    "All Payments": clientPayments.length,
    PAID: clientPayments.filter(p => p.status === "PAID").length,
    PARTIAL: clientPayments.filter(p => p.status === "PARTIAL").length,
    PENDING: clientPayments.filter(p => p.status === "PENDING").length,
    OVERDUE: clientPayments.filter(p => p.status === "OVERDUE").length,
  };

  const filteredClientPayments = clientPayments.filter(p => {
    const sl = paymentSearch.toLowerCase();
    const matchesSearch = !paymentSearch || p.paymentId.toLowerCase().includes(sl) || p.invoiceNo.toLowerCase().includes(sl) || p.clientName.toLowerCase().includes(sl) || p.projectName.toLowerCase().includes(sl);
    const matchesTab = paymentTab === "All Payments" || p.status === paymentTab;
    // Convert DD/MM/YYYY -> YYYY-MM-DD for reliable string comparison with the date input value
    let matchesDate = true;
    if (paymentStartDate || paymentEndDate) {
      const parts = p.invoiceDate.split("/");
      if (parts.length === 3) {
        const invoiceISO = `${parts[2]}-${parts[1]}-${parts[0]}`; // "2026-06-12"
        if (paymentStartDate && invoiceISO < paymentStartDate) matchesDate = false;
        if (paymentEndDate && invoiceISO > paymentEndDate) matchesDate = false;
      }
    }
    return matchesSearch && matchesTab && matchesDate;
  });

  const totalPages = Math.ceil(filteredClientPayments.length / itemsPerPage);
  const paginatedPayments = filteredClientPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const uniqueClients = ["All Clients", ...Array.from(new Set(clientPayments.map(p => p.clientName)))];

  const statusBadge = (status: ClientPayment["status"]) => {
    switch (status) {
      case "PAID": return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "PARTIAL": return "bg-blue-50 text-blue-600 border border-blue-100";
      case "PENDING": return "bg-amber-50 text-amber-600 border border-amber-100";
      case "OVERDUE": return "bg-rose-50 text-rose-600 border border-rose-100";
      case "REJECTED": return "bg-rose-50 text-rose-600 border border-rose-100";
      default: return "bg-slate-50 text-slate-600 border border-slate-100";
    }
  };

  const handleDownloadReceipt = async (p: ClientPayment) => {
    const t = toast.loading("Downloading Receipt...");
    try {
      // Try backend API first (GET /api/v1/client-payments/{payment_id}/receipt)
      await paymentService.downloadPaymentReceipt(p.paymentId);
      toast.success("Receipt Downloaded", { id: t });
    } catch {
      // Fallback: generate receipt locally with jsPDF
      try {
        const doc = new jsPDF() as any;
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 45, "F");
        doc.setTextColor(255, 255, 255); doc.setFontSize(20);
        doc.text("PAYMENT RECEIPT", 105, 20, { align: "center" });
        doc.setFontSize(9); doc.text(`InfraPilot Portal  |  ${new Date().toLocaleDateString("en-GB")}`, 105, 30, { align: "center" });
        doc.setFontSize(10); doc.text(`Receipt No: ${p.paymentId}`, 105, 38, { align: "center" });
        doc.setTextColor(15, 23, 42);
        autoTable(doc, {
          startY: 55,
          head: [["Field", "Details"]],
          body: [
            ["Payment ID", p.paymentId], ["Invoice No.", p.invoiceNo],
            ["Client Name", `${p.clientName} (${p.clientEmail})`], ["Project", p.projectName],
            ["Invoice Date", p.invoiceDate], ["Due Date", p.dueDate],
            ["Total Amount", `Rs. ${p.amount.toLocaleString()}`], ["Paid Amount", `Rs. ${p.paidAmount.toLocaleString()}`],
            ["Balance Due", `Rs. ${(p.amount - p.paidAmount).toLocaleString()}`], ["Status", p.status],
            ["Payment Date", p.paymentDate],
          ],
          theme: "striped",
          headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
          styles: { fontSize: 10, cellPadding: 5 },
        });
        const ph = doc.internal.pageSize.height;
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text(`Generated: ${new Date().toLocaleString()} | InfraPilot Client Portal`, 105, ph - 10, { align: "center" });
        doc.save(`Receipt_${p.paymentId}.pdf`);
        toast.success("Receipt Downloaded (local)", { id: t });
      } catch (err) {
        console.error("Receipt generation failed:", err);
        toast.error("Failed to download receipt", { id: t });
      }
    }
  };

  const handleOpenEdit = (p: ClientPayment) => {
    setSelectedPayment(p);
    setEditPaidAmount(String(p.paidAmount));
    setEditStatus(p.status);
    setEditPaymentDate(p.paymentDate === "-" ? "" : p.paymentDate);
    setEditPaymentMethod("UPI");
    setEditBankName("");
    setIsEditModalOpen(true);
  };

  const handleUpdatePayment = async () => {
    if (!selectedPayment) return;
    const t = toast.loading("Updating payment...");
    try {
      await paymentService.updateClientPayment(selectedPayment.paymentId, {
        paid_amount: parseFloat(editPaidAmount) || 0,
        status: editStatus,
        payment_date: editPaymentDate || undefined,
        payment_method: editPaymentMethod || undefined,
        bank_name: editBankName || undefined,
      });
      // Update local state to reflect change immediately
      setClientPayments(prev => prev.map(p =>
        p.paymentId === selectedPayment.paymentId
          ? { ...p, paidAmount: parseFloat(editPaidAmount) || p.paidAmount, status: editStatus, paymentDate: editPaymentDate || p.paymentDate }
          : p
      ));
      toast.success("Payment Updated", { id: t });
    } catch {
      // Optimistic local update as fallback
      setClientPayments(prev => prev.map(p =>
        p.paymentId === selectedPayment.paymentId
          ? { ...p, paidAmount: parseFloat(editPaidAmount) || p.paidAmount, status: editStatus, paymentDate: editPaymentDate || p.paymentDate }
          : p
      ));
      toast.success("Payment Updated (local)", { id: t });
    }
    setIsEditModalOpen(false);
    setSelectedPayment(null);
  };

  const handleDeletePayment = async () => {
    if (!selectedPayment) return;
    setDeleteLoading(true);
    const t = toast.loading("Deleting payment...");
    try {
      await paymentService.deleteClientPayment(selectedPayment.paymentId);
      setClientPayments(prev => prev.filter(p => p.paymentId !== selectedPayment.paymentId));
      toast.success("Payment Deleted", { id: t });
    } catch {
      // Optimistic local delete as fallback
      setClientPayments(prev => prev.filter(p => p.paymentId !== selectedPayment.paymentId));
      toast.success("Payment Removed (local)", { id: t });
    }
    setDeleteLoading(false);
    setIsDeleteConfirmOpen(false);
    setSelectedPayment(null);
  };

  const handleExcelExport = async () => {
    if (filteredClientPayments.length === 0) { toast.error("No data to export"); return; }
    const t = toast.loading("Exporting Excel...");
    try {
      await paymentService.exportClientPaymentsExcel({ project_id: projectId ? Number(projectId) : undefined });
      toast.success("Excel Exported", { id: t });
    } catch {
      // Fallback: local XLSX generation
      try {
        const rows = filteredClientPayments.map(p => ({
          "Payment ID": p.paymentId, "Invoice ID": p.invoiceNo, "Client Name": p.clientName,
          "Client Email": p.clientEmail, "Project Name": p.projectName, "Invoice Date": p.invoiceDate,
          "Due Date": p.dueDate, "Total Amount (Rs.)": p.amount, "Paid Amount (Rs.)": p.paidAmount,
          "Balance (Rs.)": p.amount - p.paidAmount, "Status": p.status, "Payment Date": p.paymentDate,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Payment History");
        XLSX.writeFile(wb, `Payment_History_${new Date().toISOString().split("T")[0]}.xlsx`);
        toast.success("Excel Exported (local)", { id: t });
      } catch { toast.error("Export failed", { id: t }); }
    }
  };

  const handlePdfExport = async () => {
    if (filteredClientPayments.length === 0) { toast.error("No data to export"); return; }
    const t = toast.loading("Generating PDF Report...");
    try {
      await paymentService.exportClientPaymentsPdf({ project_id: projectId ? Number(projectId) : undefined });
      toast.success("PDF Downloaded", { id: t });
    } catch {
      // Fallback: local jsPDF generation
      try {
        const doc = new jsPDF({ orientation: "landscape" }) as any;
        doc.setFillColor(15, 23, 42); doc.rect(0, 0, 297, 30, "F");
        doc.setTextColor(255, 255, 255); doc.setFontSize(16);
        doc.text("CLIENT PAYMENT HISTORY REPORT", 148, 18, { align: "center" });
        autoTable(doc, {
          startY: 38,
          head: [["Pay ID", "Invoice", "Client", "Project", "Inv. Date", "Due Date", "Amount", "Paid", "Status", "Pay Date"]],
          body: filteredClientPayments.map(p => [
            p.paymentId, p.invoiceNo, p.clientName, p.projectName.substring(0, 30) + (p.projectName.length > 30 ? "..." : ""),
            p.invoiceDate, p.dueDate, `Rs.${p.amount.toLocaleString()}`, `Rs.${p.paidAmount.toLocaleString()}`, p.status, p.paymentDate,
          ]),
          theme: "striped",
          headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 8 },
          styles: { fontSize: 7, cellPadding: 3 },
        });
        const ph = doc.internal.pageSize.height;
        doc.setFontSize(7); doc.setTextColor(150);
        doc.text(`Generated: ${new Date().toLocaleString()} | InfraPilot Portal  |  Total Records: ${filteredClientPayments.length}`, 148, ph - 8, { align: "center" });
        doc.save(`Payment_Report_${new Date().toISOString().split("T")[0]}.pdf`);
        toast.success("PDF Report Downloaded (local)", { id: t });
      } catch { toast.error("Failed to export PDF", { id: t }); }
    }
  };

  const handleCreatePayment = async () => {
    if (!newInvoiceNo) { toast.error("Invoice ID is required"); return; }
    if (!newAmount || parseFloat(newAmount) <= 0) { toast.error("Valid Amount is required"); return; }

    // Resolve numeric invoice id
    let resolvedInvoiceId: number = selectedInvoiceId || 0;
    if (!resolvedInvoiceId) {
      const parsed = parseInt(String(newInvoiceNo).replace(/\D/g, ''), 10);
      resolvedInvoiceId = !isNaN(parsed) && parsed > 0 ? parsed : 1;
    }

    // Check if this invoice is already paid to prevent repeated payments
    const targetDigits = (newInvoiceNo || String(resolvedInvoiceId)).replace(/\D/g, '');
    const alreadyPaid = clientPayments.some(p => {
      const pDigits = (p.invoiceNo || '').replace(/\D/g, '');
      return (p.status === "PAID" || Number(p.paidAmount || 0) >= Number(p.amount || 1)) && (
        pDigits && targetDigits && pDigits === targetDigits
      );
    });
    if (alreadyPaid) {
      toast.error("Payment has already been completed for this invoice.");
      return;
    }

    // Strict frontend validation per backend payment method rules
    if (newPaymentMethodForm === "CHEQUE") {
      if (!newBankName.trim()) { toast.error("Bank Name is required for CHEQUE payment"); return; }
      if (!newChequeNo.trim()) { toast.error("Cheque Number is required for CHEQUE payment"); return; }
      if (!receiptFile) { toast.error("Receipt file is required for CHEQUE payment"); return; }
    } else if (newPaymentMethodForm === "NEFT" || newPaymentMethodForm === "RTGS") {
      if (!newBankName.trim()) { toast.error(`Bank Name is required for ${newPaymentMethodForm} payment`); return; }
      if (!newReferenceNo.trim()) { toast.error(`Reference Number / UTR is required for ${newPaymentMethodForm} payment`); return; }
      if (!receiptFile) { toast.error(`Receipt file is required for ${newPaymentMethodForm} payment`); return; }
    } else if (newPaymentMethodForm === "UPI") {
      if (!newReferenceNo.trim()) { toast.error("Reference Number / UTR is required for UPI payment"); return; }
      if (!receiptFile) { toast.error("Receipt file is required for UPI payment"); return; }
    }

    const t = toast.loading("Processing payment...");

    try {
      const createdRes = await paymentService.createClientPayment({
        receipt: (newPaymentMethodForm === "CHEQUE" || newPaymentMethodForm === "NEFT" || newPaymentMethodForm === "RTGS" || newPaymentMethodForm === "UPI") ? (receiptFile || null) : null,
        invoice_id: resolvedInvoiceId,
        project_id: newProjectId ? Number(newProjectId) : (projectId ? Number(projectId) : undefined),
        amount: parseFloat(newAmount) || 0,
        payment_method: newPaymentMethodForm,
        bank_name: (newPaymentMethodForm === "CHEQUE" || newPaymentMethodForm === "NEFT" || newPaymentMethodForm === "RTGS") ? (newBankName || null) : null,
        cheque_no: (newPaymentMethodForm === "CHEQUE") ? (newChequeNo || null) : null,
        reference_no: (newPaymentMethodForm === "NEFT" || newPaymentMethodForm === "RTGS" || newPaymentMethodForm === "UPI") ? (newReferenceNo || null) : null,
        remarks: newRemarks || null,
      });

      toast.success("Payment submitted successfully!", { id: t });

      // Immediate UI reflection of the 201 Created payment record
      if (createdRes) {
        const mappedEntry = mapApiPayment(createdRes);
        setClientPayments(prev => [mappedEntry, ...prev.filter(p => p.paymentId !== mappedEntry.paymentId)]);
      }

      // Refresh payment history and invoices from server
      const activeProjectId = projectId ? Number(projectId) : undefined;
      const [summary, pending, historyList] = await Promise.all([
        paymentService.getInvoiceSummary(activeProjectId).catch(() => null),
        paymentService.getPendingInvoices(activeProjectId).catch(() => []),
        paymentService.getClientPaymentHistory(activeProjectId).catch(() => [])
      ]);
      let paidSet = new Set<string>();
      if (historyList && Array.isArray(historyList)) {
        const processed = processPaymentHistory(historyList);
        paidSet = processed.paidInvoiceIdentifiers;
        setClientPayments(processed.mappedPayments);
        setPaymentHistory(historyList);
      } else {
        setClientPayments([]);
        setPaymentHistory([]);
      }
      if (summary) setInvoiceSummary(summary);
      if (pending && Array.isArray(pending)) {
        const cleanPending = pending.filter((inv: any) => {
          const invNo = String(inv.invoice_no || inv.invoiceNo || inv.invoice_number || "").toUpperCase().trim();
          const invIdStr = String(inv.id || inv.invoice_id || "").trim();
          const invStatus = String(inv.status || inv.payment_status || "").toUpperCase();
          const isPaid =
            invStatus === "PAID" ||
            paidSet.has(invNo) ||
            paidSet.has(invIdStr) ||
            paidSet.has(`INV-${invIdStr.padStart(6, '0')}`.toUpperCase()) ||
            paidSet.has(`INV-${invIdStr.padStart(3, '0')}`.toUpperCase());
          return !isPaid;
        });
        setPendingInvoices(cleanPending);
      } else {
        setPendingInvoices([]);
      }
    } catch (err: any) {
      console.error("Create payment error:", err);
      const detail = err?.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : "Failed to create payment on server");
      toast.error(msg, { id: t });
    } finally {
      setIsCreateModalOpen(false);
      setNewInvoiceNo(""); setNewAmount(""); setNewPaidAmount("");
      setNewProjectId(""); setNewBankName(""); setNewPaymentMethodForm("CASH");
      setNewChequeNo(""); setNewReferenceNo(""); setNewRemarks("");
      setReceiptFile(null);
      setSelectedInvoiceId(null);
    }
  };

  if (showPaymentPortal && selectedRequest) {
    return (
      <>
        <Navbar title="Secure Payment Portal" breadcrumb={["Client", "Payment", "Process Transaction"]} />
        <div className="p-8 bg-slate-50 min-h-screen font-inter flex flex-col items-center">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
            <div className="p-8 bg-blue-600 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
              <button onClick={() => setShowPaymentPortal(false)} className="absolute top-6 left-6 text-blue-100 hover:text-white transition-all flex items-center gap-2 text-xs font-bold">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                BACK TO HISTORY
              </button>
              <div className="mt-12 text-center">
                <p className="text-blue-200 text-[10px] font-black tracking-[0.2em] uppercase mb-2">Checkout Summary</p>
                <h1 className="text-5xl font-black tracking-tight mb-2">&#8377; {(selectedRequest.amount ?? 0).toLocaleString()}</h1>
                <p className="text-blue-100/60 text-xs font-medium">Transaction Reference: <span className="text-white">#{selectedRequest.id}</span></p>
              </div>
            </div>
            <div className="p-10">
              <div className="space-y-4">
                <div onClick={() => setPaymentMethod("UPI")} className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${paymentMethod === "UPI" ? "border-blue-500 bg-blue-50/30" : "border-slate-100 bg-slate-50/50 hover:border-slate-300"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${paymentMethod === "UPI" ? "bg-blue-500 text-white" : "bg-white text-slate-400"}`}>&#128241;</div>
                    <div>
                      <p className="font-bold text-slate-800">Unified Payments Interface (UPI)</p>
                      <p className="text-[11px] text-slate-400 font-medium">Pay via GPay, PhonePe, or BHIM</p>
                    </div>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === "UPI" ? "border-blue-500 bg-blue-500 text-white" : "border-slate-200 bg-white"}`}>
                    {paymentMethod === "UPI" && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                  </div>
                </div>
                <div onClick={() => setPaymentMethod("Check")} className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-6 ${paymentMethod === "Check" ? "border-blue-500 bg-blue-50/30" : "border-slate-100 bg-slate-50/50 hover:border-slate-300"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shadow-sm ${paymentMethod === "Check" ? "bg-blue-500 text-white" : "bg-white text-slate-400"}`}>&#128196;</div>
                      <div>
                        <p className="font-bold text-slate-800">Banker&#39;s Check</p>
                        <p className="text-[11px] text-slate-400 font-medium">Deposit physical check to company account</p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === "Check" ? "border-blue-500 bg-blue-500 text-white" : "border-slate-200 bg-white"}`}>
                      {paymentMethod === "Check" && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                    </div>
                  </div>
                  {paymentMethod === "Check" && (
                    <div className="bg-white p-6 rounded-xl border border-blue-100">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Upload Check Copy</h5>
                      <div className="relative">
                        <input type="file" onChange={e => setCheckFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="border-2 border-dashed border-slate-100 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors">
                          <svg className="w-8 h-8 text-slate-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{checkFile ? checkFile.name : "Click to select or drag check image"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={processPayment} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] mt-10 hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                COMPLETE PAYMENT
              </button>
            </div>
          </div>
          <p className="mt-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Encrypted Secure Checkout</p>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <Navbar
        title={activeTab === "history" ? "Payment History" : "Approvals & Workflow"}
        breadcrumb={["Client", "Payment", activeTab === "history" ? "History" : "Quotation Approval"]}
      />

      {activeTab === "history" ? (
        <div className="p-8 pb-24 space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payment History</h1>
              <p className="text-slate-500 text-sm font-medium mt-1">View and track all your payments submitted to the admin for ongoing project invoices.</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Download Dropdown */}
              <div className="relative" ref={downloadDropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDownloadOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-600" />
                  <span>Download</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDownloadOpen ? "rotate-180" : ""
                      }`}
                  />
                </button>

                {isDownloadOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        handlePdfExport();
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
                          Payment statement (.pdf)
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        handleExcelExport();
                        setIsDownloadOpen(false);
                      }}
                      className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-emerald-50/60 transition-colors flex items-center gap-3 group cursor-pointer mt-1"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold group-hover:scale-105 transition-transform shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 tracking-tight group-hover:text-emerald-600 transition-colors">
                          Download Excel
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          Spreadsheet data (.xlsx)
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => setIsCreateModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 cursor-pointer">
                <Plus className="w-4 h-4" /> Pay Payment
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1 - Total Budget */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><IndianRupee className="w-5 h-5 text-emerald-600" /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Budget</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Total Budget</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">&#8377;{totalBudget.toLocaleString()}</h2>
              </div>
            </div>

            {/* Card 2 - Paid */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Paid</p>
                <h2 className="text-3xl font-black text-emerald-600 tracking-tight">&#8377;{(totalPaid + totalPartialPaid).toLocaleString()}</h2>
              </div>
            </div>

            {/* Card 3 - Pending */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center"><Clock className="w-5 h-5 text-amber-500" /></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending</span>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Pending</p>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">&#8377;{(totalPending + totalOverdue).toLocaleString()}</h2>
              </div>
            </div>
          </div>

          {/* Invoice Summary Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center"><TrendingUp className="w-4 h-4 text-blue-600" /></div>
                <div>
                  <p className="text-sm font-black text-slate-800">Invoice Payment Summary</p>
                  <p className="text-[10px] text-slate-400 font-medium">Live data from /client-payments/invoice-summary</p>
                </div>
              </div>
              {apiLoading && <div className="w-4 h-4 border-2 border-slate-100 border-t-blue-500 rounded-full animate-spin" />}
            </div>
            {invoiceSummaryMetrics ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  {
                    label: "TOTAL INVOICES",
                    val: invoiceSummaryMetrics.totalInvoices ?? "—",
                    color: "text-slate-800",
                  },
                  {
                    label: "TOTAL AMOUNT",
                    val:
                      invoiceSummaryMetrics.totalAmount != null
                        ? `₹${Number(invoiceSummaryMetrics.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—",
                    color: "text-slate-800",
                  },
                  {
                    label: "PAID",
                    val:
                      invoiceSummaryMetrics.paidAmount != null
                        ? `₹${Number(invoiceSummaryMetrics.paidAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—",
                    color: "text-emerald-600",
                  },
                  {
                    label: "PENDING",
                    val:
                      invoiceSummaryMetrics.pendingAmount != null
                        ? `₹${Number(invoiceSummaryMetrics.pendingAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—",
                    color: "text-amber-600",
                  },
                  {
                    label: "OVERDUE",
                    val:
                      invoiceSummaryMetrics.overdueAmount != null
                        ? `₹${Number(invoiceSummaryMetrics.overdueAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : "—",
                    color: "text-rose-600",
                  },
                ].map(({ label, val, color }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className={`text-xl font-black ${color} tracking-tight`}>{val}</p>
                  </div>
                ))}
              </div>
            ) : apiLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-4 animate-pulse">
                    <div className="h-2.5 bg-slate-200 rounded mb-2 w-3/4" />
                    <div className="h-6 bg-slate-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <p className="text-xs font-bold">No summary data available</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pending Invoices Panel */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-amber-500" /></div>
                    <div>
                      <p className="text-sm font-black text-slate-800">Pending Invoices</p>
                      <p className="text-[10px] text-slate-400 font-medium">Live data from /client-payments/pending-invoices</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg">{pendingInvoices.length} pending</span>
                </div>
                {apiLoading ? (
                  <div className="p-6 space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="h-4 bg-slate-100 rounded w-28" />
                        <div className="h-4 bg-slate-100 rounded flex-1" />
                        <div className="h-4 bg-slate-100 rounded w-20" />
                        <div className="h-4 bg-slate-100 rounded w-16" />
                      </div>
                    ))}
                  </div>
                ) : pendingInvoices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <CheckCircle2 className="w-8 h-8 mb-2 text-emerald-300" />
                    <p className="text-xs font-black uppercase tracking-widest">No pending invoices</p>
                  </div>
                ) : (
                  <div
                    className="overflow-x-auto max-h-[295px] overflow-y-auto"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#cbd5e1 transparent'
                    }}
                  >
                    <table className="w-full text-left">
                      <thead className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 border-b border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                        <tr>
                          {["Invoice ID", "Project", "Amount", "Due Date", "Status"].map(h => (
                            <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {pendingInvoices.map((inv: any, i: number) => (
                          <tr key={i} className="hover:bg-slate-50/60 transition-all">
                            <td className="px-5 py-4"><p className="text-[11px] font-black text-slate-800 whitespace-nowrap">{inv.invoice_no ?? inv.invoiceNo ?? inv.invoice_number ?? inv.invoice_id ?? inv.invoiceId ?? inv.id ?? "—"}</p></td>
                            <td className="px-5 py-4 max-w-[150px] truncate"><p className="text-[11px] font-medium text-slate-600 truncate">{inv.project_name ?? inv.projectName ?? inv.project ?? "—"}</p></td>
                            <td className="px-5 py-4"><p className="text-[13px] font-black text-slate-900 whitespace-nowrap">₹{Number(inv.amount ?? inv.total_amount ?? 0).toLocaleString()}</p></td>
                            <td className="px-5 py-4"><p className={`text-[11px] font-bold whitespace-nowrap ${inv.is_overdue || inv.status === 'OVERDUE' ? 'text-rose-600' : 'text-slate-500'}`}>{inv.due_date ?? inv.dueDate ?? "—"}</p></td>
                            <td className="px-5 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${(inv.status ?? "").toUpperCase() === "OVERDUE" ? "bg-rose-50 text-rose-600" :
                                  (inv.status ?? "").toUpperCase() === "PARTIAL" ? "bg-blue-50 text-blue-600" :
                                    "bg-amber-50 text-amber-600"
                                }`}>{inv.status ?? "Pending"}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Analytics Panel */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800">Payment Analytics</p>
                    <p className="text-[10px] text-slate-400 font-medium">Billed vs Received &amp; Invoice Status breakdown</p>
                  </div>
                </div>
              </div>

              {/* Monthly Billed vs Received Chart */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Billed vs Received</p>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Billed</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Received</span>
                  </div>
                </div>
                <div className="h-[160px] w-full min-w-0 pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={computedAnalytics.monthlyBilledVsReceived} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 10, fill: "#94A3B8" }}
                        tickFormatter={(v) => {
                          const n = Number(v);
                          if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
                          if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
                          if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
                          return `₹${n}`;
                        }}
                      />
                      <RechartsTooltip
                        formatter={(val: any) => [`₹${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, ""]}
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", fontSize: "12px" }}
                      />
                      <Bar dataKey="billed" name="Billed" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={16} />
                      <Bar dataKey="received" name="Received" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Invoice Status Breakdown Legend */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status Breakdown</span>
                <div className="flex items-center gap-4">
                  {computedAnalytics.statusShares.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-slate-400 font-medium text-[11px]">{item.name}:</span>
                      <span className="text-slate-800 font-black">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative w-full md:w-1/2 max-w-xl">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={paymentSearch} onChange={e => { setPaymentSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Search by Payment ID, Invoice, Client, Project..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all" />
              </div>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-3.5 py-2.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input type="date" value={paymentStartDate} onChange={e => { setPaymentStartDate(e.target.value); setCurrentPage(1); }} className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer" />
                <span className="text-slate-300 text-xs">&#8212;</span>
                <input type="date" value={paymentEndDate} onChange={e => { setPaymentEndDate(e.target.value); setCurrentPage(1); }} className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer" />
                {(paymentStartDate || paymentEndDate) && (
                  <button onClick={() => { setPaymentStartDate(""); setPaymentEndDate(""); setCurrentPage(1); }} className="ml-1 text-slate-400 hover:text-rose-500 transition-colors" title="Clear dates">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Table Card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-0 px-6 pt-5 pb-0 overflow-x-auto border-b border-slate-50">
              {[
                { label: "All Payments", key: "All Payments" },
                { label: "Paid", key: "PAID" },
                { label: "Partial", key: "PARTIAL" },
                { label: "Pending", key: "PENDING" },
                { label: "Overdue", key: "OVERDUE" },
              ].map(t => (
                <button key={t.key} onClick={() => { setPaymentTab(t.key); setCurrentPage(1); }}
                  className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 border-b-2 -mb-px ${paymentTab === t.key ? "text-blue-600 border-blue-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}>
                  {t.label}
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${paymentTab === t.key ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"}`}>
                    {tabCounts[t.key as keyof typeof tabCounts]}
                  </span>
                </button>
              ))}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Payment ID</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Invoice ID</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Project Name</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Invoice Date</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Amount</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Paid</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">Status</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Pay Date</th>
                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right pr-6 whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedPayments.length === 0 ? (
                    <tr><td colSpan={9} className="py-24 text-center">
                      <div className="flex flex-col items-center opacity-40">
                        <IndianRupee className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="font-black uppercase tracking-widest text-xs text-slate-400">No payment records found</p>
                      </div>
                    </td></tr>
                  ) : paginatedPayments.map((p, i) => (
                    <tr key={i} className="hover:bg-slate-50/60 transition-all group">
                      <td className="px-5 py-5"><p className="text-[11px] font-black text-slate-800 tracking-tight whitespace-nowrap">{p.paymentId}</p></td>
                      <td className="px-5 py-5"><p className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{p.invoiceNo}</p></td>
                      <td className="px-5 py-5 max-w-[140px]"><p className="text-[11px] font-medium text-slate-600 truncate" title={p.projectName}>{p.projectName}</p></td>
                      <td className="px-5 py-5"><p className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{p.invoiceDate}</p></td>
                      <td className="px-5 py-5"><p className="text-[13px] font-black text-slate-900 tracking-tight whitespace-nowrap">&#8377;{p.amount.toLocaleString()}</p></td>
                      <td className="px-5 py-5">
                        <p className="text-[12px] font-black text-emerald-600 whitespace-nowrap">&#8377;{p.paidAmount.toLocaleString()}</p>
                        {p.status === "PARTIAL" && (
                          <div className="mt-1 w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((p.paidAmount / p.amount) * 100)}%` }}></div>
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-5 text-center"><span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest whitespace-nowrap ${statusBadge(p.status)}`}>{p.status}</span></td>
                      <td className="px-5 py-5"><p className="text-[11px] font-bold text-slate-500 whitespace-nowrap">{p.paymentDate}</p></td>
                      <td className="px-5 py-5 text-right pr-6">
                        <div className="flex items-center justify-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setSelectedPayment(p); setIsViewModalOpen(true); }} title="View Details" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleDownloadReceipt(p)} title="Download Receipt" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"><Download className="w-4 h-4" /></button>
                          <button onClick={() => handleOpenEdit(p)} title="Edit Payment" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-all"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => { setSelectedPayment(p); setIsDeleteConfirmOpen(true); }} title="Delete Payment" className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-50 bg-white">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-400">Rows per page:</span>
                <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-600 outline-none">
                  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="text-[11px] font-bold text-slate-400">
                  {filteredClientPayments.length === 0 ? "0 of 0" : `${currentPage} of ${totalPages}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronLeft className="w-4 h-4" /></button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(page => (
                  <button key={page} onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === page ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50"}`}>{page}</button>
                ))}
                {totalPages > 5 && <span className="text-slate-400 text-xs">&#8230;</span>}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          </div>


          {/* View Details Modal */}
          <Modal isOpen={isViewModalOpen && !isAuditModalOpen} onClose={() => { setIsViewModalOpen(false); setSelectedPayment(null); }} title="Payment Details" maxWidth="max-w-lg">
            {selectedPayment && (
              <div className="space-y-5">
                <div className="flex items-start justify-between p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment ID</p>
                    <p className="text-sm font-black text-slate-900">{selectedPayment.paymentId}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{selectedPayment.invoiceNo}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${statusBadge(selectedPayment.status)}`}>{selectedPayment.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Client Name", val: selectedPayment.clientName },
                    { label: "Client Email", val: selectedPayment.clientEmail },
                    { label: "Invoice Date", val: selectedPayment.invoiceDate },
                    { label: "Due Date", val: selectedPayment.dueDate },
                    { label: "Total Amount", val: `&#8377;${selectedPayment.amount.toLocaleString()}` },
                    { label: "Paid Amount", val: `&#8377;${selectedPayment.paidAmount.toLocaleString()}` },
                    { label: "Balance Due", val: `&#8377;${(selectedPayment.amount - selectedPayment.paidAmount).toLocaleString()}` },
                    { label: "Payment Date", val: selectedPayment.paymentDate },
                  ].map(({ label, val }) => (
                    <div key={label} className="p-3 bg-white border border-slate-100 rounded-xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                      <p className="text-[12px] font-black text-slate-800" dangerouslySetInnerHTML={{ __html: val }}></p>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Project</p>
                  <p className="text-[12px] font-medium text-slate-700">{selectedPayment.projectName}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setIsViewModalOpen(false); setSelectedPayment(null); }} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Close</button>
                  <button onClick={() => handleOpenEdit(selectedPayment!)} className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDownloadReceipt(selectedPayment!)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2">
                    <Download className="w-3.5 h-3.5" /> Receipt
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* Audit History Modal */}
          <Modal isOpen={isAuditModalOpen} onClose={() => { setIsAuditModalOpen(false); setSelectedPayment(null); }} title="Audit History" maxWidth="max-w-md">
            {selectedPayment && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment ID: <span className="text-slate-700">{selectedPayment.paymentId}</span></p>
                </div>
                <div className="space-y-0">
                  {[
                    { icon: <Plus className="w-3 h-3" />, label: "Payment Record Created", time: selectedPayment.invoiceDate, color: "bg-blue-100 text-blue-600", desc: `Invoice ${selectedPayment.invoiceNo} issued for &#8377;${selectedPayment.amount.toLocaleString()}` },
                    { icon: <FileText className="w-3 h-3" />, label: "Invoice Sent to Client", time: selectedPayment.invoiceDate, color: "bg-indigo-100 text-indigo-600", desc: `Sent to ${selectedPayment.clientEmail}` },
                    ...(selectedPayment.status !== "PENDING" && selectedPayment.status !== "OVERDUE" ? [{ icon: <IndianRupee className="w-3 h-3" />, label: "Payment Submitted to Admin", time: selectedPayment.paymentDate, color: "bg-emerald-100 text-emerald-600", desc: `&#8377;${selectedPayment.paidAmount.toLocaleString()} sent by you via UPI` }] : []),
                    ...(selectedPayment.status === "OVERDUE" ? [{ icon: <AlertTriangle className="w-3 h-3" />, label: "Payment Overdue Alert", time: selectedPayment.dueDate, color: "bg-rose-100 text-rose-600", desc: "Payment due date has passed without settlement" }] : []),
                    { icon: <CheckCircle2 className="w-3 h-3" />, label: "Current Status", time: "Now", color: `${selectedPayment.status === "PAID" ? "bg-emerald-100 text-emerald-600" : selectedPayment.status === "OVERDUE" ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`, desc: `Status: ${selectedPayment.status}` },
                  ].map((event, idx, arr) => (
                    <div key={idx} className="flex gap-3 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${event.color}`}>{event.icon}</div>
                        {idx < arr.length - 1 && <div className="w-0.5 h-6 bg-slate-100 mt-1"></div>}
                      </div>
                      <div className="pb-5">
                        <p className="text-[11px] font-black text-slate-800">{event.label}</p>
                        <p className="text-[10px] text-slate-400 font-medium" dangerouslySetInnerHTML={{ __html: event.desc }}></p>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-1">{event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { setIsAuditModalOpen(false); setSelectedPayment(null); }} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all">Close</button>
              </div>
            )}
          </Modal>

          {/* Edit Payment Modal */}
          <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); setSelectedPayment(null); }} title="Edit Payment" maxWidth="max-w-lg">
            {selectedPayment && (
              <div className="space-y-4">
                {/* Read-only summary header */}
                <div className="flex items-start justify-between p-4 bg-gradient-to-r from-slate-50 to-amber-50/30 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment ID</p>
                    <p className="text-sm font-black text-slate-900">{selectedPayment.paymentId}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{selectedPayment.invoiceNo} · {selectedPayment.projectName}</p>
                  </div>
                  <p className="text-xl font-black text-slate-900">&#8377;{selectedPayment.amount.toLocaleString()}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Paid Amount (Rs.)</label>
                    <input
                      type="number"
                      value={editPaidAmount}
                      onChange={e => setEditPaidAmount(e.target.value)}
                      placeholder="0"
                      max={selectedPayment.amount}
                      className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Date</label>
                    <input
                      type="date"
                      value={editPaymentDate}
                      onChange={e => setEditPaymentDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Payment Method</label>
                    <select value={editPaymentMethod} onChange={e => setEditPaymentMethod(e.target.value)} className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-400 transition-all appearance-none">
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Card">Card</option>
                      <option value="Check">Check</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      value={editBankName}
                      onChange={e => setEditBankName(e.target.value)}
                      placeholder="e.g. HDFC Bank"
                      className="w-full px-3 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["PAID", "PARTIAL", "PENDING", "OVERDUE"] as ClientPayment["status"][]).map(s => (
                      <button
                        key={s}
                        onClick={() => setEditStatus(s)}
                        className={`py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${editStatus === s
                            ? s === "PAID" ? "bg-emerald-500 text-white border-emerald-500"
                              : s === "PARTIAL" ? "bg-blue-500 text-white border-blue-500"
                                : s === "PENDING" ? "bg-amber-500 text-white border-amber-500"
                                  : "bg-rose-500 text-white border-rose-500"
                            : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                          }`}
                      >{s}</button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setIsEditModalOpen(false); setSelectedPayment(null); }} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                  <button onClick={handleUpdatePayment} className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all flex items-center justify-center gap-2">
                    <Pencil className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* Delete Confirmation Modal */}
          <Modal isOpen={isDeleteConfirmOpen} onClose={() => { setIsDeleteConfirmOpen(false); setSelectedPayment(null); }} title="Delete Payment" maxWidth="max-w-sm">
            {selectedPayment && (
              <div className="space-y-5">
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-4">
                    <Trash2 className="w-7 h-7 text-rose-500" />
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mb-1">Delete this payment record?</h3>
                  <p className="text-[11px] text-slate-400 font-medium">This will permanently remove <span className="font-black text-slate-600">{selectedPayment.paymentId}</span> from the system. This action cannot be undone.</p>
                </div>
                <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-xl">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment Details</p>
                  <p className="text-[11px] font-bold text-slate-700">{selectedPayment.invoiceNo} · &#8377;{selectedPayment.amount.toLocaleString()} · <span className={`${selectedPayment.status === "PAID" ? "text-emerald-600" : selectedPayment.status === "OVERDUE" ? "text-rose-600" : selectedPayment.status === "PARTIAL" ? "text-blue-600" : "text-amber-600"
                    }`}>{selectedPayment.status}</span></p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setIsDeleteConfirmOpen(false); setSelectedPayment(null); }} className="flex-1 py-3 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                  <button
                    onClick={handleDeletePayment}
                    disabled={deleteLoading}
                    className="flex-1 py-3 bg-rose-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {deleteLoading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )}
          </Modal>

          {/* Pay Payment Modal – Photo 1 Layout */}
          <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Pay Payment" maxWidth="max-w-5xl" hideHeader={true} bodyPadding="p-0">
            <div className="space-y-4 max-h-[85vh] overflow-y-auto bg-white p-4 sm:p-5">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-start gap-3">
                  <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer mt-0.5">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-0.5">
                      <span>Client Payments</span>
                      <span>&gt;</span>
                      <span className="text-slate-700">Pay Payment</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Pay Payment</h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Create a new payment record for client invoice.</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body: Form + Sidebar */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
                {/* Form (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                    <CreditCard className="w-4 h-4" />
                    <span>Payment Information</span>
                  </div>

                  {/* Row 1: Receipt (if required) + Invoice ID */}
                  {(newPaymentMethodForm === "CHEQUE" || newPaymentMethodForm === "NEFT" || newPaymentMethodForm === "RTGS" || newPaymentMethodForm === "UPI") ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Receipt <span className="text-rose-500">*</span></label>
                        <div className="relative border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/20 rounded-xl py-2 px-3 transition-all cursor-pointer flex flex-row items-center gap-2.5 group h-[38px]">
                          <input type="file" onChange={e => e.target.files?.[0] && setReceiptFile(e.target.files[0])} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*,.pdf" />
                          <Upload className="w-4 h-4 text-indigo-500 shrink-0 group-hover:scale-110 transition-transform" />
                          <p className="text-xs text-slate-600 font-medium truncate">
                            {receiptFile ? <span className="font-bold text-indigo-600">{receiptFile.name}</span> : <>Upload receipt <span className="text-indigo-600 font-bold underline">browse</span> <span className="text-slate-400">(JPG/PNG/PDF)</span></>}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Invoice ID <span className="text-rose-500">*</span></label>
                        <select
                          value={selectedInvoiceId ? String(selectedInvoiceId) : newInvoiceNo}
                          onChange={e => {
                            const val = e.target.value;
                            setNewInvoiceNo(val);
                            const sel = availablePendingInvoices.find((p: any) =>
                              String(p.id) === val ||
                              String(p.invoice_id) === val ||
                              String(p.invoice_no) === val ||
                              String(p.invoice_number) === val
                            );
                            if (sel) {
                              const invId = Number(sel.id ?? sel.invoice_id ?? parseInt(String(val).replace(/\D/g, ''), 10) ?? 1);
                              setSelectedInvoiceId(invId);
                              const rawAmt = Number(sel.amount ?? sel.total_amount ?? sel.grand_total ?? sel.balance_amount ?? 0);
                              setNewAmount(rawAmt > 0 ? rawAmt.toFixed(2) : String(sel.amount || sel.total_amount || "0.00"));
                              if (sel.project_name) setNewProjectName(sel.project_name);
                              if (sel.project_id) setNewProjectId(String(sel.project_id));
                            } else {
                              const parsed = parseInt(String(val).replace(/\D/g, ''), 10);
                              if (!isNaN(parsed) && parsed > 0) {
                                setSelectedInvoiceId(parsed);
                              } else {
                                setSelectedInvoiceId(null);
                                setNewAmount("");
                              }
                            }
                          }}
                          className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select Invoice ID</option>
                          {availablePendingInvoices.length > 0 ? availablePendingInvoices.map((inv: any, idx: number) => {
                            const invId = inv.id ?? inv.invoice_id ?? (inv.invoice_no ? parseInt(String(inv.invoice_no).replace(/\D/g, ''), 10) : idx + 1);
                            return (
                              <option key={idx} value={String(invId)}>
                                {invId} {inv.invoice_no ? `(${inv.invoice_no})` : ''}
                              </option>
                            );
                          }) : (
                            <option value="" disabled>No pending unpaid invoices</option>
                          )}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Invoice ID <span className="text-rose-500">*</span></label>
                      <select
                        value={selectedInvoiceId ? String(selectedInvoiceId) : newInvoiceNo}
                        onChange={e => {
                          const val = e.target.value;
                          setNewInvoiceNo(val);
                          const sel = availablePendingInvoices.find((p: any) =>
                            String(p.id) === val ||
                            String(p.invoice_id) === val ||
                            String(p.invoice_no) === val ||
                            String(p.invoice_number) === val
                          );
                          if (sel) {
                            const invId = Number(sel.id ?? sel.invoice_id ?? parseInt(String(val).replace(/\D/g, ''), 10) ?? 1);
                            setSelectedInvoiceId(invId);
                            const rawAmt = Number(sel.amount ?? sel.total_amount ?? sel.grand_total ?? sel.balance_amount ?? 0);
                            setNewAmount(rawAmt > 0 ? rawAmt.toFixed(2) : String(sel.amount || sel.total_amount || "0.00"));
                            if (sel.project_name) setNewProjectName(sel.project_name);
                            if (sel.project_id) setNewProjectId(String(sel.project_id));
                          } else {
                            const parsed = parseInt(String(val).replace(/\D/g, ''), 10);
                            if (!isNaN(parsed) && parsed > 0) {
                              setSelectedInvoiceId(parsed);
                            } else {
                              setSelectedInvoiceId(null);
                              setNewAmount("");
                            }
                          }
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select Invoice ID</option>
                        {availablePendingInvoices.length > 0 ? availablePendingInvoices.map((inv: any, idx: number) => {
                          const invId = inv.id ?? inv.invoice_id ?? (inv.invoice_no ? parseInt(String(inv.invoice_no).replace(/\D/g, ''), 10) : idx + 1);
                          return (
                            <option key={idx} value={String(invId)}>
                              {invId} {inv.invoice_no ? `(${inv.invoice_no})` : ''}
                            </option>
                          );
                        }) : (
                          <option value="" disabled>No pending unpaid invoices</option>
                        )}
                      </select>
                    </div>
                  )}

                  {/* Row 2: Project + Amount (Fixed / Non-editable) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Project <span className="text-rose-500">*</span></label>
                      <select
                        value={newProjectId}
                        onChange={e => {
                          const chosenId = e.target.value;
                          setNewProjectId(chosenId);
                          const chosen = availableProjects.find(p => String(p.id || p.project_id) === chosenId);
                          if (chosen) {
                            setNewProjectName(chosen.name || chosen.project_name || "");
                          }
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      >
                        <option value="">Select Project</option>
                        {availableProjects.map((p: any) => {
                          const pid = String(p.id || p.project_id);
                          const pname = p.name || p.project_name || `Project ${pid}`;
                          return (
                            <option key={pid} value={pid}>
                              {pname}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Amount <span className="text-rose-500">*</span></label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3.5 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={newAmount ? `${newAmount}` : ""}
                          placeholder="0.00"
                          className="w-full pl-8 pr-3.5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100/80 border border-slate-200 rounded-xl outline-none cursor-not-allowed select-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Payment Method */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method <span className="text-rose-500">*</span></label>
                    <select
                      value={newPaymentMethodForm}
                      onChange={e => {
                        const val = e.target.value;
                        setNewPaymentMethodForm(val);
                        if (val === "CASH" || val === "ONLINE") {
                          setNewBankName("");
                          setNewChequeNo("");
                          setNewReferenceNo("");
                          setReceiptFile(null);
                        } else if (val === "CHEQUE") {
                          setNewReferenceNo("");
                        } else if (val === "NEFT" || val === "RTGS") {
                          setNewChequeNo("");
                        } else if (val === "UPI") {
                          setNewBankName("");
                          setNewChequeNo("");
                        }
                      }}
                      className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="CASH">CASH</option>
                      <option value="CHEQUE">CHEQUE</option>
                      <option value="NEFT">NEFT</option>
                      <option value="RTGS">RTGS</option>
                      <option value="UPI">UPI</option>
                      <option value="ONLINE">ONLINE</option>
                    </select>
                    <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center gap-2 text-xs text-blue-700 font-medium">
                      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      {newPaymentMethodForm === "CASH" ? "CASH: No bank details or receipt required." :
                        newPaymentMethodForm === "ONLINE" ? "ONLINE: No bank details or receipt required." :
                          newPaymentMethodForm === "CHEQUE" ? "CHEQUE: Bank name, cheque number, and receipt upload are required." :
                            newPaymentMethodForm === "UPI" ? "UPI: Reference number / UTR and receipt upload are required." :
                              `${newPaymentMethodForm}: Bank name, reference number / UTR, and receipt upload are required.`}
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between mb-2.5">
                      <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Additional Details</h4>
                      {(newPaymentMethodForm === "CASH" || newPaymentMethodForm === "ONLINE") && (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md">Not required for {newPaymentMethodForm}</span>
                      )}
                    </div>

                    {/* Method-specific fields */}
                    {(newPaymentMethodForm === "CHEQUE" || newPaymentMethodForm === "NEFT" || newPaymentMethodForm === "RTGS" || newPaymentMethodForm === "UPI") && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                        {(newPaymentMethodForm === "CHEQUE" || newPaymentMethodForm === "NEFT" || newPaymentMethodForm === "RTGS") && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              value={newBankName}
                              onChange={e => setNewBankName(e.target.value)}
                              placeholder="Enter bank name"
                              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
                            />
                          </div>
                        )}
                        {newPaymentMethodForm === "CHEQUE" && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Cheque No <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              value={newChequeNo}
                              onChange={e => setNewChequeNo(e.target.value)}
                              placeholder="Enter cheque number"
                              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
                            />
                          </div>
                        )}
                        {(newPaymentMethodForm === "NEFT" || newPaymentMethodForm === "RTGS" || newPaymentMethodForm === "UPI") && (
                          <div className={newPaymentMethodForm === "UPI" ? "sm:col-span-2" : ""}>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Reference No / UTR <span className="text-rose-500">*</span></label>
                            <input
                              type="text"
                              value={newReferenceNo}
                              onChange={e => setNewReferenceNo(e.target.value)}
                              placeholder="Enter transaction reference / UTR"
                              className="w-full px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                      <div className="relative">
                        <textarea
                          value={newRemarks}
                          onChange={e => setNewRemarks(e.target.value.slice(0, 500))}
                          placeholder="Enter any remarks (optional)"
                          rows={2}
                          className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl outline-none focus:border-indigo-500 transition-all resize-none"
                        />
                        <span className="absolute right-3 bottom-2 text-[10px] text-slate-400">{newRemarks.length}/500</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar */}
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3.5 space-y-4 h-fit">
                  <div className="flex items-start gap-2">
                    <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0">
                      <Info className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-slate-800">Help</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">Fill all required details to create a payment record.</p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-indigo-100">
                    <h6 className="text-xs font-bold text-indigo-700 mb-2.5">Payment Method Guide</h6>
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-2.5"><div className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg shrink-0"><Banknote className="w-3.5 h-3.5" /></div><div><p className="text-xs font-bold text-slate-800">CASH</p><p className="text-[10px] text-slate-500 leading-tight">No bank details or receipt required.</p></div></div>
                      <div className="flex items-start gap-2.5"><div className="p-1.5 bg-purple-100 text-purple-600 rounded-lg shrink-0"><CreditCard className="w-3.5 h-3.5" /></div><div><p className="text-xs font-bold text-slate-800">CHEQUE</p><p className="text-[10px] text-slate-500 leading-tight">Bank name, cheque number & receipt required.</p></div></div>
                      <div className="flex items-start gap-2.5"><div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg shrink-0"><Building2 className="w-3.5 h-3.5" /></div><div><p className="text-xs font-bold text-slate-800">NEFT / RTGS</p><p className="text-[10px] text-slate-500 leading-tight">Bank name, reference no & receipt required.</p></div></div>
                      <div className="flex items-start gap-2.5"><div className="p-1.5 bg-orange-100 text-orange-600 rounded-lg shrink-0"><Smartphone className="w-3.5 h-3.5" /></div><div><p className="text-xs font-bold text-slate-800">UPI</p><p className="text-[10px] text-slate-500 leading-tight">Reference no (UTR) & receipt required.</p></div></div>
                      <div className="flex items-start gap-2.5"><div className="p-1.5 bg-cyan-100 text-cyan-600 rounded-lg shrink-0"><Sparkles className="w-3.5 h-3.5" /></div><div><p className="text-xs font-bold text-slate-800">ONLINE</p><p className="text-[10px] text-slate-500 leading-tight">No bank details or receipt required.</p></div></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button type="button" onClick={() => { setNewInvoiceNo(""); setNewAmount(""); setNewPaidAmount(""); setNewProjectId(""); setNewProjectName(""); setNewBankName(""); setNewChequeNo(""); setNewReferenceNo(""); setNewRemarks(""); setReceiptFile(null); setNewPaymentMethodForm("CASH"); }} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer">
                  <RotateCcw className="w-3.5 h-3.5" /> Reset
                </button>
                <button type="button" onClick={handleCreatePayment} className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-200 active:scale-95 cursor-pointer">
                  <Save className="w-3.5 h-3.5" /> Pay Payment
                </button>
              </div>
            </div>
          </Modal>
        </div>
      ) : (
        <div className="p-8 pb-20 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quotation Approvals</h1>
              <p className="text-slate-500 font-medium mt-1 text-sm">Review and authorize site requests for materials, billing, and expenses.</p>
            </div>
          </div>
          <div className="bg-white rounded-[24px] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-wrap gap-4 items-center bg-white">
              <div className="relative w-1/2">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></span>
                <input type="text" placeholder="Search by entity type, id, remarks..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-slate-50/50 border border-slate-100 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner" />
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                  <button onClick={() => setSortOrder("Latest First")} className={`px-4 py-2.5 text-xs font-bold transition-all ${sortOrder === "Latest First" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:bg-slate-100"}`}>Latest First</button>
                  <button onClick={() => setSortOrder("Oldest First")} className={`px-4 py-2.5 text-xs font-bold transition-all ${sortOrder === "Oldest First" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:bg-slate-100"}`}>Oldest</button>
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none cursor-pointer hover:bg-slate-100 transition-all appearance-none shadow-sm">
                  <option value="All Status">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
            {loading ? (
              <div className="py-32 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-50/30">
                      <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[14%]">QUOTATION ID</th>
                      <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[16%]">COMPANY NAME</th>
                      <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[20%]">PROJECT NAME</th>
                      <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[14%]">DATE</th>
                      <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[12%]">STATUS</th>
                      <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[12%]">APPROVED BY</th>
                      <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right pr-10 w-[12%]">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredQuotations.length === 0 ? (
                      <tr><td colSpan={7} className="py-24 text-center"><div className="flex flex-col items-center opacity-40"><p className="font-bold uppercase tracking-widest text-xs">No records matching your search</p></div></td></tr>
                    ) : filteredQuotations.map((q, i) => (
                      <tr key={i} className="hover:bg-slate-50/30 transition-all group">
                        <td className="px-6 py-6"><p className="text-xs font-black text-slate-800 tracking-tight">{q.entity_id_display || q.id}</p></td>
                        <td className="px-6 py-6 font-bold text-[12px] text-slate-700">{q.company_name || q.client_name || q.requested_by_name || "-"}</td>
                        <td className="px-6 py-6 text-xs text-slate-500 font-medium truncate">{q.remarks_details}</td>
                        <td className="px-6 py-6 text-xs text-slate-500 font-bold">{q.created_at ? new Date(q.created_at).toLocaleDateString("en-GB") : "-"}</td>
                        <td className="px-6 py-6 text-center">
                          <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${q.status === "Pending" ? "bg-amber-50 text-amber-600" : q.status === "Approved" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{q.status}</span>
                        </td>
                        <td className="px-6 py-6 text-center text-[11px] font-bold text-slate-400">{q.approved_by_name}</td>
                        <td className="px-6 py-6 text-right pr-10">
                          <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleView(q)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all" title="View">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </button>
                            <button onClick={() => handleDownloadQuotation(q.id, q.entity_id_display)} className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 transition-all" title="Download PDF">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </button>
                            {q.status === "Pending" && (
                              <>
                                <button onClick={() => handleApprove(q.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-emerald-500 transition-all" title="Approve">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <button onClick={() => handleReject(q.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 transition-all" title="Reject">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <Modal isOpen={isViewModalOpen} onClose={closeModal} title={pdfUrl ? "Quotation PDF Preview" : "Request Detailed Summary"} maxWidth={pdfUrl ? "max-w-4xl" : "max-w-lg"}>
            {pdfLoading ? (
              <div className="py-24 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Fetching PDF Document...</p>
              </div>
            ) : pdfUrl ? (
              <div className="space-y-4">
                <div className="h-[75vh] w-full overflow-hidden rounded-2xl border border-slate-100 shadow-inner bg-slate-50">
                  <iframe src={`${pdfUrl}#toolbar=0&navpanes=0`} className="w-full h-full border-none" title="Quotation PDF Preview" />
                </div>
                <div className="flex gap-3">
                  <button onClick={closeModal} className="flex-1 py-3 px-6 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all">Close Preview</button>
                  <a href={pdfUrl} download={`Quotation_${String(selectedRequest?.entity_id_display || selectedRequest?.id).replace(/[\/\s\\]+/g, '_')}.pdf`} className="px-8 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center">Download Copy</a>
                </div>
              </div>
            ) : selectedRequest ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Project Name</p>
                    <p className="text-sm font-black text-slate-800">{projectName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Status</p>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${selectedRequest.status === "Pending" ? "bg-amber-100 text-amber-600" : selectedRequest.status === "Approved" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>{selectedRequest.status}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Transaction Amount</p><p className="text-[15px] font-black text-slate-900">&#8377; {(selectedRequest.amount || 0).toLocaleString()}</p></div>
                    <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm"><p className="text-[10px] font-black text-slate-400 uppercase mb-1">Payment Mode</p><p className="text-[13px] font-bold text-slate-800 uppercase tracking-tight">{selectedRequest.payment_method || "UPI"}</p></div>
                  </div>
                  <div className="p-4 border border-slate-100 rounded-xl bg-white shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Transaction Date</p>
                    <p className="text-xs font-bold text-slate-800">{new Date(selectedRequest.date || selectedRequest.expense_date || selectedRequest.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
                  </div>
                  {selectedRequest.remarks_details && (
                    <div>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2 px-1">Description / Category</h4>
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <p className="text-xs font-medium text-slate-600 leading-relaxed uppercase tracking-wide">{selectedRequest.remarks_details === "string" ? "NA" : selectedRequest.remarks_details || "NA"}</p>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={closeModal} className="w-full py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg active:scale-95 transition-all">Close Summary</button>
              </div>
            ) : null}
          </Modal>
        </div>
      )}
    </div>
  );
};

export default ClientPaymentPage;
