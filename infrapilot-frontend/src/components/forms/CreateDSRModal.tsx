import React, { useState } from "react";
import { ClipboardList, HardHat, Package, MessageSquare, Camera } from "lucide-react";
import Modal from "../common/Modal";

interface CreateDSRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateDSRModal: React.FC<CreateDSRModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    workDone: "",
    workPlanned: "",
    labourCount: "",
    materialUsed: "",
    remarks: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.workDone.trim()) newErrors.workDone = "Work progress is required.";
    if (!formData.labourCount) newErrors.labourCount = "Labour count is required.";
    if (!formData.materialUsed.trim()) newErrors.materialUsed = "Material log is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      setTimeout(() => {
        const payload = {
          ...formData,
          id: `DSR-2026-${Math.floor(Math.random() * 1000)}`,
          labourCount: parseInt(formData.labourCount),
          photos: [], // In a real app, we would handle photo uploads here
        };
        onSubmit(payload);
        setIsLoading(false);
        onClose();
        setFormData({
            date: new Date().toISOString().split('T')[0],
            workDone: "",
            workPlanned: "",
            labourCount: "",
            materialUsed: "",
            remarks: "",
        });
      }, 1000);
    }
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        form="dsr-form"
        type="submit"
        disabled={isLoading}
        className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Submitting...
          </>
        ) : (
          "Publish Report"
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Daily Site Report (DSR)"
      footer={modalFooter}
      maxWidth="max-w-2xl"
    >
      <form id="dsr-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Date Selection */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Reporting Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
               <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
              />
            </div>
          </div>

          {/* Labour Count */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Labour Strength <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <HardHat size={16} />
              </span>
              <input
                type="number"
                name="labourCount"
                placeholder="e.g. 24"
                value={formData.labourCount}
                onChange={handleChange}
                className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors.labourCount ? "border-rose-400 focus:ring-rose-500/10" : "border-slate-200 focus:ring-primary/10"} rounded-xl text-sm focus:border-primary transition-all outline-none`}
              />
            </div>
            {errors.labourCount && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.labourCount}</p>}
          </div>
        </div>

        {/* Work Done Today */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Work Done Today <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-slate-400">
              <ClipboardList size={16} />
            </span>
            <textarea
              name="workDone"
              rows={3}
              placeholder="Describe the activities completed today..."
              value={formData.workDone}
              onChange={handleChange}
              className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${errors.workDone ? "border-rose-400 focus:ring-rose-500/10" : "border-slate-200 focus:ring-primary/10"} rounded-xl text-sm focus:border-primary transition-all outline-none resize-none`}
            />
          </div>
          {errors.workDone && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.workDone}</p>}
        </div>

        {/* Work Planned Tomorrow */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Work Planned (Tomorrow)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-slate-400">
              <ClipboardList size={16} className="opacity-50" />
            </span>
            <textarea
              name="workPlanned"
              rows={2}
              placeholder="What is scheduled for the next working day?"
              value={formData.workPlanned}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none"
            />
          </div>
        </div>

        {/* Material Consumption */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Material Log <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-slate-400">
              <Package size={16} />
            </span>
            <textarea
              name="materialUsed"
              rows={2}
              placeholder="e.g. Cement: 50 bags, Steel: 1.2 Tons..."
              value={formData.materialUsed}
              onChange={handleChange}
              className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${errors.materialUsed ? "border-rose-400 focus:ring-rose-500/10" : "border-slate-200 focus:ring-primary/10"} rounded-xl text-sm focus:border-primary transition-all outline-none resize-none`}
            />
          </div>
          {errors.materialUsed && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.materialUsed}</p>}
        </div>

        {/* Remarks */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Engineer's Remarks / Observations
          </label>
          <div className="relative">
            <span className="absolute left-4 top-4 text-slate-400">
              <MessageSquare size={16} />
            </span>
            <textarea
              name="remarks"
              rows={2}
              placeholder="Any specific issues, safety notes, or quality checks..."
              value={formData.remarks}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none"
            />
          </div>
        </div>

        {/* Photo Upload Placeholder */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2 cursor-pointer hover:bg-slate-100 transition-all">
          <Camera size={24} />
          <p className="text-[10px] font-bold uppercase tracking-widest">Upload Field Snapshots</p>
          <p className="text-[9px] font-medium text-slate-400 tracking-tight">Maximum 5 photos per report (JPG/PNG)</p>
        </div>
      </form>
    </Modal>
  );
};

export default CreateDSRModal;
