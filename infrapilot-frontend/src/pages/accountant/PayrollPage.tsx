import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

// --- SECTIONS ---


const PayrollKPICards = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all group active:scale-[0.98]">
      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PENDING PAYROLL</p>
      <p className="text-xl font-bold text-slate-800">₹14.2 L</p>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group active:scale-[0.98]">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PAID PAYROLL</p>
      <p className="text-xl font-bold text-slate-800">₹45.5 L</p>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group active:scale-[0.98]">
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ADVANCE GIVEN</p>
      <p className="text-xl font-bold text-slate-800">₹2.1 L</p>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group active:scale-[0.98]">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CONTRACTOR PAYMENT</p>
      <p className="text-xl font-bold text-slate-800">₹1.8 Cr</p>
    </div>
  </div>
);

// 2. Staff Salary Form
const StaffSalaryModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [department, setDepartment] = useState("");
  const [employee, setEmployee] = useState("");

  const employeesByDepartment: Record<string, string[]> = {
    "admin": ["Alice Admin", "Bob Admin"],
    "project manager": ["Charlie PM", "Dave PM"],
    "site engineer": ["Eve Engineer", "Frank Engineer"]
  };

  const currentEmployees = department ? employeesByDepartment[department] : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process Staff Salary"
      maxWidth="max-w-4xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
          <button onClick={() => { toast.success("Salary Processed Successfully!"); onClose(); }} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95">Process Salary</button>
        </>
      }
    >
      <form className="space-y-6" onSubmit={e => e.preventDefault()}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
            Employee Information
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department *</label>
              <select 
                value={department}
                onChange={(e) => { setDepartment(e.target.value); setEmployee(""); }}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500"
              >
                <option value="">Select Department</option>
                <option value="admin">Admin</option>
                <option value="project manager">Project Manager</option>
                <option value="site engineer">Site Engineer</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee Name *</label>
              <select 
                value={employee}
                onChange={(e) => setEmployee(e.target.value)}
                disabled={!department}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500 disabled:opacity-50"
              >
                <option value="">Select Employee</option>
                {currentEmployees?.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee ID *</label><input type="text" placeholder="EMP-000" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 font-mono" /></div>
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation *</label><input type="text" readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100" /></div>
            <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Assigned</label><input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
              Salary Details
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Working Days</label><input type="number" defaultValue="30" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Days</label><input type="number" defaultValue="28" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 font-bold" /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Basic Salary (₹)</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 font-semibold" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">HRA</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Allowances</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overtime</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bonus</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50" /></div>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Salary</label><input type="number" readOnly placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-blue-50 font-bold text-blue-700" /></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
              <span className="w-6 h-6 bg-rose-500 text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
              Deductions
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PF</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-rose-600" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ESIC</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-rose-600" /></div>
              </div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Professional Tax</label><input type="number" placeholder="200" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-rose-600" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salary Advance Recovery</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-rose-600 font-semibold" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loan Recovery</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-rose-600" /></div>
                <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Other Deductions</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-rose-600" /></div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Final Calculation</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-500"><span>Gross Salary</span><span className="font-semibold text-slate-700">—</span></div>
            <div className="flex justify-between text-xs text-rose-500"><span>Total Deductions</span><span className="font-semibold">—</span></div>
            <div className="flex justify-between text-sm font-bold text-emerald-600 border-t border-slate-200 pt-3"><span>Net Pay</span><span>—</span></div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</label><input type="date" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white" /></div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</label>
              <select className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white font-semibold text-amber-600">
                <option>Pending Approval</option><option>Processed</option><option>Paid</option>
              </select>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

const StaffSalaryWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "register");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const tabs = [
    { key: "register", label: "Salary Register" },
    { key: "payslips", label: "Payslips" },
    { key: "history", label: "Salary History" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveSubTab(t.key)}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap">
          + Process Salary
        </button>
      </div>
      
      <StaffSalaryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {activeSubTab === "register" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800">Salary Register</h3><button className="text-xs bg-slate-100 px-3 py-1.5 rounded-lg font-bold text-slate-600">Export CSV</button></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Emp ID", "Name", "Gross Pay", "Deductions", "Net Pay", "Status"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs font-mono">EMP-001</td><td className="px-4 py-3 text-xs font-bold text-slate-800">Amit Kumar</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">₹45,000</td><td className="px-4 py-3 text-xs text-rose-500">₹2,500</td>
                  <td className="px-4 py-3 text-xs font-bold text-blue-600">₹42,500</td><td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold text-[10px] uppercase">Pending</span></td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs font-mono">EMP-002</td><td className="px-4 py-3 text-xs font-bold text-slate-800">Priya Sharma</td>
                  <td className="px-4 py-3 text-xs font-semibold text-slate-600">₹65,000</td><td className="px-4 py-3 text-xs text-rose-500">₹4,200</td>
                  <td className="px-4 py-3 text-xs font-bold text-blue-600">₹60,800</td><td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px] uppercase">Paid</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
      {activeSubTab === "payslips" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3"><div className="text-3xl">📄</div><div><p className="text-sm font-bold text-slate-800">Oct 2024 Payslip</p><p className="text-xs text-slate-500">EMP-00{i}</p></div></div>
              <button className="text-blue-600 hover:text-blue-800"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg></button>
            </div>
          ))}
        </div>
      )}
      {activeSubTab === "history" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Salary Processing History</h3>
          <div className="space-y-4 border-l-2 border-slate-100 ml-2 pl-4">
            <div className="relative"><div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></div><p className="text-xs text-slate-400">Oct 31, 2024</p><p className="text-sm font-bold text-slate-800">October Salary Processed</p><p className="text-xs text-slate-500">Total: ₹12,50,000</p></div>
            <div className="relative"><div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-slate-300 ring-4 ring-white"></div><p className="text-xs text-slate-400">Sep 30, 2024</p><p className="text-sm font-bold text-slate-800">September Salary Processed</p><p className="text-xs text-slate-500">Total: ₹11,80,000</p></div>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Labor Wages
const LaborWagesModal = ({ isOpen, onClose, period }: { isOpen: boolean; onClose: () => void; period: string }) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title={`Record ${period} Labor Wages`}
    maxWidth="max-w-4xl"
    footer={
      <>
        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
        <button onClick={() => { toast.success("Wage Record Saved!"); onClose(); }} className="px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95">Record Wage</button>
      </>
    }
  >
    <form className="space-y-6" onSubmit={e => e.preventDefault()}>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-amber-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
          Labor Details ({period})
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Labor Name *</label><input type="text" placeholder="Select Labor" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Labor Type *</label>
            <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
              <option>Skilled Labor</option><option>Unskilled Labor</option><option>Mason</option><option>Electrician</option>
            </select>
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name *</label><input type="text" placeholder="Select Project" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contractor Name (Optional)</label><input type="text" placeholder="Linked Contractor" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-amber-500 text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
            Wage Details
          </h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance Days</label><input type="number" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 font-bold" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Wage Rate</label><input type="number" placeholder="₹" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 font-semibold" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overtime Hours</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50" /></div>
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Overtime Rate</label><input type="number" placeholder="₹/hr" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50" /></div>
            </div>
            <div className="pt-2 border-t border-slate-100">
              <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Wage</label><input type="number" readOnly placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-amber-50 font-bold text-amber-700" /></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-rose-500 text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
            Deductions
          </h3>
          <div className="space-y-3">
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Advance Recovery</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-rose-600 font-semibold" /></div>
            <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Other Deductions</label><input type="number" placeholder="0" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-rose-600" /></div>
          </div>
        </div>
      </div>
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Final Payment</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-500"><span>Gross Wage</span><span className="font-semibold text-slate-700">—</span></div>
            <div className="flex justify-between text-xs text-rose-500"><span>Deductions</span><span className="font-semibold">—</span></div>
            <div className="flex justify-between text-sm font-bold text-emerald-600 border-t border-slate-200 pt-3"><span>Net Wage</span><span>—</span></div>
          </div>
          <div className="mt-5 space-y-3">
            <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</label><input type="date" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white" /></div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</label>
              <select className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white font-semibold text-amber-600">
                <option>Pending Approval</option><option>Processed</option><option>Paid</option>
              </select>
            </div>
          </div>
        </div>
    </form>
  </Modal>
);

const LaborWagesWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "register");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPeriod, setModalPeriod] = useState("Daily");

  const openModal = (period: string) => {
    setModalPeriod(period);
    setIsModalOpen(true);
  };

  const tabs = [
    { key: "register", label: "Wage Register" }
  ];
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setActiveSubTab(t.key)}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeSubTab === t.key ? "bg-primary/10 text-primary" : "text-slate-500 hover:bg-slate-100"}`}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={() => openModal("Daily")} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all shadow-sm">+ Daily Wage</button>
          <button onClick={() => openModal("Weekly")} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all shadow-sm">+ Weekly Wage</button>
          <button onClick={() => openModal("Monthly")} className="px-4 py-2 bg-amber-500 text-white text-sm font-bold rounded-xl hover:bg-amber-600 transition-all shadow-sm">+ Monthly Wage</button>
        </div>
      </div>
      
      <LaborWagesModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} period={modalPeriod} />
      
      {activeSubTab === "register" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Labor Wage Register</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Labor Name", "Type", "Period", "Gross Wage", "Net Wage", "Status"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <tr className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">Raju Mason</td><td className="px-4 py-3 text-xs text-slate-600">Skilled</td>
                  <td className="px-4 py-3 text-xs text-slate-500">Weekly (W42)</td><td className="px-4 py-3 text-xs text-slate-600">₹4,200</td>
                  <td className="px-4 py-3 text-xs font-bold text-amber-600">₹4,200</td><td className="px-4 py-3 text-xs"><span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold text-[10px] uppercase">Paid</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Contractor Payments
const ContractorPaymentSection = () => (
  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
    <div className="xl:col-span-2 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-emerald-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
          Contractor Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contractor Name *</label><input type="text" placeholder="Select Contractor" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contractor Type *</label>
            <select className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50">
              <option>Civil Contractor</option><option>Electrical Contractor</option><option>Labor Contractor</option>
            </select>
          </div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name *</label><input type="text" placeholder="Select Project" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Order Number</label><input type="text" placeholder="WO-000" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 font-mono" /></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-emerald-500 text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
          Work & Payment
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="col-span-2 md:col-span-4 space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Work Description *</label><input type="text" placeholder="Brief description" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity Executed</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</label><input type="text" placeholder="sq.ft, m3" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rate (₹)</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bill Amount</label><input type="number" readOnly placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-emerald-50 font-bold text-emerald-700" /></div>
        </div>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
          <span className="w-6 h-6 bg-rose-500 text-white text-xs font-black rounded-lg flex items-center justify-center">3</span>
          Deductions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TDS (Sec 194C)</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-rose-600" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retention (5%)</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-rose-600 font-semibold" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Deposit</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-rose-600" /></div>
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Other Deductions</label><input type="number" placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-rose-600" /></div>
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
        <h3 className="text-sm font-bold text-slate-800 mb-5">Final Calculation</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-slate-500"><span>Bill Amount</span><span className="font-semibold text-slate-700">—</span></div>
          <div className="flex justify-between text-xs text-rose-500"><span>Total Deductions</span><span className="font-semibold">—</span></div>
          <div className="flex justify-between text-sm font-bold text-emerald-600 border-t border-slate-100 pt-3"><span>Net Payable</span><span>—</span></div>
        </div>
        <div className="mt-5 space-y-3">
          <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Date</label><input type="date" className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50" /></div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Status</label>
            <select className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 font-semibold text-amber-600">
              <option>Pending Approval</option><option>Processed</option><option>Paid</option>
            </select>
          </div>
        </div>
        <button onClick={() => toast.success("Contractor Bill Saved!")} className="w-full mt-6 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-md">
          Record Payment
        </button>
      </div>
    </div>
  </div>
);

const LedgerSection = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
    <div className="p-5 border-b border-slate-100"><h3 className="font-bold text-slate-800">Payroll Ledger</h3></div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>{["Date", "Employee/Contractor", "Type", "Debit", "Credit", "Balance"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          <tr className="hover:bg-slate-50/50"><td className="px-4 py-3 text-xs text-slate-500">2024-10-31</td><td className="px-4 py-3 text-xs font-bold text-slate-800">Amit Kumar</td><td className="px-4 py-3 text-xs text-slate-600">Salary Processed</td><td className="px-4 py-3 text-xs text-rose-500 font-semibold">—</td><td className="px-4 py-3 text-xs text-emerald-600 font-bold">₹42,500</td><td className="px-4 py-3 text-xs font-bold text-slate-800">₹42,500</td></tr>
        </tbody>
      </table>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

type TabKey = "salary" | "wages" | "contractor" | "ledger";

const TABS: { key: TabKey; label: string }[] = [
  { key: "salary",      label: "Staff Salary" },
  { key: "wages",       label: "Labour Payroll" },
  { key: "contractor",  label: "Contractor Payment" },
  { key: "ledger",      label: "Payroll Register" },
];

const PayrollPage = () => {
  const { category } = useParams<{ category?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const subTab = searchParams.get("sub") || undefined;

  const resolveTab = (): TabKey => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    const lastPart = pathParts[pathParts.length - 1];
    const currentSub = category || lastPart;

    const map: Record<string, TabKey> = {
      "salary": "salary",
      "wages": "wages",
      "contractor": "contractor",
      "ledger": "ledger",
    };
    return map[currentSub || ""] || "salary";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);

  useEffect(() => {
  setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/payroll/${key}`, { replace: true });
  };

  // Per-tab config: title, subtitle, and action buttons
  const TAB_CONFIG: Record<TabKey, { title: string; subtitle: string; actions: React.ReactNode }> = {
    salary: {
      title: "Staff Salary",
      subtitle: "Process and manage monthly staff salaries.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📄</span> Payslips
          </button>
          <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
            <span className="text-base leading-none">⚙️</span> Process Salary
          </button>
        </div>
      ),
    },
    wages: {
      title: "Labour Wages",
      subtitle: "Process and manage daily or monthly labour wages.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📅</span> Attendance
          </button>
          <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
            <span className="text-base leading-none">⚙️</span> Generate Wages
          </button>
        </div>
      ),
    },
    contractor: {
      title: "Contractor Payment",
      subtitle: "Manage and process contractor invoices and payments.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
          <button className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95">
            <span className="text-base leading-none">⚙️</span> Process Bills
          </button>
        </div>
      ),
    },
    ledger: {
      title: "Payroll Register",
      subtitle: "View comprehensive payroll ledger and history.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export
          </button>
        </div>
      ),
    },
  };

  const currentConfig = TAB_CONFIG[activeTab];

  return (
    <>
      <Navbar title="Payroll Management" breadcrumb={["Accountant", "Payroll"]} />

      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">

        {/* ── Section Header ─────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{currentConfig.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{currentConfig.subtitle}</p>
          </div>
          {currentConfig.actions}
        </div>

        {/* ── Tab Navigation ─────────────────────────────── */}
        <div className="flex gap-2 bg-slate-100/70 rounded-xl p-1.5 mb-6 overflow-x-auto w-fit border border-slate-200">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── KPI Stat Cards ─────────────────────────────── */}
        <PayrollKPICards />

        {/* ── Content Rendering ──────────────────────────── */}
        {activeTab === "salary"     && <StaffSalaryWrapper initialSubTab={subTab} key={subTab || "process"} />}
        {activeTab === "wages"      && <LaborWagesWrapper initialSubTab={subTab} key={subTab || "daily"} />}
        {activeTab === "contractor" && <ContractorPaymentSection />}
        {activeTab === "ledger"     && <LedgerSection />}
      </PageTransition>
    </>
  );
};

export default PayrollPage;
