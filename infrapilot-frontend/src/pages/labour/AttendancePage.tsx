import React, { useState, useRef, useEffect } from 'react';
import Navbar from '../../components/common/Navbar';
import PageTransition from '../../components/common/PageTransition';
import { Camera, MapPin, Clock, Calendar, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface AttendanceRecord {
    date: string;
    checkIn: string;
    checkOut: string;
    hours: string;
    status: 'Present' | 'Absent' | 'Half Day';
}

const AttendancePage: React.FC = () => {
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [location, setLocation] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const history: AttendanceRecord[] = [
        { date: '01 Jun 2026', checkIn: '09:00 AM', checkOut: '06:00 PM', hours: '9h', status: 'Present' },
        { date: '02 Jun 2026', checkIn: '09:15 AM', checkOut: '06:30 PM', hours: '9h 15m', status: 'Present' },
        { date: '03 Jun 2026', checkIn: '09:00 AM', checkOut: '01:00 PM', hours: '4h', status: 'Half Day' },
    ];

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => {
                setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
            });
        }
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            toast.error("Camera access denied");
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const data = canvasRef.current.toDataURL('image/png');
                setCapturedImage(data);

                // Stop camera
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    const handleAction = (type: 'in' | 'out') => {
        if (!capturedImage) {
            toast.error("Please capture your photo first");
            return;
        }
        setIsCheckedIn(type === 'in');
        setCapturedImage(null);
        toast.success(type === 'in' ? "Checked In Successfully!" : "Checked Out Successfully!");
    };

    return (
        <>
            <Navbar title="Attendance" breadcrumb={['InfraPilot', 'Labour', 'Attendance']} />
            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter pb-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {/* Capture Card */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                                {isCheckedIn ? "Check Out" : "Check In"}
                                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-lg ${isCheckedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                    {isCheckedIn ? 'Active Session' : 'Ready'}
                                </span>
                            </h2>

                            {/* Camera View */}
                            <div className="aspect-square bg-slate-900 rounded-3xl overflow-hidden relative mb-6 border-4 border-slate-50 shadow-inner">
                                {!capturedImage ? (
                                    <>
                                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-white p-6 text-center">
                                            <Camera className="w-12 h-12 mb-4 opacity-50" />
                                            <button
                                                onClick={startCamera}
                                                className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-black uppercase tracking-widest backdrop-blur-md transition-all"
                                            >
                                                Start Camera
                                            </button>
                                        </div>
                                        <button
                                            onClick={capturePhoto}
                                            className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <div className="w-12 h-12 bg-white rounded-full" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <img src={capturedImage} alt="Capture" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => setCapturedImage(null)}
                                            className="absolute top-4 right-4 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all"
                                        >
                                            <XCircle className="w-6 h-6" />
                                        </button>
                                    </>
                                )}
                                <canvas ref={canvasRef} className="hidden" />
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <MapPin className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Location</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-700">{location || 'Locating...'}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Time</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-700">{new Date().toLocaleTimeString()}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleAction(isCheckedIn ? 'out' : 'in')}
                                className={`w-full py-5 rounded-3xl text-white font-black uppercase tracking-[0.2em] shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 ${isCheckedIn ? 'bg-rose-500 shadow-rose-200' : 'bg-emerald-500 shadow-emerald-200'}`}
                            >
                                {isCheckedIn ? "Check Out Now" : "Check In Now"}
                            </button>
                        </div>
                    </div>

                    {/* History Card */}
                    <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm h-fit">
                        <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center justify-between">
                            History
                            <Calendar className="w-5 h-5 text-slate-300" />
                        </h2>
                        <div className="space-y-4">
                            {history.map((record, i) => (
                                <div key={i} className="p-4 rounded-2xl border border-slate-50 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-sm font-black text-slate-800">{record.date}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{record.hours} Worked</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${record.status === 'Present' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {record.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-6 mt-2">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                                            <span className="text-xs font-bold text-slate-600">{record.checkIn}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <XCircle className="w-3 h-3 text-rose-500" />
                                            <span className="text-xs font-bold text-slate-600">{record.checkOut}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default AttendancePage;
