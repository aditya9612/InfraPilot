import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";
import { accountingService } from "../../services/accountingService";


// --- MOCK DATA ---
const fmt = (num: number) => `₹${(Number(num) || 0).toLocaleString("en-IN")}`;
const statusBadge = (s: string) => {
  if (s === "Paid" || s === "Approved") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (s === "Partial" || s === "Pending") return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-rose-100 text-rose-700 border border-rose-200";
};

const MOCK_VENDOR_BILLS = [
  { id: 1, vendor: "Mahaveer Cements", bill_no: "BILL/24/401", po: "PO-2024-001", date: "2024-04-01", due: "2024-04-10", amt: 190000, gst: 34200, payable: 224200, paid: 224200, status: "Paid" },
  { id: 2, vendor: "TATA Steel Dist.", bill_no: "TATA/FE/109", po: "PO-2024-005", date: "2024-04-05", due: "2024-04-15", amt: 310000, gst: 55800, payable: 365800, paid: 165800, status: "Partial" },
  { id: 3, vendor: "Shree Bricks", bill_no: "SB-102", po: "PO-2024-012", date: "2024-04-20", due: "2024-05-05", amt: 85000, gst: 4250, payable: 89250, paid: 0, status: "Pending" },
];

const MOCK_CONTRACTOR_BILLS = [
  { id: 1, contractor: "Ganesh Earthmovers", bill_no: "EXP/MAR/022", wo: "WO-24-01", date: "2024-03-20", due: "2024-03-25", amt: 450000, gst: 81000, tds: 4500, payable: 526500, paid: 526500, status: "Paid" },
  { id: 2, contractor: "Apex Civil Works", bill_no: "ACW/005", wo: "WO-24-05", date: "2024-04-10", due: "2024-04-20", amt: 1200000, gst: 216000, tds: 12000, payable: 1404000, paid: 0, status: "Pending" },
  { id: 3, contractor: "Skyline Electricals", bill_no: "SE/RA-1", wo: "WO-24-12", date: "2024-04-15", due: "2024-04-25", amt: 350000, gst: 63000, tds: 3500, payable: 409500, paid: 0, status: "Pending" },
];



// --- SECTIONS ---

// 1. Dashboard
const DashboardSection = () => {
  const [summary, setSummary] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [dateRangePayables, setDateRangePayables] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    accountingService.getPayablesSummary().then(setSummary).catch(() => { });
  }, []);

  const handleFetchDateRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateRange.start || !dateRange.end) return toast.error("Select both start and end dates");
    setIsLoading(true);
    try {
      const res = await accountingService.getPayablesByDateRange(dateRange.start, dateRange.end);
      setDateRangePayables(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      toast.error("Failed to fetch payables by date");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Outstanding</p>
            <p className="text-2xl font-black text-slate-800">{summary?.total_outstanding ? fmt(summary.total_outstanding) : "₹ 0"}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 text-xl">📉</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Approvals</p>
            <p className="text-2xl font-black text-slate-800">{summary?.pending_approvals || "0"}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 text-xl">⏳</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Paid (This Month)</p>
            <p className="text-2xl font-black text-slate-800">{summary?.total_paid ? fmt(summary.total_paid) : "₹ 0"}</p>
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
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Bill No", "Date", "Due", "Amount", "Status"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {dateRangePayables.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-primary">{b.bill_no}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{b.date}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{b.due || "—"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{fmt(b.payable || b.amount || 0)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(b.status || "Pending")}`}>{b.status || "Pending"}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">No payables found in this date range. Select dates and search.</div>
        )}
      </div>
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

  const fetchPayables = async () => {
    try {
      const data = await accountingService.getPayables();
      setVendorBills(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to fetch payables");
    }
  };

  useEffect(() => {
    if (activeSubTab === "list" || activeSubTab === "approval" || activeSubTab === "payments") {
      fetchPayables();
    }
  }, [activeSubTab]);

  const handleDelete = (id: number) => {
    setVendorBills(prev => prev.filter(b => b.id !== id));
    toast.success("Vendor bill deleted!");
  };

  const handleApprove = (id: number) => {
    setVendorBills(prev => prev.map(b => b.id === id ? { ...b, status: "Approved" } : b));
    toast.success("Vendor bill approved!");
  };

  const handlePay = (id: number) => {
    setVendorBills(prev => prev.map(b => b.id === id ? { ...b, status: "Paid", paid: b.payable } : b));
    toast.success("Payment recorded!");
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newBill: any = {};
    formData.forEach((value, key) => { newBill[key] = value; });

    if (editingBill) {
      setVendorBills(prev => prev.map(b => b.id === editingBill.id ? { ...b, ...newBill } : b));
      toast.success("Vendor bill updated successfully!");
    } else {
      newBill.id = Date.now();
      newBill.bill_no = newBill.bill_no || `VB-${Math.floor(Math.random() * 1000)}`;
      newBill.amt = Number(newBill.amt || 0);
      newBill.gst = newBill.amt * 0.18;
      newBill.payable = newBill.amt + newBill.gst;
      newBill.paid = 0;
      newBill.status = newBill.status || "Pending";
      newBill.vendor = newBill.vendor || "Unknown Vendor";
      setVendorBills(prev => [newBill, ...prev]);
      toast.success("Vendor bill created successfully!");
    }
    setActiveSubTab("list");
  };

  const filtered = vendorBills.filter(b =>
    (b?.vendor || "").toLowerCase().includes((search || "").toLowerCase()) ||
    (b?.bill_no || "").toLowerCase().includes((search || "").toLowerCase())
  );

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
            placeholder="Search bills or vendors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-44 bg-white"
          />
        </div>
      </div>

      {activeSubTab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Vendor Bills</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage material supplier bills</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Vendor", "Bill No", "PO No", "Date", "Due", "Amount", "GST", "Total", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{b.vendor}</td>
                    <td className="px-4 py-3 text-xs font-bold text-primary">{b.bill_no}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{b.po}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{b.date}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{b.due}</td>
                    <td className="px-4 py-3 text-xs text-slate-700 text-right">{fmt(b.amt)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 text-right">{fmt(b.gst)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{fmt(b.payable)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(b.status)}`}>{b.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-primary transition-all" title="View">👁</button>
                        <button onClick={() => { setEditingBill(b); setActiveSubTab("create"); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="Delete">🗑</button>
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
          <div className="lg:col-span-2 space-y-5">
            {/* Vendor Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
                Vendor Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Name</label><input type="text" name="vendor" defaultValue={editingBill?.vendor || ""} placeholder="Select vendor…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor Code</label><input type="text" placeholder="Auto" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GSTIN</label><input type="text" placeholder="Auto" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact / Mobile</label><input type="text" placeholder="Auto" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed" /></div>
              </div>
            </div>

            {/* Bill Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
                Bill Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Number</label><input type="text" name="bill_no" defaultValue={editingBill?.bill_no || ""} placeholder="Enter vendor bill no." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Purchase Order</label><input type="text" name="po" defaultValue={editingBill?.po || ""} placeholder="Select PO…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Date</label><input type="date" name="date" defaultValue={editingBill?.date || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Due Date</label><input type="date" name="due" defaultValue={editingBill?.due || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
                <div className="space-y-1.5 col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GRN Number</label><input type="text" placeholder="Select GRN…" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 outline-none focus:ring-2 focus:ring-primary/20" /></div>
              </div>
            </div>

            {/* Material Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
                Material Details
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5 col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Material</label><input type="text" placeholder="Material Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label><input type="text" placeholder="Cat" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</label><input type="text" placeholder="Unit" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate (₹)</label><input type="number" name="amt" defaultValue={editingBill?.amt || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700" /></div>
                <div className="space-y-1.5 col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</label><input type="text" readOnly placeholder="Auto" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-400" /></div>
              </div>
            </div>

            {/* Tax Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">4</span>
                Tax Details
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST (%)</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Amt</label><input type="number" readOnly placeholder="Auto" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS (%)</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS Amt</label><input type="number" readOnly placeholder="Auto" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">6</span>
                Attachments
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["Vendor Invoice", "PO Copy", "GRN Copy", "Supporting Docs"].map(att => (
                  <label key={att} className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-blue-50/30 transition-all group">
                    <div className="text-xl mb-1">📎</div>
                    <p className="text-[10px] font-semibold text-slate-500 group-hover:text-primary">{att}</p>
                    <input type="file" className="hidden" />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Summary */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">5</span>
                Payment Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-500"><span>Gross Amount</span><span className="font-semibold text-slate-700">{editingBill ? fmt(editingBill.amt) : "—"}</span></div>
                <div className="flex justify-between text-xs text-slate-500"><span>GST</span><span className="font-semibold text-emerald-600">{editingBill ? fmt(editingBill.gst) : "—"}</span></div>
                <div className="flex justify-between text-xs text-slate-500"><span>TDS</span><span className="font-semibold text-rose-600">—</span></div>
                <div className="flex justify-between text-xs font-bold text-slate-800 border-t border-slate-100 pt-2"><span>Payable Amount</span><span>{editingBill ? fmt(editingBill.payable) : "—"}</span></div>

                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-2"><span>Advance Paid</span><span className="font-semibold text-slate-700">{editingBill ? fmt(editingBill.paid) : "—"}</span></div>
                  <div className="flex justify-between text-sm font-bold text-primary border-t border-slate-100 pt-2"><span>Balance Amount</span><span>{editingBill ? fmt(editingBill.payable - editingBill.paid) : "—"}</span></div>
                </div>

                <div className="pt-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                  <select name="status" defaultValue={editingBill?.status || "Pending"} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="Pending">Pending</option><option value="Partial">Partial</option><option value="Paid">Paid</option><option value="Approved">Approved</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full mt-6 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-md active:scale-95">
                {editingBill ? "Update Vendor Bill" : "Save Vendor Bill"}
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
              <p className="text-xs text-slate-400 mt-0.5">Bills pending manager or finance approval</p>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {vendorBills.filter(b => b.status === "Pending").map(b => (
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
            {vendorBills.filter(b => b.status === "Approved" || b.status === "Partial").map(b => (
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
  const [contractorBills, setContractorBills] = useState<any[]>(MOCK_CONTRACTOR_BILLS);
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
                {filtered.map(b => (
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
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-primary transition-all" title="View">👁</button>
                        <button onClick={() => { setEditingBill(b); setActiveSubTab("create"); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="Delete">🗑</button>
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
            {contractorBills.filter(b => b.status === "Pending").map(b => (
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
            {contractorBills.filter(b => b.status === "Approved" || b.status === "Partial").map(b => (
              <div key={b.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{b.contractor} — {b.bill_no}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Due: {b.due || b.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-800">{fmt(b.payable - (b.paid || 0))} Due</span>
                  <button onClick={() => handlePay(b)} className="px-3 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-all">Record Payment</button>
                </div>
              </div>
            ))}
          </div>
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
const PaymentRequestsSection = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
    <div className="text-4xl mb-4">💳</div><h3 className="text-lg font-bold text-slate-800">Payment Requests</h3>
    <p className="text-slate-500 text-sm mt-1">Approve or reject pending payment requests.</p>
  </div>
);

// 5. Outstanding Payables
const OutstandingPayablesSection = () => (
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
          {[...MOCK_VENDOR_BILLS.map(b => ({ ...b, name: b.vendor, type: "Vendor" })), ...MOCK_CONTRACTOR_BILLS.map(b => ({ ...b, name: b.contractor, type: "Contractor" }))]
            .filter(b => b.payable > b.paid)
            .map(b => (
              <tr key={b.id + b.type} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs font-bold text-slate-700">{b.name}</td>
                <td className="px-4 py-3"><span className="px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest bg-slate-100 text-slate-600">{b.type}</span></td>
                <td className="px-4 py-3 text-xs font-bold text-primary">{b.bill_no}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{b.date}</td>
                <td className="px-4 py-3 text-xs font-semibold text-rose-500">{b.due}</td>
                <td className="px-4 py-3 text-xs text-slate-700 text-right">{fmt(b.payable)}</td>
                <td className="px-4 py-3 text-xs text-emerald-600 text-right">{fmt(b.paid)}</td>
                <td className="px-4 py-3 text-xs font-bold text-rose-600 text-right">{fmt(b.payable - b.paid)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  </div>
);

// 6 & 7. Ledger Section (reused)


// 8. Reports Section



// --- MAIN COMPONENT ---

type TabKey = "dashboard" | "vendor-bills" | "outstanding" | "payment-requests";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
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
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📥</span> Import
            </button>
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📤</span> Export
            </button>
            <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
              <span className="text-base leading-none">+</span> New Payable
            </button>
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
