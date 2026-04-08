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
  { id: 1, name: "Rajesh Yadav",  aadhaar: "XXXX-1234", contractor: "Sharma Contractors", workType: "Mason",     attendance: "Present", inTime: "07:30", outTime: "17:30", hours: 10, overtime: 2, wage: 650 },
  { id: 2, name: "Sunil Paswan",  aadhaar: "XXXX-5678", contractor: "Sharma Contractors", workType: "Helper",    attendance: "Present", inTime: "07:45", outTime: "17:00", hours: 9,  overtime: 1, wage: 450 },
  { id: 3, name: "Manoj Tiwari",  aadhaar: "XXXX-9012", contractor: "Verma Builders",     workType: "Carpenter", attendance: "Absent",  inTime: "—",     outTime: "—",     hours: 0,  overtime: 0, wage: 700 },
  { id: 4, name: "Deepak Nishad", aadhaar: "XXXX-3456", contractor: "Verma Builders",     workType: "Welder",    attendance: "Present", inTime: "08:00", outTime: "18:00", hours: 10, overtime: 2, wage: 750 },
  { id: 5, name: "Vijay Kumar",   aadhaar: "XXXX-7890", contractor: "Singh & Sons",       workType: "Helper",    attendance: "Present", inTime: "07:30", outTime: "16:30", hours: 9,  overtime: 0, wage: 450 },
];

const WORK_TYPES = ["Mason", "Helper", "Carpenter", "Welder", "Electrician", "Plumber", "Painter", "Bar Bender"];
const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const errMsg = "text-danger text-xs mt-1 font-medium";

const LaborManagementPage = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const isDetails = location.pathname.includes("/details");
  const activeTab = isDetails ? "details" : "attendance";

  const [workers, setWorkers] = useState<Worker[]>(initWorkers);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newWorker, setNewWorker] = useState({
    name: "", aadhaar: "", contractor: "", workType: "Mason", wage: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
  const present = workers.filter(w => w.attendance === "Present").length;

  const toggleAttendance = (id: number) => {
    setWorkers(prev => prev.map(w =>
      w.id === id
        ? { ...w, attendance: w.attendance === "Present" ? "Absent" : "Present",
            inTime: w.attendance === "Present" ? "—" : "08:00",
            outTime: w.attendance === "Present" ? "—" : "17:00",
            hours: w.attendance === "Present" ? 0 : 9 }
        : w
    ));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!newWorker.name.trim())       errs.name       = "Worker naam required hai";
    if (!newWorker.aadhaar.trim())    errs.aadhaar    = "Aadhaar / ID required hai";
    else if (!/^\d{4}[-\s]?\d{4}[-\s]?\d{4}$/.test(newWorker.aadhaar.replace(/X/gi, "0")))
      errs.aadhaar = "Valid Aadhaar format dalo (XXXX-XXXX-XXXX)";
    if (!newWorker.contractor.trim()) errs.contractor = "Contractor naam required hai";
    if (!newWorker.wage || isNaN(Number(newWorker.wage)) || Number(newWorker.wage) <= 0)
      errs.wage = "Valid wage rate dalo (sirf number)";
    return errs;
  };

  const handleAddWorker = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const id = Math.max(...workers.map(w => w.id)) + 1;
    setWorkers(prev => [...prev, {
      id, name: newWorker.name, aadhaar: newWorker.aadhaar,
      contractor: newWorker.contractor, workType: newWorker.workType,
      attendance: "Present", inTime: "08:00", outTime: "17:00",
      hours: 9, overtime: 0, wage: Number(newWorker.wage),
    }]);
    setShowAddModal(false);
    setNewWorker({ name: "", aadhaar: "", contractor: "", workType: "Mason", wage: "" });
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
            { label: "Absent Today",  value: workers.length - present, icon: "❌", color: "bg-red-50 text-red-600" },
            { label: "Total OT Hrs",  value: `${workers.reduce((s, w) => s + w.overtime, 0)}h`, icon: "⏱️", color: "bg-orange-50 text-orange-600" },
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
            { label: "📅 Attendance",    path: "/engineer/labor/attendance" },
            { label: "👤 Labor Details", path: "/engineer/labor/details" },
          ].map(tab => (
            <button key={tab.path} onClick={() => navigate(tab.path)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                activeTab === (tab.path.includes("details") ? "details" : "attendance")
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
                      {/* Toggle attendance */}
                      <button onClick={() => toggleAttendance(w.id)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                          w.attendance === "Present"
                            ? "bg-green-50 text-success border border-green-200 hover:bg-red-50 hover:text-danger hover:border-red-200"
                            : "bg-red-50 text-danger border border-red-200 hover:bg-green-50 hover:text-success hover:border-green-200"
                        }`}>
                        {w.attendance}
                      </button>
                    </div>
                    {w.attendance === "Present" && (
                      <div className="grid grid-cols-3 gap-2 ml-12">
                        {[
                          { label: "In Time",  val: w.inTime },
                          { label: "Out Time", val: w.outTime },
                          { label: "OT Hrs",   val: `${w.overtime}h` },
                        ].map((s, i) => (
                          <div key={i} className="bg-slate-50 rounded-xl p-2 text-center">
                            <p className="text-xs font-bold text-slate-700">{s.val}</p>
                            <p className="text-[9px] text-slate-400 uppercase">{s.label}</p>
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
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    w.attendance === "Present" ? "bg-green-50 text-success" : "bg-red-50 text-danger"
                  }`}>{w.attendance}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: "Aadhaar / ID", val: w.aadhaar },
                    { label: "Wage / Day",   val: `₹${w.wage}` },
                    { label: "Hours Worked", val: `${w.hours}h` },
                    { label: "Overtime",     val: `${w.overtime}h` },
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

      {/* Add Worker Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800">+ Add Worker</h3>
              <button onClick={() => { setShowAddModal(false); setErrors({}); }} className="text-slate-400 text-2xl leading-none">×</button>
            </div>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Worker Name *</label>
                <input className={`${inp} ${errors.name ? "!border-danger" : ""}`}
                  placeholder="Full name"
                  value={newWorker.name}
                  onChange={e => { setNewWorker(f => ({ ...f, name: e.target.value })); setErrors(f => ({ ...f, name: "" })); }} />
                {errors.name && <p className={errMsg}>⚠ {errors.name}</p>}
              </div>
              {/* Aadhaar */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">ID / Aadhaar *</label>
                <input className={`${inp} ${errors.aadhaar ? "!border-danger" : ""}`}
                  placeholder="XXXX-XXXX-XXXX"
                  value={newWorker.aadhaar}
                  onChange={e => { setNewWorker(f => ({ ...f, aadhaar: e.target.value })); setErrors(f => ({ ...f, aadhaar: "" })); }} />
                {errors.aadhaar && <p className={errMsg}>⚠ {errors.aadhaar}</p>}
              </div>
              {/* Contractor */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Contractor Name *</label>
                <input className={`${inp} ${errors.contractor ? "!border-danger" : ""}`}
                  placeholder="Contractor firm"
                  value={newWorker.contractor}
                  onChange={e => { setNewWorker(f => ({ ...f, contractor: e.target.value })); setErrors(f => ({ ...f, contractor: "" })); }} />
                {errors.contractor && <p className={errMsg}>⚠ {errors.contractor}</p>}
              </div>
              {/* Work Type */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Work Type *</label>
                <select className={inp} value={newWorker.workType}
                  onChange={e => setNewWorker(f => ({ ...f, workType: e.target.value }))}>
                  {WORK_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              {/* Wage */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Wage Rate (₹/day) *</label>
                <input type="number" min="1" className={`${inp} ${errors.wage ? "!border-danger" : ""}`}
                  placeholder="e.g. 650"
                  value={newWorker.wage}
                  onChange={e => { setNewWorker(f => ({ ...f, wage: e.target.value })); setErrors(f => ({ ...f, wage: "" })); }} />
                {errors.wage && <p className={errMsg}>⚠ {errors.wage}</p>}
              </div>
              <button onClick={handleAddWorker}
                className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/30 active:scale-95 transition-all">
                Add Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default LaborManagementPage;
