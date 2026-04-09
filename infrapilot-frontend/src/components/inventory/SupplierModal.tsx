import { useState, useEffect } from "react";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any | null;
}

export default function SupplierModal({ isOpen, onClose, onSubmit, initialData }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    gst: "",
    address: ""
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        gst: "",
        address: ""
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            {initialData ? "Edit Supplier" : "Add New Supplier"}
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Company Name *</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="e.g. UltraTech Cement Ltd" />
            </div>
            
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Contact Person</label>
              <input type="text" name="contactPerson" value={formData.contactPerson} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="John Doe" />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Phone *</label>
              <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="+91 98765 43210" />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="contact@company.com" />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-slate-700">GST Number</label>
              <input type="text" name="gst" value={formData.gst} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="22AAAAA0000A1Z5" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700">Registered Address</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm" placeholder="Full address" />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-blue-600 rounded-xl shadow-lg shadow-primary/20 transition-all">{initialData ? "Update Supplier" : "Add Supplier"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
