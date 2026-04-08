import { useState } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────
interface Report {
  id: number;
  name: string;
  type: string;
  generatedDate: string;
  status: "Ready" | "Generating" | "Error";
  size: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const initReports: Report[] = [
  { id: 1, name: "Daily Progress - 04 Apr", type: "Daily Progress", generatedDate: "04 Apr 2025", status: "Ready", size: "1.2 MB" },
  { id: 2, name: "Labor Attendance - W14", type: "Labor", generatedDate: "01 Apr 2025", status: "Ready", size: "2.4 MB" },
  { id: 3, name: "Material Stock Audit", type: "Material", generatedDate: "28 Mar 2025", status: "Ready", size: "1.5 MB" },
];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

// ── Main Page ──────────────────────────────────────────────────────────────
const ReportsPage = () => {
  const [reports, setReports] = useState<Report[]>(initReports);
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    type: "Daily Progress",
    customNote: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = reports.filter(r => filter === "All" || r.type === filter);

  const handleDownload = (report: Report) => {
    alert(`Downloading Report: ${report.name}\nFile: ${report.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this report?")) {
      setReports(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleEdit = (report: Report) => {
    setEditingId(report.id);
    setFormData({
      name: report.name,
      type: report.type,
      customNote: ""
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      setErrors({ name: "Report name required" });
      return;
    }

    if (editingId) {
      setReports(prev => prev.map(r => r.id === editingId ? { ...r, name: formData.name, type: formData.type } : r));
    } else {
      setReports([
        {
          id: Date.now(),
          name: formData.name,
          type: formData.type,
          generatedDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          status: "Ready",
          size: "1.0 MB"
        },
        ...reports
      ]);
    }
    setShowModal(false);
    setEditingId(null);
    setFormData({ name: "", type: "Daily Progress", customNote: "" });
    setErrors({});
  };

  return (
    <DashboardLayout>
      <Navbar title="Project Reports" breadcrumb={["InfraPilot", "Engineer", "Reports"]}
        action={{ label: "+ Generate Report", onClick: () => { setEditingId(null); setShowModal(true); } }} />

      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
        {/* Type Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {(["All", "Daily Progress", "Labor", "Material", "Issue"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${filter === f ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"}`}>
              {f}
            </button>
          ))}
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(report => (
            <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:border-primary/20 transition-all flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${report.type.includes("Daily") ? "bg-blue-50 text-blue-600" : report.type.includes("Labor") ? "bg-orange-50 text-orange-600" : "bg-purple-50 text-purple-600"}`}>
                    {report.type}
                  </span>
                  <span className="text-[10px] font-bold text-success uppercase">{report.status}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1 group-hover:text-primary transition-colors">{report.name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{report.generatedDate} · {report.size}</p>
              </div>
              <div className="flex gap-2 mt-5 border-t border-slate-50 pt-4">
                <button onClick={() => handleDownload(report)} className="flex-1 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md active:scale-95 transition-all">
                  📥 Download PDF
                </button>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(report)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-primary transition-all">✏️</button>
                  <button onClick={() => handleDelete(report.id)} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-danger transition-all">🗑️</button>
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-100">
              <p className="text-4xl mb-4 text-slate-300">📊</p>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No reports found</h3>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800 mb-6">{editingId ? "Edit Report Info" : "Generate New Report"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Report Name *</label>
                <input className={`${inp} ${errors.name ? "!border-danger" : ""}`} placeholder="e.g. Weekly Progress Report" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                {errors.name && <p className={errMsg}>⚠ {errors.name}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Report Type</label>
                <select className={inp} value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                  {["Daily Progress", "Labor", "Material", "Issue"].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Additional Note</label>
                <textarea className={`${inp} h-20 resize-none`} placeholder="Add any manual notes..." value={formData.customNote} onChange={e => setFormData({ ...formData, customNote: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleSave} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
                  {editingId ? "Update Info" : "Generate Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ReportsPage;
