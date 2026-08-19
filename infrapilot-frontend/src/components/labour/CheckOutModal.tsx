import { useState, useEffect, useRef } from "react";
import { Camera, MapPin, RefreshCcw, Loader2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import type { CheckOutRequest } from "../../types/labour";
import { getLocalDateTimeString } from "../../utils/dateUtils";

interface CheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CheckOutRequest) => Promise<void>;
    attendanceId: number;
}

const CheckOutModal = ({ isOpen, onClose, onSubmit }: CheckOutModalProps) => {
    const [outTime, setOutTime] = useState(getLocalDateTimeString());
    const [resolvedAddress, setResolvedAddress] = useState("");
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongitude] = useState(0);
    const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "error">("idle");
    const [workSummary, setWorkSummary] = useState("");
    const [taskDeadlineReason, setTaskDeadlineReason] = useState("");
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [isPhotoCaptured, setIsPhotoCaptured] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset form
            setOutTime(getLocalDateTimeString());
            setWorkSummary("");
            setTaskDeadlineReason("");
            setPdfFile(null);
            setIsPhotoCaptured(false);
            setCapturedImage(null);
            setErrors({});
            captureGPS();
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            if (videoRef.current) videoRef.current.srcObject = stream;
            streamRef.current = stream;
        } catch (err) {
            console.error("Camera access denied", err);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                ctx.drawImage(videoRef.current, 0, 0);
                // Use JPEG — backend rejects PNG ("Invalid image type")
                const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.85);
                setCapturedImage(dataUrl);
                setIsPhotoCaptured(true);
                stopCamera();
            }
        }
    };

    const retakePhoto = () => {
        setIsPhotoCaptured(false);
        setCapturedImage(null);
        startCamera();
    };

    const captureGPS = () => {
        setGpsStatus("capturing");
        setResolvedAddress("");
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude: lat, longitude: lng } = pos.coords;
                    setLatitude(lat);
                    setLongitude(lng);
                    try {
                        const res = await fetch(
                            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
                        );
                        const data = await res.json();
                        setResolvedAddress(data.display_name || "");
                        setGpsStatus("captured");
                    } catch {
                        setGpsStatus("captured");
                    }
                },
                () => {
                    setGpsStatus("error");
                    toast.error("GPS access denied or unavailable.");
                },
                { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
            );
        } else {
            setGpsStatus("error");
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
        } else {
            toast.error("Please upload a PDF file.");
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setPdfFile(file);
        } else if (file) {
            toast.error("Please upload a PDF file.");
        }
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!workSummary.trim()) errs.workSummary = "Work summary is required";
        if (!capturedImage) errs.photo = "Photo capture is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsLoading(true);
        try {
            const payload: CheckOutRequest = {
                latitude,
                longitude,
                location_address: resolvedAddress,
                resolved_address: resolvedAddress,
                overtime_hours: 0,
                overtime_rate: 0,
                remarks: workSummary,
                work_summary: workSummary,
                task_deadline_reason: taskDeadlineReason,
                check_out_image: capturedImage,
                out_time: outTime,
            };
            await onSubmit(payload);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto font-inter">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <h2 className="text-xl font-bold text-slate-800">Self Check-Out</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 pb-6 space-y-4">
                    {/* Check-Out Details Section */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800">Check-Out Details</h3>

                        {/* Out Time - Full Width */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                OUT TIME
                            </label>
                            <input
                                type="datetime-local"
                                value={outTime}
                                onChange={e => setOutTime(e.target.value)}
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all"
                            />
                        </div>

                        {/* Check Out Address - Full Width */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                CHECK OUT ADDRESS
                            </label>
                            <div className="flex items-center gap-2 px-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span className="flex-1 text-sm text-slate-600 truncate">
                                    {gpsStatus === "capturing"
                                        ? "Fetching location..."
                                        : gpsStatus === "error"
                                            ? "Location unavailable"
                                            : resolvedAddress || "Waiting for GPS..."}
                                </span>
                                <button
                                    type="button"
                                    onClick={captureGPS}
                                    className="text-rose-600 text-xs font-bold hover:text-rose-800 transition-colors flex items-center gap-1 shrink-0"
                                >
                                    {gpsStatus === "capturing"
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <RefreshCcw className="w-3 h-3" />}
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* Work Summary - Full Width */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                WORK SUMMARY <span className="text-rose-500">*</span>
                            </label>
                            <textarea
                                value={workSummary}
                                onChange={e => setWorkSummary(e.target.value)}
                                placeholder="Describe the work completed..."
                                rows={4}
                                className={`w-full px-3 py-2.5 border ${errors.workSummary ? "border-rose-300" : "border-slate-200"} rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all resize-none placeholder:text-slate-300`}
                            />
                            {errors.workSummary && (
                                <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.workSummary}</p>
                            )}
                        </div>

                        {/* Task Deadline Reason - Full Width */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                TASK DEADLINE REASON
                            </label>
                            <input
                                type="text"
                                value={taskDeadlineReason}
                                onChange={e => setTaskDeadlineReason(e.target.value)}
                                placeholder="If applicable, reason for task status..."
                                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-400 transition-all placeholder:text-slate-300"
                            />
                        </div>

                        {/* Work Report PDF Upload */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                WORK REPORT PDF
                            </label>
                            <div
                                onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full px-4 py-3 border-2 border-dashed ${isDragging ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white"} rounded-lg cursor-pointer transition-all hover:border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2`}
                            >
                                <Upload className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-500">
                                    {pdfFile ? (
                                        <span className="font-semibold text-slate-700">{pdfFile.name}</span>
                                    ) : (
                                        "Choose PDF file or drag and drop"
                                    )}
                                </span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="application/pdf"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Camera Section */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        {/* Video / Captured Image */}
                        <div className="relative bg-black aspect-video flex items-center justify-center">
                            {!isPhotoCaptured ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                    style={{ transform: "scaleX(-1)" }}
                                />
                            ) : (
                                <img src={capturedImage!} alt="captured" className="w-full h-full object-cover" />
                            )}
                            <canvas ref={canvasRef} className="hidden" />

                            {/* Face oval guide (only when live) */}
                            {!isPhotoCaptured && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div
                                        className="border-2 border-rose-500/70 rounded-full"
                                        style={{ width: "160px", height: "200px" }}
                                    />
                                </div>
                            )}

                            {/* Live indicator */}
                            {!isPhotoCaptured && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                    <span className="text-white text-xs font-bold tracking-widest">LIVE</span>
                                </div>
                            )}
                        </div>

                        {/* Capture / Retake Button */}
                        <div className="p-3">
                            {!isPhotoCaptured ? (
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-700 transition-all active:scale-95"
                                >
                                    <Camera className="w-4 h-4" />
                                    Capture Image
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={retakePhoto}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    <RefreshCcw className="w-4 h-4" />
                                    Retake
                                </button>
                            )}
                            {errors.photo && (
                                <p className="text-[10px] text-rose-500 font-bold mt-2 text-center">{errors.photo}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-8 py-2.5 bg-rose-600 text-white text-sm font-black uppercase tracking-wider rounded-lg shadow-lg shadow-rose-500/20 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Submit Check-Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckOutModal;
