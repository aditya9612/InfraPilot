import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

interface Worker {
  id: number;
  name: string;
  aadhaar: string;
  contractor: string;
  workType: string;
  attendance: "Present" | "Absent";
  inTime: string;
  outTime: string;
  hours: number;
  overtime: number;
  wage: number;
}

const initWorkers: Worker[] = [
  { id: 1, name: "Rajesh Yadav", aadhaar: "XXXX-1234", contractor: "Sharma Contractors", workType: "Mason", attendance: "Present", inTime: "07:30", outTime: "17:30", hours: 10, overtime: 2, wage: 650 },
  { id: 2, name: "Sunil Paswan", aadhaar: "XXXX-5678", contractor: "Sharma Contractors", workType: "Helper", attendance: "Present", inTime: "07:45", outTime: "17:00", hours: 9, overtime: 1, wage: 450 },
  { id: 3, name: "Manoj Tiwari", aadhaar: "XXXX-9012", contractor: "Verma Builders", workType: "Carpenter", attendance: "Absent", inTime: "—", outTime: "—", hours: 0, overtime: 0, wage: 700 },
  { id: 4, name: "Deepak Nishad", aadhaar: "XXXX-3456", contractor: "Verma Builders", workType: "Welder", attendance: "Present", inTime: "08:00", outTime: "18:00", hours: 10, overtime: 2, wage: 750 },
  { id: 5, name: "Vijay Kumar", aadhaar: "XXXX-7890", contractor: "Singh & Sons", workType: "Helper", attendance: "Present", inTime: "07:30", outTime: "16:30", hours: 9, overtime: 0, wage: 450 },
];

const WORK_TYPES = ["Mason", "Helper", "Carpenter", "Welder", "Electrician", "Plumber", "Painter", "Bar Bender"];
const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

const LaborManagementPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDetails = location.pathname.includes("/details");
  const activeTab = isDetails ? "details" : "attendance";

  const [workers, setWorkers] = useState<Worker[]>(initWorkers);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newWorker, setNewWorker] = useState({
    name: "", aadhaar: "", contractor: "", workType: "Mason", wage: "",
    attendance: "Present" as "Present" | "Absent",
    inTime: "08:00", outTime: "17:00", hours: "9", overtime: "0"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const present = workers.filter(w => w.attendance === "Present").length;

  const toggleAttendance = (id: number) => {
    setWorkers(prev => prev.map(w =>
      w.id === id
        ? {
          ...w, attendance: w.attendance === "Present" ? "Absent" : "Present",
          inTime: w.attendance === "Present" ? "—" : "08:00",
          outTime: w.attendance === "Present" ? "—" : "17:00",
          hours: w.attendance === "Present" ? 0 : 9
        }
        : w
    ));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!newWorker.name.trim()) errs.name = "Worker naam required hai";
    if (!newWorker.aadhaar.trim()) errs.aadhaar = "Aadhaar / ID required hai";
    else if (!/^[X\d]{4}[-\s]?[X\d]{4}[-\s]?[X\d]{4}$/i.test(newWorker.aadhaar))
      errs.aadhaar = "Valid Aadhaar format dalo (e.g. XXXX-XXXX-1234)";
    if (!newWorker.contractor.trim()) errs.contractor = "Contractor naam required hai";
    if (!newWorker.wage || isNaN(Number(newWorker.wage)) || Number(newWorker.wage) <= 0)
      errs.wage = "Valid wage rate dalo";

    if (newWorker.attendance === "Present") {
      if (!newWorker.inTime) errs.inTime = "In time required";
      if (!newWorker.outTime) errs.outTime = "Out time required";
      if (!newWorker.hours || Number(newWorker.hours) < 0) errs.hours = "Valid hours dalo";
    }
    return errs;
  };

  const handleAddWorker = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const id = Date.now();
    setWorkers(prev => [...prev, {
      id, name: newWorker.name, aadhaar: newWorker.aadhaar,
      contractor: newWorker.contractor, workType: newWorker.workType,
      attendance: newWorker.attendance,
      inTime: newWorker.attendance === "Present" ? newWorker.inTime : "—",
      outTime: newWorker.attendance === "Present" ? newWorker.outTime : "—",
      hours: Number(newWorker.hours) || 0,
      overtime: Number(newWorker.overtime) || 0,
      wage: Number(newWorker.wage),
    }]);
    setShowAddModal(false);
    setNewWorker({ name: "", aadhaar: "", contractor: "", workType: "Mason", wage: "", attendance: "Present", inTime: "08:00", outTime: "17:00", hours: "9", overtime: "0" });
    setErrors({});
  };

  return (
    <DashboardLayout>
      <Navbar title="Labor Management" breadcrumb={["InfraPilot", "Engineer", "Labor"]}
        action={{ label: "+ Add Worker", onClick: () => setShowAddModal(true) }} />

      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">

        {/* Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Total Workers", value: workers.length, icon: "👷", color: "bg-blue-50 text-blue-600" },
            { label: "Present Today", value: present, icon: "✅", color: "bg-green-50 text-green-600" },
            { label: "Absent Today", value: workers.length - present, icon: "❌", color: "bg-red-50 text-red-600" },
            { label: "Total OT Hrs", value: `${workers.reduce((s, w) => s + w.overtime, 0)}h`, icon: "⏱️", color: "bg-orange-50 text-orange-600" },
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

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[
            { label: "📅 Attendance", path: "/engineer/labor/attendance" },
            { label: "👤 Labor Details", path: "/engineer/labor/details" },
          ].map(tab => (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === (tab.path.includes("details") ? "details" : "attendance")
                ? "bg-primary text-white shadow-lg shadow-primary/30"
                : "bg-white text-slate-400 border border-slate-100 hover:border-slate-200"
                }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "attendance" && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{today}</p>
              <div className="flex gap-2 text-[10px] font-bold">
                <span className="bg-green-50 text-success px-2 py-1 rounded-full">{present} Present</span>
                <span className="bg-red-50 text-danger px-2 py-1 rounded-full">{workers.length - present} Absent</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="divide-y divide-slate-50">
                {workers.map(w => (
                  <div key={w.id} className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {w.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{w.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{w.workType} · {w.contractor}</p>
                      </div>
                      <button onClick={() => toggleAttendance(w.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${w.attendance === "Present"
                          ? "bg-green-50 text-success border border-green-200 hover:bg-red-50 hover:text-danger"
                          : "bg-red-50 text-danger border border-red-200 hover:bg-green-50 hover:text-success"
                          }`}>
                        {w.attendance}
                      </button>
                    </div>
                    {w.attendance === "Present" && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 ml-12">
                        {[
                          { label: "In Time", val: w.inTime, icon: "🌅" },
                          { label: "Out Time", val: w.outTime, icon: "🌇" },
                          { label: "Work Hrs", val: `${w.hours}h`, icon: "⏱️" },
                          { label: "Overtime", val: `${w.overtime}h`, icon: "➕" },
                        ].map((s, i) => (
                          <div key={i} className="bg-slate-50 rounded-xl p-2 text-center border border-slate-100">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center justify-center gap-1">
                              <span>{s.icon}</span> {s.label}
                            </p>
                            <p className="text-xs font-bold text-slate-700">{s.val}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {activeTab === "details" && (
          <div className="space-y-3">
            {workers.map(w => (
              <div key={w.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold flex-shrink-0">
                    {w.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{w.name}</p>
                    <p className="text-[10px] text-slate-400">{w.workType} · {w.contractor}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${w.attendance === "Present" ? "bg-green-50 text-success" : "bg-red-50 text-danger"}`}>{w.attendance}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "Aadhaar / ID", val: w.aadhaar },
                    { label: "Wage / Day", val: `₹${w.wage}` },
                    { label: "Hours Worked", val: `${w.hours}h` },
                    { label: "Overtime", val: `${w.overtime}h` },
                  ].map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-xs font-bold text-slate-700">{s.val}</p>
                      <p className="text-[9px] text-slate-400 uppercase mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">+ Add Worker</h3>
              <button onClick={() => { setShowAddModal(false); setErrors({}); }} className="text-slate-400 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Worker Name *</label>
                <input className={`${inp} ${errors.name ? "!border-danger" : ""}`} placeholder="Full name" value={newWorker.name} onChange={e => setNewWorker({ ...newWorker, name: e.target.value })} />
                {errors.name && <p className={errMsg}>⚠ {errors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">ID / Aadhaar *</label>
                  <input className={`${inp} ${errors.aadhaar ? "!border-danger" : ""}`} placeholder="XXXX-XXXX-XXXX" value={newWorker.aadhaar} onChange={e => setNewWorker({ ...newWorker, aadhaar: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Contractor *</label>
                  <input className={`${inp} ${errors.contractor ? "!border-danger" : ""}`} placeholder="Firm name" value={newWorker.contractor} onChange={e => setNewWorker({ ...newWorker, contractor: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Work Type</label>
                  <select className={inp} value={newWorker.workType} onChange={e => setNewWorker({ ...newWorker, workType: e.target.value })}>{WORK_TYPES.map(t => <option key={t}>{t}</option>)}</select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Wage Rate *</label>
                  <input type="number" className={`${inp} ${errors.wage ? "!border-danger" : ""}`} placeholder="650" value={newWorker.wage} onChange={e => setNewWorker({ ...newWorker, wage: e.target.value })} />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-3">Attendance & Timing</label>
                <div className="flex gap-2 mb-4">
                  {["Present", "Absent"].map(a => (
                    <button key={a} type="button" onClick={() => setNewWorker({ ...newWorker, attendance: a as any })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${newWorker.attendance === a ? "bg-primary text-white border-primary" : "bg-white text-slate-400 border-slate-200"}`}>
                      {a === "Present" ? "✅ Present" : "❌ Absent"}
                    </button>
                  ))}
                </div>

                {newWorker.attendance === "Present" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">In Time</label>
                        <input type="time" className={inp} value={newWorker.inTime} onChange={e => setNewWorker({ ...newWorker, inTime: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Out Time</label>
                        <input type="time" className={inp} value={newWorker.outTime} onChange={e => setNewWorker({ ...newWorker, outTime: e.target.value })} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Working Hours</label>
                        <input type="number" className={inp} value={newWorker.hours} onChange={e => setNewWorker({ ...newWorker, hours: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Overtime (Hrs)</label>
                        <input type="number" className={inp} value={newWorker.overtime} onChange={e => setNewWorker({ ...newWorker, overtime: e.target.value })} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={handleAddWorker} className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all">Add Worker</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LaborManagementPage;
