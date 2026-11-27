import React, { useState, useEffect } from "react";
import { ShieldAlert, KeyRound, Lock, AlertTriangle, X, CheckCircle2 } from "lucide-react";
import type { OTPCancellationRequest } from "../../../types/material";

interface AdminOTPCancellationModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: "PO" | "INWARD" | "OUTWARD";
  entityId: number;
  entityRef: string;
  projectId?: number;
  hasLinkedInwards?: boolean;
  existingRequest?: OTPCancellationRequest | null;
  onRequestOTP: (entityType: "PO" | "INWARD" | "OUTWARD", entityId: number, entityRef: string, reason: string, projectId?: number) => Promise<{ request: OTPCancellationRequest; generatedOtp: string }>;
  onVerifyOTP: (requestId: number, otp: string, reason: string, expectedOtp?: string) => Promise<void>;
}

const AdminOTPCancellationModal: React.FC<AdminOTPCancellationModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityRef,
  projectId,
  hasLinkedInwards = false,
  existingRequest = null,
  onRequestOTP,
  onVerifyOTP,
}) => {
  const [step, setStep] = useState<"reason" | "otp">("reason");
  const [reason, setReason] = useState("");
  const [otp, setOtp] = useState("");
  const [activeRequest, setActiveRequest] = useState<OTPCancellationRequest | null>(null);
  const [generatedOtpHint, setGeneratedOtpHint] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg("");
    setOtp("");
    if (existingRequest) {
      setActiveRequest(existingRequest);
      setReason(existingRequest.reason);
      setGeneratedOtpHint(existingRequest.otp_hint || "");
      setStep("otp");
    } else {
      setActiveRequest(null);
      setReason("");
      setGeneratedOtpHint("");
      setStep("reason");
    }
  }, [isOpen, existingRequest]);

  if (!isOpen) return null;

  const isPOBlocked = entityType === "PO" && hasLinkedInwards;

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (isPOBlocked) return;
    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMsg("Please enter a detailed cancellation reason (minimum 5 characters).");
      return;
    }

    setSubmitting(true);
    try {
      const res = await onRequestOTP(entityType, entityId, entityRef, reason.trim(), projectId);
      setActiveRequest(res.request);
      setGeneratedOtpHint(res.generatedOtp);
      setStep("otp");
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to generate cancellation OTP.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!activeRequest) return;
    if (otp.trim().length !== 6) {
      setErrorMsg("Enter a valid 6-digit Admin OTP.");
      return;
    }

    setSubmitting(true);
    try {
      await onVerifyOTP(activeRequest.id, otp.trim(), reason.trim(), generatedOtpHint);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Invalid OTP code.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm font-inter">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-rose-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Admin OTP Cancellation</h2>
              <p className="text-xs text-slate-600">{entityType} • {entityRef}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {isPOBlocked ? (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Cancellation Blocked</span>
              </div>
              <p className="text-xs leading-relaxed">
                This Purchase Order already has posted Inward Receipts. Per inventory audit rules, you must first cancel the linked Inward Receipts before cancelling the PO.
              </p>
              <div className="pt-2 flex justify-end">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold">
                  Understood
                </button>
              </div>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {step === "reason" ? (
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
                    Cancelling this {entityType} marks its status as <strong>Pending Admin OTP Approval</strong> and notifies the Admin with a 6-digit verification code.
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                      Mandatory Cancellation Reason <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Specify reason for reversal or cancellation..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:border-rose-400 outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20"
                    >
                      {submitting ? "Sending OTP..." : "Generate Admin OTP"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      <span>OTP Dispatched to Admin</span>
                    </div>
                    {generatedOtpHint && (
                      <p className="font-mono text-xs bg-white/80 px-2.5 py-1 rounded border border-blue-200 w-fit mt-1">
                        Verification Code: <strong className="tracking-widest text-primary">{generatedOtpHint}</strong>
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1.5">
                      Enter 6-Digit Admin OTP <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="6-digit OTP"
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-black tracking-[0.35em] text-slate-900 outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold">
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || otp.length !== 6}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/20 disabled:opacity-50"
                    >
                      {submitting ? "Executing Reversal..." : "Verify OTP & Cancel"}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOTPCancellationModal;
