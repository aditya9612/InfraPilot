import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import type { User, UserRole } from "../../types/user";

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => void;
  initialData?: User | null;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: "Admin", label: "Admin" },
  { value: "ProjectManager", label: "Project Manager" },
  { value: "SiteEngineer", label: "Site Engineer" },
  { value: "Accountant", label: "Accountant" },
  { value: "Client", label: "Client" },
];

import { Eye, EyeOff, ShieldCheck, ShieldAlert, Shield } from "lucide-react";

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    user_id: 0,
    full_name: "",
    mobile_number: "",
    email: "",
    role: "" as UserRole,
    designation: "",
    joining_date: new Date().toISOString().split('T')[0],
    pan_number: "",
    aadhaar_number: "",
    address: "",
    is_active: true,
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [photoUrl, setPhotoUrl] = useState<string>("");

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "Empty" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 2) return { score, label: "Weak", color: "text-rose-500", bg: "bg-rose-500" };
    if (score <= 4) return { score, label: "Moderate", color: "text-amber-500", bg: "bg-amber-500" };
    return { score, label: "Strong", color: "text-emerald-500", bg: "bg-emerald-500" };
  };

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          user_id: initialData.user_id || 0,
          full_name: initialData.full_name || "",
          mobile_number: initialData.mobile_number || "",
          email: initialData.email || "",
          role: initialData.role || "",
          designation: initialData.designation || "",
          joining_date: initialData.joining_date || "",
          pan_number: initialData.pan_number || "",
          aadhaar_number: initialData.aadhaar_number || "",
          address: initialData.address || "",
          is_active: initialData.is_active ?? true,
          password: "",
        } as any);
        setPhotoUrl(initialData.profile_image || "");
      } else {
        setFormData({
          user_id: 0,
          full_name: "",
          mobile_number: "",
          email: "",
          role: "" as any,
          designation: "",
          joining_date: new Date().toISOString().split('T')[0],
          pan_number: "",
          aadhaar_number: "",
          address: "",
          is_active: true,
          password: "",
        });
        setPhotoUrl("");
      }
      setErrors({});
      setPhoto(null);
      setShowPassword(false);
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
    const cleanMobile = formData.mobile_number.replace(/\D/g, "").replace(/^91/, "");
    if (!cleanMobile || cleanMobile.length !== 10)
      newErrors.mobile_number = "Enter a valid 10-digit mobile number.";
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Enter a valid email address.";

    if (!formData.role)
      newErrors.role = "Role is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    let { name, value } = e.target;
    if (name === "pan_number") {
      const val = value.toUpperCase();
      let filtered = "";
      for (let i = 0; i < Math.min(val.length, 10); i++) {
        const char = val[i];
        if (i < 5 && /[A-Z]/.test(char)) filtered += char;
        else if (i >= 5 && i < 9 && /[0-9]/.test(char)) filtered += char;
        else if (i === 9 && /[A-Z]/.test(char)) filtered += char;
      }
      value = filtered;
    } else if (name === "full_name" || name === "designation") {
      value = value.replace(/[^a-zA-Z\s]/g, "");
    } else if (name === "mobile_number") {
      let digits = value.replace(/\D/g, "");
      if (digits.startsWith("91")) {
        digits = digits.slice(2);
      }
      digits = digits.slice(0, 10);
      value = digits ? `+91 ${digits}` : "";
    } else if (name === "aadhaar_number") {
      const numeric = value.replace(/\D/g, "").slice(0, 12);
      const parts = numeric.match(/.{1,4}/g);
      value = parts ? parts.join("-") : numeric;
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
          user_id: formData.user_id,
          full_name: formData.full_name,
          mobile_number: formData.mobile_number,
          email: formData.email,
          role: formData.role,
          address: formData.address,
          pan_number: formData.pan_number,
          aadhaar_number: formData.aadhaar_number.replace(/-/g, ""),
          designation: formData.designation,
          joining_date: formData.joining_date || null,
          is_active: formData.is_active,
        };

        if (!initialData && formData.password) {
          payload.password = formData.password;
        }

        if (photo) {
          payload.profile_image = photo;
        }

        await onSubmit(payload);
        onClose();
      } catch (error) {
        console.error("Submission failed:", error);
        toast.error("Failed to process user data");
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
        Cancel
      </button>
      <button
        form="user-form"
        type="submit"
        disabled={isLoading}
        className={`px-8 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2 ${isLoading ? "opacity-70 cursor-not-allowed" : "active:scale-95"}`}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Processing...
          </>
        ) : initialData ? (
          "Update User"
        ) : (
          "Create User"
        )}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit User Details" : "Create New User"}
      footer={modalFooter}
      maxWidth="max-w-3xl"
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate>
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Basic Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="John Doe"
                className={`w-full px-4 py-2 bg-gray-50 border ${errors.full_name ? "border-rose-500 focus:ring-rose-100" : "border-gray-200 focus:ring-primary/20"} rounded-xl transition-all outline-none`}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-rose-500">{errors.full_name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Mobile Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="mobile_number"
                value={formData.mobile_number}
                onChange={handleChange}
                placeholder="+91 9876543210"
                className={`w-full px-4 py-2 bg-gray-50 border ${errors.mobile_number ? "border-rose-500 focus:ring-rose-100" : "border-gray-200 focus:ring-primary/20"} rounded-xl transition-all outline-none`}
              />
              {errors.mobile_number && (
                <p className="mt-1 text-xs text-rose-500">
                  {errors.mobile_number}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className={`w-full px-4 py-2 bg-gray-50 border ${errors.email ? "border-rose-500 focus:ring-rose-100" : "border-gray-200 focus:ring-primary/20"} rounded-xl transition-all outline-none`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-500">{errors.email}</p>
              )}
            </div>
            {!initialData && (
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full px-4 py-2 bg-gray-50 border ${errors.password ? "border-rose-500 focus:ring-rose-100" : "border-gray-200 focus:ring-primary/20"} rounded-xl transition-all outline-none pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {formData.password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-1.5">
                        {getPasswordStrength(formData.password).score <= 2 ? (
                          <ShieldAlert className="w-3 h-3 text-rose-500" />
                        ) : getPasswordStrength(formData.password).score <= 4 ? (
                          <Shield className="w-3 h-3 text-amber-500" />
                        ) : (
                          <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${getPasswordStrength(formData.password).color}`}>
                          {getPasswordStrength(formData.password).label} Security
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div
                            key={s}
                            className={`h-1 w-4 rounded-full transition-all duration-500 ${s <= getPasswordStrength(formData.password).score ? getPasswordStrength(formData.password).bg : 'bg-gray-200'}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 px-1 py-1 bg-white/50 rounded-lg border border-gray-100 items-center">
                      {[
                        { re: /.{8,}/, msg: "8+ chars" },
                        { re: /[A-Z]/, msg: "Uppercase" },
                        { re: /[a-z]/, msg: "Lowercase" },
                        { re: /[0-9]/, msg: "Number" },
                        { re: /[^A-Za-z0-9]/, msg: "Special" }
                      ].map((req, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full transition-colors ${req.re.test(formData.password) ? 'bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.5)]' : 'bg-gray-300'}`} />
                          <span className={`text-[9px] font-medium leading-none ${req.re.test(formData.password) ? 'text-gray-700' : 'text-gray-400'}`}>
                            {req.msg}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-1 text-xs text-rose-500 animate-in fade-in slide-in-from-top-1">
                    {errors.password}
                  </p>
                )}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Role <span className="text-rose-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`w-full px-4 py-2 bg-gray-50 border ${errors.role ? "border-rose-500 focus:ring-rose-100" : "border-gray-200 focus:ring-primary/20"} rounded-xl transition-all outline-none appearance-none`}
              >
                <option value="">Select Role</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
              {errors.role && (
                <p className="mt-1 text-xs text-rose-500">{errors.role}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Designation
              </label>
              <input
                type="text"
                name="designation"
                value={formData.designation}
                onChange={handleChange}
                placeholder="Project Admin"
                className={`w-full px-4 py-2 bg-gray-50 border ${errors.designation ? "border-rose-500 focus:ring-rose-100" : "border-gray-200 focus:ring-primary/20"} rounded-xl transition-all outline-none`}
              />
              {errors.designation && (
                <p className="mt-1 text-xs text-rose-500">
                  {errors.designation}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                PAN Number
              </label>
              <input
                type="text"
                name="pan_number"
                value={formData.pan_number}
                onChange={handleChange}
                placeholder="ABCDE1234F"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-primary/20 rounded-xl outline-none uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Aadhaar Number
              </label>
              <input
                type="text"
                name="aadhaar_number"
                value={formData.aadhaar_number}
                onChange={handleChange}
                placeholder="1234-1234-1234"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-primary/20 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Joining Date
              </label>
              <input
                type="date"
                name="joining_date"
                value={formData.joining_date}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-primary/20 rounded-xl outline-none text-gray-600"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Full Address
              </label>
              <textarea
                name="address"
                rows={2}
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter full residential address"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 focus:ring-primary/20 rounded-xl outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <label className="block text-sm font-medium text-gray-600 mb-3">
              Profile Photo
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : photoUrl && !photoUrl.startsWith("blob:") ? (
                  <img
                    src={photoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="photo-upload"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              <button
                type="button"
                onClick={() => document.getElementById("photo-upload")?.click()}
                className="px-4 py-2 text-xs font-bold text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-all"
              >
                {photoUrl || photo ? "Change Photo" : "Upload Photo"}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 h-full">
            <div>
              <p className="font-semibold text-gray-700">Account Status</p>
              <p className="text-[10px] text-gray-500 uppercase font-black tracking-tighter">
                Login Access Enabled
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setFormData((p) => ({ ...p, is_active: !p.is_active }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.is_active ? "bg-emerald-500" : "bg-gray-300"}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.is_active ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;
