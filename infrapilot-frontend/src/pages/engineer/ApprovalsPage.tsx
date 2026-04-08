import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

interface Request {
  id: number;
  type: "Material Request" | "Work Approval";
  description: string;
  quantity: string;
  requestedBy: string;
  approvedBy: string;
  status: "Pending" | "Approved" | "Rejected";
  date: string;
  remarks: string;
}

const initRequests: Request[] = [
  { id: 1, type: "Material Request", description: "100 bags OPC 53 cement required for column casting Block B", quantity: "100 Bags", requestedBy: "Ravi Kumar", approvedBy: "Priya Nair", status: "Approved",  date: "2025-04-01", remarks: "Approved urgently" },
  { id: 2, type: "Work Approval",    description: "Permission to start shuttering for Floor 2 slab", quantity: "—", requestedBy: "Ravi Kumar", approvedBy: "—",         status: "Pending",   date: "2025-04-03", remarks: "" },
  { id: 3, type: "Material Request", description: "50 TMT rods 12mm dia for beam reinforcement", quantity: "50 Nos",   requestedBy: "Ravi Kumar", approvedBy: "—",         status: "Pending",   date: "2025-04-04", remarks: "" },
  { id: 4, type: "Work Approval",    description: "Permission to break Section 4A wall for MEP routing", quantity: "—", requestedBy: "Ravi Kumar", approvedBy: "Priya Nair", status: "Rejected",  date: "2025-03-30", remarks: "Structural concern, redesign needed" },
  { id: 5, type: "Material Request", description: "5 tonnes river sand for plastering works", quantity: "5 Ton",    requestedBy: "Ravi Kumar", approvedBy: "Priya Nair", status: "Approved",  date: "2025-03-28", remarks: "" },
];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

const statusStyle: Record<string, string> = {
  Approved: "bg-green-50 text-success",
  Pending:  "bg-orange-50 text-warning",
  Rejected: "bg-red-50 text-danger",
};

const ApprovalsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isMaterial = location.pathname.includes("/material");
  const isWork     = location.pathname.includes("/work");
  const tab        = isMaterial ? "material" : isWork ? "work" : "all";

  const [requests, setRequests] = useState<Request[]>(initRequests);
  const [showModal, setShowModal] = useState(false);
  const [reqType, setReqType]   = useState<"Material Request" | "Work Approval">("Material Request");

  const [form, setForm] = useState({
    description: "", quantity: "", requestedBy: "", remarks: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const filtered = requests.filter(r =>
    tab === "all" ? true : tab === "material" ? r.type === "Material Request" : r.type === "Work Approval"
  );

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.description.trim()) errs.description = "Description required hai";
    else if (form.description.trim().length < 10) errs.description = "Thodi aur detail dalo (min 10 characters)";
    if (reqType === "Material Request" && !form.quantity.trim()) errs.quantity = "Quantity required hai";
    if (!form.requestedBy.trim()) errs.requestedBy = "Requested by naam required hai";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const id = Math.max(...requests.map(r => r.id)) + 1;
    setRequests(prev => [...prev, {
      id, type: reqType,
      description: form.description,
      quantity: reqType === "Material Request" ? form.quantity : "—",
      requestedBy: form.requestedBy,
      approvedBy: "—",
      status: "Pending",
      date: new Date().toISOString().split("T")[0],
      remarks: form.remarks,
    }]);
    setShowModal(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setForm({ description: "", quantity: "", requestedBy: "", remarks: "" });
    setErrors({});
  };

  const openModal = (type: "Material Request" | "Work Approval") => {
    setReqType(type); setShowModal(true);
    setForm({ description: "", quantity: "", requestedBy: "", remarks: "" });
    setErrors({});
  };

  return (
    <DashboardLayout>
      <Navbar title="Approvals & Requests" breadcrumb={["InfraPilot", "Engineer", "Approvals"]} />

      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total",    value: requests.length, icon: "📋", color: "bg-blue-50 text-blue-600" },
            { label: "Pending",  value: requests.filter(r => r.status === "Pending").length,  icon: "⏳", color: "bg-orange-50 text-orange-600" },
            { label: "Approved", value: requests.filter(r => r.status === "Approved").length, icon: "✅", color: "bg-green-50 text-green-600" },
            { label: "Rejected", value: requests.filter(r => r.status === "Rejected").length, icon: "❌", color: "bg-red-50 text-red-600" },
          ].map((c, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-24">
              <span className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center text-base`}>{c.icon}</span>
              <div>
                <p className="text-xl font-bold text-slate-800 leading-none">{c.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-5">
          <button onClick={() => openModal("Material Request")}
            className="flex-1 py-3 bg-primary text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-primary/30 active:scale-95 transition-all">
            📦 Material Request
          </button>
          <button onClick={() => openModal("Work Approval")}
            className="flex-1 py-3 bg-white text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest border border-slate-200 active:scale-95 transition-all hover:border-slate-300">
            🔨 Work Approval
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-success text-sm font-semibold px-4 py-3 rounded-xl mb-4">
            ✅ Request successfully submit ho gaya!
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { label: "📋 All",      path: "/engineer/approvals" },
            { label: "📦 Material", path: "/engineer/approvals/material" },
            { label: "🔨 Work",     path: "/engineer/approvals/work" },
          ].map(t => (
            <button key={t.path} onClick={() => navigate(t.path)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                tab === (t.path.includes("material") ? "material" : t.path.includes("work") ? "work" : "all")
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-3">
          {filtered.map(req => (
            <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      req.type === "Material Request" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                    }`}>
                      {req.type === "Material Request" ? "📦" : "🔨"} {req.type}
                    </span>
                    <span className="text-[10px] text-slate-400">{req.date}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-800 leading-snug">{req.description}</p>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap ml-2 ${statusStyle[req.status]}`}>
                  {req.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2">
                {[
                  { label: "Quantity",      val: req.quantity },
                  { label: "Requested By",  val: req.requestedBy },
                  { label: "Approved By",   val: req.approvedBy },
                ].map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                    <p className="text-xs font-bold text-slate-700 truncate">{s.val}</p>
                    <p className="text-[9px] text-slate-400 uppercase mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {req.remarks && (
                <div className="bg-slate-50 rounded-xl px-3 py-2">
                  <p className="text-[10px] text-slate-400">Remarks: <span className="font-semibold text-slate-600">{req.remarks}</span></p>
                </div>
              )}

              {req.status === "Pending" && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                  <button className="flex-1 py-2 text-xs font-bold rounded-xl bg-slate-50 text-slate-500 border border-slate-200 hover:border-slate-300 transition-all">
                    ✏️ Edit
                  </button>
                  <button className="flex-1 py-2 text-xs font-bold rounded-xl bg-red-50 text-danger border border-red-100 hover:bg-red-100 transition-all"
                    onClick={() => setRequests(prev => prev.filter(r => r.id !== req.id))}>
                    🗑️ Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm font-bold">Koi request nahi mili</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">
                {reqType === "Material Request" ? "📦 Material Request" : "🔨 Work Approval"}
              </h3>
              <button onClick={() => { setShowModal(false); setErrors({}); }} className="text-slate-400 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              {/* Request Type toggle */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Request Type</label>
                <div className="flex gap-3">
                  {(["Material Request", "Work Approval"] as const).map(t => (
                    <button key={t} type="button" onClick={() => setReqType(t)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        reqType === t ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-500 border-slate-200"
                      }`}>
                      {t === "Material Request" ? "📦 Material" : "🔨 Work"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Description *</label>
                <textarea className={`${inp} resize-none ${errors.description ? "!border-danger" : ""}`} rows={3}
                  placeholder="Request ki detail mein description dalo..."
                  value={form.description}
                  onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(f => ({ ...f, description: "" })); }} />
                {errors.description && <p className={errMsg}>⚠ {errors.description}</p>}
              </div>
              {/* Quantity (Material only) */}
              {reqType === "Material Request" && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Quantity *</label>
                  <input className={`${inp} ${errors.quantity ? "!border-danger" : ""}`}
                    placeholder="e.g. 100 Bags / 5 Ton / 50 Nos"
                    value={form.quantity}
                    onChange={e => { setForm(f => ({ ...f, quantity: e.target.value })); setErrors(f => ({ ...f, quantity: "" })); }} />
                  {errors.quantity && <p className={errMsg}>⚠ {errors.quantity}</p>}
                </div>
              )}
              {/* Requested By */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Requested By *</label>
                <input className={`${inp} ${errors.requestedBy ? "!border-danger" : ""}`}
                  placeholder="Aapka naam"
                  value={form.requestedBy}
                  onChange={e => { setForm(f => ({ ...f, requestedBy: e.target.value })); setErrors(f => ({ ...f, requestedBy: "" })); }} />
                {errors.requestedBy && <p className={errMsg}>⚠ {errors.requestedBy}</p>}
              </div>
              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Remarks (optional)</label>
                <input className={inp} placeholder="Koi additional note..."
                  value={form.remarks}
                  onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
              <button onClick={handleSubmit}
                className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all">
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ApprovalsPage;
