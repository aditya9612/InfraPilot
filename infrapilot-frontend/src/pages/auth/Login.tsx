import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Role, User } from "../../context/AuthContext";
import logo from "../../assets/logo.png";
import { authService } from "../../services/authService";
import toast from "react-hot-toast";

type Step = "mobile" | "otp";

const ROLE_PATHS: Record<Role, string> = {
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

      // Robust role mapping to handle potential case differences from backend/mock
      const rawRole = profile.role || "Admin";
      const normalizedRole = (Object.keys(ROLE_PATHS).find(
        (r) => r.toLowerCase() === rawRole.toLowerCase()
      ) as Role) || "Admin";

      fullUser = {
        id: String(verifyData.user_id),
        name: profile.full_name || "User",
        mobile: mobile,
        role: normalizedRole,
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
    <div className="min-h-screen flex">
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

      {/* Right Panel — white form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          <div className="flex items-center justify-center gap-2 mb-10 lg:hidden">
            <img
              src={logo}
              alt="InfraPilot Logo"
              className="h-32 md:h-36 w-auto object-contain drop-shadow-lg"
            />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${step === "mobile" ? "w-8 bg-primary" : "w-4 bg-blue-300"}`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${step === "otp" ? "w-8 bg-primary" : "w-4 bg-slate-200"}`}
            />
            <span className="text-xs text-slate-400 ml-1">
              Step {step === "mobile" ? "1" : "2"} of 2
            </span>
          </div>

          {/* Step 1 */}
          {step === "mobile" && (
            <>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Secure Login
              </h2>
              <p className="text-slate-400 text-sm mb-7">
                Enter your mobile number to receive a secure OTP
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendOtp();
                }}
              >
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Mobile Number
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition mb-1">
                  <div className="flex items-center gap-2 px-3 py-3 border-r border-slate-200">
                    <svg
                      className="w-4 h-4 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span className="text-slate-400 text-sm">+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => {
                      setMobile(e.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                    placeholder="Enter Your Registered Mobile Number"
                    className="flex-1 px-3 py-3 text-sm text-slate-700 bg-transparent outline-none placeholder:text-slate-300"
                  />
                </div>
                {error && (
                  <p className="text-red-500 text-xs mt-1.5 mb-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-5 py-3 bg-primary hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-bold tracking-widest uppercase rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Get One-Time Password"
                  )}
                </button>
              </form>
            </>
          )}

          {/* Step 2 */}
          {step === "otp" && (
            <>
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Enter OTP
              </h2>
              <p className="text-slate-400 text-sm mb-1">
                Sent to{" "}
                <span className="font-semibold text-slate-600">
                  +91 {mobile}
                </span>
              </p>
              <button
                onClick={() => {
                  setStep("mobile");
                  setOtp(["", "", "", "", "", ""]);
                  setError("");
                }}
                className="flex items-center gap-1 text-xs text-primary hover:text-blue-600 font-medium mb-6 transition-colors"
              >
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Change number
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleVerifyOtp();
                }}
              >
                <div className="flex gap-2 justify-between mb-2">
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
                      className="w-12 h-12 text-center text-lg font-bold border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition text-slate-800"
                    />
                  ))}
                </div>
                {error && (
                  <p className="text-red-500 text-xs mt-1 mb-2">{error}</p>
                )}

                <div className="text-right mb-5 mt-2">
                  {resendTimer > 0 ? (
                    <span className="text-xs text-slate-400">
                      Resend in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-xs text-primary hover:text-blue-600 font-medium transition-colors"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-bold tracking-widest uppercase rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </button>
              </form>
            </>
          )}

          <div className="mt-10 text-center">
            <p className="text-xs text-slate-300 font-semibold tracking-widest uppercase">
              Secure Access For
            </p>
            <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-0.5">
              InfraPilot Verified Personnel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
