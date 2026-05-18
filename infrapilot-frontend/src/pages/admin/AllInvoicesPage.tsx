import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Download,
  Trash2,
  Eye,
  Edit3
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { financeService } from "../../services/financeService";
import type { Invoice } from "../../types/invoice";
import toast from "react-hot-toast";
import ViewInvoiceModal from "../../components/forms/ViewInvoiceModal";

const AllInvoicesPage = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setIsLoading(true);
        const data = await financeService.getInvoices();
        setInvoices(data);
      } catch (error) {
        console.error("Failed to fetch invoices", error);
        toast.error("Failed to load invoices");
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const handleDeleteInvoice = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this invoice?")) return;

    try {
      await financeService.deleteInvoice(id);
      setInvoices(invoices.filter(inv => inv.id !== id));
      toast.success("Invoice deleted successfully");
    } catch (error) {
      toast.error("Failed to delete invoice");
    }
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch =
        inv.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || inv.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = invoices.reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const pending = invoices.filter(i => i.status === "pending").reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    const paid = invoices.filter(i => i.status === "paid").reduce((sum, inv) => sum + (inv.total_amount || 0), 0);
    return { total, pending, paid };
  }, [invoices]);

  return (
    <>
      <Navbar title="Estimates & Invoices" breadcrumb={["Dashboard", "Invoices", "All Invoices"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Invoice Portfolio</h1>
              <p className="text-sm text-slate-500">Track and manage all client estimates and final invoices.</p>
            </div>
            <div className="flex gap-3">
              <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
                <Download className="w-4 h-4" /> Export All
              </button>
              <Link
                to="/admin/invoices/create"
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Invoice
              </Link>
            </div>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Billed"
              value={`₹${(stats.total / 100000).toFixed(2)}L`}
              sub="Across all projects"
              accent="text-indigo-600"
            />
            <StatCard
              title="Pending Collection"
              value={`₹${(stats.pending / 100000).toFixed(2)}L`}
              sub="Unpaid invoices"
              accent="text-amber-500"
            />
            <StatCard
              title="Total Received"
              value={`₹${(stats.paid / 100000).toFixed(2)}L`}
              sub="Cleared payments"
              accent="text-emerald-500"
            />
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
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 outline-none"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
                <button className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 transition-colors">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Client Name</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Invoices...</p>
                      </td>
                    </tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center">
                        <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No invoices found</p>
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-black text-slate-800">
                          {inv.invoice_number || `INV-${String(inv.id).padStart(4, '0')}`}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">{inv.client_name || "Unknown Client"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-[200px]">{inv.description}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                          {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : (inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "-")}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-800">₹{(inv.total_amount || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${inv.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                            inv.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setIsViewModalOpen(true);
                              }}
                              className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteInvoice(inv.id)}
                              className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </PageTransition>

      <ViewInvoiceModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        invoice={selectedInvoice}
      />
    </>
  );
};

export default AllInvoicesPage;
