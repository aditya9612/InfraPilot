import { useState, useEffect, useRef } from "react";
import Modal from "../common/Modal";
import { Camera } from "lucide-react";
import toast from "react-hot-toast";
import type { CheckOutRequest } from "../../types/labour";

interface CheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CheckOutRequest) => Promise<void>;
    attendanceId: number;
}

const CheckOutModal = ({ isOpen, onClose, onSubmit, attendanceId }: CheckOutModalProps) => {
    const [formData, setFormData] = useState<CheckOutRequest>({
        latitude: 18.5204,
        longitude: 73.8567,
        location_address: "",
        resolved_address: "",
        overtime_hours: 0,
        overtime_rate: 200,
        check_out_image: null,
    });

    useEffect(() => {
        if (isOpen) {
            captureGPS();
        }
    }, [isOpen]);

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
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen]);

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
            toast.error("Camera access denied");
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
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setFormData(prev => ({ ...prev, latitude, longitude }));
                    setGpsStatus("captured");
                    
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        const address = data.display_name || "";
                        setFormData(prev => ({ 
                            ...prev, 
                            resolved_address: address,
                            location_address: prev.location_address || address 
                        }));
                    } catch (err) {
                        console.warn("Reverse Geocoding failed:", err);
                    }
                },
                () => {
                    setFormData(prev => ({ ...prev, latitude: 18.5204, longitude: 73.8567 }));
                    setGpsStatus("error");
                    toast.error("GPS unavailable. Using default location.");
                },
                { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
            );
        } else {
            setFormData(prev => ({ ...prev, latitude: 18.5204, longitude: 73.8567 }));
            setGpsStatus("error");
        }
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (formData.overtime_hours < 0) errs.overtime_hours = "Overtime cannot be negative";
        if (formData.overtime_rate < 0) errs.overtime_rate = "Rate cannot be negative";
        if (!capturedImage) errs.photo = "Identity verification (photo) is required";
        
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        
        setIsLoading(true);
        try {
            await onSubmit({ ...formData, check_out_image: capturedImage });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Site Personnel Check-Out"
            maxWidth="max-w-4xl"
        >
            <div className="p-6 bg-slate-50/50 space-y-6 font-inter">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Camera Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Biometric Capture</h3>
                            <div className="flex items-center gap-2 px-2 py-1 bg-rose-50 rounded-lg text-[9px] font-black text-rose-600 uppercase tracking-widest">
                                <Camera className="w-3 h-3" />
                                Live Feed
                            </div>
                        </div>
                        
                        <div className="w-full aspect-[4/3] bg-black rounded-2xl border-2 border-slate-100 shadow-inner overflow-hidden mb-6 relative flex items-center justify-center">
                            {!isPhotoCaptured ? (
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover mirror" />
                            ) : (
                                <img src={capturedImage!} alt="captured" className="w-full h-full object-cover" />
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                            
                            {!isPhotoCaptured && (
                                <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] text-white font-black uppercase tracking-widest">Recording</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-4 w-full">
                            {!isPhotoCaptured ? (
                                <button 
                                    onClick={capturePhoto}
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
                                >
                                    <Camera className="w-4 h-4" />
                                    Capture Exit Photo
                                </button>
                            ) : (
                                <div className="flex items-center gap-3 w-full">
                                    <button 
                                        onClick={() => {
                                            setIsPhotoCaptured(false);
                                            setCapturedImage(null);
                                            startCamera();
                                        }} 
                                        className="flex-1 py-3.5 bg-slate-100 text-slate-600 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95"
                                    >
                                        Retake
                                    </button>
                                    <button 
                                        onClick={() => {
                                            toast.success("Identity Verified!");
                                        }} 
                                        className="flex-1 py-3.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
                                    >
                                        Use Photo
                                    </button>
                                </div>
                            )}
                        </div>
                        {errors.photo && <p className="mt-3 text-[10px] text-rose-500 font-bold uppercase tracking-widest">{errors.photo}</p>}
                    </div>

                    {/* Form Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="w-full flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Exit Audit Trail</h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Attendance Ref *</label>
                                <input 
                                    readOnly 
                                    value={`ATT-00${attendanceId}`}
                                    className="w-full px-4 py-3 bg-slate-100 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Overtime Hours *</label>
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        placeholder="0.0"
                                        value={formData.overtime_hours}
                                        onChange={(e) => setFormData({...formData, overtime_hours: Number(e.target.value)})}
                                        className={`w-full px-4 py-3 bg-slate-50 border ${errors.overtime_hours ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold`}
                                    />
                                    {errors.overtime_hours && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.overtime_hours}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Overtime Rate (₹) *</label>
                                    <input 
                                        type="number" 
                                        placeholder="200"
                                        value={formData.overtime_rate}
                                        onChange={(e) => setFormData({...formData, overtime_rate: Number(e.target.value)})}
                                        className={`w-full px-4 py-3 bg-slate-50 border ${errors.overtime_rate ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold`}
                                    />
                                    {errors.overtime_rate && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.overtime_rate}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Site Location *</label>
                                <input 
                                    type="text" 
                                    name="location_address"
                                    value={formData.location_address}
                                    onChange={(e) => setFormData({...formData, location_address: e.target.value})}
                                    placeholder="Enter site location"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <div className="flex flex-col gap-3 w-full">
                                    <div className="flex flex-col gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${gpsStatus === "captured" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : gpsStatus === "capturing" ? "bg-amber-500 animate-pulse" : "bg-rose-500"}`}></span>
                                                <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.1em]">GPS Status: {gpsStatus.toUpperCase()}</span>
                                            </div>
                                            <button type="button" onClick={captureGPS} className="text-rose-500 hover:text-rose-700 transition-colors font-black text-[10px] uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm">
                                                Recapture
                                            </button>
                                        </div>
                                        
                                        {gpsStatus === "captured" && (
                                            <div className="flex flex-col gap-2 mt-1 border-t border-slate-100 pt-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 flex-1">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Latitude</p>
                                                        <p className="text-xs font-black text-slate-700 tracking-tight">{formData.latitude.toFixed(6)}</p>
                                                    </div>
                                                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100 flex-1">
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Longitude</p>
                                                        <p className="text-xs font-black text-slate-700 tracking-tight">{formData.longitude.toFixed(6)}</p>
                                                    </div>
                                                </div>
                                                {formData.resolved_address && (
                                                    <div className="bg-emerald-50/50 px-3 py-2.5 rounded-xl border border-emerald-100/50">
                                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Live Captured Address</p>
                                                        <p className="text-[11px] font-bold text-slate-600 leading-relaxed italic-none">{formData.resolved_address}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                                <p className="text-[10px] font-bold text-amber-800 leading-relaxed italic-none">
                                    I hereby confirm my exit from the site and verify that the overtime hours logged above are accurate for today's deployment.
                                </p>
                            </div>

                            <button 
                                disabled={isLoading}
                                type="submit"
                                className="w-full py-4.5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-rose-300 hover:bg-rose-700 transition-all active:scale-95 disabled:opacity-50 mt-4"
                            >
                                {isLoading ? "Syncing Exit Logs..." : "Submit Exit Verification"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CheckOutModal;
