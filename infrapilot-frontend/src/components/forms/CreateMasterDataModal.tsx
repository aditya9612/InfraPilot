import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface CreateMasterDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const CreateMasterDataModal: React.FC<CreateMasterDataModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "",
    type: "Material",
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        code: "",
        category: "",
        type: "Material",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || !formData.category) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 scale-in-center">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {initialData ? "Edit Master Entity" : "Create Master Entity"}
            </h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
              System Configuration
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/50 rounded-xl transition-all text-slate-400 hover:text-slate-600"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Entity Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cement (OPC 53)"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Unique Code
              </label>
              <input
                type="text"
                required
                placeholder="MAT-CEM-01"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-mono font-bold"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                System Type
              </label>
              <select
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-bold appearance-none cursor-pointer"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Material">Material</option>
                <option value="Labor">Labor</option>
                <option value="Activity">Activity</option>
                <option value="Unit">Unit</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
              Category Group
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Construction Material"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-all"
            >
              {initialData ? "Save Changes" : "Create Entity"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateMasterDataModal;
