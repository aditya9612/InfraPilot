import { useState, useEffect } from 'react';
import { Search, Check, X, FileBarChart, CreditCard, BookOpen, AlertTriangle, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import api from '../../services/api';
import toast from 'react-hot-toast';

const SIDEBAR_TABS = ['RA Bills', 'Payments', 'Journals'];

export default function ApprovalCenterPage() {
  const [activeTab, setActiveTab] = useState('RA Bills');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [raBills, setRaBills] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [journals, setJournals] = useState<any[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Confirmation Modal state for Payments
  const [paymentToApprove, setPaymentToApprove] = useState<any | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset pagination when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search, itemsPerPage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'RA Bills') {
        try {
          const res = await api.get('/billing');
          const data = Array.isArray(res.data) ? res.data : (res.data?.items || []);
          if (data.length > 0) {
            setRaBills(data);
          } else {
            throw new Error("Empty data");
          }
        } catch (err) {

          setRaBills([]);
        }
      } else if (activeTab === 'Payments') {
        const res = await api.get('/payments/vouchers?status=PENDING');
        setPayments(Array.isArray(res.data) ? res.data : (res.data?.items || []));
      } else if (activeTab === 'Journals') {
        const res = await api.get('/accountant/journal?status=Pending');
        setJournals(Array.isArray(res.data) ? res.data : (res.data?.items || []));
      }
    } catch (err: any) {
      console.error("Failed to fetch data:", err);
      toast.error(`Failed to load ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handle Approvals & Rejections
  const handleApprove = async (item: any) => {
    if (activeTab === 'Payments') {
      setPaymentToApprove(item);
      return;
    }

    try {
      setIsProcessing(true);
      if (activeTab === 'RA Bills') {
        await api.put(`/billing/${item.id}/approve`);
        toast.success("RA Bill approved successfully");
      } else if (activeTab === 'Journals') {
        await api.put(`/approvals/${item.approval_id}/approve`);
        toast.success("Journal approved successfully");
      }
      fetchData();
    } catch (err: any) {
      console.error("Approve failed:", err);
      toast.error(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || "Approval failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (item: any) => {
    try {
      setIsProcessing(true);
      if (activeTab === 'RA Bills') {
        await api.put(`/approvals/${item.approval_id}/reject`, { remarks: "Rejected by Accountant" });
        toast.success("RA Bill rejected");
      } else if (activeTab === 'Payments') {
        await api.post(`/payments/vouchers/${item.id}/cancel`);
        toast.success("Payment rejected (cancelled)");
      } else if (activeTab === 'Journals') {
        await api.put(`/approvals/${item.approval_id}/reject`, { remarks: "Rejected by Accountant" });
        toast.success("Journal rejected");
      }
      fetchData();
    } catch (err: any) {
      console.error("Reject failed:", err);
      toast.error(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || "Rejection failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmPaymentApproval = async () => {
    if (!paymentToApprove) return;
    try {
      setIsProcessing(true);
      await api.post(`/payments/vouchers/${paymentToApprove.id}/mark-paid`);
      toast.success("Payment marked as PAID successfully");
      setPaymentToApprove(null);
      fetchData();
    } catch (err: any) {
      console.error("Payment approve failed:", err);
      toast.error(err.response?.data?.detail?.[0]?.msg || err.response?.data?.detail || "Payment approval failed");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter Data
  const getFilteredData = () => {
    let raw = activeTab === 'RA Bills' ? raBills : activeTab === 'Payments' ? payments : journals;
    if (search) {
      const q = search.toLowerCase();
      raw = raw.filter((item: any) => 
        (item.bill_number?.toLowerCase().includes(q)) ||
        (item.payment_voucher_number?.toLowerCase().includes(q)) ||
        (item.journal_number?.toLowerCase().includes(q)) ||
        (item.project_name?.toLowerCase().includes(q)) ||
        (item.party_name?.toLowerCase().includes(q)) ||
        (item.contractor_name?.toLowerCase().includes(q))
      );
    }
    return raw;
  };

  const filteredData = getFilteredData();
  const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderTableHead = () => {
    const trClass = "bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 font-inter";
    
    if (activeTab === 'RA Bills') {
      return (
        <tr className={trClass}>
          <th className="px-4 py-4 whitespace-nowrap text-left">Bill No</th>
          <th className="px-4 py-4 whitespace-nowrap text-left">Project Name</th>
          <th className="px-4 py-4 min-w-[200px] text-left">Work Description</th>
          <th className="px-4 py-4 whitespace-nowrap text-right">Qty</th>
          <th className="px-4 py-4 whitespace-nowrap text-right">Rate</th>
          <th className="px-4 py-4 whitespace-nowrap text-right">Gross Amt</th>
          <th className="px-4 py-4 whitespace-nowrap text-right">Deductions</th>
          <th className="px-4 py-4 whitespace-nowrap text-right">Net Amt</th>
          <th className="px-4 py-4 whitespace-nowrap text-right">GST %</th>
          <th className="px-4 py-4 whitespace-nowrap text-right">Total Amt</th>
          <th className="px-4 py-4 whitespace-nowrap text-left">Bill Date</th>
          <th className="px-4 py-4 whitespace-nowrap text-center">Status</th>
          <th className="px-4 py-4 whitespace-nowrap text-right">Prog %</th>
          <th className="px-4 py-4 whitespace-nowrap text-right">Total Billed</th>
          <th className="px-4 py-4 whitespace-nowrap text-right">Rem Qty</th>
          <th className="px-4 py-4 whitespace-nowrap text-right">Avail to Bill</th>
          <th className="px-4 py-4 whitespace-nowrap text-center">Actions</th>
        </tr>
      );
    }
    if (activeTab === 'Payments') {
      return (
        <tr className={trClass}>
          <th className="px-6 py-4 w-[35%] text-left">Voucher Details</th>
          <th className="px-6 py-4 w-[35%] text-left">Parties</th>
          <th className="px-6 py-4 w-[15%] text-right whitespace-nowrap">Amount</th>
          <th className="px-6 py-4 w-[15%] text-center">Actions</th>
        </tr>
      );
    }
    if (activeTab === 'Journals') {
      return (
        <tr className={trClass}>
          <th className="px-6 py-4 w-[40%] text-left">Journal Details</th>
          <th className="px-6 py-4 w-[30%] text-right whitespace-nowrap">Amount</th>
          <th className="px-6 py-4 w-[30%] text-center">Actions</th>
        </tr>
      );
    }
  };

  const renderActions = (item: any) => {
    const status = item.status?.toLowerCase();
    if (status === 'approved' || status === 'rejected' || status === 'paid') {
      return null;
    }
    
    return (
      <div className="flex items-center justify-center gap-4">
        <button 
          onClick={() => handleApprove(item)} 
          disabled={isProcessing} 
          title="Approve" 
          className="text-emerald-500 hover:bg-emerald-50/80 p-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <Check className="w-5 h-5 stroke-[3]" />
        </button>
        <button 
          onClick={() => handleReject(item)} 
          disabled={isProcessing} 
          title="Reject" 
          className="text-rose-500 hover:bg-rose-50/80 p-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5 stroke-[3]" />
        </button>
      </div>
    );
  };

  const renderTableRow = (item: any) => {
    if (activeTab === 'RA Bills') {
      return (
        <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 font-inter">
          <td className="px-4 py-4 font-bold text-slate-700 text-[13px] whitespace-nowrap">{item.bill_number || "-"}</td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] whitespace-nowrap">{item.project_name || "-"}</td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] whitespace-nowrap">{item.work_description || "-"}</td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] text-right whitespace-nowrap">{item.quantity ?? "-"}</td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] text-right whitespace-nowrap">₹{Number(item.rate || 0).toLocaleString()}</td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] text-right whitespace-nowrap">₹{Number(item.gross_amount || 0).toLocaleString()}</td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] text-right whitespace-nowrap">₹{Number(item.deductions || 0).toLocaleString()}</td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] text-right whitespace-nowrap">₹{Number(item.net_amount || 0).toLocaleString()}</td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] text-right whitespace-nowrap">{item.gst_percent ?? "-"}%</td>
          <td className="px-4 py-4 font-black text-rose-600 text-[13px] text-right whitespace-nowrap">₹{Number(item.total_amount || 0).toLocaleString()}</td>
          <td className="px-4 py-4 font-medium text-slate-500 text-[12px] whitespace-nowrap">{item.bill_date ? new Date(item.bill_date).toLocaleDateString() : "-"}</td>
          <td className="px-4 py-4 text-center whitespace-nowrap">
            <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${
              item.status?.toLowerCase() === 'approved' || item.status?.toLowerCase() === 'paid' 
                ? 'bg-emerald-100 text-emerald-700' 
                : item.status?.toLowerCase() === 'pending' || item.status?.toLowerCase() === 'submitted'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-600'
            }`}>
              {item.status || 'Pending'}
            </span>
          </td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] text-right whitespace-nowrap">{item.progress_percent ?? "-"}%</td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] text-right whitespace-nowrap">{item.total_billed_quantity ?? "-"}</td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] text-right whitespace-nowrap">{item.remaining_quantity ?? "-"}</td>
          <td className="px-4 py-4 font-medium text-slate-600 text-[13px] text-right whitespace-nowrap">{item.available_to_bill ?? "-"}</td>
          <td className="px-4 py-4 whitespace-nowrap text-center">
            {renderActions(item)}
          </td>
        </tr>
      );
    }
    if (activeTab === 'Payments') {
      return (
        <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 font-inter">
          <td className="px-6 py-4">
            <div className="font-bold text-slate-800 text-sm">{item.payment_voucher_number || "-"}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">{item.payment_date ? new Date(item.payment_date).toLocaleDateString() : "-"}</div>
          </td>
          <td className="px-6 py-4">
            <div className="font-bold text-slate-700 text-[13px]">{item.project_name || "-"}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">{item.party_name || "N/A"}</div>
          </td>
          <td className="px-6 py-4 text-right">
            <div className="font-black text-rose-600 text-[13px]">₹{Number(item.gross_amount || 0).toLocaleString()}</div>
          </td>
          <td className="px-6 py-4">
            {renderActions(item)}
          </td>
        </tr>
      );
    }
    if (activeTab === 'Journals') {
      return (
        <tr key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 font-inter">
          <td className="px-6 py-4">
            <div className="font-bold text-slate-800 text-sm">{item.journal_number || "-"}</div>
            <div className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">{item.entry_date ? new Date(item.entry_date).toLocaleDateString() : "-"}</div>
          </td>
          <td className="px-6 py-4 text-right">
            <div className="font-black text-rose-600 text-[13px]">₹{Number(item.amount || 0).toLocaleString()}</div>
          </td>
          <td className="px-6 py-4">
            {renderActions(item)}
          </td>
        </tr>
      );
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'RA Bills': return <FileBarChart className="w-4 h-4" />;
      case 'Payments': return <CreditCard className="w-4 h-4" />;
      case 'Journals': return <BookOpen className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <>
      <Navbar title="Approval Center" breadcrumb={['InfraPilot', 'Accountant', 'Approval Center']} />
      <PageTransition className="p-4 md:p-6 bg-[#f8fafc] min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        
        {/* Tabs */}
        <div className="flex p-1 bg-white rounded-xl w-fit mb-6 shadow-sm border border-slate-100 flex-wrap">
          {SIDEBAR_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSearch(''); }}
              className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all flex items-center gap-2 ${
                activeTab === tab ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              {getTabIcon(tab)}
              {tab}
            </button>
          ))}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex flex-col gap-6 relative">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Pending {activeTab}</h1>
              <p className="text-slate-500 text-sm mt-1">Review and manage pending {activeTab.toLowerCase()} requiring your approval.</p>
            </div>
            
            <div className="relative flex-1 max-w-sm font-inter">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input 
                type="text" 
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all placeholder:text-slate-400 font-inter shadow-sm"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden font-inter flex flex-col flex-1 min-h-[400px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-20 flex-1">
                <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Fetching Data...</p>
              </div>
            ) : filteredData.length > 0 ? (
              <>
                <div className="flex-1 overflow-x-auto min-h-0">
                  <table className="w-full text-left font-inter min-w-max">
                    <thead>
                      {renderTableHead()}
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {paginatedData.map(renderTableRow)}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination for History Logs style */}
                  <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 mt-auto rounded-b-2xl">
                    {/* Left: Items per page */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                      <select
                        value={itemsPerPage}
                        onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                        className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>

                    {/* Center: Showing info */}
                    <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                      Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
                    </div>

                    {/* Right: Pagination */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {(() => {
                        const totalItems = filteredData.length;
                        const tPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                        const pages = [];
                        if (tPages <= 5) {
                          for (let i = 1; i <= tPages; i++) pages.push(i);
                        } else {
                          if (currentPage <= 3) {
                            pages.push(1, 2, 3, 4, '...', tPages);
                          } else if (currentPage >= tPages - 2) {
                            pages.push(1, '...', tPages - 3, tPages - 2, tPages - 1, tPages);
                          } else {
                            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', tPages);
                          }
                        }

                        return pages.map((page, index) => {
                          if (page === '...') {
                            return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                          }
                          const pageNum = page;
                          const isActive = currentPage === pageNum;
                          return (
                            <button
                              key={`page-${pageNum}`}
                              onClick={() => setCurrentPage(pageNum as number)}
                              className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                                ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                                : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                                }`}
                            >
                              {pageNum}
                            </button>
                          );
                        });
                      })()}

                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === Math.max(1, totalPages) || filteredData.length === 0}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 flex-1">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <Inbox className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-700">No {activeTab} Found</h3>
                <p className="text-slate-500 text-sm mt-1">There are no pending items requiring your approval right now.</p>
              </div>
            )}
          </div>
        </div>
      </PageTransition>

      {/* Payment Confirmation Modal */}
      {paymentToApprove && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => !isProcessing && setPaymentToApprove(null)} />
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden font-inter animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Confirm Payment Approval</h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Approving this payment will mark it as <span className="font-black text-slate-800">PAID</span> and execute the payment accounting entries. Continue?
              </p>
              
              <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Voucher</p>
                    <p className="text-sm font-bold text-slate-700">{paymentToApprove.payment_voucher_number}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</p>
                    <p className="text-sm font-black text-rose-600">₹{Number(paymentToApprove.gross_amount || 0).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-end">
                <button
                  onClick={() => setPaymentToApprove(null)}
                  disabled={isProcessing}
                  className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPaymentApproval}
                  disabled={isProcessing}
                  className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
                >
                  {isProcessing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4 stroke-[3]" />}
                  Confirm Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
