import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import CameraCapture from '../common/CameraCapture';
import { labourService } from '../../services/labourService';
import toast from 'react-hot-toast';
import { Camera as CameraIcon, Clock, RotateCcw } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    attendance: any;
    onSuccess: () => void;
}

const CheckOutModal: React.FC<Props> = ({ isOpen, onClose, attendance, onSuccess }) => {
    const [step, setStep] = useState<'details' | 'camera'>('details');
    const [formData, setFormData] = useState({
        latitude: null as number | null,
        longitude: null as number | null,
        location_address: '',
        resolved_address: '',
        overtime_hours: 0,
        overtime_rate: 200,
        check_out_image: null as File | null,
        task_description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLocating, setIsLocating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setStep('details');
            setFormData({
                latitude: null,
                longitude: null,
                location_address: '',
                resolved_address: '',
                overtime_hours: 0,
                overtime_rate: 200,
                check_out_image: null,
                task_description: ''
            });
            captureGPS();
        }
    }, [isOpen]);

    const captureGPS = () => {
        setIsLocating(true);
        setFormData(prev => ({ ...prev, resolved_address: "" }));
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
                        const data = await res.json();
                        const address = data.display_name || "";
                        
                        setFormData(prev => ({ 
                            ...prev, 
                            latitude,
                            longitude,
                            location_address: address,
                            resolved_address: address
                        }));
                    } catch (err) {
                        console.warn("Reverse Geocoding failed:", err);
                        setFormData(prev => ({ 
                            ...prev, 
                            latitude, 
                            longitude,
                            location_address: `Site Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})` 
                        }));
                        toast.error("Location captured, but address resolution failed.");
                    } finally {
                        setIsLocating(false);
                    }
                },
                () => {
                    toast.error("Location access denied.");
                    setIsLocating(false);
                },
                { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
            );
        } else {
            setIsLocating(false);
            toast.error("Geolocation not supported");
        }
    };

    const handleCheckOut = async () => {
        if (!formData.location_address) {
            toast.error('Location is mandatory');
            return;
        }
        if (!formData.check_out_image) {
            toast.error('Selfie is mandatory');
            setStep('camera');
            return;
        }

        setIsSubmitting(true);
        try {
            // Precise sequence mapping as per snippet
            const payload = new FormData();
            payload.append("latitude", String(formData.latitude));
            payload.append("longitude", String(formData.longitude));
            payload.append("location_address", formData.location_address);
            payload.append("overtime_hours", String(formData.overtime_hours));
            payload.append("overtime_rate", String(formData.overtime_rate));
            if (formData.check_out_image) payload.append("check_out_image", formData.check_out_image);
            
            // Extremely aggressive ID discovery
            console.log("Check-Out Diagnostic - Attendance Object:", attendance);
            const attendanceId = attendance.id || attendance.attendance_id || attendance.labour_id;
            
            if (!attendanceId) {
                console.error("CRITICAL: Missing all ID variants (id, attendance_id, labour_id). Object:", attendance);
                toast.error("Error: Worker identification failed (Missing ID)");
                setIsSubmitting(false);
                return;
            }

            console.log("SUCCESS: Resolved ID " + attendanceId + ". Hitting PUT API...");
            await labourService.checkOut(attendanceId, payload);
            console.log("Check-Out Success! Triggering Registry Refetch...");
            onSuccess();
            onClose();
            toast.success(`Check-out confirmed successfully`);
        } catch (error) {
            toast.error('Check-out failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Check-Out: ${attendance?.labour_name || 'Worker'}`}
            maxWidth="max-w-xl"
            footer={
                step === 'details' && (
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                        <button 
                            onClick={handleCheckOut}
                            disabled={isSubmitting || isLocating}
                            className="px-8 py-2 bg-rose-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Processing...' : 'Confirm Check-Out'}
                        </button>
                    </div>
                )
            }
        >
            {step === 'camera' ? (
                <div className="py-4">
                    <CameraCapture 
                        onCapture={(file) => {
                            setFormData({ ...formData, check_out_image: file });
                            setStep('details');
                        }}
                        onCancel={() => setStep('details')}
                    />
                </div>
            ) : (
                <div className="space-y-6 font-inter bg-slate-50/30 -mx-6 -mt-6 p-6">
                    {/* Shift Information Card */}
                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Shift Information</h3>
                            <div className="bg-rose-50 text-rose-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight border border-rose-100">
                                Ending Shift
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Total Shift Hours</label>
                                <div className="relative">
                                    <input 
                                        type="text"
                                        value={`${attendance?.working_hours || 0} Hours`}
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

                        {/* GPS Status Section */}
                        <div className="flex flex-col gap-3 w-full">
                            <div className="flex flex-col gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${formData.latitude ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : isLocating ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${formData.latitude ? 'text-slate-800' : 'text-slate-400'}`}>
                                            GPS: {isLocating ? 'LOCATING...' : formData.latitude ? 'CAPTURED' : 'NOT FOUND'}
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
                                        {(formData.resolved_address || isLocating || formData.latitude) && (
                                            <div className="bg-emerald-50/50 px-3 py-2.5 rounded-xl border border-emerald-100/50">
                                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">LIVE CAPTURED ADDRESS</p>
                                                <p className="text-[11px] font-bold text-slate-700 leading-relaxed min-h-[1.5em]">
                                                    {isLocating && !formData.resolved_address 
                                                        ? "Resolving location address..." 
                                                        : formData.resolved_address || (formData.latitude ? "Site location identified (Address details pending...)" : "Awaiting GPS signal...")}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Work Progress Card */}
                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Work Progress</h3>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Work Completed <span className="text-rose-500">*</span></label>
                                <textarea 
                                    value={formData.task_description}
                                    onChange={(e) => setFormData({ ...formData, task_description: e.target.value })}
                                    placeholder="Describe work completed today..."
                                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all min-h-[80px] resize-none placeholder:text-slate-300"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">OT Hours <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="number" 
                                        value={formData.overtime_hours}
                                        onChange={(e) => setFormData({ ...formData, overtime_hours: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">OT Rate (₹) <span className="text-rose-500">*</span></label>
                                    <input 
                                        type="number" 
                                        value={formData.overtime_rate}
                                        onChange={(e) => setFormData({ ...formData, overtime_rate: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-5 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Security Validation Card */}
                    <div className="bg-white p-6 rounded-[1.5rem] border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2">Security Verification</h3>
                        
                        <button 
                            onClick={() => setStep('camera')}
                            className={`w-full p-6 rounded-[1.5rem] border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 ${formData.check_out_image ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/20 hover:bg-rose-50/50'}`}
                        >
                            <div className={`p-4 rounded-full ${formData.check_out_image ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                <CameraIcon className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                    {formData.check_out_image ? 'Selfie Captured ✓' : 'Capture Mandatory Selfie *'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                                    {formData.check_out_image ? 'Click to Retake' : 'Verification Required as per SRS v3.0'}
                                </p>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default CheckOutModal;
