import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";

interface ProcessPayrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payrollData: any) => void;
  initialData?: any | null;
}

const ProcessPayrollModal: React.FC<ProcessPayrollModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.employee_name.trim()) newErrors.employee_name = "Employee name is required.";
    if (!formData.role.trim()) newErrors.role = "Role is required.";
    if (formData.basic_salary <= 0) newErrors.basic_salary = "Basic pay must be > 0.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || "salary",
        employee_name: initialData.employee_name || "",
        role: initialData.role || "",
        attendance_days: initialData.attendance_days || 26,
        basic_salary: initialData.basic_salary || 0,
        overtime: initialData.overtime || 0,
        deductions: initialData.deductions || 0,
        payment_status: initialData.payment_status || "Pending",
      });
    } else {
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
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const net_pay = formData.basic_salary + formData.overtime - formData.deductions;

    onSubmit({
        ...formData,
        net_pay
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Update Payroll Record" : "Process New Payroll"}
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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Employee / Party Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.employee_name ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none font-bold transition-all`}
                placeholder="e.g. John Doe"
                value={formData.employee_name}
                onChange={e => {
                    setFormData({ ...formData, employee_name: e.target.value });
                    if (errors.employee_name) setErrors(prev => ({ ...prev, employee_name: "" }));
                }}
              />
              {errors.employee_name && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">{errors.employee_name}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Role / Designation <span className="text-red-500">*</span></label>
              <input
                type="text"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.role ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none font-bold transition-all`}
                placeholder="e.g. Site Engineer"
                value={formData.role}
                onChange={e => {
                    setFormData({ ...formData, role: e.target.value });
                    if (errors.role) setErrors(prev => ({ ...prev, role: "" }));
                }}
              />
              {errors.role && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">{errors.role}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Attendance (Days)</label>
              <input
                type="number"
                min="0"
                max="31"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none font-black"
                value={formData.attendance_days}
                onChange={e => setFormData({ ...formData, attendance_days: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Basic Pay (₹) <span className="text-red-500">*</span></label>
              <input
                type="number"
                min="0"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.basic_salary ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none font-black transition-all`}
                value={formData.basic_salary}
                onChange={e => {
                    setFormData({ ...formData, basic_salary: parseFloat(e.target.value) || 0 });
                    if (errors.basic_salary) setErrors(prev => ({ ...prev, basic_salary: "" }));
                }}
              />
              {errors.basic_salary && <p className="text-[10px] text-red-500 mt-1 ml-1 font-bold">{errors.basic_salary}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest ml-1 mb-1.5 block">Overtime (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 outline-none font-black text-emerald-600"
                  value={formData.overtime}
                  onChange={e => setFormData({ ...formData, overtime: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-rose-500 uppercase tracking-widest ml-1 mb-1.5 block">Deductions (₹)</label>
                <input
                  type="number"
                  min="0"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 outline-none font-black text-rose-600"
                  value={formData.deductions}
                  onChange={e => setFormData({ ...formData, deductions: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Payment Status</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
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
        <div className="bg-slate-900 rounded-[28px] p-8 mt-6 relative overflow-hidden font-inter shadow-2xl">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
            <div className="grid grid-cols-3 gap-8 text-white relative z-10">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Earnings</p>
                    <p className="text-xl font-black tracking-tight">₹{formData.basic_salary.toLocaleString()}</p>
                </div>
                <div className="space-y-1 border-x border-white/10 px-8">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adjustments (Net)</p>
                    <p className={`text-xl font-black tracking-tight ${formData.overtime - formData.deductions >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {formData.overtime - formData.deductions >= 0 ? "+" : ""} ₹{(formData.overtime - formData.deductions).toLocaleString()}
                    </p>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Net Payable</p>
                    <p className="text-3xl font-black text-primary tracking-tighter">₹{(formData.basic_salary + formData.overtime - formData.deductions).toLocaleString()}</p>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-10 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            {initialData ? "Save Payroll Updates" : "Process Payroll"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProcessPayrollModal;
