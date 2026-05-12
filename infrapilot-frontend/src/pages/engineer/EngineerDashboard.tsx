import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";

// ─── Mock Data ────────────────────────────────────────────────────────────────

const todayActivities = [
    { id: 1, activity: "Column Reinforcement Check", description: "Checking reinforcement for columns C1–C15 at the 4th floor.", status: "In Progress", time: "Started: 09:00 AM", statusColor: "bg-blue-100 text-blue-600" },
    { id: 2, activity: "Concrete Pouring – Retaining Wall", description: "Pouring M35 grade concrete for the North-side retaining wall.", status: "Completed", time: "Finished: 02:30 PM", statusColor: "bg-emerald-100 text-emerald-600" },
    { id: 3, activity: "Shuttering – 5th Floor Slab", description: "Setting formwork for 5th-floor slab casting scheduled tomorrow.", status: "Pending", time: "ETA: 05:00 PM", statusColor: "bg-amber-100 text-amber-600" },
];

const siteExpenses = [
    { id: 1, date: "2026-04-29", type: "Labour", category: "Skilled", amount: 48500, note: "Reinforcement workers – 5 days" },
    { id: 2, date: "2026-04-28", type: "Material", category: "Concrete", amount: 125000, note: "M35 concrete supply – 50 cum" },
    { id: 3, date: "2026-04-27", type: "Equipment", category: "Machinery", amount: 18000, note: "Transit mixer rental – 2 days" },
    { id: 4, date: "2026-04-26", type: "Material", category: "Steel", amount: 87500, note: "Fe500 TMT bars – 5 MT" },
    { id: 5, date: "2026-04-25", type: "Labour", category: "Unskilled", amount: 21000, note: "Earthwork helpers – 3 days" },
];

const expenseCategoryColors: Record<string, string> = {
    Labour: "bg-blue-50 text-blue-600",
    Material: "bg-emerald-50 text-emerald-600",
    Equipment: "bg-amber-50 text-amber-600",
};

const timelinePhases = [
    { id: 1, phase: "Site Preparation & Survey", start: "Jan 2026", end: "Feb 2026", progress: 100, status: "Completed" },
    { id: 2, phase: "Foundation & Excavation", start: "Feb 2026", end: "Mar 2026", progress: 100, status: "Completed" },
    { id: 3, phase: "Structural Framework – G+2", start: "Mar 2026", end: "May 2026", progress: 68, status: "In Progress" },
    { id: 4, phase: "External Brickwork & Plaster", start: "May 2026", end: "Jul 2026", progress: 0, status: "Upcoming" },
    { id: 5, phase: "MEP & Finishing Works", start: "Jul 2026", end: "Sep 2026", progress: 0, status: "Upcoming" },
    { id: 6, phase: "Handover & Inspection", start: "Sep 2026", end: "Oct 2026", progress: 0, status: "Upcoming" },
];

const phaseStatusStyle: Record<string, string> = {
    Completed: "bg-emerald-100 text-emerald-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Upcoming: "bg-slate-100 text-slate-500",
};

const workProgressItems = [
    { label: "Structural Work", planned: 72, actual: 68, color: "bg-blue-500" },
    { label: "Masonry & Brickwork", planned: 40, actual: 35, color: "bg-indigo-500" },
    { label: "Plumbing", planned: 20, actual: 22, color: "bg-cyan-500" },
    { label: "Electrical", planned: 15, actual: 10, color: "bg-amber-500" },
    { label: "Finishing", planned: 5, actual: 0, color: "bg-rose-400" },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const EngineerDashboard = () => {
    const overallProgress = 68;
    const plannedPercent = 72;
    const variance = overallProgress - plannedPercent;

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (circumference * overallProgress) / 100;

    const totalExpenses = siteExpenses.reduce((sum, e) => sum + e.amount, 0);

    return (
        <>
            <Navbar title="Site Overview" breadcrumb={["InfraPilot", "Engineer", "Dashboard"]} />

            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Project</p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Skyline Tower – Block A</h1>
                        <p className="text-slate-500 text-sm">Real-time site progress, labor, and material monitoring.</p>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm">
                        <span className="text-3xl">☀️</span>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Weather – Today</p>
                            <p className="text-sm font-black text-slate-800 tracking-tight">Clear, 32°C</p>
                            <p className="text-[10px] text-slate-400 font-medium">Humidity 54% · Wind 12 km/h</p>
                        </div>
                    </div>
                </div>

                {/* ── Site Vitals ───────────────────────────────────────────── */}
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Site Vitals</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Labor Today"
                            value="145"
                            sub="85 Skilled · 60 Unskilled"
                            accent="text-primary"
                        />
                        <StatCard
                            title="Active Activities"
                            value="12"
                            sub="Foundations, Column Casting"
                            accent="text-blue-500"
                        />
                        <StatCard
                            title="Material Stock Status"
                            value="OK"
                            sub="Cement: OK · Steel: Low"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Open Issues"
                            value="4"
                            sub="2 High Priority"
                            accent="text-rose-500"
                        />
                    </div>
                </div>

                {/* ── Today's Work + Progress Circle ────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Today's Work Summary</h2>
                                <p className="text-xs text-slate-400">Live activity log – {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
                            </div>
                            <span className="w-fit px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                                {todayActivities.filter(a => a.status === "In Progress").length} Live
                            </span>
                        </div>
                        <div className="space-y-4">
                            {todayActivities.map((act) => (
                                <div key={act.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                                        <p className="text-sm font-bold text-slate-700">{act.activity}</p>
                                        <span className={`w-fit px-2 py-0.5 text-[10px] font-bold rounded shrink-0 ${act.statusColor}`}>{act.status}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{act.description}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{act.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Overall Progress</p>
                        <div className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center overflow-visible">
                            <svg className="w-full h-full transform -rotate-90 overflow-visible" viewBox="0 0 160 160">
                                <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100" />
                                <circle cx="80" cy="80" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={circumference} strokeDashoffset={dashOffset} strokeLinecap="round" className="text-primary transition-all duration-1000" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl md:text-3xl font-bold text-slate-800">{overallProgress}%</span>
                                <span className="text-[9px] md:text-[10px] font-bold text-slate-400">Completed</span>
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

                {/* ══════════════════════════════════════════════════════════════
                    NEW FEATURE 1: Work Progress %
                ══════════════════════════════════════════════════════════════ */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Work Progress %</h2>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Discipline-wise Completion</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Actual vs. planned progress per work category</p>
                            </div>
                            <span className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-black rounded-xl uppercase tracking-widest">
                                {overallProgress}% Overall
                            </span>
                        </div>
                        <div className="space-y-5">
                            {workProgressItems.map((item) => (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-sm font-bold text-slate-700">{item.label}</p>
                                        <div className="flex items-center gap-3 text-[11px] font-bold">
                                            <span className="text-slate-400">Planned: <span className="text-slate-600">{item.planned}%</span></span>
                                            <span className={item.actual >= item.planned ? "text-emerald-600" : "text-rose-500"}>
                                                Actual: {item.actual}%
                                            </span>
                                        </div>
                                    </div>
                                    {/* Planned track */}
                                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="absolute inset-0 bg-slate-200 rounded-full" style={{ width: `${item.planned}%` }} />
                                        <div className={`absolute inset-0 h-full rounded-full transition-all duration-700 ${item.color}`} style={{ width: `${item.actual}%` }} />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[9px] text-slate-300 font-bold">0%</span>
                                        <span className="text-[9px] text-slate-300 font-bold">100%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-5 mt-6 pt-5 border-t border-slate-50">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-200" /><span className="text-[10px] font-bold text-slate-400">Planned</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-primary" /><span className="text-[10px] font-bold text-slate-400">Actual</span></div>
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    NEW FEATURE 2: Timeline Tracking
                ══════════════════════════════════════════════════════════════ */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Timeline Tracking</h2>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Project Phase Timeline</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Milestone progress and completion status</p>
                            </div>
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-black rounded-xl uppercase tracking-widest">
                                {timelinePhases.filter(p => p.status === "Completed").length}/{timelinePhases.length} Phases Done
                            </span>
                        </div>
                        <div className="space-y-4">
                            {timelinePhases.map((phase, index) => (
                                <div key={phase.id} className="flex gap-4 items-start">
                                    {/* Step indicator */}
                                    <div className="flex flex-col items-center shrink-0">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 ${phase.status === "Completed" ? "bg-emerald-500 border-emerald-500 text-white" : phase.status === "In Progress" ? "bg-primary border-primary text-white" : "bg-white border-slate-200 text-slate-400"}`}>
                                            {phase.status === "Completed" ? (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                            ) : (
                                                <span>{index + 1}</span>
                                            )}
                                        </div>
                                        {index < timelinePhases.length - 1 && (
                                            <div className={`w-0.5 h-8 mt-1 ${phase.status === "Completed" ? "bg-emerald-200" : "bg-slate-100"}`} />
                                        )}
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 pb-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{phase.phase}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">{phase.start} → {phase.end}</p>
                                            </div>
                                            <span className={`w-fit px-2 py-0.5 text-[10px] font-black rounded-lg uppercase tracking-widest shrink-0 ${phaseStatusStyle[phase.status]}`}>
                                                {phase.status}
                                            </span>
                                        </div>
                                        {phase.status !== "Upcoming" && (
                                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-2">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ${phase.status === "Completed" ? "bg-emerald-400" : "bg-primary"}`}
                                                    style={{ width: `${phase.progress}%` }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════
                    NEW FEATURE 3: Site-wise Expense Tracking
                ══════════════════════════════════════════════════════════════ */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Site-wise Expense Tracking</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {/* Summary Header */}
                        <div className="p-6 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Expense Register</h3>
                                <p className="text-xs text-slate-400 mt-0.5">All site-related expenditure records</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Spent</p>
                                    <p className="text-xl font-black text-slate-800">
                                        ₹{totalExpenses.toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Category Summary Pills */}
                        <div className="flex flex-wrap gap-3 px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                            {["Labour", "Material", "Equipment"].map((cat) => {
                                const catTotal = siteExpenses.filter(e => e.type === cat).reduce((s, e) => s + e.amount, 0);
                                return (
                                    <div key={cat} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${expenseCategoryColors[cat]}`}>
                                        <span>{cat}</span>
                                        <span className="font-black">₹{catTotal.toLocaleString("en-IN")}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Expense Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-slate-50">
                                        <th className="px-6 py-4 text-left">Date</th>
                                        <th className="px-6 py-4 text-left">Type</th>
                                        <th className="px-6 py-4 text-left">Category</th>
                                        <th className="px-6 py-4 text-left">Note</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {siteExpenses.map((expense) => (
                                        <tr key={expense.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500 tabular-nums whitespace-nowrap">{expense.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg uppercase tracking-widest ${expenseCategoryColors[expense.type]}`}>
                                                    {expense.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-600">{expense.category}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500">{expense.note}</td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-slate-800 tabular-nums">
                                                ₹{expense.amount.toLocaleString("en-IN")}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-slate-100 bg-slate-50">
                                        <td colSpan={4} className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Total Expenditure</td>
                                        <td className="px-6 py-4 text-right text-base font-black text-primary tabular-nums">
                                            ₹{totalExpenses.toLocaleString("en-IN")}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>

            </PageTransition>
        </>
    );
};

export default EngineerDashboard;
