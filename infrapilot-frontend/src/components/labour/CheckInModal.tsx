import { useState, useEffect, useRef } from "react";
import Modal from "../common/Modal";
import { Camera, RotateCcw, Clock } from "lucide-react";
import toast from "react-hot-toast";
import type { CheckInRequest, LabourItem } from "../../types/labour";

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CheckInRequest) => Promise<void>;
    projectId: number;
    workers?: LabourItem[];
}

const CheckInModal = ({ isOpen, onClose, onSubmit, projectId, workers = [] }: CheckInModalProps) => {
    const [formData, setFormData] = useState<CheckInRequest>({
        labour_id: 0,
        project_id: projectId,
        task_id: "",
        latitude: 0,
        longitude: 0,
        location_address: "",
        resolved_address: "",
        task_description: "Work",
        check_in_image: null,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "error">("idle");
    const [isPhotoCaptured, setIsPhotoCaptured] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ 
                ...prev, 
                project_id: projectId,
                latitude: 0,
                longitude: 0,
                resolved_address: "",
                location_address: "",
                check_in_image: null
            }));
            setIsPhotoCaptured(false);
            setCapturedImage(null);
            captureGPS();
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, projectId]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: "user" } 
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            console.error("Camera access denied", err);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext("2d");
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL("image/png");
                setCapturedImage(dataUrl);
                setIsPhotoCaptured(true);
                stopCamera();
            }
        }
    };

    const captureGPS = () => {
        setGpsStatus("capturing");
        setFormData(prev => ({ ...prev, resolved_address: "" }));
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        const address = data.display_name || "";
                        
                        setFormData(prev => ({ 
                            ...prev, 
                            latitude,
                            longitude,
                            resolved_address: address,
                        }));
                        setGpsStatus("captured");
                    } catch (err) {
                        console.warn("Reverse Geocoding failed:", err);
                        setFormData(prev => ({ ...prev, latitude, longitude }));
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

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!formData.labour_id) errs.labour_id = "Personnel Selection is required";
        if (!formData.task_description.trim()) errs.task_description = "Work details required";
        if (!capturedImage) errs.photo = "Identity verification (photo) is required";
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsLoading(true);
        try {
            await onSubmit({ ...formData, check_in_image: capturedImage });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const workerName = workers.find(w => w.id === formData.labour_id)?.labour_name || 'Personnel';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={formData.labour_id ? `Check-In: ${workerName}` : "Site Personnel Check-In"}
            maxWidth="max-w-2xl"
            footer={
                <div className="flex gap-4 w-full justify-end">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-8 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? "Processing..." : "Confirm Check-In"}
                    </button>
                </div>
            }
        >
            <div className="space-y-6 font-inter bg-slate-50/30 -mx-6 -mt-6 p-6">
                {/* Basic Information Card */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Basic Information</h3>
                        <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border border-emerald-100">
                            Active Shift
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Personnel Selection *</label>
                            <select 
                                value={formData.labour_id}
                                onChange={(e) => setFormData({...formData, labour_id: Number(e.target.value)})}
                                className={`w-full px-4 py-3.5 bg-slate-50 border ${errors.labour_id ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-slate-700`}
                            >
                                <option value="0">Choose Worker</option>
                                {workers.map(w => (
                                    <option key={w.id} value={w.id}>{w.labour_name} ({w.worker_code})</option>
                                ))}
                            </select>
                            {errors.labour_id && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.labour_id}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Report Date *</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={new Date().toLocaleDateString('en-GB')}
                                        readOnly
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none font-bold text-slate-500 cursor-not-allowed"
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Site Location *</label>
                                <input 
                                    type="text"
                                    value={formData.location_address}
                                    onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                                    placeholder="e.g. Tower A - Basement"
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all font-bold placeholder:text-slate-300"
                                    required
                                />
                            </div>
                        </div>

                        {/* GPS Status Section */}
                        <div className="flex flex-col gap-3 w-full">
                            <div className="flex flex-col gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${gpsStatus === "captured" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : gpsStatus === "capturing" ? "bg-amber-500 animate-pulse" : "bg-rose-500"}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${gpsStatus === "captured" ? "text-slate-800" : "text-slate-400"}`}>
                                            GPS: {gpsStatus.toUpperCase()}
                                        </span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={captureGPS}
                                        className="text-primary hover:text-blue-700 transition-colors font-black text-[10px] uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                                    >
                                        <RotateCcw className="w-2.5 h-2.5" />
                                        RECAPTURE
                                    </button>
                                </div>
                                
                                {(formData.latitude || formData.longitude) && (
                                    <div className="flex flex-col gap-2 mt-1 border-t border-slate-100 pt-2">
                                        <div className="bg-emerald-50/50 px-3 py-2.5 rounded-xl border border-emerald-100/50">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">LIVE CAPTURED ADDRESS</p>
                                            <p className="text-[11px] font-bold text-slate-700 leading-relaxed min-h-[1.5em]">
                                                {gpsStatus === "capturing" && !formData.resolved_address 
                                                    ? "Resolving location address..." 
                                                    : formData.resolved_address || "Site location identified (Address details pending...)"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Work Progress Card */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Work Progress</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Task ID (Optional)</label>
                            <input 
                                type="text"
                                value={formData.task_id}
                                onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                                placeholder="TSK-001"
                                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all font-bold placeholder:text-slate-300"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Work Objective *</label>
                            <textarea 
                                value={formData.task_description}
                                onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                                placeholder="Describe work objective..."
                                className={`w-full px-5 py-4 bg-white border ${errors.task_description ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none focus:border-primary transition-all min-h-[100px] resize-none placeholder:text-slate-300`}
                            />
                            {errors.task_description && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.task_description}</p>}
                        </div>
                    </div>
                </div>

                {/* Security Validation Card */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Security Verification</h3>
                    
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-full aspect-video bg-black rounded-2xl border-2 border-slate-100 shadow-inner overflow-hidden relative flex items-center justify-center max-w-md mx-auto">
                            {!isPhotoCaptured ? (
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
                            ) : (
                                <img src={capturedImage!} alt="captured" className="w-full h-full object-cover" />
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                            
                            {!isPhotoCaptured && (
                                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] text-white font-black uppercase tracking-widest">Live Feed</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 w-full max-w-md">
                            {!isPhotoCaptured ? (
                                <button 
                                    onClick={capturePhoto}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    <Camera className="w-4 h-4" />
                                    Capture Mandatory Selfie *
                                </button>
                            ) : (
                                <button 
                                    onClick={() => {
                                        setIsPhotoCaptured(false);
                                        setCapturedImage(null);
                                        startCamera();
                                    }} 
                                    className="w-full py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Retake Photo
                                </button>
                            )}
                        </div>
                        {errors.photo && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{errors.photo}</p>}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CheckInModal;
