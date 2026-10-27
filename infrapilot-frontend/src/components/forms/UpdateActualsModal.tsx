import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrors({});
      if (initialData) {
        const qtyNum = Number(initialData.actual_quantity);
        const costNum = Number(initialData.actual_cost);
        setFormData({
          actual_quantity: qtyNum > 0 ? initialData.actual_quantity!.toString() : "",
          actual_cost: costNum > 0 ? initialData.actual_cost!.toString() : "",
        });
      } else {
        setFormData({
          actual_quantity: "",
          actual_cost: "",
        });
      }
    }
  }, [initialData, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const qty = parseFloat(formData.actual_quantity);
    const cost = parseFloat(formData.actual_cost);

    if (formData.actual_quantity.trim() === "" || isNaN(qty)) {
      newErrors.actual_quantity = "Actual Quantity is required.";
    } else if (qty <= 0) {
      newErrors.actual_quantity = "Actual Quantity must be greater than 0.";
    }

    if (formData.actual_cost.trim() === "" || isNaN(cost)) {
      newErrors.actual_cost = "Actual Total Cost is required.";
    } else if (cost <= 0) {
      newErrors.actual_cost = "Actual Total Cost must be greater than 0.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const messages = Object.values(newErrors);
      toast.error(messages.join(" "));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        actual_quantity: parseFloat(formData.actual_quantity),
        actual_cost: parseFloat(formData.actual_cost),
      });
      onClose();
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      const backendErrors: Record<string, string> = {};
      let errorMsg = "Failed to update actuals";

      if (Array.isArray(detail)) {
        detail.forEach((d: any) => {
          const field = d.loc?.[d.loc.length - 1];
          const clean = (d.msg || "").replace(/^Value error,\s*/i, "");
          if (field) {
            backendErrors[field] = clean.includes("greater than 0")
              ? `${field === "actual_quantity" ? "Actual Quantity" : "Actual Total Cost"} must be greater than 0.`
              : clean;
          }
        });
        const firstField = detail[0]?.loc?.[detail[0]?.loc?.length - 1];
        const rawClean = (detail[0]?.msg || "").replace(/^Value error,\s*/i, "");
        const label = firstField === "actual_quantity" ? "Actual Quantity" : firstField === "actual_cost" ? "Actual Total Cost" : "";
        errorMsg = label ? `${label}: ${rawClean}` : rawClean || errorMsg;
      } else if (typeof detail === "string") {
        errorMsg = detail.replace(/^Value error,\s*/i, "");
      } else if (error?.response?.data?.message) {
        errorMsg = error.response.data.message;
      }

      if (Object.keys(backendErrors).length > 0) {
        setErrors(backendErrors);
      }
      toast.error(errorMsg);
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
      <form id="update-actuals-form" onSubmit={handleSubmit}>
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
                Actual Quantity ({initialData?.unit || "Units"}) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                autoFocus
                value={formData.actual_quantity}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                    setFormData(prev => ({ ...prev, actual_quantity: val }));
                    if (errors.actual_quantity) {
                      setErrors(prev => ({ ...prev, actual_quantity: "" }));
                    }
                  }
                }}
                onFocus={(e) => e.target.select()}
                className={`w-full px-4 py-2.5 bg-gray-50 border ${
                  errors.actual_quantity ? "border-rose-400 ring-1 ring-rose-200" : "border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                } rounded-xl transition-all outline-none font-semibold text-sm`}
                placeholder="0.00"
              />
              {errors.actual_quantity && (
                <p className="mt-1 text-[11px] text-rose-500 font-bold ml-1">{errors.actual_quantity}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Actual Total Cost (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.actual_cost}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "" || /^[0-9]*\.?[0-9]*$/.test(val)) {
                    setFormData(prev => ({ ...prev, actual_cost: val }));
                    if (errors.actual_cost) {
                      setErrors(prev => ({ ...prev, actual_cost: "" }));
                    }
                  }
                }}
                onFocus={(e) => e.target.select()}
                className={`w-full px-4 py-2.5 bg-gray-50 border ${
                  errors.actual_cost ? "border-rose-400 ring-1 ring-rose-200" : "border-gray-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                } rounded-xl transition-all outline-none font-semibold text-sm`}
                placeholder="0.00"
              />
              {errors.actual_cost && (
                <p className="mt-1 text-[11px] text-rose-500 font-bold ml-1">{errors.actual_cost}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default UpdateActualsModal;
