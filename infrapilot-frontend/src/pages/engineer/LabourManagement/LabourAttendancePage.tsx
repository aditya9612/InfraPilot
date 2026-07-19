import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import Modal from '../../../components/common/Modal';
import {
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
    X,
    User,
    Users,
    UserCheck,
    Building2,
    FileSpreadsheet
} from "lucide-react";
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import labourService from '../../../services/labourService';
import SelfCheckInModal from './components/SelfCheckInModal';
import BulkCheckInModal from '../../../components/attendance/BulkCheckInModal';
import SelfCheckOutModal from './components/SelfCheckOutModal';
import BulkCheckOutModal from '../../../components/attendance/BulkCheckOutModal';
import { useProject } from '../../../context/ProjectContext';

const LOCAL_CONTRACTOR_MAP: Record<number, string> = {
    1: "string",
    14: "Shree Constructions",
    24: "Sai Infra93",
    31: "Krushnakant",
    32: "Sai Infra",
    33: "Shree Constructions",
    34: "Ashin Ramdas Kolhe",
    38: "Sai Infras",
    39: "sham Pandit sp",
    40: "string"
};

// Removed AttendanceState
export const calculateRunningHours = (inTimeStr: string) => {
    if (!inTimeStr || inTimeStr === "--:--") return null;
    try {
        let inDate: Date;
        if (inTimeStr.includes('T') || inTimeStr.includes('-')) {
            inDate = new Date(inTimeStr);
        } else {
            const match = inTimeStr.match(/(\d+):(\d+)(?::(\d+))?\s*(AM|PM)?/i);
            if (match) {
                let [, h, m, s, ampm] = match;
                let hours = parseInt(h);
                if (ampm) {
                    if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
                    if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
                }
                const now = new Date();
                inDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, parseInt(m), s ? parseInt(s) : 0);
            } else {
                return null;
            }
        }
        if (isNaN(inDate.getTime())) return null;
        const diffMs = Date.now() - inDate.getTime();
        if (diffMs < 0) return "0.0";
        return (diffMs / (1000 * 60 * 60)).toFixed(1);
    } catch {
        return null;
    }
};

export const calculateTotalHours = (inTime: string | null | undefined, outTime: string | null | undefined) => {
    if (!inTime || inTime === "--:--" || !outTime || outTime === "--:--") return null;
    try {
        const parseTime = (timeStr: string) => {
            if (timeStr.includes('T')) {
                const d = new Date(timeStr);
                return d.getHours() + d.getMinutes() / 60;
            }
            const parts = timeStr.split(' ');
            const time = parts[0];
            const modifier = parts.length > 1 ? parts[1] : '';
            let [hours, minutes] = time.split(':').map(Number);
            if (modifier === 'PM' && hours < 12) hours += 12;
            if (modifier === 'AM' && hours === 12) hours = 0;
            return hours + (minutes || 0) / 60;
        };
        const inHrs = parseTime(inTime);
        const outHrs = parseTime(outTime);
        let diff = outHrs - inHrs;
        if (diff < 0) diff += 24;
        return diff.toFixed(1).replace(/\.0$/, '');
    } catch {
        return null;
    }
};

const LabourAttendancePage: React.FC = () => {
    const { selectedProject, selectedProjectId: contextProjectId } = useProject();
    const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

    // Geolocation state (removed unused locationAddress)

    // Attendance Flow State (removed unused attendanceState, checkInTime, checkOutTime)

    // Modals State
    const [isCheckInModalOpen] = useState(false);
    const [isBulkCheckInOpen, setIsBulkCheckInOpen] = useState(false);
    const [isBulkCheckOutOpen, setIsBulkCheckOutOpen] = useState(false);
    const [checkInUserIds, setCheckInUserIds] = useState<number[]>([]);
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

    // Image Preview State
    const [previewImage, setPreviewImage] = useState<{ url: string, title: string } | null>(null);

    const navigate = useNavigate();

    // Labour Attendance Filters
    const [empSearch, setEmpSearch] = useState("");
    const [empStatusFilter, setEmpStatusFilter] = useState("All Status");

    const [empDurationFilter, setEmpDurationFilter] = useState("Today");

    // History Quick Filter & Pagination
    const [isExporting, setIsExporting] = useState(false);



    // ─── Export Filter Modal State ────────────────────────────────────────────
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFromDate, setExportFromDate] = useState("");
    const [exportToDate, setExportToDate] = useState("");
    // ─────────────────────────────────────────────────────────────────────────

    const [labourAttendances, setLabourAttendances] = useState<any[]>([]);
    const [selectedLabourIds, setSelectedLabourIds] = useState<any[]>([]);
    const [dashboardStats, setDashboardStats] = useState({ total_labour: 0, present: 0 });
    const [contractorMap] = useState<Record<number, string>>(LOCAL_CONTRACTOR_MAP);

    const getActiveProjectId = () => {
        return contextProjectId || 0;
    };

    const getActiveProjectName = () => {
        if (selectedProject?.project_name) return selectedProject.project_name;
        return `Project #${getActiveProjectId()}`;
    };

    const fetchLabourAttendances = async () => {
        try {
            const activeProjectId = getActiveProjectId();
            let fromDate = "";
            let toDate = "";
            const today = new Date().toISOString().split('T')[0];

            if (empDurationFilter === 'Today') {
                fromDate = today;
                toDate = today;
            } else if (empDurationFilter === 'Current Month') {
                const date = new Date();
                fromDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                toDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            } else if (empDurationFilter === 'Last Month') {
                const date = new Date();
                fromDate = new Date(date.getFullYear(), date.getMonth() - 1, 1).toISOString().split('T')[0];
                toDate = new Date(date.getFullYear(), date.getMonth(), 0).toISOString().split('T')[0];
            } else {
                fromDate = today;
                toDate = today;
            }

            // 0. Fetch Dashboard Stats
            try {
                const stats = await labourService.getAttendanceDashboard(activeProjectId, fromDate || undefined, toDate || undefined);
                if (stats) setDashboardStats({ total_labour: stats.total_labour || 0, present: stats.present || 0 });
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            }

            // 1. Fetch ALL labourers for this project
            let allLabourers: any[] = [];
            try {
                const labRes = await labourService.getLabours(activeProjectId, { limit: 50 });
                allLabourers = labRes.items || (labRes as any).data || [];

                // Add local ones
                const localKey = `created_labourers_${activeProjectId}`;
                const localSaved = localStorage.getItem(localKey);
                if (localSaved) {
                    const localItems = JSON.parse(localSaved);
                    const existingIds = new Set(allLabourers.map((l: any) => l.id));
                    localItems.forEach((l: any) => {
                        if (!existingIds.has(l.id)) {
                            allLabourers.unshift(l);
                        }
                    });
                }

                // Filter out deleted
                const deletedKey = `deleted_labourers_ids_${activeProjectId}`;
                const deletedSaved = localStorage.getItem(deletedKey);
                const deletedIds = new Set(deletedSaved ? JSON.parse(deletedSaved) : []);
                allLabourers = allLabourers.filter((l: any) => !deletedIds.has(l.id));

            } catch (err) {
                console.error("Failed to fetch labourers list for attendance", err);
            }

            // 2. Fetch Attendances
            const data = await labourService.getAttendanceList(activeProjectId, fromDate || undefined, toDate || undefined);
            const attendances = data.items || (data as any).data || [];

            // 3. Map Labourers to Attendances
            const enrichedAttendances = allLabourers.map((lab: any) => {
                const att = attendances.find((a: any) => Number(a.labour_id) === Number(lab.id));
                const resolvedContractorName = lab.contractor_name ||
                    contractorMap[Number(lab.contractor_id)] ||
                    (lab.contractor_id ? `CONT-0${lab.contractor_id}` : "-");
                if (att) {
                    return {
                        ...lab,
                        ...att,
                        labour_name: lab.labour_name || att.labour_name,
                        contractor_name: resolvedContractorName
                    };
                } else {
                    return {
                        ...lab,
                        labour_id: lab.id,
                        attendance_date: fromDate || today,
                        status: 'absent',
                        in_time: null,
                        out_time: null,
                        contractor_name: resolvedContractorName,
                        department: lab.skill_type || "-",
                    };
                }
            });

            // Also add any attendances that don't match a local labourer (just in case)
            attendances.forEach((att: any) => {
                if (!enrichedAttendances.find((e: any) => Number(e.labour_id) === Number(att.labour_id))) {
                    enrichedAttendances.push(att);
                }
            });

            setLabourAttendances(enrichedAttendances);
        } catch (error) {
            console.error("Failed to fetch labour attendances", error);
        }
    };

    useEffect(() => {
        fetchLabourAttendances();
    }, [empDurationFilter]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const activeProjectId = getActiveProjectId();
            const today = new Date().toISOString().split('T')[0];
            const fromDate = exportFromDate || today;
            const toDate = exportToDate || today;

            const toastId = toast.loading("Generating Export...");
            const blob = await labourService.exportAttendanceExcel(activeProjectId, fromDate, toDate);

            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Attendance_Report_${fromDate}_to_${toDate}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.dismiss(toastId);
            toast.success("Attendance report downloaded successfully!");
            setIsExportModalOpen(false);
        } catch (error) {
            console.error("Failed to export attendance report", error);
            toast.dismiss();
            toast.error("Failed to export attendance report.");
        } finally {
            setIsExporting(false);
        }
    };


    useEffect(() => {
        const timer = setInterval(() => setCurrentDateTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);





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
        // GPS removed
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
        // GPS removed
    }, [isLabourCheckInFormOpen]);



    // Labour View / Delete Logic



    const filteredLabourAttendances = labourAttendances.filter(lab => {
        // Date-based filtering: ensure records match the selected duration
        const today = new Date().toISOString().split('T')[0];
        if (empDurationFilter === 'Today') {
            if (lab.attendance_date && lab.attendance_date !== today) return false;
        } else if (empDurationFilter === 'Current Month') {
            const date = new Date();
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            if (lab.attendance_date && (lab.attendance_date < monthStart || lab.attendance_date > monthEnd)) return false;
        }

        // Text search
        if (empSearch) {
            const searchLower = empSearch.toLowerCase();
            return (lab.labour_name && lab.labour_name.toLowerCase().includes(searchLower)) ||
                (lab.worker_code && lab.worker_code.toLowerCase().includes(searchLower));
        }
        return true;
    });

    const selectedLabours = filteredLabourAttendances.filter(lab => selectedLabourIds.includes(lab.id || lab.labour_id));
    const allCheckedOut = selectedLabours.length > 0 && selectedLabours.every(lab => lab.in_time && lab.in_time !== "--:--" && lab.out_time && lab.out_time !== "--:--");
    const hasUncheckedIn = selectedLabours.length > 0 && selectedLabours.some(lab => !lab.in_time || lab.in_time === "--:--");
    const isCheckInEnabled = selectedLabourIds.length > 0 && (hasUncheckedIn || allCheckedOut);
    const isCheckOutEnabled = selectedLabourIds.length > 0 && !hasUncheckedIn && !allCheckedOut;

    return (
        <>
            <Navbar title="Attendance Management" breadcrumb={["Engineer", "Human Resources", "Attendance Management"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col gap-6">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Attendance Management</h1>
                        <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm font-inter">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{formatDate(currentDateTime)} | {formatTime(currentDateTime)}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 font-inter">
                        <button
                            disabled={!isCheckInEnabled}
                            onClick={() => {
                                setCheckInUserIds(selectedLabourIds);
                                setIsBulkCheckInOpen(true);
                            }}
                            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 font-inter w-fit ${isCheckInEnabled ? 'bg-primary text-white hover:bg-primary/90' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70'}`}
                        >
                            <LogIn className="w-4 h-4" />
                            Bulk Checkin {selectedLabourIds.length > 0 && `(${selectedLabourIds.length})`}
                        </button>
                        <button
                            disabled={!isCheckOutEnabled}
                            onClick={() => {
                                setIsBulkCheckOutOpen(true);
                            }}
                            className={`flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 font-inter w-fit ${isCheckOutEnabled ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-70'}`}
                        >
                            <LogOut className="w-4 h-4" />
                            Bulk Checkout {selectedLabourIds.length > 0 && `(${selectedLabourIds.length})`}
                        </button>
                        <button
                            onClick={() => {
                                // Pre-fill with current duration filter dates
                                const today = new Date().toISOString().split('T')[0];
                                if (empDurationFilter === 'Today') {
                                    setExportFromDate(today);
                                    setExportToDate(today);
                                } else if (empDurationFilter === 'Current Month') {
                                    const d = new Date();
                                    setExportFromDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
                                    setExportToDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
                                } else if (empDurationFilter === 'Last Month') {
                                    const d = new Date();
                                    setExportFromDate(new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split('T')[0]);
                                    setExportToDate(new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split('T')[0]);
                                } else {
                                    setExportFromDate(today);
                                    setExportToDate(today);
                                }
                                setIsExportModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 px-6 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-100 transition-all active:scale-95 font-inter w-fit">
                            <Download className="w-4 h-4" />
                            Export Report
                        </button>
                    </div>
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

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-2">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Labour</p>
                            <h3 className="text-2xl font-black text-slate-800">{dashboardStats.total_labour}</h3>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                            <UserCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Present Today</p>
                            <h3 className="text-2xl font-black text-slate-800">{dashboardStats.present}</h3>
                        </div>
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
                                    <th className="px-6 py-4 w-12">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                                            checked={
                                                (() => {
                                                    const available = filteredLabourAttendances.filter((lab: any) => !(lab.in_time && lab.in_time !== "--:--" && lab.out_time && lab.out_time !== "--:--"));
                                                    return available.length > 0 && selectedLabourIds.length === available.length;
                                                })()
                                            }
                                            onChange={e => {
                                                if (e.target.checked) {
                                                    const available = filteredLabourAttendances.filter((lab: any) => !(lab.in_time && lab.in_time !== "--:--" && lab.out_time && lab.out_time !== "--:--"));
                                                    setSelectedLabourIds(available.map((lab: any) => lab.id || lab.labour_id));
                                                } else {
                                                    setSelectedLabourIds([]);
                                                }
                                            }}
                                        />
                                    </th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Labour Name</th>
                                    <th className="px-6 py-4">Contractor Name</th>
                                    <th className="px-6 py-4">Department</th>
                                    <th className="px-6 py-4">Online Status</th>
                                    <th className="px-6 py-4 text-center">Check In</th>
                                    <th className="px-6 py-4 text-center">Check Out</th>
                                    <th className="px-6 py-4 text-center">Hours</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Status</th>
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
                                        <tr key={index} className={`hover:bg-slate-50/50 transition-colors ${selectedLabourIds.includes(lab.id || lab.labour_id) ? 'bg-primary/5' : ''}`}>
                                            <td className="px-6 py-4 w-12">
                                                {!(lab.in_time && lab.in_time !== "--:--" && lab.out_time && lab.out_time !== "--:--") && (
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                                                        checked={selectedLabourIds.includes(lab.id || lab.labour_id)}
                                                        onChange={() => {
                                                            const id = lab.id || lab.labour_id;
                                                            setSelectedLabourIds(prev =>
                                                                prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
                                                            );
                                                        }}
                                                    />
                                                )}
                                            </td>
                                            <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">{lab.attendance_date || "N/A"}</span></td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                                        {lab.labour_name ? lab.labour_name.charAt(0).toUpperCase() : 'U'}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]" title={lab.labour_name}>{lab.labour_name || "Unknown"}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">{lab.contractor_name || "-"}</span></td>
                                            <td className="px-6 py-4"><span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">{lab.department || "-"}</span></td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center">
                                                    {lab.in_time && lab.in_time !== "--:--" && (!lab.out_time || lab.out_time === "--:--") ? (
                                                        <span className="text-[10px] font-bold text-slate-800 flex items-center gap-1 mb-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Online
                                                        </span>
                                                    ) : (!lab.in_time || lab.in_time === "--:--") ? (
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
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex flex-col items-center gap-0.5">
                                                    {lab.in_time && lab.in_time !== "--:--" ? (
                                                        <>
                                                            <span className="text-xs font-bold text-slate-800" title="Assigned / Total Time">
                                                                {(() => {
                                                                    const calc = calculateTotalHours(lab.in_time, lab.out_time);
                                                                    if (calc) return `${calc}/8 hr`;
                                                                    if (lab.working_hours) return `${lab.working_hours}/8 hr`;
                                                                    return '0/8 hr';
                                                                })()}
                                                            </span>
                                                            {(!lab.out_time || lab.out_time === "--:--") && calculateRunningHours(lab.in_time) && (
                                                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider bg-emerald-50 px-1.5 py-0.5 rounded-sm" title="Running Time">
                                                                    {calculateRunningHours(lab.in_time)} hr
                                                                </span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-xs font-bold text-slate-800">-</span>
                                                    )}
                                                </div>
                                            </td>
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
                                            <td className="px-6 py-4 text-center"><span className={`px-2 py-0.5 ${lab.status === 'absent' ? 'bg-rose-50 text-rose-500 border-rose-200' : 'bg-emerald-50 text-emerald-500 border-emerald-200'} border rounded-full text-[9px] font-bold uppercase tracking-widest`}>{lab.status || "present"}</span></td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    {/* Removed Check In and Check Out buttons as requested */}
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                toast.loading("Fetching details...", { id: "fetchDetails" });
                                                                const attendanceData = await labourService.getTodayStatus(lab.labour_id);
                                                                const detailedLabour = attendanceData && attendanceData.attendance
                                                                    ? attendanceData.attendance
                                                                    : {};
                                                                setSelectedLabour({ ...lab, ...detailedLabour, rawAttendance: attendanceData || {} });
                                                                toast.dismiss("fetchDetails");
                                                                setIsViewModalOpen(true);
                                                            } catch (err) {
                                                                console.error("Failed to fetch detailed view", err);
                                                                toast.dismiss("fetchDetails");
                                                                toast.error("Failed to fetch detailed view");
                                                                setSelectedLabour(lab);
                                                                setIsViewModalOpen(true);
                                                            }
                                                        }}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                        title="View Details"
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
                    labourId={selectedLabour.id || (selectedLabour as any).labour_id}
                    onSuccess={() => {
                        setIsLabourCheckInFormOpen(false);
                        setSelectedLabour(null);
                        fetchLabourAttendances();
                    }}
                    title="Check In"
                />
            )}

            <BulkCheckInModal
                isOpen={isBulkCheckInOpen}
                onClose={() => setIsBulkCheckInOpen(false)}
                onSuccess={() => {
                    fetchLabourAttendances();
                    setSelectedLabourIds([]);
                }}
                initialSelectedUserIds={checkInUserIds}
                initialProjectId={getActiveProjectId()}
                alreadyCheckedInIds={labourAttendances.filter(l => l.in_time && l.in_time !== "--:--").map(l => l.id || l.labour_id)}
            />

            <BulkCheckOutModal
                isOpen={isBulkCheckOutOpen}
                onClose={() => setIsBulkCheckOutOpen(false)}
                onSuccess={() => {
                    fetchLabourAttendances();
                    setSelectedLabourIds([]);
                }}
                initialSelectedUserIds={selectedLabourIds}
                initialProjectId={getActiveProjectId()}
                eligibleForCheckOutIds={labourAttendances.filter(l => l.in_time && l.in_time !== "--:--" && (!l.out_time || l.out_time === "--:--")).map(l => l.id || l.labour_id)}
                selectedLaboursContext={filteredLabourAttendances}
            />

            {isLabourCheckOutFormOpen && selectedLabour && (
                <SelfCheckOutModal
                    isOpen={isLabourCheckOutFormOpen}
                    onClose={() => {
                        setIsLabourCheckOutFormOpen(false);
                        setSelectedLabour(null);
                    }}
                    labourId={selectedLabour.id || (selectedLabour as any).labour_id}
                    onSuccess={() => {
                        setIsLabourCheckOutFormOpen(false);
                        setSelectedLabour(null);
                        fetchLabourAttendances();
                    }}
                />
            )}

            <SelfCheckInModal
                isOpen={isSelfCheckInFormOpen}
                onClose={() => setIsSelfCheckInFormOpen(false)}
                labourId={selectedLabour?.id || (selectedLabour as any)?.labour_id}
                onSuccess={() => {
                    setIsSelfCheckInFormOpen(false);
                    fetchLabourAttendances();
                }}
            />

            <SelfCheckOutModal
                isOpen={isCheckOutModalOpen}
                onClose={() => setIsCheckOutModalOpen(false)}
                labourId={selectedLabour?.id || (selectedLabour as any)?.labour_id}
                onSuccess={() => {
                    setIsCheckOutModalOpen(false);
                    fetchLabourAttendances();
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
                                        <div className="w-full h-full bg-slate-300 flex items-center justify-center"><User className="w-6 h-6 text-slate-400" /></div>
                                    )}
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-primary z-20 ${selectedLabour.in_time && !selectedLabour.out_time ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-xl font-black tracking-tight truncate">{selectedLabour.labour_name || "Unknown Worker"}</h3>
                                    <p className="text-white/70 text-xs font-medium mt-1">{selectedLabour.department || "-"}</p>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid - exact API response structure */}
                        <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4 border-b border-slate-100">
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">checked_in</p><p className="text-xs font-bold text-slate-800">{String(selectedLabour.rawAttendance?.checked_in ?? '-')}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">checked_out</p><p className="text-xs font-bold text-slate-800">{String(selectedLabour.rawAttendance?.checked_out ?? '-')}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">running_hours</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.running_hours ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">date</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.date ?? '-'}</p></div>
                            <div className="col-span-2 mt-2 mb-1"><h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200 pb-1">Attendance Details</h4></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">user_name</p><p className="text-xs font-bold text-slate-800">{selectedLabour.labour_name || "Unknown Worker"}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">project_name</p><p className="text-xs font-bold text-slate-800">{selectedLabour.project_name || "-"}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">attendance_date</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.attendance_date ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">status</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.status ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">in_time</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.in_time ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">out_time</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.out_time ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">working_hours</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.working_hours ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">overtime_hours</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.overtime_hours ?? '-'}</p></div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">check_in_image</p>
                                {selectedLabour.rawAttendance?.attendance?.check_in_image ? (
                                    <img src={selectedLabour.rawAttendance.attendance.check_in_image} alt="Check In" className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm" />
                                ) : (
                                    <p className="text-xs font-bold text-slate-800">-</p>
                                )}
                            </div>
                            <div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">check_out_image</p>
                                {selectedLabour.rawAttendance?.attendance?.check_out_image ? (
                                    <img src={selectedLabour.rawAttendance.attendance.check_out_image} alt="Check Out" className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm" />
                                ) : (
                                    <p className="text-xs font-bold text-slate-800">-</p>
                                )}
                            </div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">check_in_address</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.check_in_address ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">check_out_address</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.check_out_address ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">task_description</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.task_description ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">remarks</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.remarks ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">work_location_type</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.work_location_type ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">is_approved</p><p className="text-xs font-bold text-slate-800">{String(selectedLabour.rawAttendance?.attendance?.is_approved ?? '-')}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">is_outside_geofence</p><p className="text-xs font-bold text-slate-800">{String(selectedLabour.rawAttendance?.attendance?.is_outside_geofence ?? '-')}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">is_late</p><p className="text-xs font-bold text-slate-800">{String(selectedLabour.rawAttendance?.attendance?.is_late ?? '-')}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">late_minutes</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.late_minutes ?? '-'}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">is_early_departure</p><p className="text-xs font-bold text-slate-800">{String(selectedLabour.rawAttendance?.attendance?.is_early_departure ?? '-')}</p></div>
                            <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">early_minutes</p><p className="text-xs font-bold text-slate-800">{selectedLabour.rawAttendance?.attendance?.early_minutes ?? '-'}</p></div>
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
                                        {selectedLocationLabour?.check_in_address || '-'}
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
                                        {selectedLocationLabour?.check_out_address || '-'}
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

            {/* ── Export Filter Modal ─────────────────────────────────────────── */}
            {isExportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Export Attendance Report</h2>
                                <p className="text-xs text-slate-400 mt-0.5">Select date range to download Excel (all fields required)</p>
                            </div>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Project Name Display (read-only) */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    Project
                                </label>
                                <div className="flex items-center gap-3 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <Building2 className="w-4 h-4 text-blue-500 shrink-0" />
                                    <span className="text-sm font-bold text-blue-800 truncate">
                                        {getActiveProjectName()}
                                    </span>
                                </div>
                            </div>
                            {/* From Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    From Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={exportFromDate}
                                    onChange={e => setExportFromDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            {/* To Date */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                                    To Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={exportToDate}
                                    onChange={e => setExportToDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-300 transition-all"
                                />
                            </div>
                            {/* Preview summary */}
                            {exportFromDate && exportToDate && (
                                <div className="flex items-start gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                    <p className="text-[11px] text-emerald-700 font-medium">
                                        Excel report for <strong>{getActiveProjectName()}</strong> from <strong>{exportFromDate}</strong> to <strong>{exportToDate}</strong> will be downloaded.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={() => {
                                    const today = new Date().toISOString().split('T')[0];
                                    setExportFromDate(today);
                                    setExportToDate(today);
                                }}
                                className="flex-1 px-4 py-2.5 text-sm font-bold text-slate-500 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
                            >
                                Reset to Today
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={isExporting || !exportFromDate || !exportToDate}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                            >
                                <Download className="w-4 h-4" />
                                {isExporting ? "Downloading..." : "Download Excel"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LabourAttendancePage;
