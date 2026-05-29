import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../../../../components/common/Modal';
import { Camera, RefreshCw, Check, MapPin, Building2 } from "lucide-react";
import toast from 'react-hot-toast';
import api from '../../../../services/api';
import { projectService } from '../../../../services/projectService';

interface SelfCheckInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (checkInTime: Date) => void;
    labourId?: number | string;
    title?: string;
}

const SelfCheckInModal: React.FC<SelfCheckInModalProps> = ({ isOpen, onClose, onSuccess, labourId = "1", title = "Self Check-In" }) => {
    const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
    const [locationAddress, setLocationAddress] = useState("Fetching location...");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const captureGPS = useCallback(() => {
        setLocationAddress("Locating...");
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    setCoordinates({ lat: latitude, lng: longitude });
                    try {
                        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                        const data = await res.json();
                        let address = `${latitude}, ${longitude}`;
                        if (data.locality || data.city) {
                            address = [data.locality, data.city, data.principalSubdivision, data.countryName].filter(Boolean).join(", ");
                        }
                        setLocationAddress(address);
                    } catch (err) {
                        setLocationAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    }
                },
                (error) => {
                    setLocationAddress("Location not available");
                    if (error.code === 1) toast.error("Please allow location access to check in.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setLocationAddress("Geolocation not supported by browser");
        }
    }, []);

    const startCamera = async () => {
        setCapturedImage(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera", err);
            toast.error("Could not access camera. Please allow permissions.");
        }
    };

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        if (isOpen) {
            if (!capturedImage) startCamera();
            captureGPS();
            fetchProjects();
            try {
                const userStr = localStorage.getItem("infrapilot_user");
                if (userStr) {
                    const parsed = JSON.parse(userStr);
                    const activeProjId = parsed.user?.project_id || parsed.project_id;
                    if (activeProjId) {
                        setSelectedProjectId(activeProjId.toString());
                    }
                }
            } catch (e) {}
        } else {
            stopCamera();
            setCapturedImage(null);
            setSelectedProjectId('');
        }
        return () => stopCamera();
    }, [isOpen, capturedImage, captureGPS]);

    const fetchProjects = async () => {
        try {
            const data: any = await projectService.getProjects(100, 0);
            const projectsArray = Array.isArray(data) ? data : (data.items || data.data || []);
            console.log("SelfCheckInModal fetchProjects:", projectsArray);
            setProjects(projectsArray);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(imageUrl);
                stopCamera();
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedProjectId) {
            toast.error("Please select a project.");
            return;
        }
        if (!capturedImage) {
            toast.error("Please capture check-in photo.");
            return;
        }

        const formData = new FormData();
        formData.append("labour_id", labourId.toString());
        formData.append("project_id", selectedProjectId);
        formData.append("task_id", "");
        formData.append("latitude", coordinates.lat.toString());
        formData.append("longitude", coordinates.lng.toString());
        formData.append("location_address", locationAddress);
        formData.append("task_description", "");

        try {
            const response = await fetch(capturedImage);
            const blob = await response.blob();
            formData.append("check_in_image", blob, "checkin.jpg");

            await api.post(`/api/v1/labour/${labourId}/attendance/check-in`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            console.log("Self Check-In API Request payload generated.");
            
            toast.success("Successfully Checked In!");
            onSuccess(new Date());
            onClose();
        } catch (error) {
            console.error("Check-in API error:", error);
            toast.error("Failed to check in.");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => { onClose(); setCapturedImage(null); }}
            title={title}
            maxWidth="max-w-2xl"
        >
            <div className="p-6 font-inter space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 bg-blue-50/50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-bold text-blue-600">Assign to project</h3>
                            </div>
                        </div>
                        <p className="text-[11px] text-blue-500 mb-4 ml-6">Labour create hone ke baad automatically project assign ho jayega</p>
                        <div className="ml-6">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">SELECT PROJECT *</label>
                            <select
                                value={selectedProjectId}
                                onChange={(e) => setSelectedProjectId(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20"
                            >
                                <option value="">-- Select your project --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Location Address</label>
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {locationAddress}
                        </div>
                    </div>
                    
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Check In Image</label>
                        <div className="bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-200">
                            {!capturedImage ? (
                                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                            ) : (
                                <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                            )}
                            <canvas ref={canvasRef} className="hidden" />
                            {!capturedImage && (
                                <div className="absolute inset-0 pointer-events-none">
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-2 border-blue-500/70 rounded-full opacity-60" />
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Live</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            {!capturedImage ? (
                                <button type="button" onClick={takePhoto} className="flex-1 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <Camera className="w-4 h-4" /> Capture Image
                                </button>
                            ) : (
                                <button type="button" onClick={() => setCapturedImage(null)} className="flex-1 py-2.5 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <RefreshCw className="w-4 h-4" /> Retake Image
                                </button>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button onClick={() => { onClose(); setCapturedImage(null); }} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">Cancel</button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                        <Check className="w-4 h-4" /> Submit Check-In
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SelfCheckInModal;
