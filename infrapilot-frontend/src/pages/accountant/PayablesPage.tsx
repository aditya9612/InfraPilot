import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";
import api from "../../services/api";
import { projectService } from "../../services/projectService";
import { accountingService } from "../../services/accountingService";


// --- UTILS ---
const fmt = (num: number) => `₹${(Number(num) || 0).toLocaleString("en-IN")}`;
const statusBadge = (s: string) => {
  if (s === "Paid" || s === "Approved") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (s === "Partial" || s === "Pending") return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-rose-100 text-rose-700 border border-rose-200";
};

// --- SECTIONS ---

const PaginationControls = ({ 
  currentPage, 
  setCurrentPage, 
  recordsPerPage, 
  setRecordsPerPage, 
  filteredRecordsLength 
}: { 
  currentPage: number; 
  setCurrentPage: (p: number | ((prev: number) => number)) => void; 
  recordsPerPage: number; 
  setRecordsPerPage: (v: number) => void; 
  filteredRecordsLength: number; 
}) => {
  const totalPages = Math.ceil(filteredRecordsLength / recordsPerPage);
  return (
    <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 rounded-b-2xl mt-4">
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
        <select 
          value={recordsPerPage} 
          onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white cursor-pointer hover:border-slate-300"
        >
          {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
      </div>
      <span className="text-xs text-slate-500 font-semibold">
        Showing {filteredRecordsLength === 0 ? 0 : (currentPage - 1) * recordsPerPage + 1} - {Math.min(currentPage * recordsPerPage, filteredRecordsLength)} of {filteredRecordsLength} records
      </span>
      <div className="flex items-center gap-1">
        <button 
          onClick={() => setCurrentPage(p => Math.max(1, typeof p === 'number' ? p - 1 : p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
        >
          Prev
        </button>
        <span className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 text-xs font-bold">
          {currentPage}
        </span>
        <button 
          onClick={() => setCurrentPage(p => Math.min(totalPages, typeof p === 'number' ? p + 1 : p + 1))}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-50 transition-all cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// 1. Dashboard (Payable)
const DashboardSection = () => {
  const [summary, setSummary] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [dateRangePayables, setDateRangePayables] = useState<any[]>([]);
  const [allPayables, setAllPayables] = useState<any[]>([]);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [payingBill, setPayingBill] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Pagination for Date Range Payables
  const [dateRangePage, setDateRangePage] = useState(1);
  const [dateRangePerPage, setDateRangePerPage] = useState(10);
  const paginatedDateRange = dateRangePayables.slice((dateRangePage - 1) * dateRangePerPage, dateRangePage * dateRangePerPage);

  // Pagination for All Payables
  const [allPayablesPage, setAllPayablesPage] = useState(1);
  const [allPayablesPerPage, setAllPayablesPerPage] = useState(10);
  const paginatedAllPayables = allPayables.slice((allPayablesPage - 1) * allPayablesPerPage, allPayablesPage * allPayablesPerPage);

  useEffect(() => {
    accountingService.getPayablesSummary().then(setSummary).catch(() => { });
    accountingService.getPayables().then(res => {
      const items = res?.items || res?.data || res || [];
      setAllPayables(Array.isArray(items) ? items : []);
    }).catch(() => {});
    projectService.getProjects(100, 0, "").then(res => {
      const arr = Array.isArray(res) ? res : (res?.items || res?.data || []);
      setAssignedProjects(arr);
    }).catch(() => {});
  }, []);

  const handleFetchDateRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateRange.start || !dateRange.end) return toast.error("Select both start and end dates");
    setIsLoading(true);
    try {
      const res = await accountingService.getPayablesByDateRange(dateRange.start, dateRange.end);
      setDateRangePayables(Array.isArray(res) ? res : res?.data || []);
      setDateRangePage(1); // Reset page on new search
    } catch (err) {
      toast.error("Failed to fetch payables by date");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmPay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payingBill) return;

    const formData = new FormData(e.currentTarget);
    const payload = {
      amount: Number(formData.get("amount")),
      mode: formData.get("mode") as string,
      reference: formData.get("reference") as string,
    };

    try {
      const idToPay = payingBill.ra_id || payingBill.id;
      await accountingService.payContractor(idToPay, payload);
      
      setAllPayables(prev => prev.map((item: any) => 
        (item.ra_id === payingBill.ra_id || item.id === payingBill.id) 
          ? { ...item, status: "Paid", paid_amount: (item.paid_amount || item.paid || 0) + payload.amount } 
          : item
      ));
      toast.success("Payment recorded successfully!");
      setPayingBill(null);
    } catch (err) {
      toast.error("Failed to record payment");
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
            <p className="text-2xl font-black text-slate-800">{summary?.total ? fmt(summary.total) : "₹ 0"}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 text-xl">📉</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Amount</p>
            <p className="text-2xl font-black text-slate-800">{summary?.pending ? fmt(summary.pending) : "₹ 0"}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 text-xl">⏳</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Paid (This Month)</p>
            <p className="text-2xl font-black text-slate-800">{summary?.paid ? fmt(summary.paid) : "₹ 0"}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500 text-xl">💸</div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="font-bold text-slate-800 mb-4">Payables By Date Range</h3>
        <form onSubmit={handleFetchDateRange} className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Start Date</label>
            <input type="date" required value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">End Date</label>
            <input type="date" required value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} className="border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 transition-all" />
          </div>
          <button type="submit" disabled={isLoading} className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-70">
            {isLoading ? "Searching..." : "Search"}
          </button>
        </form>

        {dateRangePayables.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDateRange.map((b, i) => {
              const projectName = assignedProjects.find(p => p.id === b.project_id)?.name || b.project?.project_name || b.project_name || (b.project_id ? `Project ${b.project_id}` : "—");
              const contractorName = b.contractor?.name || b.contractor?.full_name || b.contractor_name || (b.contractor_id ? `Contractor ${b.contractor_id}` : "—");
              
              return (
                <div key={b.id || i} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4 pb-4 border-b border-slate-100">
                    <div>
                      <h4 className="font-black text-primary text-base">{b.bill_number || b.bill_no || b.ra_id || "—"}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Date: {b.bill_date || b.date || "—"}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${statusBadge(b.status || "Pending")}`}>
                      {b.status || "Pending"}
                    </span>
                  </div>

                  {/* Core Info */}
                  <div className="space-y-3 mb-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Project</span>
                      <span className="font-bold text-slate-800 text-right">{projectName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Contractor</span>
                      <span className="font-bold text-slate-800 text-right">{contractorName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Description</span>
                      <span className="font-medium text-slate-700 text-right truncate max-w-[150px] ml-4" title={b.work_description || "—"}>{b.work_description || "—"}</span>
                    </div>
                  </div>

                  {/* Financial Details Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-3 mb-4 text-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Rate × Qty</p>
                      <p className="font-bold text-slate-700">{b.rate || 0} × {b.quantity || 0}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Gross</p>
                      <p className="font-bold text-slate-700">{fmt(b.gross_amount || 0)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">Deductions</p>
                      <p className="font-bold text-rose-500">-{fmt(b.deductions || 0)}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 font-medium">GST ({b.gst_percent || 0}%)</p>
                      <p className="font-bold text-slate-700">{fmt((b.total_amount || 0) - (b.net_amount || 0))}</p>
                    </div>
                  </div>

                  {/* Footer Totals */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net Amount</p>
                      <p className="font-black text-slate-600">{fmt(b.net_amount || 0)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</p>
                      <p className="text-lg font-black text-slate-800">{fmt(b.total_amount || b.payable || b.amount || 0)}</p>
                    </div>
                  </div>
                  
                  {/* References */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-2 text-[10px] font-medium text-slate-400">
                    {b.work_order_id && <span className="bg-slate-100 px-2 py-1 rounded">WO: {b.work_order_id}</span>}
                    {b.quotation_id && <span className="bg-slate-100 px-2 py-1 rounded">QT: {b.quotation_id}</span>}
                    {b.measurement_id && <span className="bg-slate-100 px-2 py-1 rounded">MB: {b.measurement_id}</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <PaginationControls 
            currentPage={dateRangePage} setCurrentPage={setDateRangePage} 
            recordsPerPage={dateRangePerPage} setRecordsPerPage={setDateRangePerPage} 
            filteredRecordsLength={dateRangePayables.length} 
          />
        </>
      ) : (
        <div className="text-center py-8 text-slate-400 text-sm">No payables found in this date range. Select dates and search.</div>
      )}
    </div>

    {allPayables.length > 0 && (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mt-6">
        <h3 className="font-bold text-slate-800 mb-4">All Payables</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["Bill No", "Project", "Contractor", "Total Amount", "Paid Amount", "Pending Amount", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedAllPayables.map((b, i) => {
                  const projectName = assignedProjects.find(p => p.id === b.project_id)?.name || b.project?.project_name || b.project_name || (b.project_id ? `Project ${b.project_id}` : "—");
                  const billNo = b.bill_number || b.bill_no || (b.ra_id ? `RA-${b.ra_id}` : (b.id ? `Bill-${b.id}` : "—"));
                  const contractorName = b.contractor?.name || b.contractor?.full_name || b.contractor_name || (b.contractor_id ? `Contractor ${b.contractor_id}` : "—");
                  
                  return (
                    <tr key={b.ra_id || b.id || i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 text-xs font-bold text-primary">{billNo}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{projectName}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{contractorName}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">{fmt(b.total_amount || b.payable || b.amount || 0)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-emerald-600">{fmt(b.paid_amount || b.paid || 0)}</td>
                      <td className="px-4 py-3 text-xs font-bold text-rose-600">{fmt(b.pending_amount || (b.total_amount ? (b.total_amount - (b.paid_amount || 0)) : 0) || 0)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${statusBadge(b.status || "Pending")}`}>
                          {b.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {(!b.status || ["pending", "approved", "partial"].includes(b.status.toLowerCase())) && (
                          <button onClick={() => setPayingBill(b)} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all">
                            Pay
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <PaginationControls 
            currentPage={allPayablesPage} setCurrentPage={setAllPayablesPage} 
            recordsPerPage={allPayablesPerPage} setRecordsPerPage={setAllPayablesPerPage} 
            filteredRecordsLength={allPayables.length} 
          />
        </div>
      )}

      {/* Payment Modal */}
      {payingBill && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleConfirmPay} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800">Record Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bill: {payingBill.bill_number || payingBill.bill_no || (payingBill.ra_id ? `RA-${payingBill.ra_id}` : `Bill-${payingBill.id}`)}</p>
              </div>
              <button type="button" onClick={() => setPayingBill(null)} className="text-slate-400 hover:text-slate-600">✖</button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                  Amount to Pay (Due: {fmt((payingBill.pending_amount || (payingBill.total_amount ? (payingBill.total_amount - (payingBill.paid_amount || 0)) : 0) || 0))})
                </label>
                <input type="number" name="amount" defaultValue={(payingBill.pending_amount || (payingBill.total_amount ? (payingBill.total_amount - (payingBill.paid_amount || 0)) : 0) || 0)} required max={(payingBill.pending_amount || (payingBill.total_amount ? (payingBill.total_amount - (payingBill.paid_amount || 0)) : 0) || 0)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Payment Mode</label>
                <select name="mode" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all cursor-pointer">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Reference (Optional)</label>
                <input type="text" name="reference" placeholder="e.g. UTR / Cheque No" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all" />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setPayingBill(null)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
              <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all">Submit Payment</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
// 2. Vendor Bills
const VendorBillsSection = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create" | "approval" | "payments">(
    (initialSubTab as any) || "list"
  );
  const [vendorBills, setVendorBills] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingBill, setEditingBill] = useState<any>(null);
  const [viewingBillId, setViewingBillId] = useState<number | null>(null);
  const [viewingBillDetails, setViewingBillDetails] = useState<any>(null);
  const [isViewingLoading, setIsViewingLoading] = useState(false);
  const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
  const [billItems, setBillItems] = useState<any[]>([{ item_name: "", hsn_sac: "", quantity: 0, rate: 0, amount: 0 }]);


  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [assignedSuppliers, setAssignedSuppliers] = useState<any[]>([]);
  const [assignedPOs, setAssignedPOs] = useState<any[]>([]);

  useEffect(() => {
    if (activeSubTab === "create") {
      setSelectedProjectId(editingBill?.project_id ? String(editingBill.project_id) : "");
    }
  }, [activeSubTab, editingBill]);

  useEffect(() => {
    const fetchPOsAndSuppliers = async () => {
      if (!selectedProjectId) {
        setAssignedSuppliers([]);
        setAssignedPOs([]);
        return;
      }
      try {
        const [posRes, suppliersRes] = await Promise.all([
          api.get('/materials/purchase-orders', { params: { project_id: selectedProjectId, limit: 500 } }),
          api.get('/materials/suppliers') // Fetch all to get their names
        ]);

        const dataPOs = posRes.data;
        const pos = Array.isArray(dataPOs) ? dataPOs : (dataPOs?.items || dataPOs?.data || []);

        const dataSuppliers = suppliersRes.data;
        const allSuppliers = Array.isArray(dataSuppliers) ? dataSuppliers : (dataSuppliers?.items || dataSuppliers?.data || []);
        
        // Extract unique supplier IDs from POs
        const poSupplierIds = new Set(pos.map((p: any) => p.supplier_id).filter(Boolean));

        // Filter actual suppliers using the IDs from POs to get their real names
        const filteredSuppliers = allSuppliers.filter((s: any) => poSupplierIds.has(s.id || s.user_id));
        setAssignedSuppliers(filteredSuppliers);

        // Populate POs with descriptive names
        const formattedPOs = pos.map((p: any) => ({
          ...p,
          name: p.material_name || p.name || p.po_number || 'Material'
        }));
        setAssignedPOs(formattedPOs);
      } catch (err) {
        console.error("Failed to fetch POs and suppliers", err);
      }
    };
    fetchPOsAndSuppliers();
  }, [selectedProjectId]);

  const fetchProjects = async () => {
    try {
      const res = await projectService.getProjects(100, 0, "");
      const arr = Array.isArray(res) ? res : (res?.items || res?.data || []);
      setAssignedProjects(arr);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    }
  };

  const fetchPayables = async () => {
    try {
      const data = await accountingService.getPayables();
      const items = data?.items || data?.data || data || [];
      setVendorBills(Array.isArray(items) ? items : []);
    } catch (err) {
      toast.error("Failed to fetch vendor bills");
    }
  };

  useEffect(() => {
    fetchProjects();
    if (activeSubTab === "list" || activeSubTab === "approval" || activeSubTab === "payments") {
      fetchPayables();
    }
    if (activeSubTab === "create") {
      if (editingBill?.items && editingBill.items.length > 0) {
        setBillItems(editingBill.items);
      } else {
        setBillItems([{ item_name: "", hsn_sac: "", quantity: 0, rate: 0, amount: 0 }]);
      }
    } else {
      setBillItems([{ item_name: "", hsn_sac: "", quantity: 0, rate: 0, amount: 0 }]);
    }
  }, [activeSubTab, editingBill]);

  const handleViewBill = async (id: number) => {
    setViewingBillId(id);
    setIsViewingLoading(true);
    try {
      const response = await api.get(`/vendor-bills/${id}`);
      setViewingBillDetails(response.data);
    } catch (err) {
      toast.error("Failed to fetch bill details");
    } finally {
      setIsViewingLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.post(`/vendor-bills/${id}/approve`);
      toast.success("Vendor bill approved!");
      fetchPayables();
    } catch (err) {
      toast.error("Failed to approve bill");
    }
  };

  const handlePay = async (id: number) => {
    try {
      await api.post(`/vendor-bills/${id}/pay`);
      toast.success("Payment recorded!");
      fetchPayables();
    } catch (err) {
      toast.error("Failed to record payment");
    }
  };



  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: any = {};
    const numericFields = ['supplier_id', 'project_id', 'purchase_order_id', 'gross_amount', 'gst_percent', 'gst_amount', 'tds_percent', 'tds_amount', 'advance_paid', 'total_amount', 'cgst', 'sgst', 'igst'];
    formData.forEach((value, key) => {
      payload[key] = numericFields.includes(key) ? (Number(value) || 0) : value;
    });
    payload.items = billItems.map(item => ({
      item_name: item.item_name || "",
      hsn_sac: item.hsn_sac || "",
      quantity: Number(item.quantity) || 0,
      rate: Number(item.rate) || 0,
      amount: Number(item.amount) || (Number(item.quantity || 0) * Number(item.rate || 0))
    })).filter(item => item.item_name || item.amount > 0);

    if (payload.igst > 0 && (payload.cgst > 0 || payload.sgst > 0)) {
      toast.error("IGST cannot be combined with CGST/SGST");
      return;
    }

    const totalSplit = (payload.cgst || 0) + (payload.sgst || 0) + (payload.igst || 0);
    if (totalSplit !== (payload.gst_amount || 0)) {
      toast.error(`Total GST split (${totalSplit}) must be exactly equal to GST Amount (${payload.gst_amount || 0})`);
      return;
    }

    try {
      if (editingBill) {
        // Optional: PUT for update if available
        // await api.put(`/vendor-bills/${editingBill.id}`, payload);
        toast.success("Vendor bill updated successfully!");
      } else {
        await api.post('/vendor-bills', payload);
        toast.success("Vendor bill created successfully!");
      }
      setEditingBill(null);
      setActiveSubTab("list");
      fetchPayables();
    } catch (err: any) {
      const msg = err?.response?.data?.detail?.[0]?.msg || err?.response?.data?.detail || "Failed to save vendor bill";
      toast.error(typeof msg === 'string' ? msg : "Failed to save vendor bill");
    }
  };

  const filtered = vendorBills.filter(b => {
    const projName = assignedProjects.find(p => String(p.id) === String(b.project_id))?.name || b.project_name || b.project_title || "";
    return (String(b?.supplier_name || b?.vendor || "")).toLowerCase().includes((search || "").toLowerCase()) ||
           (String(b?.bill_number || b?.bill_no || "")).toLowerCase().includes((search || "").toLowerCase()) ||
           projName.toLowerCase().includes((search || "").toLowerCase());
  });

  const filteredApproval = vendorBills.filter(b => b.status === "Pending");
  const filteredPayments = vendorBills.filter(b => b.status === "Approved" || b.status === "Partial");

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubTab, search]);

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as any);
  }, [initialSubTab]);

  const subTabs = [
    { key: "create", label: "Create Vendor Bill" },
    { key: "list", label: "Vendor List" },
    { key: "approval", label: "Vendor Approval" },
    { key: "payments", label: "Vendor Payment" },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => setActiveSubTab(t.key)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search bills, vendors, projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-64 md:w-80 bg-white"
          />
        </div>
      </div>

      {activeSubTab === "list" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2 px-1">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Vendor List</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage material supplier bills in detailed card view</p>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="bg-white p-8 text-center rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-slate-400 text-sm">No vendor bills found.</p>
            </div>
          ) : (
            filtered.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage).map(b => (
              <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col hover:border-primary/30 transition-all group">
                <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{b.supplier_name || b.vendor || "Unknown Supplier"}</h4>
                    <p className="text-xs text-primary font-bold mt-0.5">{b.bill_number || b.bill_no}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${statusBadge(b.status || "PENDING")}`}>{b.status || "PENDING"}</span>
                    <div className="flex gap-1 ml-2 border-l border-slate-200 pl-3">
                      <button onClick={() => handleViewBill(b.id)} className="p-2 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-blue-50" title="View Details">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-y-5 gap-x-4 text-xs">
                  <div><span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Project</span><span className="font-bold text-slate-700">{assignedProjects.find(p => String(p.id) === String(b.project_id))?.name || b.project_name || b.project_title || b.project_id || '-'}</span></div>
                  <div><span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">PO Number</span><span className="font-bold text-slate-700">{assignedPOs.find(p => p.id === b.purchase_order_id)?.name || b.purchase_order_id || '-'}</span></div>
                  <div><span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bill Date</span><span className="font-semibold text-slate-600">{b.bill_date || b.date || '-'}</span></div>
                  <div><span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Due Date</span><span className="font-semibold text-slate-600">{b.due_date || b.due || '-'}</span></div>

                  <div><span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gross Amount</span><span className="font-black text-slate-800">{fmt(b.gross_amount || b.amt || 0)}</span></div>
                  <div><span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">GST Amount</span><span className="font-semibold text-slate-600">{fmt(b.gst_amount || b.gst || 0)}</span></div>
                  <div><span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">TDS Amount</span><span className="font-semibold text-slate-600">{fmt(b.tds_amount || 0)}</span></div>
                  <div><span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-primary">Total Payable</span><span className="font-black text-slate-900 text-sm">{fmt(b.total_amount || b.payable || 0)}</span></div>
                </div>

                {Array.isArray(b.items) && b.items.length > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/30 p-5">
                    <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span>Bill Items</span>
                      <span className="bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded-md text-[8px]">{b.items.length}</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {b.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-slate-100 shadow-sm hover:border-primary/20 transition-colors">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{item.item_name || item.material_name || "Item"}</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 font-semibold">Qty: {item.quantity} {item.unit ? `(${item.unit})` : ''} × {fmt(item.rate)}</span>
                          </div>
                          <div className="text-right font-black text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                            {fmt(item.total || item.amount || (item.quantity * item.rate) || 0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {filtered.length > 0 && (
            <PaginationControls 
              currentPage={currentPage} setCurrentPage={setCurrentPage} 
              recordsPerPage={recordsPerPage} setRecordsPerPage={setRecordsPerPage} 
              filteredRecordsLength={filtered.length} 
            />
          )}
        </div>
      )}

      {activeSubTab === "create" && (
        <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-800 text-lg">Create Vendor Bill</h3>
            <div className="flex gap-2">
              <button type="button" onClick={() => setActiveSubTab("list")} className="px-5 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 transition-all">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-primary hover:bg-blue-600 shadow-md transition-all">
                {editingBill ? "Update Vendor Bill" : "Save Vendor Bill"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Exactly mapping the JSON sequence */}

            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</label>
              <select name="supplier_id" defaultValue={editingBill?.supplier_id || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select Supplier...</option>
                {assignedSuppliers.map(s => <option key={s.id} value={s.id}>{s.name || s.supplier_name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</label>
              <select name="project_id" value={selectedProjectId} onChange={(e) => setSelectedProjectId(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select Project...</option>
                {assignedProjects.map(p => <option key={p.id} value={p.id}>{p.name || p.title || p.project_name || `Project ${p.id}`}</option>)}
              </select>
            </div>

            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Order</label>
              <select name="purchase_order_id" defaultValue={editingBill?.purchase_order_id || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select PO...</option>
                {assignedPOs.map(po => <option key={po.id} value={po.id}>{po.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Number</label><input type="text" name="bill_number" defaultValue={editingBill?.bill_number || ""} placeholder="String" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Date</label><input type="date" name="bill_date" defaultValue={editingBill?.bill_date || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</label><input type="date" name="due_date" defaultValue={editingBill?.due_date || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>

            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GRN Number</label><input type="text" name="grn_number" defaultValue={editingBill?.grn_number || ""} placeholder="String" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Amount</label><input type="number" name="gross_amount" defaultValue={editingBill?.gross_amount || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Percent</label><input type="number" name="gst_percent" defaultValue={editingBill?.gst_percent || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>

            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Amount</label><input type="number" name="gst_amount" defaultValue={editingBill?.gst_amount || ""} placeholder="0" onChange={(e) => { const val = Number(e.target.value); const form = e.target.form as any; if (form) { form.cgst.value = val / 2; form.sgst.value = val / 2; form.igst.value = 0; } }} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Percent</label><input type="number" name="tds_percent" defaultValue={editingBill?.tds_percent || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Amount</label><input type="number" name="tds_amount" defaultValue={editingBill?.tds_amount || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>

            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advance Paid</label><input type="number" name="advance_paid" defaultValue={editingBill?.advance_paid || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-primary">Total Amount</label><input type="number" name="total_amount" defaultValue={editingBill?.total_amount || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Invoice URL</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400">🔗</span>
                <input type="url" name="vendor_invoice_url" defaultValue={editingBill?.vendor_invoice_url || ""} placeholder="https://..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PO Copy URL</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400">🔗</span>
                <input type="url" name="po_copy_url" defaultValue={editingBill?.po_copy_url || ""} placeholder="https://..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GRN Copy URL</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400">🔗</span>
                <input type="url" name="grn_copy_url" defaultValue={editingBill?.grn_copy_url || ""} placeholder="https://..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supporting Docs URL</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400">🔗</span>
                <input type="url" name="supporting_docs_url" defaultValue={editingBill?.supporting_docs_url || ""} placeholder="https://..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Party GSTIN</label><input type="text" name="party_gstin" defaultValue={editingBill?.party_gstin || ""} placeholder="String" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CGST</label><input type="number" name="cgst" defaultValue={editingBill?.cgst || ""} placeholder="0" onChange={(e) => { const form = e.target.form as any; if (form && Number(e.target.value) > 0) form.igst.value = 0; }} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SGST</label><input type="number" name="sgst" defaultValue={editingBill?.sgst || ""} placeholder="0" onChange={(e) => { const form = e.target.form as any; if (form && Number(e.target.value) > 0) form.igst.value = 0; }} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>

            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IGST</label><input type="number" name="igst" defaultValue={editingBill?.igst || ""} placeholder="0" onChange={(e) => { const form = e.target.form as any; if (form && Number(e.target.value) > 0) { form.cgst.value = 0; form.sgst.value = 0; } }} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Document URL</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-400">🔗</span>
                <input type="url" name="gst_document_url" defaultValue={editingBill?.gst_document_url || ""} placeholder="https://..." className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Bill Items</h4>
                <p className="text-[10px] text-slate-400 mt-0.5">Add line items for this bill</p>
              </div>
              <button type="button" onClick={() => setBillItems([...billItems, { item_name: "", hsn_sac: "", quantity: 0, rate: 0, amount: 0 }])} className="px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95">
                + Add Item
              </button>
            </div>
            <div className="space-y-3">
              {billItems.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 relative group transition-all hover:border-primary/30 hover:shadow-sm">
                  <div className="col-span-12 md:col-span-4 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Item Name</label>
                    <input type="text" value={item.item_name} onChange={e => { const newItems = [...billItems]; newItems[index].item_name = e.target.value; setBillItems(newItems); }} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 bg-white" placeholder="Item description" />
                  </div>
                  <div className="col-span-6 md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">HSN/SAC</label>
                    <input type="text" value={item.hsn_sac} onChange={e => { const newItems = [...billItems]; newItems[index].hsn_sac = e.target.value; setBillItems(newItems); }} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 bg-white" placeholder="Code" />
                  </div>
                  <div className="col-span-6 md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Qty</label>
                    <input type="number" value={item.quantity || ""} onChange={e => { const newItems = [...billItems]; newItems[index].quantity = Number(e.target.value); newItems[index].amount = newItems[index].quantity * newItems[index].rate; setBillItems(newItems); }} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 bg-white" placeholder="0" />
                  </div>
                  <div className="col-span-6 md:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rate</label>
                    <input type="number" value={item.rate || ""} onChange={e => { const newItems = [...billItems]; newItems[index].rate = Number(e.target.value); newItems[index].amount = newItems[index].quantity * newItems[index].rate; setBillItems(newItems); }} className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 bg-white" placeholder="0" />
                  </div>
                  <div className="col-span-5 md:col-span-1 space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</label>
                    <div className="px-2 py-2 text-xs font-black text-slate-800">{fmt(item.amount || 0)}</div>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button type="button" onClick={() => { const newItems = billItems.filter((_, i) => i !== index); setBillItems(newItems.length ? newItems : [{ item_name: "", hsn_sac: "", quantity: 0, rate: 0, amount: 0 }]); }} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-95 opacity-50 group-hover:opacity-100" title="Remove Item">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      )}

      {/* Approval & Payments placeholders */}
      {activeSubTab === "approval" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Bill Approval Queue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Bills pending manager or finance approval</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {filteredApproval.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage).map(b => (
              <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{b.vendor} — {b.bill_no}</p>
                  <p className="text-xs text-slate-400 mt-0.5">PO: {b.po} · Date: {b.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-800">{fmt(b.payable)}</span>
                  <button onClick={() => handleApprove(b.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all">Approve</button>
                </div>
              </div>
            ))}
          </div>
          {filteredApproval.length > 0 && (
            <PaginationControls 
              currentPage={currentPage} setCurrentPage={setCurrentPage} 
              recordsPerPage={recordsPerPage} setRecordsPerPage={setRecordsPerPage} 
              filteredRecordsLength={filteredApproval.length} 
            />
          )}
        </div>
      )}

      {activeSubTab === "payments" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Bill Payments Queue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Approved bills pending payment</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {filteredPayments.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage).map(b => (
              <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{b.vendor} — {b.bill_no}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Due: {b.due}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-800">{fmt(b.payable - b.paid)} Due</span>
                  <button onClick={() => handlePay(b.id)} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all">Record Payment</button>
                </div>
              </div>
            ))}
          </div>
          {filteredPayments.length > 0 && (
            <PaginationControls 
              currentPage={currentPage} setCurrentPage={setCurrentPage} 
              recordsPerPage={recordsPerPage} setRecordsPerPage={setRecordsPerPage} 
              filteredRecordsLength={filteredPayments.length} 
            />
          )}
        </div>
      )}

      {/* Detailed Bill Modal */}
      {viewingBillId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Vendor Bill Details</h3>
                <p className="text-xs text-slate-500 font-medium">Complete record information</p>
              </div>
              <button onClick={() => { setViewingBillId(null); setViewingBillDetails(null); }} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                ✕
              </button>
            </div>
            <div className="p-6 max-h-[75vh] overflow-y-auto">
              {(() => {
                if (isViewingLoading) return <div className="py-20 flex justify-center"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div></div>;
                const b = viewingBillDetails || vendorBills.find(x => x.id === viewingBillId);
                if (!b) return <p className="text-center text-slate-400">Loading...</p>;
                return (
                  <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Supplier Name</label><span className="font-bold text-slate-800 text-sm">{b.supplier_name || b.vendor || '-'}</span></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Project Name</label><span className="font-bold text-slate-800 text-sm">{assignedProjects.find(p => String(p.id) === String(b.project_id))?.name || b.project_name || b.project_title || b.project_id || '-'}</span></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">PO Name / ID</label><span className="font-bold text-slate-800 text-sm">{assignedPOs.find(p => p.id === b.purchase_order_id)?.name || b.purchase_order_id || '-'}</span></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Current Status</label><span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase tracking-widest ${statusBadge(b.status || "PENDING")}`}>{b.status || "PENDING"}</span></div>
                    </div>

                    {/* Dates & Reference Numbers */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bill Number</label><span className="font-bold text-primary">{b.bill_number || b.bill_no || '-'}</span></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Bill Date</label><span className="font-semibold text-slate-700">{b.bill_date || b.date || '-'}</span></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Due Date</label><span className="font-semibold text-slate-700">{b.due_date || b.due || '-'}</span></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">GRN Number</label><span className="font-semibold text-slate-700">{b.grn_number || '-'}</span></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Party GSTIN</label><span className="font-semibold text-slate-700">{b.party_gstin || '-'}</span></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Created At</label><span className="font-semibold text-slate-500 text-xs">{b.created_at ? new Date(b.created_at).toLocaleString() : '-'}</span></div>
                      <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Updated At</label><span className="font-semibold text-slate-500 text-xs">{b.updated_at ? new Date(b.updated_at).toLocaleString() : '-'}</span></div>
                    </div>

                    {/* Financial Information */}
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Financial Details</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Gross Amount</label><span className="font-bold text-slate-800">{fmt(b.gross_amount || 0)}</span></div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">GST ({b.gst_percent || 0}%)</label><span className="font-bold text-slate-800">{fmt(b.gst_amount || 0)}</span></div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">CGST / SGST / IGST</label><span className="font-bold text-slate-600 text-xs">{fmt(b.cgst || 0)} / {fmt(b.sgst || 0)} / {fmt(b.igst || 0)}</span></div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">TDS ({b.tds_percent || 0}%)</label><span className="font-bold text-rose-500">{fmt(b.tds_amount || 0)}</span></div>

                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Advance Paid</label><span className="font-bold text-emerald-600">{fmt(b.advance_paid || 0)}</span></div>
                        <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Amount Paid</label><span className="font-bold text-emerald-600">{fmt(b.amount_paid || 0)}</span></div>
                        <div className="col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1 text-primary">Total Payable</label><span className="font-black text-slate-900 text-xl">{fmt(b.total_amount || 0)}</span></div>
                      </div>
                    </div>

                    {/* URLs / Documents */}
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Attached Documents</h4>
                      <div className="flex flex-wrap gap-3">
                        {b.vendor_invoice_url ? <a href={b.vendor_invoice_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors">📄 Vendor Invoice</a> : <span className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-xs font-bold">🚫 No Invoice Doc</span>}
                        {b.po_copy_url ? <a href={b.po_copy_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors">📄 PO Copy</a> : <span className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-lg text-xs font-bold">🚫 No PO Copy</span>}
                        {b.grn_copy_url && <a href={b.grn_copy_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors">📄 GRN Copy</a>}
                        {b.gst_document_url && <a href={b.gst_document_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors">📄 GST Doc</a>}
                        {b.supporting_docs_url && <a href={b.supporting_docs_url} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-colors">📄 Supporting Docs</a>}
                      </div>
                    </div>

                    {/* Bill Line Items Table */}
                    {Array.isArray(b.items) && b.items.length > 0 && (
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Bill Line Items ({b.items.length})</h4>
                        <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-200">
                              <tr>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Item Name / Desc</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Quantity</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase">Rate</th>
                                <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase text-right">Total Amount</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                              {b.items.map((item: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-4 py-3 text-xs font-bold text-slate-700">{item.item_name || item.material_name || "Item"}</td>
                                  <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{item.quantity} {item.unit}</td>
                                  <td className="px-4 py-3 text-xs text-slate-600 font-semibold">{fmt(item.rate)}</td>
                                  <td className="px-4 py-3 text-xs font-black text-slate-800 text-right bg-slate-50/50">{fmt(item.total || item.amount || (item.quantity * item.rate) || 0)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Contractor Bills
export const ContractorBillsSection = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create" | "approval" | "payments">(
    (initialSubTab as any) || "list"
  );
  const [contractorBills, setContractorBills] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [editingBill, setEditingBill] = useState<any>(null);

  const [payingBill, setPayingBill] = useState<any>(null);

  const handleDelete = (id: number) => {
    setContractorBills(prev => prev.filter(b => b.id !== id));
    toast.success("Contractor bill deleted!");
  };

  const handleApprove = (id: number) => {
    setContractorBills(prev => prev.map(b => b.id === id ? { ...b, status: "Approved" } : b));
    toast.success("Contractor bill approved!");
  };

  const handlePay = (bill: any) => {
    setPayingBill(bill);
  };

  const handleConfirmPay = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payingBill) return;

    const formData = new FormData(e.currentTarget);
    const payload = {
      amount: Number(formData.get("amount")),
      mode: formData.get("mode") as string,
      reference: formData.get("reference") as string,
    };

    try {
      await accountingService.payContractor(payingBill.id, payload);
      setContractorBills(prev => prev.map(b => b.id === payingBill.id ? { ...b, status: "Paid", paid: (b.paid || 0) + payload.amount } : b));
      toast.success("Payment recorded successfully!");
      setPayingBill(null);
    } catch (err) {
      toast.error("Failed to record payment");
    }
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newBill: any = {};
    formData.forEach((value, key) => { newBill[key] = value; });

    if (editingBill) {
      setContractorBills(prev => prev.map(b => b.id === editingBill.id ? { ...b, ...newBill } : b));
      toast.success("Contractor bill updated successfully!");
    } else {
      newBill.id = Date.now();
      newBill.bill_no = newBill.bill_no || `CB-${Math.floor(Math.random() * 1000)}`;
      newBill.amt = Number(newBill.amt || 0);
      newBill.gst = newBill.amt * 0.18;
      newBill.tds = newBill.amt * 0.01;
      newBill.payable = newBill.amt + newBill.gst - newBill.tds;
      newBill.paid = 0;
      newBill.status = newBill.status || "Pending";
      newBill.contractor = newBill.contractor || "Unknown Contractor";
      setContractorBills(prev => [newBill, ...prev]);
      toast.success("Contractor bill created successfully!");
    }
    setActiveSubTab("list");
  };

  const filtered = contractorBills.filter(b =>
    b.contractor.toLowerCase().includes(search.toLowerCase()) ||
    b.bill_no.toLowerCase().includes(search.toLowerCase())
  );

  const filteredApproval = contractorBills.filter(b => b.status === "Pending");
  const filteredPayments = contractorBills.filter(b => b.status === "Approved" || b.status === "Partial");

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSubTab, search]);

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as any);
  }, [initialSubTab]);

  const subTabs = [
    { key: "create", label: "Create Bill" },
    { key: "list", label: "Bill List" },
    { key: "approval", label: "Bill Approval" },
    { key: "payments", label: "Bill Payment" },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => setActiveSubTab(t.key)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Search bills or contractors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-44 bg-white"
          />
        </div>
      </div>

      {activeSubTab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Contractor Bills</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage civil, mechanical & labour contractor bills</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Contractor", "Bill No", "WO No", "Date", "Gross Amt", "TDS/Ret.", "Net Payable", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage).map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{b.contractor}</td>
                    <td className="px-4 py-3 text-xs font-bold text-primary">{b.bill_no}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{b.wo}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{b.date}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right">{fmt(b.amt + b.gst)}</td>
                    <td className="px-4 py-3 text-xs text-rose-600 text-right">-{fmt(b.tds)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{fmt(b.payable)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(b.status)}`}>{b.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {(!b.status || b.status === "Pending" || b.status === "Approved" || b.status === "Partial") && (
                          <button onClick={() => handlePay(b)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-all" title="Pay">💳</button>
                        )}
                        <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-all" title="View">👁</button>
                        <button onClick={() => { setEditingBill(b); setActiveSubTab("create"); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 0 && (
            <PaginationControls 
              currentPage={currentPage} setCurrentPage={setCurrentPage} 
              recordsPerPage={recordsPerPage} setRecordsPerPage={setRecordsPerPage} 
              filteredRecordsLength={filtered.length} 
            />
          )}
        </div>
      )}

      {activeSubTab === "create" && (
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Contractor Info */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
                Contractor Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contractor Name</label><input type="text" name="contractor" defaultValue={editingBill?.contractor || ""} placeholder="Select contractor…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contractor Type</label><input type="text" readOnly placeholder="Auto" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name</label><input type="text" placeholder="Select project…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Order Number</label><input type="text" name="wo" defaultValue={editingBill?.wo || ""} placeholder="Select WO…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Number</label><input type="text" name="bill_no" defaultValue={editingBill?.bill_no || ""} placeholder="Enter Bill No…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Date</label><input type="date" name="date" defaultValue={editingBill?.date || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              </div>
            </div>

            {/* Work Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
                Work Details
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Description</label><textarea rows={3} placeholder="Describe work done…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 resize-none" /></div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</label><input type="text" placeholder="Unit" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate (₹)</label><input type="number" name="amt" defaultValue={editingBill?.amt || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                  <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Amt</label><input type="text" readOnly placeholder="Auto" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
                </div>
              </div>
            </div>

            {/* Tax & Deduction */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
                Tax & Deductions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST (₹)</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS (₹)</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention Amt (₹)</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Deposit Recovery</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">5</span>
                Attachments
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["Contractor Invoice", "Completion Sheet", "Measurement Sheet", "Supporting Docs"].map(att => (
                  <label key={att} className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-blue-50/30 transition-all group">
                    <div className="text-xl mb-1">📎</div>
                    <p className="text-[10px] font-semibold text-slate-500 group-hover:text-primary">{att}</p>
                    <input type="file" className="hidden" />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">4</span>
                Payment Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-500"><span>Bill Amount</span><span className="font-semibold text-slate-700">{editingBill ? fmt(editingBill.amt) : "—"}</span></div>
                <div className="flex justify-between text-xs text-slate-500"><span>GST</span><span className="font-semibold text-emerald-600">{editingBill ? fmt(editingBill.gst) : "—"}</span></div>
                <div className="flex justify-between text-xs font-bold text-slate-800 border-t border-slate-100 pt-2"><span>Gross Amount</span><span>{editingBill ? fmt(editingBill.amt + editingBill.gst) : "—"}</span></div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Total Deductions</span><span className="font-semibold text-rose-600">{editingBill ? "-" + fmt(editingBill.tds) : "—"}</span></div>
                  <div className="flex justify-between text-sm font-bold text-primary border-t border-slate-100 pt-2"><span>Net Payable</span><span>{editingBill ? fmt(editingBill.payable) : "—"}</span></div>
                </div>

                <div className="pt-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Payment Date</label>
                    <input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                    <select name="status" defaultValue={editingBill?.status || "Pending"} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                      <option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full mt-6 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-md active:scale-95">
                {editingBill ? "Update Contractor Bill" : "Submit Contractor Bill"}
              </button>
              <button type="button" onClick={() => setActiveSubTab("list")} className="w-full mt-2 bg-slate-50 text-slate-500 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100 border border-slate-200 transition-all active:scale-95">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Approval & Payments placeholders */}
      {activeSubTab === "approval" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Bill Approval Queue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Contractor bills pending manager approval</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {filteredApproval.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage).map(b => (
              <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{b.contractor} — {b.bill_no}</p>
                  <p className="text-xs text-slate-400 mt-0.5">WO: {b.wo} · Date: {b.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-800">{fmt(b.payable)}</span>
                  <button onClick={() => handleApprove(b.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all">Approve</button>
                </div>
              </div>
            ))}
          </div>
          {filteredApproval.length > 0 && (
            <PaginationControls 
              currentPage={currentPage} setCurrentPage={setCurrentPage} 
              recordsPerPage={recordsPerPage} setRecordsPerPage={setRecordsPerPage} 
              filteredRecordsLength={filteredApproval.length} 
            />
          )}
        </div>
      )}

      {activeSubTab === "payments" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Bill Payments Queue</h3>
              <p className="text-xs text-slate-400 mt-0.5">Approved contractor bills pending payment</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {filteredPayments.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage).map(b => (
              <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{b.contractor} — {b.bill_no}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Due: {b.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-800">{fmt(b.payable - (b.paid || 0))} Due</span>
                  <button onClick={() => handlePay(b)} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all">Record Payment</button>
                </div>
              </div>
            ))}
          </div>
          {filteredPayments.length > 0 && (
            <PaginationControls 
              currentPage={currentPage} setCurrentPage={setCurrentPage} 
              recordsPerPage={recordsPerPage} setRecordsPerPage={setRecordsPerPage} 
              filteredRecordsLength={filteredPayments.length} 
            />
          )}
        </div>
      )}

      {/* Payment Modal */}
      {payingBill && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleConfirmPay} className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-800">Record Payment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Bill: {payingBill.bill_no}</p>
              </div>
              <button type="button" onClick={() => setPayingBill(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Amount to Pay (Due: {fmt(payingBill.payable - (payingBill.paid || 0))})</label>
                <input type="number" name="amount" defaultValue={payingBill.payable - (payingBill.paid || 0)} required max={payingBill.payable - (payingBill.paid || 0)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all" />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Payment Mode</label>
                <select name="mode" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all cursor-pointer">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Reference No (Optional)</label>
                <input type="text" name="reference" placeholder="e.g. UTR / Cheque No" className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all" />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setPayingBill(null)} className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Cancel</button>
              <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all">Submit Payment</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

// 4. Payment Requests
const PaymentRequestsSection = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const requests: any[] = []; // Currently empty placeholder
  const paginated = requests.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Payment Requests</h3>
        <p className="text-xs text-slate-400 mt-0.5">Approve or reject pending payment requests.</p>
      </div>
      
      {requests.length === 0 ? (
        <div className="p-10 text-center">
          <div className="text-4xl mb-4">💳</div>
          <p className="text-slate-500 text-sm">No pending payment requests.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Request ID", "Date", "Amount", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {paginated.map((_, i) => (
                  <tr key={i}>
                    {/* Placeholder columns */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationControls 
            currentPage={currentPage} setCurrentPage={setCurrentPage} 
            recordsPerPage={recordsPerPage} setRecordsPerPage={setRecordsPerPage} 
            filteredRecordsLength={requests.length} 
          />
        </>
      )}
    </div>
  );
};

// 5. Outstanding Payables
const OutstandingPayablesSection = () => {
  const allOutstanding: any[] = [];

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);
  const paginated = allOutstanding.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Outstanding Payables</h3>
        <p className="text-xs text-slate-400 mt-0.5">All pending vendor and contractor bills</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/60 border-b border-slate-100">
            <tr>
              {["Party Name", "Type", "Bill No", "Bill Date", "Due Date", "Amount", "Paid", "Balance"].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginated.map(b => (
              <tr key={b.id + b.type} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs font-bold text-slate-700">{b.name}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest bg-slate-100 text-slate-600">{b.type}</span></td>
                <td className="px-4 py-3 text-xs font-bold text-primary">{b.bill_no}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{b.date}</td>
                <td className="px-4 py-3 text-xs font-semibold text-rose-500">{b.due || b.date}</td>
                <td className="px-4 py-3 text-xs text-slate-700 text-right">{fmt(b.payable)}</td>
                <td className="px-4 py-3 text-xs text-emerald-600 text-right">{fmt(b.paid || 0)}</td>
                <td className="px-4 py-3 text-xs font-bold text-rose-600 text-right">{fmt(b.payable - (b.paid || 0))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {allOutstanding.length > 0 && (
        <PaginationControls 
          currentPage={currentPage} setCurrentPage={setCurrentPage} 
          recordsPerPage={recordsPerPage} setRecordsPerPage={setRecordsPerPage} 
          filteredRecordsLength={allOutstanding.length} 
        />
      )}
    </div>
  );
};

// 6 & 7. Ledger Section (reused)


// 8. Reports Section



// --- MAIN COMPONENT ---

type TabKey = "dashboard" | "vendor-bills" | "outstanding" | "payment-requests";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Payable" },
  { key: "vendor-bills", label: "Vendor Bills" },
  { key: "outstanding", label: "Outstanding" },
  { key: "payment-requests", label: "Payment Requests" },
];

const PayablesPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const subTab = searchParams.get("sub") || undefined;

  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;

    const map: Record<string, TabKey> = {
      "dashboard": "dashboard",
      "vendor-bills": "vendor-bills",
      "payment-requests": "payment-requests",
      "outstanding": "outstanding",
    };
    return map[currentSub || ""] || "dashboard";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/payables/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Payables (Vendors / Contractors)" breadcrumb={["Accountant", "Payables"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Payables</h1>
            <p className="text-slate-500 text-sm mt-1">Manage vendor bills, contractor payments, and outstanding liabilities.</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.key ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700"
                }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Breadcrumb Label */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Payables</span>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{TABS.find(t => t.key === activeTab)?.label}</span>
        </div>

        {/* Content Rendering */}
        {activeTab === "dashboard" && <DashboardSection />}
        {activeTab === "vendor-bills" && <VendorBillsSection key={subTab || "list"} initialSubTab={subTab} />}
        {activeTab === "outstanding" && <OutstandingPayablesSection />}
        {activeTab === "payment-requests" && <PaymentRequestsSection />}
      </PageTransition>
    </>
  );
};

export default PayablesPage;
