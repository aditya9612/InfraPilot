import { useState, useMemo } from "react";
import { useLocation, Link } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateInvoiceModal from "../../components/forms/CreateInvoiceModal";
import InvoiceDetailsModal from "../../components/dashboard/InvoiceDetailsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import type { Invoice } from "../../types/invoice";
import { projectService } from "../../services/projectService";
import { financeService } from "../../services/financeService";
import { expenseService } from "../../services/expenseService";
import { generateInvoicePDF } from "../../utils/invoicePDFGenerator";
import type { Project } from "../../types/project";
import type { Expense } from "../../types/expense";
import CreateExpenseModal from "../../components/forms/CreateExpenseModal";
import { useEffect, useCallback } from "react";

// No static mock data here, we use the service

const FinancePage = () => {
  const location = useLocation();
  const subPage = location.pathname.split("/").pop() || "invoices";

  // States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [activeCreateType, setActiveCreateType] = useState<any>("labour");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isExpenseDeleteModalOpen, setIsExpenseDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);

  // Fetch Projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await projectService.getProjects(100, 0);
      const projectList = Array.isArray(res)
        ? res
        : res.items || res.data || [];
      setProjects(projectList);
    } catch (error) {
      console.error("Finance: Failed to fetch projects", error);
    } finally {
    }
  }, []);

  // Fetch Invoices
  // Note: /invoices/date-range backend route conflicts with /invoices/{id}.
  // Date filtering is handled client-side until backend routing is fixed.
  const fetchInvoices = useCallback(async (type?: string, status?: string) => {
    try {
      let data: Invoice[];
      
      if (status === "pending") {
        data = await financeService.getPendingInvoices();
      } else if (type && type !== "all") {
        data = await financeService.getInvoicesByType(type);
      } else {
        data = await financeService.getInvoices();
      }
      
      setInvoices(data);
    } catch (error) {
      console.error("Finance: Failed to fetch invoices", error);
    } finally {
    }
  }, []);

  // Fetch Expenses
  const fetchExpenses = useCallback(async (category?: string) => {
    try {
      let data: Expense[];
      if (category && category !== "all") {
        data = await expenseService.getExpensesByCategory(category);
      } else {
        data = await expenseService.listExpenses();
      }
      setExpenses(data);
    } catch (error) {
      console.error("Finance: Failed to fetch expenses", error);
    } finally {
    }
  }, []);

  useEffect(() => {
    if (subPage === "invoices") {
      fetchInvoices(typeFilter, statusFilter);
    } else if (subPage === "expenses") {
      fetchExpenses(categoryFilter);
    }
  }, [typeFilter, statusFilter, categoryFilter, subPage, fetchInvoices, fetchExpenses]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handlers
  const handleCreateOrUpdate = async (data: any) => {
    try {
      if (selectedInvoice) {
        const updated = await financeService.updateInvoice(
          selectedInvoice.id,
          data,
        );
        setInvoices((prev) =>
          prev.map((inv) => (inv.id === selectedInvoice.id ? updated : inv)),
        );
        fetchInvoices();
        toast.success("Invoice updated successfully");
      } else {
        const created = await financeService.createInvoice(data);
        setInvoices((prev) => [created, ...prev]);
        fetchInvoices();
        toast.success("Invoice created successfully");
      }
      setSelectedInvoice(null);
      setIsModalOpen(false);
    } catch (error: any) {
      const errorMessage = error.message || (selectedInvoice
          ? "Failed to update invoice"
          : "Failed to create invoice");
      toast.error(errorMessage);
    } finally {
    }
  };

  const handleDeleteClick = (id: number) => {
    setInvoiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteInvoice = async () => {
    if (invoiceToDelete) {
      try {
          await financeService.deleteInvoice(invoiceToDelete);
        setInvoices(invoices.filter((inv) => inv.id !== invoiceToDelete));
        fetchInvoices();
        toast.success("Invoice deleted");
        setIsDeleteModalOpen(false);
        setInvoiceToDelete(null);
      } catch (error) {
        toast.error("Failed to delete invoice");
      } finally {
        }
    }
  };

  const handleMarkPaid = async (id: number) => {
    try {
      const updated = await financeService.markInvoicePaid(id);
      setInvoices((prev) => prev.map((inv) => (inv.id === id ? updated : inv)));
      toast.success("Invoice marked as Paid");
      setIsDetailsModalOpen(false);
    } catch (error) {
      toast.error("Failed to mark invoice as paid");
    } finally {
    }
  };

  const handleDownloadPDF = async (id: number) => {
    try {
      toast.loading("Downloading PDF...", { id: "pdf-loading" });
      await financeService.getInvoicePdf(id);
      
      toast.success("Invoice PDF downloaded!", {
        id: "pdf-loading",
      });
    } catch (error) {
      toast.error("Failed to download PDF from server. Using fallback generator...", { id: "pdf-loading" });
      
      // Fallback to client-side generation
      try {
        const invoice = invoices.find((inv) => inv.id === id);
        if (!invoice) throw new Error("Invoice not found");
        const project = projects.find((p) => p.id === invoice.project_id);
        generateInvoicePDF(invoice, project);
        toast.success("Client-side PDF generated!", { id: "pdf-loading" });
      } catch (fallbackError) {
        toast.error("Complete PDF generation failure", { id: "pdf-loading" });
      }
    }
  };

  const handleCreateOrUpdateExpense = async (data: any) => {
    try {
      if (selectedExpense) {
        const updated = await expenseService.updateExpense(selectedExpense.id, data);
        setExpenses((prev) =>
          prev.map((e) => (e.id === selectedExpense.id ? updated : e)),
        );
        toast.success("Expense record updated");
      } else {
        const created = await expenseService.createExpense(data);
        setExpenses((prev) => [created, ...prev]);
        toast.success("Expense record created");
      }
      setSelectedExpense(null);
      setIsExpenseModalOpen(false);
      fetchExpenses();
    } catch (error: any) {
      toast.error(error.message || "Failed to process expense");
    } finally {
    }
  };

  const handleDeleteExpenseClick = (id: number) => {
    setExpenseToDelete(id);
    setIsExpenseDeleteModalOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (expenseToDelete) {
      try {
          await expenseService.deleteExpense(expenseToDelete);
        setExpenses(expenses.filter((e) => e.id !== expenseToDelete));
        toast.success("Expense deleted");
        setIsExpenseDeleteModalOpen(false);
        setExpenseToDelete(null);
      } catch (error) {
        toast.error("Failed to delete expense");
      } finally {
        }
    }
  };

  // Filtered Data (date range filtered client-side — backend route conflict workaround)
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const project = projects.find((p) => p.id === inv.project_id);
      const matchSearch =
        (project?.project_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        inv.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "all" || inv.type === typeFilter;
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;

      let matchDate = true;
      if (dateFrom || dateTo) {
        const invDate = inv.created_at
          ? inv.created_at.split("T")[0]
          : inv.invoice_date?.split("T")[0] || "";
        if (dateFrom && invDate < dateFrom) matchDate = false;
        if (dateTo && invDate > dateTo) matchDate = false;
      }

      return matchSearch && matchType && matchStatus && matchDate;
    });
  }, [invoices, searchTerm, typeFilter, statusFilter, dateFrom, dateTo, projects]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      const project = projects.find((p) => p.id === exp.project_id);
      const matchSearch =
        (project?.project_name || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        exp.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === "all" || exp.category === categoryFilter;

      let matchDate = true;
      if (dateFrom || dateTo) {
        const expDate = exp.expense_date.split("T")[0];
        if (dateFrom && expDate < dateFrom) matchDate = false;
        if (dateTo && expDate > dateTo) matchDate = false;
      }

      return matchSearch && matchCategory && matchDate;
    });
  }, [expenses, searchTerm, categoryFilter, dateFrom, dateTo, projects]);

  // Totals
  const totals = useMemo(() => {
    return {
      billing: invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
      pending: invoices
        .filter((i) => i.status === "pending")
        .reduce((sum, i) => sum + (i.total_amount || 0), 0),
      gst: invoices.reduce((sum, inv) => sum + (inv.gst_amount || 0), 0),
    };
  }, [invoices]);

  return (
    <>
      <Navbar
        title="Finance & Accounts"
        breadcrumb={[
          "Admin",
          "Finance",
          subPage.charAt(0).toUpperCase() + subPage.slice(1),
        ]}
      />

      <PageTransition
        key={location.pathname}
        className="p-6 bg-slate-50 min-h-screen"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              {subPage.charAt(0).toUpperCase() + subPage.slice(1)} Management
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Review, authorize and track project-wise financial documentation.
            </p>
          </div>
          <div className="flex gap-2 relative">
            <Link
              to="/admin/measurements"
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Manage Measurements
            </Link>
            <button
              onClick={() => setIsSyncing(true)}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all flex items-center gap-2"
            >
              {isSyncing && (
                <div className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              )}
              Sync Ledger
            </button>
            {subPage === "expenses" ? (
              <button
                onClick={() => {
                  setSelectedExpense(null);
                  setIsExpenseModalOpen(true);
                }}
                className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
              >
                + Record Expense
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowTypeSelector(!showTypeSelector)}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
                >
                  + Create Invoice
                  <svg
                    className={`w-4 h-4 transition-transform ${showTypeSelector ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showTypeSelector && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Select Category
                    </div>
                    {[
                      { id: "labour", label: "Labour Invoice", icon: "👷" },
                      { id: "material", label: "Material Supply", icon: "🏗️" },
                      { id: "owner", label: "Owner Billing", icon: "🏢" },
                      { id: "expense", label: "Site Expense", icon: "💵" },
                    ].map((type) => (
                      <button
                        key={type.id}
                        onClick={() => {
                          setSelectedInvoice(null);
                          setActiveCreateType(type.id);
                          setIsModalOpen(true);
                          setShowTypeSelector(false);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-primary transition-all flex items-center gap-3"
                      >
                        <span className="text-base">{type.icon}</span>
                        {type.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Billing"
            value={`₹${(totals.billing / 100000).toFixed(2)}L`}
            sub="Gross including taxes"
            accent="text-primary"
          />
          <StatCard
            title="Pending Collections"
            value={`₹${(totals.pending / 100000).toFixed(2)}L`}
            sub="Unpaid invoices"
            accent="text-amber-500"
          />
          <StatCard
            title="Total GST Collected"
            value={`₹${(totals.gst / 100000).toFixed(2)}L`}
            sub="Net tax liability"
            accent="text-violet-500"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
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
                  placeholder="Search project or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64"
                />
              </div>

              {subPage === "invoices" ? (
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  <option value="all">All Types</option>
                  <option value="owner">Owner</option>
                  <option value="labour">Labour</option>
                  <option value="material">Material</option>
                </select>
              ) : subPage === "expenses" ? (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  <option value="all">All Categories</option>
                  <option value="Construction">Construction</option>
                  <option value="Contractor">Contractor</option>
                  <option value="Material">Material</option>
                  <option value="Labor">Labor</option>
                  <option value="Administrative">Administrative</option>
                </select>
              ) : null}

              {subPage === "invoices" && (
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              )}

              {/* Date Range Filter */}
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  title="From date"
                />
                <span className="text-slate-400 text-xs font-bold">→</span>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  title="To date"
                />
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(""); setDateTo(""); }}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                    title="Clear date filter"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">{subPage === "expenses" ? "Expense #" : "Invoice #"}</th>
                  <th className="px-6 py-4">Project / Description</th>
                  <th className="px-6 py-4">{subPage === "expenses" ? "Category" : "Type"}</th>
                  <th className="px-6 py-4">{subPage === "expenses" ? "Amount" : "Base Amount"}</th>
                  {subPage === "invoices" && <th className="px-6 py-4">Tax / GST</th>}
                  {subPage === "expenses" && <th className="px-6 py-4">Mode</th>}
                  <th className="px-6 py-4">{subPage === "expenses" ? "Date" : "Total Amount"}</th>
                  {subPage === "invoices" && <th className="px-6 py-4">Status</th>}
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {subPage === "invoices" ? (
                  filteredInvoices.map((inv, index) => (
                    <tr
                      key={`invoice-${inv.id}-${index}`}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-400">
                          INV-{String(inv.id).padStart(3, "0")}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-bold text-slate-700 uppercase">
                            {projects.find((p) => p.id === inv.project_id)
                              ?.project_name || "Unknown Project"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium line-clamp-1">
                            {inv.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                          {inv.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">
                        ₹{(inv.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-[9px] font-bold">
                          <p className="text-emerald-500">
                            GST: ₹{(inv.gst_amount || 0).toLocaleString()}
                          </p>
                          <p className="text-rose-500">
                            Tax: ₹{(inv.tax_amount || 0).toLocaleString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">
                        ₹{(inv.total_amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                            inv.status === "paid"
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-amber-100 text-amber-600"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 transition-opacity">
                          <button
                            onClick={async () => {
                              try {
                                const detailedInvoice =
                                  await financeService.getInvoiceById(inv.id);
                                setSelectedInvoice(detailedInvoice);
                                setIsDetailsModalOpen(true);
                              } catch (error) {
                                toast.error("Failed to fetch invoice details");
                                setSelectedInvoice(inv);
                                setIsDetailsModalOpen(true);
                              } finally {
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                            title="View Details"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Invoice"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteClick(inv.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Invoice"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : subPage === "expenses" ? (
                  filteredExpenses.map((exp, index) => (
                    <tr
                      key={`expense-${exp.id}-${index}`}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-400">
                          EXP-{String(exp.id).padStart(3, "0")}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-xs font-bold text-slate-700 uppercase">
                            {projects.find((p) => p.id === exp.project_id)
                              ?.project_name || "Unknown Project"}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium line-clamp-1">
                            {exp.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">
                          {exp.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">
                        ₹{(exp.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">
                        {exp.payment_mode}
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">
                        {new Date(exp.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-1 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedExpense(exp);
                              setIsExpenseModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Expense"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteExpenseClick(exp.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="Delete Expense"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>

      <CreateInvoiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        projects={projects}
        onSubmit={handleCreateOrUpdate}
        initialData={selectedInvoice}
        initialType={activeCreateType}
      />
      <InvoiceDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        invoice={selectedInvoice}
        projects={projects}
        onMarkPaid={handleMarkPaid}
        onDownloadPDF={handleDownloadPDF}
      />

      <CreateExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setSelectedExpense(null);
        }}
        projects={projects}
        onSubmit={handleCreateOrUpdateExpense}
        initialData={selectedExpense}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setInvoiceToDelete(null);
        }}
        onConfirm={handleDeleteInvoice}
        title="Delete Invoice"
        message="Are you sure you want to delete this invoice? This action will remove the financial record from the system."
        confirmText="Delete"
        type="danger"
      />

      <ConfirmModal
        isOpen={isExpenseDeleteModalOpen}
        onClose={() => {
          setIsExpenseDeleteModalOpen(false);
          setExpenseToDelete(null);
        }}
        onConfirm={handleDeleteExpense}
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default FinancePage;
