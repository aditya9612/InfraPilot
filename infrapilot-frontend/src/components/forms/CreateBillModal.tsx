import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vendor_name || !formData.bill_number || !formData.item) {
      toast.error("Please fill in all required fields");
      return;
    }

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
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Vendor / Contractor Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. Mahaveer Cements"
                value={formData.vendor_name}
                onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Bill / Reference Number</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="BILL/2024/001"
                value={formData.bill_number}
                onChange={e => setFormData({ ...formData, bill_number: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Category</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="vendor">Material Vendor</option>
                <option value="contractor">Sub-Contractor</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Due Date</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.due_date}
                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
              />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Material / Service Description</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. Reinforcement Steel"
                value={formData.item}
                onChange={e => setFormData({ ...formData, item: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Quantity</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.quantity}
                  onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Rate (₹)</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  value={formData.rate}
                  onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">GST (%)</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.gst_percent}
                onChange={e => setFormData({ ...formData, gst_percent: parseInt(e.target.value) })}
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
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
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
