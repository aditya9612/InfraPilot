import { useState } from "react";

interface PurchaseActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  material: any;
  actionType: "purchase" | "usage"; // "purchase" increases stock, "usage" decreases stock
}

export default function PurchaseActionModal({ isOpen, onClose, onSubmit, material, actionType }: PurchaseActionModalProps) {
  const [formData, setFormData] = useState({
    quantity: 0,
    payment: 0,
  });

  if (!isOpen || !material) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: Number(value),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...formData, actionType });
    setFormData({ quantity: 0, payment: 0 });
  };

  const isUsage = actionType === "usage";
  const title = isUsage ? "Log Material Usage" : "Record New Purchase";
  const qtyLabel = isUsage ? "Quantity Used *" : "Quantity Purchased *";
  const paymentLabel = isUsage ? "Associated Payment (Optional)" : "Payment Given Upfront *";
  
  // Predict new state
  const newStock = isUsage 
        ? material.remaining_stock - (formData.quantity || 0)
        : material.remaining_stock + (formData.quantity || 0);
  
  // Note: Only purchases increase total amount in this schema, usage doesn't inherently cost more money on the spot.
  const newTotalAmount = isUsage ? material.total_amount : material.total_amount + ((formData.quantity || 0) * material.purchase_rate);
  const newPaymentGiven = material.payment_given + (formData.payment || 0);
  const newPending = newTotalAmount - newPaymentGiven;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 ${isUsage ? 'bg-amber-50' : 'bg-emerald-50'}`}>
          <div>
            <h2 className={`text-xl font-bold ${isUsage ? 'text-amber-900' : 'text-emerald-900'}`}>{title}</h2>
            <p className={`text-xs mt-1 ${isUsage ? 'text-amber-700/70' : 'text-emerald-700/70'}`}>
                Material: {material.material_name} ({material.unit})
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">{qtyLabel}</label>
              <div className="relative">
                <input
                  required
                  type="number"
                  name="quantity"
                  max={isUsage ? material.remaining_stock : undefined}
                  value={formData.quantity || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2 pr-16 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
                  {material.unit}
                </span>
              </div>
              {isUsage && formData.quantity > material.remaining_stock && (
                  <p className="text-xs text-rose-500 mt-1">Cannot exceed remaining inventory ({material.remaining_stock})</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">{paymentLabel}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">₹</span>
                <input
                  required={!isUsage}
                  type="number"
                  name="payment"
                  value={formData.payment || ""}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Current Inventory:</span>
                    <span className="font-bold text-slate-700">{material.remaining_stock} {material.unit}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Projected Inventory:</span>
                    <span className={`font-bold ${newStock < 10 ? 'text-rose-500' : 'text-primary'}`}>{newStock} {material.unit}</span>
                </div>
                {!isUsage && (
                    <>
                        <div className="h-px bg-slate-200 my-2"></div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">New Total Valuation:</span>
                            <span className="font-bold text-slate-700">₹{newTotalAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">New Payment Pending:</span>
                            <span className={`font-bold ${newPending > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>₹{newPending.toLocaleString()}</span>
                        </div>
                    </>
                )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={isUsage && formData.quantity > material.remaining_stock}
              className={`px-5 py-2.5 text-sm font-semibold text-white rounded-xl shadow-lg transition-all ${isUsage ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isUsage ? "Submit Usage Log" : "Confirm Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
