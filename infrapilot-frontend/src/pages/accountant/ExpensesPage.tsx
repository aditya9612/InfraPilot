import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// --- MOCK DATA ---
const fmt = (num: number) => `₹${num.toLocaleString("en-IN")}`;
const statusBadge = (s: string) => {
  if (s === "Approved") return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  if (s === "Pending") return "bg-amber-100 text-amber-700 border border-amber-200";
  return "bg-rose-100 text-rose-700 border border-rose-200";
};

const MOCK_EXPENSES = [
  { id: "EXP-101", date: "2024-05-10", category: "Material Purchase", project: "Skyline Towers", amount: 500000, reqBy: "Rahul Verma", status: "Approved" },
  { id: "EXP-102", date: "2024-05-12", category: "Labor Wages", project: "Apex Mall", amount: 250000, reqBy: "Amit Singh", status: "Pending" },
  { id: "EXP-103", date: "2024-05-15", category: "Equipment Rent", project: "Skyline Towers", amount: 100000, reqBy: "Rahul Verma", status: "Approved" },
];

const TREND_DATA = [
  { month: "Jan", Direct: 120, Indirect: 30 },
  { month: "Feb", Direct: 180, Indirect: 45 },
  { month: "Mar", Direct: 250, Indirect: 50 },
  { month: "Apr", Direct: 190, Indirect: 40 },
];

const DIRECT_CATEGORIES = ["Cement Purchase", "Steel Purchase", "Sand & Aggregate", "Bricks & Blocks", "Electrical Material", "Plumbing Material", "Labor Wages", "Contractor Bills", "Machinery Rent", "Diesel & Fuel"];
const INDIRECT_CATEGORIES = ["Site Office Expenses", "Land Registration Charges", "Legal Charges", "Survey Expenses", "Travel & Utilities", "Miscellaneous"];

// --- SECTIONS ---

// 1. Dashboard
const DashboardSection = () => {
  const kpis = [
    { label: "Total Expenses", value: "₹45.5L", icon: "💸", accent: "from-indigo-500 to-blue-500", sub: "YTD" },
    { label: "Direct Expenses", value: "₹38.2L", icon: "🏗", accent: "from-amber-500 to-orange-500", sub: "Project costs" },
    { label: "Indirect Expenses", value: "₹7.3L", icon: "🏢", accent: "from-emerald-500 to-teal-500", sub: "Overheads" },
    { label: "Monthly Average", value: "₹5.8L", icon: "📅", accent: "from-rose-500 to-pink-500", sub: "Run rate" },
  ];

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-5">Expense Trend</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TREND_DATA} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} tickFormatter={v => `₹${v}L`} dx={-10} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Bar dataKey="Direct" stackId="a" fill="#6366f1" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Indirect" stackId="a" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-base font-bold text-slate-800 mb-5">Project-wise Allocation</h3>
          <div className="space-y-4 mt-8">
            {[
              { project: "Skyline Towers", amt: "₹24.5L", pct: 60, color: "bg-indigo-500" },
              { project: "Apex Mall", amt: "₹15.2L", pct: 30, color: "bg-blue-500" },
              { project: "Green Valley Phase II", amt: "₹5.8L", pct: 10, color: "bg-sky-500" },
            ].map(p => (
              <div key={p.project}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold text-slate-700">{p.project}</span>
                  <span className="font-bold text-slate-800">{p.amt}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${p.color}`} style={{ width: `${p.pct}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Expense Section (Direct & Indirect)
const ExpenseSection = ({ type, initialSubTab }: { type: "Direct" | "Indirect", initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState<"list" | "create" | "approval">(
    (initialSubTab as any) || "list"
  );
  const categories = type === "Direct" ? DIRECT_CATEGORIES : INDIRECT_CATEGORIES;
  
  // For demo, just pre-fill with MOCK_EXPENSES
  const [expenses, setExpenses] = useState<any[]>(MOCK_EXPENSES);
  const [search, setSearch] = useState("");
  const [editingExpense, setEditingExpense] = useState<any>(null);

  useEffect(() => {
    if (initialSubTab) setActiveSubTab(initialSubTab as any);
  }, [initialSubTab]);

  const handleDelete = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    toast.success("Expense deleted!");
  };


  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newExp: any = {};
    formData.forEach((value, key) => { newExp[key] = value; });

    if (editingExpense) {
      setExpenses(prev => prev.map(exp => exp.id === editingExpense.id ? { ...exp, ...newExp, amount: Number(newExp.amount || 0) } : exp));
      toast.success("Expense updated!");
    } else {
      newExp.id = `EXP-${Math.floor(Math.random() * 10000)}`;
      newExp.amount = Number(newExp.amount || 0);
      newExp.status = newExp.status || "Pending";
      newExp.reqBy = newExp.reqBy || "Current User";
      setExpenses(prev => [newExp, ...prev]);
      toast.success("Expense recorded!");
    }
    setActiveSubTab("list");
  };

  const filtered = expenses.filter(e => 
    (e.category?.toLowerCase() || "").includes(search.toLowerCase()) || 
    (e.project?.toLowerCase() || "").includes(search.toLowerCase()) ||
    (e.id?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const subTabs = [
    { key: "create", label: "Create Expense" },
    { key: "list", label: "Expense List" },
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
            placeholder="Search expenses..." 
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
              <h3 className="font-bold text-slate-800">{type} Expenses</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage all {type.toLowerCase()} project costs and overheads</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/60 border-b border-slate-100">
                <tr>
                  {["Date", "Expense No", "Category", "Project", "Amount", "Requested By", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(e => (
                  <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-xs text-slate-500">{e.date || "2024-06-01"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-primary">{e.id}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-700">{e.category}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{e.project || "—"}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{fmt(e.amount)}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{e.reqBy}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(e.status)}`}>{e.status}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-primary transition-all" title="View">👁</button>
                        <button onClick={() => { setEditingExpense(e); setActiveSubTab("create"); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-500 transition-all" title="Edit">✏️</button>
                        <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all" title="Delete">🗑</button>
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
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Number *</label><input type="text" placeholder="Auto" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-400" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Date *</label><input type="date" name="date" defaultValue={editingExpense?.date || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Type *</label><input type="text" value={type} readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category *</label>
                  <select name="category" defaultValue={editingExpense?.category || ""} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="">Select Category...</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name *</label><input type="text" name="project" defaultValue={editingExpense?.project || ""} placeholder="Select project" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Location</label><input type="text" placeholder="Optional" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
                Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount (₹)</label><input type="number" name="amount" defaultValue={editingExpense?.amount || ""} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">GST Amount (₹)</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested By</label><input type="text" name="reqBy" defaultValue={editingExpense?.reqBy || ""} placeholder="Employee Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</label>
                  <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option>Bank Transfer</option><option>Cash</option><option>UPI</option><option>Cheque</option><option>Credit Card</option>
                  </select>
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vendor / Payee Name</label><input type="text" placeholder="Name" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Reference</label><input type="text" placeholder="Ref No." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
              </div>
            </div>

            {/* Description & Remarks */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
                Description & Remarks
              </h3>
              <div className="space-y-4">
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expense Description</label><textarea rows={2} placeholder="Detailed description..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 resize-none" /></div>
                <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Remarks (Internal)</label><textarea rows={2} placeholder="Any internal notes..." className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 resize-none" /></div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">4</span>
                Attachments
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {["Bill Upload", "Invoice Upload", "Receipt Upload", "Supporting Docs"].map(att => (
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
                <span className="w-6 h-6 bg-primary text-white text-xs font-black rounded-lg flex items-center justify-center">5</span>
                Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-xs text-slate-500"><span>Base Amount</span><span className="font-semibold text-slate-700">{editingExpense ? fmt(editingExpense.amount) : "—"}</span></div>
                <div className="flex justify-between text-xs text-slate-500"><span>GST Amount</span><span className="font-semibold text-emerald-600">—</span></div>
                <div className="flex justify-between text-sm font-bold text-primary border-t border-slate-100 pt-2"><span>Total Amount</span><span>{editingExpense ? fmt(editingExpense.amount) : "—"}</span></div>
                
                <div className="pt-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                  <select name="status" defaultValue={editingExpense?.status || "Pending"} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
                    <option value="Pending">Pending</option><option value="Approved">Approved</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full mt-6 bg-primary text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-md active:scale-95">
                {editingExpense ? "Update Expense" : "Save Expense Record"}
              </button>
              <button type="button" onClick={() => setActiveSubTab("list")} className="w-full mt-2 bg-slate-50 text-slate-500 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-100 border border-slate-200 transition-all active:scale-95">
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

// 3. Expense Approval
const ExpenseApprovalSection = () => {
  const [expenses, setExpenses] = useState(MOCK_EXPENSES);

  const handleApprove = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: "Approved" } : e));
    toast.success("Expense approved!");
  };

  const handleReject = (id: string) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: "Rejected" } : e));
    toast.error("Expense rejected!");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Expense Approval Queue</h3>
        <p className="text-xs text-slate-400 mt-0.5">Review and approve pending expenses</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/60 border-b border-slate-100">
            <tr>
              {["Expense No", "Date", "Category", "Amount", "Requested By", "Status", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {expenses.filter(e => e.status === "Pending").map(e => (
              <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-3 text-xs font-bold text-primary">{e.id}</td>
                <td className="px-4 py-3 text-xs text-slate-500">{e.date || "2024-06-01"}</td>
                <td className="px-4 py-3 text-xs font-semibold text-slate-700">{e.category}</td>
                <td className="px-4 py-3 text-xs font-bold text-slate-800">{fmt(e.amount)}</td>
                <td className="px-4 py-3 text-xs text-slate-600">{e.reqBy}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-[10px] font-black rounded-full uppercase tracking-widest ${statusBadge(e.status)}`}>{e.status}</span></td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(e.id)} className="text-[10px] font-bold px-2 py-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100">Approve</button>
                    <button onClick={() => handleReject(e.id)} className="text-[10px] font-bold px-2 py-1 bg-rose-50 text-rose-600 rounded hover:bg-rose-100">Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 4. Project Cost Allocation
const ProjectCostAllocationSection = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-3 gap-4">
      {["Skyline Towers", "Apex Mall", "Green Valley Phase II"].map((p, i) => (
        <div key={p} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:border-primary/40 transition-all">
          <div className="w-10 h-10 bg-blue-50 text-primary rounded-xl flex items-center justify-center text-xl mb-3">🏢</div>
          <h4 className="font-bold text-slate-800">{p}</h4>
          <p className="text-xs text-slate-400 mt-1">Total Allocated: {fmt(i === 0 ? 850000 : 420000)}</p>
        </div>
      ))}
    </div>

    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Allocation Details - Skyline Towers</h3>
      </div>
      <div className="p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-sm text-slate-600 font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Material Cost</span>
            <span className="font-bold text-slate-800">₹5,00,000</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-sm text-slate-600 font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Labor Cost</span>
            <span className="font-bold text-slate-800">₹2,50,000</span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <span className="text-sm text-slate-600 font-semibold flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Equipment Cost</span>
            <span className="font-bold text-slate-800">₹1,00,000</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-black text-slate-800">Total Allocated</span>
            <span className="font-black text-primary text-lg">₹8,50,000</span>
          </div>
        </div>
      </div>
    </div>

    {/* Allocation Details Table */}
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-bold text-slate-800">Recent Allocations</h3>
        <p className="text-xs text-slate-400 mt-0.5">Detailed breakdown of project cost allocations</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50/60 border-b border-slate-100">
            <tr>
              {["Project Name", "Expense Category", "Amount", "Allocated Date", "Cost Center"].map(h => (
                <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 text-xs font-bold text-primary">Skyline Towers</td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">Material Cost</td>
              <td className="px-4 py-3 text-xs font-bold text-slate-800">₹5,00,000</td>
              <td className="px-4 py-3 text-xs text-slate-500">2024-05-15</td>
              <td className="px-4 py-3 text-xs text-slate-600">Site A - Main Tower</td>
            </tr>
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 text-xs font-bold text-primary">Skyline Towers</td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">Labor Cost</td>
              <td className="px-4 py-3 text-xs font-bold text-slate-800">₹2,50,000</td>
              <td className="px-4 py-3 text-xs text-slate-500">2024-05-18</td>
              <td className="px-4 py-3 text-xs text-slate-600">Contractor Pool 1</td>
            </tr>
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 text-xs font-bold text-primary">Skyline Towers</td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">Equipment Cost</td>
              <td className="px-4 py-3 text-xs font-bold text-slate-800">₹1,00,000</td>
              <td className="px-4 py-3 text-xs text-slate-500">2024-05-20</td>
              <td className="px-4 py-3 text-xs text-slate-600">Heavy Machinery Dept</td>
            </tr>
            <tr className="hover:bg-slate-50/50 transition-colors">
              <td className="px-4 py-3 text-xs font-bold text-primary">Apex Mall</td>
              <td className="px-4 py-3 text-xs font-semibold text-slate-700">Site Prep</td>
              <td className="px-4 py-3 text-xs font-bold text-slate-800">₹4,20,000</td>
              <td className="px-4 py-3 text-xs text-slate-500">2024-05-22</td>
              <td className="px-4 py-3 text-xs text-slate-600">Groundwork Division</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// 5. Expense Ledger
const ExpenseLedgerSection = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-5 border-b border-slate-100">
      <h3 className="font-bold text-slate-800">Expense Ledger</h3>
      <p className="text-xs text-slate-400 mt-0.5">Chronological record of all expenses</p>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50/60 border-b border-slate-100">
          <tr>
            {["Date", "Expense No", "Category", "Debit", "Credit", "Balance"].map(h => (
              <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          <tr className="hover:bg-slate-50/50 transition-colors">
            <td className="px-4 py-3 text-xs text-slate-500">2024-05-10</td>
            <td className="px-4 py-3 text-xs font-bold text-primary">EXP-101</td>
            <td className="px-4 py-3 text-xs font-semibold text-slate-700">Material Purchase</td>
            <td className="px-4 py-3 text-xs text-slate-700 text-right">₹5,00,000</td>
            <td className="px-4 py-3 text-xs text-emerald-600 text-right">—</td>
            <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹5,00,000</td>
          </tr>
          <tr className="hover:bg-slate-50/50 transition-colors">
            <td className="px-4 py-3 text-xs text-slate-500">2024-05-12</td>
            <td className="px-4 py-3 text-xs font-bold text-primary">EXP-102</td>
            <td className="px-4 py-3 text-xs font-semibold text-slate-700">Labor Wages</td>
            <td className="px-4 py-3 text-xs text-slate-700 text-right">₹2,50,000</td>
            <td className="px-4 py-3 text-xs text-emerald-600 text-right">—</td>
            <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹7,50,000</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

// 6. Generic Placeholders
const PlaceholderSection = ({ title }: { title: string }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
    <div className="text-4xl mb-4">🚧</div><h3 className="text-lg font-bold text-slate-800">{title}</h3>
    <p className="text-slate-500 text-sm mt-1">This section is being built.</p>
  </div>
);

// --- MAIN COMPONENT ---

type TabKey = "dashboard" | "direct" | "indirect" | "approval" | "claims" | "allocation" | "ledger" | "reports";

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: "dashboard",  label: "Dashboard",       icon: "📊" },
  { key: "direct",     label: "Direct Expenses", icon: "🏗" },
  { key: "indirect",   label: "Indirect Expenses", icon: "🏢" },
  { key: "approval",   label: "Expense Approval", icon: "✓" },
  { key: "claims",     label: "Expense Claims",  icon: "🧾" },
  { key: "allocation", label: "Cost Allocation", icon: "🍰" },
  { key: "ledger",     label: "Expense Ledger",  icon: "📖" },
  { key: "reports",    label: "Reports",         icon: "📈" },
];

const ExpensesPage = () => {
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
      "direct": "direct",
      "indirect": "indirect",
      "approval": "approval",
      "claims": "claims",
      "allocation": "allocation",
      "ledger": "ledger",
      "reports": "reports",
      "dashboard": "dashboard",
    };
    return map[currentSub || ""] || "dashboard";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/expenses/${key}`, { replace: true });
  };

  return (
    <>
      <Navbar title="Expenses Management" breadcrumb={["Accountant", "Expenses"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Finance</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Expenses</h1>
            <p className="text-slate-500 text-sm mt-1">Manage project costs, indirect overheads, approvals and ledgers.</p>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center">🏗</div>
            <div className="flex flex-col pr-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select Project</label>
              <select className="text-sm font-bold text-slate-800 outline-none bg-transparent cursor-pointer">
                <option value="all">All Projects</option>
                <option value="skyline">Skyline Towers</option>
                <option value="apex">Apex Mall</option>
                <option value="greenvalley">Green Valley Phase II</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 mb-6 overflow-x-auto shadow-sm">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-primary text-white shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}>
              <span>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>

        {/* Breadcrumb Label */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expenses</span>
          <span className="text-slate-300">/</span>
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{TABS.find(t => t.key === activeTab)?.label}</span>
        </div>

        {/* Content Rendering */}
        {activeTab === "dashboard"   && <DashboardSection />}
        {activeTab === "direct"      && <ExpenseSection type="Direct" initialSubTab={subTab} key={subTab || "direct"} />}
        {activeTab === "indirect"    && <ExpenseSection type="Indirect" initialSubTab={subTab} key={subTab || "indirect"} />}
        {activeTab === "approval"    && <ExpenseApprovalSection />}
        {activeTab === "claims"      && <PlaceholderSection title="Expense Claims" />}
        {activeTab === "allocation"  && <ProjectCostAllocationSection />}
        {activeTab === "ledger"      && <ExpenseLedgerSection />}
        {activeTab === "reports"     && <PlaceholderSection title="Reports" />}
      </PageTransition>
    </>
  );
};

export default ExpensesPage;
