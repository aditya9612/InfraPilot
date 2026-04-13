import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import PageTransition from "../../components/common/PageTransition";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const todayActivities = [
    {
        id: 1,
        activity: "Column Reinforcement Check",
        description: "Checking reinforcement for columns C1–C15 at the 4th floor.",
        status: "In Progress",
        time: "Started: 09:00 AM",
        statusColor: "bg-blue-100 text-blue-600",
    },
    {
        id: 2,
        activity: "Concrete Pouring – Retaining Wall",
        description: "Pouring M35 grade concrete for the North-side retaining wall.",
        status: "Completed",
        time: "Finished: 02:30 PM",
        statusColor: "bg-emerald-100 text-emerald-600",
    },
    {
        id: 3,
        activity: "Shuttering – 5th Floor Slab",
        description: "Setting formwork for 5th-floor slab casting scheduled tomorrow.",
        status: "Pending",
        time: "ETA: 05:00 PM",
        statusColor: "bg-amber-100 text-amber-600",
    },
];

const materialStock = [
    { material: "Cement (OPC 53)", unit: "Bags", quantity: 480, threshold: 200, status: "OK" },
    { material: "TMT Steel Bars", unit: "MT", quantity: 18, threshold: 20, status: "Low" },
    { material: "Fine Aggregate", unit: "Ton", quantity: 95, threshold: 30, status: "OK" },
    { material: "Coarse Aggregate", unit: "Ton", quantity: 68, threshold: 25, status: "OK" },
    { material: "Ready-Mix Concrete", unit: "Cu.m", quantity: 12, threshold: 15, status: "Low" },
];

const openIssues = [
    { id: "ISS-041", title: "Water seepage – Basement Level 2", priority: "High", raised: "2h ago" },
    { id: "ISS-039", title: "TMT steel quantity below threshold", priority: "High", raised: "5h ago" },
    { id: "ISS-037", title: "Scaffolding damage – Zone C", priority: "Medium", raised: "Yesterday" },
    { id: "ISS-035", title: "Safety netting inspection pending", priority: "Low", raised: "2 days ago" },
];

const priorityColors: Record<string, string> = {
    High: "bg-red-100 text-red-600",
    Medium: "bg-amber-100 text-amber-600",
    Low: "bg-slate-100 text-slate-500",
};

// ─── Main Component ───────────────────────────────────────────────────────────
const EngineerDashboard = () => {
    const [activeTab, setActiveTab] = useState("All");

    // Progress values
    const progressPercent = 68;
    const plannedPercent = 72;
    const variance = progressPercent - plannedPercent;

    // SVG circle math
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (circumference * progressPercent) / 100;

    const filteredIssues =
        activeTab === "All"
            ? openIssues
            : openIssues.filter((i) => i.priority === activeTab);

    return (
        <>
            <Navbar
                title="Site Overview"
                breadcrumb={["InfraPilot", "Engineer", "Dashboard"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        {/* PROJECT NAME */}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Project
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Skyline Tower – Block A
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Real-time site progress, labor, and material monitoring.
                        </p>
                    </div>

                    {/* WEATHER WIDGET */}
                    <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm">
                        <span className="text-3xl">☀️</span>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">
                                Weather – Today
                            </p>
                            <p className="text-sm font-black text-slate-800 tracking-tight">
                                Clear, 32°C
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">
                                Humidity 54% · Wind 12 km/h
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Site Vitals – Stat Cards ────────────────────────────────── */}
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Site Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* Total Labor Today */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Labor Today</p>
                                <p className="text-2xl font-bold text-primary">145</p>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">85 Skilled · 60 Unskilled</p>
                            </div>
                        </div>

                        {/* Active Activities */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Activities</p>
                                <p className="text-2xl font-bold text-blue-500">12</p>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Foundations, Column Casting</p>
                            </div>
                        </div>

                        {/* Material Stock Status */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Material Stock Status</p>
                                <p className="text-2xl font-bold text-emerald-500">OK</p>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">Cement: OK · Steel: Low</p>
                            </div>
                        </div>

                        {/* Open Issues */}
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
                            <div>
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Open Issues</p>
                                <p className="text-2xl font-bold text-rose-500">4</p>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">2 High Priority</p>
                            </div>
                        </div>

                    </div>
                </div>

                {/* ── Main Content Grid ───────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

                    {/* TODAY'S WORK SUMMARY */}
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Today's Work Summary</h2>
                                <p className="text-xs text-slate-400">Live activity log – {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
                            </div>
                            <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                                {todayActivities.filter(a => a.status === "In Progress").length} Live
                            </span>
                        </div>
                        <div className="space-y-4">
                            {todayActivities.map((act) => (
                                <div key={act.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                                    <div className="flex items-start justify-between gap-3 mb-1">
                                        <p className="text-sm font-bold text-slate-700">{act.activity}</p>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded shrink-0 ${act.statusColor}`}>
                                            {act.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3">{act.description}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{act.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* PROGRESS % WIDGET */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">
                            Overall Progress
                        </p>
                        <div className="relative w-40 h-40 flex items-center justify-center overflow-visible">
                            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                <circle
                                    cx="80" cy="80" r={radius}
                                    stroke="currentColor" strokeWidth="12" fill="transparent"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={dashOffset}
                                    strokeLinecap="round"
                                    className="text-primary transition-all duration-1000"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-3xl font-bold text-slate-800">{progressPercent}%</span>
                                <span className="text-[10px] font-bold text-slate-400">Completed</span>
                            </div>
                        </div>
                        <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                            <div className="text-left p-3 bg-slate-50 rounded-xl">
                                <p className="text-[10px] text-slate-400 font-bold">Planned</p>
                                <p className="text-sm font-bold text-slate-700">{plannedPercent}%</p>
                            </div>
                            <div className="text-left p-3 bg-slate-50 rounded-xl">
                                <p className="text-[10px] text-slate-400 font-bold">Variance</p>
                                <p className={`text-sm font-bold ${variance < 0 ? "text-rose-500" : "text-emerald-500"}`}>
                                    {variance > 0 ? "+" : ""}{variance}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default EngineerDashboard;
