import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Eye,
  Trash2,
  Download,
} from "lucide-react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import ConfirmationModal from "../../components/common/ConfirmationModal";
import { quotationService } from "../../services/quotationService";
import type { Quotation } from "../../types/quotation";
import toast from "react-hot-toast";
import { exportToCSV } from "../../utils/csvExport";

const AllInvoicesPage = () => {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const PAGE_SIZE = 8;

  useEffect(() => {
    const fetchEstimates = async () => {
      try {
        setIsLoading(true);
        const data = await quotationService.getQuotations();
        setQuotations(data);
      } catch (error) {
        console.error("Failed to fetch estimates", error);
        toast.error("Failed to load estimates");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEstimates();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await quotationService.deleteQuotation(deleteTarget);
      toast.success("Estimate deleted successfully");
      const data = await quotationService.getQuotations();
      setQuotations(data);
    } catch (error) {
      toast.error("Failed to delete estimate");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filteredData = useMemo(() => {
    return quotations.filter(q => {
      const matchSearch =
        q.quotation_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" ||
        q.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const pagedData = filteredData.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  // Reset to page 0 on search/filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = quotations.reduce((sum, q) => sum + (q.grand_total || 0), 0);
    const approved = quotations.filter(q => q.status === "approved").reduce((sum, q) => sum + (q.grand_total || 0), 0);
    const draft = quotations.filter(q => q.status === "draft").reduce((sum, q) => sum + (q.grand_total || 0), 0);
    return { total, pending: draft, paid: approved, labelTotal: "Pipeline Value", labelPending: "Draft Estimates", labelPaid: "Approved Proposals" };
  }, [quotations]);

  const handleExportAll = () => {
    if (filteredData.length === 0) {
      toast.error("No data to export.");
      return;
    }
    const csvData = filteredData.map((q) => ({
      quotation_no: q.quotation_no || `QTN-${q.id}`,
      client_name: q.client_name || "Unknown",
      project_name: q.project_name || "-",
      date: q.created_at ? new Date(q.created_at).toLocaleDateString() : "-",
      grand_total: q.grand_total || 0,
      status: q.status || "draft",
    }));
    exportToCSV(csvData, `invoices_export_${new Date().toISOString().split("T")[0]}.csv`, {
      quotation_no: "Invoice #",
      client_name: "Client Name",
      project_name: "Project / Description",
      date: "Date",
      grand_total: "Amount (₹)",
      status: "Status",
    });
    toast.success(`Exported ${filteredData.length} records to CSV!`);
  };

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
              <button
                onClick={handleExportAll}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
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
              title={stats.labelTotal}
              value={`₹${(stats.total / 100000).toFixed(2)}L`}
              sub={`${quotations.length} Active Estimates`}
              accent="text-indigo-600"
            />
            <StatCard
              title={stats.labelPending}
              value={`₹${(stats.pending / 100000).toFixed(2)}L`}
              sub="Requires review"
              accent="text-amber-500"
            />
            <StatCard
              title={stats.labelPaid}
              value={`₹${(stats.paid / 100000).toFixed(2)}L`}
              sub="Won projects"
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
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="converted">Converted</option>
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
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading estimates...</p>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center">
                        <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No estimates found</p>
                      </td>
                    </tr>
                  ) : (
                    (pagedData as Quotation[]).map((q) => (
                      <tr key={q.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4 text-sm font-black text-slate-800">
                          {q.quotation_no || `QTN-${q.id}`}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-slate-700">{q.client_name || "Unknown Client"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-slate-500 font-medium line-clamp-1 max-w-[200px]">{q.project_name}</p>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                          {q.created_at ? new Date(q.created_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-black text-slate-800">₹{(q.grand_total || 0).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${q.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                            q.status === 'draft' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                            {q.status || "draft"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/admin/quotations/view/${q.id}`}
                              className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                            <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Download PDF">
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => q.id && setDeleteTarget(q.id)}
                              className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                              title="Delete Estimate"
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
            {/* Pagination Component */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filteredData.length)} of {filteredData.length} records
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
        title="Delete Estimate"
        message="Are you sure you want to permanently delete this estimate? This action cannot be undone."
        confirmLabel="Delete"
        confirmClass="bg-rose-500 hover:bg-rose-600 shadow-rose-200"
      />
    </>
  );
};

export default AllInvoicesPage;
