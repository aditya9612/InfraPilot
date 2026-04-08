import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

// ── Types ──────────────────────────────────────────────────────────────────
interface Request {
  id: number;
  type: "Material" | "Work" | "Other";
  subject: string;
  description: string;
  quantity?: number;
  unit?: string;
  status: "Pending" | "Approved" | "Rejected";
  priority: "High" | "Medium" | "Low";
  date: string;
}

// ── Mock Data ──────────────────────────────────────────────────────────────
const initRequests: Request[] = [
  { id: 1, type: "Material", subject: "OPC 53 Cement", description: "100 bags cement required for Block B column casting", quantity: 100, unit: "Bags", status: "Approved", priority: "High", date: "01 Apr 2025" },
  { id: 2, type: "Work", subject: "Slab Shuttering", description: "Permission to start shuttering for Floor 2 slab", status: "Pending", priority: "Medium", date: "03 Apr 2025" },
  { id: 3, type: "Material", subject: "TMT Rods 12mm", description: "50 nos rods for beam reinforcement", quantity: 50, unit: "Nos", status: "Pending", priority: "High", date: "04 Apr 2025" },
  { id: 4, type: "Work", subject: "Wall Breaking", description: "Permission to break Section 4A wall for MEP routing", status: "Rejected", priority: "Low", date: "30 Mar 2025" },
];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

// ── Main Page ──────────────────────────────────────────────────────────────
const ApprovalsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isMaterial = location.pathname.includes("/material");
  const isWork = location.pathname.includes("/work");
  const tab = isMaterial ? "material" : isWork ? "work" : "all";

  const [requests, setRequests] = useState<Request[]>(initRequests);
  const [filter, setFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    type: "Material" as Request["type"],
    subject: "",
    priority: "Medium" as Request["priority"],
    quantity: "",
    unit: "Nos",
    description: ""
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = requests.filter(r => {
    const statusMatch = filter === "All" || r.status === filter;
    const typeMatch = tab === "all" ? true : tab === "material" ? r.type === "Material" : r.type === "Work";
    return statusMatch && typeMatch;
  });

  const handleEdit = (req: Request) => {
    setEditingId(req.id);
    setFormData({
      type: req.type,
      subject: req.subject,
      priority: req.priority,
      quantity: req.quantity?.toString() || "",
      unit: req.unit || "Nos",
      description: req.description
    });
    setShowModal(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.subject.trim()) errs.subject = "Subject required";
    if (formData.type === "Work" || formData.type === "Material") {
      if (!formData.quantity || isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0)
        errs.quantity = "Valid quantity required";
    }
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    if (editingId) {
      setRequests(prev => prev.map(r => r.id === editingId ? {
        ...r,
        type: formData.type,
        subject: formData.subject,
        priority: formData.priority,
        description: formData.description,
        quantity: formData.quantity ? Number(formData.quantity) : undefined,
        unit: formData.unit
      } : r));
    } else {
      setRequests([...requests, {
        id: Date.now(),
        type: formData.type,
        subject: formData.subject,
        priority: formData.priority,
        description: formData.description,
        quantity: formData.quantity ? Number(formData.quantity) : undefined,
        unit: formData.unit,
        status: "Pending",
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      }]);
    }
    setShowModal(false);
    setEditingId(null);
    setFormData({ type: "Material", subject: "", priority: "Medium", quantity: "", unit: "Nos", description: "" });
    setErrors({});
  };

  return (
    <DashboardLayout>
      <Navbar title="Approvals & Requests" breadcrumb={["InfraPilot", "Engineer", "Approvals"]}
        action={{ label: "+ New Request", onClick: () => { setShowModal(true); setEditingId(null); } }} />

      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
        {/* Tabs for Filtering by Type */}
        <div className="flex gap-2 mb-5">
          {[
            { label: "📋 All", path: "/engineer/approvals" },
            { label: "📦 Material", path: "/engineer/approvals/material" },
            { label: "🔨 Work", path: "/engineer/approvals/work" },
          ].map(t => (
            <button key={t.path} onClick={() => navigate(t.path)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${tab === (t.path.includes("material") ? "material" : t.path.includes("work") ? "work" : "all") ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Filter by Status */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {(["All", "Pending", "Approved", "Rejected"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${filter === s ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"}`}>
              {s}
            </button>
          ))}
        </div>

        {/* Requests List */}
        <div className="space-y-4">
          {filtered.map(req => (
            <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 hover:border-primary/20 transition-all">
              <div className="flex justify-between items-start mb-3">
                <div className="flex gap-2">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${req.type === "Material" ? "bg-blue-50 text-blue-600" : req.type === "Work" ? "bg-purple-50 text-purple-600" : "bg-orange-50 text-orange-600"}`}>
                    {req.type}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${req.priority === "High" ? "bg-red-50 text-danger" : req.priority === "Medium" ? "bg-yellow-50 text-warning" : "bg-slate-50 text-slate-400"}`}>
                    {req.priority}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{req.date}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${req.status === "Approved" ? "bg-green-50 text-success border-green-100" : req.status === "Rejected" ? "bg-red-50 text-danger border-red-100" : "bg-blue-50 text-primary border-blue-100"}`}>
                    {req.status}
                  </span>
                </div>
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">{req.subject}</h3>
              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{req.description}</p>
              {req.quantity && (
                <div className="mb-4 inline-block bg-slate-50 rounded-lg px-3 py-1.5 text-[10px] font-bold text-slate-600">
                  Quantity: {req.quantity} {req.unit}
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex gap-4">
                  <button onClick={() => handleEdit(req)} className="text-xs font-bold text-slate-400 hover:text-primary transition-colors">✏️ Edit</button>
                  <button onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))} className="text-xs font-bold text-slate-400 hover:text-danger transition-colors">🗑️ Cancel</button>
                </div>
                <button className="text-xs font-bold text-primary hover:underline">View Progress →</button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-white rounded-3xl p-16 text-center border-2 border-dashed border-slate-100">
              <p className="text-4xl mb-4 text-slate-300">📋</p>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No requests found</h3>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-6">{editingId ? "Edit Request" : "+ New Request"}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Request Type</label>
                <div className="flex gap-2">
                  {["Material", "Work", "Other"].map(t => (
                    <button key={t} onClick={() => setFormData({ ...formData, type: t as any })}
                      className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${formData.type === t ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-400 border-slate-200"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Subject *</label>
                <input className={`${inp} ${errors.subject ? "!border-danger" : ""}`} placeholder="e.g. Urgent Cement Requirement" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                {errors.subject && <p className={errMsg}>⚠ {errors.subject}</p>}
              </div>

              {(formData.type === "Material" || formData.type === "Work") && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Quantity *</label>
                    <input type="number" className={`${inp} ${errors.quantity ? "!border-danger" : ""}`} placeholder="Amount" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} />
                    {errors.quantity && <p className={errMsg}>⚠ {errors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Unit</label>
                    <select className={inp} value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })}>
                      {["Nos", "Bags", "Cum", "Rmt", "MT"].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Description</label>
                <textarea className={`${inp} h-24 resize-none`} placeholder="Explain your request..." value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="pt-4 flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold">Cancel</button>
                <button onClick={handleSubmit} className="flex-[2] py-4 bg-primary text-white rounded-2xl font-bold shadow-xl active:scale-95 transition-all">
                  {editingId ? "Update Request" : "Submit Request"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ApprovalsPage;
