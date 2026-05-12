import React, { useState } from "react";
import { X, UserPlus, Building, Mail, Phone, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

interface CreateClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      company: "",
      email: "",
      mobile: "",
      project: "",
      status: "Active",
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = "Client name is required.";
    if (!formData.company.trim()) newErrors.company = "Company name is required.";
    if (!formData.email.trim()) newErrors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email format.";
    
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required.";
    else if (formData.mobile.length !== 10) newErrors.mobile = "Mobile must be 10 digits.";
    
    if (!formData.project.trim()) newErrors.project = "Project assignment is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields correctly.");
      return;
    }

    setErrors({});
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 scale-in-center flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UserPlus size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                {initialData ? "Edit Client Profile" : "Onboard New Client"}
              </h2>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-0.5">
                Relationship Management
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-slate-600"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="font-semibold text-gray-700">Client Information</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Client Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <UserPlus size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Vikram Sethi"
                    className={`w-full pl-11 pr-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${
                      errors.name 
                        ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                        : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value.replace(/[^a-zA-Z\s]/g, "") });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Company Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Building size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Sethi Group"
                    className={`w-full pl-11 pr-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${
                      errors.company 
                        ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                        : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                    value={formData.company}
                    onChange={(e) => {
                      setFormData({ ...formData, company: e.target.value });
                      if (errors.company) setErrors({ ...errors, company: "" });
                    }}
                  />
                </div>
                {errors.company && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.company}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    placeholder="vikram@sethigroup.com"
                    className={`w-full pl-11 pr-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${
                      errors.email 
                        ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                        : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.email}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Phone size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="9876543210"
                    className={`w-full pl-11 pr-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${
                      errors.mobile 
                        ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                        : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                    value={formData.mobile}
                    onChange={(e) => {
                      setFormData({ ...formData, mobile: e.target.value.replace(/[^\d]/g, "").slice(0, 10) });
                      if (errors.mobile) setErrors({ ...errors, mobile: "" });
                    }}
                  />
                </div>
                {errors.mobile && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.mobile}</p>}
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Primary Project Assignment <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Briefcase size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="e.g. Skyline Tower A"
                    className={`w-full pl-11 pr-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-4 transition-all outline-none ${
                      errors.project 
                        ? "border-rose-300 focus:ring-rose-500/10 focus:border-rose-500" 
                        : "border-gray-200 focus:ring-primary/10 focus:border-primary"
                    }`}
                    value={formData.project}
                    onChange={(e) => {
                      setFormData({ ...formData, project: e.target.value });
                      if (errors.project) setErrors({ ...errors, project: "" });
                    }}
                  />
                </div>
                {errors.project && <p className="text-[11px] text-rose-500 font-medium ml-1 mt-1">{errors.project}</p>}
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
              {initialData ? "Update Client" : "Add to Portfolio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateClientModal;
