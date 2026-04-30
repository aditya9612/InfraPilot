import { useState, useEffect } from "react";
import Modal from "../common/Modal";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any | null;
  suppliers: any[];
}

export default function AddMaterialModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  suppliers,
}: AddMaterialModalProps) {
  const [formData, setFormData] = useState({
    project_id: 1, // Default mock project
    material_name: "",
    category: "",
    unit: "",
    supplier_name: "",
    purchase_rate: 0,
    rate_type: "",
    quantity_purchased: 0,
    payment_given: 0,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        project_id: initialData.project_id || 1,
        payment_given: 0, // Reset for "Add Payment" logic in edit mode
      });
    } else {
      setFormData({
        project_id: 1,
        material_name: "",
        category: "",
        unit: "",
        supplier_name: "",
        purchase_rate: 0,
        rate_type: "",
        quantity_purchased: 0,
        payment_given: 0,
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "purchase_rate" ||
        name === "quantity_purchased" ||
        name === "payment_given" ||
        name === "project_id"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const totalAmount =
    (formData.purchase_rate || 0) * (formData.quantity_purchased || 0);
  const paymentPending = totalAmount - (formData.payment_given || 0);

  const modalFooter = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
      >
        Cancel
      </button>
      <button
        form="add-material-form"
        type="submit"
        className="px-8 py-2.5 text-sm font-bold text-white bg-primary hover:bg-blue-600 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
      >
        {initialData ? "Save Record Updates" : "Register Material"}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Update Material Record" : "Register New Material"}
      footer={modalFooter}
      maxWidth="max-w-2xl"
    >
      <form id="add-material-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Material details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Material name <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                name="material_name"
                value={formData.material_name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="e.g. Premium Cement 53 Grade"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="e.g. Masonry"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Unit <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="e.g. Bags, Liters"
              />
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Assigned supplier <span className="text-rose-500">*</span>
              </label>
              <select
                required
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none"
              >
                <option value="" disabled>
                  -- Select from Supplier DB --
                </option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.name}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Purchase rate <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                  ₹
                </span>
                <input
                  required
                  type="number"
                  name="purchase_rate"
                  value={formData.purchase_rate || ""}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Rate type <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                name="rate_type"
                value={formData.rate_type}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all outline-none"
                placeholder="e.g. per bag"
              />
            </div>

            {!initialData && (
              <>
                <div className="space-y-1 border-t border-slate-50 pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Opening quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    name="quantity_purchased"
                    value={formData.quantity_purchased || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1 border-t border-slate-50 pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Initial payment
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="payment_given"
                      value={formData.payment_given || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all outline-none text-emerald-600 font-bold"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="md:col-span-2 bg-slate-900 rounded-2xl p-6 mt-2 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                      Procurement valuation
                    </span>
                    <span className="text-xl font-black text-white">
                      ₹{totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/10 relative z-10">
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Initial pending balance</span>
                    <span
                      className={`text-sm font-black ${paymentPending > 0 ? "text-amber-400" : "text-emerald-400"}`}
                    >
                      ₹{paymentPending.toLocaleString()}
                    </span>
                  </div>
                </div>
              </>
            )}

            {initialData && (
              <div className="space-y-1 md:col-span-2 border-t border-slate-50 pt-4 mt-2">
                <label className="block text-sm font-medium text-primary mb-1">Record additional payment</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="payment_given"
                    value={formData.payment_given || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-emerald-600 shadow-sm"
                    placeholder="Enter amount to add to ledger"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-2 ml-1 italic">
                  * Only enter the amount being paid now. Existing payments are preserved.
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}

