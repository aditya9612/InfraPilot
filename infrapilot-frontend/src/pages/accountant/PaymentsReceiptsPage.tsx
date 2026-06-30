import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";
// --- MOCK DATA ---



const PETTY_CASH_CATEGORIES = ["Tea Expenses", "Diesel", "Site Travel", "Local Material Purchase", "Stationery", "Miscellaneous"];
const PARTY_TYPES = ["Material Supplier", "Contractor", "Labor", "Staff", "Equipment Owner", "Land Owner", "Legal Entity"];

// --- SECTIONS ---



const MOCK_RECEIPTS = [
  { id: "REC-105", date: "2024-05-15", party: "Apex Developers", type: "RA Bill Collection", amount: 1500000, mode: "Bank Transfer", status: "Cheque Clearing", invoice: "RA-BILL-009" },
  { id: "REC-106", date: "2024-05-16", party: "Skyline Towers", type: "Advance", amount: 500000, mode: "RTGS", status: "Cleared", invoice: "INV-2024-045" }
];

const MOCK_PAYMENTS = [
  { id: "PAY-209", date: "2024-05-14", party: "UltraTech Cement", type: "Vendor Payment", amount: 550000, mode: "Bank Transfer", status: "Pending" },
  { id: "PAY-210", date: "2024-05-16", party: "Ramesh Labor Contractor", type: "Contractor Payment", amount: 220000, mode: "Cheque", status: "Paid" }
];

// 2. Receipts Section (Receive Payment)
const ReceiptsSection = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create" | "approval">(
    (initialSubTab as any) || "create"
  );
  
  const [receipts, setReceipts] = useState<any[]>(MOCK_RECEIPTS);
  const [search, setSearch] = useState("");
  const [editingReceipt, setEditingReceipt] = useState<any>(null);

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as any);
  }, [initialSubTab]);

  const handleDelete = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
    toast.success("Receipt deleted!");
  };

  const handleApprove = (id: string) => {
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: "Cleared" } : r));
    toast.success("Receipt cleared!");
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRec: any = {};
    formData.forEach((value, key) => { newRec[key] = value; });

    if (editingReceipt) {
      setReceipts(prev => prev.map(r => r.id === editingReceipt.id ? { ...r, ...newRec, amount: Number(newRec.amount || 0) } : r));
      toast.success("Receipt updated!");
    } else {
      newRec.id = `REC-${Math.floor(Math.random() * 1000)}`;
      newRec.amount = Number(newRec.amount || 0);
      newRec.status = newRec.status || "Pending";
      newRec.type = newRec.type || "Collection";
      setReceipts(prev => [newRec, ...prev]);
      toast.success("Receipt recorded!");
    }
    setActiveSubTab("list");
  };

  const filtered = receipts.filter(r => 
    (r.party?.toLowerCase() || "").includes(search.toLowerCase()) || 
    (r.id?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const subTabs = [
    { key: "create", label: "Record Receipt" },
    { key: "list", label: "Receipts List" },
    { key: "approval", label: "Clearance" },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => setActiveSubTab(t.key)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            placeholder="Search receipts..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 w-44 bg-white" 
          />
        </div>
      </div>

      {activeSubTab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Cash & Bank Receipts</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage all incoming payments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Date", "Receipt No", "Party", "Type", "Amount", "Mode", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">{r.date}</td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-600">{r.id}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{r.party}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{r.type}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">₹{r.amount?.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{r.mode}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest bg-slate-100 text-slate-600`}>{r.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-all" title="View">👁</button>
                        <button onClick={() => { setEditingReceipt(r); setActiveSubTab("create"); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="Delete">🗑</button>
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
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
                Client & Invoice Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt Number *</label><input type="text" placeholder="Auto" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-400" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Receipt Date *</label><input type="date" name="date" defaultValue={editingReceipt?.date || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Name *</label><input type="text" name="party" defaultValue={editingReceipt?.party || ""} placeholder="Select client" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name *</label><input type="text" placeholder="Select project" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Invoice / RA Bill *</label>
                  <select name="invoice" defaultValue={editingReceipt?.invoice || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="">Select Pending Invoice...</option>
                    <option value="INV-2024-045">INV-2024-045</option>
                    <option value="RA-BILL-009">RA-BILL-009</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-500 text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
                Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount Received (₹) *</label><input type="number" name="amount" defaultValue={editingReceipt?.amount || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold text-emerald-600" /></div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode *</label>
                  <select name="mode" defaultValue={editingReceipt?.mode || "Bank Transfer"} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="Bank Transfer">Bank Transfer</option><option value="RTGS">RTGS</option><option value="NEFT">NEFT</option><option value="Cheque">Cheque</option><option value="UPI">UPI</option><option value="Cash">Cash</option>
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference / UTR Number</label><input type="text" placeholder="Ref No." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Received In Bank Account *</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option>HDFC Bank - Current A/c - 1234</option><option>SBI Bank - Escrow A/c - 5678</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label><textarea rows={2} placeholder="Any notes..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 resize-none" /></div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Attachments</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {["Payment Receipt", "Bank Screenshot", "Supporting Docs"].map(att => (
                  <label key={att} className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-emerald-500/40 hover:bg-emerald-50/30 transition-all group">
                    <div className="text-xl mb-1">📎</div>
                    <p className="text-[10px] font-semibold text-slate-500 group-hover:text-emerald-600">{att}</p>
                    <input type="file" className="hidden" />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5">Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-500"><span>Pending Invoice Amount</span><span className="font-semibold text-slate-700">—</span></div>
                <div className="flex justify-between text-sm font-bold text-emerald-600 border-t border-slate-100 pt-3"><span>Receipt Amount</span><span>{editingReceipt ? `₹${editingReceipt.amount}` : "—"}</span></div>
                <div className="flex justify-between text-xs font-semibold text-amber-500 mt-2"><span>Remaining Balance</span><span>—</span></div>
                <div className="pt-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                  <select name="status" defaultValue={editingReceipt?.status || "Pending"} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="Pending">Pending</option><option value="Cleared">Cleared</option><option value="Cheque Clearing">Cheque Clearing</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full mt-6 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-md active:scale-95">
                {editingReceipt ? "Update Receipt" : "Record Receipt"}
              </button>
              <button type="button" onClick={() => setActiveSubTab("list")} className="w-full mt-2 bg-slate-50 text-slate-500 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100 border border-slate-200 transition-all active:scale-95">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {activeSubTab === "approval" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Clearance Queue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Approve and clear pending receipts / cheques</p>
          </div>
          <div className="divide-y divide-slate-50">
            {receipts.filter(r => r.status !== "Cleared").map(r => (
              <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{r.party} — {r.id}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{r.mode} · Date: {r.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-emerald-600">₹{r.amount?.toLocaleString("en-IN")}</span>
                  <button onClick={() => handleApprove(r.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all">Clear Receipt</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Payments Section (Make Payment)
// 3. Payments Section (Make Payment)
const PaymentsSection = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create" | "approval">(
    (initialSubTab as any) || "create"
  );
  
  const [payments, setPayments] = useState<any[]>(MOCK_PAYMENTS);
  const [search, setSearch] = useState("");
  const [editingPayment, setEditingPayment] = useState<any>(null);

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as any);
  }, [initialSubTab]);

  const handleDelete = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    toast.success("Payment voucher deleted!");
  };

  const handleApprove = (id: string) => {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: "Paid" } : p));
    toast.success("Payment approved!");
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPay: any = {};
    formData.forEach((value, key) => { newPay[key] = value; });

    if (editingPayment) {
      setPayments(prev => prev.map(p => p.id === editingPayment.id ? { ...p, ...newPay, amount: Number(newPay.amount || 0) } : p));
      toast.success("Payment updated!");
    } else {
      newPay.id = `PAY-${Math.floor(Math.random() * 1000)}`;
      newPay.amount = Number(newPay.amount || 0);
      newPay.status = newPay.status || "Pending";
      newPay.type = newPay.type || "Vendor Payment";
      setPayments(prev => [newPay, ...prev]);
      toast.success("Payment voucher submitted!");
    }
    setActiveSubTab("list");
  };

  const filtered = payments.filter(p => 
    (p.party?.toLowerCase() || "").includes(search.toLowerCase()) || 
    (p.id?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const subTabs = [
    { key: "create", label: "Make Payment" },
    { key: "list", label: "Payments List" },
    { key: "approval", label: "Clearance" },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => setActiveSubTab(t.key)}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="text" 
            placeholder="Search payments..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-rose-500/20 w-44 bg-white" 
          />
        </div>
      </div>

      {activeSubTab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Cash & Bank Payments</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage all outgoing payments</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Date", "Payment No", "Party", "Type", "Amount", "Mode", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">{p.date}</td>
                    <td className="px-4 py-3 text-xs font-bold text-rose-600">{p.id}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700">{p.party}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{p.type}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">₹{p.amount?.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{p.mode}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest bg-slate-100 text-slate-600`}>{p.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="View">👁</button>
                        <button onClick={() => { setEditingPayment(p); setActiveSubTab("create"); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="Delete">🗑</button>
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
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
                Vendor / Contractor Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Voucher Number *</label><input type="text" placeholder="Auto" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-400" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date *</label><input type="date" name="date" defaultValue={editingPayment?.date || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Party Type *</label>
                  <select name="type" defaultValue={editingPayment?.type || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="">Select Type...</option>
                    {PARTY_TYPES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor / Contractor Name *</label><input type="text" name="party" defaultValue={editingPayment?.party || ""} placeholder="Select Party" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Linked Bill (Optional)</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option>Select Pending Bill...</option>
                    <option>BILL-VEN-102 (₹2,50,000 pending)</option>
                    <option>BILL-CON-045 (₹10,00,000 pending)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-500 text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
                Payment Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Amount (Base) *</label><input type="number" name="amount" defaultValue={editingPayment?.amount || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Deduction</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS / Retention Deduction</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-rose-500" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Payable Amount *</label><input type="number" placeholder="0" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-bold text-rose-600" /></div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode *</label>
                  <select name="mode" defaultValue={editingPayment?.mode || "Bank Transfer"} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="Bank Transfer">Bank Transfer</option><option value="RTGS">RTGS</option><option value="NEFT">NEFT</option><option value="Cheque">Cheque</option><option value="Cash">Cash</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pay From Bank Account *</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option>HDFC Bank - Current A/c - 1234</option><option>SBI Bank - Escrow A/c - 5678</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference Number / Remarks</label><input type="text" placeholder="Ref No." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5">Payment Workflow</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-500"><span>Base Amount</span><span className="font-semibold text-slate-700">{editingPayment ? `₹${editingPayment.amount}` : "—"}</span></div>
                <div className="flex justify-between text-xs text-rose-500"><span>Deductions</span><span className="font-semibold">—</span></div>
                <div className="flex justify-between text-sm font-bold text-rose-600 border-t border-slate-100 pt-3"><span>Net Payment</span><span>{editingPayment ? `₹${editingPayment.amount}` : "—"}</span></div>
              </div>
              <div className="mt-5 space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Status *</label>
                <select name="status" defaultValue={editingPayment?.status || "Pending"} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-semibold text-amber-600">
                  <option value="Pending">Pending</option><option value="Processed">Processed</option><option value="Paid">Paid</option><option value="Failed">Failed</option><option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <button type="submit" className="w-full mt-6 bg-rose-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-rose-600 transition-all shadow-md active:scale-95">
                {editingPayment ? "Update Voucher" : "Submit Payment Voucher"}
              </button>
              <button type="button" onClick={() => setActiveSubTab("list")} className="w-full mt-2 bg-slate-50 text-slate-500 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100 border border-slate-200 transition-all active:scale-95">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {activeSubTab === "approval" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Payment Approval Queue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Approve and process outgoing payments</p>
          </div>
          <div className="divide-y divide-slate-50">
            {payments.filter(p => p.status !== "Paid").map(p => (
              <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{p.party} — {p.id}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.type} · Date: {p.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-rose-600">₹{p.amount?.toLocaleString("en-IN")}</span>
                  <button onClick={() => handleApprove(p.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all">Approve Payment</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Petty Cash Section
const PettyCashSection = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
      <div>
        <h3 className="font-bold text-slate-800">Petty Cash Management</h3>
        <p className="text-xs text-slate-500 mt-0.5">Record daily cash in / out for minor site expenses</p>
      </div>
      <div className="text-right">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Balance</p>
        <p className="text-xl font-black text-indigo-600">₹24,500</p>
      </div>
    </div>
    <div className="p-6 border-b border-slate-100 bg-white">
      <h4 className="text-sm font-bold text-slate-800 mb-4">Record New Transaction</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-end">
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option>Cash Out (Expense)</option><option>Cash In (Top-up)</option></select></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label><input type="date" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label><select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50"><option value="">Select...</option>{PETTY_CASH_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-bold" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid To / Received From</label><input type="text" placeholder="Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approved By</label><input type="text" placeholder="Manager Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks</label><input type="text" placeholder="Description..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
      </div>
      <div className="mt-5 flex justify-end">
        <button onClick={() => toast.success("Petty Cash transaction added")} className="bg-indigo-500 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-indigo-600 transition-all">Save Transaction</button>
      </div>
    </div>
    <div className="overflow-x-auto p-0">
      <table className="w-full text-left">
        <thead className="bg-slate-50/60 border-b border-slate-100">
          <tr>
            {["Voucher No", "Date", "Category", "Remarks", "Paid To", "Cash In", "Cash Out", "Balance"].map(h => (
              <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          <tr className="hover:bg-slate-50/50 transition-colors">
            <td className="px-4 py-3 text-xs font-bold text-slate-600">PC-1001</td>
            <td className="px-4 py-3 text-xs text-slate-500">2024-05-15</td>
            <td className="px-4 py-3 text-xs font-semibold text-slate-700">Site Travel</td>
            <td className="px-4 py-3 text-xs text-slate-500">Taxi for site visit</td>
            <td className="px-4 py-3 text-xs text-slate-600">Amit Singh</td>
            <td className="px-4 py-3 text-xs text-emerald-600 text-right">—</td>
            <td className="px-4 py-3 text-xs text-rose-600 text-right font-bold">₹1,500</td>
            <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹24,500</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);



// 6. Bank Transactions
const BankTransactionsSection = () => {
  const [activeSubTab, setActiveSubTab] = useState("deposits");
  const subTabs = [
    { key: "deposits", label: "Bank Deposits" },
    { key: "withdrawals", label: "Bank Withdrawals" },
    { key: "transfers", label: "Fund Transfers" },
    { key: "history", label: "Transaction History" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 w-fit">
        {subTabs.map(t => (
          <button key={t.key} onClick={() => setActiveSubTab(t.key)}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-indigo-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{subTabs.find(t => t.key === activeSubTab)?.label}</h3>
          <p className="text-xs text-slate-400 mt-0.5">Manage and record bank transactions</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["Date", "Ref No", "Description", "Amount", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs text-slate-500">2024-05-18</td>
                <td className="px-4 py-3 text-xs font-bold text-indigo-600">TRX-001</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">Sample {subTabs.find(t => t.key === activeSubTab)?.label}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-800">₹1,50,000</td>
                <td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Completed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};



// --- MAIN COMPONENT ---

type TabKey = "receipts" | "payments" | "fund-transfer" | "petty-cash";

const TABS: { key: TabKey; label: string }[] = [
  { key: "receipts", label: "Receipt" },
  { key: "payments", label: "Payment" },
  { key: "fund-transfer", label: "Fund Transfer" },
  { key: "petty-cash", label: "Petty Cash" },
];

const PaymentsReceiptsPage = () => {
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
      "receipts": "receipts",
      "payments": "payments",
      "petty-cash": "petty-cash",
      "fund-transfer": "fund-transfer",
    };
    return map[currentSub || ""] || "receipts";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/payments/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Payments & Receipts" breadcrumb={["Accountant", "Payments & Receipts"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Payments & Receipts</h1>
            <p className="text-slate-500 text-sm mt-1">Manage all cash inflows, outflows, petty cash, and bank transactions.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📥</span> Import
            </button>
            <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
              <span className="text-lg">📤</span> Export
            </button>
            <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
              <span className="text-base leading-none">+</span> New Transaction
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold" : "text-slate-500 hover:text-slate-700"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Rendering */}
        {activeTab === "receipts"          && <ReceiptsSection initialSubTab={subTab} key={subTab || "receive"} />}
        {activeTab === "payments"          && <PaymentsSection initialSubTab={subTab} key={subTab || "vendor"} />}
        {activeTab === "fund-transfer"     && <BankTransactionsSection />}
        {activeTab === "petty-cash"        && <PettyCashSection />}
      </PageTransition>
    </>
  );
};

export default PaymentsReceiptsPage;
