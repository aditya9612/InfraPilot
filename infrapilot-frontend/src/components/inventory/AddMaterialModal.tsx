import { useState, useEffect, useRef, useMemo } from "react";
import Modal from "../common/Modal";
import { ChevronDown, Check, Search } from "lucide-react";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any | null;
  suppliers: any[];
  apiErrors?: Record<string, string>;
  projects: any[];
  masterMaterials: any[];
}

export default function AddMaterialModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  suppliers,
  apiErrors,
  projects,
  masterMaterials,
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
    minimum_stock_level: 0,
    material_master_id: undefined as number | undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState("");
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setErrors({});
    setIsSupplierDropdownOpen(false);
    setSupplierSearch("");
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(e.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setErrors({});
    setIsSupplierDropdownOpen(false);
    setSupplierSearch("");
    if (initialData) {
      setFormData({
        ...initialData,
        project_id: initialData.project_id || 1,
        material_master_id: initialData.material_master_id || undefined,
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
        minimum_stock_level: 0,
        material_master_id: undefined,
      });
    }
  }, [initialData, isOpen]);

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
      name === "payment_given" ||
      name === "minimum_stock_level"
    ) {
      value = value.replace(/[^\d]/g, "");
    }
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "purchase_rate" ||
          name === "quantity_purchased" ||
          name === "payment_given" ||
          name === "minimum_stock_level" ||
          name === "project_id" ||
          name === "material_master_id"
          ? (value === "" ? "" : Number(value))
          : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "minimum_stock_level") {
      if (value === "" || value === undefined || value === null) {
        setErrors((prev) => ({ ...prev, minimum_stock_level: "Minimum stock level is required." }));
      }
    }
    if (name === "payment_given" && !initialData) {
      if (value === "" || value === undefined || value === null) {
        setErrors((prev) => ({ ...prev, payment_given: "Payment given is required." }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.material_master_id)
      newErrors.material_master_id = "Please select a material master.";
    if (initialData && !(formData as any).supplier_id)
      newErrors.supplier_id = "Please select a supplier.";
    else if (!initialData && !formData.supplier_name)
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

    if ((formData as any).minimum_stock_level === "" || formData.minimum_stock_level === undefined || formData.minimum_stock_level === null) {
      newErrors.minimum_stock_level = "Minimum stock level is required.";
    }

    if (!initialData && ((formData as any).payment_given === "" || formData.payment_given === undefined || formData.payment_given === null)) {
      newErrors.payment_given = "Payment given is required.";
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
        onClick={handleClose}
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

  const selectedSupplierLabel = useMemo(() => {
    if (initialData) {
      const sId = (formData as any).supplier_id;
      if (!sId) return "";
      const sup = suppliers.find((s) => (s.id ?? s.supplier_id) === sId);
      return sup ? (sup.name || sup.supplier_name || `Supplier #${sId}`) : `Supplier #${sId}`;
    }
    return formData.supplier_name || "";
  }, [initialData, formData, suppliers]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch.trim()) return suppliers;
    const q = supplierSearch.toLowerCase();
    return suppliers.filter((sup) => {
      const name = typeof sup === "string" ? sup : (sup.name || sup.supplier_name || sup.contactPerson || sup.phone || "");
      return name.toLowerCase().includes(q);
    });
  }, [suppliers, supplierSearch]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
            {!initialData && (
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
            )}

            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Material Master <span className="text-rose-500">*</span>
              </label>
              <select
                name="material_master_id"
                value={formData.material_master_id || ""}
                onChange={(e) => {
                  const mId = Number(e.target.value);
                  const mat = masterMaterials.find((m) => m.id === mId);
                  setFormData((prev) => ({
                    ...prev,
                    material_master_id: mId,
                    material_name: mat ? (mat.title || mat.name || mat.material_name || prev.material_name) : prev.material_name,
                    category: mat && mat.category ? mat.category : prev.category,
                    unit: mat && mat.unit ? mat.unit : prev.unit,
                  }));
                  if (errors.material_master_id) setErrors((prev) => ({ ...prev, material_master_id: "" }));
                }}
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${errors.material_master_id
                  ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                  : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                  }`}
              >
                <option value="" disabled>Select Master Material</option>
                {masterMaterials.map((m: any) => (
                  <option key={m.id} value={m.id}>
                    {m.title || m.name || m.material_name}
                  </option>
                ))}
              </select>
              {errors.material_master_id && (
                <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">
                  {errors.material_master_id}
                </p>
              )}
            </div>


            <div className="md:col-span-2 space-y-1 relative" ref={supplierDropdownRef}>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Supplier <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsSupplierDropdownOpen((prev) => !prev)}
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm flex items-center justify-between text-left focus:outline-none focus:ring-4 transition-all ${
                  errors[initialData ? "supplier_id" : "supplier_name"]
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : isSupplierDropdownOpen
                    ? "border-primary ring-4 ring-primary/10"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                }`}
              >
                <span className={`truncate ${selectedSupplierLabel ? "text-slate-800 font-medium" : "text-gray-400"}`}>
                  {selectedSupplierLabel || "-- Select from Supplier DB --"}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform duration-200 ${isSupplierDropdownOpen ? "rotate-180 text-primary" : ""}`} />
              </button>

              {isSupplierDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={supplierSearch}
                        onChange={(e) => setSupplierSearch(e.target.value)}
                        placeholder="Search supplier..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                    {filteredSuppliers.length > 0 ? (
                      filteredSuppliers.map((sup) => {
                        const supId = sup.id ?? (sup as any).supplier_id;
                        const supName = typeof sup === "string" ? sup : (sup.name || (sup as any).supplier_name || sup.contactPerson || sup.phone || `Supplier #${supId}`);
                        const isSelected = initialData ? (formData as any).supplier_id === supId : formData.supplier_name === supName;
                        return (
                          <div
                            key={supId}
                            onClick={() => {
                              const val = initialData ? Number(supId) : supName;
                              setFormData(prev => ({ ...prev, [initialData ? "supplier_id" : "supplier_name"]: val }));
                              if (errors[initialData ? "supplier_id" : "supplier_name"]) {
                                setErrors((prev) => ({ ...prev, [initialData ? "supplier_id" : "supplier_name"]: "" }));
                              }
                              setIsSupplierDropdownOpen(false);
                              setSupplierSearch("");
                            }}
                            className={`px-4 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                              isSelected ? "bg-primary/10 text-primary font-bold" : "text-gray-700 hover:bg-gray-50 hover:text-primary"
                            }`}
                          >
                            <span className="truncate">{supName}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />}
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-xs text-gray-400 text-center italic">
                        No suppliers found
                      </div>
                    )}
                  </div>
                </div>
              )}
              {errors[initialData ? "supplier_id" : "supplier_name"] && (
                <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">
                  {errors[initialData ? "supplier_id" : "supplier_name"]}
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
                Minimum Stock Level <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="minimum_stock_level"
                value={(formData as any).minimum_stock_level === undefined ? "" : (formData as any).minimum_stock_level}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${errors.minimum_stock_level ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:ring-primary/10"}`}
                placeholder="Alert at e.g. 200"
              />
              {errors.minimum_stock_level && (
                <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">
                  {errors.minimum_stock_level}
                </p>
              )}
              {!errors.minimum_stock_level && (
                <p className="text-[10px] text-slate-400 font-medium mt-1 ml-1">
                  System will alert when stock falls below this level.
                </p>
              )}
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
                    Payment Given <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                      ₹
                    </span>
                    <input
                      type="text"
                      name="payment_given"
                      value={formData.payment_given === undefined ? "" : formData.payment_given}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full pl-10 pr-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-primary/20 transition-all outline-none text-emerald-600 font-bold ${errors.payment_given ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" : "border-gray-200 focus:border-primary"}`}
                      placeholder="0"
                    />
                  </div>
                  {errors.payment_given && (
                    <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">
                      {errors.payment_given}
                    </p>
                  )}
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

            {/* Payment Given (Additional) removed from Update mode as per backend structure */}
          </div>
        </div>
      </form>
    </Modal>
  );
}
