import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import LabourTrendChart from "../../components/dashboard/LabourTrendChart";
import ExpenseTrendChart from "../../components/dashboard/ExpenseTrendChart";
import ForecastChart from "../../components/dashboard/ForecastChart";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, AlertCircle, CheckCircle, TrendingUp, FolderCheck, PieChart, Info, LayoutDashboard } from "lucide-react";
import ComplianceScorecards from "../../components/dashboard/ComplianceScorecards";
import { qcService } from "../../services/qcService";
import { safetyService } from "../../services/safetyService";
import { dashboardService } from "../../services/dashboardService";

import { useProject } from "../../context/ProjectContext";

const ManagerDashboard = () => {
  const { assignedProjects, selectedProjectId, isLoading: projectsLoading } = useProject();
  const [qcMetrics, setQcMetrics] = useState({ total: 0, failures: 0 });
  const [safetyMetrics, setSafetyMetrics] = useState({ total: 0, incidents: 0 });
  const [pmSummary, setPmSummary] = useState<any>(null);
  const [labourData, setLabourData] = useState<any[]>([]);
  const [expenseData, setExpenseData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const pid = selectedProjectId || undefined;

        // Fetch all dashboard data in parallel for maximum speed
        // Each call is wrapped in its own catch block to ensure resilience
        const [
          summary,
          labour,
          expense,
          forecast,
          alertsData,
          qcSafetyData
        ] = await Promise.all([
          dashboardService.getPMCommandCenter(pid).catch(err => { console.warn("Summary fetch failed:", err); return null; }),
          dashboardService.getPMGraphLabour(pid).catch(err => { console.warn("Labour fetch failed:", err); return []; }),
          dashboardService.getPMGraphExpense(pid).catch(err => { console.warn("Expense fetch failed:", err); return []; }),
          dashboardService.getPMGraphForecast(pid).catch(err => { console.warn("Forecast fetch failed:", err); return []; }),
          dashboardService.getAlerts(pid).catch(err => { console.warn("Alerts fetch failed:", err); return { items: [] }; }),
          Promise.all([
            qcService.listQc(selectedProjectId || 0),
            safetyService.listIncidents(selectedProjectId || 0)
          ]).catch(err => { console.warn("QC/Safety metrics failed:", err); return [null, null]; })
        ]);

        // Update states
        if (summary) setPmSummary(summary);
        setLabourData(labour?.data || []);
        setExpenseData(expense?.data || []);
        setForecastData(forecast?.data || []);
        setAlerts(alertsData?.items || alertsData?.data || []);

        const [qcData, safetyData] = qcSafetyData as [any, any];
        if (qcData) {
          setQcMetrics({
            total: qcData.meta?.total || 0,
            failures: qcData.items?.filter((i: any) => i.status === "Fail").length || 0
          });
        }
        if (safetyData) {
          setSafetyMetrics({
            total: safetyData.meta?.total || 0,
            incidents: safetyData.items?.length || 0
          });
        }

      } catch (err) {
        console.error("Critical Dashboard Load Failure:", err);
      } finally {
        setLoading(false);
      }
    };

    if (!projectsLoading) {
      fetchDashboardData();
    }
  }, [projectsLoading, selectedProjectId]);

  if (loading || projectsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium animate-pulse">Syncing PM Intelligence...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar
        title="PM Command Center"
        breadcrumb={["InfraPilot", "Dashboard", "Manager"]}
        action={{ label: "Intelligence Report" }}
      />

      <main className="p-6 bg-slate-50/50 min-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Oversight Command: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h1>
              <p className="text-sm text-slate-500">
                Real-time project intelligence and approval queue.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/manager/approvals" className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Approval Queue
              </Link>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Managed Projects"
              value={assignedProjects.length.toString()}
              sub={`${pmSummary?.active_projects || 0} Active Deployments`}
              icon={<FolderCheck className="w-5 h-5 text-primary" />}
            />
            <StatCard
              title="Active Projects"
              value={pmSummary?.active_projects?.toString() || "0"}
              sub="Currently Ongoing"
              accent="text-emerald-600"
              icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Delayed Projects"
              value={pmSummary?.delayed_projects?.toString() || "0"}
              sub="Urgent Attention Required"
              accent="text-rose-600"
              icon={<AlertCircle className="w-5 h-5 text-rose-600" />}
            />
            <StatCard
              title="Completed Projects"
              value={pmSummary?.completed_projects?.toString() || "0"}
              sub="Handed Over Projects"
              accent="text-blue-600"
              icon={<CheckCircle className="w-5 h-5 text-blue-600" />}
            />
            <StatCard
              title="Budget Utilized"
              value={pmSummary?.budget_utilized_percent ? `${pmSummary.budget_utilized_percent}%` : "0%"}
              sub="Of Total Allocated"
              accent="text-purple-600"
              icon={<PieChart className="w-5 h-5 text-purple-600" />}
            />
            <StatCard
              title="Open Issues"
              value={pmSummary?.open_issues?.toString() || "0"}
              sub="Requiring PM Intervention"
              accent="text-orange-600"
              icon={<Info className="w-5 h-5 text-orange-600" />}
            />
            <StatCard
              title="Pending Approvals"
              value={pmSummary?.pending_approvals?.toString() || "0"}
              sub="Authorization Queue"
              accent="text-amber-600"
              icon={<Clock className="w-5 h-5 text-amber-600" />}
            />
            <StatCard
              title="Work Progress"
              value={`${pmSummary?.avg_completion_percent || 0}%`}
              sub="Overall Portfolio Progress"
              accent="text-indigo-600"
              icon={<LayoutDashboard className="w-5 h-5 text-indigo-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Section - Project Performance */}
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <LabourTrendChart data={labourData.length > 0 ? labourData : undefined} />
                <ExpenseTrendChart data={expenseData.length > 0 ? expenseData : undefined} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <ForecastChart data={forecastData.length > 0 ? forecastData : undefined} />
              </div>
            </div>

            {/* Sidebar Section */}
            <div className="space-y-6">
              <ComplianceScorecards qc={qcMetrics} safety={safetyMetrics} />

              {/* Alerts Card */}
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-rose-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <h3 className="font-bold text-rose-800">Operational Alerts</h3>
                </div>
                <div className="space-y-3">
                  {alerts.length > 0 ? (
                    alerts.slice(0, 5).map((alert: any, idx: number) => (
                      <div key={idx} className="p-3 bg-white/60 rounded-lg border border-rose-100">
                        <p className="text-xs font-bold text-rose-700">
                          {alert.title || alert.type}
                        </p>
                        <p className="text-[10px] text-rose-500 mt-1">
                          {alert.message || alert.description}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No critical alerts found.</p>
                  )}
                </div>
                <button className="w-full mt-4 py-2 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors">
                  View All Alerts
                </button>
              </div>

              {/* Reports & Export Card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                <h3 className="font-bold text-slate-800 mb-4">
                  Reports & Analytics
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <svg
                      className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-500 mt-2">
                      Export PDF
                    </span>
                  </button>
                  <button className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors group">
                    <svg
                      className="w-6 h-6 text-slate-400 group-hover:text-primary transition-colors"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span className="text-[10px] font-bold text-slate-500 mt-2">
                      Daily Log
                    </span>
                  </button>
                </div>
                <Link to="/manager/reports" className="block w-full text-center mt-4 py-2.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors">
                  Advanced Analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ManagerDashboard;
