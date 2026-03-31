import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import ProjectTable from "../../components/dashboard/ProjectTable";
import CostChart from "../../components/dashboard/CostChart";
import RiskAnalysis from "../../components/dashboard/RiskAnalysis";
import TaskOverview from "../../components/dashboard/TaskOverview";
import TeamPerformance from "../../components/dashboard/TeamPerformance";
import ActivityFeed from "../../components/dashboard/ActivityFeed";

const ManagerDashboard = () => {
  return (
    <DashboardLayout>
      <Navbar
        title="Project Manager Dashboard"
        breadcrumb={["InfraPilot", "Dashboard", "Manager"]}
        action={{ label: "Generate Report" }}
      />
      
      <main className="p-6 bg-slate-50/50 min-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Welcome, Project Manager</h1>
              <p className="text-sm text-slate-500">Here's what's happening across your projects today, March 30, 2026.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">
                <span className="text-xs font-semibold text-slate-400 uppercase">Project:</span>
                <select className="text-sm font-bold text-slate-700 outline-none bg-transparent">
                  <option>All Projects</option>
                  <option>Skyline Residency</option>
                  <option>Metropolis Hub</option>
                </select>
              </div>
              <button className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-blue-600 transition-colors flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
            </div>
          </div>f

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Projects"
              value="12"
              sub="8 Active, 4 Completed"
              icon={<svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              trend={{ value: "2 this month", isUp: true }}
            />
            <StatCard
              title="Overall Progress"
              value="68%"
              sub="Across all active sites"
              accent="text-emerald-600"
              icon={<svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              trend={{ value: "4.2%", isUp: true }}
            />
            <StatCard
              title="Delayed Projects"
              value="03"
              sub="Critical attention required"
              accent="text-rose-600"
              icon={<svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
              trend={{ value: "1 new", isUp: false }}
            />
            <StatCard
              title="Budget Utilization"
              value="₹42.8Cr"
              sub="Total spent vs ₹85Cr budget"
              accent="text-amber-600"
              icon={<svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              trend={{ value: "12% hike", isUp: false }}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Section - Project Performance */}
            <div className="lg:col-span-2 space-y-6">
              <ProjectTable />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <CostChart />
                <RiskAnalysis />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TaskOverview />
                <ActivityFeed />
              </div>
            </div>

            {/* Sidebar Section */}
            <div className="space-y-6">
              <TeamPerformance />
              
              {/* Critical Alerts Card */}
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                    <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-rose-800">Critical Alerts</h3>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white/60 rounded-lg border border-rose-100">
                    <p className="text-xs font-bold text-rose-700">Budget Exceeded: Metropolis Hub</p>
                    <p className="text-[10px] text-rose-500 mt-1">Actual cost is 15% above forecast for Mar 2026.</p>
                  </div>
                  <div className="p-3 bg-white/60 rounded-lg border border-rose-100">
                    <p className="text-xs font-bold text-rose-700">Project Delay: Skyline Phase 2</p>
                    <p className="text-[10px] text-rose-500 mt-1">Foundation work is 12 days behind schedule.</p>
                  </div>
                </div>
                <button className="w-full mt-4 py-2 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors">
                  Acknowledge All
                </button>
              </div>

              {/* Reports & Export Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h3 className="font-bold text-slate-800 mb-4">Reports & Analytics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <svg className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    <span className="text-[10px] font-bold text-slate-500 mt-2">Export PDF</span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <svg className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <span className="text-[10px] font-bold text-slate-500 mt-2">Daily Log</span>
                  </button>
                </div>
                <button className="w-full mt-4 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors">
                  Advanced Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default ManagerDashboard;

