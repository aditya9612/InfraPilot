import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

interface Inspection {
  id: number;
  type: string;
  activity: string;
  testType: string;
  result: string;
  standard: string;
  status: "Pass" | "Fail";
  engineer: string;
  remarks: string;
  date: string;
  report?: string;
}

const initInspections: Inspection[] = [
  { id: 1, type: "Concrete Test",    activity: "Column Casting – B2", testType: "Cube Strength", result: "28.5 MPa",  standard: "25 MPa",     status: "Pass", engineer: "Ravi Kumar", remarks: "Satisfactory", date: "2025-04-01" },
  { id: 2, type: "Slump Test",       activity: "Slab RCC – Floor 2",  testType: "Slump",          result: "80 mm",     standard: "75–100 mm",  status: "Pass", engineer: "Ravi Kumar", remarks: "Within limits", date: "2025-04-02" },
  { id: 3, type: "Steel Inspection", activity: "Foundation Beam",     testType: "Dia & Cover",    result: "Cover 22mm",standard: "25 mm min",  status: "Fail", engineer: "Ravi Kumar", remarks: "Increase cover", date: "2025-04-03" },
  { id: 4, type: "Brickwork Check",  activity: "Wall – Block C",      testType: "Plumb & Level",  result: "2mm off",   standard: "< 5mm",      status: "Pass", engineer: "Ravi Kumar", remarks: "Acceptable",    date: "2025-04-04" },
];

const TEST_TYPES = ["Cube Strength", "Slump", "Compression", "Plumb & Level", "Dia & Cover", "Water Absorption", "Other"];
const INSP_TYPES = ["Concrete Test", "Slump Test", "Steel Inspection", "Brickwork Check", "Plastering Check", "Waterproofing", "Other"];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

const QualityControlPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isTests  = location.pathname.includes("/test-reports");
  const tab      = isTests ? "tests" : "inspections";

  const [inspections, setInspections] = useState<Inspection[]>(initInspections);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    type: "", activity: "", testType: "", result: "", standard: "",
    status: "Pass" as "Pass" | "Fail", engineer: "", remarks: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.type.trim())     errs.type     = "Inspection type required hai";
    if (!form.activity.trim()) errs.activity  = "Activity required hai";
    if (!form.testType.trim()) errs.testType  = "Test type required hai";
    if (!form.result.trim())   errs.result    = "Result required hai";
    if (!form.standard.trim()) errs.standard  = "Standard value required hai";
    if (!form.engineer.trim()) errs.engineer  = "Engineer naam required hai";
    if (!form.date)            errs.date      = "Date required hai";
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const id = Math.max(...inspections.map(i => i.id)) + 1;
    setInspections(prev => [...prev, { id, ...form }]);
    setShowModal(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setForm({ type: "", activity: "", testType: "", result: "", standard: "", status: "Pass", engineer: "", remarks: "", date: new Date().toISOString().split("T")[0] });
    setErrors({});
  };

  const passCount = inspections.filter(i => i.status === "Pass").length;

  return (
    <DashboardLayout>
      <Navbar title="Quality Control" breadcrumb={["InfraPilot", "Engineer", "QC"]}
        action={{ label: "+ New Inspection", onClick: () => setShowModal(true) }} />

      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total",     value: inspections.length, icon: "🔍", color: "bg-blue-50 text-blue-600" },
            { label: "Passed",    value: passCount, icon: "✅", color: "bg-green-50 text-green-600" },
            { label: "Failed",    value: inspections.length - passCount, icon: "❌", color: "bg-red-50 text-red-600" },
            { label: "Pass Rate", value: `${Math.round((passCount / inspections.length) * 100)}%`, icon: "📊", color: "bg-purple-50 text-purple-600" },
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

        {success && (
          <div className="bg-green-50 border border-green-200 text-success text-sm font-semibold px-4 py-3 rounded-xl mb-4">
            ✅ Inspection record save ho gaya!
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { label: "🔍 Inspections",  path: "/engineer/quality-control/inspections" },
            { label: "📋 Test Reports", path: "/engineer/quality-control/test-reports" },
          ].map(t => (
            <button key={t.path} onClick={() => navigate(t.path)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                tab === (t.path.includes("test") ? "tests" : "inspections")
                  ? "bg-primary text-white shadow-lg shadow-primary/30"
                  : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {inspections.map(ins => (
            <div key={ins.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-800">{ins.type}</p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{ins.activity} · {ins.date}</p>
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-full whitespace-nowrap ${
                  ins.status === "Pass" ? "bg-green-50 text-success" : "bg-red-50 text-danger"
                }`}>
                  {ins.status === "Pass" ? "✅ Pass" : "❌ Fail"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { label: "Test Type", val: ins.testType },
                  { label: "Result",    val: ins.result,   cls: ins.status === "Pass" ? "text-success" : "text-danger" },
                  { label: "Standard",  val: ins.standard },
                ].map((s, i) => (
                  <div key={i} className={`rounded-xl p-2 text-center ${i === 1 ? (ins.status === "Pass" ? "bg-green-50" : "bg-red-50") : "bg-slate-50"}`}>
                    <p className={`text-xs font-bold ${s.cls || "text-slate-700"}`}>{s.val}</p>
                    <p className="text-[9px] text-slate-400 uppercase mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {tab === "tests" && (
                <div className="space-y-1 pt-2 border-t border-slate-50">
                  <p className="text-[10px] text-slate-400">Engineer: <span className="font-bold text-slate-600">{ins.engineer}</span></p>
                  {ins.remarks && <p className="text-[10px] text-slate-400">Remarks: <span className="font-semibold text-slate-600">{ins.remarks}</span></p>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">🔍 New Inspection</h3>
              <button onClick={() => { setShowModal(false); setErrors({}); }} className="text-slate-400 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              {/* Inspection Type */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Inspection Type *</label>
                <select className={`${inp} ${errors.type ? "!border-danger" : ""}`} value={form.type}
                  onChange={e => { setForm(f => ({ ...f, type: e.target.value })); setErrors(f => ({ ...f, type: "" })); }}>
                  <option value="">Select type</option>
                  {INSP_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                {errors.type && <p className={errMsg}>⚠ {errors.type}</p>}
              </div>
              {/* Activity */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Activity *</label>
                <input className={`${inp} ${errors.activity ? "!border-danger" : ""}`}
                  placeholder="e.g. Column Casting – B3"
                  value={form.activity}
                  onChange={e => { setForm(f => ({ ...f, activity: e.target.value })); setErrors(f => ({ ...f, activity: "" })); }} />
                {errors.activity && <p className={errMsg}>⚠ {errors.activity}</p>}
              </div>
              {/* Test Type */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Test Type *</label>
                <select className={`${inp} ${errors.testType ? "!border-danger" : ""}`} value={form.testType}
                  onChange={e => { setForm(f => ({ ...f, testType: e.target.value })); setErrors(f => ({ ...f, testType: "" })); }}>
                  <option value="">Select test</option>
                  {TEST_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
                {errors.testType && <p className={errMsg}>⚠ {errors.testType}</p>}
              </div>
              {/* Result + Standard */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Result *</label>
                  <input className={`${inp} ${errors.result ? "!border-danger" : ""}`}
                    placeholder="e.g. 28.5 MPa"
                    value={form.result}
                    onChange={e => { setForm(f => ({ ...f, result: e.target.value })); setErrors(f => ({ ...f, result: "" })); }} />
                  {errors.result && <p className={errMsg}>⚠ {errors.result}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Standard Value *</label>
                  <input className={`${inp} ${errors.standard ? "!border-danger" : ""}`}
                    placeholder="e.g. 25 MPa"
                    value={form.standard}
                    onChange={e => { setForm(f => ({ ...f, standard: e.target.value })); setErrors(f => ({ ...f, standard: "" })); }} />
                  {errors.standard && <p className={errMsg}>⚠ {errors.standard}</p>}
                </div>
              </div>
              {/* Pass / Fail */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Result Status *</label>
                <div className="flex gap-3">
                  {(["Pass", "Fail"] as const).map(s => (
                    <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                        form.status === s
                          ? s === "Pass" ? "bg-green-50 text-success border-green-300" : "bg-red-50 text-danger border-red-300"
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      }`}>
                      {s === "Pass" ? "✅ Pass" : "❌ Fail"}
                    </button>
                  ))}
                </div>
              </div>
              {/* Engineer + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Engineer Name *</label>
                  <input className={`${inp} ${errors.engineer ? "!border-danger" : ""}`}
                    placeholder="Engineer name"
                    value={form.engineer}
                    onChange={e => { setForm(f => ({ ...f, engineer: e.target.value })); setErrors(f => ({ ...f, engineer: "" })); }} />
                  {errors.engineer && <p className={errMsg}>⚠ {errors.engineer}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Date *</label>
                  <input type="date" className={`${inp} ${errors.date ? "!border-danger" : ""}`}
                    value={form.date} max={new Date().toISOString().split("T")[0]}
                    onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(f => ({ ...f, date: "" })); }} />
                  {errors.date && <p className={errMsg}>⚠ {errors.date}</p>}
                </div>
              </div>
              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Remarks</label>
                <textarea className={`${inp} resize-none`} rows={2}
                  placeholder="Observations ya remarks..."
                  value={form.remarks}
                  onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
              {/* Attach Report */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Attach Report</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center cursor-pointer hover:bg-slate-50 transition-colors">
                  <p className="text-xs font-bold text-slate-500">📎 PDF / Image attach karo</p>
                  <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG (max 10MB)</p>
                </div>
              </div>
              <button onClick={handleSubmit}
                className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all">
                Save Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default QualityControlPage;
