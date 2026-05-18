import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import ProcessPayrollModal from "../../components/forms/ProcessPayrollModal";
import ViewPayrollModal from "../../components/forms/ViewPayrollModal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { Eye, Edit2, Trash2 } from "lucide-react";

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
      
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 mt-2">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                {formatTitle(activeTab)}
            </h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage employee salaries, daily wages, and contractor payments.</p>
          </div>
          <button 
            onClick={() => {
                setSelectedRecord(null);
                setIsModalOpen(true);
            }}
            className="px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
          >
            <span className="text-xl">+</span> Process Payroll
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-100">
                            <th className="px-6 py-5">Employee / Party</th>
                            <th className="px-6 py-5 text-center">Attendance</th>
                            <th className="px-6 py-5 text-right">Basic Pay</th>
                            <th className="px-6 py-5 text-right">Adjustments (OT / DED)</th>
                            <th className="px-6 py-5 text-right">Net Pay</th>
                            <th className="px-6 py-5">Payment Status</th>
                            <th className="px-6 py-5 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filtered.map(record => (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-500 border border-slate-100 flex items-center justify-center font-black text-[10px] shadow-sm">EMP</div>
                                        <div>
                                            <p className="text-sm font-black text-slate-700">{record.employee_name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{record.role}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-center">
                                    <span className="text-[11px] font-black bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200 tracking-wider">
                                        {record.attendance_days} Days
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-bold text-slate-700">₹{record.basic_salary.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex flex-col items-end gap-0.5 text-[10px] font-black">
                                        <span className="text-emerald-500">OT: +₹{record.overtime.toLocaleString()}</span>
                                        <span className="text-rose-500">DED: -₹{record.deductions.toLocaleString()}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <p className="text-sm font-black text-slate-800">₹{record.net_pay.toLocaleString()}</p>
                                </td>
                                <td className="px-6 py-5">
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
                                <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-100">
                                        <button 
                                          onClick={() => handleViewRecord(record)}
                                          className="p-1.5 text-slate-400 hover:text-primary transition-all"
                                          title="View Details"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleEditRecord(record)}
                                          className="p-1.5 text-slate-400 hover:text-amber-500 transition-all"
                                          title="Edit Record"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteRecord(record.id)}
                                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-all"
                                          title="Delete Record"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
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
