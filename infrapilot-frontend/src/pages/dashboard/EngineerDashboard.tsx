import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import PageTransition from "../../components/common/PageTransition";

// Mock Data
const initialTasks = [
  {
    id: 1,
    name: "Foundation Concrete Pour - Block A",
    completed: false,
    priority: "High",
  },
  {
    id: 2,
    name: "Steel Reinforcement Check - Section 2",
    completed: true,
    priority: "Medium",
  },
  {
    id: 3,
    name: "Site Safety Walkthrough",
    completed: false,
    priority: "High",
  },
  {
    id: 4,
    name: "Material Delivery Inspection",
    completed: false,
    priority: "Low",
  },
];

const activityHistory = [
  {
    id: 1,
    type: "report",
    desc: "Daily Report submitted",
    time: "09:30 AM",
    icon: "📝",
  },
  {
    id: 2,
    type: "photo",
    desc: "4 site photos uploaded",
    time: "10:15 AM",
    icon: "📸",
  },
  {
    id: 3,
    type: "issue",
    desc: "Water leakage reported at Level 2",
    time: "11:00 AM",
    icon: "⚠️",
  },
];

const EngineerDashboard = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [report, setReport] = useState({
    workDone: "",
    laborCount: "",
    materialUsed: "",
  });
  const [showIssueForm, setShowIssueForm] = useState(false);

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  };

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <Navbar title="Field Dashboard" breadcrumb={["InfraPilot", "Dashboard", "Engineer"]} />

      <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Field Pulse
            </h1>
            <p className="text-slate-500 text-sm">
              Real-time site ops and daily progress tracking.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">
              + New Task
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">
              + Logistics
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all">
              + Safety
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95">
              Create Report
            </button>
          </div>
        </div>

        {/* Top Summary Stats */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Site Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Labor Today"
              value="48"
              sub="On-site personnel"
              accent="text-blue-500"
              icon="👷"
            />
            <StatCard
              title="Material Used"
              value="6.2t"
              sub="Cement & Steel"
              accent="text-emerald-500"
              icon="🏗️"
            />
            <StatCard
              title="Tasks Done"
              value={`${tasks.filter((t) => t.completed).length}/${tasks.length}`}
              sub="Completed today"
              accent="text-indigo-500"
              icon="✅"
            />
            <StatCard
              title="Issues Open"
              value="2"
              sub="Awaiting resolution"
              accent="text-rose-500"
              icon="⚠️"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Daily Site Report Form */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Daily Site Report</h2>
                <p className="text-xs text-slate-400">Record today's progress and resource utilization</p>
              </div>
              <div className="px-3 py-1.5 bg-slate-50 rounded-lg text-xs font-bold text-slate-500">
                {today}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Work Done Overview
                </label>
                <textarea
                  placeholder="Briefly describe what was completed today..."
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm text-slate-700 focus:ring-2 focus:ring-primary min-h-[120px] resize-none transition-all"
                  value={report.workDone}
                  onChange={(e) =>
                    setReport({ ...report, workDone: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Labor Count
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700 focus:ring-2 focus:ring-primary"
                    value={report.laborCount}
                    onChange={(e) =>
                      setReport({ ...report, laborCount: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                    Materials Used (t)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4t Cement"
                    className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700 focus:ring-2 focus:ring-primary"
                    value={report.materialUsed}
                    onChange={(e) =>
                      setReport({ ...report, materialUsed: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <button className="flex-1 py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 text-xs font-bold hover:bg-slate-100 hover:border-slate-300 flex items-center justify-center gap-2 transition-all">
                  <span>📸</span> Upload Site Photos
                </button>
                <button className="flex-1 py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 active:scale-95 transition-all">
                  Submit Daily Report
                </button>
              </div>
            </div>
          </div>

          {/* Site Pulse / Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50">
            <div className="px-6 py-5 border-b border-slate-50">
              <h2 className="font-bold text-slate-800">Activity Pulse</h2>
            </div>
            <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[480px]">
              {activityHistory.map((act) => (
                <div key={act.id} className="flex gap-4 group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${act.type === "issue" ? "bg-rose-50 text-rose-500" : act.type === "photo" ? "bg-indigo-50 text-indigo-500" : "bg-emerald-50 text-emerald-500"
                    }`}>
                    <span className="text-xl">{act.icon}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 leading-snug group-hover:text-primary transition-colors">
                      {act.desc}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-[10px] text-slate-400 font-medium">{act.time}</p>
                      <button className="text-[10px] font-black text-primary uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all hover:underline">
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Today's Tasks */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden lg:col-span-2">
            <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between">
              <h2 className="font-bold text-slate-800">Assigned Tasks</h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                TODAY
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="p-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                >
                  <div
                    className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center transition-all ${task.completed
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                        : "border-slate-100 bg-slate-50 text-slate-300 group-hover:border-primary group-hover:text-primary"
                      }`}
                  >
                    {task.completed ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">{task.id}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold transition-all ${task.completed ? "text-slate-300 line-through" : "text-slate-700"}`}>
                      {task.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${task.priority === "High" ? "bg-rose-500" : "bg-slate-200"}`} />
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${task.priority === "High" ? "text-rose-500" : "text-slate-400"}`}>
                        Priority: {task.priority}
                      </p>
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Current Project Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/50 group">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">
                Ongoing Project
              </h2>
              <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg uppercase tracking-widest">
                On Track
              </span>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl mb-6 group-hover:scale-110 transition-transform">
              🚇
            </div>

            <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-1">Metro Extension Ph-II</h3>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">Zone 4: Foundation Work</p>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Global Progress</span>
                <span className="text-2xl font-bold text-primary tracking-tight">64%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-primary shadow-lg shadow-primary/20 transition-all duration-1000 ease-out"
                  style={{ width: "64%" }}
                />
              </div>
            </div>

            <button className="w-full mt-8 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border border-transparent hover:border-slate-200">
              View Detailed Timeline
            </button>
          </div>
        </div>

        {/* Critical Issue CTA */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 border-l-4 border-l-rose-500 flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-xl transition-all group">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🔥</div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">Critical Issue Found?</h3>
              <p className="text-sm text-slate-500 font-medium">Report blockers immediately to the project manager and admin.</p>
            </div>
          </div>
          <button
            onClick={() => setShowIssueForm(true)}
            className="px-8 py-4 bg-rose-500 text-white rounded-2xl text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all w-full md:w-auto"
          >
            Report Now
          </button>
        </div>
      </PageTransition>

      {/* Floating Issue Form Modal */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800 tracking-tight uppercase">
                  Report Issue
                </h3>
                <p className="text-xs text-slate-400 font-medium tracking-tight">Broadcast critical site blocker</p>
              </div>
              <button
                onClick={() => setShowIssueForm(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all text-xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Issue Title</label>
                <input
                  type="text"
                  placeholder="e.g. Pipe Leak at Section 2"
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Details</label>
                <textarea
                  placeholder="Detailed description of the blocker..."
                  className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm h-32 resize-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Priority Level</label>
                <div className="flex gap-3">
                  {["Low", "Medium", "High"].map((p) => (
                    <button
                      key={p}
                      className="flex-1 py-3 bg-slate-50 text-[10px] font-bold text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-800 border border-transparent hover:border-slate-200 transition-all"
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button className="w-full py-4 bg-rose-500 text-white rounded-2xl text-sm font-bold shadow-xl shadow-rose-200 hover:bg-rose-600 active:scale-95 transition-all">
                Broadcast Blocker
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EngineerDashboard;
