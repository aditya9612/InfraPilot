import React, { useState, useMemo, useEffect } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { labourService } from "../../../services/labourService";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LaborAttendance {
    id: number;
    labour_id: number;
    project_id: number;
    labour_name: string;
    worker_code: string;
    attendance_date: string;
    status: string;
    in_time: string;
    out_time: string | null;
    working_hours: number;
    overtime_hours: number;
    check_in_address: string;
    check_out_address: string | null;
    check_in_image: string | null;
    check_out_image: string | null;
    task_description?: string;
    total_wage?: number;
    contractor_name?: string;
    work_type?: string;
    site_location?: string;
    latitude?: number;
    longitude?: number;
    resolved_address?: string;
    in_out_time?: string;
}

const initialFormData = {
    labour_id: "",
    worker_name: "",
    id_aadhaar: "",
    contractor_name: "",
    work_type: "Work",
    attendance: "present",
    in_time: "",
    out_time: "",
    working_hours: "8",
    overtime_hours: "0",
    overtime_rate: "200",
    wage_rate: "800",
    site_location: "Pune",
    project_id: "1",
    latitude: 18.5204,
    longitude: 73.8567,
    resolved_address: "",
    photo_url: "",
    photo_file: null as File | null,
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const LaborAttendancePage = () => {
    const [attendanceList, setAttendanceList] = useState<LaborAttendance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [editId, setEditId] = useState<number | null>(null);
    const [selectedAttendance, setSelectedAttendance] = useState<LaborAttendance | null>(null);
    const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "error">("idle");

    const [projectId, setProjectId] = useState<number | null>(null);
    const [labourList, setLabourList] = useState<any[]>([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [attendanceToDelete, setAttendanceToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ─── Resolve Project ID ──────────────────────────────────────────────────
    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        const user = userStr ? JSON.parse(userStr) : {};
        const pId = user?.project_id || user?.user?.project_id || user?.user?.project?.id || user?.user?.assigned_project?.id;
        if (pId) {
            setProjectId(Number(pId));
        } else {
            const discoverProject = async () => {
                try {
                    const api = (await import("../../../services/api")).default;
                    const { data } = await api.get("/projects");
                    const items = Array.isArray(data) ? data : (data.items || []);
                    if (items.length > 0) {
                        setProjectId(Number(items[0].project_id || items[0].id));
                    }
                } catch (e) {
                    console.error("Project discovery failed", e);
                }
            };
            discoverProject();
        }
    }, []);

    useEffect(() => {
        if (projectId) {
            fetchAttendance();
            fetchLabours();
        }
    }, [projectId]);

    const fetchLabours = async () => {
        try {
            const data = await labourService.getLabours(projectId);
            setLabourList(Array.isArray(data) ? data : data.items || []);
        } catch (err) {
            console.error("Failed to fetch labors", err);
        }
    };

    const [workerHistory, setWorkerHistory] = useState<any[]>([]);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const fetchAttendance = async () => {
        if (!projectId) return;
        setIsLoading(true);
        
        const today = new Date().toISOString().split('T')[0];
        const fromDate = "2024-01-01"; // Wide range as default
        
        console.log("GET /api/v1/labour/attendance Request Params:", { 
            project_id: projectId,
            from_date: fromDate,
            to_date: today
        });

        try {
            const data = await labourService.getAttendanceList(projectId, fromDate, today);
            console.log("GET /api/v1/labour/attendance Response Body:", data);

            const serverItems = Array.isArray(data) ? data : (data.items || []);

            const localCache = localStorage.getItem('demo_attendance_list');
            const localItems = localCache ? JSON.parse(localCache) : [];

            const deletedCache = localStorage.getItem('demo_attendance_deleted_ids');
            const deletedIds = deletedCache ? JSON.parse(deletedCache) : [];

            const merged = [...localItems, ...serverItems].filter((item: any) => !deletedIds.includes(item.id));
            setAttendanceList(merged);
        } catch (err) {
            console.error("Registry Fetch Failure:", err);
            toast.error("Network Error: Could not synchronize attendance list");
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewHistory = async (labourId: number) => {
        if (!labourId) {
            toast.error("Invalid Labour ID for history lookup");
            return;
        }
        const loadingToast = toast.loading(`Fetching logs for Worker #${labourId}...`);
        try {
            const today = new Date().toISOString().split('T')[0];
            const fromDate = "2024-01-01";
            console.log("GET /api/v1/labour/" + labourId + "/attendance Request (Fetch History) Params:", { from_date: fromDate, to_date: today });
            const data = await labourService.getLabourAttendance(labourId, fromDate, today);
            console.log("GET /api/v1/labour/" + labourId + "/attendance Response Body:", data);
            setWorkerHistory(Array.isArray(data) ? data : []);
            setIsHistoryModalOpen(true);
            toast.dismiss(loadingToast);
        } catch (err: any) {
            console.error("History Fetch Error:", err);
            const detail = err.response?.data?.detail || "Worker logs not found on server";
            toast.error(`API Error: ${detail}`, { id: loadingToast });
            // Even if it fails, open modal with empty state if needed, or just stay on page
        }
    };

    // Camera states
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [tempPhoto, setTempPhoto] = useState<string | null>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const streamRef = React.useRef<MediaStream | null>(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // Summary stats are calculated below after filteredList is defined.

    // ── CRUD Handlers ────────────────────────────────────────────────────────
    const formatAadhar = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 12);
        const match = digits.match(/.{1,4}/g);
        return match ? match.join("-") : digits;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === "id_aadhaar") {
            finalValue = formatAadhar(value);
        }

        if (name === "labour_id") {
            const numericLabourId = Number(value);
            const selectedLab = labourList.find((l: any) => Number(l.id) === numericLabourId);
            if (selectedLab) {
                setFormData(prev => ({
                    ...prev,
                    labour_id: value,
                    worker_name: selectedLab.name || selectedLab.labour_name || "",
                    contractor_name: selectedLab.contractor_name || "",
                    work_type: selectedLab.work_type || "Work"
                }));
                return;
            }
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const captureGPS = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser");
            return;
        }

        setGpsStatus("capturing");
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                try {
                    // Reverse geocoding using Nominatim (OpenStreetMap) - No API key required for low volume
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    const address = data.display_name || "Resolved Site Location";

                    setFormData(prev => ({
                        ...prev,
                        latitude,
                        longitude,
                        site_location: address,
                        resolved_address: address
                    }));
                    setGpsStatus("captured");
                    toast.success("Live Location Verified");
                } catch (err) {
                    console.error("Reverse geocoding error:", err);
                    setFormData(prev => ({
                        ...prev,
                        latitude,
                        longitude,
                        site_location: `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`
                    }));
                    setGpsStatus("captured");
                    toast.success("GPS Captured (Address Resolve Failed)");
                }
            },
            (error) => {
                setGpsStatus("error");
                toast.error(`GPS Error: ${error.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    // ── Camera Handlers ──────────────────────────────────────────────────────

    const startCamera = async () => {
        setIsCameraOpen(true);
        setTempPhoto(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: 1280, height: 720 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
        } catch (err) {
            toast.error("Camera access denied");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const takePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement("canvas");
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.drawImage(videoRef.current, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const file = new File([blob], "attendance.jpg", { type: "image/jpeg" });
                        setFormData(prev => ({ ...prev, photo_file: file }));
                    }
                }, "image/jpeg");
                const dataUrl = canvas.toDataURL("image/jpeg");
                setTempPhoto(dataUrl);
            }
        }
    };

    const usePhoto = () => {
        if (tempPhoto) {
            setFormData(prev => ({ ...prev, photo_url: tempPhoto }));
            stopCamera();
            toast.success("ID Verified");
        }
    };

    const validateForm = () => {
        const errs: Record<string, string> = {};
        if (!formData.labour_id) errs.labour_id = "Required";
        if (!formData.project_id) errs.project_id = "Required";
        if (!formData.site_location.trim()) errs.site_location = "Required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleOpenCreate = () => {
        setFormMode("create");
        setFormData(initialFormData);
        setErrors({});
        setGpsStatus("idle");
        setIsModalOpen(true);
    };

    const handleOpenEdit = (entry: LaborAttendance) => {
        setFormMode("edit");
        setEditId(entry.id);
        setFormData({
            ...initialFormData,
            labour_id: entry.labour_id.toString(),
            project_id: entry.project_id.toString(),
            worker_name: entry.labour_name,
            attendance: entry.status,
            site_location: entry.check_in_address,
            latitude: 18.5204,
            longitude: 73.8567,
            resolved_address: entry.check_in_address,
            photo_url: entry.check_in_image || "",
        });
        setErrors({});
        setGpsStatus("captured");
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setAttendanceToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!attendanceToDelete) return;
        try {
            setIsDeleting(true);
            setAttendanceList(prev => prev.filter(a => a.id !== attendanceToDelete));

            // Save to deleted cache to persist across reloads
            const deletedCache = localStorage.getItem('demo_attendance_deleted_ids');
            const deletedIds = deletedCache ? JSON.parse(deletedCache) : [];
            localStorage.setItem('demo_attendance_deleted_ids', JSON.stringify([...deletedIds, attendanceToDelete]));

            toast.success("Entry removed permanently");
            setIsDeleteModalOpen(false);
            setAttendanceToDelete(null);
        } catch (error) {
            toast.error("Failed to delete record");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fill all required fields marked with *");
            return;
        }

        if (formMode === "create") {
            // Check if photo is captured
            if (!formData.photo_file && !formData.photo_url) {
                toast.error("Live photo capture is required for attendance");
                return;
            }

            const numericLabourId = Number(formData.labour_id);
            console.log("Selected Labour ID:", numericLabourId);

            const checkInData = {
                project_id: Number(formData.project_id),
                task_id: (formData as any).task_id || "",
                latitude: formData.latitude,
                longitude: formData.longitude,
                location_address: formData.site_location,
                task_description: formData.work_type,
                check_in_image: formData.photo_file
            };

            let apiResponse: any = {};
            const loadingToast = toast.loading("Processing check-in...");
            try {
                console.log("POST /api/v1/labour/" + numericLabourId + "/attendance/check-in Request Body (FormData):", checkInData);
                apiResponse = await labourService.checkIn(numericLabourId, checkInData);
                console.log("POST /api/v1/labour/" + numericLabourId + "/attendance/check-in Response Body:", apiResponse);
                toast.success("Check-in successful", { id: loadingToast });

                const newRecord = {
                    id: apiResponse.id || Date.now(),
                    labour_id: Number(formData.labour_id),
                    project_id: Number(formData.project_id),
                    labour_name: formData.worker_name,
                    worker_code: apiResponse.worker_code || `LAB00${formData.labour_id}`,
                    attendance_date: apiResponse.attendance_date || new Date().toISOString().split('T')[0],
                    status: formData.attendance,
                    in_time: formData.in_time || new Date().toLocaleTimeString('en-US', { hour12: false }),
                    out_time: formData.out_time || null,
                    working_hours: Number(formData.working_hours) || 0,
                    overtime_hours: Number(formData.overtime_hours) || 0,
                    check_in_address: formData.site_location,
                    check_out_address: null,
                    check_in_image: formData.photo_url || apiResponse.check_in_image || null,
                    check_out_image: null,
                    in_out_time: `${formData.in_time || "N/A"} - ${formData.out_time || "N/A"}`,
                    contractor_name: formData.contractor_name || "Assigned Contractor",
                    work_type: formData.work_type,
                    total_wage: Number(formData.wage_rate) + (Number(formData.overtime_rate) * Number(formData.overtime_hours)),
                    site_location: formData.site_location,
                    resolved_address: formData.resolved_address || "Pune Site Office",
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                };
                setAttendanceList(prev => [(newRecord as LaborAttendance), ...prev]);

                // Save to local storage for persistence on refresh
                const existing = JSON.parse(localStorage.getItem('demo_attendance_list') || '[]');
                localStorage.setItem('demo_attendance_list', JSON.stringify([newRecord, ...existing]));

                toast.success("Check-in Finalized");
                setIsModalOpen(false);
                fetchAttendance(); // Refresh to sync with server IDs
            } catch (err: any) {
                console.error("Check-in API Error Details:", err.response?.data);
                const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Check-in failed";
                toast.error(`API Error: ${errorMsg}`, { id: loadingToast });
                return; // Stop execution if check-in failed
            }
        } else {
            // Validation: Backend strictly requires check_out_image for PUT /check-out
            if (!formData.photo_file) {
                toast.error("Live photo capture is required for check-out verification");
                return;
            }

            const checkOutData = {
                attendance_id: editId,
                latitude: formData.latitude,
                longitude: formData.longitude,
                location_address: formData.site_location,
                overtime_hours: Number(formData.overtime_hours),
                overtime_rate: Number(formData.overtime_rate),
                check_out_image: formData.photo_file
            };

            const loadingToast = toast.loading("Processing check-out...");
            try {
                console.log("PUT /api/v1/labour/attendance/" + editId + "/check-out Request Body (FormData):", checkOutData);
                const apiResponse = await labourService.checkOut(editId!, checkOutData);
                console.log("PUT /api/v1/labour/attendance/" + editId + "/check-out Response Body:", apiResponse);
                toast.success("Check-out successful", { id: loadingToast });

                // Update local state by merging with server response
                const updatedRecord = Array.isArray(apiResponse) ? apiResponse[0] : apiResponse;
                setAttendanceList(prev => prev.map(a => a.id === editId ? { ...a, ...updatedRecord } : a));

                setIsModalOpen(false);
                fetchAttendance(); // Refresh the list from server
            } catch (err: any) {
                console.error("Check-out API Error Details:", err.response?.data);
                const errorMsg = err.response?.data?.detail || err.response?.data?.message || "Check-out failed";
                toast.error(`API Error: ${errorMsg}`, { id: loadingToast });
            }
        }
        setIsModalOpen(false);
    };

    const filteredList = useMemo(() => {
        return attendanceList.filter((item) => {
            if (!item) return false;
            const searchLower = searchTerm.toLowerCase();
            const nameMatch = (item.labour_name || "").toLowerCase().includes(searchLower);
            const codeMatch = (item.worker_code || "").toLowerCase().includes(searchLower);
            const statusMatch = statusFilter === "All" || item.status === statusFilter;
            return (nameMatch || codeMatch) && statusMatch;
        });
    }, [attendanceList, searchTerm, statusFilter]);

    // Calculate stats based on the filtered list
    const totalLaborers = filteredList.length;
    const presentCount = filteredList.filter(a => a.status?.toLowerCase() === "present").length;
    const absentCount = totalLaborers - presentCount;

    if (isLoading && attendanceList.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Registry...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <Navbar
                title="Labor Attendance"
                breadcrumb={["InfraPilot", "Engineer", "Labor", "Attendance"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Workforce Management
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Labor Attendance
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Record daily attendance, shift timings, and overtime for all site laborers.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                    >
                        <span className="text-lg leading-none">+</span>
                        Mark Attendance
                    </button>
                </div>

                {/* ── Summary Stats (Activity Style) ────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        Attendance Snapshot
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Workforce</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{totalLaborers}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Registered Personnel</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Present Today</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">{presentCount}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">{((presentCount / totalLaborers) * 100 || 0).toFixed(0)}% Attendance Rate</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Absent Today</p>
                            <p className="text-2xl font-bold text-rose-500 font-inter">{absentCount}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Personnel Flagged</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-3 sm:px-5 py-3 sm:py-4 mb-8 flex flex-wrap items-center gap-3 sm:gap-4 font-inter">

                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <span className="text-base font-bold text-slate-800 whitespace-nowrap">Attendance Filters</span>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0" />

                    {/* Search */}
                    <div className="flex flex-col gap-0.5 flex-1 min-w-0 sm:min-w-[200px] sm:flex-none">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Search</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex flex-col gap-0.5 w-[calc(50%-6px)] sm:w-auto sm:min-w-[130px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer pr-8"
                            >
                                <option value="All">All Status</option>
                                <option value="Present">Present</option>
                                <option value="Absent">Absent</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Attendance Registry List ───────────────────────────────── */}
                <div className="mb-20">
                    <div className="flex flex-col gap-4 font-inter">
                        {filteredList.map((labor) => (
                            <div
                                key={labor.id}
                                className="bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col gap-5 md:flex-row md:items-center md:gap-8"
                            >
                                {/* Left: Profile Section */}
                                <div className="flex items-center gap-4 min-w-0 md:w-[32%] shrink-0">
                                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                                        {labor.check_in_image ? (
                                            <img src={labor.check_in_image} alt={labor.labour_name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                <svg className="w-7 h-7 md:w-8 md:h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <p className="text-[15px] md:text-base font-bold text-slate-900 truncate max-w-[150px] md:max-w-none leading-tight">{labor.labour_name}</p>
                                            <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-lg ${labor.status === "present" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                                                {labor.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] md:text-[11px] text-slate-400 font-semibold truncate uppercase tracking-widest">
                                            ID #{labor.labour_id} · {labor.worker_code}
                                        </p>
                                    </div>
                                </div>

                                {/* Center: Details Grid */}
                                <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {/* Assignment */}
                                    <div className="min-w-0">
                                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Assignment</p>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[12px] md:text-[13px] font-bold text-slate-700 truncate">{labor.worker_code}</p>
                                            <p className="text-[11px] font-medium text-primary truncate italic-none">{labor.check_in_address}</p>
                                        </div>
                                    </div>

                                    {/* Captured Address - Hidden on small, shown on large */}
                                    <div className="hidden lg:block">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                            <svg className="w-3 h-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            Verified Location
                                        </p>
                                        <p className="text-[11px] font-medium text-slate-500 line-clamp-2 leading-relaxed italic-none">
                                            {labor.check_in_address || "No address resolved"}
                                        </p>
                                    </div>

                                    {/* Timings */}
                                    <div className="md:border-l md:border-slate-50 md:pl-6">
                                        <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-1.5">Time Log</p>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[12px] md:text-[13px] font-bold text-slate-800">{labor.in_time} - {labor.out_time || "Pending"}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{labor.working_hours} Hrs Worked</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Action Buttons */}
                                <div className="flex items-center justify-end gap-2 pt-4 md:pt-0 md:pl-6 md:border-l md:border-slate-100 shrink-0">
                                    <button
                                        onClick={() => handleViewHistory(Number(labor.labour_id))}
                                        className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-50 md:border-none shadow-sm md:shadow-none"
                                        title="View History"
                                    >
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => handleOpenEdit(labor)}
                                        className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all border border-slate-50 md:border-none shadow-sm md:shadow-none"
                                        title="Edit Entry"
                                    >
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(labor.id)}
                                        className="w-10 h-10 md:w-9 md:h-9 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-slate-50 md:border-none shadow-sm md:shadow-none"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredList.length === 0 && (
                        <div className="bg-white rounded-xl p-10 sm:p-20 text-center border border-slate-100 shadow-sm font-inter">
                            <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs font-inter">No attendance records found</p>
                        </div>
                    )}
                </div>
            </PageTransition>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setAttendanceToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Attendance Record"
                message="Are you sure you want to delete this attendance log? This will permanently remove the check-in/out record and associated wage calculations."
                confirmText="Delete"
                type="danger"
                isLoading={isDeleting}
            />

            {/* Attendance Modal (Admin Pulse Style) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setErrors({}); }}
                title={formMode === "create" ? "Mark Labor Attendance" : "Edit Attendance Record"}
                maxWidth="max-w-4xl"
            >
                <div className="bg-white italic-none font-inter text-inter">
                    {/* Photo Capture Hero Section */}
                    <div className="bg-slate-50 border-b border-slate-100 p-8 flex flex-col items-center justify-center">
                        <h3 className="text-sm font-bold text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
                            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Capture Photo
                        </h3>

                        <div className="relative w-full max-w-sm aspect-[4/3] bg-white rounded-3xl border-2 border-dashed border-slate-200 overflow-hidden shadow-2xl flex items-center justify-center group">
                            {isCameraOpen ? (
                                <>
                                    {!tempPhoto ? (
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <img src={tempPhoto} alt="Captured" className="w-full h-full object-cover" />
                                    )}
                                </>
                            ) : formData.photo_url ? (
                                <img src={formData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Face recognition required</p>
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex items-center gap-4">
                            {!isCameraOpen ? (
                                <button
                                    type="button"
                                    onClick={startCamera}
                                    className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 flex items-center gap-3 hover:-translate-y-1 transition-all"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Capture Photo
                                </button>
                            ) : !tempPhoto ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={takePhoto}
                                        className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 flex items-center gap-3 active:scale-95"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        Capture Photo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={stopCamera}
                                        className="px-8 py-3 bg-white border border-slate-200 text-slate-500 text-xs font-black uppercase tracking-[0.2em] rounded-2xl flex items-center gap-3"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => setTempPhoto(null)}
                                        className="px-8 py-3 bg-rose-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-rose-500/30 flex items-center gap-3 active:scale-95"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        Retake
                                    </button>
                                    <button
                                        type="button"
                                        onClick={usePhoto}
                                        className="px-8 py-3 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/30 flex items-center gap-3 active:scale-95"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        Use Photo
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <form id="attendance-form" onSubmit={handleSubmit} className="p-8 space-y-10 text-inter">

                        {/* Payload-aligned Form Sections */}
                        <div className="border border-slate-200 rounded-xl p-6 relative">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                                Attendance Payload Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter text-slate-800">
                                {/* 1. labour_id */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">labour_id <span className="text-rose-500">*</span></label>
                                    <input
                                        list="labour-suggestions"
                                        name="labour_id"
                                        value={formData.labour_id}
                                        onChange={handleChange}
                                        placeholder="Type or Select ID"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none transition-all ${errors.labour_id ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    <datalist id="labour-suggestions">
                                        {labourList.map((lab: any) => (
                                            <option key={lab.id} value={lab.id.toString()}>
                                                {lab.name || lab.labour_name} (ID: {lab.id})
                                            </option>
                                        ))}
                                    </datalist>
                                    {errors.labour_id && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{errors.labour_id}</p>}
                                </div>

                                {/* 2. project_id */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">project_id <span className="text-rose-500">*</span></label>
                                    <input
                                        name="project_id"
                                        type="number"
                                        value={formData.project_id}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none transition-all ${errors.project_id ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.project_id && <p className="text-[10px] text-rose-500 font-bold mt-1 px-1">{errors.project_id}</p>}
                                </div>

                                {/* 3. task_id */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">task_id</label>
                                    <input
                                        name="task_id"
                                        value={(formData as any).task_id || ""}
                                        onChange={handleChange}
                                        placeholder="Enter Task ID"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>

                                {/* 4. latitude */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">latitude</label>
                                    <div className="flex gap-2">
                                        <input
                                            name="latitude"
                                            type="number"
                                            value={formData.latitude}
                                            onChange={handleChange}
                                            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={captureGPS}
                                            disabled={gpsStatus === "capturing"}
                                            className="px-3 bg-slate-100 text-slate-500 rounded-xl hover:bg-slate-200 transition-all flex items-center justify-center"
                                            title="Capture GPS"
                                        >
                                            {gpsStatus === "capturing" ? (
                                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* 5. longitude */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">longitude</label>
                                    <input
                                        name="longitude"
                                        type="number"
                                        value={formData.longitude}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>

                                {/* 6. location_address */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">location_address <span className="text-rose-500">*</span></label>
                                    <input
                                        name="site_location"
                                        value={formData.site_location}
                                        onChange={handleChange}
                                        placeholder="e.g. Pune"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none transition-all ${errors.site_location ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>

                                {/* 7. task_description */}
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">task_description</label>
                                    <textarea
                                        name="work_type"
                                        value={formData.work_type}
                                        onChange={handleChange}
                                        placeholder="e.g. Masonry Work"
                                        rows={2}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Optional Metadata removed as requested */}
                    </form>
                </div>

                <div className="bg-white px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 font-inter">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-2.5 text-[11px] font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all"
                    >
                        Discard
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSubmit()}
                        className="px-8 py-2.5 bg-primary text-white text-[13px] font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
                    >
                        {formMode === "create" ? "Finalize Entry" : "Save Changes"}
                    </button>
                </div>
            </Modal>

            {/* View Detail Modal (Activity Insight Style) */}
            <Modal
                isOpen={!!selectedAttendance}
                onClose={() => setSelectedAttendance(null)}
                title="Personnel Attendance Insight"
                maxWidth="max-w-xl"
            >
                {selectedAttendance && (
                    <div className="p-8 italic-none font-inter space-y-8">
                        {/* Hero Section */}
                        <div className="bg-primary rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-primary/20 flex gap-6 items-center">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>

                            <div className="w-24 h-24 rounded-2xl bg-white/20 border border-white/20 overflow-hidden shrink-0 shadow-lg">
                                {selectedAttendance.check_in_image ? (
                                    <img src={selectedAttendance.check_in_image} alt={selectedAttendance.labour_name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white/40">
                                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10 flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.2em] mb-1">Worker Profile</p>
                                        <h3 className="text-2xl font-bold tracking-tight">{selectedAttendance.labour_name}</h3>
                                        <p className="text-xs text-white/70 mt-1 font-medium italic-none">{selectedAttendance.worker_code}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase mb-2 inline-block ${selectedAttendance.status === "present" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-rose-500 text-white shadow-lg shadow-rose-500/20"}`}>
                                            {selectedAttendance.status}
                                        </div>
                                        <p className="text-[10px] text-white/50 uppercase tracking-wider font-bold">LID #{selectedAttendance.labour_id}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Operational Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Hours Logged</p>
                                <p className="text-xl font-bold text-slate-800">{selectedAttendance.working_hours} <span className="text-xs text-slate-400">Hours</span></p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Remuneration</p>
                                <p className="text-xl font-bold text-emerald-600">₹{Number(selectedAttendance.total_wage || 0).toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Detailed Specs */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contractor</span>
                                <span className="text-sm font-bold text-slate-700">{selectedAttendance.contractor_name || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classification</span>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md">{selectedAttendance.work_type || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift Timing</span>
                                <span className="text-sm font-bold text-slate-700">{selectedAttendance.status?.toLowerCase() === "present" ? (`${selectedAttendance.in_time || "N/A"} - ${selectedAttendance.out_time || "N/A"}`) : "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overtime Hrs</span>
                                <span className="text-sm font-bold text-blue-600">+{selectedAttendance.overtime_hours || 0} h</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Site Location</span>
                                <span className="text-sm font-bold text-slate-700">{selectedAttendance.site_location || selectedAttendance.check_in_address || "N/A"}</span>
                            </div>
                            <div className="flex flex-col py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Captured Address</span>
                                <span className="text-xs font-bold text-slate-600 leading-relaxed">
                                    {selectedAttendance.resolved_address || (selectedAttendance.latitude ? `${selectedAttendance.latitude.toFixed(5)}, ${selectedAttendance.longitude?.toFixed(5)}` : "Address not resolved")}
                                </span>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4">
                            <button
                                onClick={() => setSelectedAttendance(null)}
                                className="px-6 py-2.5 text-[11px] font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all"
                            >
                                Close Insight
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedAttendance);
                                    setSelectedAttendance(null);
                                }}
                                className="px-8 py-2.5 bg-primary text-white text-[13px] font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                Edit Entry
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── Worker Attendance History Modal ────────────────────────── */}
            {isHistoryModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100 animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Attendance History</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Detailed Logs for worker</p>
                            </div>
                            <button
                                onClick={() => setIsHistoryModalOpen(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        {/* History List */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="space-y-4">
                                {workerHistory.length > 0 ? workerHistory.map((item: any) => (
                                    <div key={item.id} className="p-5 border border-slate-100 rounded-2xl hover:border-primary/20 hover:bg-primary/[0.02] transition-all flex flex-col gap-4 md:flex-row md:items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-bold text-slate-800">{item.attendance_date}</span>
                                                <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded-lg ${item.status === 'present' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-medium text-slate-500 uppercase tracking-tight">
                                                <span>In: <b className="text-slate-700">{item.in_time || "N/A"}</b></span>
                                                <span>Out: <b className="text-slate-700">{item.out_time || "Pending"}</b></span>
                                                <span>Hrs: <b className="text-primary">{item.working_hours || 0}</b></span>
                                            </div>
                                        </div>
                                        <div className="min-w-[150px] text-right border-l border-slate-100 pl-4 md:block hidden">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Location</p>
                                            <p className="text-[11px] font-bold text-slate-700 truncate">{item.check_in_address || "N/A"}</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                        <p className="text-sm font-bold text-slate-400">No attendance records found for this worker</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default LaborAttendancePage;
