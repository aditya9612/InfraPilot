import { useState } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";

const approvalsData = [
  { id: 1, type: "Material Request", requestedBy: "Arjun Mehta", project: "Skyline Tower A", detail: "500 Bags Cement", status: "Pending", approvedBy: "-", date: "2026-04-01" },
  { id: 2, type: "Billing Claim", requestedBy: "Sana Khan", project: "Metro Ph-II", detail: "₹1.2L Service Tax", status: "Approved", approvedBy: "Admin", date: "2026-03-30" },
  { id: 3, type: "Expense Reimbursement", requestedBy: "Rahul Deshpande", project: "Grand Vista Residency", detail: "₹5,400 Site Travel", status: "Rejected", approvedBy: "Finance", date: "2026-03-28" },
];

const ApprovalsPage = () => {
  const location = useLocation();
  const subPage = location.pathname.split("/").pop() || "material";
  const [searchTerm, setSearchTerm] = useState("");

  const filteredApprovals = approvalsData.filter(a => 
    a.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Navbar title="Approvals & Workflow" breadcrumb={["Admin", "Approvals", subPage.charAt(0).toUpperCase() + subPage.slice(1)]} />
      
<<<<<<< HEAD
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
=======
      <PageTransition key={location.pathname} className="p-6 bg-slate-50 min-h-screen">
>>>>>>> testing
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{subPage.charAt(0).toUpperCase() + subPage.slice(1)} Approvals</h1>
            <p className="text-slate-500 text-sm">Review and authorize site requests for materials, billing, and expenses.</p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">Export Report</button>
            <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
              Approve Multiple
            </button>
          </div>
        </div>

        {/* Approval Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Pending Requests" value="14" sub="8 High Priority" accent="text-amber-500" />
          <StatCard title="Approved Today" value="22" sub="Across all categories" accent="text-emerald-500" />
          <StatCard title="Avg. TAT" value="4.2 Hrs" sub="Turnaround time" accent="text-violet-500" />
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
                placeholder="Search by project, engineer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2">
              {["material", "billing", "expense"].map((tab) => (
                <button 
                  key={tab}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize ${subPage === tab ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                  onClick={() => window.history.pushState(null, "", `/admin/approvals/${tab}`)}
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
                  <th className="px-6 py-4">Request Type & Details</th>
                  <th className="px-6 py-4">Requested By</th>
                  <th className="px-6 py-4">Project</th>
                  <th className="px-6 py-4">Amount / Qty</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Approved By</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredApprovals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{item.type}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{item.detail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">{item.requestedBy}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">{item.project}</td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-800">{item.detail.split(" ").slice(0, 1).join(" ")}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                        item.status === "Approved" ? "bg-emerald-100 text-emerald-600" : item.status === "Pending" ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      {item.approvedBy}
                    </td>
                    <td className="px-6 py-4 text-[10px] font-bold text-slate-400">{item.date}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </PageTransition>
    </>
  );
};

export default ApprovalsPage;
