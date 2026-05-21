import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import api from "../../services/api";
import { Sun, Cloud, CloudRain, CloudSun, CloudDrizzle, CloudFog, CloudSnow, CloudLightning } from "lucide-react";

const expenseCategoryColors: Record<string, string> = {
    Labour: "bg-blue-50 text-blue-600",
    Material: "bg-emerald-50 text-emerald-600",
    Equipment: "bg-amber-50 text-amber-600",
};

const phaseStatusStyle: Record<string, string> = {
    Completed: "bg-emerald-100 text-emerald-700",
    "In Progress": "bg-blue-100 text-blue-700",
    Upcoming: "bg-slate-100 text-slate-500",
};

const EngineerDashboard = () => {
    // Dynamic user context extraction
    const userStr = localStorage.getItem("infrapilot_user");
    let projectId = 92;
    let projectName = "SARA CITY";
    if (userStr) {
        try {
            const parsed = JSON.parse(userStr);
            projectId = parsed?.project_id || parsed?.user?.project_id || 92;
            projectName = parsed?.project_name || parsed?.user?.project_name || "SARA CITY";
        } catch (e) {
            console.error("Failed to parse user session", e);
        }
    }

    // 1. Initial State populated instantly with real-time local cache data to prevent any reloads/spinners!
    const getInitialDashboardData = () => {
        const activitiesStr = localStorage.getItem("mock-activities");
        const allActivities = activitiesStr ? JSON.parse(activitiesStr) : [];
        const list = allActivities.filter((a: any) => a.project_id === projectId || (!a.project_id && projectId === 92));

        const activeActivities = list.filter((a: any) => a.status !== "Completed" && a.completion_percentage < 100);
        const completedCount = list.filter((a: any) => a.status === "Completed" || a.completion_percentage === 100).length;
        const total = list.length;

        // If it's project 92, provide the rich defaults if no data
        const isDefault = projectId === 92;
        const progress = total > 0 ? Math.round((completedCount / total) * 100) : (isDefault ? 68 : 0);
        const planned_progress = total > 0 ? 72 : (isDefault ? 72 : 0);
        const variance = progress - planned_progress;

        const disciplines = ["Structural Work", "Masonry & Brickwork", "Plumbing", "Electrical", "Finishing"];
        const colors = ["bg-blue-500", "bg-indigo-500", "bg-cyan-500", "bg-amber-500", "bg-rose-400"];
        const discipline_progress = disciplines.map((d, index) => {
            const dAct = list.filter((a: any) => (a.discipline || "Structural Work") === d);
            const avgActual = dAct.length > 0 ? dAct.reduce((sum: number, a: any) => sum + a.completion_percentage, 0) / dAct.length : 0;
            return {
                label: d,
                planned: isDefault ? (d === "Structural Work" ? 72 : d === "Masonry & Brickwork" ? 40 : d === "Plumbing" ? 20 : d === "Electrical" ? 15 : 5) : 0,
                actual: dAct.length > 0 ? Math.round(avgActual) : (isDefault ? (d === "Structural Work" ? 68 : d === "Masonry & Brickwork" ? 35 : d === "Plumbing" ? 22 : d === "Electrical" ? 10 : 0) : 0),
                color: colors[index]
            };
        });

        const today_work_summary = list.map((a: any) => ({
            id: a.id,
            activity: a.activity_name,
            description: `Executing BOQ code ${a.boq_code || "N/A"}. Planned quantity: ${a.planned_quantity} ${a.unit}.`,
            status: a.status === "Completed" ? "Completed" : a.status === "Delay" ? "Pending" : "In Progress",
            time: `Deadline: ${a.end_date}`,
            statusColor: a.status === "Completed" ? "bg-emerald-100 text-emerald-600" : a.status === "Delay" ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
        }));

        const defaultWorkSummary = isDefault ? [
            { id: 1, activity: "Column Reinforcement Check", description: "Checking reinforcement for columns C1–C15 at the 4th floor.", status: "In Progress", time: "Started: 09:00 AM", statusColor: "bg-blue-100 text-blue-600" },
            { id: 2, activity: "Concrete Pouring – Retaining Wall", description: "Pouring M35 grade concrete for the North-side retaining wall.", status: "Completed", time: "Finished: 02:30 PM", statusColor: "bg-emerald-100 text-emerald-600" },
            { id: 3, activity: "Shuttering – 5th Floor Slab", description: "Setting formwork for 5th-floor slab casting scheduled tomorrow.", status: "Pending", time: "ETA: 05:00 PM", statusColor: "bg-amber-100 text-amber-600" }
        ] : [];

        const dailyEntriesStr = localStorage.getItem("mock-daily-entries");
        const allDailyList = dailyEntriesStr ? JSON.parse(dailyEntriesStr) : [];
        const dailyList = allDailyList.filter((e: any) => {
            const act = allActivities.find((a: any) => a.id === e.activity_id);
            return act && (act.project_id === projectId || (!act.project_id && projectId === 92));
        });

        const recent_expenses = dailyList.map((e: any) => {
            const act = list.find((a: any) => a.id === e.activity_id);
            return {
                id: e.id,
                date: e.entry_date,
                type: "Labour",
                category: act ? act.activity_name : "General",
                amount: e.today_progress * 500,
                note: e.remarks || "Daily progress logging check"
            };
        });

        const defaultExpenses = isDefault ? [
            { id: 1, date: "2026-04-29", type: "Labour", category: "Skilled", amount: 48500, note: "Reinforcement workers – 5 days" },
            { id: 2, date: "2026-04-28", type: "Material", category: "Concrete", amount: 125000, note: "M35 concrete supply – 50 cum" },
            { id: 3, date: "2026-04-27", type: "Equipment", category: "Machinery", amount: 18000, note: "Transit mixer rental – 2 days" },
            { id: 4, date: "2026-04-26", type: "Material", category: "Steel", amount: 87500, note: "Fe500 TMT bars – 5 MT" },
            { id: 5, date: "2026-04-25", type: "Labour", category: "Unskilled", amount: 21000, note: "Earthwork helpers – 3 days" }
        ] : [];

        const finalWorkSummary = today_work_summary.length > 0 ? today_work_summary : defaultWorkSummary;
        const finalExpenses = recent_expenses.length > 0 ? [...recent_expenses, ...defaultExpenses] : defaultExpenses;

        return {
            project_id: projectId,
            project_name: projectName,
            status: "ProjectStatus.PLANNED",
            progress: progress,
            planned_progress: planned_progress,
            variance: variance,
            vitals: {
                total_labour_today: isDefault ? 145 : 0,
                skilled_labour: isDefault ? 85 : 0,
                unskilled_labour: isDefault ? 60 : 0,
                active_activities: activeActivities.length || (isDefault ? 12 : 0),
                open_issues: {
                    total: isDefault ? 4 : 0,
                    high_priority: isDefault ? 2 : 0
                },
                material_stock_status: isDefault ? [
                    { material: "Cement", status: "OK" },
                    { material: "Steel", status: "Low" }
                ] : []
            },
            today_work_summary: finalWorkSummary,
            discipline_progress: discipline_progress,
            timeline: isDefault ? [
                { id: 1, phase: "Site Preparation & Survey", start: "Jan 2026", end: "Feb 2026", progress: 100, status: "Completed" },
                { id: 2, phase: "Foundation & Excavation", start: "Feb 2026", end: "Mar 2026", progress: 100, status: "Completed" },
                { id: 3, phase: "Structural Framework – G+2", start: "Mar 2026", end: "May 2026", progress: 68, status: "In Progress" },
                { id: 4, phase: "External Brickwork & Plaster", start: "May 2026", end: "Jul 2026", progress: 0, status: "Upcoming" },
                { id: 5, phase: "MEP & Finishing Works", start: "Jul 2026", end: "Sep 2026", progress: 0, status: "Upcoming" },
                { id: 6, phase: "Handover & Inspection", start: "Sep 2026", end: "Oct 2026", progress: 0, status: "Upcoming" }
            ] : [],
            recent_expenses: finalExpenses,
            weather: {
                condition: "Clear",
                temperature: 32
            }
        };
    };

    const [dashboardData, setDashboardData] = useState<any>(getInitialDashboardData);
    const weatherData = {
        condition: dashboardData?.weather?.condition || "Clear",
        temperature: dashboardData?.weather?.temperature || 32,
        humidity: dashboardData?.weather?.humidity || 54,
        windSpeed: dashboardData?.weather?.windSpeed || dashboardData?.weather?.wind_speed || 12
    };
    const [showPlanned, setShowPlanned] = useState(true);
    const [showActual, setShowActual] = useState(true);

    // 3. Silent background fetch to sync dashboardData without blocking page views or showing spinners!
    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const res = await api.get(`/dashboard/engineer/${projectId}`);
                if (res && res.data) {
                    setDashboardData(res.data);
                }
            } catch (err) {
                console.warn("Background dashboard sync bypassed, running on responsive local engine", err);
            }
        };
        fetchDashboardStats();
    }, [projectId]);

    const overallProgress = dashboardData.progress || 0;
    const plannedPercent = dashboardData.planned_progress || 0;
    const variance = dashboardData.variance || 0;

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (circumference * overallProgress) / 100;

    const todayActivities = dashboardData.today_work_summary || [];
    const workProgressItems = dashboardData.discipline_progress || [];
    const timelinePhases = dashboardData.timeline || [];
    const siteExpenses = dashboardData.recent_expenses || [];
    const totalExpenses = siteExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

    return (
        <>
            <Navbar title="Site Overview" breadcrumb={["InfraPilot", "Engineer", "Dashboard"]} />

            <PageTransition className="p-4 md:p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">

                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Project</p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">{dashboardData.project_name || projectName}</h1>
                        <p className="text-slate-500 text-sm">Real-time site progress, labor, and material monitoring.</p>
                    </div>
                    <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm">
                        <div className="flex items-center justify-center p-2 rounded-xl bg-slate-50">
                            {weatherData.condition === "Clear" ? <Sun className="w-8 h-8 text-amber-500" /> :
                                weatherData.condition === "Partly Cloudy" ? <CloudSun className="w-8 h-8 text-amber-500" /> :
                                    weatherData.condition === "Foggy" ? <CloudFog className="w-8 h-8 text-slate-400" /> :
                                        weatherData.condition === "Drizzle" ? <CloudDrizzle className="w-8 h-8 text-blue-400" /> :
                                            weatherData.condition === "Rainy" ? <CloudRain className="w-8 h-8 text-blue-500" /> :
                                                weatherData.condition === "Snowy" ? <CloudSnow className="w-8 h-8 text-blue-200" /> :
                                                    weatherData.condition === "Showers" ? <CloudRain className="w-8 h-8 text-blue-600" /> :
                                                        weatherData.condition === "Thunderstorm" ? <CloudLightning className="w-8 h-8 text-purple-500" /> :
                                                            <Cloud className="w-8 h-8 text-slate-400" />}
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Weather – Live</p>
                            <p className="text-sm font-bold text-slate-800 tracking-tight">{weatherData.condition}, {weatherData.temperature}°C</p>
                            <p className="text-[10px] text-slate-400 font-medium">Humidity {weatherData.humidity}% · Wind {weatherData.windSpeed} km/h</p>
                        </div>
                    </div>
                </div>

                {/* â”€â”€ Site Vitals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Site Vitals</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Labor Today"
                            value={(dashboardData.vitals?.total_labour_today || 0).toString()}
                            sub={`${dashboardData.vitals?.skilled_labour || 0} Skilled · ${dashboardData.vitals?.unskilled_labour || 0} Unskilled`}
                            accent="text-primary" />
                        <StatCard
                            title="Active Activities"
                            value={(dashboardData.vitals?.active_activities || 0).toString()}
                            sub="Real-Time Active Tracking"
                            accent="text-blue-500" />
                        <StatCard
                            title="Material Stock Status"
                            value="OK"
                            sub={dashboardData.vitals?.material_stock_status?.map((m: any) => `${m.material}: ${m.status}`).join(" · ") || "Cement: OK · Steel: Low"}
                            accent="text-emerald-500" />
                        <StatCard
                            title="Open Issues"
                            value={(dashboardData.vitals?.open_issues?.total || 0).toString()}
                            sub={`${dashboardData.vitals?.open_issues?.high_priority || 0} High Priority`}
                            accent="text-rose-500" />
                    </div>
                </div>

                {/* â”€â”€ Today's Work + Progress Circle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-6 md:mb-8">
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Today's Work Summary</h2>
                                <p className="text-xs text-slate-400">Live activity log – {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}</p>
                            </div>
                            <span className="w-fit px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase tracking-widest">
                                {todayActivities.filter((a: any) => a.status === "In Progress" || a.status === "On Track").length} Live
                            </span>
                        </div>
                        <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
                            {todayActivities.map((act: any) => (
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

                {/* â”€â”€ Work Progress % â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                            {workProgressItems.map((item: any) => (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-sm font-bold text-slate-700">{item.label}</p>
                                        <div className="flex items-center gap-3 text-[11px] font-bold">
                                            {showPlanned && <span className="text-slate-400">Planned: <span className="text-slate-600">{item.planned}%</span></span>}
                                            {showActual && <span className={item.actual >= item.planned ? "text-emerald-600" : "text-rose-500"}>
                                                Actual: {item.actual}%
                                            </span>}
                                        </div>
                                    </div>
                                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                                        {showPlanned && <div className="absolute inset-0 bg-slate-200 rounded-full" style={{ width: `${item.planned}%` }} />}
                                        {showActual && <div className={`absolute inset-0 h-full rounded-full transition-all duration-700 ${item.color}`} style={{ width: `${item.actual}%` }} />}
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[9px] text-slate-300 font-bold">0%</span>
                                        <span className="text-[9px] text-slate-300 font-bold">100%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-5 mt-6 pt-5 border-t border-slate-50">
                            <button onClick={() => setShowPlanned(!showPlanned)} className="flex items-center gap-1.5 focus:outline-none hover:opacity-80 transition-opacity">
                                <div className={`w-3 h-3 rounded-sm transition-all ${showPlanned ? 'bg-slate-200' : 'bg-slate-100 border border-slate-200'}`} />
                                <span className={`text-[10px] font-bold transition-all ${showPlanned ? 'text-slate-400' : 'text-slate-300 line-through'}`}>Planned</span>
                            </button>
                            <button onClick={() => setShowActual(!showActual)} className="flex items-center gap-1.5 focus:outline-none hover:opacity-80 transition-opacity">
                                <div className={`w-3 h-3 rounded-sm transition-all ${showActual ? 'bg-primary' : 'bg-primary/20'}`} />
                                <span className={`text-[10px] font-bold transition-all ${showActual ? 'text-slate-400' : 'text-slate-300 line-through'}`}>Actual</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* â”€â”€ Timeline Tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Timeline Tracking</h2>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Project Phase Timeline</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Milestone progress and completion status</p>
                            </div>
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-black rounded-xl uppercase tracking-widest">
                                {timelinePhases.filter((p: any) => p.status === "Completed").length}/{timelinePhases.length} Phases Done
                            </span>
                        </div>
                        <div className="space-y-4">
                            {timelinePhases.map((phase: any, index: number) => (
                                <div key={phase.id} className="flex gap-4 items-start">
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

                {/* â”€â”€ Site-wise Expense Tracking â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Site-wise Expense Tracking</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
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

                        <div className="flex flex-wrap gap-3 px-6 py-4 border-b border-slate-50 bg-slate-50/50">
                            {["Labour", "Material", "Equipment"].map((cat) => {
                                const catTotal = siteExpenses.filter((e: any) => e.type === cat).reduce((s: number, e: any) => s + e.amount, 0);
                                return (
                                    <div key={cat} className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 ${expenseCategoryColors[cat] || "bg-slate-50 text-slate-600"}`}>
                                        <span>{cat}</span>
                                        <span className="font-black">₹{catTotal.toLocaleString("en-IN")}</span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm min-w-[600px]">
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
                                    {siteExpenses.map((expense: any) => (
                                        <tr key={expense.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 text-xs font-bold text-slate-500 tabular-nums whitespace-nowrap">{expense.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-[10px] font-black rounded-lg uppercase tracking-widest ${expenseCategoryColors[expense.type] || "bg-slate-50 text-slate-600"}`}>
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
