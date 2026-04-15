import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LaborAttendance {
    id: number;
    labour_id: number;
    project_id: number;
    attendance_date: string;
    worker_name: string;
    id_aadhaar: string;
    contractor_name: string;
    work_type: string; // task_description
    attendance: "Present" | "Absent";
    in_out_time: string;
    working_hours: number;
    overtime_hours: number;
    wage_rate: number;
    total_wage: number;
    site_location: string;
    latitude: number;
    longitude: number;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockAttendance: LaborAttendance[] = [
    {
        id: 1,
        labour_id: 101,
        project_id: 1,
        attendance_date: "2026-04-13",
        worker_name: "Ramesh Kumar",
        id_aadhaar: "xxxx-xxxx-1234",
        contractor_name: "Varma Constructions",
        work_type: "operator",
        attendance: "Present",
        in_out_time: "08:30 AM - 05:30 PM",
        working_hours: 8,
        overtime_hours: 1,
        wage_rate: 850,
        total_wage: 1000,
        site_location: "Tower A - Basement",
        latitude: 19.9975,
        longitude: 73.7898,
    },
    {
        id: 2,
        labour_id: 102,
        project_id: 1,
        attendance_date: "2026-04-13",
        worker_name: "Suresh P.",
        id_aadhaar: "xxxx-xxxx-5678",
        contractor_name: "Varma Constructions",
        work_type: "Helper",
        attendance: "Present",
        in_out_time: "08:15 AM - 06:00 PM",
        working_hours: 8,
        overtime_hours: 2,
        wage_rate: 600,
        total_wage: 750,
        site_location: "Tower A - Column Grid",
        latitude: 19.9975,
        longitude: 73.7898,
    },
];

const initialFormData = {
    worker_name: "",
    id_aadhaar: "",
    contractor_name: "",
    work_type: "",
    attendance: "Present" as "Present" | "Absent",
    in_time: "08:30",
    out_time: "17:30",
    working_hours: "8",
    overtime_hours: "0",
    wage_rate: "",
    site_location: "",
    latitude: 0,
    longitude: 0,
};



// ─── Main Component ─────────────────────────────────────────────────────────────

const LaborAttendancePage = () => {
    const [attendanceList, setAttendanceList] = useState<LaborAttendance[]>(mockAttendance);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [editId, setEditId] = useState<number | null>(null);
    const [selectedAttendance, setSelectedAttendance] = useState<LaborAttendance | null>(null);
    const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "error">("idle");

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");

    // Summary stats
    const totalLaborers = attendanceList.length;
    const presentCount = attendanceList.filter(a => a.attendance === "Present").length;
    const absentCount = totalLaborers - presentCount;

    // ── CRUD Handlers ────────────────────────────────────────────────────────
    const formatAadhar = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 12);
        const match = digits.match(/.{1,4}/g);
        return match ? match.join("-") : digits;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === "id_aadhaar") {
            finalValue = formatAadhar(value);
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const captureGPS = () => {
        setGpsStatus("capturing");
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    }));
                    setGpsStatus("captured");
                    toast.success("Location captured successfully");
                },
                () => {
                    setGpsStatus("error");
                    toast.error("Failed to capture location");
                },
                { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
            );
        } else {
            setGpsStatus("error");
            toast.error("Geolocation not supported");
        }
    };

    const validateForm = () => {
        const errs: Record<string, string> = {};
        if (!formData.worker_name.trim()) errs.worker_name = "Required";
        if (!formData.id_aadhaar.trim()) errs.id_aadhaar = "Required";
        if (!formData.contractor_name.trim()) errs.contractor_name = "Required";
        if (!formData.work_type) errs.work_type = "Required";
        if (!formData.wage_rate) errs.wage_rate = "Required";
        if (!formData.site_location.trim()) errs.site_location = "Required";
        if (gpsStatus !== "captured" && formMode === "create") errs.gps = "Live location required";
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
            worker_name: entry.worker_name,
            id_aadhaar: entry.id_aadhaar,
            contractor_name: entry.contractor_name,
            work_type: entry.work_type,
            attendance: entry.attendance,
            in_time: entry.in_out_time.split(" - ")[0] || "08:30",
            out_time: entry.in_out_time.split(" - ")[1] || "17:30",
            working_hours: entry.working_hours.toString(),
            overtime_hours: entry.overtime_hours.toString(),
            wage_rate: entry.wage_rate.toString(),
            site_location: entry.site_location || "",
            latitude: entry.latitude || 0,
            longitude: entry.longitude || 0,
        });
        setErrors({});
        setGpsStatus("captured");
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Are you sure you want to delete this record?")) {
            setAttendanceList(prev => prev.filter(a => a.id !== id));
            toast.success("Attendance record deleted");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields");
            return;
        }

        const hourlyRate = Number(formData.wage_rate) / 8;
        const totalWage = (Number(formData.working_hours) * hourlyRate) + (Number(formData.overtime_hours) * hourlyRate * 1.5);

        const entryData: LaborAttendance = {
            id: formMode === "edit" ? editId! : Date.now(),
            labour_id: formMode === "edit" ? attendanceList.find(a => a.id === editId)?.labour_id || 0 : Date.now(),
            project_id: 1,
            attendance_date: new Date().toISOString().split("T")[0],
            worker_name: formData.worker_name,
            id_aadhaar: formData.id_aadhaar,
            contractor_name: formData.contractor_name,
            work_type: formData.work_type,
            attendance: formData.attendance,
            in_out_time: formData.attendance === "Present" ? `${formData.in_time} - ${formData.out_time}` : "-",
            working_hours: formData.attendance === "Present" ? Number(formData.working_hours) : 0,
            overtime_hours: Number(formData.overtime_hours),
            wage_rate: Number(formData.wage_rate),
            total_wage: totalWage,
            site_location: formData.site_location,
            latitude: formData.latitude,
            longitude: formData.longitude,
        };

        if (formMode === "edit") {
            setAttendanceList(prev => prev.map(a => a.id === editId ? entryData : a));
            toast.success("Attendance updated");
        } else {
            setAttendanceList(prev => [entryData, ...prev]);
            toast.success("Attendance marked");
        }
        setIsModalOpen(false);
    };

    const filteredList = useMemo(() => {
        return attendanceList.filter((item) => {
            const matchesSearch = item.worker_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.contractor_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All" || item.attendance === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [attendanceList, searchTerm, statusFilter]);

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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-inter">
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
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter">

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
                    <div className="flex flex-col gap-0.5 min-w-[200px]">
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
                    <div className="flex flex-col gap-0.5 min-w-[130px]">
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

                {/* ── Attendance Registry Grid ───────────────────────────────── */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        {filteredList.map((labor) => (
                            <div
                                key={labor.id}
                                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col"
                            >
                                {/* Header: ID & Status */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">LID #{labor.labour_id}</span>
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${labor.attendance === "Present"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-rose-50 text-rose-600"
                                        }`}>
                                        {labor.attendance}
                                    </span>
                                </div>

                                {/* Metadata */}
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter mb-2">
                                    {labor.work_type} · {labor.contractor_name}
                                </p>

                                {/* Worker Name */}
                                <p className="text-2xl font-bold text-slate-900 font-inter leading-tight mb-1">{labor.worker_name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed mb-4">
                                    {labor.id_aadhaar} · <span className="text-primary font-bold">{labor.site_location}</span>
                                </p>

                                {/* Timing & Wages */}
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Timing</p>
                                        <p className="text-lg font-bold text-slate-800 font-inter leading-none">{labor.in_out_time === "-" ? "N/A" : labor.in_out_time.split(" - ")[0]}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-medium italic-none">Entry Time</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Hrs Logged</p>
                                        <p className="text-2xl font-bold text-blue-600 font-inter leading-none tabular-nums">{labor.working_hours}</p>
                                        <p className="text-[10px] text-slate-400 mt-1 font-medium capitalize">Hours today</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedAttendance(labor)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="View"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleOpenEdit(labor)}
                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(labor.id)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredList.length === 0 && (
                        <div className="bg-white rounded-xl p-20 text-center border border-slate-100 shadow-sm font-inter">
                            <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs font-inter">No attendance records found</p>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* Attendance Modal (Admin Pulse Style) */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setErrors({}); }}
                title={formMode === "create" ? "Mark Labor Attendance" : "Edit Attendance Record"}
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-8 italic-none font-inter text-inter">
                    <form id="attendance-form" onSubmit={handleSubmit} className="space-y-10 text-inter">

                        {/* Section 1: Personnel Detail */}
                        <div className="border border-slate-200 rounded-xl p-6 relative">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                                Workforce Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter text-slate-800">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Worker Name <span className="text-rose-500">*</span></label>
                                    <input
                                        name="worker_name"
                                        value={formData.worker_name}
                                        onChange={handleChange}
                                        placeholder="Enter Name"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none transition-all ${errors.worker_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">ID / Aadhaar <span className="text-rose-500">*</span></label>
                                    <input
                                        name="id_aadhaar"
                                        value={formData.id_aadhaar}
                                        onChange={handleChange}
                                        placeholder="xxxx-xxxx-xxxx"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none transition-all ${errors.id_aadhaar ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Contractor Name <span className="text-rose-500">*</span></label>
                                    <input
                                        name="contractor_name"
                                        value={formData.contractor_name}
                                        onChange={handleChange}
                                        placeholder="Contractor Co."
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none transition-all ${errors.contractor_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Work Type <span className="text-rose-500">*</span></label>
                                    <input
                                        name="work_type"
                                        value={formData.work_type}
                                        onChange={handleChange}
                                        placeholder="e.g. Mason / Helper"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none transition-all ${errors.work_type ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Attendance & Timing */}
                        <div className="border border-slate-200 rounded-xl p-6 relative">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                                Attendance Entry
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter text-slate-800">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Attendance</label>
                                    <select
                                        name="attendance"
                                        value={formData.attendance}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none"
                                    >
                                        <option value="Present">Present</option>
                                        <option value="Absent">Absent</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">In Time / Out Time</label>
                                    <div className="flex items-center gap-2">
                                        <input name="in_time" type="time" value={formData.in_time} onChange={handleChange} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none" />
                                        <span className="text-slate-400">/</span>
                                        <input name="out_time" type="time" value={formData.out_time} onChange={handleChange} className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none" />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Working Hours</label>
                                    <input
                                        name="working_hours"
                                        type="number"
                                        value={formData.working_hours}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Overtime (Hrs)</label>
                                    <input
                                        name="overtime_hours"
                                        type="number"
                                        value={formData.overtime_hours}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 col-span-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Wage Rate (₹ per day)</label>
                                    <input
                                        name="wage_rate"
                                        type="number"
                                        value={formData.wage_rate}
                                        onChange={handleChange}
                                        placeholder="e.g. 600"
                                        className={`w-full px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl text-[13px] font-bold text-primary focus:outline-none ${errors.wage_rate ? "border-rose-300 bg-rose-50" : ""}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Location Verification */}
                        <div className="border border-slate-200 rounded-xl p-6 relative">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter flex items-center gap-2">
                                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                Location Verification
                            </h3>
                            <div className="space-y-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-1">Site Location <span className="text-rose-500">*</span></label>
                                    <input
                                        name="site_location"
                                        value={formData.site_location}
                                        onChange={handleChange}
                                        placeholder="e.g. Tower A - Ground Floor"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-[13px] font-bold text-slate-800 focus:outline-none transition-all ${errors.site_location ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col md:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                                    <div className="flex-1">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">GPS Coordinates</p>
                                        <p className="text-sm font-bold text-slate-700">
                                            {gpsStatus === "captured"
                                                ? `${formData.latitude.toFixed(6)}, ${formData.longitude.toFixed(6)}`
                                                : gpsStatus === "capturing"
                                                    ? "Capturing location..."
                                                    : "Location not captured"}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={captureGPS}
                                        disabled={gpsStatus === "capturing"}
                                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${gpsStatus === "captured"
                                            ? "bg-emerald-500 text-white"
                                            : "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                            }`}
                                    >
                                        {gpsStatus === "capturing" ? (
                                            <>
                                                <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                Capturing...
                                            </>
                                        ) : gpsStatus === "captured" ? (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                Location Captured
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                Capture Live Location
                                            </>
                                        )}
                                    </button>
                                </div>
                                {errors.gps && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest px-1">{errors.gps}</p>}
                            </div>
                        </div>
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
                        type="submit"
                        form="attendance-form"
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
                        <div className="bg-primary rounded-2xl p-6 text-white relative overflow-hidden shadow-xl shadow-primary/20">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Worker Profile</p>
                                    <h3 className="text-2xl font-bold tracking-tight">{selectedAttendance.worker_name}</h3>
                                    <p className="text-xs text-slate-400 mt-1 font-medium italic-none">{selectedAttendance.id_aadhaar}</p>
                                </div>
                                <div className="text-right">
                                    <div className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase mb-2 inline-block ${selectedAttendance.attendance === "Present" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                                        {selectedAttendance.attendance}
                                    </div>
                                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">LID #{selectedAttendance.labour_id}</p>
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
                                <p className="text-xl font-bold text-emerald-600">₹{selectedAttendance.total_wage.toFixed(2)}</p>
                            </div>
                        </div>

                        {/* Detailed Specs */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contractor</span>
                                <span className="text-sm font-bold text-slate-700">{selectedAttendance.contractor_name}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Classification</span>
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md">{selectedAttendance.work_type}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Shift Timing</span>
                                <span className="text-sm font-bold text-slate-700">{selectedAttendance.attendance === "Present" ? selectedAttendance.in_out_time : "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overtime Hrs</span>
                                <span className="text-sm font-bold text-blue-600">+{selectedAttendance.overtime_hours} h</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Site Location</span>
                                <span className="text-sm font-bold text-slate-700">{selectedAttendance.site_location}</span>
                            </div>
                            <div className="flex items-center justify-between py-3 border-b border-slate-50">
                                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Coordinates</span>
                                <span className="text-[10px] font-bold text-slate-400">{selectedAttendance.latitude?.toFixed(5)}, {selectedAttendance.longitude?.toFixed(5)}</span>
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
        </>
    );
};

export default LaborAttendancePage;
