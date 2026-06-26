import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import Modal from '../../../components/common/Modal';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    MapPin,
    Calendar,
    Camera,
    CheckCircle2,
    LogIn,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Briefcase,
    Eye
} from "lucide-react";
import toast from 'react-hot-toast';
import labourService from '../../../services/labourService';
import SelfCheckInModal from './components/SelfCheckInModal';
import SelfCheckOutModal from './components/SelfCheckOutModal';
import { useAuth } from '../../../context/AuthContext';

type AttendanceState = "NOT_CHECKED_IN" | "CHECKED_IN" | "CHECKED_OUT";

const AttendancePage: React.FC = () => {
    const { user } = useAuth();
    const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

    // Geolocation state
    const [locationAddress, setLocationAddress] = useState<string>("Fetching location...");

    // Attendance Flow State
    const navigate = useNavigate();
    const [attendanceState, setAttendanceState] = useState<AttendanceState>("NOT_CHECKED_IN");
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [checkOutTime, setCheckOutTime] = useState<Date | null>(null);

    // Modals State
    const [isCheckInModalOpen] = useState(false);
    const [isCheckOutModalOpen, setIsCheckOutModalOpen] = useState(false);

    // Camera State - Check In
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    // Camera State - Check Out
    const checkoutVideoRef = useRef<HTMLVideoElement>(null);
    const [checkoutStream, setCheckoutStream] = useState<MediaStream | null>(null);
    const [checkoutCapturedImage, setCheckoutCapturedImage] = useState<string | null>(null);

    // View Modal State
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedLabour, setSelectedLabour] = useState<any>(null);

    // Labour Check-In Form State

    // Labour Check-Out Form State

    // Self Check-Out Form State

    // Self Check-In Form State
    const [isSelfCheckInFormOpen, setIsSelfCheckInFormOpen] = useState(false);
    // Image Preview State
    const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);


    // Labour Attendance Filters

    // History Quick Filter & Pagination
    const [historyFilter, setHistoryFilter] = useState<"Today" | "Yesterday" | "All" | "Date">("Today");
    const [historyPage, setHistoryPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [historyDateInput, setHistoryDateInput] = useState("");

    const [selfAttendances, setSelfAttendances] = useState<any[]>([]);

    // ─── Restore today's check-in state on page load / refresh ───────────────
    const restoreTodayAttendanceState = async () => {
        try {
            const userId = user?.id;
            const todayData = await labourService.getTodayStatus(userId);
            const att = todayData?.attendance || todayData;

            const parseTimeStr = (timeStr: string) => {
                if (!timeStr || timeStr === "--:--" || timeStr === "null") return null;
                try {
                    if (timeStr.includes('T')) return new Date(timeStr);
                    const d = new Date();
                    if (timeStr.includes('PM') || timeStr.includes('AM')) {
                        const [time, period] = timeStr.split(' ');
                        let [hours, minutes] = time.split(':');
                        let h = parseInt(hours);
                        if (period === 'PM' && h !== 12) h += 12;
                        if (period === 'AM' && h === 12) h = 0;
                        d.setHours(h, parseInt(minutes), 0, 0);
                    } else {
                        const [h, m, s] = timeStr.split(':');
                        d.setHours(parseInt(h) || 0, parseInt(m) || 0, parseInt(s) || 0, 0);
                    }
                    return d;
                } catch { return null; }
            };

            if (att && att.in_time && att.in_time !== "--:--") {
                const parsedIn = parseTimeStr(att.in_time);
                const parsedOut = parseTimeStr(att.out_time);
                if (parsedOut) {
                    setAttendanceState("CHECKED_OUT");
                    if (parsedIn) setCheckInTime(parsedIn);
                    setCheckOutTime(parsedOut);
                } else if (parsedIn) {
                    setAttendanceState("CHECKED_IN");
                    setCheckInTime(parsedIn);
                }
            } else {
                setAttendanceState("NOT_CHECKED_IN");
            }
        } catch (err) {
            console.warn("getTodayStatus failed, falling back to NOT_CHECKED_IN:", err);
            setAttendanceState("NOT_CHECKED_IN");
        }
    };
    // ─────────────────────────────────────────────────────────────────────────

    const fetchSelfAttendances = async () => {
        try {
            const getActiveProjectId = () => {
                try {
                    const userStr = localStorage.getItem("infrapilot_user");
                    if (userStr) {
                        const parsed = JSON.parse(userStr);
                        return parsed.user?.project_id || parsed.project_id || 92;
                    }
                } catch (e) { }
                return 92;
            };

            const activeProjectId = getActiveProjectId();
            let fromDate: string | null = null;
            let toDate: string | null = null;
            const today = new Date().toISOString().split('T')[0];

            if (historyFilter === 'Today') {
                fromDate = today;
                toDate = today;
            } else if (historyFilter === 'Yesterday') {
                const y = new Date();
                y.setDate(y.getDate() - 1);
                const yStr = y.toISOString().split('T')[0];
                fromDate = yStr;
                toDate = yStr;
            } else if (historyFilter === 'All') {
                fromDate = 'ALL';
                toDate = 'ALL';
            } else if (historyFilter === 'Date' && historyDateInput) {
                fromDate = historyDateInput;
                toDate = historyDateInput;
            }

            const data = await labourService.getAttendanceList(activeProjectId, fromDate || undefined, toDate || undefined);
            
            // Filter only this engineer's own records
            const allItems = data.items || [];
            const userIdNum = user?.id ? Number(user.id) : null;
            const filteredItems = allItems.filter((item: any) => 
                Number(item.user_id) === userIdNum || 
                Number(item.labour_id) === userIdNum ||
                (item.worker_code && item.worker_code === `LAB-${userIdNum}`)
            );
            
            setSelfAttendances(filteredItems);
        } catch (error) {
            console.error("Failed to fetch self attendances", error);
        }
    };

    // On mount: restore today's state from API (persists across refresh)
    useEffect(() => {
        restoreTodayAttendanceState();
    }, []);

    useEffect(() => {
        fetchSelfAttendances();
    }, [historyFilter, historyDateInput]);

    const paginatedHistory = selfAttendances.slice((historyPage - 1) * itemsPerPage, historyPage * itemsPerPage);
    useEffect(() => {
        const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {

        captureGPS();

    }, []);

    const captureGPS = () => {
        setLocationAddress("Locating...");
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
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
        if ((isCheckInModalOpen || isSelfCheckInFormOpen) && !capturedImage) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isCheckInModalOpen, isSelfCheckInFormOpen, capturedImage]);

    useEffect(() => {
        if (isSelfCheckInFormOpen) {
            captureGPS();
        }
    }, [isSelfCheckInFormOpen]);

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

    useEffect(() => {
        if (isCheckOutModalOpen) {
            captureGPS();
        }
    }, [isCheckOutModalOpen]);



    // Labour View / Delete Logic




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
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center justify-center w-full">
                    <div className="inline-flex bg-white rounded-full p-1 border border-slate-200 shadow-sm overflow-x-auto max-w-full">
                        <button
                            onClick={() => navigate('/engineer/labor/attendance')}
                            className="px-8 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all bg-indigo-500 text-white shadow-sm"
                        >
                            Self Attendance
                        </button>
                        <button
                            onClick={() => navigate('/engineer/labor/labour-attendance')}
                            className="px-8 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all text-slate-600 hover:bg-slate-50"
                        >
                            Labour Attendance
                        </button>
                    </div>
                </div>

                {/* Self Attendance Content */}

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
                                    onClick={() => setIsSelfCheckInFormOpen(true)}
                                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    <LogIn className="w-4 h-4" /> Check In
                                </button>
                            </div>
                        )}

                        {attendanceState !== "NOT_CHECKED_IN" && (
                            <div className="flex flex-col gap-6">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <LogIn className="w-4 h-4 text-emerald-500" />
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
                                            <LogOut className="w-4 h-4 text-rose-500" />
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
                                            <LogOut className="w-4 h-4" /> Check Out
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
                                Showing {historyFilter === 'Today' ? (attendanceState !== 'NOT_CHECKED_IN' ? '1' : '0') : selfAttendances.length} records
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left whitespace-nowrap">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-800 text-[10px] font-bold tracking-widest border-b border-slate-100">
                                        <th className="px-6 py-4">project_name</th>
                                        <th className="px-6 py-4">attendance_date</th>
                                        <th className="px-6 py-4">status</th>
                                        <th className="px-6 py-4">in_time</th>
                                        <th className="px-6 py-4">out_time</th>
                                        <th className="px-6 py-4">working_hours</th>
                                        <th className="px-6 py-4">overtime_hours</th>
                                        <th className="px-6 py-4">overtime_rate</th>
                                        <th className="px-6 py-4">check_in_image</th>
                                        <th className="px-6 py-4">check_out_image</th>
                                        <th className="px-6 py-4">check_in_address</th>
                                        <th className="px-6 py-4">check_out_address</th>
                                        <th className="px-6 py-4">task_description</th>
                                        <th className="px-6 py-4">remarks</th>
                                        <th className="px-6 py-4">is_approved</th>
                                        <th className="px-6 py-4">is_outside_geofence</th>
                                        <th className="px-6 py-4">is_late</th>
                                        <th className="px-6 py-4">late_minutes</th>
                                        <th className="px-6 py-4">is_early_departure</th>
                                        <th className="px-6 py-4">early_minutes</th>
                                        <th className="px-6 py-4">work_location_type</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {paginatedHistory.length === 0 ? (
                                        <tr><td colSpan={27} className="px-6 py-12 text-center"><p className="text-xs text-slate-500 font-medium">{historyFilter === 'Date' && !historyDateInput ? 'Select a date to view records' : 'No records found'}</p></td></tr>
                                    ) : (
                                        paginatedHistory.map((rec, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-800">{rec.project_name ?? '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.attendance_date ?? '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.status ?? '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.in_time ? formatTime(new Date(rec.in_time)) : '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.out_time ? formatTime(new Date(rec.out_time)) : '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.working_hours ?? '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.overtime_hours ?? '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.overtime_rate ?? '-'}</span></td>
                                                <td className="px-6 py-4">
                                                    {rec.check_in_image ? (
                                                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-emerald-400">
                                                            <img src={rec.check_in_image} alt="Check In" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : <span className="text-[10px] text-slate-400">-</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {rec.check_out_image ? (
                                                        <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-rose-400">
                                                            <img src={rec.check_out_image} alt="Check Out" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : <span className="text-[10px] text-slate-400">-</span>}
                                                </td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.check_in_address ?? '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.check_out_address ?? '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.task_description ?? '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.remarks ?? '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.is_approved !== undefined ? String(rec.is_approved) : '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.is_outside_geofence !== undefined ? String(rec.is_outside_geofence) : '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.is_late !== undefined ? String(rec.is_late) : '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.late_minutes ?? '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.is_early_departure !== undefined ? String(rec.is_early_departure) : '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.early_minutes ?? '-'}</span></td>
                                                <td className="px-6 py-4"><span className="text-[10px] font-bold text-slate-600">{rec.work_location_type ?? '-'}</span></td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                toast.loading("Fetching details...", { id: "fetchDetails" });
                                                                const attendanceData = await labourService.getTodayStatus(rec.user_id);
                                                                const detailedLabour = attendanceData && attendanceData.attendance
                                                                    ? attendanceData.attendance
                                                                    : {};
                                                                    
                                                                const mappedData = {
                                                                    ...rec,
                                                                    id: rec.user_id || detailedLabour.user_id || 'U',
                                                                    name: rec.user_name || 'Worker',
                                                                    imgInUrl: detailedLabour.check_in_image || rec.check_in_image,
                                                                    imgOutUrl: detailedLabour.check_out_image || rec.check_out_image,
                                                                    status: detailedLabour.in_time && !detailedLabour.out_time ? 'Online' : 'Offline',
                                                                    workLocation: detailedLabour.check_in_address || rec.check_in_address || '-',
                                                                    contractor: '-',
                                                                    department: '-',
                                                                    checkIn: detailedLabour.in_time || rec.in_time || '-',
                                                                    checkOut: detailedLabour.out_time || rec.out_time || '-',
                                                                    hours: detailedLabour.working_hours || rec.working_hours || '-',
                                                                    attendanceStatus: detailedLabour.is_late ? 'Late' : 'On Time',
                                                                    taskDescription: detailedLabour.task_description || rec.task_description || '-',
                                                                    remarks: detailedLabour.remarks || rec.remarks || '-',
                                                                    isApproved: detailedLabour.is_approved !== undefined ? String(detailedLabour.is_approved) : (rec.is_approved !== undefined ? String(rec.is_approved) : '-'),
                                                                    isOutsideGeofence: detailedLabour.is_outside_geofence !== undefined ? String(detailedLabour.is_outside_geofence) : (rec.is_outside_geofence !== undefined ? String(rec.is_outside_geofence) : '-'),
                                                                    lateMinutes: detailedLabour.late_minutes || rec.late_minutes || '-',
                                                                    earlyMinutes: detailedLabour.early_minutes || rec.early_minutes || '-',
                                                                    projectName: rec.project_name || '-'
                                                                };
                                                                
                                                                setSelectedLabour(mappedData);
                                                                toast.dismiss("fetchDetails");
                                                                setIsViewModalOpen(true);
                                                            } catch (err) {
                                                                console.error("Failed to fetch detailed view", err);
                                                                toast.dismiss("fetchDetails");
                                                                toast.error("Failed to fetch detailed view");
                                                                setSelectedLabour(rec);
                                                                setIsViewModalOpen(true);
                                                            }
                                                        }}
                                                        className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination footer - only for Yesterday / All / Date */}
                        {historyFilter !== 'Today' && selfAttendances.length > 0 && (
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
                                    Showing {(historyPage - 1) * itemsPerPage + 1} - {Math.min(historyPage * itemsPerPage, selfAttendances.length)} of {selfAttendances.length} records
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
                                        const totalItems = selfAttendances.length;
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
                                                    className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
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
                                        onClick={() => setHistoryPage(prev => Math.min(Math.ceil(selfAttendances.length / itemsPerPage), prev + 1))}
                                        disabled={historyPage === Math.max(1, Math.ceil(selfAttendances.length / itemsPerPage)) || selfAttendances.length === 0}
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
            </PageTransition>

            {isSelfCheckInFormOpen && selectedLabour && (
                <SelfCheckInModal
                    isOpen={isSelfCheckInFormOpen}
                    onClose={() => {
                        setIsSelfCheckInFormOpen(false);
                        setSelectedLabour(null);
                    }}
                    onSuccess={() => {
                        setIsSelfCheckInFormOpen(false);
                        setSelectedLabour(null);
                    }}
                    labourId={selectedLabour.id}
                    title={`Check-In: ${selectedLabour.name || 'Labour'}`}
                />
            )}

            {isCheckOutModalOpen && selectedLabour && (
                <SelfCheckOutModal
                    isOpen={isCheckOutModalOpen}
                    onClose={() => {
                        setIsCheckOutModalOpen(false);
                        setSelectedLabour(null);
                    }}
                    onSuccess={() => {
                        setIsCheckOutModalOpen(false);
                        setSelectedLabour(null);
                    }}
                    attendanceId={selectedLabour.id}
                    labourId={selectedLabour.labour_id || selectedLabour.id}
                    title={`Check-Out: ${selectedLabour.name || 'Labour'}`}
                />
            )}

            <SelfCheckInModal
                isOpen={isSelfCheckInFormOpen}
                onClose={() => setIsSelfCheckInFormOpen(false)}
                onSuccess={(time) => {
                    setCheckInTime(time);
                    setAttendanceState("CHECKED_IN");
                }}
            />

            <SelfCheckOutModal
                isOpen={isCheckOutModalOpen}
                onClose={() => setIsCheckOutModalOpen(false)}
                onSuccess={(time) => {
                    setCheckOutTime(time);
                    setAttendanceState("CHECKED_OUT");
                }}
            />

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
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Attendance Photos</p>
                            <div className="grid grid-cols-2 gap-4">
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
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 border-b border-slate-100">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">PROJECT NAME</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.projectName}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">LABOUR ID</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.id}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">CONTRACTOR</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.contractor}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">DEPARTMENT</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.department}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">WORK LOCATION</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.workLocation}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">CHECK-IN TIME</p>
                                <p className="text-xs font-bold text-emerald-600">{selectedLabour.checkIn}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">CHECK-OUT TIME</p>
                                <p className="text-xs font-bold text-slate-500">{selectedLabour.checkOut}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">TOTAL HOURS</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.hours}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">ATTENDANCE STATUS</p>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-500 border border-emerald-100">{selectedLabour.attendanceStatus}</span>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">TASK DESCRIPTION</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.taskDescription}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">REMARKS</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.remarks}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">APPROVED?</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.isApproved}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">OUTSIDE GEOFENCE?</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.isOutsideGeofence}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">LATE MINS</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.lateMinutes}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">EARLY MINS</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.earlyMinutes}</p>
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
