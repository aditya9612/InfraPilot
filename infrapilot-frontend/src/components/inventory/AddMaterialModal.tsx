import { useState, useEffect } from "react";

interface AddMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any | null;
  suppliers: any[];
}

export default function AddMaterialModal({ isOpen, onClose, onSubmit, initialData, suppliers }: AddMaterialModalProps) {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "purchase_rate" || name === "quantity_purchased" || name === "payment_given" || name === "project_id"
        ? Number(value)
        : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const totalAmount = (formData.purchase_rate || 0) * (formData.quantity_purchased || 0);
  const paymentPending = totalAmount - (formData.payment_given || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? "Update Material Record" : "Register New Material"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Material Name *</label>
              <input required type="text" name="material_name" value={formData.material_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="e.g. Premium Cement 53 Grade" />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Category *</label>
              <input required type="text" name="category" value={formData.category} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="e.g. Masonry" />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Unit of Measurement *</label>
              <input required type="text" name="unit" value={formData.unit} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="e.g. Bags, Liters" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Supplier Name *</label>
              <select required name="supplier_name" value={formData.supplier_name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm">
                <option value="" disabled>-- Select from Supplier DB --</option>
                {suppliers.map(sup => (
                  <option key={sup.id} value={sup.name}>{sup.name}</option>
                ))}
                <option value="Other">Other (Typing allowed in a real combobox)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Purchase Rate *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span>
                <input required type="number" name="purchase_rate" value={formData.purchase_rate || ""} onChange={handleChange} className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="0.00" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Rate Type *</label>
              <input required type="text" name="rate_type" value={formData.rate_type} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="e.g. per bag" />
            </div>

            {!initialData && (
              <>
                <div className="space-y-1 border-t border-slate-100 pt-4 mt-2">
                  <label className="block text-sm font-semibold text-slate-700">Initial Quantity Purchased *</label>
                  <input required type="number" name="quantity_purchased" value={formData.quantity_purchased || ""} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="0" />
                </div>

                <div className="space-y-1 border-t border-slate-100 pt-4 mt-2">
                  <label className="block text-sm font-semibold text-slate-700">Payment Given Upfront</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span>
                    <input type="number" name="payment_given" value={formData.payment_given || ""} onChange={handleChange} className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="0.00" />
                  </div>
                </div>

                {/* Financial Summary Box */}
                <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-4 mt-2">
                   <div className="flex justify-between text-sm mb-1">
                       <span className="text-slate-500">Total Purchase Amount:</span>
                       <span className="font-bold text-slate-700">₹{totalAmount.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                       <span className="text-slate-500">Pending Payables:</span>
                       <span className={`font-bold ${paymentPending > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                           ₹{paymentPending.toLocaleString()}
                       </span>
                   </div>
                </div>
              </>
            )}

            {initialData && (
                <div className="space-y-1 md:col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <label className="block text-sm font-semibold text-slate-700">Add Payment</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span>
                    <input type="number" name="payment_given" value={formData.payment_given || ""} onChange={handleChange} className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="Amount to add to current payment" />
                  </div>
                   <p className="text-xs text-slate-400 mt-1">Leaves this blank if you are only updating material details.</p>
                </div>
            )}
            
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-blue-600 rounded-xl shadow-lg shadow-primary/20 transition-all">
              {initialData ? "Save Changes" : "Register Material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
