import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";
import { useAuth } from "../../context/AuthContext";


const projects = ["NH-44 Highway Widening", "Metro Rail Phase 2", "Smart City – Nagpur", "Flyover Bridge – Wardha Road"];

const EngineerSettingsPage = () => {
  const { user, logout } = useAuth();
  const [selectedProject, setSelectedProject] = useState(projects[0]);
  const [unit, setUnit] = useState<"Metric" | "Imperial">("Metric");
  const [notifications, setNotifications] = useState({ dsr: true, issues: true, approval: true, daily: false });
  const [saved, setSaved] = useState(false);

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  return (
    <DashboardLayout>
      <Navbar title="Settings" breadcrumb={["InfraPilot", "Engineer", "Settings"]} />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        {/* Profile Card */}
        <div className="bg-primary p-6 rounded-2xl text-white mb-8 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-black">
            {user?.name.charAt(0)}
          </div>
          <div>
            <p className="text-lg font-bold">{user?.name}</p>
            <p className="text-blue-100 text-sm">{user?.role}</p>
            <p className="text-blue-200 text-xs mt-0.5">📱 {user?.mobile}</p>
          </div>
        </div>

        {/* Project Selection */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">🏗️ Project Selection</h2>
          <div className="space-y-2">
            {projects.map(p => (
              <button key={p} onClick={() => setSelectedProject(p)}
                className={`w-full flex items-center justify-between p-4 rounded-xl border text-sm font-semibold transition-all text-left ${selectedProject === p ? "bg-blue-50 border-primary text-primary" : "bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200"}`}>
                <span>{p}</span>
                {selectedProject === p && <span className="text-primary text-base">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Units */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">📏 Measurement Units</h2>
          <div className="flex gap-3">
            {[
              { label: "Metric", sub: "Kg / Meter / m²", val: "Metric" as const },
              { label: "Imperial", sub: "Lb / Feet / ft²", val: "Imperial" as const },
            ].map(u => (
              <button key={u.val} onClick={() => setUnit(u.val)}
                className={`flex-1 py-4 rounded-xl border-2 transition-all ${unit === u.val ? "bg-blue-50 border-primary" : "bg-slate-50 border-slate-100"}`}>
                <p className={`text-sm font-bold ${unit === u.val ? "text-primary" : "text-slate-600"}`}>{u.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{u.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-4">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">🔔 Notification Settings</h2>
          <div className="space-y-4">
            {[
              { key: "dsr" as const, label: "DSR Reminder", sub: "Daily at 5 PM" },
              { key: "issues" as const, label: "Issue Alerts", sub: "When new issue raised" },
              { key: "approval" as const, label: "Approval Updates", sub: "When request approved/rejected" },
              { key: "daily" as const, label: "Daily Summary", sub: "Morning project summary" },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-bold text-slate-700">{n.label}</p>
                  <p className="text-xs text-slate-400">{n.sub}</p>
                </div>
                <button onClick={() => setNotifications({ ...notifications, [n.key]: !notifications[n.key] })}
                  className={`w-12 h-6 rounded-full transition-all duration-200 relative ${notifications[n.key] ? "bg-primary" : "bg-slate-200"}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${notifications[n.key] ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* User Preferences */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">⚙️ User Preferences</h2>
          <div className="space-y-3">
            {[
              { label: "Language", val: "English" },
              { label: "Date Format", val: "DD/MM/YYYY" },
              { label: "App Version", val: "v1.0.0" },
            ].map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <p className="text-sm font-semibold text-slate-600">{p.label}</p>
                <p className="text-sm font-bold text-slate-800">{p.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave}
          className={`w-full py-4 rounded-2xl text-base font-bold shadow-xl transition-all active:scale-95 mb-4 ${saved ? "bg-success shadow-green-200" : "bg-primary shadow-primary/30"} text-white`}>
          {saved ? "✅ Saved!" : "Save Settings"}
        </button>

        {/* Logout */}
        <button onClick={logout}
          className="w-full py-4 bg-white border-2 border-red-100 text-danger rounded-2xl text-sm font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2">
          🚪 Logout
        </button>
      </div>
    </DashboardLayout>
  );
};
export default EngineerSettingsPage;
