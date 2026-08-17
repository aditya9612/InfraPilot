import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../../../../components/common/Modal';
import { Camera, RefreshCw, Check, MapPin, Upload } from "lucide-react";
import toast from 'react-hot-toast';
import { labourService } from '../../../../services/labourService';

interface SelfCheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (checkOutTime: Date) => void;
    attendanceId?: number | string;
    labourId?: number | string;
    title?: string;
}

const SelfCheckOutModal: React.FC<SelfCheckOutModalProps> = ({ isOpen, onClose, onSuccess, attendanceId, title = "Self Check-Out" }) => {
    const [checkOutLatitude, setCheckOutLatitude] = useState<number | null>(null);
    const [checkOutLongitude, setCheckOutLongitude] = useState<number | null>(null);
    const [checkOutAddress, setCheckOutAddress] = useState('Fetching location...');

    const [workSummary, setWorkSummary] = useState('');
    const [taskDeadlineReason, setTaskDeadlineReason] = useState('');

    const [workReportPdf, setWorkReportPdf] = useState<File | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // ── GPS ──────────────────────────────────────────────────────────────────
    const captureGPS = useCallback(() => {
        setCheckOutAddress("Locating...");
        if (!("geolocation" in navigator)) { setCheckOutAddress("Geolocation not supported"); return; }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCheckOutLatitude(latitude);
                setCheckOutLongitude(longitude);
                try {
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    const data = await res.json();
                    const address = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean).join(", ");
                    setCheckOutAddress(address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                } catch { setCheckOutAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`); }
            },
            (err) => { setCheckOutAddress("Location not available"); if (err.code === 1) toast.error("Please allow location access."); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    // ── Camera ───────────────────────────────────────────────────────────────
    const startCamera = async () => {
        setCapturedImage(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) videoRef.current.srcObject = mediaStream;
        } catch { toast.error("Could not access camera. Please allow permissions."); }
    };

    const stopCamera = useCallback(() => {
        if (stream) { stream.getTracks().forEach(t => t.stop()); setStream(null); }
    }, [stream]);

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.drawImage(videoRef.current, 0, 0); setCapturedImage(canvas.toDataURL('image/jpeg')); }
        }
    };

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) {
            captureGPS();
            startCamera();
        } else {
            stopCamera();
            setCapturedImage(null);
            setWorkReportPdf(null);
            setWorkSummary('');
            setTaskDeadlineReason('');
        }
        return () => stopCamera();
    }, [isOpen]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!workSummary.trim()) { toast.error("Work Summary is required."); return; }
        setIsSubmitting(true);
        try {
            const fd = new FormData();

            if (checkOutLatitude !== null) fd.append("check_out_latitude", checkOutLatitude.toString());
            if (checkOutLongitude !== null) fd.append("check_out_longitude", checkOutLongitude.toString());
            if (checkOutAddress && !["Fetching location...", "Locating...", "Location not available"].includes(checkOutAddress))
                fd.append("check_out_address", checkOutAddress);

            fd.append("work_summary", workSummary);
            if (taskDeadlineReason) fd.append("task_deadline_reason", taskDeadlineReason);

            if (workReportPdf) {
                fd.append("work_report_pdf", workReportPdf);
            }

            if (capturedImage) {
                const blob = await (await fetch(capturedImage)).blob();
                fd.append("check_out_image", blob, "checkout.jpg");
            }

            if (!attendanceId) {
                toast.error("Attendance record not found to check out.");
                setIsSubmitting(false);
                return;
            }
            await labourService.selfCheckOut(attendanceId.toString(), fd);
            toast.success("Successfully Checked Out!");
            onSuccess(new Date());
            onClose();
        } catch (error) {
            console.error("Self Check-Out error:", error);
            toast.error("Failed to check out. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-inter";
    const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { onClose(); setCapturedImage(null); setWorkReportPdf(null); }}
            title={title}
            maxWidth="max-w-4xl"
            footer={
                <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                    <button
                        type="button"
                        onClick={() => { onClose(); setCapturedImage(null); setWorkReportPdf(null); }}
                        className="min-w-[180px] px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all font-inter"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="min-w-[180px] px-6 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-inter"
                    >
                        {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Submit Check-Out
                    </button>
                </div>
            }
        >
            <div className="space-y-6 font-inter">

                {/* ── Check-Out Details ────────────────────────────────── */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 font-inter">Check-Out Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* check_out_latitude */}
                        <div className="md:col-span-1">
                            <label className={labelCls}>Check Out Latitude</label>
                            <input type="number" readOnly value={checkOutLatitude || ""} placeholder="Fetching..." className={`${inputCls} bg-slate-50 cursor-not-allowed`} />
                        </div>

                        {/* check_out_longitude */}
                        <div className="md:col-span-1">
                            <label className={labelCls}>Check Out Longitude</label>
                            <input type="number" readOnly value={checkOutLongitude || ""} placeholder="Fetching..." className={`${inputCls} bg-slate-50 cursor-not-allowed`} />
                        </div>

                        {/* check_out_address */}
                        <div className="md:col-span-2">
                            <label className={labelCls}>Check Out Address</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 flex items-center gap-2 transition-all">
                                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate flex-1">{checkOutAddress}</span>
                                <button type="button" onClick={captureGPS} className="text-[10px] font-bold text-rose-500 hover:underline whitespace-nowrap ml-auto">
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* work_summary */}
                        <div className="md:col-span-2">
                            <label className={labelCls}>Work Summary <span className="text-rose-500">*</span></label>
                            <textarea value={workSummary} onChange={(e) => setWorkSummary(e.target.value)} placeholder="Describe the work completed..." rows={3} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all resize-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 font-inter" required />
                        </div>

                        {/* task_deadline_reason */}
                        <div className="md:col-span-2">
                            <label className={labelCls}>Task Deadline Reason</label>
                            <input type="text" value={taskDeadlineReason} onChange={(e) => setTaskDeadlineReason(e.target.value)} placeholder="If applicable, reason for task status..." className={inputCls} />
                        </div>

                        {/* work_report_pdf */}
                        <div className="md:col-span-2">
                            <label className={labelCls}>Work Report PDF</label>
                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={(e) => setWorkReportPdf(e.target.files?.[0] || null)}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex items-center justify-center gap-2 text-sm text-slate-600 hover:bg-slate-100 transition-colors">
                                    <Upload className="w-4 h-4 text-slate-400" />
                                    {workReportPdf ? (
                                        <span className="font-bold text-slate-800">{workReportPdf.name}</span>
                                    ) : (
                                        <span>Choose PDF file or drag and drop</span>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Check Out Image ────────────────────────────────────── */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 font-inter">Check Out Image</h3>
                    <div className="bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-200">
                        {!capturedImage ? (
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        ) : (
                            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                        {!capturedImage && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-2 border-rose-500/70 rounded-full opacity-60" />
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">Live</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                        {!capturedImage ? (
                            <button type="button" onClick={takePhoto} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2 font-inter">
                                <Camera className="w-4 h-4" /> Capture Image
                            </button>
                        ) : (
                            <button type="button" onClick={() => { setCapturedImage(null); startCamera(); }} className="flex-1 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2 font-inter">
                                <RefreshCw className="w-4 h-4" /> Retake Image
                            </button>
                        )}
                        {capturedImage && (
                            <div className="flex items-center gap-2 text-emerald-600">
                                <Check className="w-4 h-4" />
                                <span className="text-xs font-bold font-inter">Image Captured</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </Modal>
    );
};

export default SelfCheckOutModal;
