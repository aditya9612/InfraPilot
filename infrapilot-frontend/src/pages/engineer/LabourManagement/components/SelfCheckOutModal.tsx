import React, { useState, useEffect, useRef, useCallback } from 'react';
import Modal from '../../../../components/common/Modal';
import { Camera, RefreshCw, Check, MapPin } from "lucide-react";
import toast from 'react-hot-toast';
import api from '../../../../services/api';

interface SelfCheckOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (checkOutTime: Date) => void;
    attendanceId?: number | string;
    title?: string;
}

const SelfCheckOutModal: React.FC<SelfCheckOutModalProps> = ({ isOpen, onClose, onSuccess, attendanceId, title = "Self Check-Out" }) => {
    const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
    const [locationAddress, setLocationAddress] = useState("Fetching location...");
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [overtimeHours, setOvertimeHours] = useState('');
    const [overtimeRate, setOvertimeRate] = useState('200');
    
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
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        const address = data.display_name || `${latitude}, ${longitude}`;
                        setLocationAddress(address);
                    } catch (err) {
                        setLocationAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
                    }
                },
                (error) => {
                    setLocationAddress("Location not available");
                    if (error.code === 1) toast.error("Please allow location access to check out.");
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
        } else {
            stopCamera();
            setCapturedImage(null);
        }
        return () => stopCamera();
    }, [isOpen, capturedImage, captureGPS]);

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
        if (!capturedImage) {
            toast.error("Please capture check-out photo.");
            return;
        }

        const formData = new FormData();
        const idToUse = attendanceId ? attendanceId.toString() : "2"; // Use passed ID or mock 2
        formData.append("attendance_id", idToUse);
        formData.append("latitude", coordinates.lat.toString());
        formData.append("longitude", coordinates.lng.toString());
        formData.append("location_address", locationAddress);
        formData.append("overtime_hours", overtimeHours);
        formData.append("overtime_rate", overtimeRate);
        
        try {
            const response = await fetch(capturedImage);
            const blob = await response.blob();
            formData.append("check_out_image", blob, "checkout.jpg");
            
            await api.put(`/api/v1/labour/attendance/${idToUse}/check-out`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            console.log("Self Check-Out API Request payload generated.");
            
            toast.success("Successfully Checked Out!");
            onSuccess(new Date());
            onClose();
        } catch (error) {
            console.error("Check-out API error:", error);
            toast.error("Failed to check out.");
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
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Location Address</label>
                        <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            {locationAddress}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Overtime Hours</label>
                        <input type="number" step="0.5" value={overtimeHours} onChange={e => setOvertimeHours(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" placeholder="e.g. 2.5" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Overtime Rate</label>
                        <input type="number" value={overtimeRate} onChange={e => setOvertimeRate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500" />
                    </div>
                    
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-widest mb-1.5">Check Out Image</label>
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
                    <button onClick={handleSubmit} className="px-6 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 flex items-center gap-2">
                        <Check className="w-4 h-4" /> Submit Check-Out
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default SelfCheckOutModal;
