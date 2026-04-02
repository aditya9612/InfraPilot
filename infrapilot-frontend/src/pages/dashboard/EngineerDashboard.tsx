import DashboardLayout from "../../components/common/DashboardLayout";
import { useState } from "react";
import Navbar from "../../components/common/Navbar";

// Mock Data
const initialTasks = [
  { id: 1, name: "Foundation Concrete Pour - Block A", completed: false, priority: "High" },
  { id: 2, name: "Steel Reinforcement Check - Section 2", completed: true, priority: "Medium" },
  { id: 3, name: "Site Safety Walkthrough", completed: false, priority: "High" },
  { id: 4, name: "Material Delivery Inspection", completed: false, priority: "Low" },
];

const activityHistory = [
  { id: 1, type: "report", desc: "Daily Report submitted", time: "09:30 AM", icon: "📝" },
  { id: 2, type: "photo", desc: "4 site photos uploaded", time: "10:15 AM", icon: "📸" },
  { id: 3, type: "issue", desc: "Water leakage reported at Level 2", time: "11:00 AM", icon: "⚠️" },
];

const EngineerDashboard = () => {
  const [tasks, setTasks] = useState(initialTasks);
  const [report, setReport] = useState({ workDone: "", laborCount: "", materialUsed: "" });
  const [showIssueForm, setShowIssueForm] = useState(false);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <DashboardLayout>
        <Navbar
        title="Field Dashboard"
        breadcrumb={["InfraPilot", "Engineer"]}
      />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter pb-24">
        {/* Mobile Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Hi, Ravi 👋</h1>
            <p className="text-slate-400 text-xs font-medium">{today}</p>
          </div>
          <button className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform active:scale-95">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Today Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Labor Today", value: "48", icon: "👷", color: "bg-blue-50 text-blue-600" },
            { label: "Material Usd", value: "6.2t", icon: "🚚", color: "bg-emerald-50 text-emerald-600" },
            { label: "Tasks Done", value: `${tasks.filter(t => t.completed).length}/${tasks.length}`, icon: "✅", color: "bg-purple-50 text-purple-600" },
            { label: "Issues Open", value: "2", icon: "⚠️", color: "bg-red-50 text-red-600" },
          ].map((card, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28">
              <span className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center text-lg`}>{card.icon}</span>
              <div>
                <p className="text-xl font-bold text-slate-800 leading-none">{card.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Project Progress Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[10px]">Current Project</h2>
            <span className="px-2 py-0.5 bg-green-50 text-success text-[10px] font-bold rounded-full uppercase tracking-widest">On Track</span>
          </div>
          <p className="text-base font-bold text-slate-800 mb-1">Metro Extension Ph-II</p>
          <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden mt-3 mb-2">
            <div className="h-full bg-primary transition-all duration-1000" style={{ width: '64%' }} />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-slate-400">
            <span>PILLAR FOUNDATION</span>
            <span>64% COMPLETE</span>
          </div>
        </div>

        {/* Daily Site Report Form */}
        <div className="bg-white p-6 rounded-3xl shadow-md border border-slate-100 mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="text-xl">📝</span> Daily Site Report
          </h2>
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Work Done Overview</label>
              <textarea 
                placeholder="Briefly describe what was completed today..."
                className="w-full bg-slate-50 border-none rounded-2xl p-4 text-sm text-slate-700 focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
                value={report.workDone}
                onChange={e => setReport({...report, workDone: e.target.value})}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Labor Count</label>
                <input 
                  type="number" 
                  placeholder="e.g. 45"
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm text-slate-700"
                  value={report.laborCount}
                  onChange={e => setReport({...report, laborCount: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Materials (t)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 4t Cement"
                  className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm text-slate-700"
                  value={report.materialUsed}
                  onChange={e => setReport({...report, materialUsed: e.target.value})}
                />
              </div>
            </div>
            <button className="w-full py-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-bold hover:bg-slate-100 flex items-center justify-center gap-2 transition-colors">
              <span>📸</span> Upload Site Photos
            </button>
            <button className="w-full py-4 bg-primary text-white rounded-2xl text-base font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all">
              Submit Daily Report
            </button>
          </div>
        </div>

        {/* Task List Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[10px]">Today's Tasks</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {tasks.map(task => (
              <div 
                key={task.id} 
                onClick={() => toggleTask(task.id)}
                className="p-5 flex items-center gap-4 active:bg-slate-50 transition-colors cursor-pointer group"
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                  task.completed ? "bg-primary border-primary text-white" : "border-slate-200 group-hover:border-primary"
                }`}>
                  {task.completed && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-semibold transition-all ${task.completed ? "text-slate-300 line-through" : "text-slate-700"}`}>
                    {task.name}
                  </p>
                  <p className={`text-[10px] font-bold ${task.priority === "High" ? "text-red-400" : "text-slate-300"}`}>
                    PRIORITY: {task.priority.toUpperCase()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-4 px-2">Recent Site Pulse</h2>
          <div className="space-y-4">
            {activityHistory.map(act => (
              <div key={act.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <span className="text-xl">{act.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-700">{act.desc}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{act.time}</p>
                </div>
                <button className="text-[10px] font-bold text-primary hover:underline">VIEW</button>
              </div>
            ))}
          </div>
        </div>

        {/* Issue Reporting Button */}
        <button 
          onClick={() => setShowIssueForm(true)}
          className="w-full py-4 bg-white border-2 border-red-100 text-red-500 rounded-2xl text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2 mb-8"
        >
          <span>🔥</span> Critical Issue Found? Report Now
        </button>

        {/* Bottom Sticky Action */}
        <div className="fixed bottom-6 right-6 lg:hidden">
          <button className="w-14 h-14 bg-primary text-white rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center text-2xl active:scale-90 transition-transform">
            +
          </button>
        </div>
      </div>

      {/* Floating Issue Form Modal (Simulated) */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 italic">Report Issue</h3>
              <button 
                onClick={() => setShowIssueForm(false)}
                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-6">
              <input 
                type="text" 
                placeholder="Issue Title (e.g. Pipe Leak)" 
                className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm"
              />
              <textarea 
                placeholder="Detailed description..." 
                className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm h-32"
              />
              <div className="flex gap-4">
                {["Low", "Medium", "High"].map(p => (
                  <button key={p} className="flex-1 py-3 bg-slate-50 text-[10px] font-bold text-slate-500 rounded-xl hover:bg-slate-100 hover:text-slate-800 border border-transparent hover:border-slate-200">
                    {p.toUpperCase()}
                  </button>
                ))}
              </div>
              <button className="w-full py-4 bg-red-500 text-white rounded-2xl text-base font-bold shadow-xl shadow-red-200 active:scale-95 transition-all">
                Broadcast Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default EngineerDashboard;
