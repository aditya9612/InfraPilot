import { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface LaborDetail {
    id: number;
    workerName: string;
    aadhaarId: string;
    contractorName: string;
    workType: string;
    wageRate: number;
    joinDate: string;
    performanceScore: number;
    totalDaysPresent: number;
    totalEarnings: number;
    status: "Active" | "Inactive";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockLaborers: LaborDetail[] = [
    {
        id: 1,
        workerName: "Ramesh Kumar",
        aadhaarId: "xxxx-xxxx-1234",
        contractorName: "Varma Constructions",
        workType: "Skilled Mason",
        wageRate: 850,
        joinDate: "2026-01-10",
        performanceScore: 92,
        totalDaysPresent: 78,
        totalEarnings: 66300,
        status: "Active",
    },
    {
        id: 2,
        workerName: "Suresh P.",
        aadhaarId: "xxxx-xxxx-5678",
        contractorName: "Varma Constructions",
        workType: "Helper",
        wageRate: 600,
        joinDate: "2026-02-15",
        performanceScore: 88,
        totalDaysPresent: 45,
        totalEarnings: 27000,
        status: "Active",
    },
    {
        id: 3,
        workerName: "Amit Singh",
        aadhaarId: "xxxx-xxxx-9012",
        contractorName: "Alpha Logistics",
        workType: "Electrician",
        wageRate: 900,
        joinDate: "2026-03-01",
        performanceScore: 75,
        totalDaysPresent: 30,
        totalEarnings: 27000,
        status: "Inactive",
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

const LaborDetailsPage = () => {
    const [laborers] = useState<LaborDetail[]>(mockLaborers);
    const [selectedLaborer, setSelectedLaborer] = useState<LaborDetail | null>(null);

    return (
        <>
            <Navbar
                title="Labor Details"
                breadcrumb={["InfraPilot", "Engineer", "Labor", "Details"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Workforce Directory
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Labor Registry
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Comprehensive database of all site workers, skills, and performance history.
                        </p>
                    </div>
                </div>

                {/* List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {laborers.map((labor) => (
                        <div
                            key={labor.id}
                            className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                        >
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-200">
                                            {labor.workerName.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">{labor.workerName}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{labor.workType}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${labor.status === "Active" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}>
                                        {labor.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-6 py-6 border-y border-slate-50">
                                    <ProfileField label="Contractor" value={labor.contractorName} />
                                    <ProfileField label="Wage Rate" value={`₹${labor.wageRate}/day`} />
                                    <ProfileField label="Join Date" value={labor.joinDate} />
                                    <ProfileField label="Performance" value={`${labor.performanceScore}%`} accent="text-blue-600" />
                                </div>

                                <button
                                    onClick={() => setSelectedLaborer(labor)}
                                    className="w-full py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all"
                                >
                                    View Full Profile Metrics
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Premium Profile Modal */}
            <Modal
                isOpen={!!selectedLaborer}
                onClose={() => setSelectedLaborer(null)}
                title="Labor Profile Details"
                maxWidth="max-w-4xl"
            >
                {selectedLaborer && (
                    <div className="bg-white p-0 italic-none">
                        {/* ── Gradient Banner ────────────────────────────────── */}
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shadow-2xl shadow-blue-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                {/* Square Initials Card */}
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">
                                        {selectedLaborer.workerName.substring(0, 2)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-2xl font-black text-white tracking-tight">
                                            {selectedLaborer.workerName}
                                        </h3>
                                        <span className="px-4 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                                            {selectedLaborer.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg">
                                            <span className="text-amber-400 text-sm">★</span>
                                            <span className="text-xs font-black text-white tracking-wide">{selectedLaborer.performanceScore}.0 Performance</span>
                                        </div>
                                        <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">
                                            ID: LAB-{selectedLaborer.id.toString().padStart(4, '0')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Content Sections ────────────────────────────────── */}
                        <div className="px-12 pb-12 space-y-12">

                            {/* Section 1: Personal Profile */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Personal Profile</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="IDENTITY CARD (AADHAAR)" value={selectedLaborer.aadhaarId} />
                                    <ProfileField label="WORKER CATEGORY" value={selectedLaborer.workType} />
                                    <ProfileField label="EMPLOYING CONTRACTOR" value={selectedLaborer.contractorName} />
                                    <ProfileField label="JOINING DATE" value={selectedLaborer.joinDate} />
                                </div>
                            </div>

                            {/* Section 2: Performance Metrics */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h-2a2 2 0 00-2-2z" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Performance Metrics</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="TOTAL DAYS PRESENT" value={`${selectedLaborer.totalDaysPresent} Days`} />
                                    <ProfileField label="ATTENDANCE RATIO" value={`${Math.round((selectedLaborer.totalDaysPresent / 90) * 100)}%`} accent="text-emerald-600" />
                                    <ProfileField label="WAGE RATE" value={`₹${selectedLaborer.wageRate} / day`} />
                                    <ProfileField label="NET EARNINGS" value={`₹${selectedLaborer.totalEarnings.toLocaleString()}`} accent="text-blue-600" />
                                </div>
                            </div>

                            {/* Section 3: System Status */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">System Outreach</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="SYSTEM STATUS" value="VERIFIED" accent="text-blue-600" />
                                    <ProfileField label="LAST LOGGED" value={new Date().toLocaleDateString()} accent="text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        {/* ── Footer ────────────────────────────────────────── */}
                        <div className="bg-slate-50 px-12 py-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedLaborer(null)}
                                className="px-12 py-3 bg-[#0f172a] hover:bg-black text-white text-[11px] font-black rounded-xl shadow-lg transition-all active:scale-95"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default LaborDetailsPage;
