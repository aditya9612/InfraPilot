import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";
import { payrollService } from "../../services/payrollService";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

// --- SECTIONS ---


const PayrollKPICards = ({ summary }: { summary?: any }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all group active:scale-[0.98]">
      <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PENDING PAYROLL</p>
      <p className="text-xl font-bold text-slate-800">{summary?.pending_payroll !== undefined ? `₹${summary.pending_payroll}` : '₹0'}</p>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-emerald-200 transition-all group active:scale-[0.98]">
      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PAID PAYROLL</p>
      <p className="text-xl font-bold text-slate-800">{summary?.paid_payroll !== undefined ? `₹${summary.paid_payroll}` : '₹0'}</p>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group active:scale-[0.98]">
      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">ADVANCE GIVEN</p>
      <p className="text-xl font-bold text-slate-800">{summary?.advance_given !== undefined ? `₹${summary.advance_given}` : '₹0'}</p>
    </div>
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 cursor-pointer hover:shadow-md hover:border-indigo-200 transition-all group active:scale-[0.98]">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-4">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CONTRACTOR PAYMENT</p>
      <p className="text-xl font-bold text-slate-800">{summary?.contractor_payment !== undefined ? `₹${summary.contractor_payment}` : '₹0'}</p>
    </div>
  </div>
);

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

  const mockUsers = [
    { id: 1, name: "Amit Kumar" },
    { id: 2, name: "Priya Sharma" },
    { id: 3, name: "Rahul Singh" }
  ];

  const mockProjects = [
    { id: 1, name: "Metro Line 3" },
    { id: 2, name: "Highway Expansion" },
    { id: 3, name: "City Center Mall" }
  ];

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
                {mockUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project *</label>
              <select name="project_id" value={formData.project_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-blue-500">
                <option value={0}>Select Project</option>
                {mockProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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

const StaffSalaryWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
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
                <tr>{["Emp ID", "Name", "Gross Pay", "Deductions", "Net Pay", "Status"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {staffRegister.length > 0 ? staffRegister.slice((currentPage-1)*recordsPerPage, currentPage*recordsPerPage).map((emp, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs font-mono">{emp.emp_id || `EMP-00${idx+1}`}</td><td className="px-4 py-3 text-xs font-bold text-slate-800">{emp.name}</td>
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
              <span className="text-xs text-slate-500 font-semibold">Showing {(currentPage-1)*recordsPerPage+1} – {Math.min(currentPage*recordsPerPage, staffRegister.length)} of {staffRegister.length} records</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1,p-1))} disabled={currentPage===1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">{currentPage}</span>
                <button onClick={() => setCurrentPage(p => Math.min(Math.ceil(staffRegister.length/recordsPerPage),p+1))} disabled={currentPage===Math.ceil(staffRegister.length/recordsPerPage)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
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
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 0
  });
  const [loading, setLoading] = useState(false);

  const mockLabours = [
    { id: 1, name: "Raju Mason" },
    { id: 2, name: "Suresh Plumber" }
  ];
  const mockProjects = [
    { id: 1, name: "Metro Line 3" },
    { id: 2, name: "City Center Mall" }
  ];


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes("_id") ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.labour_id || !formData.project_id || !formData.amount) {
      toast.error("Please fill required fields");
      return;
    }
    setLoading(true);
    try {
      await payrollService.payLabourWages(formData);
      toast.success("Wage Record Saved!");
      onClose();
    } catch (err) {
      toast.error("Failed to record wage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record ${period} Labor Wages`}
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
                {mockLabours.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project Name *</label>
              <select name="project_id" value={formData.project_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-amber-500">
                <option value={0}>Select Project</option>
                {mockProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Month *</label>
              <select name="month" value={formData.month} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-amber-500">
                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Year *</label>
              <input type="number" name="year" value={formData.year} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-amber-500" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount *</label>
              <input type="number" name="amount" value={formData.amount} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-amber-500" placeholder="e.g. 15000" />
            </div>
            
          </div>
        </div>
      </form>
    </Modal>
  );
};

const LaborWagesWrapper = ({ initialSubTab }: { initialSubTab?: string }) => {
  const [activeSubTab, setActiveSubTab] = useState(initialSubTab || "register");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalPeriod, setModalPeriod] = useState("Daily");
  const [wages, setWages] = useState<any[]>([]);
  const [dateFilter, setDateFilter] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 2).toISOString().split('T')[0],
    end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString().split('T')[0]
  });
  const [wagePage, setWagePage] = useState(1);
  const [wageRpp, setWageRpp] = useState(10);

  useEffect(() => {
    if (activeSubTab === "register") {
      const fetchWages = async () => {
        try {
          const data = await payrollService.getLabourWages(dateFilter.start_date, dateFilter.end_date);
          setWages(Array.isArray(data) ? data : data?.data || []);
        } catch (err) {
          toast.error("Failed to load labour wages");
        }
      };
      fetchWages();
    }
  }, [activeSubTab, dateFilter.start_date, dateFilter.end_date]);

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
          <div className="p-5 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
            <h3 className="font-bold text-slate-800">Labor Wage Register</h3>
            <div className="flex items-center gap-3">
              <input type="date" value={dateFilter.start_date} onChange={e => setDateFilter(prev => ({...prev, start_date: e.target.value}))} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none" />
              <span className="text-slate-400 text-sm font-bold tracking-widest">TO</span>
              <input type="date" value={dateFilter.end_date} onChange={e => setDateFilter(prev => ({...prev, end_date: e.target.value}))} className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-slate-50 outline-none" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Labor Name", "Type", "Period", "Gross Wage", "Net Wage", "Status"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {wages.length > 0 ? wages.slice((wagePage-1)*wageRpp, wagePage*wageRpp).map((wage, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{wage.labor_name || 'Labor'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">{wage.type || 'Skilled'}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{wage.period || 'Weekly'}</td>
                    <td className="px-4 py-3 text-xs text-slate-600">₹{wage.gross_wage || 0}</td>
                    <td className="px-4 py-3 text-xs font-bold text-amber-600">₹{wage.net_wage || 0}</td>
                    <td className="px-4 py-3 text-xs"><span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${wage.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{wage.status || 'Paid'}</span></td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm font-bold text-slate-400">No wages recorded yet.</td></tr>
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
              <span className="text-xs text-slate-500 font-semibold">Showing {(wagePage-1)*wageRpp+1} – {Math.min(wagePage*wageRpp, wages.length)} of {wages.length} records</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setWagePage(p => Math.max(1,p-1))} disabled={wagePage===1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">{wagePage}</span>
                <button onClick={() => setWagePage(p => Math.min(Math.ceil(wages.length/wageRpp),p+1))} disabled={wagePage===Math.ceil(wages.length/wageRpp)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 4. Contractor Payments
const ContractorPaymentSection = () => {
  const [formData, setFormData] = useState({
    rabill_id: 0,
    paid_amount: 0,
    total_deductions: 0,
    payment_mode: "Bank Transfer",
    bank_account_id: 0
  });
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [billPage, setBillPage] = useState(1);
  const [billRpp, setBillRpp] = useState(10);

  const mockBankAccounts = [
    { id: 1, name: "SBI - 1001" },
    { id: 2, name: "HDFC - 2002" }
  ];

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const data = await payrollService.getContractorBills();
        setBills(Array.isArray(data) ? data : data?.data || []);
      } catch (err) {
        toast.error("Failed to load contractor bills");
      }
    };
    fetchBills();
  }, []);

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
    } catch (err) {
      toast.error("Failed to save contractor payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="xl:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-emerald-500 text-white text-xs font-black rounded-lg flex items-center justify-center">1</span>
            Select RA Bill
          </h3>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pending Bills *</label>
            <select name="rabill_id" value={formData.rabill_id} onChange={handleChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 outline-none focus:border-emerald-500">
              <option value={0}>Select Bill</option>
              {bills.map(b => (
                <option key={b.id} value={b.id}>{b.bill_no || `Bill #${b.id}`} - {b.contractor_name || 'Contractor'} (Amount: ₹{b.amount || 0})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
            <span className="w-6 h-6 bg-emerald-500 text-white text-xs font-black rounded-lg flex items-center justify-center">2</span>
            Payment Details
          </h3>
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
                  {mockBankAccounts.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-6">
          <h3 className="text-sm font-bold text-slate-800 mb-5">Final Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-slate-500"><span>Paid Amount</span><span className="font-semibold text-slate-700">₹{formData.paid_amount || 0}</span></div>
            <div className="flex justify-between text-xs text-rose-500"><span>Total Deductions</span><span className="font-semibold">₹{formData.total_deductions || 0}</span></div>
            <div className="flex justify-between text-sm font-bold text-emerald-600 border-t border-slate-100 pt-3"><span>Net Total</span><span>₹{(formData.paid_amount || 0) + (formData.total_deductions || 0)}</span></div>
          </div>
          <button type="submit" disabled={loading} className="w-full mt-6 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all shadow-md active:scale-95 disabled:opacity-50">
            {loading ? "Recording..." : "Record Payment"}
          </button>
        </div>
      </div>

      <div className="xl:col-span-3 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center"><h3 className="font-bold text-slate-800">Pending Contractor Bills</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>{["Bill ID", "Contractor", "Amount", "Status"].map(h=><th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {bills.length > 0 ? bills.slice((billPage-1)*billRpp, billPage*billRpp).map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-xs font-mono">Bill #{b.id}</td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-800">{b.contractor_name || 'Contractor'}</td>
                    <td className="px-4 py-3 text-xs font-bold text-emerald-600">₹{b.amount || 0}</td>
                    <td className="px-4 py-3 text-xs text-amber-600 font-bold">Pending</td>
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
              <span className="text-xs text-slate-500 font-semibold">Showing {(billPage-1)*billRpp+1} – {Math.min(billPage*billRpp, bills.length)} of {bills.length} records</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setBillPage(p => Math.max(1,p-1))} disabled={billPage===1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">{billPage}</span>
                <button onClick={() => setBillPage(p => Math.min(Math.ceil(bills.length/billRpp),p+1))} disabled={billPage===Math.ceil(bills.length/billRpp)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}
        </div>
      </div>
    </form>
  );
};

const LedgerSection = () => {
  const [registerData, setRegisterData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerRpp, setLedgerRpp] = useState(10);

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
  }, []);

  // Parse linked_to: "LABOUR-WAGE:5:2026-08-05" → "Labour Wage #5"
  const parseLinkedTo = (linked_to: string | null, reference: string) => {
    if (!linked_to) return reference || '—';
    const parts = linked_to.split(':');
    const category = parts[0]; // e.g. LABOUR-WAGE, CONTRACTOR-PAY, STAFF-SALARY
    const id = parts[1] || '';
    if (category === 'LABOUR-WAGE') return `Labour Wage #${id}`;
    if (category === 'CONTRACTOR-PAY') return `Contractor Pay #${id}`;
    if (category === 'STAFF-SALARY') return `Staff Salary #${id}`;
    return linked_to;
  };

  const paged = registerData.slice((ledgerPage - 1) * ledgerRpp, ledgerPage * ledgerRpp);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-3">
          Payroll Ledger
          <button onClick={fetchRegister} disabled={loading} className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50">
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
                const debit  = isPayment ? item.amount : null;
                const credit = isReceipt ? item.amount : null;
                const dateStr = item.created_at ? item.created_at.split('T')[0] : '—';
                const party = item.party_name || parseLinkedTo(item.linked_to, item.reference);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    {/* DATE */}
                    <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{dateStr}</td>

                    {/* EMPLOYEE/CONTRACTOR */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-bold text-slate-800">{party}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[200px]">{item.reference}</p>
                    </td>

                    {/* TYPE */}
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        isReceipt ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
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

const CreateOfferModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean; onClose: () => void; onSuccess: () => void }) => {
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
      await payrollService.createOffer(formData);
      toast.success("Offer Created!");
      onSuccess();
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
  const [offers, setOffers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rpp, setRpp] = useState(10);

  const fetchOffers = async () => {
    try {
      const data = await payrollService.getOffers();
      setOffers(Array.isArray(data) ? data : data?.data || data?.items || []);
    } catch (err) {
      toast.error("Failed to load offers");
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleGenerate = async (id: number) => {
    try {
      toast.loading("Generating offer letter...", { id: "gen-offer" });
      await payrollService.generateOfferLetter(id);
      toast.success("Offer letter generated successfully!", { id: "gen-offer" });
      fetchOffers(); // Refresh status
    } catch (err: any) {
      toast.error(err.message || "Failed to generate offer", { id: "gen-offer" });
    }
  };

  const handleDownload = async (id: number, name: string) => {
    try {
      toast.loading("Downloading PDF...", { id: "dl-offer" });
      const blob = await payrollService.downloadOfferPdf(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Offer_Letter_${name.replace(/\s+/g, "_")}.pdf`;
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
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="font-bold text-slate-800">Recruitment Offers</h2>
        <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all shadow-sm whitespace-nowrap">
          + Create Offer
        </button>
      </div>

      <CreateOfferModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={fetchOffers} />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["ID", "Project Name", "Society", "Developer", "Email", "Phone", "Status", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {offers.length > 0 ? offers.slice((page-1)*rpp, page*rpp).map((offer, idx) => (
                <tr key={offer.id || idx} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-xs font-mono">OFF-{offer.id}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{offer.project_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{offer.society_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-600">{offer.developer_name || "-"}</td>
                  <td className="px-4 py-3 text-xs font-bold text-slate-800">{offer.contact_email || "-"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{offer.contact_phone || "-"}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${offer.status === 'Generated' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                      {offer.status || 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div className="flex gap-2">
                      <button onClick={() => handleGenerate(offer.id)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded text-xs transition-colors">
                        Generate
                      </button>
                      <button onClick={() => handleDownload(offer.id, offer.project_name)} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded text-xs transition-colors">
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm font-bold text-slate-400">No offers found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {offers.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-semibold">Records per page:</span>
              <select value={rpp} onChange={(e) => { setRpp(Number(e.target.value)); setPage(1); }} className="text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none font-semibold text-slate-600 bg-white">
                {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <span className="text-xs text-slate-500 font-semibold">Showing {(page-1)*rpp+1} – {Math.min(page*rpp, offers.length)} of {offers.length} records</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
              <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-bold shadow-sm">{page}</span>
              <button onClick={() => setPage(p => Math.min(Math.ceil(offers.length/rpp),p+1))} disabled={page===Math.ceil(offers.length/rpp)} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

type TabKey = "salary" | "wages" | "contractor" | "ledger" | "offers";

const TABS: { key: TabKey; label: string }[] = [
  { key: "salary",      label: "Staff Salary" },
  { key: "wages",       label: "Labour Payroll" },
  { key: "contractor",  label: "Contractor Payment" },
  { key: "ledger",      label: "Payroll Register" },
  { key: "offers",      label: "Offer Letters" },
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
      "offers": "offers",
    };
    return map[currentSub || ""] || "salary";
  };

  const [activeTab, setActiveTab] = useState<TabKey>(resolveTab);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await payrollService.getSummary();
        setSummaryData(data);
      } catch (err) {
        console.error('Failed to fetch payroll summary', err);
      }
    };
    fetchSummary();
  }, []);

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
    } catch(err) {
      toast.error('Failed to export data');
    }
  };

  // Per-tab config: title, subtitle, and action buttons
  const TAB_CONFIG: Record<TabKey, { title: string; subtitle: string; actions: React.ReactNode }> = {
    salary: {
      title: "Staff Salary",
      subtitle: "Process and manage monthly staff salaries.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => handleExport('staff-pdf')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📄</span> Export Payslips PDF
          </button>
          <button onClick={() => handleExport('staff-excel')} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-emerald-100 transition-all active:scale-95">
            <span className="text-lg">📊</span> Export Payslips Excel
          </button>
        </div>
      ),
    },
    wages: {
      title: "Labour Wages",
      subtitle: "Process and manage daily or monthly labour wages.",
      actions: null,
    },
    contractor: {
      title: "Contractor Payment",
      subtitle: "Manage and process contractor invoices and payments.",
      actions: (
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => handleExport('contractor')} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-sm font-bold px-4 py-2.5 rounded-2xl shadow-sm hover:bg-slate-50 transition-all active:scale-95">
            <span className="text-lg">📤</span> Export Bills
          </button>
        </div>
      ),
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
        {activeTab !== "offers" && <PayrollKPICards summary={summaryData} />}

        {/* ── Content Rendering ──────────────────────────── */}
        {activeTab === "salary"     && <StaffSalaryWrapper initialSubTab={subTab} key={subTab || "process"} />}
        {activeTab === "wages"      && <LaborWagesWrapper initialSubTab={subTab} key={subTab || "daily"} />}
        {activeTab === "contractor" && <ContractorPaymentSection />}
        {activeTab === "ledger"     && <LedgerSection />}
        {activeTab === "offers"     && <OfferLettersWrapper />}
      </PageTransition>
    </>
  );
};

export default PayrollPage;
