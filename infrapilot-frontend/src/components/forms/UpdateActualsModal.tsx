import React, { useState, useEffect } from "react";

interface UpdateActualsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { actual_quantity: number; actual_cost: number }) => Promise<void>;
  initialData?: {
    item_name: string;
    actual_quantity?: number | string;
    actual_cost?: number | string;
    quantity: number | string;
    unit: string;
    total_cost: number | string;
  };
}

const UpdateActualsModal: React.FC<UpdateActualsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    actual_quantity: 0,
    actual_cost: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        actual_quantity: Number(initialData.actual_quantity || 0),
        actual_cost: Number(initialData.actual_cost || 0),
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Failed to update actuals", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Update Actuals</h3>
            <p className="text-xs text-slate-500 font-medium">Tracking real-world performance</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {initialData && (
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Item Reference</p>
              <h4 className="font-bold text-slate-800">{initialData.item_name}</h4>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Estimated Qty</p>
                  <p className="text-sm font-semibold text-slate-600">{initialData.quantity} {initialData.unit}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Estimated Cost</p>
                  <p className="text-sm font-semibold text-slate-600">₹{parseFloat(initialData.total_cost.toString()).toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Actual Quantity ({initialData?.unit || 'Units'})
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.actual_quantity}
                onChange={(e) => setFormData({ ...formData, actual_quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                Actual Total Cost (₹)
              </label>
              <input
                type="number"
                required
                step="0.01"
                value={formData.actual_cost}
                onChange={(e) => setFormData({ ...formData, actual_cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-semibold text-primary"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/25 hover:bg-blue-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Actuals'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateActualsModal;
