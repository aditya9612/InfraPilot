import { useState } from "react";
import { Search, CheckCircle, XCircle, Loader2, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { superadminService } from '../../api/superadmin';
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";

const ManualPaymentsPage = () => {
  const queryClient = useQueryClient();
  const [rejectPanelOpen, setRejectPanelOpen] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | number | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { data: response, isLoading } = useQuery({
    queryKey: ['superadmin_manual_payments'],
    queryFn: () => superadminService.getManualPayments(),
  });

  const filteredPayments = (response?.items || []).filter((p) => {
    const matchStatus = statusFilter === "all" || p.status.toLowerCase() === statusFilter;
    const matchSearch = !search || p.utr_number?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalItems = filteredPayments.length;
  const paginatedPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const verifyMutation = useMutation({
    mutationFn: (txId: string | number) => superadminService.verifyManualPayment(txId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['superadmin_manual_payments'] }),
  });

  const rejectMutation = useMutation({
    mutationFn: () => superadminService.rejectManualPayment(selectedTxId!, { rejection_reason: rejectReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin_manual_payments'] });
      setRejectPanelOpen(false);
      setSelectedTxId(null);
      setRejectReason("");
    },
  });

  const statusCounts = {
    all: response?.items?.length || 0,
    pending: response?.items?.filter(p => p.status === 'Pending').length || 0,
    verified: response?.items?.filter(p => p.status === 'Verified').length || 0,
    rejected: response?.items?.filter(p => p.status === 'Rejected').length || 0,
  };

  return (
    <>
      <Navbar title="Manual Payments" breadcrumb={["InfraPilot", "Super Admin", "Manual Payments"]} />
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex gap-6 relative">
          <div className={`flex-1 transition-all duration-300 ${rejectPanelOpen ? 'pr-[400px]' : ''}`}>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Platform</p>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">Manual UPI Payments</h1>
                <p className="text-slate-500 text-sm">Review and verify manually submitted UPI payment transactions</p>
              </div>
            </div>

            {/* Stats */}
            <div className="mb-6">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Payment Overview</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Total", count: statusCounts.all, color: "bg-white border-slate-100 text-slate-700" },
                  { label: "Pending", count: statusCounts.pending, color: "bg-white border-amber-100 text-amber-700" },
                  { label: "Verified", count: statusCounts.verified, color: "bg-white border-emerald-100 text-emerald-700" },
                  { label: "Rejected", count: statusCounts.rejected, color: "bg-white border-rose-100 text-rose-700" },
                ].map(({ label, count, color }) => (
                  <div key={label} className={`rounded-2xl shadow-sm border p-6 flex flex-col justify-center ${color}`}>
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-2 opacity-70">{label}</p>
                    <p className="text-3xl font-black">{count}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex gap-2">
                  {["all", "pending", "verified", "rejected"].map((s) => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                        statusFilter === s ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {s === "all" ? "All Status" : s}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by UTR number..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 w-[250px] bg-white shadow-sm"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Company ID</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">UTR Number</th>
                      <th className="px-6 py-4">Payment Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Remarks</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr><td colSpan={7} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /></td></tr>
                    ) : paginatedPayments.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-10 text-slate-500">No manual payments found.</td></tr>
                    ) : paginatedPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{payment.company_id}</td>
                        <td className="px-6 py-4 font-bold text-slate-700">₹{Number(payment.amount).toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">{payment.utr_number}</td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{new Date(payment.payment_date || payment.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            payment.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                            payment.status === 'Verified' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">{payment.remarks || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          {payment.status === 'Pending' ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => verifyMutation.mutate(payment.id)}
                                disabled={verifyMutation.isPending}
                                className="p-1.5 text-emerald-500 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve Payment"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => { setSelectedTxId(payment.id); setRejectPanelOpen(true); }}
                                className="p-1.5 text-rose-500 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                                title="Reject Payment"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors rounded-lg ml-auto" title="View Details">
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination matching CompaniesPage style */}
              {!isLoading && paginatedPayments.length > 0 && (
                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 font-inter rounded-b-2xl flex-wrap gap-4">
                  {/* Left: Items per page */}
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-blue-600 bg-white shadow-sm"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>

                  {/* Center: Showing info */}
                  <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} records
                  </div>

                  {/* Right: Pagination */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {(() => {
                      const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                      let pages: (number | string)[] = [];
                      
                      if (totalPages <= 5) {
                        pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                      } else {
                        if (currentPage <= 3) {
                          pages = [1, 2, 3, 4, '...', totalPages];
                        } else if (currentPage >= totalPages - 2) {
                          pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
                        } else {
                          pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
                        }
                      }

                      return pages.map((pageItem, idx) => (
                        <button
                          key={idx}
                          onClick={() => typeof pageItem === 'number' && setCurrentPage(pageItem)}
                          disabled={typeof pageItem !== 'number'}
                          className={`
                            min-w-[28px] h-7 rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center justify-center cursor-pointer
                            ${pageItem === currentPage
                              ? 'bg-blue-600 text-white border-blue-600 shadow-blue-600/20'
                              : pageItem === '...'
                                ? 'bg-transparent border-transparent text-slate-400 cursor-default shadow-none'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-slate-300'}
                            ${typeof pageItem === 'number' ? 'border' : ''}
                          `}
                        >
                          {pageItem}
                        </button>
                      ));
                    })()}

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalItems / itemsPerPage), prev + 1))}
                      disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reject Slide-over */}
          {rejectPanelOpen && (
            <div className="w-[400px] bg-white border-l border-slate-200 shadow-2xl fixed right-0 top-0 bottom-0 z-50 overflow-y-auto">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
                <h2 className="text-lg font-bold text-slate-800">Reject Payment</h2>
                <button onClick={() => setRejectPanelOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Rejection <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={4}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter detailed reason for rejecting this UTR..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">This reason will be visible to the company admin.</p>
                </div>
                <div className="flex gap-3 pt-4 border-t border-slate-100">
                  <button onClick={() => setRejectPanelOpen(false)} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                  <button
                    onClick={() => rejectMutation.mutate()}
                    disabled={!rejectReason || rejectMutation.isPending}
                    className="flex-1 flex justify-center items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 disabled:opacity-50"
                  >
                    {rejectMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirm Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </>
  );
};

export default ManualPaymentsPage;
