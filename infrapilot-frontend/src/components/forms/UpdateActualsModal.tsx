import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";

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
    actual_quantity: "",
    actual_cost: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        actual_quantity: (initialData.actual_quantity || 0).toString(),
        actual_cost: (initialData.actual_cost || 0).toString(),
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        actual_quantity: parseFloat(formData.actual_quantity) || 0,
        actual_cost: parseFloat(formData.actual_cost) || 0,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update actuals", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isSubmitting}
        className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        form="update-actuals-form"
        type="submit"
        disabled={isSubmitting}
        className={`px-8 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 ${isSubmitting ? "opacity-70 cursor-not-allowed" : "active:scale-95"
          }`}
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Updating...
          </>
        ) : (
          "Save Actuals"
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Actuals"
      footer={modalFooter}
      maxWidth="max-w-md"
    >
      <form id="update-actuals-form" onSubmit={handleSubmit} noValidate>
        {initialData && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h3 className="font-semibold text-gray-700">Item Reference</h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <h4 className="font-semibold text-gray-700 mb-3">{initialData.item_name}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Estimated Qty</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {initialData.quantity} {initialData.unit}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Estimated Cost</p>
                  <p className="text-sm font-semibold text-gray-800">
                    ₹{parseFloat(initialData.total_cost.toString()).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full" />
            <h3 className="font-semibold text-gray-700">Actual Values</h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Actual Quantity ({initialData?.unit || "Units"})
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                required
                value={formData.actual_quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                    setFormData({ ...formData, actual_quantity: val });
                  }
                }}
                onFocus={(e) => e.target.select()}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl transition-all outline-none font-semibold"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Actual Total Cost (₹)
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={formData.actual_cost}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                    setFormData({ ...formData, actual_cost: val });
                  }
                }}
                onFocus={(e) => e.target.select()}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl transition-all outline-none font-semibold"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateActualsModal;
