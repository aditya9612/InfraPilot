import { useState, useEffect } from "react";
import { Camera, CheckCircle2, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { superadminService } from "../../api/superadmin";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const SuperAdminProfilePage = () => {
  const { data: profile, isLoading } = useQuery({
    queryKey: ["superadmin-profile"],
    queryFn: () => superadminService.getProfile(),
  });

  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setMobile(profile.mobile || "");
    }
  }, [profile]);

  const validations = {
    minLength: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    numberOrSpecial: /[0-9!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };
  const allValid = Object.values(validations).every(Boolean);
  const passwordsMatch = newPassword === confirmPassword;

  const updateProfileMutation = useMutation({
    mutationFn: () => superadminService.updateProfile({ full_name: fullName, mobile }),
    onSuccess: () => toast.success("Profile updated successfully!"),
    onError: (err: any) => toast.error(err?.response?.data?.detail || "Failed to update profile"),
  });

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      superadminService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword || newPassword,
      }),
    onSuccess: () => {
      toast.success("Password changed successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    },
    onError: (err: any) => {
      const errorDetail = err?.response?.data?.detail;
      const errorMsg = Array.isArray(errorDetail)
        ? `${errorDetail[0]?.loc?.slice(-1)[0] || 'field'}: ${errorDetail[0]?.msg}`
        : errorDetail || "Failed to change password";
      toast.error(errorMsg);
    },
  });

  return (
    <>
      <Navbar title="My Profile" breadcrumb={["InfraPilot", "Super Admin", "Profile"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Super Admin Profile</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-slate-400">Home</span>
              <span className="text-sm font-medium text-slate-300">&gt;</span>
              <span className="text-sm font-medium text-slate-500">My Profile</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-6">
              {/* LEFT: Profile Information */}
              <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <div className="p-6 flex-1">
                  <div className="flex items-center gap-2.5 mb-6">
                      <span className="text-slate-500"><User className="w-4 h-4" /></span>
                      <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                          Profile Information
                      </span>
                  </div>
                  <p className="text-sm text-slate-500 mb-8">Update your personal details and contact information</p>

                  <div className="flex flex-col items-center mb-8">
                    <div className="relative mb-4">
                      <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
                        <User className="w-10 h-10 text-slate-300" />
                      </div>
                      <button className="absolute bottom-0 right-0 p-1.5 bg-slate-800 text-white rounded-full shadow-md hover:bg-slate-700 transition-colors">
                        <Camera className="w-4 h-4" />
                      </button>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{profile?.full_name || "Super Admin"}</h3>
                    <p className="text-sm text-slate-500 mt-1">{profile?.role || "Super Administrator"}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email Address</label>
                      <input
                        type="email"
                        readOnly
                        value={profile?.email || ""}
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-not-allowed"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mobile Number</label>
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Role</label>
                      <input
                        type="text"
                        readOnly
                        value={profile?.role || "Super Administrator"}
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-semibold text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-not-allowed"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5 p-4 bg-slate-50 rounded-xl border border-slate-100 mt-2">
                      <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-700">Account Status</p>
                            <p className="text-[10px] text-slate-400 font-medium">Your current account status</p>
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${profile?.is_active !== false ? "text-emerald-600" : "text-rose-500"}`}>
                          {profile?.is_active !== false ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end">
                  <button
                    onClick={() => updateProfileMutation.mutate()}
                    disabled={updateProfileMutation.isPending}
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-60"
                  >
                    {updateProfileMutation.isPending ? (
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                    )}
                    Save Profile Settings
                  </button>
                </div>
              </div>

              {/* RIGHT column */}
              <div className="flex-1 flex flex-col gap-6">
                {/* Change Password */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                  <div className="p-6">
                    <div className="flex items-center gap-2.5 mb-6">
                        <span className="text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                            Change Password
                        </span>
                    </div>
                    <p className="text-sm text-slate-500 mb-6">Update your password regularly to keep your account secure</p>

                    <div className="space-y-4 mb-6">
                      {[
                        { label: "Current Password", value: currentPassword, set: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(v => !v) },
                        { label: "New Password", value: newPassword, set: setNewPassword, show: showNew, toggle: () => setShowNew(v => !v) },
                        { label: "Confirm New Password", value: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(v => !v) },
                      ].map(({ label, value, set, show, toggle }) => (
                        <div key={label} className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</label>
                          <div className="relative">
                            <input
                              type={show ? "text" : "password"}
                              value={value}
                              onChange={(e) => set(e.target.value)}
                              placeholder={`Enter ${label.toLowerCase()}`}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                            />
                            <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Password must contain:</p>
                      <div className="grid grid-cols-2 gap-y-2">
                        {[
                          { label: "At least 8 characters", valid: validations.minLength },
                          { label: "One lowercase letter", valid: validations.lowercase },
                          { label: "One uppercase letter", valid: validations.uppercase },
                          { label: "One number or special character", valid: validations.numberOrSpecial },
                        ].map(({ label, valid }) => (
                          <div key={label} className={`flex items-center gap-2 text-xs font-medium ${valid ? "text-emerald-700" : "text-slate-500"}`}>
                            <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${valid ? "text-emerald-600" : "text-slate-300"}`} /> {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => {
                        if (!allValid || !passwordsMatch || !currentPassword) return;
                        changePasswordMutation.mutate();
                      }}
                      disabled={changePasswordMutation.isPending || !allValid || !passwordsMatch || !currentPassword}
                      className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-60"
                    >
                      {changePasswordMutation.isPending ? (
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                      )}
                      Change Password
                    </button>
                  </div>
                </div>

                {/* Account Activity */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex-1">
                  <div className="p-6 border-b border-slate-100">
                    <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-slate-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </span>
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                            Account Activity
                        </span>
                    </div>
                    <p className="text-sm text-slate-500">Your recent account activity and security events</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6">
                      {[
                        { icon: <CheckCircle2 className="w-4 h-4" />, iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100", title: "Successful login", desc: "Logged in from Chrome on Windows", time: "Today, 10:30 AM", badge: "Success", badgeColor: "bg-emerald-100 text-emerald-700" },
                        { icon: <CheckCircle2 className="w-4 h-4" />, iconBg: "bg-emerald-50 text-emerald-600 border-emerald-100", title: "Password changed", desc: "Password was changed successfully", time: "Yesterday, 09:15 AM", badge: "Success", badgeColor: "bg-emerald-100 text-emerald-700" },
                        { icon: <User className="w-4 h-4" />, iconBg: "bg-amber-50 text-amber-600 border-amber-100", title: "Profile updated", desc: "Profile information was updated", time: "27 May 2026, 04:20 PM", badge: "Success", badgeColor: "bg-emerald-100 text-emerald-700" },
                      ].map(({ icon, iconBg, title, desc, time, badge, badgeColor }) => (
                        <div key={title} className="flex gap-4">
                          <div className="mt-1">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${iconBg}`}>{icon}</div>
                          </div>
                          <div className="flex-1 flex justify-between items-start">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{title}</p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">{desc}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-semibold text-slate-600">{time}</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${badgeColor}`}>{badge}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-8">
                      <button className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1">
                        View all activity →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </>
  );
};

export default SuperAdminProfilePage;
