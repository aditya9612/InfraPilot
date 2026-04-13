import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DailyEntry {
    id: number;
    date: string;
    activityName: string;
    boqCode: string;
    progress: number;
    unit: string;
    plannedQty: number;
    totalCompleted: number;
    remainingQty: number;
    percentCompletion: number;
    startDate: string;
    endDate: string;
    status: "On Track" | "Delay";
    remarks: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockDailyEntries: DailyEntry[] = [
    {
        id: 101,
        date: "2026-04-13",
        activityName: "Excavation",
        boqCode: "BOQ-STR-001",
        progress: 120,
        unit: "Cu.m",
        plannedQty: 5000,
        totalCompleted: 3800,
        remainingQty: 1200,
        percentCompletion: 76,
        startDate: "2026-03-01",
        endDate: "2026-04-20",
        status: "On Track",
        remarks: "Work speed optimal. Soil condition stable.",
    },
    {
        id: 102,
        date: "2026-04-13",
        activityName: "RCC Work - Footing",
        boqCode: "BOQ-STR-002",
        progress: 45,
        unit: "Cu.m",
        plannedQty: 1500,
        totalCompleted: 600,
        remainingQty: 900,
        percentCompletion: 40,
        startDate: "2026-03-15",
        endDate: "2026-05-30",
        status: "Delay",
        remarks: "Slight delay due to pump maintenance.",
    },
];

const initialFormData = {
    activityName: "",
    boqCode: "",
    plannedQty: "",
    todayProgress: "",
    totalCompleted: "",
    remainingQty: "",
    percentCompletion: "",
    startDate: "",
    endDate: "",
    status: "On Track" as "On Track" | "Delay",
    remarks: "",
};

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

const DailyProgressEntryPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [dailyEntries, setDailyEntries] = useState<DailyEntry[]>(mockDailyEntries);
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
        if (!formData.activityName) newErrors.activityName = "Required";
        if (!formData.boqCode) newErrors.boqCode = "Required";
        if (!formData.todayProgress) newErrors.todayProgress = "Required";
        if (!formData.plannedQty) newErrors.plannedQty = "Required";
        if (!formData.startDate) newErrors.startDate = "Required";
        if (!formData.endDate) newErrors.endDate = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        const newEntry: DailyEntry = {
            id: Date.now(),
            date: new Date().toISOString().split("T")[0],
            activityName: formData.activityName,
            boqCode: formData.boqCode,
            progress: parseFloat(formData.todayProgress),
            unit: "Cu.m",
            plannedQty: parseFloat(formData.plannedQty),
            totalCompleted: parseFloat(formData.totalCompleted) || 0,
            remainingQty: parseFloat(formData.remainingQty) || 0,
            percentCompletion: parseFloat(formData.percentCompletion) || 0,
            startDate: formData.startDate,
            endDate: formData.endDate,
            status: formData.status,
            remarks: formData.remarks || "Work Recorded.",
        };

        setDailyEntries((prev) => [newEntry, ...prev]);
        toast.success("Progress Recorded Successfully!");
        setIsFormModalOpen(false);
        setFormData(initialFormData);
        setErrors({});
    };

    return (
        <>
            <Navbar
                title="Daily Progress Entry"
                breadcrumb={["InfraPilot", "Engineer", "Progress", "Entry"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Operational Documentation
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Daily Progress Entry
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Submit and review daily executed quantities and operational site events.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-blue-200 transition-all active:scale-95"
                    >
                        <span className="text-xl leading-none">+</span>
                        New Progress Entry
                    </button>
                </div>

                {/* ── Summary Stats ────────────────────────────────────────── */}
                <div className="mb-8 overflow-x-auto">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Status Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 min-w-[200px]">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Entries</p>
                            <p className="text-2xl font-bold text-blue-600">{dailyEntries.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">+2 Recorded Today</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg. Today's Progress</p>
                            <p className="text-2xl font-bold text-blue-600">82.5 <span className="text-sm">Cu.m</span></p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Site</p>
                            <p className="text-2xl font-bold text-slate-800">C-64</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 text-center">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Weather</p>
                            <p className="text-2xl font-bold text-amber-500">Sunny ☀️</p>
                        </div>
                    </div>
                </div>

                {/* ── Entry Ledger ───────────────────────────────────────────── */}
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Daily Entry Ledger
                    </h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {dailyEntries.map((entry) => (
                        <div
                            key={entry.id}
                            className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-black text-slate-900 tracking-tight">
                                            {entry.activityName}
                                        </h3>
                                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${entry.status === "On Track" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                                            {entry.status}
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        {entry.date}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                    <ProfileField label="BOQ Code" value={entry.boqCode} />
                                    <ProfileField label="Quantity Recorded" value={`+${entry.progress} ${entry.unit}`} accent="text-blue-600" />
                                    <ProfileField label="Total Progress" value={`${entry.percentCompletion}%`} />
                                    <ProfileField label="Remaining Qty" value={`${entry.remainingQty} ${entry.unit}`} accent="text-rose-500" />
                                </div>

                                <div className="pt-4 border-t border-slate-50">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Site Remarks</p>
                                    <p className="text-xs font-semibold text-slate-500">{entry.remarks}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Modal Form - Sectioned DSR Style */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title="Log Daily Progress"
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-8">
                    <form id="progress-form" onSubmit={handleSubmit} className="space-y-12 italic-none">

                        {/* Section 1: Activity Context */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Activity Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Activity Name *</label>
                                    <select
                                        name="activityName"
                                        value={formData.activityName}
                                        onChange={handleInputChange}
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all appearance-none cursor-pointer ${errors.activityName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    >
                                        <option value="">Select Activity</option>
                                        <option value="Excavation">Excavation</option>
                                        <option value="RCC Work">RCC Work</option>
                                        <option value="Brickwork">Brickwork</option>
                                    </select>
                                    {errors.activityName && <p className="text-[9px] font-bold text-rose-500 px-1">{errors.activityName}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">BOQ Code *</label>
                                    <input
                                        name="boqCode"
                                        value={formData.boqCode}
                                        onChange={handleInputChange}
                                        placeholder="BOQ-STR-001"
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all ${errors.boqCode ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.boqCode && <p className="text-[9px] font-bold text-rose-500 px-1">{errors.boqCode}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Progress Metrics */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Execution Metrics</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Planned Qty *</label>
                                    <input
                                        name="plannedQty"
                                        type="number"
                                        value={formData.plannedQty}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all ${errors.plannedQty ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Today's Progress *</label>
                                    <input
                                        name="todayProgress"
                                        type="number"
                                        value={formData.todayProgress}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        className={`w-full px-5 py-4 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-black text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all ${errors.todayProgress ? "border-rose-300 bg-rose-50" : ""}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Status</label>
                                    <div className="grid grid-cols-2 gap-2 h-full">
                                        {(["On Track", "Delay"] as const).map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, status: s }))}
                                                className={`py-3.5 rounded-2xl text-[10px] font-black transition-all border ${formData.status === s ? (s === "On Track" ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-100" : "bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-100") : "bg-slate-50 text-slate-400 border-slate-200 hover:border-slate-300"}`}
                                            >
                                                {s.toUpperCase()}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Start Date *</label>
                                    <input
                                        name="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={handleInputChange}
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all ${errors.startDate ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">End Date *</label>
                                    <input
                                        name="endDate"
                                        type="date"
                                        value={formData.endDate}
                                        onChange={handleInputChange}
                                        className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all ${errors.endDate ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">% Completion</label>
                                    <div className="relative">
                                        <input
                                            name="percentCompletion"
                                            type="number"
                                            value={formData.percentCompletion}
                                            onChange={handleInputChange}
                                            placeholder="0"
                                            className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                        />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Final Details */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Operational Remarks</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Total Completed Qty</label>
                                    <input
                                        name="totalCompleted"
                                        type="number"
                                        value={formData.totalCompleted}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Remaining Quantity</label>
                                    <input
                                        name="remainingQty"
                                        type="number"
                                        value={formData.remainingQty}
                                        onChange={handleInputChange}
                                        placeholder="0.00"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all"
                                    />
                                </div>
                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Site Notes / Remarks</label>
                                    <textarea
                                        name="remarks"
                                        rows={4}
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                        placeholder="Enter any soil conditions, material issues, or site notes…"
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between mt-auto">
                    <button
                        type="button"
                        onClick={() => { setIsFormModalOpen(false); setErrors({}); }}
                        className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-all"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="submit"
                        form="progress-form"
                        className="px-12 py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95"
                    >
                        Save Progress Entry
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default DailyProgressEntryPage;
