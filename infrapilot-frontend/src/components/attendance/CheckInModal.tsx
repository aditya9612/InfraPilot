import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import CameraCapture from '../common/CameraCapture';
import { labourService } from '../../services/labourService';
import toast from 'react-hot-toast';
import { Camera as CameraIcon, Clock } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    labour: any;
    onSuccess: () => void;
    projectId: number | null;
}

const CheckInModal: React.FC<Props> = ({ isOpen, onClose, labour, onSuccess, projectId }) => {
    const [step, setStep] = useState<'details' | 'camera'>('details');
    const [formData, setFormData] = useState({
        project_id: 1,
        task_id: '',
        task_description: '',
        latitude: null as number | null,
        longitude: null as number | null,
        location_address: '',
        check_in_image: null as File | null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const userStr = localStorage.getItem("infrapilot_user");
            const user = userStr ? JSON.parse(userStr) : {};
            const activePId = projectId || user?.project_id || user?.user?.project_id || 36;

            setStep('details');
            setFormData({
                project_id: Number(activePId),
                task_id: '',
                task_description: '',
                latitude: null,
                longitude: null,
                location_address: '',
                check_in_image: null
            });
            detectLocation();
        }
    }, [isOpen, projectId]);

    const detectLocation = () => {
        setIsLocating(true);
        setFormData(prev => ({ ...prev, location_address: 'Resolving real-time location...' }));
        
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        const address = data.display_name || `Project Site (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
                        
                        setFormData(prev => ({ 
                            ...prev, 
                            latitude,
                            longitude,
                            location_address: address
                        }));
                    } catch (err) {
                        console.warn("Reverse Geocoding failed:", err);
                        setFormData(prev => ({ 
                            ...prev, 
                            latitude,
                            longitude,
                            location_address: `Site Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` 
                        }));
                        toast.error("GPS captured, but address resolution failed.");
                    } finally {
                        setIsLocating(false);
                    }
                },
                () => {
                    toast.error("Location access denied. Please enable GPS for Check-In.");
                    setFormData(prev => ({ ...prev, location_address: '' }));
                    setIsLocating(false);
                },
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
        } else {
            toast.error("Geolocation not supported by this browser");
            setIsLocating(false);
        }
    };

    const handleCheckIn = async () => {
        if (!formData.location_address || formData.location_address === 'Resolving real-time location...') {
            toast.error('Location resolution in progress or mandatory');
            return;
        }
        if (!formData.check_in_image) {
            toast.error('Selfie is mandatory');
            setStep('camera');
            return;
        }

        setIsSubmitting(true);
        try {
            console.log("Executing Check-In API: POST /labour/" + labour.id + "/attendance/check-in");
            console.log("Payload (FormData):", formData);
            await labourService.checkIn(labour.id, formData);
            console.log("Check-In Success! Triggering Registry Refetch...");
            onSuccess();
            onClose();
            toast.success(`${labour.labour_name} check-in confirmed for Project ${formData.project_id}`);
        } catch (error) {
            toast.error('Check-in failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Check-In: ${labour?.labour_name}`}
            maxWidth="max-w-xl"
            footer={
                step === 'details' && (
                    <div className="flex gap-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                        <button 
                            type="button"
                            onClick={handleCheckIn}
                            disabled={isSubmitting || isLocating}
                            className="px-8 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm Check-In'}
                        </button>
                    </div>
                )
            }
        >
            {step === 'camera' ? (
                <div className="py-4">
                    <CameraCapture 
                        onCapture={(file) => {
                            setFormData({ ...formData, check_in_image: file });
                            setStep('details');
                        }}
                        onCancel={() => setStep('details')}
                    />
                </div>
            ) : (
                <div className="space-y-6 font-inter bg-slate-50/30 -mx-6 -mt-6 p-6">
                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Basic Information</h3>
                            <div className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border border-emerald-100">
                                Active Shift
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Report Date <span className="text-rose-500">*</span></label>
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
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Site Location <span className="text-rose-500">*</span></label>
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

                        <div className="flex items-center justify-between px-5 py-3 bg-slate-50/50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${formData.latitude ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${formData.latitude ? 'text-slate-600' : 'text-slate-400'}`}>
                                    {isLocating ? 'GPS: Locating...' : formData.latitude ? 'GPS: Captured' : 'GPS: Not Found'}
                                </span>
                            </div>
                            <button 
                                type="button"
                                onClick={detectLocation}
                                className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                            >
                                {formData.latitude ? 'Recapture' : 'Retry'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Work Progress</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Task ID (Optional)</label>
                                <input 
                                    type="text"
                                    value={formData.task_id}
                                    onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                                    placeholder="TSK-001"
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all font-bold placeholder:text-slate-300"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Work Done Today <span className="text-rose-500">*</span></label>
                                <textarea 
                                    value={formData.task_description}
                                    onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                                    placeholder="Describe work completed today..."
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all min-h-[100px] resize-none placeholder:text-slate-300"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Security Verification</h3>
                        
                        <button 
                            type="button"
                            onClick={() => setStep('camera')}
                            className={`w-full p-6 rounded-[1.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 ${formData.check_in_image ? 'border-emerald-200 bg-emerald-50/30' : 'border-blue-100 bg-blue-50/20 hover:bg-blue-50/50'}`}
                        >
                            <div className={`p-4 rounded-full ${formData.check_in_image ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                <CameraIcon className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                    {formData.check_in_image ? 'Selfie Captured ✓' : 'Capture Mandatory Selfie *'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                    {formData.check_in_image ? 'Click to Retake' : 'Verification Required as per SRS v3.0'}
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default CheckInModal;
