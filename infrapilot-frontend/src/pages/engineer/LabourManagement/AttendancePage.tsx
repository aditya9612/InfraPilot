import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import Modal from '../../../components/common/Modal';
import {
    Clock,
    MapPin,
    Search,
    Download,
    Calendar,
    Filter,
    Camera,
    RefreshCw,
    Check,
    X,
    LogOut,
    CheckCircle2,
    Eye,
    ArrowRight
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

type AttendanceState = "NOT_CHECKED_IN" | "CHECKED_IN" | "CHECKED_OUT";

const AttendancePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<"Self Attendance" | "Labour Attendance">("Self Attendance");
    const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());
    
    // Geolocation state
    const [locationAddress, setLocationAddress] = useState<string>("Fetching location...");
    
    // Attendance Flow State
    const [attendanceState, setAttendanceState] = useState<AttendanceState>("NOT_CHECKED_IN");
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);
    
    // Modals State
    const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);
    
    // Camera State
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    
    // View Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedLabour, setSelectedLabour] = useState<any>(null);
    const navigate = useNavigate();

    // Labour Attendance Filters
    const [empSearch, setEmpSearch] = useState("");
    const [empStatusFilter, setEmpStatusFilter] = useState("All Status");
    const [empDurationFilter, setEmpDurationFilter] = useState("Today");

    useEffect(() => {
        const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (activeTab === "Self Attendance") {
            captureGPS();
        }
    }, [activeTab]);

    const captureGPS = () => {
        setLocationAddress("Locating...");
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
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
                    if(error.code === 1) toast.error("Please allow location access to check in.");
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            setLocationAddress("Geolocation not supported by browser");
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    // Camera Logic
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
        if (isCheckInModalOpen && !capturedImage) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isCheckInModalOpen, capturedImage]);

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

    const handleUsePhoto = () => {
        setCheckInTime(new Date());
        setAttendanceState("CHECKED_IN");
        setIsCheckInModalOpen(false);
        toast.success("Successfully Checked In!");
    };

    const handleConfirmCheckOut = () => {
        setCheckOutTime(new Date());
        setAttendanceState("CHECKED_OUT");
        setIsCheckOutModalOpen(false);
        toast.success("Successfully Checked Out!");
    };

    // Calculate hours diff
    const calculateHours = () => {
        if (!checkInTime) return "00:00";
        const end = checkOutTime || currentDateTime;
        const diffMs = end.getTime() - checkInTime.getTime();
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        // If diff is 0, let's just return a static mock 00:10 for demonstration of checkout
        if (attendanceState === "CHECKED_OUT" && diffHrs === 0 && diffMins === 0) {
            return "00:10";
        }
        return `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}`;
    };

    return (
        <>
            <Navbar title="Attendance Management" breadcrumb={["Engineer", "Human Resources", "Attendance Management"]} />

            <PageTransition className="p-4 md:p-6 bg-slate-50 font-inter min-h-[calc(100vh-64px)] overflow-y-auto pb-8 flex flex-col gap-6">
                
                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
                            <Clock className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Attendance Management</h1>
                            <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs font-medium">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>{formatDate(currentDateTime)} | {formatTime(currentDateTime)}</span>
                            </div>
                        </div>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center justify-center w-full">
                    <div className="inline-flex bg-white rounded-full p-1 border border-slate-200 shadow-sm overflow-x-auto max-w-full">
                        {(["Self Attendance", "Labour Attendance"] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-8 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                    activeTab === tab 
                                    ? "bg-indigo-500 text-white shadow-sm" 
                                    : "text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Self Attendance Content */}
                {activeTab === "Self Attendance" && (
                    <div className="flex flex-col gap-6">
                        {/* Today's Status Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden p-6">
                            <h3 className="text-sm font-bold text-slate-800">Today's Status</h3>
                            <p className="text-xs text-slate-500 mt-1 mb-6">Your attendance status for today</p>
                            
                            <div className="flex items-start gap-2 text-xs font-medium text-slate-600 mb-8">
                                <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400 mt-0.5" />
                                <span>{locationAddress}</span>
                            </div>

                            {attendanceState === "NOT_CHECKED_IN" && (
                                <div className="flex flex-col items-center justify-center py-10">
                                    <div className="w-12 h-12 rounded-full border-2 border-slate-300 flex items-center justify-center text-slate-400 mb-3">
                                        <span className="text-xl font-bold">!</span>
                                    </div>
                                    <p className="text-xs font-medium text-slate-500 mb-10">Not Checked in Yet.</p>
                                    <button 
                                        onClick={() => setIsCheckInModalOpen(true)}
                                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                    >
                                        <LogOut className="w-4 h-4 rotate-180" /> Check In
                                    </button>
                                </div>
                            )}

                            {attendanceState !== "NOT_CHECKED_IN" && (
                                <div className="flex flex-col gap-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <LogOut className="w-4 h-4 text-emerald-500" />
                                                <span className="text-xs font-bold text-slate-800">Check-In Time</span>
                                                <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-bold">Late</span>
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-500 border border-blue-200 rounded-full text-[10px] font-bold flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    Work From Office
                                                </span>
                                            </div>
                                            <p className="text-sm font-bold text-slate-800">{checkInTime ? formatTime(checkInTime) : "-"}</p>
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <LogOut className="w-4 h-4 text-rose-500 rotate-180" />
                                                <span className="text-xs font-bold text-slate-800">Check-out Time</span>
                                                {attendanceState === "CHECKED_OUT" && (
                                                    <span className="px-2 py-0.5 bg-orange-50 text-orange-500 border border-orange-200 rounded-full text-[10px] font-bold">Early</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-bold text-slate-800">{checkOutTime ? formatTime(checkOutTime) : "-"}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="w-4 h-4 text-blue-500" />
                                            <span className="text-xs font-bold text-slate-800">Total Work Hours</span>
                                        </div>
                                        <p className="text-sm font-bold text-slate-800">{calculateHours()}</p>
                                    </div>

                                    {attendanceState === "CHECKED_IN" && (
                                        <>
                                            <div className="flex items-center gap-2 mt-4">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                                <span className="text-xs font-bold text-emerald-500">Live tracking - updates in real-time</span>
                                            </div>
                                            <button 
                                                onClick={() => setIsCheckOutModalOpen(true)}
                                                className="w-full mt-2 py-3.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20"
                                            >
                                                <LogOut className="w-4 h-4 rotate-180" /> Check Out
                                            </button>
                                        </>
                                    )}

                                    {attendanceState === "CHECKED_OUT" && (
                                        <div className="w-full mt-6 py-3 border border-slate-200 bg-slate-50 text-slate-500 text-xs font-bold rounded-xl flex items-center justify-center gap-2">
                                            <CheckCircle2 className="w-4 h-4" /> Attendance Completed for Today
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Attendance History Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">Attendance History</h3>
                                    <p className="text-xs text-slate-500 mt-1 mb-4">Your Attendance Records</p>
                                    
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold text-slate-800 mr-2">Quick Filters</span>
                                        <button className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-xs font-medium shadow-sm">Today</button>
                                        <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">Yesterday</button>
                                        <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors">All</button>
                                        <button className="px-4 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors flex items-center gap-2">Date</button>
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                                    Showing {attendanceState !== "NOT_CHECKED_IN" ? "1" : "0"} records
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Department</th>
                                            <th className="px-6 py-4">Work Location</th>
                                            <th className="px-6 py-4">Online Status</th>
                                            <th className="px-6 py-4">Check In</th>
                                            <th className="px-6 py-4">Check Out</th>
                                            <th className="px-6 py-4 text-center">Hours</th>
                                            <th className="px-6 py-4">Location</th>
                                            <th className="px-6 py-4">Selfie</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Work Summary</th>
                                            <th className="px-6 py-4">Work Report</th>
                                            <th className="px-6 py-4">Overdue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {attendanceState === "NOT_CHECKED_IN" ? (
                                            <tr>
                                                <td colSpan={13} className="px-6 py-12 text-center">
                                                    <p className="text-xs text-slate-500 font-medium">No records found</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-slate-800">{formatDate(currentDateTime).replace(/, \d{4}/, ' 2026')}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">Engineering</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[10px] font-bold text-blue-600 flex items-center gap-1 w-max">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Work from Office
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        {attendanceState === "CHECKED_IN" ? (
                                                            <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1 mb-1">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Online
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] font-bold text-slate-600 mb-1">
                                                                Checked Out
                                                            </span>
                                                        )}
                                                        <span className="text-[9px] font-bold text-rose-500">IN: LATE</span>
                                                        <span className={`text-[9px] font-bold ${attendanceState === "CHECKED_OUT" ? 'text-orange-500' : 'text-slate-400'}`}>OUT: {attendanceState === "CHECKED_OUT" ? 'EARLY' : 'PENDING'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                                                        <CheckCircle2 className="w-3 h-3" /> {checkInTime ? formatTime(checkInTime) : "-"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {attendanceState === "CHECKED_OUT" ? (
                                                        <span className="text-[10px] font-bold text-rose-600 flex items-center gap-1">
                                                            <LogOut className="w-3 h-3 rotate-180" /> {checkOutTime ? formatTime(checkOutTime) : "-"}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-rose-500 flex items-center gap-1">
                                                            <LogOut className="w-3 h-3 rotate-180" /> -
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-xs font-bold text-slate-800">{attendanceState === "CHECKED_OUT" ? calculateHours() : "-"}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 cursor-pointer">
                                                        <MapPin className="w-3 h-3" /> View
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {capturedImage ? (
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-200">
                                                            <img src={capturedImage} alt="Selfie" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-bold mb-1">Late</span>
                                                        <span className="text-[9px] font-bold text-rose-500">IN: LATE</span>
                                                        <span className={`text-[9px] font-bold ${attendanceState === "CHECKED_OUT" ? 'text-orange-500' : 'text-slate-400'}`}>OUT: {attendanceState === "CHECKED_OUT" ? 'EARLY' : 'PENDING'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                                <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                                <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {attendanceState !== "NOT_CHECKED_IN" && (
                                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500">Showing 1 to 1 of 1 entries</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-800">Show:</span>
                                        <select className="border border-slate-200 rounded-lg px-2 py-1 text-[10px] font-bold bg-white text-slate-600 outline-none">
                                            <option>10</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Labour Attendance Content */}
                {activeTab === "Labour Attendance" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                        <div className="p-5 border-b border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800">Labour Attendances</h3>
                            <p className="text-xs text-slate-500 mt-1 mb-4">View and manage labour attendance</p>

                            <div className="flex flex-wrap items-end gap-4">
                                <div className="flex-1 min-w-[250px]">
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Search</label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Search by name, email, labour ID, or department."
                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-slate-300 italic"
                                            value={empSearch}
                                            onChange={e => setEmpSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="min-w-[150px]">
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                                    <div className="relative">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                        <select 
                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none bg-white cursor-pointer"
                                            value={empStatusFilter}
                                            onChange={e => setEmpStatusFilter(e.target.value)}
                                        >
                                            <option value="All Status">All Status</option>
                                            <option value="On Time">On Time</option>
                                            <option value="Late">Late</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="min-w-[150px]">
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Duration Filter</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                        <select 
                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none bg-white cursor-pointer"
                                            value={empDurationFilter}
                                            onChange={e => setEmpDurationFilter(e.target.value)}
                                        >
                                            <option value="Today">Today</option>
                                            <option value="Current Month">Current Month</option>
                                            <option value="Last Month">Last Month</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Labour ID</th>
                                        <th className="px-6 py-4">Labour Name</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4">Work Location</th>
                                        <th className="px-6 py-4">Online Status</th>
                                        <th className="px-6 py-4">Check In</th>
                                        <th className="px-6 py-4">Check Out</th>
                                        <th className="px-6 py-4">Hours</th>
                                        <th className="px-6 py-4">Location</th>
                                        <th className="px-6 py-4">Selfie</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Work Summary</th>
                                        <th className="px-6 py-4">Work Report</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">21 May 2026</span></td>
                                        <td className="px-6 py-4"><span className="text-xs font-bold text-slate-500">LAB-001</span></td>
                                        <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">Rahul Sharma</span></td>
                                        <td className="px-6 py-4"><span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">Engineering</span></td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[10px] font-bold text-blue-600 flex items-center gap-1 w-max">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Work from Office
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1 mb-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Online
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 09:30 AM</span></td>
                                        <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-400 flex items-center gap-1"><LogOut className="w-3 h-3 rotate-180" /> -</span></td>
                                        <td className="px-6 py-4 text-center"><span className="text-xs font-bold text-slate-800">-</span></td>
                                        <td className="px-6 py-4"><span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 cursor-pointer"><MapPin className="w-3 h-3" /> View</span></td>
                                        <td className="px-6 py-4"><div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">RS</div></td>
                                        <td className="px-6 py-4 text-center"><span className="px-2 py-0.5 bg-emerald-50 text-emerald-500 border border-emerald-200 rounded-full text-[9px] font-bold">On Time</span></td>
                                        <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                        <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                <button
                                                    onClick={() => {
                                                        setSelectedLabour({ name: "Rahul Sharma", id: "LAB-001", status: "Online", checkIn: "09:30 AM", checkOut: "-", department: "Engineering", location: "Work from Office", img: "RS" });
                                                        setIsViewModalOpen(true);
                                                    }}
                                                    className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center"
                                                    title="View Insight"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate('/engineer/labor/LAB-001')}
                                                    className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                                                    title="View Full Detail"
                                                >
                                                    View Detail <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">21 May 2026</span></td>
                                        <td className="px-6 py-4"><span className="text-xs font-bold text-slate-500">LAB-002</span></td>
                                        <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">Priya Singh</span></td>
                                        <td className="px-6 py-4"><span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">Engineering</span></td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-purple-50 border border-purple-200 rounded-full text-[10px] font-bold text-purple-600 flex items-center gap-1 w-max">
                                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div> Work from Home
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-bold text-slate-600 mb-1">Checked Out</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4"><span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> 10:15 AM</span></td>
                                        <td className="px-6 py-4"><span className="text-[10px] font-bold text-rose-600 flex items-center gap-1"><LogOut className="w-3 h-3 rotate-180" /> 07:00 PM</span></td>
                                        <td className="px-6 py-4 text-center"><span className="text-xs font-bold text-slate-800">08:45</span></td>
                                        <td className="px-6 py-4"><span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 cursor-pointer"><MapPin className="w-3 h-3" /> View</span></td>
                                        <td className="px-6 py-4"><div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">PS</div></td>
                                        <td className="px-6 py-4 text-center"><span className="px-2 py-0.5 bg-rose-50 text-rose-500 border border-rose-200 rounded-full text-[9px] font-bold">Late</span></td>
                                        <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                        <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                <button
                                                    onClick={() => {
                                                        setSelectedLabour({ name: "Priya Singh", id: "LAB-002", status: "Checked Out", checkIn: "10:15 AM", checkOut: "07:00 PM", department: "Engineering", location: "Work from Home", img: "PS" });
                                                        setIsViewModalOpen(true);
                                                    }}
                                                    className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center"
                                                    title="View Insight"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate('/engineer/labor/LAB-002')}
                                                    className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                                                    title="View Full Detail"
                                                >
                                                    View Detail <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </PageTransition>

            {/* Check-In Camera Modal */}
            <Modal
                isOpen={isCheckInModalOpen}
                onClose={() => setIsCheckInModalOpen(false)}
                title=""
                maxWidth="max-w-xl"
            >
                <div className="p-2">
                    <h2 className="text-center text-sm font-black text-slate-800 mb-4 uppercase tracking-widest mt-2">Capture Photo</h2>
                    
                    <div className="bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                        {!capturedImage ? (
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                muted 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img 
                                src={capturedImage} 
                                alt="Captured" 
                                className="w-full h-full object-cover"
                            />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-6 mb-2">
                        {!capturedImage ? (
                            <>
                                <button
                                    onClick={() => takePhoto()}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Camera className="w-4 h-4" /> Capture Photo
                                </button>
                                <button
                                    onClick={() => setIsCheckInModalOpen(false)}
                                    className="flex-1 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => setCapturedImage(null)}
                                    className="flex-1 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Retake
                                </button>
                                <button
                                    onClick={handleUsePhoto}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Use Photo
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Check-Out Security Modal */}
            <Modal
                isOpen={isCheckOutModalOpen}
                onClose={() => setIsCheckOutModalOpen(false)}
                title=""
                maxWidth="max-w-md"
            >
                <div className="p-2 font-inter">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest mb-4">Security Verification</p>
                    
                    <div className="border border-dashed border-rose-200 bg-rose-50/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mb-4">
                            <Camera className="w-6 h-6 text-rose-500" />
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-1.5">Capture Mandatory Selfie *</h3>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verification required as per SRS v3.0</p>
                    </div>

                    <div className="flex items-center justify-between mt-8 mb-2">
                        <button
                            onClick={() => setIsCheckOutModalOpen(false)}
                            className="px-6 py-3 text-slate-500 text-xs font-bold hover:text-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmCheckOut}
                            className="px-8 py-3 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
                        >
                            Confirm Check-Out
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Labour Detail View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title="Labour Attendance Insight"
                maxWidth="max-w-xl"
            >
                {selectedLabour && (
                    <div className="p-6 font-inter text-inter italic-none">
                        <div className="bg-primary rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                            <div className="absolute bottom-[-40px] left-[-40px] w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />

                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-20 h-20 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative font-inter shadow-inner">
                                    <span className="text-3xl font-bold font-inter font-black text-white">{selectedLabour.img}</span>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-4 border-primary text-[8px] font-black z-20 ${selectedLabour.status === 'Online' ? 'bg-emerald-500' : 'bg-slate-500'} animate-pulse`} />
                                </div>
                                <div className="flex-1 font-inter">
                                    <div className="flex flex-wrap items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-bold tracking-tight font-inter">{selectedLabour.name}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter">
                                            {selectedLabour.id}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-white/60 mb-4 font-inter text-xs font-medium">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-white/80" />
                                            {formatDate(currentDateTime).replace(/, \d{4}/, ' 2026')}
                                        </span>
                                        <span className="flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-white/80" />
                                            {selectedLabour.location}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 mb-10">
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-50 rounded-lg text-primary">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Attendance Time</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Check In</p>
                                        <p className="text-sm font-bold text-slate-800">{selectedLabour.checkIn}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Check Out</p>
                                        <p className="text-sm font-bold text-slate-800 mb-1">{selectedLabour.checkOut}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsViewModalOpen(false)}
                            className="w-full py-4 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            Dismiss Insight
                        </button>
                    </div>
                )}
            </Modal>

        </>
    );
};

export default AttendancePage;
