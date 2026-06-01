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
    LogIn,
    LogOut,
    ArrowRight,
    Eye,
    X
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import labourService from '../../../services/labourService';
import SelfCheckInModal from './components/SelfCheckInModal';
import SelfCheckOutModal from './components/SelfCheckOutModal';

type AttendanceState = "NOT_CHECKED_IN" | "CHECKED_IN" | "CHECKED_OUT";

const LabourAttendancePage: React.FC = () => {
    const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

    // Geolocation state
    const [, setLocationAddress] = useState<string>("Fetching location...");

    // Attendance Flow State
    const [, setAttendanceState] = useState<AttendanceState>("NOT_CHECKED_IN");
    const [, setCheckInTime] = useState<Date | null>(null);
    const [, setCheckOutTime] = useState<Date | null>(null);

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

    // Location Modal State
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [selectedLocationLabour, setSelectedLocationLabour] = useState<any>(null);

    // Labour Check-In Form State
    const [isLabourCheckInFormOpen, setIsLabourCheckInFormOpen] = useState(false);


    // Labour Check-Out Form State
    const [isLabourCheckOutFormOpen, setIsLabourCheckOutFormOpen] = useState(false);


    // Self Check-Out Form State

    // Self Check-In Form State
    const [isSelfCheckInFormOpen, setIsSelfCheckInFormOpen] = useState(false);

    const [, setCoordinates] = useState({ lat: 0, lng: 0 });

    // Image Preview State
    const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);

    const navigate = useNavigate();

    // Labour Attendance Filters
    const [empSearch, setEmpSearch] = useState("");
    const [empStatusFilter, setEmpStatusFilter] = useState("All Status");
    const [empContractorFilter, setEmpContractorFilter] = useState("All Contractors");
    const [empDurationFilter, setEmpDurationFilter] = useState("Today");

    // History Quick Filter & Pagination
    const [historyFilter] = useState<"Today" | "Yesterday" | "All" | "Date">("Today");
    const [historyDateInput] = useState("");

    const [labourAttendances, setLabourAttendances] = useState<any[]>([]);

    const fetchLabourAttendances = async () => {
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
            let fromDate = "";
            let toDate = "";
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
            } else if (historyFilter === 'Date' && historyDateInput) {
                fromDate = historyDateInput;
                toDate = historyDateInput;
            }

            const data = await labourService.getAttendanceList(activeProjectId, fromDate || undefined, toDate || undefined);
            setLabourAttendances(data?.items || []);
        } catch (error) {
            console.error("Failed to fetch labour attendances", error);
        }
    };

    useEffect(() => {
        fetchLabourAttendances();
    }, [historyFilter, historyDateInput]);

    const handleExport = async () => {
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
            let fromDate = "";
            let toDate = "";
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
            } else if (historyFilter === 'Date' && historyDateInput) {
                fromDate = historyDateInput;
                toDate = historyDateInput;
            }

            const toastId = toast.loading("Generating Export...");
            const blob = await labourService.exportAttendanceExcel(activeProjectId, fromDate || undefined, toDate || undefined);
            
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Attendance_Report_${fromDate || today}_to_${toDate || today}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.dismiss(toastId);
            toast.success("Attendance report downloaded successfully!");
        } catch (error) {
            console.error("Failed to export attendance report", error);
            toast.dismiss();
            toast.error("Failed to export attendance report.");
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const handleViewDetails = async (lab: any) => {
        setIsLoadingDetails(true);
        try {
            const dateStr = lab.attendance_date;
            const details = await labourService.getLabourAttendance(lab.labour_id, dateStr, dateStr);
            if (details && details.length > 0) {
                // Merge list row data with detailed fetched data
                setSelectedLabour({ ...lab, ...details[0] });
            } else {
                setSelectedLabour(lab);
            }
            setIsViewModalOpen(true);
        } catch (err) {
            console.error("Failed to load labour attendance details", err);
            setSelectedLabour(lab);
            setIsViewModalOpen(true);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    useEffect(() => {

        captureGPS();

    }, []);

    const captureGPS = () => {
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
        if ((isCheckInModalOpen || isLabourCheckInFormOpen) && !capturedImage) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isCheckInModalOpen, isLabourCheckInFormOpen, capturedImage]);

    useEffect(() => {
        if (isLabourCheckInFormOpen) {
            captureGPS();
        }
    }, [isLabourCheckInFormOpen]);

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
        if (isLabourCheckOutFormOpen && !checkoutCapturedImage) {
            startCheckoutCamera();
        } else {
            stopCheckoutCamera();
        }
        return () => stopCheckoutCamera();
    }, [isLabourCheckOutFormOpen, checkoutCapturedImage]);

    useEffect(() => {
        if (isLabourCheckOutFormOpen) {
            captureGPS();
        }
    }, [isLabourCheckOutFormOpen]);



    // Labour View / Delete Logic



    const filteredLabourAttendances = labourAttendances.filter(lab => {
        const attendanceStatus = "On Time"; // Calculate later if needed
        const contractor = lab.contractor || "-";
        if (empStatusFilter !== "All Status" && attendanceStatus !== empStatusFilter) return false;
        if (empContractorFilter !== "All Contractors" && contractor !== empContractorFilter) return false;
        if (empSearch) {
            const searchLower = empSearch.toLowerCase();
            const name = lab.labour_name || "";
            const id = lab.worker_code || "";
            return name.toLowerCase().includes(searchLower) || id.toLowerCase().includes(searchLower);
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
                    <button 
                        onClick={handleExport}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center justify-center w-full">
                    <div className="inline-flex bg-white rounded-full p-1 border border-slate-200 shadow-sm overflow-x-auto max-w-full">
                        <button
                            onClick={() => navigate('/engineer/labor/attendance')}
                            className="px-8 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all text-slate-600 hover:bg-slate-50"
                        >
                            Self Attendance
                        </button>
                        <button
                            onClick={() => navigate('/engineer/labor/labour-attendance')}
                            className="px-8 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all bg-indigo-500 text-white shadow-sm"
                        >
                            Labour Attendance
                        </button>
                    </div>
                </div>

                {/* Self Attendance Content */}

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
                                    <th className="px-6 py-4">Contractor Name</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Online Status</th>
                                    <th className="px-6 py-4 text-center">Check In</th>
                                    <th className="px-6 py-4 text-center">Check Out</th>
                                    <th className="px-6 py-4 text-center">Hours</th>
                                    <th className="px-6 py-4">Location</th>

                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Work Summary</th>
                                    <th className="px-6 py-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLabourAttendances.length === 0 ? (
                                    <tr>
                                        <td colSpan={11} className="px-6 py-12 text-center">
                                            <p className="text-xs text-slate-500 font-medium">No attendance records found</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLabourAttendances.map((lab, index) => (
                                    <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">{lab.attendance_date || "-"}</span><br/><span className="text-[10px] text-slate-500 font-bold">{lab.labour_name} ({lab.worker_code})</span></td>
                                        <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">{lab.contractor_name || lab.contractor || "-"}</span></td>
                                        <td className="px-6 py-4"><span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">{lab.department_name || lab.department || "-"}</span></td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                {lab.status === "present" && !lab.out_time ? (
                                                    <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1 mb-1">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Online
                                                    </span>
                                                ) : lab.status === "absent" || !lab.in_time ? (
                                                    <span className="text-[10px] font-bold text-slate-400 mb-1">Not Checked In</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-slate-600 mb-1">Checked Out</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1.5">
                                                {lab.in_time && lab.check_in_image ? (
                                                    <div
                                                        className="w-8 h-8 rounded-full border-2 border-emerald-400 overflow-hidden bg-emerald-50 cursor-pointer hover:scale-110 transition-transform shadow-sm"
                                                        onClick={() => setPreviewImage({ url: lab.check_in_image, title: "Check-In Image - " + lab.labour_name })}
                                                    >
                                                        <img src={lab.check_in_image} alt="Check-In" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Camera className="w-3 h-3" /></div>
                                                )}
                                                <span className={`text-[10px] font-bold ${lab.in_time ? 'text-emerald-600' : 'text-slate-400'} flex items-center gap-1 justify-center`}><LogIn className="w-3 h-3" /> {lab.in_time || "-"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1.5">
                                                {lab.out_time && lab.check_out_image ? (
                                                    <div
                                                        className="w-8 h-8 rounded-full border-2 border-rose-400 overflow-hidden bg-rose-50 cursor-pointer hover:scale-110 transition-transform shadow-sm"
                                                        onClick={() => setPreviewImage({ url: lab.check_out_image, title: "Check-Out Image - " + lab.labour_name })}
                                                    >
                                                        <img src={lab.check_out_image} alt="Check-Out" className="w-full h-full object-cover" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Camera className="w-3 h-3" /></div>
                                                )}
                                                <span className={`text-[10px] font-bold ${lab.out_time ? 'text-rose-600' : 'text-slate-400'} flex items-center gap-1 justify-center`}><LogOut className="w-3 h-3" /> {lab.out_time || "-"}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center"><span className="text-xs font-bold text-slate-800">{lab.working_hours ? `${lab.working_hours} hrs` : "-"}</span></td>
                                        <td className="px-6 py-4">
                                            <span
                                                className="text-[10px] font-bold text-blue-500 flex items-center gap-1 cursor-pointer hover:underline"
                                                onClick={() => {
                                                    setSelectedLocationLabour(lab);
                                                    setIsLocationModalOpen(true);
                                                }}
                                            >
                                                <MapPin className="w-3 h-3" /> View
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 bg-slate-50 text-slate-500 border border-slate-200 rounded-full text-[9px] font-bold uppercase`}>{lab.status || "-"}</span></td>
                                        <td className="px-6 py-4 text-center text-xs text-slate-400 font-bold">-</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                {!lab.in_time ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedLabour(lab);
                                                            setIsLabourCheckInFormOpen(true);
                                                        }}
                                                        className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-100 active:scale-95 flex items-center justify-center font-inter"
                                                        title="Check In"
                                                    >
                                                        <LogIn className="w-4 h-4" />
                                                    </button>
                                                ) : !lab.out_time ? (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedLabour(lab);
                                                            setIsLabourCheckOutFormOpen(true);
                                                        }}
                                                        className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-100 active:scale-95 flex items-center justify-center font-inter"
                                                        title="Check Out"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                    </button>
                                                ) : null}
                                                <button
                                                    onClick={() => handleViewDetails(lab)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                    title="View Details"
                                                    disabled={isLoadingDetails}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => navigate(`/engineer/labor/${lab.labour_id}`)}
                                                    className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                                                    title="View Full Detail"
                                                >
                                                    View Detail <ArrowRight className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            {isLabourCheckInFormOpen && selectedLabour && (
                <SelfCheckInModal
                    isOpen={isLabourCheckInFormOpen}
                    onClose={() => {
                        setIsLabourCheckInFormOpen(false);
                        setSelectedLabour(null);
                    }}
                    onSuccess={() => {
                        setIsLabourCheckInFormOpen(false);
                        setSelectedLabour(null);
                    }}
                    labourId={selectedLabour.id}
                    title={`Check-In: ${selectedLabour.name || 'Labour'}`}
                />
            )}

            {isLabourCheckOutFormOpen && selectedLabour && (
                <SelfCheckOutModal
                    isOpen={isLabourCheckOutFormOpen}
                    onClose={() => {
                        setIsLabourCheckOutFormOpen(false);
                        setSelectedLabour(null);
                    }}
                    onSuccess={() => {
                        setIsLabourCheckOutFormOpen(false);
                        setSelectedLabour(null);
                    }}
                    attendanceId={selectedLabour.id}
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
                                    {selectedLabour.check_in_image ? (
                                        <img src={selectedLabour.check_in_image} alt={selectedLabour.labour_name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-xl">{selectedLabour.labour_name?.charAt(0)}</div>
                                    )}
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-primary z-20 ${selectedLabour.status === 'present' && !selectedLabour.out_time ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black tracking-tight truncate">{selectedLabour.labour_name} ({selectedLabour.worker_code})</h3>
                                    <p className="text-white/70 text-xs font-medium mt-1">-</p>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid - matching list columns */}
                        <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4 border-b border-slate-100">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.attendance_date || '-'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contractor Name</p>
                                <p className="text-xs font-bold text-slate-800">-</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</p>
                                <p className="text-xs font-bold text-slate-800">-</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Online Status</p>
                                <div className="flex items-center gap-1.5">
                                    <div className={`w-2 h-2 rounded-full ${selectedLabour.status === 'present' && !selectedLabour.out_time ? 'bg-emerald-500' : selectedLabour.status === 'absent' || !selectedLabour.in_time ? 'bg-amber-400' : 'bg-slate-400'}`} />
                                    <span className="text-xs font-bold text-slate-800">{selectedLabour.status === 'present' && !selectedLabour.out_time ? 'Online' : selectedLabour.status === 'absent' || !selectedLabour.in_time ? 'Not Checked In' : 'Checked Out'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Check In / Check Out with Images */}
                        <div className="px-6 py-5 border-b border-slate-100">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check In</p>
                                    {selectedLabour.in_time && selectedLabour.check_in_image ? (
                                        <div
                                            className="w-12 h-12 rounded-full border-2 border-emerald-400 overflow-hidden bg-emerald-50 cursor-pointer hover:scale-110 transition-transform shadow-sm"
                                            onClick={() => setPreviewImage({ url: selectedLabour.check_in_image, title: "Check-In Image - " + selectedLabour.labour_name })}
                                        >
                                            <img src={selectedLabour.check_in_image} alt="Check-In" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Camera className="w-4 h-4" /></div>
                                    )}
                                    <span className={`text-xs font-bold ${selectedLabour.in_time ? 'text-emerald-600' : 'text-slate-400'} flex items-center gap-1`}><LogIn className="w-3 h-3" /> {selectedLabour.in_time || '-'}</span>
                                </div>
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check Out</p>
                                    {selectedLabour.out_time && selectedLabour.check_out_image ? (
                                        <div
                                            className="w-12 h-12 rounded-full border-2 border-rose-400 overflow-hidden bg-rose-50 cursor-pointer hover:scale-110 transition-transform shadow-sm"
                                            onClick={() => setPreviewImage({ url: selectedLabour.check_out_image, title: "Check-Out Image - " + selectedLabour.labour_name })}
                                        >
                                            <img src={selectedLabour.check_out_image} alt="Check-Out" className="w-full h-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Camera className="w-4 h-4" /></div>
                                    )}
                                    <span className={`text-xs font-bold ${selectedLabour.out_time ? 'text-rose-600' : 'text-slate-400'} flex items-center gap-1`}><LogOut className="w-3 h-3" /> {selectedLabour.out_time || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Remaining Details */}
                        <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4 border-b border-slate-100">
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Working Hours</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.working_hours ? `${selectedLabour.working_hours} hrs` : '-'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Overtime</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.overtime_hours ? `${selectedLabour.overtime_hours} hrs` : '-'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Wage</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.total_wage ? `₹${selectedLabour.total_wage}` : '-'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Check-in Location</p>
                                <p className="text-xs font-bold text-blue-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> {selectedLabour.check_in_address || '-'}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-50 text-slate-500 border border-slate-200 uppercase`}>
                                    {selectedLabour.status || '-'}
                                </span>
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Work Summary</p>
                                <p className="text-xs font-bold text-slate-800">{selectedLabour.task_description || '-'}</p>
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

            {/* Location Details Modal */}
            <Modal
                isOpen={isLocationModalOpen}
                onClose={() => setIsLocationModalOpen(false)}
                title=""
                hideHeader={true}
                maxWidth="max-w-[420px]"
            >
                {selectedLocationLabour && (
                    <div className="flex flex-col h-full bg-[#f9f9fa] -m-6 pb-6 rounded-b-3xl">
                        {/* Header */}
                        <div className="bg-[#c8edf9] p-5 pb-6 rounded-t-3xl relative">
                            <button
                                onClick={() => setIsLocationModalOpen(false)}
                                className="absolute top-5 right-5 text-[#3b4754] hover:text-black transition-colors"
                            >
                                <X className="w-5 h-5 stroke-[2]" />
                            </button>
                            <div className="flex items-center gap-2 mb-2">
                                <MapPin className="w-5 h-5 text-[#1456ff] stroke-[2]" />
                                <h2 className="text-[17px] font-bold text-[#0f172a] font-inter tracking-tight">Location Details</h2>
                            </div>
                            <p className="text-[13px] font-medium text-[#475569]">Check-in and check-out location information</p>
                        </div>

                        {/* Body */}
                        <div className="p-6 flex flex-col gap-6">
                            {/* Check-in */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-2.5">
                                    <div className="w-[10px] h-[10px] rounded-full bg-[#10b981]"></div>
                                    <span className="text-[15px] font-bold text-[#334155]">Check-in Location</span>
                                </div>
                                <div className="bg-[#f0fdf4] border border-[#dcfce7] rounded-xl p-4 flex gap-3 shadow-sm">
                                    <MapPin className="w-[18px] h-[18px] text-[#059669] flex-shrink-0 mt-[1px] stroke-[2]" />
                                    <p className="text-[14px] font-semibold text-[#047857] leading-[1.6]">
                                        Raver, Jalgaon District, Maharashtra, 425508, India (21.233377, 76.041908)
                                    </p>
                                </div>
                            </div>

                            {/* Check-out */}
                            <div>
                                <div className="flex items-center gap-2.5 mb-2.5">
                                    <div className="w-[10px] h-[10px] rounded-full bg-[#f43f5e]"></div>
                                    <span className="text-[15px] font-bold text-[#334155]">Check-out Location</span>
                                </div>
                                <div className="bg-[#fff1f2] border border-[#ffe4e6] rounded-xl p-4 flex gap-3 shadow-sm">
                                    <MapPin className="w-[18px] h-[18px] text-[#e11d48] flex-shrink-0 mt-[1px] stroke-[2]" />
                                    <p className="text-[14px] font-semibold text-[#be123c] leading-[1.6]">
                                        Raver, Jalgaon District, Maharashtra, 425508, India (21.233375, 76.041903)
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 flex justify-end mt-2">
                            <button
                                onClick={() => setIsLocationModalOpen(false)}
                                className="px-7 py-2.5 bg-white border border-[#e2e8f0] text-[#1e293b] rounded-xl text-[14px] font-bold shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:bg-[#f8fafc] hover:shadow-[0_4px_6px_rgba(0,0,0,0.04)] transition-all active:scale-95"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

        </>
    );
};

export default LabourAttendancePage;
