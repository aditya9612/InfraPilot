import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Role, User } from "../../context/AuthContext";
import logo from "../../assets/logo.png";
import logoFull from "../../assets/logo-full.png";
import constructionBg from "../../assets/construction-bg.png";
import { authService } from "../../services/authService";
import toast from "react-hot-toast";
import { Lock, ArrowRight, Target, Box, BarChart2, Shield, ChevronDown } from "lucide-react";

type Step = "mobile" | "otp";

const ROLE_PATHS: Record<Role, string> = {
  SuperAdmin: "/superadmin",
  Admin: "/admin",
  ProjectManager: "/manager",
  SiteEngineer: "/engineer",
  Accountant: "/accountant",
  Client: "/client",
  Labour: "/labour",
};

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState<Step>("mobile");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const startResendTimer = () => {
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Auto-focus first OTP input when switching to OTP step
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const response = await authService.login(mobile);
      toast.success(response.message || "OTP sent successfully!");
      setStep("otp");
      startResendTimer();
    } catch (err: any) {
      const errorData = err.response?.data;
      const message = errorData?.message || errorData?.detail;
      setError(
        typeof message === "string"
          ? message
          : "Failed to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    } else if (value && index === 5) {
      // Auto-submit when last digit is entered
      const finalOtp = updated.join("");
      if (finalOtp.length === 6) {
        handleVerifyOtp(finalOtp);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async (forcedOtp?: string) => {
    const otpValue = forcedOtp || otp.join("");
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      let fullUser: User;

      const verifyData = await authService.verifyOtp(mobile, otpValue);

      // Temporary store to allow fetch profile
      const tempUser = {
        id: String(verifyData.user_id),
        token: verifyData.token,
        mobile: mobile,
      } as any;
      localStorage.setItem("infrapilot_user", JSON.stringify(tempUser));

      const profile = await authService.getMe();

      let normalizedRole: Role = "Admin";
      if (profile.is_super_admin === true) {
        normalizedRole = "SuperAdmin";
      } else {
        const rawRole = profile.role || "Admin";
        const cleanRawRole = rawRole.toLowerCase().replace(/[_ ]/g, "");
        normalizedRole = (Object.keys(ROLE_PATHS).find(
          (r) => r.toLowerCase().replace(/[_ ]/g, "") === cleanRawRole
        ) as Role) || "Admin";
      }

      fullUser = {
        id: String(verifyData.user_id),
        name: profile.full_name || "User",
        mobile: mobile,
        role: normalizedRole,
        profile_image: profile.profile_image,
        token: verifyData.token,
      };

      login(fullUser);
      toast.success(`Welcome, ${fullUser.name}!`);

      // Redirect based on role
      const redirectPath = ROLE_PATHS[fullUser.role] || "/client";
      navigate(redirectPath);
    } catch (err: any) {
      const errorData = err.response?.data;
      const message = errorData?.message || errorData?.detail;
      setError(
        typeof message === "string"
          ? message
          : "Invalid OTP or verification failed.",
      );
      localStorage.removeItem("infrapilot_user");
    } finally {
      setLoading(false);
    }
  };


  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setLoading(true);
    try {
      const response = await authService.login(mobile);
      toast.success(response.message || "OTP resent successfully!");
      startResendTimer();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#040C1A] lg:bg-white overflow-x-hidden relative">
      {/* Left Panel — teal branded */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-blue-700 flex-col items-center justify-center px-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-[-60px] left-[-60px] w-64 h-64 bg-white opacity-5 rounded-full" />
        <div className="absolute bottom-[-80px] right-[-80px] w-96 h-96 bg-white opacity-5 rounded-full" />
        <div className="absolute top-1/2 left-[-40px] w-32 h-32 bg-white opacity-5 rounded-full" />

        <div className="relative z-10 text-center max-w-sm">
          {/* Logo */}
          <div className="inline-flex items-center justify-center mb-6">
            <img
              src={logo}
              alt="InfraPilot Logo"
              className="h-48 w-auto object-contain drop-shadow-2xl"
            />
          </div>

          <p className="text-blue-100 text-base leading-relaxed mb-10">
            Next-generation construction management platform scaling your
            infrastructure projects with AI-driven insights.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {["Real-Time Tracking", "Smart Allocation", "Project Insights"].map(
              (f) => (
                <span
                  key={f}
                  className="px-3 py-1.5 bg-white/10 text-white text-xs font-medium rounded-full border border-white/20"
                >
                  {f}
                </span>
              ),
            )}
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 rounded-2xl px-5 py-3 mb-8">
            <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-white text-sm font-semibold">System Online</p>
              <p className="text-blue-200 text-xs">
                All modules running smoothly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel — Mobile Bottom Sheet / Desktop Form Container */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-start lg:justify-center pt-12 lg:pt-0 min-h-screen lg:min-h-0 bg-[#040C1A] lg:bg-none lg:bg-white relative overflow-x-hidden">

        {/* Mobile background image with styling */}
        <div
          className="absolute inset-0 w-full h-full lg:hidden z-0"
          style={{
            backgroundImage: `url(${constructionBg})`,
            backgroundPosition: 'right center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat'
          }}
        />

        {/* Mobile Header Graphic Area */}
        <div className="flex flex-col items-center justify-center w-full flex-1 relative z-10 lg:hidden px-4">
          <img
            src={logoFull}
            alt="InfraPilot"
            className="w-[90%] max-w-[340px] h-auto object-contain drop-shadow-[0_0_15px_rgba(0,195,255,0.25)] brightness-110 mb-2 translate-x-3"
          />

          {/* Feature Pills */}
          <div className="flex justify-center gap-2 mt-6 mb-8 w-full max-w-[370px]">
            <div className="flex items-center gap-2 px-3 py-2 bg-[#082046]/80 border border-[#1E3A8A]/50 rounded-xl flex-1 relative overflow-hidden backdrop-blur-md shadow-lg shadow-black/20">
              <Target className="w-[18px] h-[18px] text-cyan-400 shrink-0" strokeWidth={2} />
              <div className="flex flex-col justify-center">
                <span className="text-[9px] text-[#E2E8F0] font-semibold leading-[1.2] uppercase tracking-[0.03em]">Real-Time</span>
                <span className="text-[9px] text-[#E2E8F0] font-semibold leading-[1.2] uppercase tracking-[0.03em]">Tracking</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#082046]/80 border border-[#1E3A8A]/50 rounded-xl flex-1 relative overflow-hidden backdrop-blur-md shadow-lg shadow-black/20">
              <Box className="w-[18px] h-[18px] text-cyan-400 shrink-0" strokeWidth={2} />
              <div className="flex flex-col justify-center">
                <span className="text-[9px] text-[#E2E8F0] font-semibold leading-[1.2] uppercase tracking-[0.03em]">Smart</span>
                <span className="text-[9px] text-[#E2E8F0] font-semibold leading-[1.2] uppercase tracking-[0.03em]">Allocation</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-[#082046]/80 border border-[#1E3A8A]/50 rounded-xl flex-1 relative overflow-hidden backdrop-blur-md shadow-lg shadow-black/20">
              <BarChart2 className="w-[18px] h-[18px] text-cyan-400 shrink-0" strokeWidth={2} />
              <div className="flex flex-col justify-center">
                <span className="text-[9px] text-[#E2E8F0] font-semibold leading-[1.2] uppercase tracking-[0.03em]">Project</span>
                <span className="text-[9px] text-[#E2E8F0] font-semibold leading-[1.2] uppercase tracking-[0.03em]">Insights</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Sheet Card for Mobile, Centered for Desktop */}
        <div className="w-full max-w-[420px] lg:max-w-sm mt-auto lg:mt-0 relative z-10 flex flex-col flex-1 lg:flex-none">
          <div className="bg-white rounded-t-[2.5rem] lg:rounded-none shadow-[0_-15px_60px_rgba(0,0,0,0.5)] lg:shadow-none px-6 sm:px-8 py-8 lg:p-0 w-full flex-1 lg:flex-none flex flex-col pt-6">

            {/* Mobile drag handle indicator */}
            <div className="w-10 h-1.5 bg-slate-200 hover:bg-slate-300 transition-colors rounded-full mx-auto mb-6 lg:hidden cursor-pointer" />


            {/* Step 1 */}
            {step === "mobile" && (
              <div className="w-full animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center gap-4 mb-7 mt-2">
                  <div className="w-14 h-14 bg-[#F1F5F9] rounded-[18px] flex items-center justify-center shrink-0 relative shadow-sm">
                    <Shield className="w-8 h-8 text-blue-600 fill-blue-600" />
                    <Lock className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] stroke-[3]" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <h2 className="text-[22px] font-bold text-[#0F172A] mb-0.5 tracking-tight">
                      Secure Login
                    </h2>
                    <p className="text-[#64748B] text-[12px] font-medium leading-snug lg:text-xs">
                      Enter your mobile number to<br />receive a secure OTP
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendOtp();
                  }}
                  className="w-full"
                >
                  <label className="block text-[12px] font-bold text-[#0F172A] mb-2">
                    Mobile Number
                  </label>
                  <div className="flex items-center rounded-xl bg-white border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition mb-1 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
                    {/* Country Code Block */}
                    <div className="flex items-center gap-2 px-3 py-3.5 bg-white cursor-pointer hover:bg-slate-50 transition">
                      <span className="text-lg leading-none">🇮🇳</span>
                      <span className="text-[#475569] text-sm font-medium">+91</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8]" />
                    </div>
                    {/* Divider */}
                    <div className="w-px h-6 bg-slate-200 shrink-0" />
                    {/* Input */}
                    <input
                      type="tel"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => {
                        setMobile(e.target.value.replace(/\D/g, ""));
                        setError("");
                      }}
                      placeholder="Enter your registered mobile number"
                      className="flex-1 px-4 py-3.5 text-sm font-medium text-[#0F172A] bg-transparent outline-none placeholder:text-[#94A3B8]"
                    />
                  </div>
                  {error && (
                    <p className="text-rose-500 text-[11px] mt-2 mb-2 font-semibold px-1">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 py-[18px] bg-gradient-to-r from-[#031C54] to-[#043391] hover:from-[#04287A] hover:to-[#0543BF] disabled:opacity-50 text-white text-[13px] font-bold tracking-wide rounded-xl transition-all shadow-[0_4px_15px_rgba(4,51,145,0.3)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-between px-5 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded-md border border-white/20 shrink-0">
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                        )}
                      </div>
                      <span>{loading ? "SENDING..." : "GET ONE-TIME OTP"}</span>
                    </div>
                    {!loading && <ArrowRight className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </div>
            )}

            {/* Step 2 */}
            {step === "otp" && (
              <div className="w-full animate-[fadeIn_0.3s_ease-out]">
                <div className="flex items-center gap-4 mb-7 mt-2">
                  <div className="w-14 h-14 bg-[#F1F5F9] rounded-[18px] flex items-center justify-center shrink-0 relative shadow-sm">
                    <Shield className="w-8 h-8 text-blue-600 fill-blue-600" />
                    <Lock className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] stroke-[3]" />
                  </div>
                  <div className="flex flex-col justify-center flex-1">
                    <h2 className="text-[22px] font-bold text-[#0F172A] mb-0.5 tracking-tight">
                      Verify OTP
                    </h2>
                    <p className="text-[#64748B] text-[12px] font-medium leading-snug lg:text-xs">
                      Sent to <span className="text-[#0F172A] font-bold">+91 {mobile}</span>
                    </p>
                    <button
                      onClick={() => {
                        setStep("mobile");
                        setOtp(["", "", "", "", "", ""]);
                        setError("");
                      }}
                      className="text-[10px] uppercase font-bold text-blue-600 hover:text-blue-800 mt-1 hover:underline inline-block w-fit"
                    >
                      Change Number
                    </button>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleVerifyOtp();
                  }}
                  className="w-full"
                >
                  <div className="flex gap-2 justify-between mb-2 mt-4">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          otpRefs.current[i] = el;
                        }}
                        type="tel"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-[15%] aspect-[4/5] text-center text-[22px] font-bold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition shadow-sm text-[#0F172A] p-0"
                      />
                    ))}
                  </div>
                  {error && (
                    <p className="text-rose-500 text-[11px] mt-3 mb-1 font-semibold px-1">{error}</p>
                  )}

                  <div className="text-right mb-6 mt-3">
                    {resendTimer > 0 ? (
                      <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                        Resend in <span className="text-blue-600">{resendTimer}s</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-[18px] bg-gradient-to-r from-[#031C54] to-[#043391] hover:from-[#04287A] hover:to-[#0543BF] disabled:opacity-50 text-white text-[13px] font-bold tracking-wide rounded-xl transition-all shadow-[0_4px_15px_rgba(4,51,145,0.3)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-between px-5 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-1 rounded-md border border-white/20 shrink-0">
                        {loading ? (
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                        )}
                      </div>
                      <span>{loading ? "VERIFYING..." : "VERIFY SECURE OTP"}</span>
                    </div>
                    {!loading && <ArrowRight className="w-5 h-5 text-white/90 group-hover:translate-x-1 transition-transform" />}
                  </button>
                </form>
              </div>
            )}

            <div className="mt-14 pb-4 w-full flex flex-col items-center gap-2 relative z-10 lg:mt-10 lg:pb-0">
              <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-center">
                <p className="text-[10px] text-[#94A3B8] font-bold tracking-widest uppercase mb-[4px]">
                  SECURE ACCESS FOR
                </p>
                <p className="text-[11px] text-[#043391] font-bold tracking-wider uppercase">
                  INFRAPILOT VERIFIED PERSONNEL
                </p>
              </div>
              <div className="text-center mt-6">
                <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                  © {new Date().getFullYear()} Shekru Labs India Pvt Ltd. All rights reserved.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
