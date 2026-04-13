import { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Activity {
    id: number;
    activityName: string;
    boqCode: string;
    plannedQty: number;
    unit: string;
    todayProgress: number;
    totalCompleted: number;
    remainingQty: number;
    percentCompletion: number;
    startDate: string;
    endDate: string;
    status: "On Track" | "Delay";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockActivities: Activity[] = [
    {
        id: 1,
        activityName: "Excavation",
        boqCode: "BOQ-STR-001",
        plannedQty: 5000,
        unit: "Cu.m",
        todayProgress: 120,
        totalCompleted: 3800,
        remainingQty: 1200,
        percentCompletion: 76,
        startDate: "2026-03-01",
        endDate: "2026-04-20",
        status: "On Track",
    },
    {
        id: 2,
        activityName: "RCC Work - Footing",
        boqCode: "BOQ-STR-002",
        plannedQty: 1500,
        unit: "Cu.m",
        todayProgress: 45,
        totalCompleted: 600,
        remainingQty: 900,
        percentCompletion: 40,
        startDate: "2026-03-15",
        endDate: "2026-05-30",
        status: "Delay",
    },
    {
        id: 3,
        activityName: "Brickwork",
        boqCode: "BOQ-ARC-005",
        plannedQty: 2500,
        unit: "Sq.m",
        todayProgress: 0,
        totalCompleted: 0,
        remainingQty: 2500,
        percentCompletion: 0,
        startDate: "2026-05-01",
        endDate: "2026-06-15",
        status: "On Track",
    },
];

// ─── Profile Field Helper (matches reference image style) ─────────────────────

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

// ─── Main Component ────────────────────────────────────────────────────────────

const ActivityListPage = () => {
    const [activities] = useState<Activity[]>(mockActivities);
    const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
    const [filterStatus, setFilterStatus] = useState("All");

    // Summary stats
    const totalActivities = activities.length;
    const delayedActivities = activities.filter(a => a.status === "Delay").length;
    const avgCompletion = Math.round(activities.reduce((sum, a) => sum + a.percentCompletion, 0) / (totalActivities || 1));

    const filteredActivities = filterStatus === "All"
        ? activities
        : activities.filter(a => a.status === filterStatus);

    const filterTabs = ["All", "On Track", "Delay"];

    return (
        <>
            <Navbar
                title="Work Progress"
                breadcrumb={["InfraPilot", "Engineer", "Progress", "Activities"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Project Milestones
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Activity List
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Track and manage site activities, BOQ quantities, and real-time execution status.
                        </p>
                    </div>
                </div>

                {/* ── Summary Stat Cards ───────────────────────────────────── */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Progress Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Activities</p>
                            <p className="text-2xl font-bold text-blue-600">{totalActivities}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Synced with BOQ</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Delayed</p>
                            <p className="text-2xl font-bold text-rose-500">{delayedActivities}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Requires attention</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Avg. Completion</p>
                            <p className="text-2xl font-bold text-emerald-500">{avgCompletion}%</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Across all tasks</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Project Health</p>
                            <p className="text-2xl font-bold text-blue-600">Stable</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Updated 2h ago</p>
                        </div>
                    </div>
                </div>

                {/* ── Activity Ledger ────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Activity Ledger
                    </h2>
                    <div className="flex bg-white p-1 rounded-xl border border-slate-100 shadow-sm">
                        {filterTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilterStatus(tab)}
                                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filterStatus === tab ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-slate-600"}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {filteredActivities.map((activity) => (
                        <div
                            key={activity.id}
                            className="group bg-white rounded-3xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
                        >
                            <div className="flex flex-col gap-8">
                                {/* Row 1: Identity & Status */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                                    {activity.activityName}
                                                </h3>
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${activity.status === "On Track"
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    : "bg-rose-50 text-rose-600 border-rose-100"}`}
                                                >
                                                    {activity.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    BOQ: {activity.boqCode}
                                                </span>
                                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    ID: ACT-{activity.id.toString().padStart(4, '0')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Timeline Status</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-xs font-black text-slate-800">{activity.percentCompletion}% Completed</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Metrics Grid */}
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-y-8 gap-x-12 py-8 border-y border-slate-50 italic-none">
                                    <ProfileField label="Planned Quantity" value={`${activity.plannedQty} ${activity.unit}`} />
                                    <ProfileField label="Today's Progress" value={`+${activity.todayProgress} ${activity.unit}`} accent="text-blue-600" />
                                    <ProfileField label="Total Completed" value={`${activity.totalCompleted} ${activity.unit}`} accent="text-emerald-600" />
                                    <ProfileField label="Remaining Quantity" value={`${activity.remainingQty} ${activity.unit}`} accent="text-rose-600" />
                                    <ProfileField label="Execution %" value={`${activity.percentCompletion}%`} />
                                </div>

                                {/* Row 3: Timelines & Schedule */}
                                <div className="flex flex-wrap items-center justify-between gap-6">
                                    <div className="flex items-center gap-12">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 uppercase text-[8px] font-bold tracking-widest leading-none">START</div>
                                            <ProfileField label="Start Date" value={activity.startDate} />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 rounded-lg text-slate-400 uppercase text-[8px] font-bold tracking-widest leading-none">FINISH</div>
                                            <ProfileField label="Planned End" value={activity.endDate} />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedActivity(activity)}
                                        className="flex items-center gap-2 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest transition-colors group"
                                    >
                                        View Full Metrics
                                        <svg className="w-3 h-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* ── Activity Detail Modal ────────────────────────────────────── */}
            <Modal
                isOpen={!!selectedActivity}
                onClose={() => setSelectedActivity(null)}
                title="Activity Full Metrics"
                maxWidth="max-w-4xl"
            >
                {selectedActivity && (
                    <div className="bg-white p-0 italic-none">
                        {/* ── Gradient Banner ────────────────────────────────── */}
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 shadow-2xl shadow-blue-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                {/* Square Initials Card */}
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-3xl border border-white/30 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">
                                        {selectedActivity.activityName.substring(0, 2)}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-2xl font-black text-white tracking-tight">
                                            {selectedActivity.activityName}
                                        </h3>
                                        <span className="px-4 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                                            {selectedActivity.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-lg">
                                            <span className="text-amber-400 text-sm">★</span>
                                            <span className="text-xs font-black text-white tracking-wide">{selectedActivity.percentCompletion}% Performance</span>
                                        </div>
                                        <p className="text-xs font-bold text-blue-100 uppercase tracking-widest">
                                            ID: ACT-{selectedActivity.id.toString().padStart(4, '0')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Content Sections ────────────────────────────────── */}
                        <div className="px-12 pb-12 space-y-12">

                            {/* Section 1: Activity Context */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Activity Context</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="LEGAL BOQ CODE" value={selectedActivity.boqCode} />
                                    <ProfileField label="UNIT OF MEASURE" value={selectedActivity.unit} />
                                    <ProfileField label="PLANNED QUANTITY" value={`${selectedActivity.plannedQty} ${selectedActivity.unit}`} />
                                    <ProfileField label="REMAINING BALANCE" value={`${selectedActivity.remainingQty} ${selectedActivity.unit}`} />
                                </div>
                            </div>

                            {/* Section 2: Execution Metrics */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Execution & Timing</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="TOTAL COMPLETED" value={`${selectedActivity.totalCompleted} ${selectedActivity.unit}`} />
                                    <ProfileField label="EXECUTION SCORE" value={`${selectedActivity.percentCompletion}%`} />
                                    <ProfileField label="KICK-OFF DATE" value={selectedActivity.startDate} />
                                    <ProfileField label="TARGET FINISH" value={selectedActivity.endDate} />
                                </div>
                            </div>

                            {/* Section 3: Outreach / Meta */}
                            <div>
                                <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-3">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Progress Outreach</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                                    <ProfileField label="LAST RECORDED" value={`+${selectedActivity.todayProgress} ${selectedActivity.unit}`} accent="text-blue-600" />
                                    <ProfileField label="SYSTEM STATUS" value="ACTIVE / SYNCED" accent="text-emerald-600" />
                                </div>
                            </div>
                        </div>

                        {/* ── Footer ────────────────────────────────────────── */}
                        <div className="bg-slate-50 px-12 py-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedActivity(null)}
                                className="px-10 py-3 bg-[#0f172a] hover:bg-black text-white text-[11px] font-black rounded-xl shadow-lg transition-all active:scale-95"
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

export default ActivityListPage;
