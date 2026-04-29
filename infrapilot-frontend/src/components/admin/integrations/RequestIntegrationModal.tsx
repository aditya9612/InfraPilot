import { useState } from "react";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const RequestIntegrationModal = ({ isOpen, onClose }: Props) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    toolName: "",
    useCase: "",
    urgency: "Normal",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.toolName || !formData.useCase) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    // Mock API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    toast.success("Custom integration request submitted to engineering team!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/20 font-inter">
        {/* Header */}
        <div className="flex items-start justify-between p-10 pb-6">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-3">
              Custom Request
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                Enterprise Integration Queue
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-[1.2rem] transition-all"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Tool/Service Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.toolName}
              onChange={(e) => setFormData({ ...formData, toolName: e.target.value })}
              placeholder="e.g. Salesforce, SAP, Slack"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Urgency Level
            </label>
            <div className="flex gap-2">
              {["Normal", "High", "Critical"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFormData({ ...formData, urgency: level })}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    formData.urgency === level
                      ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                      : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
              Primary Use Case <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={formData.useCase}
              onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
              placeholder="Describe how this integration will improve your workflow..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all resize-none"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-2xl text-sm font-black shadow-2xl shadow-primary/30 hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-[0.98] disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting to Engineering...
                </div>
              ) : (
                "Authorize Integration Request"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestIntegrationModal;
