import { useState, useEffect } from "react";

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

  if (!isOpen) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity font-inter">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
                {initialData ? "Update Material Record" : "Register New Material"}
            </h2>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Inventory Control Management</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Material Name *</label>
              <input
                required
                type="text"
                name="material_name"
                value={formData.material_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                placeholder="e.g. Premium Cement 53 Grade"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category *</label>
              <input
                required
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                placeholder="e.g. Masonry"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit *</label>
              <input
                required
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                placeholder="e.g. Bags, Liters"
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Supplier *</label>
              <select
                required
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none appearance-none"
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

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Purchase Rate *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                  ₹
                </span>
                <input
                  required
                  type="number"
                  name="purchase_rate"
                  value={formData.purchase_rate || ""}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rate Type *</label>
              <input
                required
                type="text"
                name="rate_type"
                value={formData.rate_type}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                placeholder="e.g. per bag"
              />
            </div>

            {!initialData && (
              <>
                <div className="space-y-1.5 border-t border-slate-100 pt-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Opening Quantity *</label>
                  <input
                    required
                    type="number"
                    name="quantity_purchased"
                    value={formData.quantity_purchased || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1.5 border-t border-slate-100 pt-6">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Payment</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                      ₹
                    </span>
                    <input
                      type="number"
                      name="payment_given"
                      value={formData.payment_given || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold outline-none text-emerald-600"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="md:col-span-2 bg-slate-900 rounded-[28px] p-6 mt-2 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-16 -mt-16" />
                  <div className="flex justify-between items-center mb-4 relative z-10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Procurement Valuation
                    </span>
                    <span className="text-xl font-black text-white">
                      ₹{totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-white/10 relative z-10">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Initial Pending Balance</span>
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
              <div className="space-y-1.5 md:col-span-2 border-t border-slate-100 pt-6 mt-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-primary">Record Additional Payment</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="payment_given"
                    value={formData.payment_given || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm font-black outline-none text-emerald-600 shadow-sm"
                    placeholder="Enter amount to add to ledger"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight mt-2 ml-1 italic">
                  * Only enter the amount being paid now. Existing payments are preserved.
                </p>
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-8 py-2.5 text-sm font-bold text-white bg-primary hover:bg-blue-600 rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              {initialData ? "Save Record Updates" : "Register Material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

