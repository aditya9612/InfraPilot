import React, { useState } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";

interface ProcessPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payrollData: any) => void;
}

const ProcessPayrollModal: React.FC<ProcessPayrollModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    type: "salary",
    employee_name: "",
    role: "",
    attendance_days: 26,
    basic_salary: 0,
    overtime: 0,
    deductions: 0,
    payment_status: "Pending",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_name || !formData.role) {
      toast.error("Please fill in Employee Name and Role");
      return;
    }

    const net_pay = formData.basic_salary + formData.overtime - formData.deductions;

    onSubmit({
        ...formData,
        net_pay
    });
    onClose();
    // Reset form
    setFormData({
        type: "salary",
        employee_name: "",
        role: "",
        attendance_days: 26,
        basic_salary: 0,
        overtime: 0,
        deductions: 0,
        payment_status: "Pending",
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Process New Payroll"
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Payroll Category</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="salary">Staff Salary</option>
                <option value="wages">Labor Wages</option>
                <option value="contractor">Contractor Payment</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Employee / Party Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. John Doe"
                value={formData.employee_name}
                onChange={e => setFormData({ ...formData, employee_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Role / Designation</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. Site Engineer"
                value={formData.role}
                onChange={e => setFormData({ ...formData, role: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Attendance (Days)</label>
              <input
                type="number"
                min="0"
                max="31"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.attendance_days}
                onChange={e => setFormData({ ...formData, attendance_days: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Basic Pay (₹)</label>
              <input
                type="number"
                min="0"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                value={formData.basic_salary}
                onChange={e => setFormData({ ...formData, basic_salary: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1 mb-1.5 block">Overtime (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none font-bold text-emerald-600"
                  value={formData.overtime}
                  onChange={e => setFormData({ ...formData, overtime: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 mb-1.5 block">Deductions (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 outline-none font-bold text-rose-600"
                  value={formData.deductions}
                  onChange={e => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Payment Status</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.payment_status}
                onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
              >
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calculation Summary Card */}
        <div className="bg-slate-900 rounded-[28px] p-8 mt-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="grid grid-cols-3 gap-8 text-white">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Earnings</p>
                    <p className="text-xl font-bold">₹{formData.basic_salary.toLocaleString()}</p>
                </div>
                <div className="space-y-1 border-x border-white/5 px-8">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Adjustments (Net)</p>
                    <p className={`text-xl font-bold ${formData.overtime - formData.deductions >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {formData.overtime - formData.deductions >= 0 ? "+" : ""} ₹{(formData.overtime - formData.deductions).toLocaleString()}
                    </p>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Net Payable</p>
                    <p className="text-3xl font-black text-primary">₹{(formData.basic_salary + formData.overtime - formData.deductions).toLocaleString()}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-10 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
          >
            Process Payroll
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProcessPayrollModal;
