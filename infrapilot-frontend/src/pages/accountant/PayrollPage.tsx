import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { payrollService } from "../../services/payrollService";
import { paymentService } from "../../services/paymentService";
import { userService } from "../../services/userService";
import { labourService } from "../../services/labourService";
import { contractorService } from "../../services/contractorService";
import { projectService } from "../../services/projectService";
import { accountingService } from "../../services/accountingService";
import { ChevronLeft, ChevronRight, RefreshCw, Plus } from "lucide-react";

// --- SECTIONS ---


const PayrollKPICards = ({ summary }: { summary?: any }) => {
  const s = summary?.data || summary || {};

  const formatCurrency = (val: any) => {
    if (val === undefined || val === null || val === "" || isNaN(Number(val))) return "₹0";
    const num = Number(val);
    return `₹${num.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  };

  const pending = s.pending_due ?? s.pending_payroll ?? s.total_pending ?? s.pending_amount ?? s.pending_wages ?? s.pending ?? s.unpaid_amount ?? 0;
  const paid = s.paid_this_month ?? s.paid_payroll ?? s.total_paid ?? s.paid_amount ?? s.paid ?? s.paid_wages ?? s.total_payout ?? 0;
  const advance = s.advance_given ?? s.advance_logs ?? s.total_advance ?? s.advance_amount ?? s.advance_paid ?? s.advance_adjusted ?? s.advance ?? 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all group active:scale-[0.98]">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PENDING PAYROLL</p>
        <p className="text-xl font-bold text-slate-800">{formatCurrency(pending)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group active:scale-[0.98]">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PAID PAYROLL</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(paid)}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group active:scale-[0.98]">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ADVANCE GIVEN</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(advance)}</p>
            </div>
          </div>
  );
};

const StaffSalaryModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({
    user_id: 0,
    project_id: 0,
    month_year: "",
    gross_salary: 0,
    deductions: 0,
    net_salary: 0,
    payment_mode: "Bank Transfer",
    bank_account_id: 0
  });

  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState<any[]>([]);

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    import('../../services/projectService').then(({ projectService }) => {
      projectService.getProjects().then((res: any) => setProjects(res.items || res.data || []));
    });
    import('../../services/userService').then(({ userService }) => {
      userService.getAllUsers(100).then((res: any) => setUsers(res.items || res.data || []));
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: name.includes("salary") || name === "deductions" || name.includes("_id") ? Number(value) : value };

      if (name === "gross_salary" || name === "deductions") {
        const gross = name === "gross_salary" ? Number(value) : prev.gross_salary;
        const ded = name === "deductions" ? Number(value) : prev.deductions;
        updated.net_salary = gross - ded;
      }
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.user_id || !formData.project_id || !formData.month_year) {
      toast.error("Please select User, Project and Month");
      return;
    }

    setLoading(true);
    try {
      await payrollService.processStaffSalary(formData);
      toast.success("Salary Processed Successfully!");
      onClose();
    } catch (err) {
      toast.error("Failed to process salary");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staff Salary"
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
            {loading ? "Creating..." : "Create Salary"}
          </button>
        </>
      }
    >
      <form id="process-salary-form" className="space-y-6" onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">User (Employee) *</label>
              <select name="user_id" value={formData.user_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500">
                <option value={0}>Select Employee</option>
                {users.map(u => <option key={u.user_id || u.id} value={u.user_id || u.id}>{u.full_name || u.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project *</label>
              <select name="project_id" value={formData.project_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500">
                <option value={0}>Select Project</option>
                {projects.map(p => <option key={p.project_id || p.id} value={p.project_id || p.id}>{p.project_name || p.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Month & Year *</label>
              <input type="month" name="month_year" value={formData.month_year} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gross Salary (₹)</label>
              <input type="number" name="gross_salary" value={formData.gross_salary} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deductions (₹)</label>
              <input type="number" name="deductions" value={formData.deductions} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Salary (₹)</label>
              <input type="number" name="net_salary" value={formData.net_salary} readOnly className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-emerald-50 font-bold text-emerald-700 outline-none" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</label>
              <select name="payment_mode" value={formData.payment_mode} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500">
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Account ID</label>
              <input type="number" name="bank_account_id" value={formData.bank_account_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500" />
            </div>

          </div>
        </div>
      </form>
    </Modal>
  );
};

export const StaffSalaryWrapper = ({ initialSubTab = "process" }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "register");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [staffRegister, setStaffRegister] = useState<any[]>([]);
  const [staffHistory, setStaffHistory] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  useEffect(() => {
    if (activeSubTab === 'register') {
      const fetchRegister = async () => {
        try {
          const data = await payrollService.getStaffRegister();
          setStaffRegister(Array.isArray(data) ? data : data?.data || []);
        } catch (err) {
          toast.error('Failed to load staff register');
        }
      };
      fetchRegister();
    } else if (activeSubTab === 'history') {
      const fetchHistory = async () => {
        try {
          const data = await payrollService.getStaffHistory();
          setStaffHistory(Array.isArray(data) ? data : data?.data || []);
        } catch (err) {
          toast.error('Failed to load history');
        }
      };
      fetchHistory();
    }
  }, [activeSubTab]);



  const tabs = [
    { key: "register", label: "Salary Register" },
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
          Salary
        </button>
      </div>

      <StaffSalaryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      {activeSubTab === "register" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800">Salary Register</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Emp ID", "Name", "Gross Pay", "Deductions", "Net Pay", "Status"].map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staffRegister.length > 0 ? staffRegister.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage).map((emp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs font-mono">{emp.emp_id || `EMP-00${idx + 1}`}</td><td className="px-4 py-3 text-xs font-bold text-slate-800">{emp.name}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600">₹{emp.gross_pay || 0}</td><td className="px-4 py-3 text-xs text-rose-500">₹{emp.deductions || 0}</td>
                    <td className="px-4 py-3 text-xs font-bold text-blue-600">₹{emp.net_pay || 0}</td><td className="px-4 py-3 text-xs"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${emp.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{emp.status || 'Pending'}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-slate-400">No data available</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {staffRegister.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
                <select value={recordsPerPage} onChange={(e) => { setRecordsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white">
                  {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <span className="text-xs text-slate-500 font-semibold">Showing {(currentPage - 1) * recordsPerPage + 1} – {Math.min(currentPage * recordsPerPage, staffRegister.length)} of {staffRegister.length} records</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">{currentPage}</span>
                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(staffRegister.length / recordsPerPage), p + 1))} disabled={currentPage === Math.ceil(staffRegister.length / recordsPerPage)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}
      {activeSubTab === "history" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-slate-800 mb-4">Salary Processing History</h3>
          <div className="space-y-4 border-l-2 border-slate-100 ml-2 pl-4">
            {staffHistory.length > 0 ? staffHistory.map((item, idx) => (
              <div key={idx} className="relative">
                <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-white"></div>
                <p className="text-xs text-slate-400">{item.date || item.month_year || 'Unknown Date'}</p>
                <p className="text-sm font-bold text-slate-800">{item.title || 'Salary Processed'}</p>
                <p className="text-xs text-slate-500">Total: ₹{item.total_amount || item.amount || 0}</p>
              </div>
            )) : (
              <p className="text-sm text-slate-500">No history available.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. Labor Wages
const LaborWagesModal = ({ isOpen, onClose, period }: { isOpen: boolean; onClose: () => void; period: string }) => {
  const [formData, setFormData] = useState({
    labour_id: 0,
    project_id: 0,
    period_type: period ? (period.charAt(0).toUpperCase() + period.slice(1).toLowerCase()) : "Daily",
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    payment_mode: "Bank Transfer",
    bank_account_id: 0
  });
  const [loading, setLoading] = useState(false);
  const [labours, setLabours] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    import('../../services/projectService').then(({ projectService }) => {
      projectService.getProjects().then((res: any) => setProjects(res.items || res.data || []));
    });
    import('../../services/labourService').then(({ labourService }) => {
      labourService.getLabours(null, { limit: 100 }).then((res: any) => setLabours(res.items || res.data || []));
    });
  }, []);

  useEffect(() => {
    if (period) {
      const formatted = period.charAt(0).toUpperCase() + period.slice(1).toLowerCase();
      setFormData(prev => ({
        ...prev,
        period_type: formatted
      }));
    }
  }, [period, isOpen]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes("_id") ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.labour_id || !formData.project_id || !formData.start_date || !formData.end_date) {
      toast.error("Please fill required fields");
      return;
    }
    setLoading(true);
    try {
      await payrollService.payLabourWages({
        ...formData,
        period: formData.period_type,
        period_type: formData.period_type
      });
      toast.success("Wage Record Saved!");
      onClose();
    } catch (err) {
      toast.error("Failed to record wage");
    } finally {
      setLoading(false);
    }
  };

  const displayPeriod = formData.period_type
    ? (formData.period_type.charAt(0).toUpperCase() + formData.period_type.slice(1).toLowerCase())
    : (period || "Daily");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record ${displayPeriod} Labor Wages`}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-50">
            {loading ? "Recording..." : "Record Wage"}
          </button>
        </>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Labor Name *</label>
              <select name="labour_id" value={formData.labour_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-amber-500">
                <option value={0}>Select Labor</option>
                {labours.map(l => <option key={l.labour_id || l.id} value={l.labour_id || l.id}>{l.labour_name || l.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name *</label>
              <select name="project_id" value={formData.project_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-amber-500">
                <option value={0}>Select Project</option>
                {projects.map(p => <option key={p.project_id || p.id} value={p.project_id || p.id}>{p.project_name || p.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Period Type *</label>
              <select name="period_type" value={formData.period_type} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-amber-500 cursor-pointer">
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode *</label>
              <select name="payment_mode" value={formData.payment_mode} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-amber-500 cursor-pointer">
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Date *</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-amber-500" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">End Date *</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-amber-500" />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Account ID</label>
              <input type="number" name="bank_account_id" value={formData.bank_account_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-amber-500" />
            </div>

          </div>
        </div>
      </form>
    </Modal>
  );
};

const LaborWagesWrapper = ({ initialSubTab, onProjectChange }: { initialSubTab?: string, onProjectChange?: (id: string) => void }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "register");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPeriod, setModalPeriod] = useState("Daily");
  const [wages, setWages] = useState<any[]>([]);
  const [labourMap, setLabourMap] = useState<Record<number, string>>({});
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0],
    end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0],
    period_type: "",
    status: "",
    labour_id: "",
    project_id: ""
  });
  const [labours, setLabours] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    import('../../services/projectService').then(({ projectService }) => {
      projectService.getProjects().then((res: any) => setProjects(Array.isArray(res) ? res : res.items || res.data || []));
    });
    import('../../services/labourService').then(({ labourService }) => {
      labourService.getLabours(null, { limit: 100 }).then((res: any) => setLabours(Array.isArray(res) ? res : res.items || res.data || []));
    });
  }, []);
  const [wagePage, setWagePage] = useState(1);
  const [wageRpp, setWageRpp] = useState(10);

  const fetchWages = async () => {
    try {
      const params: any = {
        start_date: filters.start_date,
        end_date: filters.end_date,
      };
      if (filters.period_type) params.period_type = filters.period_type;
      if (filters.status) params.status = filters.status;
      if (filters.labour_id) params.labour_id = Number(filters.labour_id);
      if (filters.project_id) params.project_id = Number(filters.project_id);

      const data = await payrollService.getLabourWages(params);
      setWages(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to load labour wages");
    }
  };

  useEffect(() => {
    labourService.getLabours(undefined, { limit: 200 }).then((res: any) => {
      const items = Array.isArray(res) ? res : (res?.items || res?.data || []);
      const map: Record<number, string> = {};
      items.forEach((l: any) => {
        const id = l.labour_id || l.id;
        const name = l.labour_name || l.name;
        if (id && name) map[id] = name;
      });
      setLabourMap(map);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    if (activeSubTab === "register") {
      fetchWages();
      if (onProjectChange) onProjectChange(filters.project_id);
    }
  }, [activeSubTab, filters.start_date, filters.end_date, filters.period_type, filters.status, filters.labour_id, filters.project_id]);

  const handlePayWage = async (id: number | string) => {
    try {
      await payrollService.payLabourWageById(id, { payment_mode: "Bank Transfer" });
      toast.success("Wage paid successfully");
      fetchWages();
    } catch (error) {
      toast.error("Failed to pay wage");
    }
  };

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
          <button onClick={() => openModal("Daily")} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm">+ Create Labour Wage</button>
        </div>
      </div>

      <LaborWagesModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); fetchWages(); }} period={modalPeriod} />

      {activeSubTab === "register" && (
        <div className="space-y-6">


          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h3 className="font-bold text-slate-800">Labor Wage Register</h3>
                <div className="flex items-center flex-wrap gap-3">
                  <select value={filters.period_type} onChange={e => setFilters(prev => ({ ...prev, period_type: e.target.value }))} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none">
                    <option value="">All Periods</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                  <select value={filters.status} onChange={e => setFilters(prev => ({ ...prev, status: e.target.value }))} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none">
                    <option value="">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                  <select value={filters.project_id} onChange={e => setFilters(prev => ({ ...prev, project_id: e.target.value }))} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none max-w-[150px]">
                    <option value="">All Projects</option>
                    {projects.map(p => <option key={p.project_id || p.id} value={p.project_id || p.id}>{p.project_name || p.name}</option>)}
                  </select>
                  <select value={filters.labour_id} onChange={e => setFilters(prev => ({ ...prev, labour_id: e.target.value }))} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none max-w-[150px]">
                    <option value="">All Labours</option>
                    {labours.map(l => <option key={l.labour_id || l.id} value={l.labour_id || l.id}>{l.labour_name || l.name || "Unknown"}</option>)}
                  </select>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2">
                    <input type="date" value={filters.start_date} onChange={e => setFilters(prev => ({ ...prev, start_date: e.target.value }))} className="px-1 py-1.5 text-sm bg-transparent outline-none" />
                    <span className="text-slate-400 text-xs font-bold tracking-widest">TO</span>
                    <input type="date" value={filters.end_date} onChange={e => setFilters(prev => ({ ...prev, end_date: e.target.value }))} className="px-1 py-1.5 text-sm bg-transparent outline-none" />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>{["Labor Name", "Type", "Period", "Gross Wage", "Net Wage", "Status", "Action"].map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {wages.length > 0 ? wages.slice((wagePage - 1) * wageRpp, wagePage * wageRpp).map((wage, idx) => {
                    const laborName = wage.labor_name || wage.labour_name || wage.labour?.labour_name || wage.labour?.name || wage.name || (wage.labour_id ? (labourMap[wage.labour_id] || `Labour #${wage.labour_id}`) : 'Labor');
                    const laborType = wage.type || wage.labour_type || wage.skill_type || wage.skill_level || wage.category || 'Skilled';
                    const wagePeriod = wage.period || wage.period_type || 'Daily';
                    const grossWage = wage.gross_wage ?? wage.gross_amount ?? wage.gross_salary ?? wage.total_wage ?? wage.amount ?? 0;
                    const netWage = wage.net_wage ?? wage.net_amount ?? wage.net_salary ?? wage.amount ?? wage.net_pay ?? 0;
                    const wageStatus = wage.status || (wage.is_paid ? 'Paid' : 'Paid');

                    return (
                      <tr key={wage.id || idx} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{laborName}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">{laborType}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{wagePeriod}</td>
                        <td className="px-4 py-3 text-xs text-slate-600">₹{Number(grossWage).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-xs font-bold text-amber-600">₹{Number(netWage).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-xs"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${wageStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{wageStatus}</span></td>
                        <td className="px-4 py-3 text-xs">
                          {wageStatus === 'Pending' ? (
                            <button onClick={() => handlePayWage(wage.id)} className="text-[10px] bg-blue-100 text-blue-600 px-2.5 py-1 rounded-lg font-bold hover:bg-blue-200 transition-all">
                              PAY NOW
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-sm font-bold text-slate-400">No wages recorded yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {wages.length > 0 && (
              <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
                  <select value={wageRpp} onChange={(e) => { setWageRpp(Number(e.target.value)); setWagePage(1); }} className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white">
                    {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <span className="text-xs text-slate-500 font-semibold">Showing {(wagePage - 1) * wageRpp + 1} – {Math.min(wagePage * wageRpp, wages.length)} of {wages.length} records</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setWagePage(p => Math.max(1, p - 1))} disabled={wagePage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">{wagePage}</span>
                  <button onClick={() => setWagePage(p => Math.min(Math.ceil(wages.length / wageRpp), p + 1))} disabled={wagePage === Math.ceil(wages.length / wageRpp)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Contractor Payments
const ContractorPaymentModal = ({ isOpen, onClose, bills, onSuccess }: { isOpen: boolean, onClose: () => void, bills: any[], onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    rabill_id: 0,
    paid_amount: 0,
    total_deductions: 0,
    payment_mode: "Bank Transfer",
    bank_account_id: 0
  });
  const [loading, setLoading] = useState(false);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "payment_mode" ? value : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.rabill_id || formData.paid_amount <= 0) {
      toast.error("Please select a bill and enter paid amount");
      return;
    }
    setLoading(true);
    try {
      await payrollService.payContractorBill(formData);
      toast.success("Contractor Bill Saved!");
      setFormData({ rabill_id: 0, paid_amount: 0, total_deductions: 0, payment_mode: "Bank Transfer", bank_account_id: 0 });
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to save contractor payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pay Contractor Bill"
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50">
            {loading ? "Recording..." : "Record Payment"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Bills *</label>
              <select name="rabill_id" value={formData.rabill_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-emerald-500">
                <option value={0}>Select Bill</option>
                {bills.map(b => (
                  <option key={b.id} value={b.id}>{b.bill_number || `Bill #${b.id}`} - {b.quotation?.company_name || b.client?.full_name || 'Contractor'} (Amount: ₹{b.net_amount || b.total_amount || b.gross_amount || 0})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paid Amount (₹) *</label>
                <input type="number" name="paid_amount" value={formData.paid_amount || ""} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Deductions (₹)</label>
                <input type="number" name="total_deductions" value={formData.total_deductions || ""} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-emerald-500" />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Mode</label>
                <select name="payment_mode" value={formData.payment_mode} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-emerald-500">
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {formData.payment_mode === "Bank Transfer" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank Account *</label>
                  <select name="bank_account_id" value={formData.bank_account_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-emerald-500">
                    <option value={0}>Select Bank Account</option>
                  </select>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-500"><span>Paid Amount</span><span className="font-semibold text-slate-700">₹{formData.paid_amount || 0}</span></div>
                <div className="flex justify-between text-xs text-rose-500"><span>Total Deductions</span><span className="font-semibold">₹{formData.total_deductions || 0}</span></div>
                <div className="flex justify-between text-sm font-bold text-emerald-600"><span>Net Total</span><span>₹{(formData.paid_amount || 0) + (formData.total_deductions || 0)}</span></div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export const ContractorPaymentSection = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [billPage, setBillPage] = useState(1);
  const [billRpp, setBillRpp] = useState(10);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchBills = async () => {
    try {
      const data = await payrollService.getContractorBills();
      setBills(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      toast.error("Failed to load contractor bills");
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Contractor Payments</h2>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2.5 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Pay Contractor Bill
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Pending Contractor Bills</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>{["Bill ID", "Contractor", "Amount", "Status"].map(h => <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {bills.length > 0 ? bills.slice((billPage - 1) * billRpp, billPage * billRpp).map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs font-mono">{b.bill_number || `Bill #${b.id}`}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{b.quotation?.company_name || b.client?.full_name || 'Contractor'}</td>
                  <td className="px-4 py-3 text-xs font-bold text-emerald-600">₹{b.net_amount || b.total_amount || b.gross_amount || 0}</td>
                  <td className="px-4 py-3 text-xs text-amber-600 font-bold capitalize">{b.status || 'Pending'}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm font-bold text-slate-400">No pending bills found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {bills.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select value={billRpp} onChange={(e) => { setBillRpp(Number(e.target.value)); setBillPage(1); }} className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white">
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Showing {(billPage - 1) * billRpp + 1} – {Math.min(billPage * billRpp, bills.length)} of {bills.length} records</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setBillPage(p => Math.max(1, p - 1))} disabled={billPage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">{billPage}</span>
              <button onClick={() => setBillPage(p => Math.min(Math.ceil(bills.length / billRpp), p + 1))} disabled={billPage === Math.ceil(bills.length / billRpp)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <ContractorPaymentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          bills={bills}
          onSuccess={fetchBills}
        />
      )}
    </div>
  );
};

const LedgerSection = () => {
  const [registerData, setRegisterData] = useState<any[]>([]);
  const [labours, setLabours] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerRpp, setLedgerRpp] = useState(10);

  const [entities, setEntities] = useState<{
    users: Record<string | number, string>;
    labours: Record<string | number, string>;
    contractors: Record<string | number, string>;
    bills: Record<string | number, string>;
    billsByNumber: Record<string, string>;
  }>({
    users: {},
    labours: {},
    contractors: {},
    bills: {},
    billsByNumber: {},
  });

  const loadLookupData = useCallback(async () => {
    try {
      const [usersRes, laboursRes, contractorsRes, billsRes, staffRegRes] = await Promise.allSettled([
        userService.getAllUsers(200).catch(() => ({ items: [] })),
        labourService.getLabours(undefined, { limit: 500 }).catch(() => ({ items: [] })),
        contractorService.getContractors().catch(() => []),
        payrollService.getContractorBills().catch(() => []),
        payrollService.getStaffRegister().catch(() => []),
      ]);

      const usersMap: Record<string | number, string> = {};
      if (usersRes.status === 'fulfilled' && usersRes.value) {
        const uList = Array.isArray(usersRes.value) ? usersRes.value : (usersRes.value.items || usersRes.value.data || []);
        uList.forEach((u: any) => {
          const uid = u.user_id || u.id;
          const name = u.full_name || u.name || u.email;
          if (uid && name) usersMap[uid] = name;
        });
      }

      const staffMap: Record<string | number, string> = {};
      if (staffRegRes.status === 'fulfilled' && staffRegRes.value) {
        const sList = Array.isArray(staffRegRes.value) ? staffRegRes.value : (staffRegRes.value.data || staffRegRes.value.items || []);
        sList.forEach((s: any) => {
          const sid = s.user_id || s.id || s.emp_id;
          const name = s.name || s.full_name;
          if (sid && name) staffMap[sid] = name;
        });
      }

      const laboursMap: Record<string | number, string> = {};
      if (laboursRes.status === 'fulfilled' && laboursRes.value) {
        const lList = Array.isArray(laboursRes.value) ? laboursRes.value : (laboursRes.value.items || laboursRes.value.data || []);
        lList.forEach((l: any) => {
          const lid = l.labour_id || l.id;
          const name = l.labour_name || l.name || l.full_name;
          if (lid && name) laboursMap[lid] = name;
        });
      }

      const contractorsMap: Record<string | number, string> = {};
      if (contractorsRes.status === 'fulfilled' && contractorsRes.value) {
        const cList = Array.isArray(contractorsRes.value) ? contractorsRes.value : (contractorsRes.value.items || contractorsRes.value.data || []);
        cList.forEach((c: any) => {
          const cid = c.id || c.user_id || c.contractor_id;
          const name = c.name || c.full_name || c.company_name;
          if (cid && name) contractorsMap[cid] = name;
        });
      }

      const billsMap: Record<string | number, string> = {};
      const billsByNumber: Record<string, string> = {};
      if (billsRes.status === 'fulfilled' && billsRes.value) {
        const bList = Array.isArray(billsRes.value) ? billsRes.value : (billsRes.value.data || billsRes.value.items || []);
        bList.forEach((b: any) => {
          const bid = b.id;
          const cName = b.quotation?.company_name || b.client?.full_name || b.contractor?.name || b.contractor_name || b.vendor_name || 'Contractor';
          if (bid && cName) billsMap[bid] = cName;
          if (b.bill_number && cName) billsByNumber[b.bill_number] = cName;
        });
      }

      setEntities({
        users: { ...staffMap, ...usersMap },
        labours: laboursMap,
        contractors: contractorsMap,
        bills: billsMap,
        billsByNumber: billsByNumber,
      });
    } catch (err) {
      console.warn("Failed to load entity lookup data:", err);
    }
  }, []);

  const fetchRegister = async () => {
    setLoading(true);
    try {
      const raw = await payrollService.getPayrollRegister();
      let list: any[] = [];
      if (Array.isArray(raw)) list = raw;
      else if (raw && typeof raw === 'object') {
        list = raw.items || raw.data || raw.results || raw.transactions || [];
      }
      setRegisterData(list);
    } catch (err) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegister();
    loadLookupData();
  }, [loadLookupData]);

  // On-demand fetch for any missing IDs in registerData
  useEffect(() => {
    if (!registerData.length) return;

    registerData.forEach((item: any) => {
      const linkedTo = item.linked_to || '';
      if (!linkedTo) return;

      const parts = linkedTo.split(':');
      const category = parts[0]?.toUpperCase();
      const id = Number(parts[1]);
      if (!id || isNaN(id)) return;

      if ((category === 'STAFF-SALARY' || category === 'STAFF' || category === 'SALARY') && !entities.users[id]) {
        userService.getUserById(id).then((u: any) => {
          if (u) {
            const name = u.full_name || u.name || u.email;
            if (name) {
              setEntities(prev => ({
                ...prev,
                users: { ...prev.users, [id]: name }
              }));
            }
          }
        }).catch(() => { });
      }

      if ((category === 'LABOUR-WAGE' || category === 'LABOUR' || category === 'WAGE') && !entities.labours[id]) {
        labourService.getLabourById(id).then((l: any) => {
          if (l) {
            const name = l.labour_name || l.name || l.full_name;
            if (name) {
              setEntities(prev => ({
                ...prev,
                labours: { ...prev.labours, [id]: name }
              }));
            }
          }
        }).catch(() => { });
      }
    });
  }, [registerData, entities.users, entities.labours]);

  // Resolve display name for Employee / Contractor / Labour
  const getPartyDisplayName = (item: any): string => {
    // 1. Direct explicit name fields if provided on transaction
    if (item.employee_name) return item.employee_name;
    if (item.staff_name) return item.staff_name;
    if (item.user_name) return item.user_name;
    if (item.user?.full_name || item.user?.name) return item.user.full_name || item.user.name;
    if (item.labour_name) return item.labour_name;
    if (item.labour?.labour_name || item.labour?.name) return item.labour.labour_name || item.labour.name;
    if (item.contractor_name) return item.contractor_name;
    if (item.contractor?.name) return item.contractor.name;

    // 2. If party_name is present and is NOT a placeholder like "Staff Salary #1", "Labour Wage #15", etc.
    if (
      item.party_name &&
      !item.party_name.startsWith('Staff Salary #') &&
      !item.party_name.startsWith('Labour Wage #') &&
      !item.party_name.startsWith('Contractor Pay #')
    ) {
      return item.party_name;
    }

    // 3. Parse linked_to
    const linkedTo = item.linked_to || '';
    if (linkedTo) {
      const parts = linkedTo.split(':');
      const category = parts[0]?.toUpperCase();
      const id = parts[1];

      if (category === 'STAFF-SALARY' || category === 'STAFF' || category === 'SALARY') {
        if (id && entities.users[id]) {
          return entities.users[id];
        }
        return item.party_name || (id ? `Staff #${id}` : 'Staff');
      }

      if (category === 'LABOUR-WAGE' || category === 'LABOUR' || category === 'WAGE') {
        if (id && entities.labours[id]) {
          return entities.labours[id];
        }
        return item.party_name || (id ? `Labour #${id}` : 'Labour');
      }

      if (category === 'CONTRACTOR-PAY' || category === 'CONTRACTOR' || category === 'RABILL') {
        // Check by bill ID
        if (id && entities.bills[id]) {
          return entities.bills[id];
        }
        // Check by contractor ID
        if (id && entities.contractors[id]) {
          return entities.contractors[id];
        }
        // Check if reference contains a bill number, e.g. "rabill:BILL-QT/2026/0001"
        if (item.reference) {
          const refBillNo = item.reference.replace(/^rabill:/i, '').trim();
          if (refBillNo && entities.billsByNumber[refBillNo]) {
            return entities.billsByNumber[refBillNo];
          }
        }
        return item.party_name || (id ? `Contractor #${id}` : 'Contractor');
      }
    }

    // 4. Fallback to reference or item.party_name or '—'
    return item.party_name || item.reference || '—';
  };

  const paged = registerData.slice((ledgerPage - 1) * ledgerRpp, ledgerPage * ledgerRpp);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-3">
          Payroll Ledger
          <button onClick={() => { fetchRegister(); loadLookupData(); }} disabled={loading} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} />
          </button>
        </h3>
        {!loading && <span className="text-xs text-slate-400 font-semibold">{registerData.length} records</span>}
      </div>
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Date", "Employee/Contractor", "Type", "Debit", "Credit", "Balance"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paged.length > 0 ? paged.map((item: any) => {
                const isPayment = item.type === 'payment';
                const isReceipt = item.type === 'receipt';
                const debit = isPayment ? item.amount : null;
                const credit = isReceipt ? item.amount : null;
                const dateStr = item.created_at ? item.created_at.split('T')[0] : '—';
                const party = getPartyDisplayName(item);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    {/* DATE */}
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{dateStr}</td>

                    {/* EMPLOYEE/CONTRACTOR */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-800">{party}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{item.reference || item.linked_to || '—'}</p>
                    </td>

                    {/* TYPE */}
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${isReceipt ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>{item.type}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.mode || ''}</p>
                    </td>

                    {/* DEBIT */}
                    <td className="px-4 py-3 text-xs text-rose-500 font-semibold">
                      {debit != null ? `₹${Number(debit).toLocaleString('en-IN')}` : '—'}
                    </td>

                    {/* CREDIT */}
                    <td className="px-4 py-3 text-xs text-emerald-600 font-bold">
                      {credit != null ? `₹${Number(credit).toLocaleString('en-IN')}` : '—'}
                    </td>

                    {/* BALANCE — not in API */}
                    <td className="px-4 py-3 text-xs text-slate-400">—</td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-sm font-bold text-slate-400">
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      {!loading && registerData.length > 0 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-semibold">Per page:</span>
            <select value={ledgerRpp} onChange={(e) => { setLedgerRpp(Number(e.target.value)); setLedgerPage(1); }} className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white">
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            {(ledgerPage - 1) * ledgerRpp + 1}–{Math.min(ledgerPage * ledgerRpp, registerData.length)} of {registerData.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setLedgerPage(p => Math.max(1, p - 1))} disabled={ledgerPage === 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">{ledgerPage}</span>
            <button onClick={() => setLedgerPage(p => Math.min(Math.ceil(registerData.length / ledgerRpp), p + 1))} disabled={ledgerPage === Math.ceil(registerData.length / ledgerRpp)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateOfferModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: (id: number, projectName: string) => void }) => {
  const [formData, setFormData] = useState({
    project_name: "",
    society_name: "",
    address: "",
    developer_name: "",
    contact_email: "",
    contact_phone: "",
    extra_carpet_percent: 0,
    note: ""
  });
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      import("../../services/projectService").then((m) => {
        m.projectService.getProjects().then((data: any) => {
          const items = Array.isArray(data) ? data : (data?.items || data?.data || []);
          setProjects(items);
        }).catch(err => console.error("Failed to fetch projects", err));
      });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "extra_carpet_percent" ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_name || !formData.society_name || !formData.developer_name) {
      toast.error("Please fill required fields properly.");
      return;
    }
    setLoading(true);
    try {
      const res = await accountingService.createOffer(formData);
      toast.success("Offer Created!");
      const newId = res?.id || res?.data?.id || Math.floor(Math.random() * 1000); // fallback if ID is missing
      onSuccess(newId, formData.project_name);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to create offer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Offer Letter"
      maxWidth="max-w-2xl"
      footer={
        <>
          <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
            {loading ? "Creating..." : "Create Offer"}
          </button>
        </>
      }
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name *</label>
              <select name="project_name" value={formData.project_name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500">
                <option value="">Select Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Society Name *</label>
              <input type="text" name="society_name" value={formData.society_name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Developer Name *</label>
              <input type="text" name="developer_name" value={formData.developer_name} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Address</label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Email</label>
              <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Phone</label>
              <input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Extra Carpet Percent (%)</label>
              <input type="number" name="extra_carpet_percent" value={formData.extra_carpet_percent || ""} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Note</label>
              <textarea name="note" value={formData.note} onChange={handleChange} rows={2} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500" />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

const OfferLettersWrapper = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOfferId, setCurrentOfferId] = useState<number | null>(null);
  const [currentProjectName, setCurrentProjectName] = useState<string>("");
  const [offerStatus, setOfferStatus] = useState<"pending" | "created" | "generated">("pending");

  const handleCreateSuccess = (id: number, projectName: string) => {
    setCurrentOfferId(id);
    setCurrentProjectName(projectName);
    setOfferStatus("created");
  };

  const handleGenerate = async () => {
    if (!currentOfferId) return;
    try {
      toast.loading("Generating offer letter...", { id: "gen-offer" });
      await accountingService.generateOfferLetter(currentOfferId);
      toast.success("Offer letter generated successfully!", { id: "gen-offer" });
      setOfferStatus("generated");
    } catch (err: any) {
      toast.error(err.message || "Failed to generate offer", { id: "gen-offer" });
    }
  };

  const handleDownload = async () => {
    if (!currentOfferId) return;
    try {
      toast.loading("Downloading PDF...", { id: "dl-offer" });
      const blob = await accountingService.downloadOfferPdf(currentOfferId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Offer_Letter_${currentProjectName.replace(/\s+/g, "_") || 'Document'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Downloaded!", { id: "dl-offer" });
    } catch (err: any) {
      toast.error(err.message || "Failed to download PDF", { id: "dl-offer" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm border border-slate-100 max-w-4xl mx-auto mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-12 text-center">Offer Letter Generation Flow</h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative">
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-1.5 bg-slate-100 -z-10 -translate-y-1/2 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: offerStatus === 'generated' ? '100%' : offerStatus === 'created' ? '50%' : '0%' }}></div>
          </div>

          <div className="flex flex-col items-center gap-3 bg-white z-10 p-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shadow-lg transition-all ${offerStatus === 'pending' ? 'bg-blue-600 text-white hover:scale-105' : 'bg-emerald-500 text-white'}`}
            >
              {offerStatus === 'pending' ? '1' : '✓'}
            </button>
            <span className={`font-bold text-sm ${offerStatus === 'pending' ? 'text-blue-600' : 'text-emerald-600'}`}>Create Offer</span>
          </div>

          <div className="flex flex-col items-center gap-3 bg-white z-10 p-2">
            <button
              onClick={handleGenerate}
              disabled={offerStatus === 'pending'}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shadow-lg transition-all ${offerStatus === 'created' ? 'bg-blue-600 text-white hover:scale-105' : offerStatus === 'generated' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              {offerStatus === 'generated' ? '✓' : '2'}
            </button>
            <span className={`font-bold text-sm ${offerStatus === 'created' ? 'text-blue-600' : offerStatus === 'generated' ? 'text-emerald-600' : 'text-slate-400'}`}>Generate Letter</span>
          </div>

          <div className="flex flex-col items-center gap-3 bg-white z-10 p-2">
            <button
              onClick={handleDownload}
              disabled={offerStatus !== 'generated'}
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black shadow-lg transition-all ${offerStatus === 'generated' ? 'bg-blue-600 text-white hover:scale-105 hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              3
            </button>
            <span className={`font-bold text-sm ${offerStatus === 'generated' ? 'text-blue-600' : 'text-slate-400'}`}>Download PDF</span>
          </div>
        </div>

        {currentOfferId && (
          <div className="mt-16 text-center p-5 bg-slate-50 rounded-xl border border-slate-100 max-w-sm mx-auto shadow-sm">
            <p className="text-sm text-slate-600">Current Offer ID: <span className="font-bold text-slate-800">OFF-{currentOfferId}</span></p>
            <p className="text-xs text-slate-500 font-semibold mb-4">{currentProjectName}</p>
            <button onClick={() => { setCurrentOfferId(null); setOfferStatus("pending"); }} className="text-xs px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 font-bold hover:bg-slate-100 transition-colors shadow-sm">Start New Flow</button>
          </div>
        )}
      </div>

      <CreateOfferModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
};

// --- MAIN COMPONENT ---

type TabKey = "wages" | "ledger" | "offers";

const TABS: { key: TabKey; label: string }[] = [
  { key: "wages", label: "Labour Payroll" },
  { key: "ledger", label: "Payroll Register" },
  { key: "offers", label: "Offer Letters" },
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
      "wages": "wages",
      "ledger": "ledger",
      "offers": "offers",
    };
    return map[currentSub || ""] || "wages";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [globalProjectId, setGlobalProjectId] = useState<string>("");

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        let combinedData: any = {};

        // 1. Fetch from accountant payroll summary (no hardcoded project_id)
        try {
          const res = await payrollService.getSummary();
          const d = res?.data || res || {};
          combinedData = { ...combinedData, ...d };
        } catch (e) {
          console.warn("payrollService.getSummary failed, trying fallback endpoints", e);
        }

        // 2. Fetch from paymentService payroll stats (labour/payroll/stats)
        try {
          const statsRes = await paymentService.getPayrollStats();
          const statsData = statsRes?.data || statsRes || {};
          combinedData = {
            ...statsData,
            ...combinedData,
            paid_this_month: combinedData.paid_this_month ?? combinedData.paid_payroll ?? statsData.paid_this_month ?? statsData.total_paid,
            pending_due: combinedData.pending_due ?? combinedData.pending_payroll ?? statsData.pending_due ?? statsData.total_pending,
            advance_logs: combinedData.advance_logs ?? combinedData.advance_given ?? statsData.advance_logs ?? statsData.total_advance,
          };
        } catch (e) {
          console.warn("paymentService.getPayrollStats failed", e);
        }

        // 3. Fetch from paymentService fiscal summary (labour/payroll/fiscal-summary)
        try {
          const fiscalRes = await paymentService.getFiscalSummary();
          const fiscalData = fiscalRes?.data || fiscalRes || {};
          combinedData = {
            ...fiscalData,
            ...combinedData,
            paid_payroll: combinedData.paid_payroll ?? combinedData.paid_this_month ?? fiscalData.total_payout,
            advance_given: combinedData.advance_given ?? combinedData.advance_logs ?? fiscalData.advance_adjusted,
          };
        } catch (e) {
          console.warn("paymentService.getFiscalSummary failed", e);
        }

        setSummaryData(combinedData);
      } catch (err) {
        console.error('Failed to fetch payroll summary', err);
      }
    };
    fetchSummary();
  }, [globalProjectId]);

  useEffect(() => {
    setActiveTab(resolveTab());
  }, [category, location.pathname]);

  const handleTabChange = (key: TabKey) => {
    setActiveTab(key);
    navigate(`/accountant/payroll/${key}`, { replace: true });
  };

  const handleExport = async (type: string) => {
    try {
      let blob;
      let filename = 'export.pdf';
      if (type === 'staff-pdf') {
        blob = await payrollService.exportStaffPayroll();
        filename = 'staff-payroll.pdf';
      } else if (type === 'staff-excel') {
        blob = await payrollService.exportPayslips();
        filename = 'staff-payslips.xlsx';
      } else if (type === 'contractor') {
        blob = await payrollService.exportContractorPayroll();
        filename = 'contractor-payroll.pdf';
      } else if (type === 'ledger') {
        blob = await payrollService.exportPayrollRegister();
        filename = 'payroll-register.pdf';
      }

      if (!blob) return;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error('Failed to export data');
    }
  };

  // Per-tab config: title, subtitle, and action buttons
  const TAB_CONFIG: Record<TabKey, { title: string; subtitle: string; actions: React.ReactNode }> = {
    wages: {
      title: "Labour Wages",
      subtitle: "Process and manage daily or monthly labour wages.",
      actions: null,
    },
    ledger: {
      title: "Payroll Register",
      subtitle: "View comprehensive payroll ledger and history.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => handleExport('ledger')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export Register
          </button>
        </div>
      ),
    },
    offers: {
      title: "Offer Letters",
      subtitle: "Generate and manage recruitment offer letters.",
      actions: null,
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
              className={`px-5 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.key
                ? "bg-white text-blue-600 shadow-sm border border-slate-200 font-bold"
                : "text-slate-500 hover:text-slate-700"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

  {/* ── Content Rendering ──────────────────────────── */ }
  { activeTab === "wages" && <LaborWagesWrapper initialSubTab={subTab} key={subTab || "daily"} onProjectChange={setGlobalProjectId} /> }
  { activeTab === "ledger" && <LedgerSection /> }
  { activeTab === "offers" && <OfferLettersWrapper /> }
      </PageTransition >
    </>
  );
};

export default PayrollPage;
