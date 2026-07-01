import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// --- MOCK DATA ---
const fmt = (num: number) => `₹${num.toLocaleString("en-IN")}`;

const MOCK_EXPENSES = [
  { id: "EXP-001", date: "25/05/26", category: "Fuel", project: "Metro", vendor: "Indian Oil", amount: 45000, gst: 0, paymentMode: "Credit Card", status: "Approved" },
  { id: "EXP-002", date: "26/05/26", category: "Travel", project: "Tower A", vendor: "MakeMyTrip", amount: 12500, gst: 625, paymentMode: "UPI", status: "Pending Approval" },
  { id: "EXP-003", date: "28/05/26", category: "Repairs", project: "Line 3", vendor: "AutoFix Services", amount: 8500, gst: 1530, paymentMode: "Bank Transfer", status: "Rejected" },
];

const TREND_DATA = [
  { day: "Mon", amount: 4000 },
  { day: "Tue", amount: 3000 },
  { day: "Wed", amount: 5000 },
  { day: "Thu", amount: 3000 },
  { day: "Fri", amount: 7000 },
  { day: "Sat", amount: 2500 },
  { day: "Sun", amount: 3500 },
];

const PIE_DATA = [
  { name: "Fuel & Maintenance", value: 45, color: "#f43f5e" },
  { name: "Other", value: 55, color: "#f1f5f9" }
];

// --- SECTIONS ---

// 1. Expense Entry Section
const ExpenseEntrySection = () => {
  const [activeStat, setActiveStat] = useState("TOTAL EXPENSE");

  return (
    <div className="space-y-6 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "TOTAL EXPENSE", value: "₹4.2 Cr" },
          { label: "MONTHLY EXPENSE", value: "₹85 L" },
          { label: "PROJECT EXPENSE", value: "₹3.8 Cr" },
          { label: "DIRECT EXPENSE", value: "₹3.1 Cr" },
          { label: "INDIRECT EXPENSE", value: "₹1.1 Cr" },
          { label: "PENDING APPRVL", value: "12", valueColor: "text-amber-500" },
        ].map(k => {
          const isActive = activeStat === k.label;
          return (
            <div 
              key={k.label} 
              onClick={() => setActiveStat(k.label)}
              className={`bg-white rounded-xl p-4 shadow-sm border ${isActive ? 'border-rose-500' : 'border-slate-100 hover:border-rose-300'} relative overflow-hidden cursor-pointer transition-colors`}
            >
              {isActive && <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500"></div>}
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{k.label}</p>
              <p className={`text-xl font-bold ${k.valueColor || 'text-slate-800'}`}>{k.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Expense Trend</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA}>
                <defs>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} tickFormatter={v => `${v}`} dx={-10} />
                <Tooltip cursor={{ fill: "#f8fafc" }} />
                <Area type="monotone" dataKey="amount" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Category-wise</h3>
          <div className="flex flex-col items-center justify-center flex-1 relative">
            <div className="h-32 w-32 relative mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={PIE_DATA} innerRadius={45} outerRadius={60} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                    {PIE_DATA.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-800">45%</span>
              </div>
            </div>
            <p className="text-xs font-semibold text-slate-500 text-center px-4">Fuel & Maintenance is the highest expense category this month.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">All Expense Entrys</h3>
          <div className="flex gap-3">
             <input type="text" placeholder="Search expense entry..." className="text-xs border border-slate-200 rounded-xl px-3 py-2 w-64 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20" />
             <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
               Filter
             </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["Expense No", "Date", "Category", "Project", "Vendor", "Amount", "GST", "Payment Mode", "Status"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_EXPENSES.map(e => (
                <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-4 text-xs font-bold text-blue-600">{e.id}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">{e.date}</td>
                  <td className="px-4 py-4 text-xs font-bold text-slate-800">{e.category}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">{e.project}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">{e.vendor}</td>
                  <td className="px-4 py-4 text-xs font-bold text-rose-500">{fmt(e.amount)}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">₹{e.gst}</td>
                  <td className="px-4 py-4 text-xs text-slate-500">{e.paymentMode}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      e.status === 'Approved' ? 'bg-emerald-100 text-emerald-700' :
                      e.status === 'Pending Approval' ? 'bg-amber-100 text-amber-700' :
                      'bg-rose-100 text-rose-700'
                    }`}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
const ExpenseLedgerSection = () => {
  const [activeStat, setActiveStat] = useState("TOTAL EXPENSE");
  
  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expenses</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">Expense Ledger</h2>
        </div>
        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "TOTAL EXPENSE", value: "₹4.2 Cr" },
          { label: "MONTHLY EXPENSE", value: "₹85 L" },
          { label: "PROJECT EXPENSE", value: "₹3.8 Cr" },
          { label: "DIRECT EXPENSE", value: "₹3.1 Cr" },
          { label: "INDIRECT EXPENSE", value: "₹1.1 Cr" },
          { label: "PENDING APPRVL", value: "12", valueColor: "text-amber-500" },
        ].map(k => {
          const isActive = activeStat === k.label;
          return (
            <div 
              key={k.label} 
              onClick={() => setActiveStat(k.label)}
              className={`bg-white rounded-xl p-4 shadow-sm border ${isActive ? 'border-rose-500' : 'border-slate-100 hover:border-rose-300'} relative overflow-hidden cursor-pointer transition-colors`}
            >
              {isActive && <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500"></div>}
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{k.label}</p>
              <p className={`text-xl font-bold ${k.valueColor || 'text-slate-800'}`}>{k.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">All Expense Ledgers</h3>
          <div className="flex gap-3">
             <input type="text" placeholder="Search expense ledger..." className="text-xs border border-slate-200 rounded-xl px-3 py-2 w-64 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20" />
             <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
               Filter
             </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["Ledger Account", "Category", "YTD Amount", "Monthly Avg", "Trend", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 text-xs font-bold text-slate-800">Fuel & Maintenance</td>
                <td className="px-4 py-4 text-xs text-slate-500">Direct Expense</td>
                <td className="px-4 py-4 text-xs font-bold text-rose-500">₹12,50,000</td>
                <td className="px-4 py-4 text-xs font-bold text-slate-800">₹2,50,000</td>
                <td className="px-4 py-4 text-xs font-bold text-rose-500 flex items-center gap-1">↘ Up</td>
                <td className="px-4 py-4 text-xs font-bold text-blue-600 cursor-pointer hover:underline">View Ledger</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 text-xs font-bold text-slate-800">Site Labor Travel</td>
                <td className="px-4 py-4 text-xs text-slate-500">Direct Expense</td>
                <td className="px-4 py-4 text-xs font-bold text-rose-500">₹4,80,000</td>
                <td className="px-4 py-4 text-xs font-bold text-slate-800">₹96,000</td>
                <td className="px-4 py-4 text-xs font-bold text-slate-500 flex items-center gap-1">→ Stable</td>
                <td className="px-4 py-4 text-xs font-bold text-blue-600 cursor-pointer hover:underline">View Ledger</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 text-xs font-bold text-slate-800">Office Stationery</td>
                <td className="px-4 py-4 text-xs text-slate-500">Indirect Expense</td>
                <td className="px-4 py-4 text-xs font-bold text-rose-500">₹85,000</td>
                <td className="px-4 py-4 text-xs font-bold text-slate-800">₹17,000</td>
                <td className="px-4 py-4 text-xs font-bold text-emerald-500 flex items-center gap-1">↘ Down</td>
                <td className="px-4 py-4 text-xs font-bold text-blue-600 cursor-pointer hover:underline">View Ledger</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const BOQComparisonSection = () => {
  const [activeStat, setActiveStat] = useState("TOTAL EXPENSE");

  return (
    <div className="space-y-6 mt-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Expenses</p>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight uppercase">BOQ Comparison</h2>
        </div>
        <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 hover:bg-slate-50 transition-colors">
          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        {[
          { label: "TOTAL EXPENSE", value: "₹4.2 Cr" },
          { label: "MONTHLY EXPENSE", value: "₹85 L" },
          { label: "PROJECT EXPENSE", value: "₹3.8 Cr" },
          { label: "DIRECT EXPENSE", value: "₹3.1 Cr" },
          { label: "INDIRECT EXPENSE", value: "₹1.1 Cr" },
          { label: "PENDING APPRVL", value: "12", valueColor: "text-amber-500" },
        ].map(k => {
          const isActive = activeStat === k.label;
          return (
            <div 
              key={k.label} 
              onClick={() => setActiveStat(k.label)}
              className={`bg-white rounded-xl p-4 shadow-sm border ${isActive ? 'border-rose-500' : 'border-slate-100 hover:border-rose-300'} relative overflow-hidden cursor-pointer transition-colors`}
            >
              {isActive && <div className="absolute bottom-0 left-0 w-full h-1 bg-rose-500"></div>}
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{k.label}</p>
              <p className={`text-xl font-bold ${k.valueColor || 'text-slate-800'}`}>{k.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">All BOQ Comparisons</h3>
          <div className="flex gap-3">
             <input type="text" placeholder="Search boq comparison..." className="text-xs border border-slate-200 rounded-xl px-3 py-2 w-64 bg-slate-50 outline-none focus:ring-2 focus:ring-primary/20" />
             <button className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors">
               <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
               Filter
             </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/60 border-b border-slate-100">
              <tr>
                {["BOQ Item", "Unit", "BOQ Qty", "BOQ Rate", "BOQ Amount", "Actual Amount", "Variance", "Var %"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 text-xs font-bold text-slate-800">Excavation Work</td>
                <td className="px-4 py-4 text-xs text-slate-500">Cum</td>
                <td className="px-4 py-4 text-xs font-bold text-slate-800">5000</td>
                <td className="px-4 py-4 text-xs text-slate-500">₹450</td>
                <td className="px-4 py-4 text-xs font-bold text-slate-800">₹22,50,000</td>
                <td className="px-4 py-4 text-xs font-bold text-rose-500">₹23,10,000</td>
                <td className="px-4 py-4 text-xs font-bold text-rose-500">-₹60,000</td>
                <td className="px-4 py-4 text-xs font-bold text-rose-500">-2.6%</td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="px-4 py-4 text-xs font-bold text-slate-800">M25 Concrete</td>
                <td className="px-4 py-4 text-xs text-slate-500">Cum</td>
                <td className="px-4 py-4 text-xs font-bold text-slate-800">2000</td>
                <td className="px-4 py-4 text-xs text-slate-500">₹5500</td>
                <td className="px-4 py-4 text-xs font-bold text-slate-800">₹1,10,00,000</td>
                <td className="px-4 py-4 text-xs font-bold text-rose-500">₹95,00,000</td>
                <td className="px-4 py-4 text-xs font-bold text-emerald-500">₹15,00,000</td>
                <td className="px-4 py-4 text-xs font-bold text-emerald-500">13.6%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

type TabKey = "dashboard" | "expense-entry" | "boq-comparison";

const TABS: { key: TabKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "expense-entry", label: "Expense Entry" },
  { key: "boq-comparison", label: "BOQ Comparison" },
];

const ExpenseEntryWrapper = () => {
  const [activeSubTab, setActiveSubTab] = useState("project-expenses");

  const tabs = [
    { key: "project-expenses", label: "Project Expenses" },
    { key: "expense-ledger", label: "Expense Ledger" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 w-fit border border-slate-200">
        {tabs.map(tab => (
          <button 
            key={tab.key} 
            onClick={() => setActiveSubTab(tab.key)}
            className={`flex items-center justify-center px-5 py-2 rounded-lg text-[13.5px] font-bold whitespace-nowrap transition-all ${
              activeSubTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>
        {activeSubTab === "project-expenses" && <ProjectCostAllocationSection />}
        {activeSubTab === "expense-ledger" && <ExpenseLedgerSection />}
      </div>
    </div>
  );
};

const ExpensesPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();


  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;

    const map: Record<string, TabKey> = {
      "dashboard": "dashboard",
      "expense-entry": "expense-entry",
      "boq-comparison": "boq-comparison",
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
      <Navbar title="Expenses" breadcrumb={["Accountant", "Expenses"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Expenses</h1>
            <p className="text-slate-500 text-sm mt-1">Manage and track your expense records, ledgers, and BOQ comparisons.</p>
          </div>
          {activeTab === "expense-entry" && (
            <div className="flex flex-wrap items-center gap-3">
              <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
                <span className="text-lg">📥</span> Import
              </button>
              <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
                <span className="text-lg">📤</span> Export
              </button>
              <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
                <span className="text-base leading-none">+</span> Record Expense
              </button>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => handleTabChange(tab.key)}
              className={`flex items-center justify-center px-5 py-2.5 rounded-lg text-[13.5px] font-bold whitespace-nowrap transition-all ${
                activeTab === tab.key ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Rendering */}
        {activeTab === "dashboard"         && <ExpenseEntrySection />}
        {activeTab === "expense-entry"     && <ExpenseEntryWrapper />}
        {activeTab === "boq-comparison"    && <BOQComparisonSection />}
      </PageTransition>
    </>
  );
};

export default ExpensesPage;
