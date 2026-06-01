import { useState, useEffect } from "react";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any | null;
  apiErrors?: Record<string, string>;
}

export default function SupplierModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  apiErrors,
}: SupplierModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    contact: "",
    gst: "",
    address: "",
  });

  useEffect(() => {
    if (initialData) {
      const contactStr = initialData.contact || initialData.phone || initialData.email || "";
      setFormData({
        name: initialData.name || "",
        contactPerson: initialData.contactPerson || "",
        contact: contactStr,
        gst: initialData.gst || "",
        address: initialData.address || "",
      });
    } else {
      setFormData({
        name: "",
        contactPerson: "",
        contact: "",
        gst: "",
        address: "",
      });
    }
  }, [initialData, isOpen]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Merge backend errors into form errors
  useEffect(() => {
    if (apiErrors && Object.keys(apiErrors).length > 0) {
      setErrors(prev => ({ ...prev, ...apiErrors }));
    }
  }, [apiErrors]);

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    let { name, value } = e.target;
    if (name === "contactPerson") {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    } else if (name === "gst") {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 15);
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Supplier name is required.";
    if (!formData.contactPerson.trim()) newErrors.contactPerson = "Contact person is required.";

    const val = formData.contact.trim();
    if (!val) {
      newErrors.contact = "Phone number or email address is required.";
    } else {
      const isPhone = /^\d{10}$/.test(val);
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
      if (!isPhone && !isEmail) {
        newErrors.contact = "Enter a valid 10-digit phone number or email address.";
      }
    }

    if (!formData.gst.trim()) newErrors.gst = "GST Number is required.";
    else if (formData.gst.length !== 15) newErrors.gst = "GST Number must be 15 characters.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onSubmit({
      ...formData,
      phone: /^\d{10}$/.test(formData.contact.trim()) ? formData.contact.trim() : "",
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact.trim()) ? formData.contact.trim() : "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity font-inter">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                {initialData ? "Edit Supplier" : "Register New Supplier"}
              </h2>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-0.5">
                Supplier Database Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
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
                strokeWidth="2.5"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="font-semibold text-gray-700">Business Identity & Contact</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Supplier / Agency Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-4 transition-all text-sm outline-none ${errors.name
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                  placeholder="e.g. Asian Paints Dealer"
                />
                {errors.name && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.name}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Contact Person <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-4 transition-all text-sm outline-none ${errors.contactPerson
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                  placeholder="e.g. Rajesh Kumar"
                />
                {errors.contactPerson && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.contactPerson}</p>}
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Phone Number or Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-4 transition-all text-sm outline-none ${errors.contact
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                  placeholder="e.g. 9876543210 or contact@supplier.com"
                />
                {!errors.contact && (
                  <p className="text-[10px] text-gray-400 font-medium ml-1 mt-1">Enter either a 10-digit phone number or a valid email address.</p>
                )}
                {errors.contact && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.contact}</p>}
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  GST Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="gst"
                  value={formData.gst}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-4 transition-all text-sm outline-none uppercase ${errors.gst
                    ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500"
                    : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                  maxLength={15}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                />
                {!errors.gst && (
                  <p className="text-[10px] text-gray-400 font-medium ml-1 mt-1">
                    Format: 2 numbers, 5 alphabets, 4 numbers, 1 alphabet, 1 number, 1 alphabet, 1 number
                  </p>
                )}
                {errors.gst && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.gst}</p>}
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Office Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={2}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm outline-none resize-none"
                  placeholder="e.g. Mumbai, Maharashtra"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-sm font-semibold border border-gray-200 hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {initialData ? "Update Supplier Info" : "Register Supplier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

