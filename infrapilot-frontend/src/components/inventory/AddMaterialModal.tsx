import { useState, useEffect } from "react";
import Modal from "../common/Modal";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any | null;
  suppliers: any[];
  apiErrors?: Record<string, string>;
  projects: any[];
}

export default function AddMaterialModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  suppliers,
  apiErrors,
  projects,
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
    minimum_stock_level: 200,
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
        minimum_stock_level: 200,
      });
    }
  }, [initialData, isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (apiErrors && Object.keys(apiErrors).length > 0) {
      setErrors((prev) => ({ ...prev, ...apiErrors }));
    }
  }, [apiErrors]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    let { name, value } = e.target;
    if (
      name === "purchase_rate" ||
      name === "quantity_purchased" ||
      name === "payment_given"
    ) {
      value = value.replace(/[^\d]/g, "");
    }
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
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.material_name.trim())
      newErrors.material_name = "Material name is required.";
    if (!formData.category.trim()) newErrors.category = "Category is required.";
    if (!formData.unit.trim()) newErrors.unit = "Unit is required.";
    if (!formData.supplier_name)
      newErrors.supplier_name = "Please select a supplier.";
    if (!formData.purchase_rate || formData.purchase_rate <= 0)
      newErrors.purchase_rate = "Purchase rate must be greater than 0.";
    if (!formData.rate_type.trim())
      newErrors.rate_type = "Rate type is required.";
    if (
      !initialData &&
      (!formData.quantity_purchased || formData.quantity_purchased <= 0)
    ) {
      newErrors.quantity_purchased = "Opening quantity must be greater than 0.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  const modalFooter = (
    <div className="flex justify-end gap-3">
      <button
        type="button"
        onClick={onClose}
        className="px-6 py-2.5 text-sm font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
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

  const totalAmount =
    (formData.purchase_rate || 0) * (formData.quantity_purchased || 0);
  const paymentPending = totalAmount - (formData.payment_given || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Update Material Record" : "Register New Material"}
      footer={modalFooter}
      maxWidth="max-w-2xl"
    >
      <form
        id="add-material-form"
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Material details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Project ID <span className="text-rose-500">*</span>
              </label>
              <select
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all appearance-none outline-none"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.name || proj.project_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Material name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="material_name"
                value={formData.material_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${errors.material_name
                  ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                  }`}
                placeholder="e.g. Premium Cement 53 Grade"
              />
              {errors.material_name && (
                <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">
                  {errors.material_name}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${errors.category
                  ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                  }`}
                placeholder="e.g. Masonry"
              />
              {errors.category && (
                <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">
                  {errors.category}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Unit <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${errors.unit
                  ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                  }`}
                placeholder="e.g. Bags, Liters"
              />
              {errors.unit && (
                <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">
                  {errors.unit}
                </p>
              )}
            </div>

            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Supplier <span className="text-rose-500">*</span>
              </label>
              <select
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none appearance-none ${errors.supplier_name
                  ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                  }`}
              >
                <option value="" disabled>
                  -- Select from Supplier DB --
                </option>
                {suppliers.map((sup) => {
                  const supId = sup.id ?? (sup as any).supplier_id;
                  const supName = typeof sup === "string" ? sup : (sup.name || (sup as any).supplier_name || sup.contactPerson || sup.phone || `Supplier #${supId}`);
                  return (
                    <option key={supId} value={supName}>
                      {supName}
                    </option>
                  );
                })}
              </select>
              {errors.supplier_name && (
                <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">
                  {errors.supplier_name}
                </p>
              )}
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
                  type="text"
                  name="purchase_rate"
                  value={formData.purchase_rate || ""}
                  onChange={handleChange}
                  className={`w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${errors.purchase_rate
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                  placeholder="0"
                />
              </div>
              {errors.purchase_rate && (
                <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">
                  {errors.purchase_rate}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Rate type <span className="text-rose-500">*</span>
              </label>
              <select
                name="rate_type"
                value={formData.rate_type}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none appearance-none ${errors.rate_type
                  ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                  }`}
              >
                <option value="" disabled>-- Select rate type --</option>
                <option value="FIXED">FIXED</option>
                <option value="PER_UNIT">PER_UNIT</option>
                <option value="PER_KG">PER_KG</option>
                <option value="PER_TON">PER_TON</option>
                <option value="PER_BAG">PER_BAG</option>
              </select>
              {errors.rate_type && (
                <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">
                  {errors.rate_type}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Minimum Stock Level
              </label>
              <input
                type="text"
                name="minimum_stock_level"
                value={(formData as any).minimum_stock_level || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                placeholder="Alert at e.g. 200"
              />
              <p className="text-[10px] text-slate-400 font-medium mt-1 ml-1">
                System will alert when stock falls below this level.
              </p>
            </div>

            {!initialData && (
              <>
                <div className="space-y-1 border-t border-slate-50 pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Quantity Purchased <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="quantity_purchased"
                    value={formData.quantity_purchased || ""}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${errors.quantity_purchased
                      ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                      : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                      }`}
                    placeholder="0"
                  />
                  {errors.quantity_purchased && (
                    <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">
                      {errors.quantity_purchased}
                    </p>
                  )}
                </div>

                <div className="space-y-1 border-t border-slate-50 pt-4 mt-2">
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Payment Given
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                      ₹
                    </span>
                    <input
                      type="text"
                      name="payment_given"
                      value={formData.payment_given || ""}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-primary/20 focus:border-primary transition-all outline-none text-emerald-600 font-bold"
                      placeholder="0"
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
                    <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                      Initial pending balance
                    </span>
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
                <label className="block text-sm font-medium text-primary mb-1">
                  Payment Given (Additional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                    ₹
                  </span>
                  <input
                    type="text"
                    name="payment_given"
                    value={formData.payment_given || ""}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-emerald-600 shadow-sm"
                    placeholder="Enter amount to add to ledger"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-2 ml-1 italic">
                  * Only enter the amount being paid now. Existing payments are
                  preserved.
                </p>
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
