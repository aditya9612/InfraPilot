import React, { useState, useEffect } from "react";
import { X, UserCheck, Mail, Phone, Award, Briefcase, Tag, Calendar } from "lucide-react";
import toast from "react-hot-toast";

interface CreateEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const defaultForm = {
  name: "",
  email: "",
  mobile: "",
  experience: "",
  projects: "",
  specialization: "Structural Engineering",
  joiningDate: new Date().toISOString().split('T')[0],
  status: "On Site",
};

const CreateEngineerModal: React.FC<CreateEngineerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState(initialData || defaultForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Re-sync form whenever the modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || defaultForm);
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Full name is required.";
    if (!formData.email.trim()) newErrors.email = "Email address is required.";
    if (!formData.mobile.trim()) newErrors.mobile = "Mobile number is required.";
    if (!formData.experience.trim()) newErrors.experience = "Experience is required.";
    if (!formData.projects.trim()) newErrors.projects = "Project assignment is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fill in all required fields.");
      return;
    }

    onSubmit({
      ...formData,
      lastDsr: new Date(Date.now() - 86400000).toISOString(), // Default for new engineers
      performance: "Good (Initial)"
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UserCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                {initialData ? "Refine Engineer Info" : "Engineer Onboarding"}
              </h2>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-0.5">
                On-Site Staff Records
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              <div className="relative">
                <UserCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Arjun Mehta"
                />
              </div>
              {errors.name && <p className="text-[10px] text-rose-500 font-bold uppercase">{errors.name}</p>}
            </div>

            {/* Email & Mobile */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@infrapilot.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Mobile Number</label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
            </div>

            {/* Experience & Joining Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Exp (Years)</label>
              <div className="relative">
                <Award size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Joining Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                />
              </div>
            </div>

            {/* Specialization & Project */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Specialization</label>
              <div className="relative">
                <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none appearance-none"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                >
                  <option value="Structural Engineering">Structural</option>
                  <option value="Civil & Infrastructure">Civil & Infra</option>
                  <option value="Electrical & MEP">Electrical & MEP</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Safety & Compliance">Safety Officer</option>
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Current Assignment</label>
              <div className="relative">
                <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                  value={formData.projects}
                  onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                  placeholder="e.g. Skyline Residency"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-50 text-slate-500 rounded-xl text-sm font-bold border border-slate-200 hover:bg-white transition-all"
            >
              Discard
            </button>
            <button
              type="submit"
              className="flex-1 px-8 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 transition-transform"
            >
              {initialData ? "Update Record" : "Deploy Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEngineerModal;
