import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assetData: any) => void;
  initialData?: any | null;
}

const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    type: "register",
    asset_name: "",
    category: "",
    purchase_date: new Date().toISOString().split('T')[0],
    cost: 0,
    depreciation_rate: 10,
    current_value: 0,
    location: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        type: initialData.type || "register",
        asset_name: initialData.asset_name || "",
        category: initialData.category || "",
        purchase_date: initialData.purchase_date || new Date().toISOString().split('T')[0],
        cost: initialData.cost || 0,
        depreciation_rate: initialData.depreciation_rate || 10,
        current_value: initialData.current_value || 0,
        location: initialData.location || "",
      });
    } else {
      setFormData({
        type: "register",
        asset_name: "",
        category: "",
        purchase_date: new Date().toISOString().split('T')[0],
        cost: 0,
        depreciation_rate: 10,
        current_value: 0,
        location: "",
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.asset_name || !formData.category || formData.cost <= 0) {
      toast.error("Please fill in Asset Name, Category and Cost");
      return;
    }
    onSubmit({
      ...formData,
      current_value: initialData ? formData.current_value : formData.cost
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Update Asset Record" : "Add New Fixed Asset"}
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Column 1 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Asset Name</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. JCB Excavator"
                value={formData.asset_name}
                onChange={e => setFormData({ ...formData, asset_name: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Category</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">Select Category</option>
                <option value="Heavy Machinery">Heavy Machinery</option>
                <option value="IT Equipment">IT Equipment</option>
                <option value="Construction Equipment">Construction Equipment</option>
                <option value="Vehicles">Vehicles</option>
                <option value="Office Furniture">Office Furniture</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Purchase Date</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                value={formData.purchase_date}
                onChange={e => setFormData({ ...formData, purchase_date: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Location / Site</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                placeholder="e.g. Site Alpha - Mumbai"
                value={formData.location}
                onChange={e => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Asset Cost (₹)</label>
              <input
                type="number"
                min="0"
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                value={formData.cost || ""}
                onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1.5 block">Depreciation Rate (% P.A.)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none font-bold"
                  value={formData.depreciation_rate}
                  onChange={e => setFormData({ ...formData, depreciation_rate: parseFloat(e.target.value) || 0 })}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
              </div>
            </div>
            <div className="p-6 bg-slate-900 rounded-[24px] text-white space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Year 1 Value</p>
                <p className="text-sm font-bold text-emerald-400">₹{(formData.cost * (1 - formData.depreciation_rate / 100)).toLocaleString()}</p>
              </div>
              <div className="h-px bg-white/5 w-full" />
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Annual Depr.</p>
                <p className="text-sm font-bold text-rose-400">-₹{(formData.cost * (formData.depreciation_rate / 100)).toLocaleString()}</p>
              </div>
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
            {initialData ? "Save Record Updates" : "Register Asset"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateAssetModal;
