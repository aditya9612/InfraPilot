import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (billData: any) => void;
  initialData?: any | null;
}

const CreateBillModal: React.FC<CreateBillModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    vendor_name: "",
    bill_number: "",
    category: "vendor",
    item: "",
    quantity: 1,
    rate: 0,
    gst_percent: 18,
    status: "pending",
    due_date: new Date().toISOString().split('T')[0],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});


  const [calculated, setCalculated] = useState({
    base_total: 0,
    gst_amount: 0,
    payable_amount: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        vendor_name: initialData.vendor_name || "",
        bill_number: initialData.bill_number || "",
        category: initialData.category || "vendor",
        item: initialData.item || "",
        quantity: initialData.quantity || 1,
        rate: initialData.rate || 0,
        gst_percent: initialData.gst_percent || 18,
        status: initialData.status || "pending",
        due_date: initialData.due_date || new Date().toISOString().split('T')[0],
      });
    } else {
      setFormData({
        vendor_name: "",
        bill_number: "",
        category: "vendor",
        item: "",
        quantity: 1,
        rate: 0,
        gst_percent: 18,
        status: "pending",
        due_date: new Date().toISOString().split('T')[0],
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const base = formData.quantity * formData.rate;
    const gst = (base * formData.gst_percent) / 100;
    
    setCalculated({
      base_total: base,
      gst_amount: gst,
      payable_amount: base + gst,
    });
  }, [formData.quantity, formData.rate, formData.gst_percent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === "quantity" || name === "rate") ? parseFloat(value) || 0 : (name === "gst_percent" ? parseInt(value) : value)
    }));
    if (errors[name]) {
      setErrors(prev => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.vendor_name.trim()) newErrors.vendor_name = "Vendor/Contractor name is required.";
    if (!formData.bill_number.trim()) newErrors.bill_number = "Bill number is required.";
    if (!formData.item.trim()) newErrors.item = "Material/Service description is required.";
    if (formData.quantity <= 0) newErrors.quantity = "Qty > 0.";
    if (formData.rate < 0) newErrors.rate = "Rate >= 0.";
    if (!formData.due_date) newErrors.due_date = "Due date is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const submissionData = {
      ...formData,
      total_amount: calculated.base_total,
      gst: calculated.gst_amount,
      payable_amount: calculated.payable_amount,
    };

    onSubmit(submissionData);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Update Payable Record" : "Record New Bill"}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Vendor / Contractor Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="vendor_name"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.vendor_name ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                placeholder="e.g. Mahaveer Cements"
                value={formData.vendor_name}
                onChange={handleChange}
              />
              {errors.vendor_name && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.vendor_name}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Bill / Reference Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="bill_number"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.bill_number ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                placeholder="BILL/2024/001"
                value={formData.bill_number}
                onChange={handleChange}
              />
              {errors.bill_number && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.bill_number}</p>}
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Category <span className="text-red-500">*</span></label>
              <select
                name="category"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-primary/20 outline-none"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="vendor">Material Vendor</option>
                <option value="contractor">Sub-Contractor</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Due Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                name="due_date"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.due_date ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                value={formData.due_date}
                onChange={handleChange}
              />
              {errors.due_date && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.due_date}</p>}
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Material / Service Description <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="item"
                className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.item ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                placeholder="e.g. Reinforcement Steel"
                value={formData.item}
                onChange={handleChange}
              />
              {errors.item && <p className="text-[10px] text-red-500 mt-1 ml-1">{errors.item}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Quantity <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="quantity"
                  min="1"
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.quantity ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                  value={formData.quantity}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Rate (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="rate"
                  min="0"
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.rate ? "border-red-500 ring-1 ring-red-500/20" : "border-slate-200 focus:ring-primary/20"} rounded-xl text-sm outline-none transition-all`}
                  value={formData.rate}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">GST (%)</label>
              <select
                name="gst_percent"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-primary/20 outline-none"
                value={formData.gst_percent}
                onChange={handleChange}
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Payment Status</label>
              <select
                name="status"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-primary/20 outline-none"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="pending">Pending</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Calculation Summary Card */}
        <div className="bg-slate-900 rounded-[28px] p-8 mt-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
            <div className="grid grid-cols-3 gap-8 text-white">
                <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Base Amount</p>
                    <p className="text-xl font-bold">₹{calculated.base_total.toLocaleString()}</p>
                </div>
                <div className="space-y-1 border-x border-white/5 px-8">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">GST ({formData.gst_percent}%)</p>
                    <p className="text-xl font-bold text-emerald-400">+ ₹{calculated.gst_amount.toLocaleString()}</p>
                </div>
                <div className="space-y-1 text-right">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Total Payable</p>
                    <p className="text-3xl font-black text-primary">₹{calculated.payable_amount.toLocaleString()}</p>
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
            className="flex-1 px-10 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
          >
            {initialData ? "Save Bill Changes" : "Record Bill"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateBillModal;
