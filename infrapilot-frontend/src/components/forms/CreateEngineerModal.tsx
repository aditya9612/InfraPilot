import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import { UserCheck, Mail, Phone, Award, Briefcase, Tag, Calendar } from "lucide-react";

interface CreateEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  projectsList?: any[];
}

const CreateEngineerModal: React.FC<CreateEngineerModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projectsList = [],
}) => {
  const [formData, setFormData] = useState({
    user_id: 0,
    full_name: "",
    mobile_number: "",
    email: "",
    role: "SiteEngineer",
    designation: "Site Engineer",
    experience: "",
    specialization: "Structural Engineering",
    joining_date: new Date().toISOString().split('T')[0],
    address: "", // Current Assignment
    is_active: true,
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          user_id: initialData.id || 0,
          full_name: initialData.name || "",
          mobile_number: initialData.mobile || "",
          email: initialData.email || "",
          role: "SiteEngineer",
          designation: initialData.specialization || "Site Engineer",
          experience: initialData.experience || "",
          specialization: initialData.specialization || "Structural Engineering",
          joining_date: initialData.joiningDate || new Date().toISOString().split('T')[0],
          address: initialData.projects || "",
          is_active: initialData.status === "On Site",
          password: "",
        });
        setPhotoUrl(initialData.profile_image || "");
      } else {
        setFormData({
          user_id: 0,
          full_name: "",
          mobile_number: "",
          email: "",
          role: "SiteEngineer",
          designation: "Site Engineer",
          experience: "",
          specialization: "Structural Engineering",
          joining_date: new Date().toISOString().split('T')[0],
          address: "",
          is_active: true,
          password: "",
        });
        setPhotoUrl("");
      }
      setErrors({});
      setPhoto(null);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    let url = "";
    if (photo) {
      url = URL.createObjectURL(photo);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [photo]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.full_name || formData.full_name.length < 3)
      newErrors.full_name = "Full Name must be at least 3 characters.";
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Enter a valid email address.";

    const cleanMobile = formData.mobile_number.replace(/\D/g, "");
    if (!cleanMobile || cleanMobile.length < 10)
      newErrors.mobile_number = "Enter a valid mobile number.";

    if (!formData.experience) newErrors.experience = "Experience is required.";
    if (!formData.address) newErrors.address = "Current Assignment is required.";

    if (!initialData && formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "full_name" && /\d/.test(value)) {
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsLoading(true);
      try {
        const payload: any = {
          ...formData,
          profile_image: photo,
        };
        await onSubmit(payload);
        onClose();
      } catch (error) {
        console.error("Submission failed:", error);
        toast.error("Failed to process engineer data");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
      >
        Discard
      </button>
      <button
        form="engineer-form"
        type="submit"
        disabled={isLoading}
        className={`px-8 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : initialData ? "Update Record" : "Deploy Staff"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Refine Engineer Info" : "Engineer Onboarding"}
      footer={modalFooter}
      maxWidth="max-w-3xl"
    >
      <form id="engineer-form" onSubmit={handleSubmit} noValidate>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Staff Intelligence Records</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <UserCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="e.g. Arjun Mehta"
                  className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors.full_name ? "border-rose-500 focus:ring-rose-100" : "border-slate-200 focus:ring-primary/10"} rounded-xl text-sm transition-all outline-none`}
                />
              </div>
              {errors.full_name && <p className="mt-1 text-xs text-rose-500">{errors.full_name}</p>}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@infrapilot.com"
                  className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors.email ? "border-rose-500 focus:ring-rose-100" : "border-slate-200 focus:ring-primary/10"} rounded-xl text-sm transition-all outline-none`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-rose-500">{errors.email}</p>}
            </div>

            {/* Mobile Number */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  placeholder="9876543210"
                  className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors.mobile_number ? "border-rose-500 focus:ring-rose-100" : "border-slate-200 focus:ring-primary/10"} rounded-xl text-sm transition-all outline-none`}
                />
              </div>
              {errors.mobile_number && <p className="mt-1 text-xs text-rose-500">{errors.mobile_number}</p>}
            </div>

            {/* Role - Disabled */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">System Role</label>
              <div className="relative">
                <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value="Site Engineer"
                  disabled
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none"
                />
              </div>
            </div>

            {/* Experience */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Exp (Years) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Award size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className={`w-full pl-11 pr-4 py-2.5 bg-slate-50 border ${errors.experience ? "border-rose-500 focus:ring-rose-100" : "border-slate-200 focus:ring-primary/10"} rounded-xl text-sm transition-all outline-none`}
                />
              </div>
              {errors.experience && <p className="mt-1 text-xs text-rose-500">{errors.experience}</p>}
            </div>

            {/* Joining Date */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">Joining Date</label>
              <div className="relative">
                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  name="joining_date"
                  value={formData.joining_date}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none"
                />
              </div>
            </div>

            {/* Specialization */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">Specialization</label>
              <div className="relative">
                <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <select
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-primary/10 outline-none appearance-none"
                >
                  <option value="Structural Engineering">Structural</option>
                  <option value="Civil & Infrastructure">Civil & Infra</option>
                  <option value="Electrical & MEP">Electrical & MEP</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Safety & Compliance">Safety Officer</option>
                </select>
              </div>
            </div>

            {/* Current Assignment */}
            <div className="md:col-span-2 space-y-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Current Assignment <span className="text-rose-500">*</span>
              </label>
              <div className="relative group/dropdown">
                <div
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  className={`w-full pl-11 pr-10 py-2 bg-slate-50 border ${errors.address ? "border-rose-500 focus:ring-rose-100" : "border-slate-200 focus:ring-primary/10"} rounded-xl text-xs transition-all outline-none cursor-pointer flex items-center min-h-[38px]`}
                >
                  <Briefcase size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 ${isProjectDropdownOpen ? "text-primary" : ""}`} />
                  <span className={formData.address ? "text-slate-700 font-medium" : "text-slate-400"}>
                    {formData.address || "Select Project Assignment"}
                  </span>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                    <svg className={`w-4 h-4 transition-transform ${isProjectDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {isProjectDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[110]"
                      onClick={() => setIsProjectDropdownOpen(false)}
                    />
                    <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-white border border-slate-100 rounded-xl shadow-xl z-[120] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                      <div className="p-2 border-b border-slate-50 bg-slate-50/50">
                        <div className="relative">
                          <input
                            type="text"
                            autoFocus
                            placeholder="Search projects..."
                            value={projectSearch}
                            onChange={(e) => setProjectSearch(e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto custom-scrollbar">
                        <div
                          onClick={() => {
                            setFormData(prev => ({ ...prev, address: "Main Site" }));
                            setIsProjectDropdownOpen(false);
                            setProjectSearch("");
                          }}
                          className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer font-medium border-b border-slate-50"
                        >
                          Main Site (Default)
                        </div>
                        {projectsList
                          .filter((p: any) => (p.project_name || p.name || "").toLowerCase().includes(projectSearch.toLowerCase()))
                          .map((project: any) => (
                            <div
                              key={project.id}
                              onClick={() => {
                                setFormData(prev => ({ ...prev, address: project.project_name || project.name }));
                                setIsProjectDropdownOpen(false);
                                setProjectSearch("");
                              }}
                              className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
                            >
                              {project.project_name || project.name}
                            </div>
                          ))}
                        {projectsList.filter((p: any) => (p.project_name || p.name || "").toLowerCase().includes(projectSearch.toLowerCase())).length === 0 && (
                          <div className="px-4 py-3 text-[10px] text-slate-400 text-center italic">
                            No projects found
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {errors.address && <p className="mt-1 text-xs text-rose-500">{errors.address}</p>}
            </div>

            {/* Password - only for new users */}
            {!initialData && (
              <div className="md:col-span-2 space-y-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">Login Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full px-4 py-2.5 bg-slate-50 border ${errors.password ? "border-rose-500 focus:ring-rose-100" : "border-slate-200 focus:ring-primary/10"} rounded-xl text-sm transition-all outline-none`}
                />
                {errors.password && <p className="mt-1 text-xs text-rose-500">{errors.password}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Photo and Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="block text-sm font-medium text-gray-600 mb-3">Profile Photo</label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : photoUrl ? (
                  <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <UserCheck size={32} />
                  </div>
                )}
              </div>
              <input type="file" id="engineer-photo-upload" className="hidden" accept="image/*" onChange={handlePhotoChange} />
              <button
                type="button"
                onClick={() => document.getElementById("engineer-photo-upload")?.click()}
                className="px-4 py-2 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-all"
              >
                {photoUrl || photo ? "Change Photo" : "Upload Photo"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 h-full">
            <div>
              <p className="font-bold text-slate-700 text-sm">Deployment Status</p>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">
                {formData.is_active ? "Currently On Site" : "On Leave / Inactive"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFormData((p) => ({ ...p, is_active: !p.is_active }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateEngineerModal;
