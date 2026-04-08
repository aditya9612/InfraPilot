import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

interface CheckItem { id: number; item: string; done: boolean; remark: string; }
interface Incident {
  id: number; date: string; type: string; ppeCompliance: string;
  violationType: string; description: string; injury: string;
  action: string; responsible: string; status: "Open" | "Closed";
}

const initChecklist: CheckItem[] = [
  { id: 1, item: "Safety Helmets worn by all workers",       done: true,  remark: "" },
  { id: 2, item: "Safety Harness used at height work",       done: true,  remark: "" },
  { id: 3, item: "Safety Nets installed at open edges",      done: false, remark: "" },
  { id: 4, item: "Toolbox talk conducted",                   done: true,  remark: "" },
  { id: 5, item: "First Aid Box stocked & accessible",       done: true,  remark: "" },
  { id: 6, item: "Excavation area barricaded",               done: false, remark: "Barricading incomplete at north end" },
  { id: 7, item: "Fire extinguishers checked",               done: true,  remark: "" },
  { id: 8, item: "All electrical connections insulated",     done: true,  remark: "" },
  { id: 9, item: "Housekeeping – site clean",                done: false, remark: "" },
  { id: 10,item: "Work permit obtained (if required)",       done: true,  remark: "" },
];

const initIncidents: Incident[] = [
  { id: 1, date: "2025-04-01", type: "Near Miss",     ppeCompliance: "Good",  violationType: "—",           description: "Worker slipped near wet area",    injury: "None",   action: "Warning board installed",   responsible: "Site Supervisor", status: "Closed" },
  { id: 2, date: "2025-03-28", type: "PPE Violation", ppeCompliance: "Poor",  violationType: "No Helmet",   description: "Helper at height without helmet", injury: "None",   action: "Verbal warning issued",     responsible: "Ravi Kumar",      status: "Closed" },
  { id: 3, date: "2025-04-04", type: "Minor Injury",  ppeCompliance: "Fair",  violationType: "Unsafe Act",  description: "Cut while handling steel rod",    injury: "Minor cut, bandaged", action: "First aid given, PM informed", responsible: "Ravi Kumar", status: "Open" },
];

const INCIDENT_TYPES = ["Near Miss", "PPE Violation", "Minor Injury", "Major Injury", "Property Damage", "Fire / Explosion"];
const VIOLATION_TYPES = ["No Helmet", "No Harness", "No Gloves", "Unsafe Act", "Unsafe Condition", "Working Without Permit", "Other"];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

const SafetyManagementPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isInc    = location.pathname.includes("/incidents");
  const tab      = isInc ? "incidents" : "checklist";

  const [checks, setChecks]       = useState<CheckItem[]>(initChecklist);
  const [incidents, setIncidents] = useState<Incident[]>(initIncidents);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0], type: "", ppeCompliance: "Good",
    violationType: "—", description: "", injury: "", action: "", responsible: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const doneCount = checks.filter(c => c.done).length;
  const pct = Math.round((doneCount / checks.length) * 100);

  const toggleCheck = (id: number) =>
    setChecks(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.date)               errs.date        = "Date required hai";
    if (!form.type)               errs.type        = "Incident type required hai";
    if (!form.description.trim()) errs.description = "Description required hai";
    if (!form.action.trim())      errs.action      = "Action taken required hai";
    if (!form.responsible.trim()) errs.responsible = "Responsible person required hai";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const id = Math.max(...incidents.map(i => i.id)) + 1;
    setIncidents(prev => [...prev, { id, ...form, injury: form.injury || "None", status: "Open" }]);
    setShowModal(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setForm({ date: new Date().toISOString().split("T")[0], type: "", ppeCompliance: "Good", violationType: "—", description: "", injury: "", action: "", responsible: "" });
    setErrors({});
  };

  return (
    <DashboardLayout>
      <Navbar title="Safety Management" breadcrumb={["InfraPilot", "Engineer", "Safety"]}
        action={{ label: "+ Report Incident", onClick: () => setShowModal(true) }} />

      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Checklist Done",   value: `${doneCount}/${checks.length}`, icon: "✅", color: "bg-green-50 text-green-600" },
            { label: "PPE Compliance",   value: `${pct}%`, icon: "🛡️", color: "bg-blue-50 text-blue-600" },
            { label: "Open Incidents",   value: incidents.filter(i => i.status === "Open").length, icon: "🔥", color: "bg-red-50 text-red-600" },
            { label: "PPE Violations",   value: incidents.filter(i => i.type === "PPE Violation").length, icon: "⚠️", color: "bg-orange-50 text-orange-600" },
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

        {/* PPE bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold text-slate-800">Today's Safety Compliance</p>
            <span className={`text-sm font-black ${pct >= 80 ? "text-success" : pct > 50 ? "text-warning" : "text-danger"}`}>{pct}%</span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${pct >= 80 ? "bg-success" : pct > 50 ? "bg-warning" : "bg-danger"}`}
              style={{ width: `${pct}%` }} />
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5">{doneCount} of {checks.length} items completed</p>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-success text-sm font-semibold px-4 py-3 rounded-xl mb-4">
            ✅ Incident report submit ho gaya!
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { label: "☑️ Safety Checklist", path: "/engineer/safety/checklist" },
            { label: "🚨 Incident Reports",  path: "/engineer/safety/incidents" },
          ].map(t => (
            <button key={t.path} onClick={() => navigate(t.path)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                tab === (t.path.includes("incident") ? "incidents" : "checklist")
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Checklist Tab */}
        {tab === "checklist" && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="divide-y divide-slate-50">
              {checks.map(item => (
                <div key={item.id} className="p-4 cursor-pointer active:bg-slate-50"
                  onClick={() => toggleCheck(item.id)}>
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                      item.done ? "bg-primary border-primary" : "border-slate-200 hover:border-primary"
                    }`}>
                      {item.done && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${item.done ? "text-slate-300 line-through" : "text-slate-700"}`}>
                        {item.item}
                      </p>
                      {item.remark && <p className="text-[10px] text-orange-500 font-medium mt-0.5">⚠️ {item.remark}</p>}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      item.done ? "bg-green-50 text-success" : "bg-slate-50 text-slate-400"
                    }`}>
                      {item.done ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Incidents Tab */}
        {tab === "incidents" && (
          <div className="space-y-3">
            {incidents.map(inc => (
              <div key={inc.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{inc.type}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{inc.date} · {inc.responsible}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap ${
                    inc.status === "Open" ? "bg-red-50 text-danger" : "bg-green-50 text-success"
                  }`}>{inc.status}</span>
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: "PPE Compliance",  val: inc.ppeCompliance },
                    { label: "Violation Type",  val: inc.violationType },
                    { label: "Description",     val: inc.description },
                    { label: "Injury Details",  val: inc.injury },
                    { label: "Action Taken",    val: inc.action },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl px-3 py-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{s.label}: </span>
                      <span className="text-xs font-semibold text-slate-700">{s.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Incident Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">🚨 Report Incident</h3>
              <button onClick={() => { setShowModal(false); setErrors({}); }} className="text-slate-400 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Date *</label>
                <input type="date" className={`${inp} ${errors.date ? "!border-danger" : ""}`}
                  value={form.date} max={new Date().toISOString().split("T")[0]}
                  onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(f => ({ ...f, date: "" })); }} />
                {errors.date && <p className={errMsg}>⚠ {errors.date}</p>}
              </div>
              {/* Incident Type */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Incident Type *</label>
                <select className={`${inp} ${errors.type ? "!border-danger" : ""}`} value={form.type}
                  onChange={e => { setForm(f => ({ ...f, type: e.target.value })); setErrors(f => ({ ...f, type: "" })); }}>
                  <option value="">Select type</option>
                  {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                {errors.type && <p className={errMsg}>⚠ {errors.type}</p>}
              </div>
              {/* PPE Compliance */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">PPE Compliance Status</label>
                <div className="flex gap-2">
                  {["Good", "Fair", "Poor"].map(s => (
                    <button key={s} type="button" onClick={() => setForm(f => ({ ...f, ppeCompliance: s }))}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        form.ppeCompliance === s
                          ? s === "Good" ? "bg-green-50 text-success border-green-300"
                            : s === "Fair" ? "bg-orange-50 text-warning border-orange-300"
                            : "bg-red-50 text-danger border-red-300"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}>{s}</button>
                  ))}
                </div>
              </div>
              {/* Violation Type */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Violation Type</label>
                <select className={inp} value={form.violationType}
                  onChange={e => setForm(f => ({ ...f, violationType: e.target.value }))}>
                  <option value="—">None</option>
                  {VIOLATION_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Incident Description *</label>
                <textarea className={`${inp} resize-none ${errors.description ? "!border-danger" : ""}`} rows={3}
                  placeholder="Kya hua? Detail mein batao..."
                  value={form.description}
                  onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setErrors(f => ({ ...f, description: "" })); }} />
                {errors.description && <p className={errMsg}>⚠ {errors.description}</p>}
              </div>
              {/* Injury Details */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Injury Details</label>
                <input className={inp} placeholder="Agar koi injury hai toh batao, warna 'None'"
                  value={form.injury}
                  onChange={e => setForm(f => ({ ...f, injury: e.target.value }))} />
              </div>
              {/* Action Taken */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Action Taken *</label>
                <textarea className={`${inp} resize-none ${errors.action ? "!border-danger" : ""}`} rows={2}
                  placeholder="Turant kya kiya gaya?"
                  value={form.action}
                  onChange={e => { setForm(f => ({ ...f, action: e.target.value })); setErrors(f => ({ ...f, action: "" })); }} />
                {errors.action && <p className={errMsg}>⚠ {errors.action}</p>}
              </div>
              {/* Responsible Person */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Responsible Person *</label>
                <input className={`${inp} ${errors.responsible ? "!border-danger" : ""}`}
                  placeholder="Reporting person ka naam"
                  value={form.responsible}
                  onChange={e => { setForm(f => ({ ...f, responsible: e.target.value })); setErrors(f => ({ ...f, responsible: "" })); }} />
                {errors.responsible && <p className={errMsg}>⚠ {errors.responsible}</p>}
              </div>
              <button onClick={handleSubmit}
                className="w-full py-4 bg-danger text-white rounded-2xl text-sm font-bold shadow-xl shadow-red-200 active:scale-95 transition-all">
                Submit Incident Report
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SafetyManagementPage;
