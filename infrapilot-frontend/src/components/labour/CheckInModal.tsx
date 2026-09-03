import { useState, useEffect, useRef } from "react";
import { Camera, MapPin, RefreshCcw, Loader2, Building2, X } from "lucide-react";
import toast from "react-hot-toast";
import type { CheckInRequest, LabourItem } from "../../types/labour";
import { projectService } from "../../services/projectService";
import { getISTDateString, getLocalDateTimeString } from "../../utils/dateUtils";
import { reverseGeocode } from "../../utils/locationUtils";

interface Project {
    id: number;
    name?: string;
    project_name?: string;
    title?: string;
}

interface CheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CheckInRequest) => Promise<void>;
    projectId: number;
    workers?: LabourItem[];
}

const CheckInModal = ({ isOpen, onClose, onSubmit, projectId, workers = [] }: CheckInModalProps) => {
    const [selectedProjectId, setSelectedProjectId] = useState<number>(projectId || 0);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [attendanceDate, setAttendanceDate] = useState(getISTDateString());
    const [inTime, setInTime] = useState(getLocalDateTimeString());
    const [status, setStatus] = useState("Present");
    const [workLocationType, setWorkLocationType] = useState("");
    const [taskId, setTaskId] = useState("");
    const [taskDescription, setTaskDescription] = useState("");

    const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "error">("idle");
    const [resolvedAddress, setResolvedAddress] = useState("");
    const [latitude, setLatitude] = useState(0);
    const [longitude, setLongitude] = useState(0);

    const [isPhotoCaptured, setIsPhotoCaptured] = useState(false);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    // Fetch projects
    useEffect(() => {
        if (isOpen) {
            const savedPid = projectId || Number(localStorage.getItem("client_selected_project_id") || localStorage.getItem("infrapilot_selected_project_id") || 0);
            setSelectedProjectId(savedPid);

            setLoadingProjects(true);
            projectService.getProjects(100, 0).then((res: any) => {
                const list: Project[] = Array.isArray(res) ? res : (res.items || res.data || []);
                setProjects(list);
                if (list.length > 0 && !savedPid) {
                    setSelectedProjectId(list[0].id);
                }
            }).catch(() => {}).finally(() => setLoadingProjects(false));

            // Reset state
            setAttendanceDate(getISTDateString());
            setInTime(getLocalDateTimeString());
            setIsPhotoCaptured(false);
            setCapturedImage(null);
            setErrors({});
            setTaskId("");
            setTaskDescription("");
            setWorkLocationType("");
            setStatus("Present");
            captureGPS();
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, projectId]);

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
                        const formattedAddress = await reverseGeocode(lat, lng);
                        setResolvedAddress(formattedAddress);
                        setGpsStatus("captured");
                    } catch {
                        setGpsStatus("captured");
                    }
                },
                () => {
                    setGpsStatus("error");
                    toast.error("GPS access denied or unavailable.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        } else {
            setGpsStatus("error");
        }
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!selectedProjectId) errs.project = "Please select a project";
        if (!capturedImage) errs.photo = "Photo capture is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setIsLoading(true);
        try {
            const payload: CheckInRequest = {
                labour_id: workers[0]?.id || (workers[0] as any)?.labour_id || 0,
                project_id: selectedProjectId,
                task_id: taskId,
                latitude,
                longitude,
                location_address: resolvedAddress,
                resolved_address: resolvedAddress,
                task_description: taskDescription,
                work_location_type: workLocationType,
                check_in_image: capturedImage,
                attendance_date: attendanceDate,
                in_time: inTime,
            };
            await onSubmit(payload);
            // Parent (AttendancePage) controls closing the modal after success
        } catch (err) {
            console.error('CheckInModal submit error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const getProjectLabel = (p: Project) => p.project_name || p.name || p.title || `Project ${p.id}`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto font-inter">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <h2 className="text-xl font-bold text-slate-800">Self Check-In</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="px-6 pb-6 space-y-4">
                    {/* Assign to Project Section */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-bold text-blue-700">Assign to project</span>
                        </div>
                        <p className="text-xs text-blue-500">Labour create hone ke baad automatically project assign ho jayega</p>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                SELECT PROJECT
                            </label>
                            <div className="relative">
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                                    className={`w-full appearance-none px-4 py-3 bg-white border ${errors.project ? "border-rose-300" : "border-slate-200"} rounded-lg text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all pr-8`}
                                    disabled={loadingProjects}
                                >
                                    <option value={0}>-- Select your project --</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{getProjectLabel(p)}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    {loadingProjects ? <Loader2 className="w-4 h-4 animate-spin" /> : <span className="text-xs">▾</span>}
                                </div>
                            </div>
                            {errors.project && <p className="text-[10px] text-rose-500 font-bold mt-1">{errors.project}</p>}
                        </div>
                    </div>

                    {/* Attendance Details Section */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
                        <h3 className="text-sm font-bold text-slate-800">Attendance Details</h3>

                        {/* Row 1: Date & Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                    ATTENDANCE DATE <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={attendanceDate}
                                    onChange={e => setAttendanceDate(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                    STATUS
                                </label>
                                <select
                                    value={status}
                                    onChange={e => setStatus(e.target.value)}
                                    className="w-full appearance-none px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                >
                                    <option>Present</option>
                                    <option>Absent</option>
                                    <option>Half Day</option>
                                    <option>Leave</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: In Time & Work Location */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                    IN TIME
                                </label>
                                <input
                                    type="datetime-local"
                                    value={inTime}
                                    onChange={e => setInTime(e.target.value)}
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                    WORK LOCATION TYPE
                                </label>
                                <input
                                    type="text"
                                    value={workLocationType}
                                    onChange={e => setWorkLocationType(e.target.value)}
                                    placeholder="e.g. On-site, Remote"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </div>

                        {/* Check In Address - Full Width */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    CHECK IN ADDRESS
                                </label>
                                {(() => {
                                    const activeProj = (projects as any[]).find(p => p.id === Number(selectedProjectId));
                                    const siteAddrStr = [activeProj?.site_address, activeProj?.city, activeProj?.state, activeProj?.pincode].filter(Boolean).join(", ");
                                    if (!siteAddrStr) return null;
                                    return (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setResolvedAddress(siteAddrStr);
                                                if (activeProj?.latitude) setLatitude(activeProj.latitude);
                                                if (activeProj?.longitude) setLongitude(activeProj.longitude);
                                                setGpsStatus("captured");
                                                toast.success("Using project site address");
                                            }}
                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1"
                                        >
                                            <Building2 className="w-3 h-3" />
                                            Use Project Site Address
                                        </button>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all">
                                <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                                <input
                                    type="text"
                                    value={resolvedAddress}
                                    onChange={e => setResolvedAddress(e.target.value)}
                                    placeholder={gpsStatus === "capturing" ? "Fetching GPS location..." : "Enter or auto-detect site address..."}
                                    className="flex-1 text-sm text-slate-700 bg-transparent outline-none placeholder:text-slate-400"
                                />
                                <button
                                    type="button"
                                    onClick={captureGPS}
                                    title="Auto-detect via GPS"
                                    className="text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors flex items-center gap-1 shrink-0 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                                >
                                    {gpsStatus === "capturing"
                                        ? <Loader2 className="w-3 h-3 animate-spin" />
                                        : <RefreshCcw className="w-3 h-3" />
                                    }
                                    GPS
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">
                                Auto-detected from device GPS / Wi-Fi. You can edit this address or click "Use Project Site Address".
                            </p>
                        </div>

                        {/* Row 3: Task ID & Task Description */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                    TASK ID
                                </label>
                                <input
                                    type="text"
                                    value={taskId}
                                    onChange={e => setTaskId(e.target.value)}
                                    placeholder="e.g. TSK-001"
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-300"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                                    TASK DESCRIPTION
                                </label>
                                <input
                                    type="text"
                                    value={taskDescription}
                                    onChange={e => setTaskDescription(e.target.value)}
                                    placeholder="Brief description..."
                                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all placeholder:text-slate-300"
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
                                        className="border-2 border-blue-400/70 rounded-full"
                                        style={{ width: "160px", height: "200px" }}
                                    />
                                </div>
                            )}

                            {/* Live indicator */}
                            {!isPhotoCaptured && (
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
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
                            {errors.photo && <p className="text-[10px] text-rose-500 font-bold mt-2 text-center">{errors.photo}</p>}
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
                        className="px-8 py-2.5 bg-blue-600 text-white text-sm font-black uppercase tracking-wider rounded-lg shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Submit Check-In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CheckInModal;
