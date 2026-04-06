import { useState } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";

const boqData = [
  { id: 1, name: "Excavation for Foundation", code: "BOQ-001", unit: "Cum", qty: 450, rate: 250, total: 112500, project: "Skyline Tower A", type: "Civil" },
  { id: 2, name: "Reinforcement Steel", code: "BOQ-002", unit: "MT", qty: 12, rate: 65000, total: 780000, project: "Skyline Tower A", type: "Structure" },
  { id: 3, name: "PCC Work 1:4:8", code: "BOQ-003", unit: "Cum", qty: 85, rate: 4200, total: 357000, project: "Metro Ph-II", type: "Civil" },
];

const activitiesData = [
  { id: 1, name: "Site Clearing", type: "Pre-construction", project: "Skyline Tower A", status: "Completed" },
  { id: 2, name: "Foundation Pouring", type: "Civil", project: "Skyline Tower A", status: "In Progress" },
  { id: 3, name: "Column Casting", type: "Structure", project: "Metro Ph-II", status: "Pending" },
];

const BOQPage = () => {
  const location = useLocation();
  const isSetup = location.pathname.includes("/setup") || location.pathname === "/admin/boq";
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <DashboardLayout>
      <Navbar title="Work & BOQ Management" breadcrumb={["Admin", "Work & BOQ", isSetup ? "BOQ Setup" : "Activity List"]} />
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{isSetup ? "BOQ Master Setup" : "Project Activity List"}</h1>
            <p className="text-slate-500 text-sm">
              {isSetup ? "Define Bill of Quantities and cost estimates for projects." : "Track site activities and progress against BOQ items."}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">Import Excel</button>
            <button className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
              {isSetup ? "+ Add BOQ Item" : "+ New Activity"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard title="Total BOQ Value" value="₹4.2Cr" sub="Across all active items" accent="text-primary" />
          <StatCard title="Total Items" value="128" sub="Categorized by type" accent="text-violet-500" />
          <StatCard title="Pending Items" value="14" sub="Awaiting rate approval" accent="text-amber-500" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-50 flex items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder={isSetup ? "Search items or codes..." : "Search activities..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="flex gap-2 ml-4">
              <button 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isSetup ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                onClick={() => window.history.pushState(null, "", "/admin/boq/setup")}
              >
                BOQ Setup
              </button>
              <button 
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!isSetup ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                onClick={() => window.history.pushState(null, "", "/admin/boq/activities")}
              >
                Activities
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isSetup ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Item & Code</th>
                    <th className="px-6 py-4">Unit</th>
                    <th className="px-6 py-4">Quantity</th>
                    <th className="px-6 py-4">Rate</th>
                    <th className="px-6 py-4">Total Value</th>
                    <th className="px-6 py-4">Linked Project</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {boqData.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">{item.name}</p>
                          <p className="text-slate-400 text-[10px] font-medium">{item.code}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.unit}</td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">{item.qty}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700">₹{item.rate.toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">₹{item.total.toLocaleString()}</td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-500">{item.project}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase">{item.type}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 text-slate-400 hover:text-primary transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                    <th className="px-6 py-4">Activity Name</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4">Linked Project</th>
                    <th className="px-6 py-4">Progress Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {activitiesData.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-700 group-hover:text-primary transition-colors">{act.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{act.type}</td>
                      <td className="px-6 py-4 text-sm text-slate-500 font-medium">{act.project}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                          act.status === "Completed" ? "bg-emerald-100 text-emerald-600" : act.status === "In Progress" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-600"
                        }`}>
                          {act.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1 text-slate-400 hover:text-primary transition-colors">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </PageTransition>
    </DashboardLayout>
  );
};

export default BOQPage;
