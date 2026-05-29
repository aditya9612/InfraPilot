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
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Briefcase
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

    // Camera State - Check In
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    // Camera State - Check Out
    const checkoutVideoRef = useRef<HTMLVideoElement>(null);
    const checkoutCanvasRef = useRef<HTMLCanvasElement>(null);
    const [checkoutStream, setCheckoutStream] = useState<MediaStream | null>(null);
    const [checkoutCapturedImage, setCheckoutCapturedImage] = useState<string | null>(null);

    // View Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedLabour, setSelectedLabour] = useState<any>(null);

    // Image Preview State
    const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);

    const navigate = useNavigate();

    // Labour Attendance Filters
    const [empSearch, setEmpSearch] = useState("");
    const [empStatusFilter, setEmpStatusFilter] = useState("All Status");
    const [empContractorFilter, setEmpContractorFilter] = useState("All Contractors");
    const [empDurationFilter, setEmpDurationFilter] = useState("Today");

    // History Quick Filter & Pagination
    const [historyFilter, setHistoryFilter] = useState<"Today" | "Yesterday" | "All" | "Date">("Today");
    const [historyPage, setHistoryPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [historyDateInput, setHistoryDateInput] = useState("");

    // Mock history records for Yesterday / All / Date views
    const mockHistoryRecords = Array.from({ length: 25 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (i + 1));
        return {
            date: d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' }) + ' 2026',
            project: 'InfraPilot',
            location: 'Work from Office',
            onlineStatus: 'Checked Out',
            checkIn: '09:' + String(10 + (i % 10)).padStart(2, '0') + ' AM',
            checkOut: '06:' + String(i % 60).padStart(2, '0') + ' PM',
            hours: '08:' + String(i % 60).padStart(2, '0'),
            status: i % 3 === 0 ? 'Late' : 'On Time',
        };
    });

    const getFilteredHistory = () => {
        if (historyFilter === 'Yesterday') return mockHistoryRecords.slice(0, 1);
        if (historyFilter === 'All') return mockHistoryRecords;
        if (historyFilter === 'Date' && historyDateInput) {
            return mockHistoryRecords.slice(0, 5);
        }
        return [];
    };

    const filteredHistory = getFilteredHistory();
    const paginatedHistory = filteredHistory.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);

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
                    if (error.code === 1) toast.error("Please allow location access to check in.");
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

    // Camera Logic - Check In
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

    // Camera Logic - Check Out
    const startCheckoutCamera = async () => {
        setCheckoutCapturedImage(null);
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCheckoutStream(mediaStream);
            if (checkoutVideoRef.current) {
                checkoutVideoRef.current.srcObject = mediaStream;
            }
        } catch (err) {
            console.error("Error accessing camera", err);
            toast.error("Could not access camera. Please allow permissions.");
        }
    };

    const stopCheckoutCamera = useCallback(() => {
        if (checkoutStream) {
            checkoutStream.getTracks().forEach(track => track.stop());
            setCheckoutStream(null);
        }
    }, [checkoutStream]);

    useEffect(() => {
        if (isCheckOutModalOpen && !checkoutCapturedImage) {
            startCheckoutCamera();
        } else {
            stopCheckoutCamera();
        }
        return () => stopCheckoutCamera();
    }, [isCheckOutModalOpen, checkoutCapturedImage]);

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

    const takeCheckoutPhoto = () => {
        if (checkoutVideoRef.current && checkoutCanvasRef.current) {
            const video = checkoutVideoRef.current;
            const canvas = checkoutCanvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageUrl = canvas.toDataURL('image/jpeg');
                setCheckoutCapturedImage(imageUrl);
                stopCheckoutCamera();
            }
        }
    };

    const handleUsePhoto = () => {
        setCheckInTime(new Date());
        setAttendanceState("CHECKED_IN");
        setIsCheckInModalOpen(false);
        toast.success("Successfully Checked In!");
    };

    const handleUseCheckoutPhoto = () => {
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

    const mockLabourAttendances = [
        {
            id: "LAB-001",
            name: "Rahul Sharma",
            contractor: "ABC Builders",
            department: "Engineering",
            workLocation: "Work from Office",
            status: "Online",
            checkIn: "09:30 AM",
            checkOut: "-",
            hours: "-",
            imgInUrl: "https://randomuser.me/api/portraits/men/32.jpg",
            imgOutUrl: "",
            startWorkImgUrl: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=100&auto=format&fit=crop",
            endWorkImgUrl: "",
            attendanceStatus: "On Time"
        },
        {
            id: "LAB-002",
            name: "Priya Singh",
            contractor: "XYZ Constructions",
            department: "Engineering",
            workLocation: "Work from Home",
            status: "Checked Out",
            checkIn: "10:15 AM",
            checkOut: "07:00 PM",
            hours: "08:45",
            imgInUrl: "https://randomuser.me/api/portraits/women/44.jpg",
            imgOutUrl: "https://randomuser.me/api/portraits/women/44.jpg",
            startWorkImgUrl: "https://images.unsplash.com/photo-1541888086425-d81bb19240f5?q=80&w=100&auto=format&fit=crop",
            endWorkImgUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=100&auto=format&fit=crop",
            attendanceStatus: "Late"
        },
        {
            id: "LAB-003",
            name: "Amit Patel",
            contractor: "ABC Builders",
            department: "Plumbing",
            workLocation: "Site A",
            status: "Checked Out",
            checkIn: "08:00 AM",
            checkOut: "05:00 PM",
            hours: "09:00",
            imgInUrl: "https://randomuser.me/api/portraits/men/67.jpg",
            imgOutUrl: "https://randomuser.me/api/portraits/men/67.jpg",
            startWorkImgUrl: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=100&auto=format&fit=crop",
            endWorkImgUrl: "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=100&auto=format&fit=crop",
            attendanceStatus: "On Time"
        },
        {
            id: "LAB-004",
            name: "Sneha Roy",
            contractor: "XYZ Constructions",
            department: "Electrical",
            workLocation: "Site B",
            status: "Online",
            checkIn: "09:45 AM",
            checkOut: "-",
            hours: "-",
            imgInUrl: "https://randomuser.me/api/portraits/women/68.jpg",
            imgOutUrl: "",
            startWorkImgUrl: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=100&auto=format&fit=crop",
            endWorkImgUrl: "",
            attendanceStatus: "Late"
        }
    ];

    const filteredLabourAttendances = mockLabourAttendances.filter(lab => {
        if (empStatusFilter !== "All Status" && lab.attendanceStatus !== empStatusFilter) return false;
        if (empContractorFilter !== "All Contractors" && lab.contractor !== empContractorFilter) return false;
        if (empSearch) {
            const searchLower = empSearch.toLowerCase();
            return lab.name.toLowerCase().includes(searchLower) || lab.id.toLowerCase().includes(searchLower) || lab.department.toLowerCase().includes(searchLower);
        }
        return true;
    });

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
                                className={`px-8 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab
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
                                        {(["Today", "Yesterday", "All", "Date"] as const).map(f => (
                                            <button
                                                key={f}
                                                onClick={() => { setHistoryFilter(f); setHistoryPage(1); }}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${historyFilter === f
                                                        ? 'bg-blue-500 text-white shadow-sm'
                                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {f === 'Date' && <Calendar className="w-3 h-3" />} {f}
                                            </button>
                                        ))}
                                        {historyFilter === 'Date' && (
                                            <input
                                                type="date"
                                                value={historyDateInput}
                                                onChange={e => { setHistoryDateInput(e.target.value); setHistoryPage(1); }}
                                                className="border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-blue-200"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                                    Showing {historyFilter === 'Today' ? (attendanceState !== 'NOT_CHECKED_IN' ? '1' : '0') : filteredHistory.length} records
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left whitespace-nowrap">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-800 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Project</th>
                                            <th className="px-6 py-4">Work Location</th>
                                            <th className="px-6 py-4">Online Status</th>
                                            <th className="px-6 py-4">Check In</th>
                                            <th className="px-6 py-4">Check Out</th>
                                            <th className="px-6 py-4 text-center">Hours</th>
                                            <th className="px-6 py-4">Location</th>
                                            <th className="px-6 py-4">Selfie</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Work Summary</th>
                                            <th className="px-6 py-4">Overdue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {historyFilter === 'Today' ? (
                                            // Today: show today's checkin row (existing logic)
                                            attendanceState === 'NOT_CHECKED_IN' ? (
                                                <tr><td colSpan={12} className="px-6 py-12 text-center"><p className="text-xs text-slate-500 font-medium">No records found</p></td></tr>
                                            ) : (
                                                <tr className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">{formatDate(currentDateTime).replace(/, \d{4}/, ' 2026')}</span></td>
                                                    <td className="px-6 py-4"><span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">InfraPilot</span></td>
                                                    <td className="px-6 py-4"><span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[10px] font-bold text-blue-600 flex items-center gap-1 w-max"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> Work from Office</span></td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            {attendanceState === 'CHECKED_IN' ? (<span className="text-[10px] font-bold text-slate-800 flex items-center gap-1 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Online</span>) : (<span className="text-[10px] font-bold text-slate-600 mb-1">Checked Out</span>)}
                                                            <span className="text-[9px] font-bold text-rose-500">IN: LATE</span>
                                                            <span className={`text-[9px] font-bold ${attendanceState === 'CHECKED_OUT' ? 'text-orange-500' : 'text-slate-400'}`}>OUT: {attendanceState === 'CHECKED_OUT' ? 'EARLY' : 'PENDING'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {checkInTime ? formatTime(checkInTime) : '-'}</span></td>
                                                    <td className="px-6 py-4">{attendanceState === 'CHECKED_OUT' ? (<span className="text-[10px] font-bold text-rose-600 flex items-center gap-1"><LogOut className="w-3 h-3 rotate-180" /> {checkOutTime ? formatTime(checkOutTime) : '-'}</span>) : (<span className="text-[10px] font-bold text-rose-500 flex items-center gap-1"><LogOut className="w-3 h-3 rotate-180" /> -</span>)}</td>
                                                    <td className="px-6 py-4 text-center"><span className="text-xs font-bold text-slate-800">{attendanceState === 'CHECKED_OUT' ? calculateHours() : '-'}</span></td>
                                                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 cursor-pointer"><MapPin className="w-3 h-3" /> View</span></td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wide">In</span>
                                                                {capturedImage ? (<div className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-400"><img src={capturedImage} alt="CheckIn Selfie" className="w-full h-full object-cover" /></div>) : (<div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-300" />)}
                                                            </div>
                                                            <div className="flex flex-col items-center gap-1">
                                                                <span className="text-[8px] font-bold text-rose-500 uppercase tracking-wide">Out</span>
                                                                {checkoutCapturedImage ? (<div className="w-8 h-8 rounded-full overflow-hidden border-2 border-rose-400"><img src={checkoutCapturedImage} alt="CheckOut Selfie" className="w-full h-full object-cover" /></div>) : (<div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-300" />)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="px-2 py-0.5 bg-rose-500 text-white rounded-full text-[9px] font-bold mb-1">Late</span>
                                                            <span className="text-[9px] font-bold text-rose-500">IN: LATE</span>
                                                            <span className={`text-[9px] font-bold ${attendanceState === 'CHECKED_OUT' ? 'text-orange-500' : 'text-slate-400'}`}>OUT: {attendanceState === 'CHECKED_OUT' ? 'EARLY' : 'PENDING'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                                    <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                                </tr>
                                            )
                                        ) : paginatedHistory.length === 0 ? (
                                            <tr><td colSpan={12} className="px-6 py-12 text-center"><p className="text-xs text-slate-500 font-medium">{historyFilter === 'Date' && !historyDateInput ? 'Select a date to view records' : 'No records found'}</p></td></tr>
                                        ) : (
                                            paginatedHistory.map((rec, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">{rec.date}</span></td>
                                                    <td className="px-6 py-4"><span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">{rec.project}</span></td>
                                                    <td className="px-6 py-4"><span className="px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[10px] font-bold text-blue-600 flex items-center gap-1 w-max"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div> {rec.location}</span></td>
                                                    <td className="px-6 py-4 text-center"><span className="text-[10px] font-bold text-slate-600">{rec.onlineStatus}</span></td>
                                                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {rec.checkIn}</span></td>
                                                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-rose-600 flex items-center gap-1"><LogOut className="w-3 h-3 rotate-180" /> {rec.checkOut}</span></td>
                                                    <td className="px-6 py-4 text-center"><span className="text-xs font-bold text-slate-800">{rec.hours}</span></td>
                                                    <td className="px-6 py-4"><span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 cursor-pointer"><MapPin className="w-3 h-3" /> View</span></td>
                                                    <td className="px-6 py-4"><div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-slate-300" /></td>
                                                    <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${rec.status === 'Late' ? 'bg-rose-500 text-white' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>{rec.status}</span></td>
                                                    <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                                    <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination footer - only for Yesterday / All / Date */}
                            {historyFilter !== 'Today' && filteredHistory.length > 0 && (
                                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                                    {/* Left: Items per page */}
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                                        <select 
                                            value={itemsPerPage} 
                                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setHistoryPage(1); }}
                                            className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                                        >
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>

                                    {/* Center: Showing info */}
                                    <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                                        Showing {(historyPage - 1) * itemsPerPage + 1} - {Math.min(historyPage * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} records
                                    </div>

                                    {/* Right: Pagination */}
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                                            disabled={historyPage === 1}
                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        
                                        {(() => {
                                            const totalItems = filteredHistory.length;
                                            const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                            const pages = [];
                                            if (totalPages <= 5) {
                                                for (let i = 1; i <= totalPages; i++) pages.push(i);
                                            } else {
                                                if (historyPage <= 3) {
                                                    pages.push(1, 2, 3, 4, '...', totalPages);
                                                } else if (historyPage >= totalPages - 2) {
                                                    pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                                } else {
                                                    pages.push(1, '...', historyPage - 1, historyPage, historyPage + 1, '...', totalPages);
                                                }
                                            }

                                            return pages.map((page, index) => {
                                                if (page === '...') {
                                                    return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                                }
                                                const pageNum = page as number;
                                                const isActive = historyPage === pageNum;
                                                return (
                                                    <button
                                                        key={`page-${pageNum}`}
                                                        onClick={() => setHistoryPage(pageNum)}
                                                        className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                                                            isActive 
                                                                ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary' 
                                                                : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            });
                                        })()}

                                        <button
                                            onClick={() => setHistoryPage(prev => Math.min(Math.ceil(filteredHistory.length / itemsPerPage), prev + 1))}
                                            disabled={historyPage === Math.max(1, Math.ceil(filteredHistory.length / itemsPerPage)) || filteredHistory.length === 0}
                                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                            {historyFilter === 'Today' && attendanceState !== 'NOT_CHECKED_IN' && (
                                <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-500">Showing 1 to 1 of 1 entries</span>
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
                                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Contractor</label>
                                    <div className="relative">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                        <select
                                            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none bg-white cursor-pointer"
                                            value={empContractorFilter}
                                            onChange={e => setEmpContractorFilter(e.target.value)}
                                        >
                                            <option value="All Contractors">All Contractors</option>
                                            <option value="ABC Builders">ABC Builders</option>
                                            <option value="XYZ Constructions">XYZ Constructions</option>
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
                                        <th className="px-6 py-4">Contractor Name</th>
                                        <th className="px-6 py-4">Department</th>
                                        <th className="px-6 py-4">Work Location</th>
                                        <th className="px-6 py-4">Online Status</th>
                                        <th className="px-6 py-4">Check In</th>
                                        <th className="px-6 py-4">Check Out</th>
                                        <th className="px-6 py-4">Hours</th>
                                        <th className="px-6 py-4">Location</th>
                                        <th className="px-6 py-4">Check-In Image</th>
                                        <th className="px-6 py-4">Check-Out Image</th>
                                        <th className="px-6 py-4">Start Work Image</th>
                                        <th className="px-6 py-4">End Work Image</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Work Summary</th>
                                        <th className="px-6 py-4">Work Report</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredLabourAttendances.map((lab, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">21 May 2026</span></td>
                                            <td className="px-6 py-4"><span className="text-xs font-bold text-slate-500">{lab.id}</span></td>
                                            <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">{lab.name}</span></td>
                                            <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">{lab.contractor}</span></td>
                                            <td className="px-6 py-4"><span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">{lab.department}</span></td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 ${lab.workLocation === 'Work from Home' ? 'bg-purple-50 border-purple-200 text-purple-600' : 'bg-blue-50 border-blue-200 text-blue-600'} border rounded-full text-[10px] font-bold flex items-center gap-1 w-max`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${lab.workLocation === 'Work from Home' ? 'bg-purple-500' : 'bg-blue-500'}`}></div> {lab.workLocation}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    {lab.status === "Online" ? (
                                                        <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1 mb-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Online
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-600 mb-1">Checked Out</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {lab.checkIn}</span></td>
                                            <td className="px-6 py-4"><span className={`text-[10px] font-bold ${lab.checkOut !== '-' ? 'text-rose-600' : 'text-slate-400'} flex items-center gap-1`}><LogOut className="w-3 h-3 rotate-180" /> {lab.checkOut}</span></td>
                                            <td className="px-6 py-4 text-center"><span className="text-xs font-bold text-slate-800">{lab.hours}</span></td>
                                            <td className="px-6 py-4"><span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 cursor-pointer"><MapPin className="w-3 h-3" /> View</span></td>
                                            <td className="px-6 py-4">
                                                <div
                                                    className="w-8 h-8 rounded-full border-2 border-emerald-400 overflow-hidden bg-emerald-50 cursor-pointer hover:scale-110 transition-transform shadow-sm"
                                                    onClick={() => setPreviewImage({ url: lab.imgInUrl, title: "Check-In Image - " + lab.name })}
                                                >
                                                    <img src={lab.imgInUrl} alt="Check-In" className="w-full h-full object-cover" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {lab.checkOut !== '-' && lab.imgOutUrl ? (
                                                    <div
                                                        className="w-8 h-8 rounded-full border-2 border-rose-400 overflow-hidden bg-rose-50 cursor-pointer hover:scale-110 transition-transform shadow-sm"
                                                        onClick={() => setPreviewImage({ url: lab.imgOutUrl, title: "Check-Out Image - " + lab.name })}
                                                    >
                                                        <img src={lab.imgOutUrl} alt="Check-Out" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Camera className="w-3 h-3" /></div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {lab.startWorkImgUrl ? (
                                                    <div
                                                        className="w-10 h-10 rounded-lg border-2 border-blue-400 overflow-hidden bg-blue-50 cursor-pointer hover:scale-110 transition-transform shadow-sm"
                                                        onClick={() => setPreviewImage({ url: lab.startWorkImgUrl, title: "Start Work Image - " + lab.name })}
                                                    >
                                                        <img src={lab.startWorkImgUrl} alt="Start Work" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Camera className="w-3 h-3" /></div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {lab.checkOut !== '-' && lab.endWorkImgUrl ? (
                                                    <div
                                                        className="w-10 h-10 rounded-lg border-2 border-orange-400 overflow-hidden bg-orange-50 cursor-pointer hover:scale-110 transition-transform shadow-sm"
                                                        onClick={() => setPreviewImage({ url: lab.endWorkImgUrl, title: "End Work Image - " + lab.name })}
                                                    >
                                                        <img src={lab.endWorkImgUrl} alt="End Work" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Camera className="w-3 h-3" /></div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 ${lab.attendanceStatus === 'Late' ? 'bg-rose-50 text-rose-500 border-rose-200' : 'bg-emerald-50 text-emerald-500 border-emerald-200'} border rounded-full text-[9px] font-bold`}>{lab.attendanceStatus}</span></td>
                                            <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                            <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedLabour(lab);
                                                            setIsViewModalOpen(true);
                                                        }}
                                                        className="px-4 py-2 text-[10px] font-bold text-white bg-primary hover:bg-blue-600 uppercase tracking-widest rounded-xl transition-all font-inter shadow-lg shadow-primary/20 active:scale-95"
                                                    >
                                                            VIEW DETAILS
                                                        </button>
                                                    <button
                                                        onClick={() => navigate(`/engineer/labor/${lab.id}`)}
                                                        className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                                                        title="View Full Detail"
                                                    >
                                                        View Detail <ArrowRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
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
                    <h2 className="text-center text-sm font-black text-slate-800 mb-4 uppercase tracking-widest mt-2">Capture Check-In Photo</h2>

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
                        {!capturedImage && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-2 border-blue-400/70 rounded-full opacity-60" />
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">Live</span>
                                </div>
                            </div>
                        )}
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

            {/* Check-Out Camera Modal */}
            <Modal
                isOpen={isCheckOutModalOpen}
                onClose={() => { setIsCheckOutModalOpen(false); setCheckoutCapturedImage(null); }}
                title=""
                maxWidth="max-w-xl"
            >
                <div className="p-2">
                    <h2 className="text-center text-sm font-black text-slate-800 mb-4 uppercase tracking-widest mt-2">Capture Checkout Photo</h2>

                    <div className="bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                        {!checkoutCapturedImage ? (
                            <video
                                ref={checkoutVideoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={checkoutCapturedImage}
                                alt="Captured"
                                className="w-full h-full object-cover"
                            />
                        )}
                        <canvas ref={checkoutCanvasRef} className="hidden" />
                        {!checkoutCapturedImage && (
                            <div className="absolute inset-0 pointer-events-none">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-40 border-2 border-rose-400/70 rounded-full opacity-60" />
                                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                    <span className="text-white text-[10px] font-bold uppercase tracking-widest">Live</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center gap-4 mt-6 mb-2">
                        {!checkoutCapturedImage ? (
                            <>
                                <button
                                    onClick={() => takeCheckoutPhoto()}
                                    className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Camera className="w-4 h-4" /> Capture Photo
                                </button>
                                <button
                                    onClick={() => { setIsCheckOutModalOpen(false); setCheckoutCapturedImage(null); }}
                                    className="flex-1 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" /> Cancel
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => { setCheckoutCapturedImage(null); }}
                                    className="flex-1 py-3 bg-white text-slate-800 border border-slate-200 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" /> Retake
                                </button>
                                <button
                                    onClick={handleUseCheckoutPhoto}
                                    className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-4 h-4" /> Use Photo
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </Modal>

            {/* Labour Detail View Modal */}
            <Modal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                title=""
                maxWidth="max-w-lg"
            >
                {selectedLabour && (
                    <div className="font-inter">
                        {/* Header Banner */}
                        <div className="bg-primary rounded-2xl p-6 mb-0 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                            <div className="absolute bottom-[-40px] left-[-40px] w-40 h-40 bg-white/5 rounded-full blur-xl pointer-events-none" />
                            <div className="relative z-10 flex items-center gap-5">
                                <div className="w-16 h-16 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative shadow-inner flex-shrink-0 overflow-hidden">
                                    <img src={selectedLabour.imgInUrl} alt={selectedLabour.name} className="w-full h-full object-cover" />
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-primary z-20 ${selectedLabour.status === 'Online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="text-xl font-black tracking-tight truncate">{selectedLabour.name}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest">{selectedLabour.id}</span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-white/70 text-xs font-medium">
                                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-white/80" /> {selectedLabour.workLocation}</span>
                                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3 text-white/80" /> {selectedLabour.contractor}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-white/80" /> {formatDate(currentDateTime).replace(/, \d{4}/, ' 2026')}</span>
                                    </div>
                                    <div className="mt-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${selectedLabour.status === 'Online' ? 'bg-emerald-400/30 text-emerald-200' : 'bg-white/10 text-white/70'}`}>
                                            {selectedLabour.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Images Section */}
                        <div className="px-6 py-5 border-b border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Attendance & Work Photos</p>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className="w-14 h-14 rounded-2xl bg-emerald-50 border-2 border-emerald-400 overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                                        onClick={() => setPreviewImage({ url: selectedLabour.imgInUrl, title: "Check-In Image - " + selectedLabour.name })}
                                    >
                                        <img src={selectedLabour.imgInUrl} alt="Check-In" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide text-center">Check-In</p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className={`w-14 h-14 rounded-2xl overflow-hidden ${selectedLabour.checkOut !== '-' && selectedLabour.imgOutUrl ? 'bg-rose-50 border-2 border-rose-400 cursor-pointer hover:scale-105 transition-transform' : 'bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400'}`}
                                        onClick={() => selectedLabour.checkOut !== '-' && selectedLabour.imgOutUrl && setPreviewImage({ url: selectedLabour.imgOutUrl, title: "Check-Out Image - " + selectedLabour.name })}
                                    >
                                        {selectedLabour.checkOut !== '-' && selectedLabour.imgOutUrl ? <img src={selectedLabour.imgOutUrl} alt="Check-Out" className="w-full h-full object-cover" /> : <Camera className="w-4 h-4" />}
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase tracking-wide text-center ${selectedLabour.checkOut !== '-' && selectedLabour.imgOutUrl ? 'text-rose-500' : 'text-slate-400'}`}>Check-Out</p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className={`w-14 h-14 rounded-2xl overflow-hidden ${selectedLabour.startWorkImgUrl ? 'bg-blue-50 border-2 border-blue-400 cursor-pointer hover:scale-105 transition-transform' : 'bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400'}`}
                                        onClick={() => selectedLabour.startWorkImgUrl && setPreviewImage({ url: selectedLabour.startWorkImgUrl, title: "Start Work Image - " + selectedLabour.name })}
                                    >
                                        {selectedLabour.startWorkImgUrl ? <img src={selectedLabour.startWorkImgUrl} alt="Start Work" className="w-full h-full object-cover" /> : <Camera className="w-4 h-4" />}
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase tracking-wide text-center ${selectedLabour.startWorkImgUrl ? 'text-blue-500' : 'text-slate-400'}`}>Start Work</p>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <div
                                        className={`w-14 h-14 rounded-2xl overflow-hidden ${selectedLabour.endWorkImgUrl && selectedLabour.checkOut !== '-' ? 'bg-orange-50 border-2 border-orange-400 cursor-pointer hover:scale-105 transition-transform' : 'bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400'}`}
                                        onClick={() => selectedLabour.endWorkImgUrl && selectedLabour.checkOut !== '-' && setPreviewImage({ url: selectedLabour.endWorkImgUrl, title: "End Work Image - " + selectedLabour.name })}
                                    >
                                        {selectedLabour.endWorkImgUrl && selectedLabour.checkOut !== '-' ? <img src={selectedLabour.endWorkImgUrl} alt="End Work" className="w-full h-full object-cover" /> : <Camera className="w-4 h-4" />}
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase tracking-wide text-center ${selectedLabour.endWorkImgUrl && selectedLabour.checkOut !== '-' ? 'text-orange-500' : 'text-slate-400'}`}>End Work</p>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4 border-b border-slate-100">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Labour ID</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.id}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contractor</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.contractor}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.department}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Work Location</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.workLocation}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check-In Time</p>
                                <p className="text-xs font-bold text-emerald-600">{selectedLabour.checkIn}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check-Out Time</p>
                                <p className={`text-xs font-bold ${selectedLabour.checkOut !== '-' ? 'text-rose-600' : 'text-slate-400'}`}>{selectedLabour.checkOut}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Hours</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.hours || '-'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Attendance Status</p>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${selectedLabour.attendanceStatus === 'Late' ? 'bg-rose-50 text-rose-500 border border-rose-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                                    {selectedLabour.attendanceStatus || 'On Time'}
                                </span>
                            </div>
                        </div>

                        {/* Footer Button */}
                        <div className="px-6 py-5">
                            <button
                                onClick={() => setIsViewModalOpen(false)}
                                className="w-full py-3 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Image Preview Modal */}
            <Modal
                isOpen={!!previewImage}
                onClose={() => setPreviewImage(null)}
                title={previewImage?.title || "Image Preview"}
                maxWidth="max-w-sm"
            >
                <div className="w-full flex items-center justify-center bg-black/5">
                    {previewImage && (
                        <img
                            src={previewImage.url}
                            alt={previewImage.title}
                            className="w-full h-auto object-cover rounded-b-2xl"
                        />
                    )}
                </div>
            </Modal>

        </>
    );
};

export default AttendancePage;
