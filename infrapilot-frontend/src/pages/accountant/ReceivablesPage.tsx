import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_INVOICES = [
  { id: 1, invoice_number: "INV-2026-001", client_name: "Aditya Enterprises", project_name: "Skyline Residency", billing_date: "2026-05-15", due_date: "2026-06-15", work_description: "Excavation & PCC Work – Phase 1", quantity: 1200, unit: "Sqft", rate: 15, amount: 18000, gst_percent: 18, gst_amount: 3240, total_with_gst: 21240, payment_status: "Paid", received_amount: 21240, pending_amount: 0 },
  { id: 2, invoice_number: "INV-2026-002", client_name: "BuildCorp Solutions", project_name: "Metropolis Hub", billing_date: "2026-05-20", due_date: "2026-06-20", work_description: "RCC Column Casting – Ground Floor", quantity: 500, unit: "CuM", rate: 200, amount: 100000, gst_percent: 18, gst_amount: 18000, total_with_gst: 118000, payment_status: "Partial", received_amount: 60000, pending_amount: 58000 },
  { id: 3, invoice_number: "INV-2026-003", client_name: "Zenith Infrastructures", project_name: "NH-48 Expansion", billing_date: "2026-06-01", due_date: "2026-07-01", work_description: "Bitumen Laying – Km 22 to 28", quantity: 250, unit: "Km", rate: 450, amount: 112500, gst_percent: 18, gst_amount: 20250, total_with_gst: 132750, payment_status: "Pending", received_amount: 0, pending_amount: 132750 },
  { id: 4, invoice_number: "INV-2026-004", client_name: "Greenfield Developers", project_name: "Green Valley Township", billing_date: "2026-06-05", due_date: "2026-06-25", work_description: "Plumbing & Electrical Rough-in", quantity: 800, unit: "Sqft", rate: 90, amount: 72000, gst_percent: 18, gst_amount: 12960, total_with_gst: 84960, payment_status: "Overdue", received_amount: 0, pending_amount: 84960 },
];

const MOCK_RA_BILLS = [
  { id: 1, bill_no: "RA/SKY/001", client: "Aditya Enterprises", project: "Skyline Residency", billing_from: "2026-04-01", billing_to: "2026-04-30", billing_date: "2026-05-02", gross_amount: 1250000, gst_percent: 18, gst_amount: 225000, total_with_gst: 1475000, net_payable: 1475000, status: "Certified", certified_by: "PMC – Tata Projects" },
  { id: 2, bill_no: "RA/MET/004", client: "BuildCorp Solutions", project: "Metropolis Hub", billing_from: "2026-04-01", billing_to: "2026-04-30", billing_date: "2026-05-05", gross_amount: 850000, gst_percent: 18, gst_amount: 153000, total_with_gst: 1003000, net_payable: 1003000, status: "Pending Approval", certified_by: "—" },
  { id: 3, bill_no: "RA/SKY/002", client: "Aditya Enterprises", project: "Skyline Residency", billing_from: "2026-05-01", billing_to: "2026-05-31", billing_date: "2026-06-01", gross_amount: 2100000, gst_percent: 18, gst_amount: 378000, total_with_gst: 2478000, net_payable: 2478000, status: "Submitted", certified_by: "Internal Audit" },
];

const MOCK_CREDIT_NOTES = [
  { id: 1, cn_number: "CN-2026-001", related_invoice: "INV-2026-001", client_name: "Aditya Enterprises", credit_date: "2026-05-20", reason: "Work quality deduction – Phase 1", credit_amount: 5000, gst_adjustment: 900, total_credit: 5900 },
  { id: 2, cn_number: "CN-2026-002", related_invoice: "INV-2026-002", client_name: "BuildCorp Solutions", credit_date: "2026-06-01", reason: "Rate revision approved by client", credit_amount: 12000, gst_adjustment: 2160, total_credit: 14160 },
];

const MOCK_COLLECTIONS = [
  { id: 1, invoice: "INV-2026-001", client: "Aditya Enterprises", amount: 21240, received_on: "2026-06-05", mode: "NEFT", ref: "HDFC20260605001", status: "Received" },
  { id: 2, invoice: "INV-2026-002", client: "BuildCorp Solutions", amount: 60000, received_on: "2026-06-10", mode: "Cheque", ref: "CHQ-004521", status: "Received" },
  { id: 3, invoice: "INV-2026-003", client: "Zenith Infrastructures", amount: 0, received_on: "—", mode: "—", ref: "—", status: "Pending" },
  { id: 4, invoice: "INV-2026-004", client: "Greenfield Developers", amount: 0, received_on: "—", mode: "—", ref: "—", status: "Overdue" },
];

const MOCK_LEDGER = [
  { date: "2026-05-15", particulars: "Invoice INV-2026-001 Raised", debit: 21240, credit: 0, balance: 21240 },
  { date: "2026-05-20", particulars: "Credit Note CN-2026-001 Issued", debit: 0, credit: 5900, balance: 15340 },
  { date: "2026-06-05", particulars: "Payment Received – NEFT", debit: 0, credit: 21240, balance: -5900 },
  { date: "2026-05-20", particulars: "Invoice INV-2026-002 Raised", debit: 118000, credit: 0, balance: 112100 },
  { date: "2026-06-10", particulars: "Partial Payment Received – Cheque", debit: 0, credit: 60000, balance: 52100 },
];

const COLLECTION_TREND = [
  { month: "Jan", invoiced: 85, collected: 70 },
  { month: "Feb", invoiced: 110, collected: 95 },
  { month: "Mar", invoiced: 95, collected: 80 },
  { month: "Apr", invoiced: 140, collected: 115 },
  { month: "May", invoiced: 125, collected: 105 },
  { month: "Jun", invoiced: 160, collected: 130 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    Paid: "bg-emerald-100 text-emerald-700",
    Partial: "bg-amber-100 text-amber-700",
    Pending: "bg-slate-100 text-slate-600",
    Overdue: "bg-rose-100 text-rose-700",
    Received: "bg-emerald-100 text-emerald-700",
    Certified: "bg-emerald-100 text-emerald-700",
    Submitted: "bg-blue-100 text-blue-700",
    "Pending Approval": "bg-amber-100 text-amber-700",
  };
  return map[s] || "bg-slate-100 text-slate-500";
};

const CustomTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-bold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: ₹{p.value}L
        </p>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-sections
// ─────────────────────────────────────────────────────────────────────────────

// 1. Dashboard
const DashboardSection = () => {
  const totalReceivables = MOCK_INVOICES.reduce((s, i) => s + i.total_with_gst, 0);
  const paidAmount = MOCK_INVOICES.filter(i => i.payment_status === "Paid").reduce((s, i) => s + i.received_amount, 0);
  const partialAmount = MOCK_INVOICES.filter(i => i.payment_status === "Partial").reduce((s, i) => s + i.received_amount, 0);
  const pendingAmount = MOCK_INVOICES.filter(i => i.payment_status === "Pending").reduce((s, i) => s + i.pending_amount, 0);
  const overdueAmount = MOCK_INVOICES.filter(i => i.payment_status === "Overdue").reduce((s, i) => s + i.pending_amount, 0);

  const kpis = [
    { label: "Total Receivables", value: fmt(totalReceivables), icon: "🧾", accent: "from-indigo-500 to-blue-500", sub: `${MOCK_INVOICES.length} Invoices` },
    { label: "Paid Amount", value: fmt(paidAmount + partialAmount), icon: "✅", accent: "from-emerald-500 to-teal-500", sub: "Fully + Partial" },
    { label: "Pending Amount", value: fmt(pendingAmount), icon: "⏳", accent: "from-amber-500 to-orange-500", sub: "Awaiting Collection" },
    { label: "Overdue Amount", value: fmt(overdueAmount), icon: "🚨", accent: "from-rose-500 to-pink-500", sub: "Past Due Date" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${k.accent} flex items-center justify-center text-xl mb-4 shadow-sm`}>{k.icon}</div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{k.label}</p>
            <p className="text-xl font-bold text-slate-800">{k.value}</p>
            <p className="text-[10px] text-slate-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* Collection Trend Chart */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-5">
          <div>
            <h3 className="text-base font-bold text-slate-800">Collection Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Invoiced vs Collected – Monthly (₹ Lakh)</p>
          </div>
          <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black rounded-full uppercase tracking-widest">FY 2026-27</span>
        </div>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={COLLECTION_TREND} barCategoryGap="30%">
              <defs>
                <linearGradient id="invGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
                <linearGradient id="colGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={8} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={v => `₹${v}L`} />
              <Tooltip content={<CustomTip />} />
              <Bar dataKey="invoiced" name="Invoiced" fill="url(#invGrad)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill="url(#colGrad)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Invoices quick view */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Recent Invoices</h3>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Last 30 days</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60">
              <tr>
                {["Invoice No", "Client", "Project", "Amount", "Due Date", "Status"].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_INVOICES.slice(0, 4).map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-xs font-bold text-primary">{inv.invoice_number}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-700">{inv.client_name}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{inv.project_name}</td>
                  <td className="px-5 py-3 text-xs font-bold text-slate-800">{fmt(inv.total_with_gst)}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">{inv.due_date}</td>
                  <td className="px-5 py-3"><span className={`px-2.5 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(inv.payment_status)}`}>{inv.payment_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const InvoicesSection = ({
  initialSubTab,
}: {
  initialSubTab?: string;
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create" | "approval">(
    (initialSubTab as "list" | "create" | "approval") || "list"
  );
  const [invoices, setInvoices] = useState<any[]>(MOCK_INVOICES);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingInvoice, setEditingInvoice] = useState<any>(null);

  const handleApprove = (id: number) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, payment_status: "Paid" } : inv));
    toast.success("Invoice approved!");
  };

  const handleReject = (id: number) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, payment_status: "Overdue" } : inv));
    toast("Sent back for revision.");
  };

  const handleDelete = (id: number) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id));
    toast.success("Invoice deleted!");
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newInv: any = {};
    formData.forEach((value, key) => { newInv[key] = value; });

    if (editingInvoice) {
      setInvoices(prev => prev.map(inv => inv.id === editingInvoice.id ? { ...inv, ...newInv } : inv));
      toast.success("Invoice updated successfully!");
    } else {
      newInv.id = Date.now();
      newInv.invoice_number = newInv.invoice_number || `INV-${Math.floor(Math.random() * 1000)}`;
      newInv.amount = Number(newInv.quantity || 0) * Number(newInv.rate || 0);
      newInv.gst_amount = newInv.amount * 0.18;
      newInv.total_with_gst = newInv.amount + newInv.gst_amount;
      newInv.pending_amount = newInv.total_with_gst - Number(newInv.received_amount || 0);
      setInvoices(prev => [newInv, ...prev]);
      toast.success("Invoice created successfully!");
    }
    setActiveSubTab("list");
  };

  // Sync when sidebar item changes (e.g., "Invoice List" → "Create Invoice")
  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as "list" | "create" | "approval");
  }, [initialSubTab]);

  const subTabs = [
    { key: "list",     label: "Invoice List" },
    { key: "create",   label: "Create Invoice" },
    { key: "approval", label: "Invoice Approval" },
  ] as const;

  const filtered = invoices.filter(inv =>
    (filter === "All" || inv.payment_status === filter) &&
    (inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
     inv.client_name.toLowerCase().includes(search.toLowerCase()))
  );

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = (readOnly?: boolean) => `w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 ${readOnly ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary"}`;

  return (
    <div className="space-y-5">
      {/* Sub-tab + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => { setActiveSubTab(t.key); if(t.key !== 'create') setEditingInvoice(null); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices…"
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-44 bg-white" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer">
            {["All", "Paid", "Partial", "Pending", "Overdue"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {activeSubTab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Invoice No", "Client Name", "Project", "Billing Date", "Due Date", "Work Description", "Qty", "Unit", "Rate", "Amount", "GST %", "GST Amt", "Total w/ GST", "Recd Amt", "Pending Amt", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap">
                    <td className="px-4 py-3 text-xs font-bold text-primary">{inv.invoice_number}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{inv.client_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[120px] truncate">{inv.project_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.billing_date}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.due_date}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 max-w-[140px] truncate">{inv.work_description}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{inv.quantity.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{inv.unit}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{fmt(inv.rate)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 text-right">{fmt(inv.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{inv.gst_percent}%</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{fmt(inv.gst_amount)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{fmt(inv.total_with_gst)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-emerald-700 text-right">{fmt(inv.received_amount)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-rose-600 text-right">{fmt(inv.pending_amount)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(inv.payment_status)}`}>{inv.payment_status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-primary transition-all" title="View">👁</button>
                        <button onClick={() => { setEditingInvoice(inv); setActiveSubTab("create"); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Edit">✏️</button>
                        <button onClick={() => toast.success("Invoice PDF downloaded!")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all" title="PDF">📄</button>
                        <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="Delete">🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === "approval" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Invoice Approval Queue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Invoices pending manager / client approval</p>
          </div>
          <div className="divide-y divide-slate-50">
            {invoices.filter(i => i.payment_status === "Pending" || i.payment_status === "Overdue").map(inv => (
              <div key={inv.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{inv.invoice_number} — {inv.client_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{inv.project_name} · Due: {inv.due_date}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">{fmt(inv.total_with_gst)}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${statusBadge(inv.payment_status)}`}>{inv.payment_status}</span>
                  <button onClick={() => handleApprove(inv.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all active:scale-95">Approve</button>
                  <button onClick={() => handleReject(inv.id)} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 hover:bg-rose-100 transition-all active:scale-95">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "create" && (
        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Form Sections */}
          <div className="lg:col-span-2 space-y-5">

            {/* 1. Basic Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
                Basic Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Invoice Number",  name: "invoice_number", placeholder: "Auto: INV-2026-005", readOnly: true, val: editingInvoice?.invoice_number },
                  { label: "Invoice Date",    name: "billing_date", placeholder: "",                   type: "date", val: editingInvoice?.billing_date },
                  { label: "Client Name",     name: "client_name", placeholder: "Select client…",     val: editingInvoice?.client_name },
                  { label: "Project Name",    name: "project_name", placeholder: "Select project…",    val: editingInvoice?.project_name },
                  { label: "Billing Date",    name: "billing_date", placeholder: "",                   type: "date", val: editingInvoice?.billing_date },
                  { label: "Due Date",        name: "due_date", placeholder: "",                   type: "date", val: editingInvoice?.due_date },
                  { label: "Payment Terms",   name: "payment_terms", placeholder: "e.g. Net 30 days",   val: editingInvoice ? "Net 30 days" : "" },
                ].map((f, i) => (
                  <div key={i} className={`${i === 6 ? "col-span-2" : ""}`}>
                    <label className={labelClasses}>{f.label}</label>
                    <input type={f.type || "text"} name={f.name} placeholder={f.placeholder} readOnly={f.readOnly} defaultValue={f.val || ""}
                      className={inputClasses(f.readOnly)} />
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Work Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
                Work Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>Work Description</label>
                  <textarea name="work_description" rows={3} placeholder="Describe work done e.g. RCC Column Casting – Ground Floor, Grid A to D" defaultValue={editingInvoice?.work_description || ""}
                    className={inputClasses(false) + " resize-none"} />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: "Quantity",     name: "quantity", placeholder: "e.g. 500",  type: "number", val: editingInvoice?.quantity },
                    { label: "Unit",         name: "unit", placeholder: "e.g. CuM", val: editingInvoice?.unit },
                    { label: "Rate (₹)",     name: "rate", placeholder: "e.g. 4500", type: "number", val: editingInvoice?.rate },
                    { label: "Total Amount", name: "amount", placeholder: "Auto",      readOnly: true, val: editingInvoice?.amount },
                  ].map((f, i) => (
                    <div key={i}>
                      <label className={labelClasses}>{f.label}</label>
                      <input type={f.type || "text"} name={f.name} placeholder={f.placeholder} readOnly={f.readOnly} defaultValue={f.val || ""}
                        className={inputClasses(f.readOnly)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 3. Tax Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
                Tax Details
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "GST (%)",        name: "gst_percent", placeholder: "e.g. 18",  type: "number", val: editingInvoice?.gst_percent },
                  { label: "GST Amount (₹)", name: "gst_amount", placeholder: "Auto",     readOnly: true, val: editingInvoice?.gst_amount },
                  { label: "Total with GST", name: "total_with_gst", placeholder: "Auto",     readOnly: true, val: editingInvoice?.total_with_gst },
                ].map((f, i) => (
                  <div key={i}>
                    <label className={labelClasses}>{f.label}</label>
                    <input type={f.type || "text"} name={f.name} placeholder={f.placeholder} readOnly={f.readOnly} defaultValue={f.val || ""}
                      className={inputClasses(f.readOnly)} />
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Attachments */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">5</span>
                Attachments
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {["BOQ Upload", "Invoice PDF", "Supporting Documents"].map(att => (
                  <label key={att} className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-blue-50/30 transition-all group">
                    <div className="text-2xl mb-2">📎</div>
                    <p className="text-xs font-semibold text-slate-500 group-hover:text-primary">{att}</p>
                    <input type="file" className="hidden" />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Payment Summary Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">4</span>
                Payment Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>Payment Status</label>
                  <select name="payment_status" className={inputClasses(false) + " cursor-pointer"} defaultValue={editingInvoice?.payment_status || "Pending"}>
                    {["Pending", "Partial", "Paid"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClasses}>Received Amount (₹)</label>
                  <input type="number" name="received_amount" placeholder="0" defaultValue={editingInvoice?.received_amount || ""} className={inputClasses(false)} />
                </div>
                <div>
                  <label className={labelClasses}>Pending Amount (₹)</label>
                  <input type="number" name="pending_amount" placeholder="Auto" readOnly defaultValue={editingInvoice?.pending_amount || ""} className={inputClasses(true)} />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-xs text-slate-500"><span>Gross Amount</span><span className="font-semibold text-slate-700">{editingInvoice ? fmt(editingInvoice.amount) : "—"}</span></div>
                <div className="flex justify-between text-xs text-slate-500"><span>GST Amount</span><span className="font-semibold text-slate-700">{editingInvoice ? fmt(editingInvoice.gst_amount) : "—"}</span></div>
                <div className="flex justify-between text-xs font-bold text-primary border-t border-slate-100 pt-2"><span>Total with GST</span><span>{editingInvoice ? fmt(editingInvoice.total_with_gst) : "—"}</span></div>
              </div>
              <button type="submit"
                className="w-full mt-6 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all active:scale-95 shadow-md shadow-primary/20">
                {editingInvoice ? "Update Invoice" : "Create Invoice"}
              </button>
              <button type="button" onClick={() => setActiveSubTab("list")}
                className="w-full mt-2 bg-slate-50 text-slate-500 py-2.5 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-100 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};


// 3. RA Bills
const RABillsSection = ({ initialSubTab }: { initialSubTab?: string; }) => {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create" | "approval">(
    (initialSubTab as any) || "list"
  );
  const [raBills, setRaBills] = useState<any[]>(MOCK_RA_BILLS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [editingRABill, setEditingRABill] = useState<any>(null);

  const handleApprove = (id: number) => {
    setRaBills(prev => prev.map(rb => rb.id === id ? { ...rb, status: "Certified" } : rb));
    toast.success("RA Bill certified!");
  };

  const handleReject = (id: number) => {
    setRaBills(prev => prev.map(rb => rb.id === id ? { ...rb, status: "Rejected" } : rb));
    toast("RA Bill rejected.");
  };

  const handleDelete = (id: number) => {
    setRaBills(prev => prev.filter(rb => rb.id !== id));
    toast.success("RA Bill deleted!");
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newRb: any = {};
    formData.forEach((value, key) => { newRb[key] = value; });

    if (editingRABill) {
      setRaBills(prev => prev.map(rb => rb.id === editingRABill.id ? { ...rb, ...newRb } : rb));
      toast.success("RA Bill updated successfully!");
    } else {
      newRb.id = Date.now();
      newRb.bill_no = newRb.bill_no || `RAB-${Math.floor(Math.random() * 1000)}`;
      // use mock calculated amounts
      newRb.amount = BOQ_ITEMS.reduce((s, item) => s + item.curr_qty * item.rate, 0);
      newRb.status = "Pending";
      setRaBills(prev => [newRb, ...prev]);
      toast.success("RA Bill created successfully!");
    }
    setActiveSubTab("list");
  };

  // Sync when sidebar item changes (e.g., "RA Bill List" → "Create RA Bill")
  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as "list" | "create" | "approval");
  }, [initialSubTab]);

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = (readOnly?: boolean) => `w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 ${readOnly ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary"}`;

  const subTabs = [
    { key: "list", label: "RA Bill List" },
    { key: "create", label: "Create RA Bill" },
    { key: "approval", label: "Bill Approval" },
  ] as const;

  const filtered = raBills.filter(rb =>
    (filter === "All" || rb.status === filter) &&
    (rb.bill_no.toLowerCase().includes(search.toLowerCase()) ||
     rb.client.toLowerCase().includes(search.toLowerCase()))
  );

  const BOQ_ITEMS = [
    { id: 1, item: "Earthwork Excavation", unit: "CuM", rate: 45, prev_qty: 1200, curr_qty: 400 },
    { id: 2, item: "PCC 1:4:8 Work", unit: "CuM", rate: 4200, prev_qty: 80, curr_qty: 30 },
    { id: 3, item: "RCC M25 Column", unit: "CuM", rate: 8500, prev_qty: 40, curr_qty: 15 },
    { id: 4, item: "Brick Masonry", unit: "CuM", rate: 3200, prev_qty: 120, curr_qty: 60 },
  ];

  const grossAmount = BOQ_ITEMS.reduce((s, item) => s + item.curr_qty * item.rate, 0);
  const gstAmount = grossAmount * 0.18;
  const totalWithGST = grossAmount + gstAmount;

  return (
    <div className="space-y-5">
      {/* Header Row: Sub-tabs + Action Button — same layout as InvoicesSection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => { setActiveSubTab(t.key); if (t.key !== 'create') setEditingRABill(null); }}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === t.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search RA Bills…"
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-44 bg-white" />
          <select value={filter} onChange={e => setFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none bg-white font-semibold text-slate-600 cursor-pointer">
            {["All", "Certified", "Pending", "Draft", "Rejected"].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {activeSubTab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Running Account Bills</h3>
              <p className="text-xs text-slate-400 mt-0.5">Progress billing based on site measurements</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["RA Bill No", "Client", "Project", "Billing Period", "Billing Date", "Gross Amt", "GST %", "GST Amt", "Total w/ GST", "Net Payable", "Status", "Certified By", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(rb => (
                  <tr key={rb.id} className="hover:bg-slate-50/50 transition-colors whitespace-nowrap">
                    <td className="px-4 py-3 text-xs font-bold text-primary">{rb.bill_no}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{rb.client}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{rb.project}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rb.billing_from} to {rb.billing_to}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rb.billing_date}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 text-right">{fmt(rb.gross_amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{rb.gst_percent}%</td>
                    <td className="px-4 py-3 text-xs text-slate-600 text-right">{fmt(rb.gst_amount)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{fmt(rb.total_with_gst)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">{fmt(rb.net_payable)}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(rb.status)}`}>{rb.status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{rb.certified_by}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-primary transition-all" title="View">👁</button>
                        <button onClick={() => { setEditingRABill(rb); setActiveSubTab("create"); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Edit">✏️</button>
                        <button onClick={() => toast.success("RA Bill PDF downloaded!")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all" title="PDF">📄</button>
                        <button onClick={() => handleDelete(rb.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="Delete">🗑</button>
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
          {/* Form */}
          <div className="lg:col-span-2 space-y-5">
            {/* Project Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
                Project Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "RA Bill Number", name: "bill_no", placeholder: "Auto: RA/PRJ/005", readOnly: true, val: editingRABill?.bill_no },
                  { label: "Client Name", name: "client", placeholder: "Select client…", val: editingRABill?.client },
                  { label: "Project Name", name: "project", placeholder: "Select project…", val: editingRABill?.project },
                  { label: "Billing Period From", name: "billing_from", placeholder: "2026-06-01", type: "date", val: editingRABill?.billing_from },
                  { label: "Billing Period To", name: "billing_to", placeholder: "2026-06-30", type: "date", val: editingRABill?.billing_to },
                  { label: "Billing Date", name: "billing_date", placeholder: "2026-07-01", type: "date", val: editingRABill?.billing_date },
                ].map((f, i) => (
                  <div key={i}>
                    <label className={labelClasses}>{f.label}</label>
                    <input type={f.type || "text"} name={f.name} placeholder={f.placeholder} readOnly={f.readOnly} defaultValue={f.val || ""}
                      className={inputClasses(f.readOnly)} />
                  </div>
                ))}
              </div>
            </div>

            {/* BOQ Work Progress Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
                BOQ Work Progress
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      {["#", "BOQ Item", "Unit", "Rate (₹)", "Prev Qty", "Curr Qty", "Total Qty", "Amount (₹)"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {BOQ_ITEMS.map((item, idx) => {
                      const totalQty = item.prev_qty + item.curr_qty;
                      const amount = item.curr_qty * item.rate;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="px-3 py-2.5 text-xs text-slate-400">{idx + 1}</td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-slate-700">{item.item}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-500">{item.unit}</td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-slate-700 text-right">{item.rate.toLocaleString("en-IN")}</td>
                          <td className="px-3 py-2.5 text-xs text-slate-500 text-right">{item.prev_qty.toLocaleString("en-IN")}</td>
                          <td className="px-3 py-2.5">
                            <input type="number" defaultValue={editingRABill ? item.curr_qty : ""}
                              className="w-20 px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-right" />
                          </td>
                          <td className="px-3 py-2.5 text-xs font-semibold text-slate-700 text-right">{totalQty.toLocaleString("en-IN")}</td>
                          <td className="px-3 py-2.5 text-xs font-bold text-slate-800 text-right">{fmt(amount)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">4</span>
                Attachments
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {["Measurement Sheet", "BOQ Reference", "RA Bill PDF"].map(att => (
                  <label key={att} className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/40 hover:bg-blue-50/30 transition-all group">
                    <div className="text-2xl mb-2">📎</div>
                    <p className="text-xs font-semibold text-slate-500 group-hover:text-primary">{att}</p>
                    <input type="file" className="hidden" />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Bill Summary Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
                Bill Summary
              </h3>
              <div className="space-y-3">
                {[
                  { label: "Gross Amount", value: fmt(grossAmount) },
                  { label: "GST (18%)", value: fmt(gstAmount) },
                  { label: "Total with GST", value: fmt(totalWithGST), bold: true },
                  { label: "Net Payable", value: fmt(totalWithGST), bold: true, accent: true },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between items-center py-2 ${i > 1 ? "border-t border-slate-100" : ""}`}>
                    <span className={`text-xs ${row.accent ? "font-black text-primary" : "text-slate-500"}`}>{row.label}</span>
                    <span className={`text-sm ${row.accent ? "font-black text-primary text-base" : row.bold ? "font-bold text-slate-800" : "text-slate-700"}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Payment Status */}
              <div className="mt-5 pt-4 border-t border-slate-100">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Payment Status</label>
                <div className="flex gap-2">
                  {["Paid", "Partial", "Pending"].map(s => (
                    <label key={s} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="radio" name="payment_status" value={s} defaultChecked={editingRABill?.payment_status === s || s === "Pending"} className="accent-primary" />
                      <span className="text-xs font-semibold text-slate-600">{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit"
                className="w-full mt-6 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all active:scale-95 shadow-md shadow-primary/20">
                {editingRABill ? "Update RA Bill" : "Create RA Bill"}
              </button>
              <button type="button" onClick={() => setActiveSubTab("list")}
                className="w-full mt-2 bg-slate-50 text-slate-500 py-2.5 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-100 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {activeSubTab === "approval" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">RA Bill Approval Queue</h3>
            <p className="text-xs text-slate-400 mt-0.5">Bills pending PMC / client certification</p>
          </div>
          <div className="divide-y divide-slate-50">
            {raBills.filter(r => r.status !== "Certified").map(rb => (
              <div key={rb.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{rb.bill_no} — {rb.client}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{rb.project} · Period: {rb.billing_from} to {rb.billing_to}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-700">{fmt(rb.total_with_gst)}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${statusBadge(rb.status)}`}>{rb.status}</span>
                  <button onClick={() => handleApprove(rb.id)} className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-all active:scale-95">Certify</button>
                  <button onClick={() => handleReject(rb.id)} className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-lg border border-rose-200 hover:bg-rose-100 transition-all active:scale-95">Reject</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Credit Notes
const CreditNotesSection = ({ initialSubTab }: { initialSubTab?: string; }) => {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create">(
    (initialSubTab as any) || "list"
  );
  const [creditNotes, setCreditNotes] = useState<any[]>(MOCK_CREDIT_NOTES);
  const [search, setSearch] = useState("");
  const [editingCreditNote, setEditingCreditNote] = useState<any>(null);

  const handleDelete = (id: number) => {
    setCreditNotes(prev => prev.filter(cn => cn.id !== id));
    toast.success("Credit note deleted!");
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newCn: any = {};
    formData.forEach((value, key) => { newCn[key] = value; });

    if (editingCreditNote) {
      setCreditNotes(prev => prev.map(cn => cn.id === editingCreditNote.id ? { ...cn, ...newCn } : cn));
      toast.success("Credit note updated successfully!");
    } else {
      newCn.id = Date.now();
      newCn.cn_number = newCn.cn_number || `CN-${Math.floor(Math.random() * 1000)}`;
      newCn.total_credit = Number(newCn.credit_amount || 0) + Number(newCn.gst_adjustment || 0);
      newCn.client_name = newCn.client_name || "Unknown Client";
      setCreditNotes(prev => [newCn, ...prev]);
      toast.success("Credit note created successfully!");
    }
    setActiveSubTab("list");
  };

  // Sync when sidebar item changes (e.g., "Credit Note List" → "Create Credit Note")
  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as "list" | "create");
  }, [initialSubTab]);

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = (readOnly?: boolean) => `w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 ${readOnly ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "bg-white text-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary"}`;

  const filtered = creditNotes.filter(cn =>
    cn.cn_number.toLowerCase().includes(search.toLowerCase()) ||
    cn.client_name.toLowerCase().includes(search.toLowerCase()) ||
    cn.related_invoice.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Header Row: Sub-tabs + Action Button — same layout as InvoicesSection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1">
          <button onClick={() => { setActiveSubTab("list"); setEditingCreditNote(null); }}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === "list" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            Credit Note List
          </button>
          <button onClick={() => setActiveSubTab("create")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${activeSubTab === "create" ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            Create Credit Note
          </button>
        </div>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search CNs or Clients…"
            className="text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 w-44 bg-white" />
        </div>
      </div>

      {activeSubTab === "list" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800">Credit Notes</h3>
              <p className="text-xs text-slate-400 mt-0.5">Issued against client invoices</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["CN Number", "Related Invoice", "Client", "Credit Date", "Reason", "Credit Amt", "GST Adj", "Total Credit", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(cn => (
                  <tr key={cn.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-primary">{cn.cn_number}</td>
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">{cn.related_invoice}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{cn.client_name}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{cn.credit_date}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[160px] truncate">{cn.reason}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700 text-right">{fmt(cn.credit_amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-500 text-right">{fmt(cn.gst_adjustment)}</td>
                    <td className="px-4 py-3 text-xs font-bold text-rose-700 text-right">{fmt(cn.total_credit)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-primary transition-all" title="View">👁</button>
                        <button onClick={() => { setEditingCreditNote(cn); setActiveSubTab("create"); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Edit">✏️</button>
                        <button onClick={() => toast.success("Credit note PDF downloaded!")} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-all" title="PDF">📄</button>
                        <button onClick={() => handleDelete(cn.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="Delete">🗑</button>
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
          {/* Left: Form */}
          <div className="lg:col-span-2 space-y-5">

            {/* 1. Credit Note Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
                Credit Note Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Credit Note Number", name: "cn_number", placeholder: "Auto: CN-2026-003", readOnly: true, val: editingCreditNote?.cn_number },
                  { label: "Related Invoice",    name: "related_invoice", placeholder: "Select invoice…", val: editingCreditNote?.related_invoice },
                  { label: "Client Name",        name: "client_name", placeholder: "Auto-filled from invoice", readOnly: true, val: editingCreditNote?.client_name },
                  { label: "Credit Date",        name: "credit_date", placeholder: "", type: "date", val: editingCreditNote?.credit_date },
                ].map((f, i) => (
                  <div key={i}>
                    <label className={labelClasses}>{f.label}</label>
                    <input type={f.type || "text"} name={f.name} placeholder={f.placeholder} readOnly={f.readOnly} defaultValue={f.val || ""}
                      className={inputClasses(f.readOnly)} />
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Reason */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
                Reason
              </h3>
              <textarea name="reason" rows={4} placeholder="Describe reason for credit note e.g. Material returned, Work not completed, Rate revision…" defaultValue={editingCreditNote?.reason || ""}
                className={inputClasses(false) + " resize-none"} />
            </div>

            {/* 3. Attachment */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
                Attachment
              </h3>
              <label className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 hover:bg-blue-50/30 transition-all flex flex-col items-center group">
                <span className="text-3xl mb-2">📎</span>
                <p className="text-sm font-semibold text-slate-500 group-hover:text-primary">Upload Supporting Document</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — Max 10MB</p>
                <input type="file" className="hidden" />
              </label>
            </div>
          </div>

          {/* Right: Amount Summary Sidebar */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-rose-500 text-white text-xs font-black rounded-lg flex items-center justify-center">₹</span>
                Credit Summary
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>Credit Amount (₹)</label>
                  <input type="number" name="credit_amount" placeholder="Enter credit amount" defaultValue={editingCreditNote?.credit_amount || ""}
                    className={inputClasses(false)} />
                </div>
                <div>
                  <label className={labelClasses}>GST Adjustment (₹)</label>
                  <input type="number" name="gst_adjustment" placeholder="GST to be reversed" defaultValue={editingCreditNote?.gst_adjustment || ""}
                    className={inputClasses(false)} />
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <div className="flex justify-between text-xs text-slate-500"><span>Credit Amount</span><span className="font-semibold text-slate-700">—</span></div>
                <div className="flex justify-between text-xs text-slate-500"><span>GST Adjustment</span><span className="font-semibold text-slate-700">—</span></div>
                <div className="flex justify-between text-xs font-bold text-rose-600 border-t border-slate-100 pt-2"><span>Total Credit</span><span>—</span></div>
              </div>
              <button type="submit"
                className="w-full mt-6 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all active:scale-95 shadow-md shadow-primary/20">
                {editingCreditNote ? "Update Credit Note" : "Create Credit Note"}
              </button>
              <button type="button" onClick={() => setActiveSubTab("list")}
                className="w-full mt-2 bg-slate-50 text-slate-500 py-2.5 rounded-xl text-sm font-bold border border-slate-200 hover:bg-slate-100 transition-all">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

// 5. Collections
const CollectionsSection = () => (
  <div className="space-y-5">
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Total Collected", value: fmt(81240), icon: "💰", color: "bg-emerald-50 text-emerald-600" },
        { label: "Pending Collection", value: fmt(132750), icon: "⏳", color: "bg-amber-50 text-amber-600" },
        { label: "Overdue", value: fmt(84960), icon: "🚨", color: "bg-rose-50 text-rose-600" },
        { label: "Follow-ups Today", value: "3", icon: "📞", color: "bg-blue-50 text-blue-600" },
      ].map((k, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${k.color} flex items-center justify-center text-2xl`}>{k.icon}</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{k.label}</p>
            <p className="text-lg font-bold text-slate-800 mt-0.5">{k.value}</p>
          </div>
        </div>
      ))}
    </div>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h3 className="font-bold text-slate-800">Collection Records</h3>
          <p className="text-xs text-slate-400 mt-0.5">Payment received & pending follow-ups</p>
        </div>
        <button onClick={() => toast.success("Payment recorded!")} className="flex items-center gap-2 bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-blue-600 transition-all active:scale-95">+ Record Payment</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/60 border-b border-slate-100">
            <tr>
              {["Invoice", "Client", "Amount Received", "Received On", "Mode", "Reference", "Status", "Action"].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {MOCK_COLLECTIONS.map(c => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs font-bold text-primary">{c.invoice}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">{c.client}</td>
                <td className="px-4 py-3 text-xs font-bold text-emerald-700 text-right">{c.amount > 0 ? fmt(c.amount) : "—"}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{c.received_on}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{c.mode}</td>
                <td className="px-4 py-3 text-xs font-mono text-slate-400">{c.ref}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(c.status)}`}>{c.status}</span></td>
                <td className="px-4 py-3">
                  {c.status !== "Received" && (
                    <button onClick={() => toast.success("Follow-up sent!")} className="text-[10px] font-bold px-2.5 py-1 bg-blue-50 text-primary rounded-lg border border-blue-100 hover:bg-blue-100 transition-all">Follow Up</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// 6. Client Ledger
const ClientLedgerSection = () => {
  const [selectedClient, setSelectedClient] = useState("Aditya Enterprises");
  const clients = [...new Set(MOCK_INVOICES.map(i => i.client_name))];

  return (
    <div className="space-y-5">
      {/* Client Selector */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="space-y-1.5 flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Client</label>
            <select value={selectedClient} onChange={e => setSelectedClient(e.target.value)}
              className="w-full max-w-sm px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
              {clients.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2 mt-4 sm:mt-5">
            <button onClick={() => toast.success("Client statement downloaded!")} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:border-primary/30 hover:text-primary transition-all">📥 Client Statement</button>
            <button onClick={() => toast.success("Outstanding summary downloaded!")} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2.5 rounded-xl hover:border-primary/30 hover:text-primary transition-all">📊 Outstanding Summary</button>
          </div>
        </div>
      </div>

      {/* Outstanding Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Billed", value: fmt(21240 + 118000 + 132750 + 84960) },
          { label: "Total Received", value: fmt(21240 + 60000), green: true },
          { label: "Outstanding", value: fmt(118000 - 60000 + 132750 + 84960), red: true },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.green ? "text-emerald-600" : s.red ? "text-rose-600" : "text-slate-800"}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Transaction History — {selectedClient}</h3>
          <p className="text-xs text-slate-400 mt-0.5">All debits and credits in chronological order</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["Date", "Particulars", "Debit (₹)", "Credit (₹)", "Balance (₹)"].map(h => (
                  <th key={h} className="px-5 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_LEDGER.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-xs text-slate-500">{row.date}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-slate-700">{row.particulars}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-indigo-700 text-right">{row.debit > 0 ? fmt(row.debit) : "—"}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-emerald-700 text-right">{row.credit > 0 ? fmt(row.credit) : "—"}</td>
                  <td className={`px-5 py-3 text-xs font-bold text-right ${row.balance < 0 ? "text-emerald-700" : "text-rose-700"}`}>{fmt(Math.abs(row.balance))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 7. Reports
const ReportsSection = () => {
  const reports = [
    { title: "Invoice Report", desc: "All client invoices with payment status", icon: "🧾", color: "bg-blue-50 border-blue-100", accent: "text-blue-600" },
    { title: "RA Bill Report", desc: "Running account bills with certification status", icon: "📋", color: "bg-indigo-50 border-indigo-100", accent: "text-indigo-600" },
    { title: "Collection Report", desc: "Amounts received vs outstanding by client", icon: "💰", color: "bg-emerald-50 border-emerald-100", accent: "text-emerald-600" },
    { title: "Outstanding Report", desc: "Aging analysis of pending receivables", icon: "📊", color: "bg-amber-50 border-amber-100", accent: "text-amber-600" },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {reports.map((r, i) => (
          <div key={i} className={`bg-white rounded-2xl shadow-sm border ${r.color} p-6 flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer`}
            onClick={() => toast.success(`${r.title} — generating…`)}>
            <div className={`w-12 h-12 rounded-xl ${r.color} flex items-center justify-center text-2xl`}>{r.icon}</div>
            <div className="flex-1">
              <h3 className={`font-bold ${r.accent} mb-1`}>{r.title}</h3>
              <p className="text-xs text-slate-400">{r.desc}</p>
              <button className={`mt-3 text-[10px] font-black uppercase tracking-widest ${r.accent} hover:underline`}>Download CSV / PDF →</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

type TabKey = "dashboard" | "invoices" | "ra-bills" | "credit-notes" | "collections" | "client-ledger" | "reports";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "dashboard",     label: "Dashboard",               icon: "📊" },
  { key: "invoices",      label: "Invoices",                 icon: "🧾" },
  { key: "ra-bills",      label: "Running Bills (RA Bills)", icon: "📋" },
  { key: "credit-notes",  label: "Credit Notes",             icon: "📝" },
  { key: "collections",   label: "Collections",              icon: "💰" },
  { key: "client-ledger", label: "Client Ledger",            icon: "📒" },
  { key: "reports",       label: "Reports",                  icon: "📈" },
];

const ReceivablesPage = () => {
  const { subpage } = useParams<{ subpage?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const resolveTab = (): TabKey => {
    // Fallback to parsing the URL path if subpage is masked by exact legacy routes
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = subpage || lastPart;

    const map: Record<string, TabKey> = {
      invoices: "invoices",
      "ra-bills": "ra-bills",
      "credit-notes": "credit-notes",
      collections: "collections",
      "client-ledger": "client-ledger",
      reports: "reports",
      dashboard: "dashboard",
    };
    return map[currentSub || ""] || "dashboard";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const subTab = searchParams.get("sub") || undefined;

  // Sync tab when URL changes (including ?sub= param from sidebar)
  useEffect(() => {
    setActiveTab(resolveTab());
  }, [subpage, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/receivables/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Receivables (Client Billing)" breadcrumb={["Accountant", "Receivables"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Finance</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Receivables (Client Billing)</h1>
            <p className="text-slate-500 text-sm mt-1">Manage invoices, running bills, collections, client ledger &amp; reports.</p>
          </div>
        </div>

        {/* Tab Navigation — matches sidebar hierarchy exactly */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 mb-6 overflow-x-auto shadow-sm">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-primary text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Section Label */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
            Receivables
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
            {TABS.find(t => t.key === activeTab)?.label}
          </span>
        </div>

        {/* Tab Content — key={subTab} forces remount when sidebar sub-item changes */}
        {activeTab === "dashboard"     && <DashboardSection />}
        {activeTab === "invoices"      && <InvoicesSection key={subTab || "list"} initialSubTab={subTab} />}
        {activeTab === "ra-bills"      && <RABillsSection key={subTab || "list"} initialSubTab={subTab} />}
        {activeTab === "credit-notes"  && <CreditNotesSection key={subTab || "list"} initialSubTab={subTab} />}
        {activeTab === "collections"   && <CollectionsSection />}
        {activeTab === "client-ledger" && <ClientLedgerSection />}
        {activeTab === "reports"       && <ReportsSection />}
      </PageTransition>

      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => { toast.success("Deleted."); setIsDeleteOpen(false); }}
        title="Delete Record"
        message="Are you sure? This action cannot be undone."
        confirmText="Delete"
        type="danger"
      />
    </>
  );
};

export default ReceivablesPage;
