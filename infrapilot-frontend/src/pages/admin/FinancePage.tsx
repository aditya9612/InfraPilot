import { useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import CreateInvoiceModal from "../../components/forms/CreateInvoiceModal";
import InvoiceDetailsModal from "../../components/dashboard/InvoiceDetailsModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import type { Invoice, InvoiceStatus } from "../../types/invoice";
import { projectService } from "../../services/projectService";
import type { Project } from "../../types/project";
import { useEffect, useCallback } from "react";

// Expanded Mock Data following API spec
const initialInvoices: Invoice[] = [
  {
    id: 1,
    project_id: 1,
    owner_id: 1,
    type: "owner",
    reference_id: 0,
    amount: 156000,
    gst_percent: 18,
    gst_amount: 28080,
    tax_percent: 2,
    tax_amount: 3120,
    total_amount: 187200,
    status: "pending",
    description: "Owner initial payment",
    created_at: "2026-04-02T18:11:53"
  },
  {
    id: 2,
    project_id: 1,
    owner_id: 1,
    type: "labour",
    reference_id: 1,
    amount: 50000,
    gst_percent: 18,
    gst_amount: 9000,
    tax_percent: 5,
    tax_amount: 2500,
    total_amount: 61500,
    status: "pending",
    description: "Construction invoice for Wing A",
    created_at: "2026-04-02T18:11:53"
  },
  {
    id: 3,
    project_id: 2,
    owner_id: 1,
    type: "material",
    reference_id: 1,
    amount: 850000,
    gst_percent: 18,
    gst_amount: 153000,
    tax_percent: 3,
    tax_amount: 25500,
    total_amount: 1028500,
    status: "paid",
    description: "Steel reinforcement supply - Batch 1",
    created_at: "2026-04-03T10:15:00"
  }
];

const FinancePage = () => {
  const location = useLocation();
  const subPage = location.pathname.split("/").pop() || "invoices";
  
  // States
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);

  // Fetch Projects
  const fetchProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await projectService.getProjects(100, 0);
      const projectList = Array.isArray(res) ? res : (res.items || res.data || []);
      setProjects(projectList);
    } catch (error) {
      console.error("Finance: Failed to fetch projects", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Handlers
  const handleCreateOrUpdate = (data: any) => {
    if (selectedInvoice) {
      setInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? { ...inv, ...data } : inv));
      toast.success("Invoice updated successfully");
    } else {
      const newInvoice: Invoice = {
        ...data,
        id: Math.max(...invoices.map(i => i.id)) + 1
      };
      setInvoices(prev => [newInvoice, ...prev]);
      toast.success("Invoice created successfully");
    }
    setSelectedInvoice(null);
  };

  const handleDeleteClick = (id: number) => {
    setInvoiceToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteInvoice = () => {
    if (invoiceToDelete) {
      setInvoices(invoices.filter(inv => inv.id !== invoiceToDelete));
      toast.success("Invoice deleted");
      setIsDeleteModalOpen(false);
      setInvoiceToDelete(null);
    }
  };

  const handleMarkPaid = (id: number) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'paid' as InvoiceStatus } : inv));
    toast.success("Invoice marked as Paid");
    setIsDetailsModalOpen(false);
  };

  const handleDownloadPDF = (_id: number) => {
    toast.loading("Generating PDF...", { duration: 2000 });
    setTimeout(() => {
      toast.success("Invoice PDF downloaded successfully");
    }, 2000);
  };

  // Filtered Data
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const project = projects.find(p => p.id === inv.project_id);
      const matchSearch = (project?.project_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "all" || inv.type === typeFilter;
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      
      return matchSearch && matchType && matchStatus;
    });
  }, [invoices, searchTerm, typeFilter, statusFilter]);

  // Totals
  const totals = useMemo(() => {
    return {
      billing: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
      pending: invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.total_amount, 0),
      gst: invoices.reduce((sum, inv) => sum + inv.gst_amount, 0)
    };
  }, [invoices]);

  return (
    <>
      <Navbar title="Finance & Accounts" breadcrumb={["Admin", "Finance", subPage.charAt(0).toUpperCase() + subPage.slice(1)]} />
      
      <PageTransition key={location.pathname} className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{subPage.charAt(0).toUpperCase() + subPage.slice(1)} Management</h1>
            <p className="text-slate-500 text-sm">Review, authorize and track project-wise financial documentation.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">Sync Ledger</button>
            <button 
              onClick={() => { setSelectedInvoice(null); setIsModalOpen(true); }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
            >
              + Create Invoice
            </button>
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Billing" value={`₹${(totals.billing / 100000).toFixed(2)}L`} sub="Gross including taxes" accent="text-primary" />
          <StatCard title="Pending Collections" value={`₹${(totals.pending / 100000).toFixed(2)}L`} sub="Unpaid invoices" accent="text-amber-500" />
          <StatCard title="Total GST Collected" value={`₹${(totals.gst / 100000).toFixed(2)}L`} sub="Net tax liability" accent="text-violet-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {["invoices", "payments", "expenses", "profit"].map((tab) => (
                <button 
                  key={tab}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all capitalize ${subPage === tab ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  onClick={() => window.history.pushState(null, "", `/admin/finance/${tab}`)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input
                  type="text"
                  placeholder="Search project or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all w-64"
                />
              </div>

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

              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">Invoice #</th>
                  <th className="px-6 py-4">Project / Description</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Base Amount</th>
                  <th className="px-6 py-4">Tax / GST</th>
                  <th className="px-6 py-4">Total Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-slate-400">INV-{String(inv.id).padStart(3, '0')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase">
                          {projects.find(p => p.id === inv.project_id)?.project_name || "Unknown Project"}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium line-clamp-1">{inv.description}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">
                        {inv.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-700">₹{inv.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="text-[9px] font-bold">
                        <p className="text-emerald-500">GST: ₹{inv.gst_amount.toLocaleString()}</p>
                        <p className="text-rose-500">Tax: ₹{inv.tax_amount.toLocaleString()}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary">₹{inv.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${
                        inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1 transition-opacity">
                        <button onClick={() => { setSelectedInvoice(inv); setIsDetailsModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" title="View Details">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button onClick={() => { setSelectedInvoice(inv); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit Invoice">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button onClick={() => handleDeleteClick(inv.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete Invoice">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
      />
      <InvoiceDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        invoice={selectedInvoice}
        onMarkPaid={handleMarkPaid}
        onDownloadPDF={handleDownloadPDF}
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
    </>
  );
};

export default FinancePage;
