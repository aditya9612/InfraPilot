import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import type { Role, User } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

type Step = "mobile" | "otp";

const MOCK_OTP = "123456";

const MOCK_USERS: Record<string, User> = {
  "9999999999": {
    id: "1",
    name: "Arjun Mehta",
    mobile: "9999999999",
    role: "Admin",
    token: "tok_admin",
  },
  "8888888888": {
    id: "2",
    name: "Priya Nair",
    mobile: "8888888888",
    role: "Project Manager",
    token: "tok_pm",
  },
  "7777777777": {
    id: "3",
    name: "Ravi Kumar",
    mobile: "7777777777",
    role: "Site Engineer",
    token: "tok_eng",
  },
  "6666666666": {
    id: "4",
    name: "Suresh Patel",
    mobile: "6666666666",
    role: "Contractor",
    token: "tok_con",
  },
  "5555555555": {
    id: "5",
    name: "Neha Sharma",
    mobile: "5555555555",
    role: "Accountant",
    token: "tok_acc",
  },
  "4444444444": {
    id: "6",
    name: "Mr. Sharma",
    mobile: "4444444444",
    role: "Client",
    token: "tok_client",
  },
};

const ROLE_PATHS: Record<Role, string> = {
  Admin: "/admin",
  "Project Manager": "/manager",
  "Site Engineer": "/engineer",
  Contractor: "/contractor",
  Accountant: "/accountant",
  Client: "/client",
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

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    setStep("otp");
    startResendTimer();
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0)
      otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyOtp = async () => {
    if (otp.join("").length < 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }
    if (otp.join("") !== MOCK_OTP) {
      setError("Invalid OTP. Use 123456 for demo.");
      return;
    }
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    const user = MOCK_USERS[mobile] ?? {
      id: "99",
      name: "Guest User",
      mobile,
      role: "Site Engineer" as Role,
      token: "tok_guest",
    };
    login(user);
    setLoading(false);
    navigate(ROLE_PATHS[user.role]);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    startResendTimer();
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
              className="h-48 w-auto object-contain"
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
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <img
              src={logo}
              alt="InfraPilot Logo"
              className="h-24 w-auto object-contain"
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
                  placeholder="99999 99999"
                  className="flex-1 px-3 py-3 text-sm text-slate-700 bg-transparent outline-none placeholder:text-slate-300"
                />
              </div>
              {error && (
                <p className="text-red-500 text-xs mt-1.5 mb-2">{error}</p>
              )}

              <button
                onClick={handleSendOtp}
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
              <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-primary text-xs font-medium px-3 py-1.5 rounded-lg mb-5">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Demo OTP: <span className="font-mono font-bold">123456</span>
              </div>

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
                    onClick={handleResend}
                    className="text-xs text-primary hover:text-blue-600 font-medium transition-colors"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={handleVerifyOtp}
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
