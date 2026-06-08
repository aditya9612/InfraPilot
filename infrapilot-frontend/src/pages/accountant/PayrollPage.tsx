import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ProcessPayrollModal from "../../components/forms/ProcessPayrollModal";
import ViewPayrollModal from "../../components/forms/ViewPayrollModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";

const MOCK_PAYROLL_RECORDS = [
  { 
    id: 1, 
    type: "salary", 
    employee_name: "John Doe",
    role: "Project Manager", 
    attendance_days: 26, 
    basic_salary: 60000,
    overtime: 0,
    deductions: 2000,
    net_pay: 58000,
    payment_status: "Paid"
  },
  { 
    id: 2, 
    type: "wages", 
    employee_name: "Ram Singh",
    role: "Skilled Labor", 
    attendance_days: 24, 
    basic_salary: 14400,
    overtime: 1200,
    deductions: 0,
    net_pay: 15600,
    payment_status: "Pending"
  },
  { 
    id: 3, 
    type: "contractor", 
    employee_name: "ABC Builders",
    role: "Civil Contractor", 
    attendance_days: 30, 
    basic_salary: 150000,
    overtime: 0,
    deductions: 7500, // TDS
    net_pay: 142500,
    payment_status: "Processing"
  }
];

const PayrollPage = () => {
  const { category } = useParams<{ category: string }>();
  const [records, setRecords] = useState(MOCK_PAYROLL_RECORDS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [recordToDelete, setRecordToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("All");

  useEffect(() => {
    if (category) {
        setActiveTab(category.toLowerCase());
    } else {
        setActiveTab("All");
    }
  }, [category]);

  const handleProcessPayroll = (data: any) => {
    if (selectedRecord) {
        setRecords(prev => prev.map(r => r.id === selectedRecord.id ? { ...r, ...data } : r));
        toast.success("Payroll record updated!");
    } else {
        const newRecord = {
            ...data,
            id: records.length + 1,
        };
        setRecords(prev => [newRecord, ...prev]);
        toast.success("Payroll processed successfully!");
    }
    setIsModalOpen(false);
    setSelectedRecord(null);
  };

  const handleViewRecord = (record: any) => {
    setSelectedRecord(record);
    setIsViewModalOpen(true);
  };

  const handleEditRecord = (record: any) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  };

  const handleDeleteRecord = (id: number) => {
    setRecordToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (recordToDelete) {
      setRecords(prev => prev.filter(r => r.id !== recordToDelete));
      toast.success("Payroll record deleted successfully");
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const filtered = activeTab === "All" 
    ? records 
    : records.filter(t => t.type === activeTab);

  const formatTitle = (tab: string) => {
    switch(tab) {
        case 'salary': return 'Staff Salary';
        case 'wages': return 'Labor Wages';
        case 'contractor': return 'Contractor Payments';
        default: return 'Payroll Overview';
    }
  };

  return (
    <>
      <Navbar title="Payroll & HR" breadcrumb={["Accountant", "Finance", "Payroll"]} />
      
      <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Accountant · Finance</p>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">{formatTitle(activeTab)}</h1>
            <p className="text-slate-500 text-sm mt-1">Manage employee salaries, daily wages, and contractor payments.</p>
          </div>
          <button
            onClick={() => { setSelectedRecord(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-2xl shadow-sm hover:bg-blue-600 transition-all active:scale-95"
          >
            <span className="text-base leading-none">+</span> Process Payroll
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">{formatTitle(activeTab)}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Staff salaries, labour wages and contractor payment records</p>
            </div>
            <button
              onClick={() => {
                const rows = filtered.map(r => [r.employee_name, r.role, r.attendance_days, r.basic_salary, r.overtime, r.deductions, r.net_pay, r.payment_status].join(','));
                const csv = ['Name,Role,Days,Basic,OT,Deductions,Net Pay,Status', ...rows].join('\n');
                const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
                a.download = `Payroll_${new Date().toISOString().split('T')[0]}.csv`; a.click();
              }}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold px-4 py-2 rounded-xl shadow-sm hover:border-primary/30 hover:text-primary transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Download
            </button>
          </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50 whitespace-nowrap">
                  <th className="px-6 py-4">Employee Name</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Attendance Days</th>
                  <th className="px-6 py-4 text-right">Basic Salary</th>
                  <th className="px-6 py-4 text-right">Overtime</th>
                  <th className="px-6 py-4 text-right">Deductions</th>
                  <th className="px-6 py-4 text-right">Net Pay</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4 text-right sticky right-0 bg-slate-50/50 shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)]">Actions</th>
                </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(record => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors whitespace-nowrap">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-black text-[10px] shadow-sm">
                                            {record.employee_name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <p className="text-sm font-black text-slate-700">{record.employee_name}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{record.role}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-[11px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200 tracking-wider">
                                        {record.attendance_days}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="text-sm font-bold text-slate-700 tabular-nums">₹{record.basic_salary.toLocaleString("en-IN")}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="text-sm font-bold text-emerald-600 tabular-nums">{record.overtime > 0 ? `+₹${record.overtime.toLocaleString("en-IN")}` : "-"}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="text-sm font-bold text-rose-600 tabular-nums">{record.deductions > 0 ? `-₹${record.deductions.toLocaleString("en-IN")}` : "-"}</p>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <p className="text-sm font-black text-slate-800 tabular-nums">₹{record.net_pay.toLocaleString("en-IN")}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full shadow-sm ${
                                            record.payment_status === "Paid" ? "bg-emerald-500 shadow-emerald-500/50" : 
                                            record.payment_status === "Processing" ? "bg-amber-500 shadow-amber-500/50" : "bg-rose-500 shadow-rose-500/50"
                                        }`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            record.payment_status === "Paid" ? "text-emerald-600" : 
                                            record.payment_status === "Processing" ? "text-amber-600" : "text-rose-600"
                                        }`}>
                                            {record.payment_status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right sticky right-0 bg-white/80 backdrop-blur-sm shadow-[-10px_0_15px_-3px_rgba(0,0,0,0.05)] group-hover:bg-slate-50/90 transition-colors">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => handleViewRecord(record)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all" title="View"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></button>
                                        <button onClick={() => handleEditRecord(record)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all" title="Edit"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                        <button onClick={() => handleDeleteRecord(record.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </PageTransition>

      <ProcessPayrollModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleProcessPayroll}
        initialData={selectedRecord}
      />

      <ViewPayrollModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        record={selectedRecord}
      />

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Record"
        message="Are you sure you want to delete this payroll record? This action cannot be undone."
        confirmText="Delete Record"
        type="danger"
      />
    </>
  );
};

export default PayrollPage;
