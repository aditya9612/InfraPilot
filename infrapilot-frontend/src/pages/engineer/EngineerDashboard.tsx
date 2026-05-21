import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import api from "../../services/api";
import { Sun, Cloud, CloudRain, CloudSun, CloudDrizzle, CloudFog, CloudSnow, CloudLightning } from "lucide-react";
import { workProgressService } from "../../services/workProgressService";
import { labourService } from "../../services/labourService";
import { issueService } from "../../services/issueService";
import { materialService } from "../../services/materialService";
import { qcService } from "../../services/qcService";

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

    const weatherData = {
        condition: dashboardData?.weather?.condition || "Clear",
        temperature: dashboardData?.weather?.temperature || 32,
        humidity: dashboardData?.weather?.humidity || 54,
        windSpeed: dashboardData?.weather?.windSpeed || dashboardData?.weather?.wind_speed || 12
    };
    const [showPlanned, setShowPlanned] = useState(true);
    const [showActual, setShowActual] = useState(true);

    useEffect(() => {
        const fetchAllDashboardData = async () => {
            setIsLoading(true);
            try {
                // 1. Fire all real service calls concurrently
                const [
                    activities,
                    laboursRes,
                    issuesRes,
                    materials
                ] = await Promise.all([
                    workProgressService.listActivities(projectId).catch(() => []),
                    labourService.getLabours(projectId, { status: "Active" }).catch(() => ({ items: [] })),
                    issueService.listIssuesByProject(projectId).catch(() => ({ items: [] })),
                    materialService.getInventory(projectId).catch(() => [])
                ]);

                const issues = issuesRes?.items || [];
                const labours = laboursRes?.items || [];

                // 2. Process Work Progress Data
                const activeActivities = activities.filter((a: any) => a.status !== "Completed" && a.completion_percentage < 100);
                const completedCount = activities.filter((a: any) => a.status === "Completed" || a.completion_percentage === 100).length;
                const totalAct = activities.length;
                const progress = totalAct > 0 ? Math.round((completedCount / totalAct) * 100) : 0;
                
                // Aggregating disciplines
                const disciplines = ["Structural Work", "Masonry & Brickwork", "Plumbing", "Electrical", "Finishing"];
                const colors = ["bg-blue-500", "bg-indigo-500", "bg-cyan-500", "bg-amber-500", "bg-rose-400"];
                const discipline_progress = disciplines.map((d, index) => {
                    const dAct = activities.filter((a: any) => (a.discipline || "Structural Work") === d);
                    const avgActual = dAct.length > 0 ? dAct.reduce((sum: number, a: any) => sum + a.completion_percentage, 0) / dAct.length : 0;
                    return {
                        label: d,
                        planned: 0,
                        actual: dAct.length > 0 ? Math.round(avgActual) : 0,
                        color: colors[index]
                    };
                });

                const today_work_summary = activities.slice(0, 5).map((a: any) => ({
                    id: a.id,
                    activity: a.activity_name,
                    description: `Executing BOQ code ${a.boq_code || "N/A"}. Planned quantity: ${a.planned_quantity} ${a.unit}.`,
                    status: a.status === "Completed" ? "Completed" : a.status === "Delay" ? "Pending" : "In Progress",
                    time: `Deadline: ${a.end_date}`,
                    statusColor: a.status === "Completed" ? "bg-emerald-100 text-emerald-600" : a.status === "Delay" ? "bg-rose-100 text-rose-600" : "bg-blue-100 text-blue-600"
                }));

                // 3. Process Labour Data
                const skilledLabours = labours.filter((l: any) => l.category === "Skilled" || l.type === "Skilled").length;
                const unskilledLabours = labours.length - skilledLabours;

                // 4. Process Material Data
                const material_stock_status = materials.slice(0, 3).map((m: any) => ({
                    material: m.name || m.item_name || "Unknown",
                    status: (m.quantity || 0) < (m.min_threshold || 10) ? "Low" : "OK"
                }));

                // 5. Process Issues Data
                const openIssues = issues.filter((i: any) => i.status !== "Resolved" && i.status !== "Closed");
                const highPriorityIssues = openIssues.filter((i: any) => i.priority === "High" || i.priority === "Critical");

                // Compile Final Data Structure
                setDashboardData({
                    project_id: projectId,
                    project_name: projectName,
                    status: "Active",
                    progress: progress,
                    planned_progress: 0, // Needs baseline integration
                    variance: progress, 
                    vitals: {
                        total_labour_today: labours.length,
                        skilled_labour: skilledLabours,
                        unskilled_labour: unskilledLabours,
                        active_activities: activeActivities.length,
                        open_issues: {
                            total: openIssues.length,
                            high_priority: highPriorityIssues.length
                        },
                        material_stock_status: material_stock_status.length > 0 ? material_stock_status : [{ material: "No Stock Data", status: "N/A" }]
                    },
                    today_work_summary: today_work_summary,
                    discipline_progress: discipline_progress,
                    timeline: [], // Populated by Gantt/Phases if available
                    recent_expenses: [], // Needs expenseService integration if added later
                    weather: {
                        condition: "Clear",
                        temperature: 32
                    }
                });

            } catch (err) {
                console.error("Dashboard Aggregation Error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardStats();
        fetchAllDashboardData();
        
        // Also fetch from the aggregation endpoint just in case it's populated
        async function fetchDashboardStats() {
            try {
                const res = await api.get(`/dashboard/engineer/${projectId}`);
                if (res && res.data && Object.keys(res.data).length > 2) {
                    // Fallback to aggregated endpoint if it's richer
                    setDashboardData((prev: any) => ({ ...prev, ...res.data }));
                }
            } catch (err) {
                // Ignore silent background fetch error
            }
        }
    }, [projectId, projectName]);

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

            {isLoading ? (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-64px)] bg-slate-50 font-inter">
                    <div className="w-16 h-16 relative flex items-center justify-center mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Aggregating Site Data...</p>
                </div>
            ) : (
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
            )}
        </>
    );
};

export default EngineerDashboard;
