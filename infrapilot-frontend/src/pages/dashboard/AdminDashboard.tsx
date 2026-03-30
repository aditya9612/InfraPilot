import { useState } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea 
} from "recharts";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";

// Mock Data
const budgetData = [
  { month: "Jan", budget: 45, actual: 40 },
  { month: "Feb", budget: 52, actual: 48 },
  { month: "Mar", budget: 48, actual: 55 },
  { month: "Apr", budget: 61, actual: 58 },
  { month: "May", budget: 55, actual: 60 },
  { month: "Jun", budget: 67, actual: 72 },
];

const projects = [
  { name: "Skyline Tower A", progress: 75, status: "On Track", budget: "₹12.4Cr", color: "bg-success" },
  { name: "Metro Extension Ph-II", progress: 45, status: "Delayed", budget: "₹45.0Cr", color: "bg-danger" },
  { name: "Grand Vista Residency", progress: 92, status: "On Track", budget: "₹8.2Cr", color: "bg-success" },
  { name: "Bridge Overpass Site", progress: 30, status: "At Risk", budget: "₹15.5Cr", color: "bg-warning" },
];

const activities = [
  { user: "Rahul S.", action: "completed Foundation Paving", time: "12m ago", type: "task" },
  { user: "Priya N.", action: "submitted Invoice #882", time: "45m ago", type: "money" },
  { user: "Site Bot", action: "uploaded 12 site photos", time: "2h ago", type: "photo" },
  { user: "Amit K.", action: "reported Material Shortage", time: "4h ago", type: "alert" },
];

const AdminDashboard = () => {
  const [activityFilter, setActivityFilter] = useState("All");

  return (
    <DashboardLayout>
      <Navbar
        title="Admin Overview"
        breadcrumb={["InfraPilot", "Dashboard", "Admin"]}
      />

      <div className="p-6 bg-slate-50 min-h-screen font-inter">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Pulse</h1>
            <p className="text-slate-500 text-sm">Real-time infrastructure health and budget monitoring.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">+ New Project</button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">+ Add User</button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">+ Create BOQ</button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">Create Report</button>
          </div>
        </div>

        {/* Top Feature Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Projects" value="24" sub="+3 this month" accent="text-primary" />
          <StatCard title="Active Users" value="138" sub="Across 12 sites" accent="text-blue-500" />
          <StatCard title="Total Budget" value="₹4.2Cr" sub="FY 2025-26" accent="text-violet-500" />
          <StatCard title="Pending Issues" value="12" sub="3 High Priority" accent="text-danger" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Chart Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Cost Tracking</h2>
                <p className="text-xs text-slate-400">Budget vs Actual expenditure across all projects</p>
              </div>
              <select className="text-xs font-bold text-slate-500 bg-slate-50 border-none rounded-lg px-3 py-1.5 focus:ring-0">
                <option>This Year</option>
                <option>This Month</option>
              </select>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={budgetData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#94a3b8", fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: "#94a3b8", fontSize: 12 }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: "20px" }} />
                  <Line 
                    type="monotone" 
                    dataKey="budget" 
                    stroke="#2563EB" 
                    strokeWidth={3} 
                    dot={{ fill: "#2563EB", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Planned Budget"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#F43F5E" 
                    strokeWidth={3} 
                    dot={{ fill: "#F43F5E", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="Actual Cost"
                  />
                  {/* Highlight Over Budget Areas in Red */}
                  <ReferenceArea x1="Feb" x2="Apr" fill="#fee2e2" fillOpacity={0.3} label={{ position: 'top', value: 'Over Budget', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
            <div className="px-6 py-5 border-b border-slate-50">
              <h2 className="font-bold text-slate-800 mb-4">Activity Pulse</h2>
              <div className="flex gap-2">
                {["All", "Issues", "Updates"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActivityFilter(tab)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                      activityFilter === tab ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[400px]">
              {activities.map((act, i) => (
                <div key={i} className="flex gap-4 group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    act.type === "alert" ? "bg-red-50 text-red-500" : act.type === "money" ? "bg-green-50 text-green-500" : "bg-blue-50 text-blue-500"
                  }`}>
                    {act.type === "task" && "✔"}
                    {act.type === "money" && "₹"}
                    {act.type === "photo" && "📷"}
                    {act.type === "alert" && "⚠️"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-800 leading-snug">
                      <span className="font-bold">{act.user}</span> {act.action}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Lower Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Critical Alerts */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-4 border-l-red-500">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-red-500 font-bold">⚠️</span>
              <h2 className="font-bold text-slate-800">Critical Alerts</h2>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-red-50 rounded-xl flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-red-900">Budget Exceeded: SkyTower A</p>
                  <p className="text-[10px] text-red-600">Material costs spiking by 12% in current phase.</p>
                </div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-900">Pending Safety Approval</p>
                  <p className="text-[10px] text-amber-600">Site Engineer Ravi awaiting signature for BOQ-22.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Project Progress */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-slate-800">Project Progress</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ongoing Modules</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projects.map((p, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors">{p.name}</p>
                    <span className="text-[10px] font-bold text-slate-400">{p.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden">
                    <div className={`h-full ${p.color} transition-all duration-1000`} style={{ width: `${p.progress}%` }} />
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`w-1.5 h-1.5 rounded-full ${p.status === "On Track" ? "bg-green-500" : p.status === "Delayed" ? "bg-red-500" : "bg-amber-500"}`} />
                    <span className="text-[9px] font-bold text-slate-400 uppercase translate-y-px">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Construction Specific Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center font-bold">👷</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Labor Today</p>
              <p className="text-lg font-bold text-slate-800">1,240 <span className="text-[10px] font-medium text-slate-400">Personnel</span></p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center font-bold">🏗️</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Material Used</p>
              <p className="text-lg font-bold text-slate-800">42 <span className="text-[10px] font-medium text-slate-400">Truckloads</span></p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center font-bold">🚧</div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Site Issues</p>
              <p className="text-lg font-bold text-slate-800">32 <span className="text-[10px] font-medium text-slate-400">Tickets Open</span></p>
            </div>
          </div>
        </div>

        {/* Projects Overview Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Master Projects Overview</h2>
            <button className="text-xs text-primary font-bold hover:underline">Download CSV</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50">
                  <th className="px-6 py-4">Site/Project</th>
                  <th className="px-6 py-4">Allocated Budget</th>
                  <th className="px-6 py-4">Total Progress</th>
                  <th className="px-6 py-4 text-center">Efficiency Score</th>
                  <th className="px-6 py-4">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {projects.map((p, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-700">{p.name}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium text-sm">{p.budget}</td>
                    <td className="px-6 py-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${p.color}`} style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-400">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-slate-800 font-bold">92.4</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                        p.status === "On Track" ? "bg-green-100 text-success" : p.status === "Delayed" ? "bg-red-100 text-danger" : "bg-amber-100 text-warning"
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
