import { useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";

const financeData = [
  { id: 1, type: "Invoice", project: "Skyline Tower A", amount: 450000, mode: "Bank Transfer", date: "2026-03-25", status: "Paid", gst: "18% (₹81,000)" },
  { id: 2, type: "Expense", project: "Metro Ph-II", amount: 12500, mode: "Petty Cash", date: "2026-03-28", status: "Approved", gst: "0% (Exempt)" },
  { id: 3, type: "Payment", project: "Grand Vista Residency", amount: 280000, mode: "Cheque", date: "2026-04-01", status: "Pending", gst: "12% (₹33,600)" },
];

const FinancePage = () => {
  const location = useLocation();
  const subPage = location.pathname.split("/").pop() || "invoices";
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFinance = financeData.filter(f => 
    f.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <Navbar title="Finance & Accounts" breadcrumb={["Admin", "Finance", subPage.charAt(0).toUpperCase() + subPage.slice(1)]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{subPage.charAt(0).toUpperCase() + subPage.slice(1)} Management</h1>
            <p className="text-slate-500 text-sm">Track transactions, GST filings, and project-wise profitability.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">Audit Logs</button>
            <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
              + New Transaction
            </button>
          </div>
        </div>

        {/* Finance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total Receivables" value="₹2.8Cr" sub="Pending from clients" accent="text-primary" />
          <StatCard title="Total Expenses" value="₹85L" sub="Monthly operating cost" accent="text-rose-500" />
          <StatCard title="Net Profit (Projected)" value="₹1.2Cr" sub="12% Margin" accent="text-emerald-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Search projects, types..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              {["invoices", "payments", "expenses", "profit"].map((tab) => (
                <button 
                  key={tab}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${subPage === tab ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  onClick={() => window.history.pushState(null, "", `/admin/finance/${tab}`)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                  <th className="px-6 py-4">Transaction Details</th>
                  <th className="px-6 py-4">Project Name</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">GST Details</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredFinance.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        item.type === "Invoice" ? "bg-blue-50 text-blue-600" : item.type === "Expense" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-700">{item.project}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">₹{item.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 font-medium">{item.mode}</td>
                    <td className="px-6 py-4 text-xs text-slate-400 font-bold">{item.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                        item.status === "Paid" || item.status === "Approved" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-400">{item.gst}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-1 text-slate-400 hover:text-primary transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default FinancePage;
