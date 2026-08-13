import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";

import { Sun, Cloud, CloudRain, CloudSun, CloudDrizzle, CloudFog, CloudSnow, CloudLightning, ChevronLeft, ChevronRight } from "lucide-react";
import { dashboardService } from "../../services/dashboardService";
import { useProject } from "../../context/ProjectContext";
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
    const { selectedProjectId, selectedProject } = useProject();
    const projectId = selectedProjectId || 0;
    const projectName = selectedProject?.project_name || "SARA CITY";

    const getEmptyDashboardData = (pId: number, pName: string) => ({
        project_id: pId,
        project_name: pName,
        status: "Planned",
        progress: 0,
        planned_progress: 0,
        variance: 0,
        vitals: {
            total_labour_today: 0,
            skilled_labour: 0,
            unskilled_labour: 0,
            active_activities: 0,
            open_issues: {
                total: 0,
                high_priority: 0
            },
            material_stock_status: []
        },
        today_work_summary: [],
        discipline_progress: [],
        timeline: [],
        recent_expenses: [],
        weather: {
            condition: "Clear",
            temperature: 32
        }
    });

    const [dashboardData, setDashboardData] = useState<any>(getEmptyDashboardData(projectId, projectName));
    const [isLoading, setIsLoading] = useState(true);

    // Pagination for Expense Register
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Live weather state
    const [liveWeather, setLiveWeather] = useState({
        condition: "Clear",
        temperature: 32,
        humidity: 54, // Open-Meteo current_weather doesn't have humidity natively without hourly, using default
        windSpeed: 12
    });

    const [showPlanned, setShowPlanned] = useState(true);
    const [showActual, setShowActual] = useState(true);

    // Fetch Live Weather based on location
    useEffect(() => {
        const fetchWeather = async (lat: number, lon: number) => {
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                const data = await res.json();
                if (data.current_weather) {
                    const temp = Math.round(data.current_weather.temperature);
                    const wind = Math.round(data.current_weather.windspeed);
                    const code = data.current_weather.weathercode;

                    let cond = "Clear";
                    if ([1, 2, 3].includes(code)) cond = "Partly Cloudy";
                    else if ([45, 48].includes(code)) cond = "Foggy";
                    else if ([51, 53, 55, 56, 57].includes(code)) cond = "Drizzle";
                    else if ([61, 63, 65, 66, 67].includes(code)) cond = "Rainy";
                    else if ([71, 73, 75, 77].includes(code)) cond = "Snowy";
                    else if ([80, 81, 82].includes(code)) cond = "Showers";
                    else if ([95, 96, 99].includes(code)) cond = "Thunderstorm";

                    setLiveWeather(prev => ({
                        ...prev,
                        condition: cond,
                        temperature: temp,
                        windSpeed: wind
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch weather", err);
            }
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    fetchWeather(pos.coords.latitude, pos.coords.longitude);
                },
                (err) => {
                    console.warn("Geolocation denied/failed, using fallback weather", err);
                }
            );
        }
    }, []);

    useEffect(() => {
        let isFirstLoad = true;
        const fetchAllDashboardData = async () => {
            if (!projectId) {
                setIsLoading(false);
                return;
            }
            if (isFirstLoad) {
                setIsLoading(true);
            }
            try {
                const apiData = await dashboardService.getEngineerDashboard(projectId);

                // Map the API data to the UI structure expected by EngineerDashboard

                const today_work_summary = (apiData.today_work_summary || []).map((a: any, idx: number) => {
                    const stStatus = a.status === "WorkActivityStatus.COMPLETED" ? "Completed" :
                        a.status === "WorkActivityStatus.DELAY" ? "Pending" : "In Progress";
                    const statusColor = a.status === "WorkActivityStatus.COMPLETED" ? "bg-emerald-100 text-emerald-600" :
                        a.status === "WorkActivityStatus.DELAY" ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600";

                    return {
                        id: `act_${idx}`,
                        activity: a.activity_name,
                        description: `Start: ${a.start_time || "TBA"} - Finish: ${a.finish_time || "TBA"}`,
                        status: stStatus,
                        time: `Status: ${a.status.replace("WorkActivityStatus.", "")}`,
                        statusColor: statusColor
                    };
                });

                const colors = ["bg-blue-500", "bg-indigo-500", "bg-cyan-500", "bg-amber-500", "bg-rose-400", "bg-purple-500"];
                const discipline_progress = (apiData.discipline_progress || []).map((d: any, index: number) => ({
                    label: d.discipline,
                    planned: Number(Number(d.planned_percent || 0).toFixed(2)),
                    actual: Number(Number(d.actual_percent || 0).toFixed(2)),
                    color: colors[index % colors.length]
                }));

                const timeline = (apiData.timeline || []).map((m: any, idx: number) => ({
                    id: m.id || m.phase_id || `phase_${idx}`,
                    phase: m.title || m.phase_name || "Project Phase",
                    start: m.start_date || "TBD",
                    end: m.end_date || "TBD",
                    status: (m.status || "Upcoming").replace("MilestoneStatus.", ""),
                    progress: m.progress || 0
                }));

                const recent_expenses = (apiData.recent_expenses || []).map((e: any, idx: number) => ({
                    id: e.id || `exp_${idx}`,
                    date: e.date || "N/A",
                    type: e.type || "General",
                    category: e.category || "General",
                    note: e.note || "Site Expense",
                    amount: e.amount || 0
                }));

                const matStatus = apiData.vitals?.material_stock_status || [];
                const materialStockStatus = {
                    added_materials: matStatus.length,
                    purchased: matStatus.filter((m: any) => m.status === 'OK').length,
                    used: matStatus.filter((m: any) => m.status === 'Low' || m.status === 'Out of Stock').length,
                    stock: 0
                };

                setDashboardData({
                    project_id: apiData.project_id || projectId,
                    project_name: apiData.project_name || projectName,
                    status: (apiData.status || "Active").replace("ProjectStatus.", ""),
                    progress: apiData.progress || 0,
                    planned_progress: apiData.planned_progress || 0,
                    variance: apiData.variance || 0,
                    vitals: {
                        total_labour_today: apiData.vitals?.total_labour_today || 0,
                        skilled_labour: apiData.vitals?.skilled_labour || 0,
                        unskilled_labour: apiData.vitals?.unskilled_labour || 0,
                        active_activities: apiData.vitals?.active_activities || 0,
                        open_issues: {
                            total: apiData.vitals?.open_issues?.total || 0,
                            high_priority: apiData.vitals?.open_issues?.high_priority || 0
                        },
                        material_stock_status: materialStockStatus
                    },
                    today_work_summary: today_work_summary,
                    discipline_progress: discipline_progress,
                    timeline: timeline,
                    recent_expenses: recent_expenses,
                    has_activities: true, // Show segments if we have data
                    weather: apiData.weather || {
                        condition: "Clear",
                        temperature: 32
                    }
                });

            } catch (err) {
                console.error("Dashboard Fetch Error:", err);
            } finally {
                if (isFirstLoad) {
                    setIsLoading(false);
                    isFirstLoad = false;
                }
            }
        };

        fetchAllDashboardData();
    }, [projectId, projectName]);

    const overallProgress = Number(Number(dashboardData.progress || 0).toFixed(2));
    const plannedPercent = Number(Number(dashboardData.planned_progress || 0).toFixed(2));
    const variance = Number(Number(dashboardData.variance || 0).toFixed(2));

    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (circumference * overallProgress) / 100;

    const todayActivities = dashboardData.today_work_summary || [];
    const workProgressItems = dashboardData.discipline_progress || [];
    const timelinePhases = dashboardData.timeline || [];
    const siteExpenses = dashboardData.recent_expenses || [];
    const totalExpenses = siteExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

    const paginatedExpenses = siteExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const renderPagination = (total: number) => {
        const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                    <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border border-slate-200 rounded-lg text-[11px] font-medium px-2 py-1 outline-none bg-white">
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                </div>
                <div className="text-[11px] font-medium text-slate-500">
                    Showing {total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, total)} of {total} records
                </div>
                <div className="flex items-center gap-1.5">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 bg-white"><ChevronLeft className="w-4 h-4" /></button>
                    {pages.map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${currentPage === page ? 'bg-blue-600 text-white border border-blue-600 shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-50 bg-white'}`}
                        >
                            {page}
                        </button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || total === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 bg-white"><ChevronRight className="w-4 h-4" /></button>
                </div>
            </div>
        );
    };

    return (
        <>
            <Navbar title="Site Overview" breadcrumb={["InfraPilot", "Engineer", "Dashboard"]} />

            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50 font-inter">
                    <div className="w-16 h-16 relative flex items-center justify-center mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Aggregating Site Data...</p>
                </div>
            ) : (
                <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter pb-8">

                    {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Project</p>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight uppercase">{dashboardData.project_name || projectName}</h1>
                            <p className="text-slate-500 text-sm">Real-time site progress, labor, and material monitoring.</p>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl shadow-sm">
                            <div className="flex items-center justify-center p-2 rounded-xl bg-slate-50">
                                {liveWeather.condition === "Clear" ? <Sun className="w-8 h-8 text-amber-500" /> :
                                    liveWeather.condition === "Partly Cloudy" ? <CloudSun className="w-8 h-8 text-amber-500" /> :
                                        liveWeather.condition === "Foggy" ? <CloudFog className="w-8 h-8 text-slate-400" /> :
                                            liveWeather.condition === "Drizzle" ? <CloudDrizzle className="w-8 h-8 text-blue-400" /> :
                                                liveWeather.condition === "Rainy" ? <CloudRain className="w-8 h-8 text-blue-500" /> :
                                                    liveWeather.condition === "Snowy" ? <CloudSnow className="w-8 h-8 text-blue-200" /> :
                                                        liveWeather.condition === "Showers" ? <CloudRain className="w-8 h-8 text-blue-600" /> :
                                                            liveWeather.condition === "Thunderstorm" ? <CloudLightning className="w-8 h-8 text-purple-500" /> :
                                                                <Cloud className="w-8 h-8 text-slate-400" />}
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Weather – Live</p>
                                <p className="text-sm font-bold text-slate-800 tracking-tight">{liveWeather.condition}, {liveWeather.temperature}°C</p>
                                <p className="text-[10px] text-slate-400 font-medium">Humidity {liveWeather.humidity}% · Wind {liveWeather.windSpeed} km/h</p>
                            </div>
                        </div>
                    </div>

                    {/* â”€â”€ Site Vitals â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <div className="mb-6">
                        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Site Vitals</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                            <StatCard
                                title="Total Labour"
                                value={(dashboardData.vitals?.total_labour_today || 0).toString()}
                                sub={`${dashboardData.vitals?.skilled_labour || 0} Skilled · ${dashboardData.vitals?.unskilled_labour || 0} Unskilled`}
                                accent="text-primary" />
                            <StatCard
                                title="Active Activities"
                                value={(dashboardData.vitals?.active_activities || 0).toString()}
                                sub="Real-Time Active Tracking"
                                accent="text-blue-500" />
                            <StatCard
                                title="Open Issues"
                                value={(dashboardData.vitals?.open_issues?.total || 0).toString()}
                                sub={`${dashboardData.vitals?.open_issues?.high_priority || 0} High Priority`}
                                accent="text-rose-500" />
                            <StatCard
                                title="Material Stock Status"
                                value={(dashboardData.vitals?.material_stock_status?.added_materials || 0).toString()}
                                sub={`${dashboardData.vitals?.material_stock_status?.purchased || 0} In Stock · ${dashboardData.vitals?.material_stock_status?.used || 0} Low/Out`}
                                accent="text-emerald-500" />
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
                            {dashboardData.has_activities && (
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
                            )}
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
                                    const catTotal = siteExpenses.filter((e: any) => (e.type || "").toLowerCase() === cat.toLowerCase() || (e.category || "").toLowerCase() === cat.toLowerCase()).reduce((s: number, e: any) => s + e.amount, 0);
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
                                        {paginatedExpenses.map((expense: any) => (
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
                            {renderPagination(siteExpenses.length)}
                        </div>
                    </div>

                </PageTransition>
            )}
        </>
    );
};

export default EngineerDashboard;
