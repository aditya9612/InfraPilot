import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LaborAttendance {
    id: number;
    workerName: string;
    aadhaarId: string;
    contractorName: string;
    workType: string;
    attendance: "Present" | "Absent";
    inTime: string;
    outTime: string;
    workingHours: number;
    overtime: number;
    wageRate: number;
    date: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockAttendance: LaborAttendance[] = [
    {
        id: 1,
        workerName: "Ramesh Kumar",
        aadhaarId: "xxxx-xxxx-1234",
        contractorName: "Varma Constructions",
        workType: "Skilled Mason",
        attendance: "Present",
        inTime: "08:30 AM",
        outTime: "05:30 PM",
        workingHours: 8.5,
        overtime: 0.5,
        wageRate: 850,
        date: "2026-04-13",
    },
    {
        id: 2,
        workerName: "Suresh P.",
        aadhaarId: "xxxx-xxxx-5678",
        contractorName: "Varma Constructions",
        workType: "Helper",
        attendance: "Present",
        inTime: "08:15 AM",
        outTime: "06:00 PM",
        workingHours: 9,
        overtime: 1.0,
        wageRate: 600,
        date: "2026-04-13",
    },
    {
        id: 3,
        workerName: "Amit Singh",
        aadhaarId: "xxxx-xxxx-9012",
        contractorName: "Alpha Logistics",
        workType: "Electrician",
        attendance: "Absent",
        inTime: "-",
        outTime: "-",
        workingHours: 0,
        overtime: 0,
        wageRate: 900,
        date: "2026-04-13",
    },
];

// ─── Profile Field Helper ──────────────────────────────────────────────────────

const ProfileField = ({
    label,
    value,
    accent,
    mono = false,
}: {
    label: string;
    value: string;
    accent?: string;
    mono?: boolean;
}) => (
    <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-1">
            {label}
        </span>
        <p className={`text-sm font-bold text-slate-800 leading-snug ${mono ? "font-mono tracking-tight" : ""} ${accent ?? ""}`}>
            {value || "—"}
        </p>
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

const LaborAttendancePage = () => {
    const [attendanceList, setAttendanceList] = useState<LaborAttendance[]>(mockAttendance);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState<LaborAttendance | null>(null);
    const [filter, setFilter] = useState("All");

    const [formData, setFormData] = useState({
        workerName: "",
        aadhaarId: "",
        contractorName: "",
        workType: "",
        attendance: "Present" as "Present" | "Absent",
        inTime: "",
        outTime: "",
        overtime: "0",
        wageRate: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.workerName) newErrors.workerName = "Required";
        if (!formData.aadhaarId) newErrors.aadhaarId = "Required";
        if (!formData.contractorName) newErrors.contractorName = "Required";
        if (!formData.workType) newErrors.workType = "Required";
        if (formData.attendance === "Present") {
            if (!formData.inTime) newErrors.inTime = "Required";
            if (!formData.outTime) newErrors.outTime = "Required";
        }
        if (!formData.wageRate) newErrors.wageRate = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        const newEntry: LaborAttendance = {
            id: Date.now(),
            workerName: formData.workerName,
            aadhaarId: formData.aadhaarId,
            contractorName: formData.contractorName,
            workType: formData.workType,
            attendance: formData.attendance,
            inTime: formData.attendance === "Present" ? formData.inTime : "-",
            outTime: formData.attendance === "Present" ? formData.outTime : "-",
            workingHours: formData.attendance === "Present" ? 8 : 0, // Simplified for mock
            overtime: parseFloat(formData.overtime) || 0,
            wageRate: parseFloat(formData.wageRate),
            date: new Date().toISOString().split("T")[0],
        };

        setAttendanceList((prev) => [newEntry, ...prev]);
        toast.success("Attendance Marked Successfully!");
        setIsModalOpen(false);
        setFormData({
            workerName: "",
            aadhaarId: "",
            contractorName: "",
            workType: "",
            attendance: "Present",
            inTime: "",
            outTime: "",
            overtime: "0",
            wageRate: "",
        });
    };

    const filteredList = attendanceList.filter(item => {
        if (filter === "All") return true;
        return item.attendance === filter;
    });

    return (
        <>
            <Navbar
                title="Labor Attendance"
                breadcrumb={["InfraPilot", "Engineer", "Labor", "Attendance"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Workforce Management
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Labor Attendance
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Record daily attendance, shift timings, and overtime for all site laborers.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 transition-all active:scale-95"
                    >
                        <span className="text-xl leading-none">+</span>
                        Mark Attendance
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Laborers</p>
                        <p className="text-3xl font-black text-slate-800">{attendanceList.length}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Present Today</p>
                        <p className="text-3xl font-black text-emerald-600">{attendanceList.filter(a => a.attendance === "Present").length}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Absent Today</p>
                        <p className="text-3xl font-black text-rose-500">{attendanceList.filter(a => a.attendance === "Absent").length}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm inline-flex mb-8">
                    {["All", "Present", "Absent"].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === tab ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Attendance List */}
                <div className="grid grid-cols-1 gap-6">
                    {filteredList.map((labor) => (
                        <div
                            key={labor.id}
                            className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                        >
                            <div className="flex flex-col gap-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xl border border-slate-100">
                                            {labor.workerName.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                                    {labor.workerName}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${labor.attendance === "Present" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                                                    {labor.attendance}
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
                                                {labor.workType} | ID: {labor.aadhaarId}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contractor</p>
                                        <p className="text-sm font-black text-slate-800">{labor.contractorName}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-y-8 gap-x-12 py-8 border-y border-slate-50">
                                    <ProfileField label="In Time" value={labor.inTime} accent={labor.attendance === "Present" ? "text-emerald-600" : ""} />
                                    <ProfileField label="Out Time" value={labor.outTime} accent={labor.attendance === "Present" ? "text-rose-600" : ""} />
                                    <ProfileField label="Working Hours" value={labor.workingHours > 0 ? `${labor.workingHours}h` : "0h"} />
                                    <ProfileField label="Overtime" value={labor.overtime > 0 ? `+${labor.overtime}h` : "0h"} accent="text-blue-600" />
                                    <ProfileField label="Wage Rate" value={`₹${labor.wageRate}/day`} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                        System Verified • {labor.date}
                                    </span>
                                    <button
                                        onClick={() => setSelectedAttendance(labor)}
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        View Shift Details →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Shift Detail Modal (Reference Style) */}
            <Modal
                isOpen={!!selectedAttendance}
                onClose={() => setSelectedAttendance(null)}
                title="Attendance Shift Details"
                maxWidth="max-w-4xl"
            >
                {selectedAttendance && (
                    <div className="bg-white p-0 italic-none">
                        {/* ── Gradient Banner ────────────────────────────────── */}
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shadow-2xl shadow-blue-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                {/* Square Initials Card */}
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">
                                        {selectedAttendance.workerName.substring(0, 2)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-2xl font-black text-white tracking-tight">
                                            {selectedAttendance.workerName}
                                        </h3>
                                        <span className="px-4 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                                            {selectedAttendance.attendance}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg">
                                            <span className="text-amber-400 text-sm">★</span>
                                            <span className="text-xs font-black text-white tracking-wide">Verified Shift</span>
                                        </div>
                                        <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">
                                            ID: SHIFT-{selectedAttendance.id.toString().padStart(4, '0')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Content Sections ────────────────────────────────── */}
                        <div className="px-12 pb-12 space-y-12">

                            {/* Section 1: Worker Profile */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Worker Profile</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="WORKER NAME" value={selectedAttendance.workerName} />
                                    <ProfileField label="IDENTITY (AADHAAR)" value={selectedAttendance.aadhaarId} />
                                    <ProfileField label="EMPLOYER / CONTRACTOR" value={selectedAttendance.contractorName} />
                                    <ProfileField label="WORK CATEGORY" value={selectedAttendance.workType} />
                                </div>
                            </div>

                            {/* Section 2: Shift Metrics */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Shift & Timing</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="IN TIME" value={selectedAttendance.inTime} accent="text-emerald-600" />
                                    <ProfileField label="OUT TIME" value={selectedAttendance.outTime} accent="text-rose-600" />
                                    <ProfileField label="WORKING HOURS" value={`${selectedAttendance.workingHours} Hours`} />
                                    <ProfileField label="OVERTIME DURATION" value={`${selectedAttendance.overtime} Hours`} accent="text-blue-600" />
                                </div>
                            </div>

                            {/* Section 3: Finance / Wage */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Financial Data</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="DAILY WAGE RATE" value={`₹${selectedAttendance.wageRate} / day`} />
                                    <ProfileField label="PAYMENT STATUS" value="COMMITTED" accent="text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        {/* ── Footer ────────────────────────────────────────── */}
                        <div className="bg-slate-50 px-12 py-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedAttendance(null)}
                                className="px-12 py-3 bg-[#0f172a] hover:bg-black text-white text-[11px] font-black rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Attendance Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); setErrors({}); }}
                title="Mark Labor Attendance"
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-8">
                    <form id="attendance-form" onSubmit={handleSubmit} className="space-y-12 italic-none">

                        {/* Worker Context */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Worker Profile</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Worker Name *</label>
                                    <input
                                        name="workerName"
                                        value={formData.workerName}
                                        onChange={handleInputChange}
                                        placeholder="Enter full name"
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all ${errors.workerName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.workerName && <p className="text-[9px] font-bold text-rose-500 px-1">{errors.workerName}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">ID / Aadhaar Number *</label>
                                    <input
                                        name="aadhaarId"
                                        value={formData.aadhaarId}
                                        onChange={handleInputChange}
                                        placeholder="xxxx-xxxx-xxxx"
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all ${errors.aadhaarId ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.aadhaarId && <p className="text-[9px] font-bold text-rose-500 px-1">{errors.aadhaarId}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Contractor Name *</label>
                                    <input
                                        name="contractorName"
                                        value={formData.contractorName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Varma Constructions"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Work Type / Designation *</label>
                                    <select
                                        name="workType"
                                        value={formData.workType}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Type</option>
                                        <option value="Skilled Mason">Skilled Mason</option>
                                        <option value="Helper">Helper</option>
                                        <option value="Electrician">Electrician</option>
                                        <option value="Plumber">Plumber</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Attendance & Shift */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Shift Details</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Attendance Status</label>
                                    <div className="flex gap-2">
                                        {["Present", "Absent"].map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, attendance: s as any }))}
                                                className={`flex-1 py-4 rounded-2xl text-xs font-black transition-all border ${formData.attendance === s ? (s === "Present" ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" : "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100") : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"}`}
                                            >
                                                {s.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Wage Rate (₹/day) *</label>
                                    <input
                                        name="wageRate"
                                        type="number"
                                        value={formData.wageRate}
                                        onChange={handleInputChange}
                                        placeholder="850"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>
                                {formData.attendance === "Present" && (
                                    <>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">In Time *</label>
                                            <input
                                                name="inTime"
                                                type="time"
                                                value={formData.inTime}
                                                onChange={handleInputChange}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Out Time *</label>
                                            <input
                                                name="outTime"
                                                type="time"
                                                value={formData.outTime}
                                                onChange={handleInputChange}
                                                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Overtime (Hours)</label>
                                            <input
                                                name="overtime"
                                                type="number"
                                                step="0.5"
                                                value={formData.overtime}
                                                onChange={handleInputChange}
                                                className="w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-black text-blue-600"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        form="attendance-form"
                        className="px-12 py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95"
                    >
                        Save Attendance
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default LaborAttendancePage;
