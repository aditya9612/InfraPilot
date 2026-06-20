import { useState } from "react";

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  suppliers: any[];
}

export default function PurchaseOrderModal({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
}: PurchaseOrderModalProps) {
  const [formData, setFormData] = useState({
    materialName: "",
    category: "Construction",
    supplierId: "",
    projectId: 1, // Mock project ID
    quantity: 0,
    unit: "Pieces",
    rate: 0,
    expectedDelivery: "",
  });

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "quantity" || name === "rate" || name === "projectId"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      materialName: "",
      category: "Construction",
      supplierId: "",
      projectId: 1,
      quantity: 0,
      unit: "Pieces",
      rate: 0,
      expectedDelivery: "",
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Create Purchase Order
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Issue a formal request for materials from a supplier.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
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

        <form onSubmit={handleSubmit} className="p-6 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1 md:col-span-2 border-b border-slate-100 pb-4">
              <label className="block text-sm font-semibold text-slate-700">
                Deliver To Project Site *
              </label>
              <select
                required
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value={1}>Site A - City Center Complex</option>
                <option value={2}>Site B - Riverside Apartments</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">
                Select Supplier *
              </label>
              <select
                required
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="" disabled>
                  -- Select Supplier --
                </option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.contactPerson || "No Contact"})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">
                Material Name *
              </label>
              <input
                required
                type="text"
                name="materialName"
                value={formData.materialName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g. Bricks"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">
                Category
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder="e.g. Construction"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">
                Quantity Ordered *
              </label>
              <div className="flex gap-2">
                <input
                  required
                  type="number"
                  name="quantity"
                  value={formData.quantity || ""}
                  onChange={handleChange}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="0"
                />
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  className="w-24 px-2 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="Pieces">Pieces</option>
                  <option value="Bags">Bags</option>
                  <option value="Tons">Tons</option>
                  <option value="Liters">Liters</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">
                Expected Rate (Per Unit) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  ₹
                </span>
                <input
                  required
                  type="number"
                  name="rate"
                  value={formData.rate || ""}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">
                Expected Delivery Date
              </label>
              <input
                type="date"
                name="expectedDelivery"
                value={formData.expectedDelivery}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">
                Total Valuation
              </label>
              <div className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-bold">
                ₹{" "}
                {(formData.quantity * formData.rate).toLocaleString() || "0.00"}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Issue Purchase Order
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
