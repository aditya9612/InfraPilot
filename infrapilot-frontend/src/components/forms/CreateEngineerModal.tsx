import React, { useState } from "react";
import { X, UserCheck, Mail, Phone, Award, Briefcase } from "lucide-react";
import toast from "react-hot-toast";

interface CreateEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

const CreateEngineerModal: React.FC<CreateEngineerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: "",
      email: "",
      mobile: "",
      experience: "",
      projects: "",
      performance: "Good",
      status: "On Site",
      reportStatus: "Pending"
    }
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Please fill in all required fields.");
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 scale-in-center">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UserCheck size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {initialData ? "Edit Engineer Info" : "Onboard Site Engineer"}
              </h2>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                Staff Deployment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200/50 rounded-xl transition-all text-slate-400 hover:text-slate-600"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <UserCheck size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Mehta"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="arjun.m@infrapilot.com"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone size={16} />
                </span>
                <input
                  type="text"
                  required
                  placeholder="+91 95566 77889"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Years of Experience
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Award size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. 8 Years"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Project Assignment
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Briefcase size={16} />
                </span>
                <input
                  type="text"
                  placeholder="e.g. Skyline Tower A"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all font-semibold"
                  value={formData.projects}
                  onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-200 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-2 px-8 py-3 bg-primary text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary/25 hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
            >
              {initialData ? "Save Changes" : "Confirm Deployment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEngineerModal;
