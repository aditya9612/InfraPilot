import { useState, useEffect, useRef } from "react";
import Modal from "../common/Modal";
import { Camera, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import type { CheckInRequest, LabourItem } from "../../types/labour";

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CheckInRequest) => Promise<void>;
    projectId: number;
    projects?: any[];
    workers?: LabourItem[];
}

const CheckInModal = ({ isOpen, onClose, onSubmit, projectId, projects = [], workers = [] }: CheckInModalProps) => {
    const [formData, setFormData] = useState<CheckInRequest>({
        labour_id: 0,
        project_id: projectId,
        task_id: "",
        latitude: 0,
        longitude: 0,
        location_address: "Fetching location...",
        task_description: "Work",
        check_in_image: null,
    });

    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({ ...prev, project_id: projectId }));
        }
    }, [isOpen, projectId]);

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
            captureGPS();
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
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        setFormData(prev => ({ ...prev, location_address: data.display_name || `${latitude}, ${longitude}` }));
                    } catch (err) {
                        setFormData(prev => ({ ...prev, location_address: `${latitude}, ${longitude}` }));
                    }
                },
                () => {
                    setGpsStatus("error");
                    toast.error("GPS Access Denied");
                    setFormData(prev => ({ ...prev, location_address: "Permission Required" }));
                },
                { enableHighAccuracy: true, timeout: 5000 }
            );
        }
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!formData.labour_id) errs.labour_id = "Personnel Selection is required";
        if (!formData.task_description.trim()) errs.task_description = "Task description is required";
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Site Personnel Check-In"
            maxWidth="max-w-4xl"
        >
            <div className="p-6 bg-slate-50/50 space-y-6 font-inter">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Camera Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center">
                        <div className="w-full flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Biometric Capture</h3>
                            <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 rounded-lg text-[9px] font-black text-primary uppercase tracking-widest">
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
                                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                                >
                                    <Camera className="w-4 h-4" />
                                    Capture Photo
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
                                        className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
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
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Audit Information</h3>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${gpsStatus === 'captured' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">GPS: {gpsStatus}</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Personnel Selection *</label>
                                <select 
                                    value={formData.labour_id}
                                    onChange={(e) => setFormData({...formData, labour_id: Number(e.target.value)})}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.labour_id ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-slate-700`}
                                >
                                    <option value="0">Choose Worker</option>
                                    {workers.map(w => (
                                        <option key={w.id} value={w.id}>{w.labour_name} ({w.worker_code})</option>
                                    ))}
                                </select>
                                {errors.labour_id && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.labour_id}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Project Ref *</label>
                                    <select 
                                        value={formData.project_id}
                                        onChange={(e) => setFormData({...formData, project_id: Number(e.target.value)})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                    >
                                        <option value="0">Select Project</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.project_name} ({p.id})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Task Reference</label>
                                    <input 
                                        type="text" 
                                        placeholder="Optional ID"
                                        value={formData.task_id}
                                        onChange={(e) => setFormData({...formData, task_id: e.target.value})}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Geographical Audit *</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                    <input 
                                        type="text" 
                                        readOnly
                                        value={formData.location_address}
                                        className={`w-full pl-11 pr-4 py-3 bg-slate-100 border border-slate-100 rounded-xl text-[11px] font-bold text-slate-600 truncate`}
                                    />
                                    <button type="button" onClick={captureGPS} className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Refresh</button>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] ml-1">Work Objective *</label>
                                <textarea 
                                    rows={3}
                                    placeholder="Describe primary objective..."
                                    value={formData.task_description}
                                    onChange={(e) => setFormData({...formData, task_description: e.target.value})}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.task_description ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium resize-none`}
                                />
                                {errors.task_description && <p className="text-[10px] text-rose-500 font-bold ml-1">{errors.task_description}</p>}
                            </div>

                            <button 
                                disabled={isLoading}
                                type="submit"
                                className="w-full py-4.5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl shadow-primary/30 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 mt-4"
                            >
                                {isLoading ? "Syncing Audit Logs..." : "Submit Verification"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default CheckInModal;
