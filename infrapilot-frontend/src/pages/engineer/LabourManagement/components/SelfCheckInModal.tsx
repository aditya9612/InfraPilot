import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../../../../components/common/Modal';
import { Camera, RefreshCw, Check, MapPin, Building2, Calendar, Clock } from "lucide-react";
import toast from 'react-hot-toast';
import { projectService } from '../../../../services/projectService';
import { labourService } from '../../../../services/labourService';

interface SelfCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (checkInTime: Date) => void;
    labourId?: number | string;
    title?: string;
}

const SelfCheckInModal: React.FC<SelfCheckInModalProps> = ({ isOpen, onClose, onSuccess, labourId, title = "Self Check-In" }) => {
    const today = new Date().toISOString().split('T')[0];

    // ── State — fields in exact API request body sequence ──────────────────
    const [attendanceDate, setAttendanceDate] = useState(today);
    const [projectId, setProjectId] = useState('');
    const [status, setStatus] = useState('present');
    const [inTime, setInTime] = useState(new Date().toISOString().slice(0, 16));
    const [checkInLatitude, setCheckInLatitude] = useState<number | null>(null);
    const [checkInLongitude, setCheckInLongitude] = useState<number | null>(null);
    const [userId, setUserId] = useState<string>('');
    const [checkInAddress, setCheckInAddress] = useState('Fetching location...');
    const [taskId, setTaskId] = useState('');
    const [taskDescription, setTaskDescription] = useState('');
    const [remarks, setRemarks] = useState('');
    const [workLocationType, setWorkLocationType] = useState('');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    const [projects, setProjects] = useState<any[]>([]);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // ── GPS ──────────────────────────────────────────────────────────────────
    const captureGPS = useCallback(() => {
        setCheckInAddress("Locating...");
        if (!("geolocation" in navigator)) { setCheckInAddress("Geolocation not supported"); return; }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setCheckInLatitude(latitude);
                setCheckInLongitude(longitude);
                try {
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    const data = await res.json();
                    const address = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean).join(", ");
                    setCheckInAddress(address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                } catch { setCheckInAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`); }
            },
            (err) => { setCheckInAddress("Location not available"); if (err.code === 1) toast.error("Please allow location access."); },
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
            setAttendanceDate(new Date().toISOString().split('T')[0]);
            setInTime(new Date().toISOString().slice(0, 16));
            try {
                const raw = localStorage.getItem("infrapilot_user");
                if (raw) {
                    const parsed = JSON.parse(raw);
                    const pid = parsed.user?.project_id || parsed.project_id;
                    if (pid) setProjectId(pid.toString());
                    const uid = parsed.user?.id || parsed.id;
                    if (uid) setUserId(uid.toString());
                }
            } catch { }
            projectService.getProjects(100, 0).then((data: any) => {
                setProjects(Array.isArray(data) ? data : (data.items || data.data || []));
            }).catch(() => { });
        } else {
            stopCamera();
            setCapturedImage(null);
        }
        return () => stopCamera();
    }, [isOpen]);

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!attendanceDate.trim()) { toast.error("Attendance Date is required."); return; }
        setIsSubmitting(true);
        try {
            const fd = new FormData();
            if (labourId) {
                fd.append("user_id", labourId.toString());
            } else if (userId) {
                fd.append("user_id", userId);
            }
            fd.append("attendance_date", attendanceDate);
            if (projectId) fd.append("project_id", projectId);
            fd.append("status", status);
            // Append with seconds appended if inTime is just YYYY-MM-DDTHH:MM
            fd.append("in_time", inTime.length === 16 ? `${inTime}:00` : new Date(inTime).toISOString());
            if (checkInLatitude !== null) fd.append("check_in_latitude", checkInLatitude.toString());
            if (checkInLongitude !== null) fd.append("check_in_longitude", checkInLongitude.toString());
            if (checkInAddress && !["Fetching location...", "Locating...", "Location not available"].includes(checkInAddress))
                fd.append("check_in_address", checkInAddress);
            if (taskId) fd.append("task_id", taskId);
            if (taskDescription) fd.append("task_description", taskDescription);
            if (remarks) fd.append("remarks", remarks);
            if (workLocationType) fd.append("work_location_type", workLocationType);
            if (capturedImage) {
                const blob = await (await fetch(capturedImage)).blob();
                fd.append("check_in_image", blob, "checkin.jpg");
            }
            await labourService.selfCheckIn(fd);
            toast.success("Successfully Checked In!");
            onSuccess(new Date());
            onClose();
        } catch (error) {
            console.error("Self Check-In error:", error);
            toast.error("Failed to check in. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 font-inter";
    const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { onClose(); setCapturedImage(null); }}
            title={title}
            maxWidth="max-w-4xl"
            footer={
                <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                    <button
                        type="button"
                        onClick={() => { onClose(); setCapturedImage(null); }}
                        className="min-w-[180px] px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all font-inter"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="min-w-[180px] px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-inter"
                    >
                        {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Submit Check-In
                    </button>
                </div>
            }
        >
            <div className="space-y-6 font-inter">

                {/* ── Assign to project ─────────────────────────────────── */}
                <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-bold text-primary font-inter">Assign to project</h3>
                        </div>
                    </div>
                    <p className="text-[11px] text-blue-500 mb-4 ml-6 font-inter">Labour create hone ke baad automatically project assign ho jayega</p>
                    <div className="ml-6">
                        <label className={labelCls}>SELECT PROJECT</label>
                        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className={inputCls}>
                            <option value="">-- Select your project --</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* ── Attendance Details ────────────────────────────────── */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 font-inter">Attendance Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                        {/* attendance_date * */}
                        <div>
                            <label className={labelCls}>Attendance Date <span className="text-rose-500">*</span></label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 flex items-center gap-2 cursor-not-allowed opacity-80">
                                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate flex-1">{attendanceDate}</span>
                            </div>
                        </div>

                        {/* status */}
                        <div>
                            <label className={labelCls}>Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                                <option value="present">Present</option>
                                <option value="absent">Absent</option>
                                <option value="half_day">Half Day</option>
                            </select>
                        </div>

                        {/* in_time */}
                        <div>
                            <label className={labelCls}>In Time</label>
                            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 flex items-center gap-2 cursor-not-allowed opacity-80">
                                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate flex-1">{new Date(inTime).toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true })}</span>
                            </div>
                        </div>

                        {/* work_location_type */}
                        <div>
                            <label className={labelCls}>Work Location Type</label>
                            <input type="text" value={workLocationType} onChange={(e) => setWorkLocationType(e.target.value)} placeholder="e.g. On-site, Remote" className={inputCls} />
                        </div>

                        {/* check_in_address */}
                        <div className="md:col-span-2">
                            <label className={labelCls}>Check In Address</label>
                            <div className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 flex items-center gap-2 transition-all">
                                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                <span className="truncate flex-1">{checkInAddress}</span>
                                <button type="button" onClick={captureGPS} className="text-[10px] font-bold text-primary hover:underline whitespace-nowrap ml-auto">
                                    Refresh
                                </button>
                            </div>
                        </div>

                        {/* task_id */}
                        <div>
                            <label className={labelCls}>Task ID</label>
                            <input type="number" value={taskId} onChange={(e) => setTaskId(e.target.value)} placeholder="e.g. 12" className={inputCls} />
                        </div>

                        {/* task_description */}
                        <div>
                            <label className={labelCls}>Task Description</label>
                            <input type="text" value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Describe your work..." className={inputCls} />
                        </div>

                        {/* remarks — full width */}
                        <div className="md:col-span-2">
                            <label className={labelCls}>Remarks</label>
                            <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional remarks..." rows={2} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all resize-none focus:border-primary focus:ring-2 focus:ring-primary/20 font-inter" />
                        </div>

                    </div>
                </div>

                {/* ── Check In Image ────────────────────────────────────── */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 font-inter">Check In Image</h3>
                    <div className="bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-200">
                        {!capturedImage ? (
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                        ) : (
                            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                        {!capturedImage && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-2 border-primary/70 rounded-full opacity-60" />
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
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

export default SelfCheckInModal;
