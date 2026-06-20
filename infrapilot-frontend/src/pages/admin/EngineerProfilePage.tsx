import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import {
    Camera, Package, Wind, Droplets,
    Thermometer, Users, ChevronLeft, Calendar,
    TrendingUp, MapPin, Phone, Mail,
    CreditCard, Fingerprint, FileDown, FileText
} from "lucide-react";
import { userService } from "../../services/userService";
import { dsrService } from "../../services/dsrService";
import { projectService } from "../../services/projectService";
import { materialService } from "../../services/materialService";
import { sitePhotoService } from "../../services/sitePhotoService";
import { labourService } from "../../services/labourService";
import { workProgressService } from "../../services/workProgressService";
import { issueService } from "../../services/issueService";
import { expenseService } from "../../services/expenseService";
import { getFullImageUrl } from "../../utils/imageUtils";

const EngineerProfilePage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mirrorFilter, setMirrorFilter] = useState<"photos" | "materials" | "dsr">("photos");
    const [engineer, setEngineer] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dsrData, setDsrData] = useState<any[]>([]);
    const [materialLogs, setMaterialLogs] = useState<any[]>([]);
    const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
    const [engineerData, setEngineerData] = useState<any>(null);
    const [sitePhotos, setSitePhotos] = useState<any[]>([]);
    const [vitals, setVitals] = useState<any>({
        total_labour_today: 0,
        skilled_labour: 0,
        unskilled_labour: 0,
        active_activities: 0,
        open_issues: { total: 0, high_priority: 0 },
        total_expenses: 0,
        progress: 0
    });
    const [liveWeather, setLiveWeather] = useState({
        condition: "Clear", temperature: 32, humidity: 54, windSpeed: 12
    });

    // Live weather from Open-Meteo (same as EngineerDashboard)
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
                    setLiveWeather(prev => ({ ...prev, condition: cond, temperature: temp, windSpeed: wind }));
                }
            } catch (err) {
                console.warn("Weather fetch failed, using defaults", err);
            }
        };
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                pos => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                () => console.warn("Geolocation denied, using fallback weather")
            );
        }
    }, []);

    // 1. Resolve assigned projects
    useEffect(() => {
        const resolveProjects = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const u = await userService.getUserById(parseInt(id));
                setEngineerData(u);

                const projectsRes = await projectService.getProjects(100, 0);
                const allProjects = Array.isArray(projectsRes) ? projectsRes : (projectsRes.items || projectsRes.data || []);

                const targetProjects: any[] = [];
                if (u.address) {
                    const byAddr = allProjects.filter((p: any) => p.project_name === u.address);
                    byAddr.forEach((pa: any) => {
                        if (!targetProjects.find(a => a.id === pa.id)) targetProjects.push(pa);
                    });
                }

                // Membership check (Limit to first 30 projects for performance on single profile, or optimize)
                const BATCH_SIZE = 15;
                for (let i = 0; i < allProjects.length; i += BATCH_SIZE) {
                    if (targetProjects.length >= 5) break; // If we found enough, stop
                    const batch = allProjects.slice(i, i + BATCH_SIZE);
                    const results = await Promise.all(batch.map((p: any) => projectService.getProjectMembers(p.id).catch(() => [])));
                    results.forEach((list, idx) => {
                        const items = Array.isArray(list) ? list : (list.items || list.data || []);
                        if (items.some((m: any) => (m.user_id || m.user?.id || m.id) === u.user_id)) {
                            if (!targetProjects.find(tp => tp.id === batch[idx].id)) targetProjects.push(batch[idx]);
                        }
                    });
                }

                console.log(`Resolve projects for ${u.full_name}: Found ${targetProjects.length} matches.`);
                setAssignedProjects(targetProjects);
                if (targetProjects.length > 0) {
                    const firstId = targetProjects[0].id;
                    console.log(`Setting active project to ${firstId}`);
                    setActiveProjectId(firstId);
                } else {
                    console.warn(`No projects resolved for engineer ${u.user_id}`);
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Resolve projects failed:", error);
                setIsLoading(false);
            }
        };
        resolveProjects();
    }, [id]);

    // 2. Fetch project intelligence for the active project
    useEffect(() => {
        const fetchProjectData = async () => {
            if (!activeProjectId || !engineerData) return;
            try {
                const today = new Date().toISOString().split('T')[0];
                const [activities, attendanceRes, issuesRes, expensesRes, dsrsRes, photos] = await Promise.all([
                    workProgressService.listActivities(activeProjectId, engineerData.user_id).catch(() => []),
                    labourService.getAttendanceList(activeProjectId, today, today).catch(() => ({ items: [] })),
                    issueService.listIssuesByProject(activeProjectId, { limit: 1000 }).catch(() => ({ items: [] })),
                    expenseService.getExpensesByProject(activeProjectId).catch(() => []),
                    dsrService.getDsrByProject(activeProjectId).catch(() => ({ items: [] as any[] })),
                    sitePhotoService.getPhotos({ project_id: activeProjectId, limit: 20 }).catch(() => ({ items: [] as any[] }))
                ]);

                const dsrsList = (dsrsRes as any)?.items || [];
                const latestDsr = dsrsList[0];

                const attendance = (attendanceRes as any)?.items || (Array.isArray(attendanceRes) ? attendanceRes : []);

                let skilledCount = 0;
                let unskilledCount = 0;
                let totalCount = 0;

                // Skill normalization helper
                const normalizeSkill = (l: any) => (l.skill_type || l.skill || l.category || "General").toLowerCase();

                if (attendance.length > 0) {
                    totalCount = attendance.length;
                    skilledCount = attendance.filter((l: any) => normalizeSkill(l).includes("skilled") && !normalizeSkill(l).includes("unskilled")).length;
                    unskilledCount = totalCount - skilledCount;
                } else {
                    // Fallback to registry details for breakdown
                    const regDetails = await labourService.getLabours(activeProjectId, { limit: 100 }).catch(() => ({ items: [] }));
                    const regItems = (regDetails as any)?.items || [];
                    totalCount = (regDetails as any)?.meta?.total || regItems.length;
                    skilledCount = regItems.filter((l: any) => normalizeSkill(l).includes("skilled") && !normalizeSkill(l).includes("unskilled")).length;
                    unskilledCount = totalCount - skilledCount;
                }

                const activeLabourCount = totalCount;

                const allIssues = (issuesRes as any)?.items || [];
                const openIssues = allIssues.filter((i: any) => (i.status || i.state) !== "Resolved" && (i.status || i.state) !== "Closed");
                const highPriorityIssues = openIssues.filter((i: any) => i.priority === "High" || i.priority === "Critical");

                const activeActivities = (activities as any[]).filter((a: any) => a.status !== "COMPLETED" && a.completion_percentage < 100);
                const progress = (activities as any[]).length > 0 ? Math.round((activities as any[]).reduce((sum: number, a: any) => sum + (a.completion_percentage || 0), 0) / (activities as any[]).length) : 0;
                const expenses = Array.isArray(expensesRes) ? expensesRes : ((expensesRes as any)?.items || []);
                const totalExpenses = (expenses as any[]).reduce((sum: number, e: any) => sum + (e.amount || e.total_amount || 0), 0);

                const mlRes = await materialService.getLogs({ project_id: activeProjectId, limit: 10 }).catch(() => []);
                setMaterialLogs(Array.isArray(mlRes) ? mlRes : []);

                setVitals({
                    total_labour_today: activeLabourCount,
                    skilled_labour: skilledCount,
                    unskilled_labour: unskilledCount,
                    active_activities: activeActivities.length,
                    open_issues: { total: openIssues.length, high_priority: highPriorityIssues.length },
                    total_expenses: totalExpenses,
                    progress
                });

                // Update Live Weather from DSR if available
                if (latestDsr?.weather) {
                    setLiveWeather({
                        condition: latestDsr.weather,
                        temperature: parseInt(latestDsr.weather_temp) || 28,
                        humidity: 54, // Default fallback
                        windSpeed: 12 // Default fallback
                    });
                } else {
                    // Mismatch fix: use the same fallback as EngineersPage
                    setLiveWeather(prev => ({ ...prev, condition: "Cloudy", temperature: 28 }));
                }

                // Using dsrsList directly for data state
                setDsrData(dsrsList);
                setSitePhotos((photos as any)?.items || []);

                const u = engineerData;
                const activeProject = assignedProjects.find(p => p.id === activeProjectId);
                const activeTask = activeActivities[0]?.activity_name || dsrsList[0]?.work_done?.split('.')[0] || "Site Supervision";

                setEngineer({
                    id: u.user_id,
                    name: u.full_name,
                    email: u.email,
                    mobile: u.mobile_number,
                    projects: assignedProjects.map(p => p.project_name).join(", "),
                    activeProjectName: activeProject?.project_name || "Unknown",
                    experience: u.joining_date
                        ? (() => {
                            const years = Math.floor((new Date().getTime() - new Date(u.joining_date).getTime()) / (1000 * 60 * 60 * 24 * 365));
                            return years > 0 ? `${years} Years` : null;
                        })()
                        : "5 Years",
                    performance: "Outstanding",
                    status: u.is_active ? "On Site" : "Leave",
                    specialization: u.designation || "Site Engineer",
                    pan_number: u.pan_number || "NOT_SET",
                    aadhaar_number: u.aadhaar_number || "NOT_SET",
                    lastDsr: latestDsr?.report_date || u.updated_at || new Date().toISOString(),
                    laborCount: activeLabourCount,
                    activeTask,
                    joiningDate: u.joining_date || "2024-01-01",
                    weather: `${liveWeather.condition}, ${liveWeather.temperature}°C`,
                    humidity: `${liveWeather.humidity}%`,
                    windSpeed: `${liveWeather.windSpeed} km/h`
                });
            } catch (error) {
                console.error("Fetch project intelligence failed:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjectData();
    }, [activeProjectId, engineerData, assignedProjects]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">Analyzing Site Intelligence...</p>
            </div>
        );
    }

    if (!engineer) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <p className="text-slate-500 font-medium mb-4">Engineer not found.</p>
                <button onClick={() => navigate("/admin/engineers")} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold">Back to Staff</button>
            </div>
        );
    }

    const handleExport = async () => {
        if (!activeProjectId) {
            toast.error("No active project selected to export report.");
            return;
        }
        const toastId = toast.loading("Compiling Site Report...");
        try {
            await dsrService.exportDsrExcel(activeProjectId);
            toast.success("Site Report Downloaded!", { id: toastId });
        } catch {
            toast.error("Failed to export site report.", { id: toastId });
        }
    };



    const handleExportProjectDsrExcel = () => {
        if (!activeProjectId) return;
        const toastId = toast.loading("Compiling DSR Registry Excel...");
        dsrService.exportDsrExcel(activeProjectId)
            .then(() => toast.success("DSR Registry Exported!", { id: toastId }))
            .catch(() => toast.error("Excel Export Failed", { id: toastId }));
    };

    const handleExportIndividualDsrPdf = (dsrId: number) => {
        const toastId = toast.loading("Generating DSR PDF...");
        dsrService.exportDsrPdf(dsrId)
            .then(() => toast.success("DSR Report Downloaded!", { id: toastId }))
            .catch(() => toast.error("PDF Export Failed", { id: toastId }));
    };

    return (
        <>
            <Navbar
                title="Engineer Intelligence"
                breadcrumb={["Admin", "Staff", engineer.name]}
            />

            <PageTransition className="p-6 md:p-10 bg-slate-50 min-h-screen">
                {/* Back Button & Header Actions */}
                <div className="flex items-center justify-between mb-8">
                    <button
                        onClick={() => navigate("/admin/engineers")}
                        className="flex items-center gap-2 text-slate-500 hover:text-primary transition-all font-bold text-sm bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm"
                    >
                        <ChevronLeft className="w-4 h-4" /> Back to Staff Force
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={handleExport}
                            className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 transition-all"
                        >
                            Export Site Report
                        </button>

                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* ── Left Column: Profile Card & Vitals ─────────────────────── */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* Executive Profile Card */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />

                            <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-white overflow-hidden">
                                    {engineerData?.profile_image ? (
                                        <img src={getFullImageUrl(engineerData.profile_image)} alt={engineer.name} className="w-full h-full object-cover" />
                                    ) : (
                                        engineer.name.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{engineer.name}</h2>
                                    <p className="text-primary font-bold text-xs uppercase tracking-[0.2em] mt-1">{engineer.specialization}</p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                        {engineer.status}
                                    </span>
                                    {engineer.experience && (
                                        <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
                                            {engineer.experience} Exp
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Quick Contacts */}
                            <div className="mt-8 space-y-4 pt-8 border-t border-slate-50">
                                <ContactItem icon={<Phone className="w-4 h-4" />} label="Mobile" value={engineer.mobile} />
                                <ContactItem icon={<Mail className="w-4 h-4" />} label="Official Email" value={engineer.email} />
                                <div className="flex items-center justify-between group cursor-pointer" onClick={() => activeProjectId && window.open(`/admin/projects/${activeProjectId}`, '_blank')}>
                                    <ContactItem icon={<MapPin className="w-4 h-4" />} label="Deployment(s)" value={engineer.projects} />
                                    {activeProjectId && <div className="text-[9px] font-bold text-primary group-hover:underline">View Active</div>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <ContactItem icon={<CreditCard className="w-4 h-4" />} label="PAN ID" value={engineer.pan_number} />
                                    <ContactItem icon={<Fingerprint className="w-4 h-4" />} label="Aadhaar" value={engineer.aadhaar_number} />
                                </div>
                                <ContactItem icon={<Calendar className="w-4 h-4" />} label="Joining Date" value={engineer.joiningDate} />
                            </div>
                        </div>

                        {/* Site Environment Snapshot */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl -mb-24 -mr-24" />
                            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">Site Environments</h4>

                            <div className="grid grid-cols-2 gap-8 relative z-10">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-amber-400">
                                        <Thermometer className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Temperature</span>
                                    </div>
                                    <p className="text-3xl font-black">{liveWeather.temperature}°C</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Droplets className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Humidity</span>
                                    </div>
                                    <p className="text-3xl font-black">{liveWeather.humidity}%</p>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Wind className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-tighter">Wind Speed</p>
                                        <p className="text-sm font-bold">{liveWeather.windSpeed} km/h</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-tighter">Conditions</p>
                                    <p className="text-sm font-bold text-emerald-400">Favorable</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right Column: Site Intelligence Feed ────────────────────── */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        {/* Force Distribution & Active Task */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Users className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Labour Density</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total: {vitals.total_labour_today} Staff</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                        <p className="text-xl font-black text-primary">
                                            {vitals.skilled_labour}
                                        </p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Skilled Staff</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                        <p className="text-xl font-black text-slate-600">
                                            {vitals.unskilled_labour}
                                        </p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Helpers</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                        <TrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Live Supervision</h4>
                                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest animate-pulse">Session Active</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <p className="text-sm font-bold text-slate-700">{engineer.activeTask}</p>
                                </div>
                            </div>
                        </div>

                        {/* Site Mirror Experience */}
                        <div className="flex-1 bg-white rounded-[3rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden min-h-[600px]">
                            {/* Mirror Navigation */}
                            <div className="px-8 pt-8 flex items-center justify-between border-b border-slate-50 pb-6 shrink-0">
                                <div className="flex items-center gap-6">
                                    <div className="flex gap-8">
                                        <MirrorTab
                                            active={mirrorFilter === "photos"}
                                            onClick={() => setMirrorFilter("photos")}
                                            label="Site Photos"
                                            count={sitePhotos.length + dsrData.filter(d => d.dsr_image).length}
                                        />
                                        <MirrorTab
                                            active={mirrorFilter === "materials"}
                                            onClick={() => setMirrorFilter("materials")}
                                            label="Material Log"
                                        />
                                        <MirrorTab
                                            active={mirrorFilter === "dsr"}
                                            onClick={() => setMirrorFilter("dsr")}
                                            label="Daily Reports"
                                        />
                                    </div>

                                    {mirrorFilter === "dsr" && (
                                        <button
                                            onClick={handleExportProjectDsrExcel}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ml-4"
                                            title="Export Excel Registry"
                                        >
                                            <FileDown className="w-3.5 h-3.5" />
                                            Export Registry
                                        </button>
                                    )}

                                    {assignedProjects.length > 1 && (
                                        <div className="flex items-center gap-2 pl-8 border-l border-slate-100">
                                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Active Site:</span>
                                            <select
                                                className="bg-slate-50 border-none text-[10px] font-black text-primary uppercase tracking-tight rounded-lg px-2 py-1 outline-none cursor-pointer hover:bg-slate-100 transition-colors"
                                                value={activeProjectId || ""}
                                                onChange={(e) => setActiveProjectId(Number(e.target.value))}
                                            >
                                                {assignedProjects.map(p => (
                                                    <option key={p.id} value={p.id}>{p.project_name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                                    {assignedProjects.length > 1 ? "Multi-Project Sync" : "Live Site Mirror"}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                {mirrorFilter === "photos" && (() => {
                                    // Merge sitePhotoService photos + DSR images
                                    const dsrPhotos = dsrData
                                        .filter(d => d.dsr_image)
                                        .map((d: any) => ({
                                            url: sitePhotoService.resolveUrl(d.dsr_image),
                                            caption: d.report_date,
                                            sub: d.work_done
                                        }));
                                    const spPhotos = sitePhotos.map((p: any) => ({
                                        url: sitePhotoService.resolveUrl(p.url || p.photo_url),
                                        caption: p.date || p.activity_tag || "Site Photo",
                                        sub: p.description || p.location_tag || ""
                                    }));
                                    const allPhotos = [...spPhotos, ...dsrPhotos];
                                    return (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            {allPhotos.length > 0 ? (
                                                allPhotos.map((item: any, i: number) => (
                                                    <div key={i} className="group relative aspect-square bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 hover:border-primary/30 transition-all cursor-zoom-in">
                                                        <img src={item.url} alt="Site activity" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                                            <p className="text-[10px] text-white font-black uppercase tracking-widest">{item.caption} • Live Feed</p>
                                                            <p className="text-[9px] text-white/60 font-medium mt-1 truncate">{item.sub}</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                [1, 2, 3, 4, 5, 6].map((_, i) => (
                                                    <div key={i} className="group relative aspect-square bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 hover:border-primary/30 transition-all cursor-zoom-in">
                                                        <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                                                            <Camera className="w-12 h-12 opacity-10" />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    );
                                })()}

                                {mirrorFilter === "materials" && (
                                    <div className="space-y-4">
                                        {materialLogs.length > 0 ? (
                                            materialLogs.map((log, i) => (
                                                <div key={i} className="p-6 bg-slate-50 rounded-3xl flex items-center justify-between hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-transparent hover:border-slate-100 group">
                                                    <div className="flex items-center gap-6">
                                                        <div className={`w-14 h-14 rounded-2xl ${log.type === "IN" ? "bg-emerald-500" : "bg-blue-500"}/10 flex items-center justify-center text-${log.type === "IN" ? "emerald" : "blue"}-600 group-hover:scale-110 transition-transform`}>
                                                            <Package className="w-7 h-7" />
                                                        </div>
                                                        <div>
                                                            <p className="text-base font-black text-slate-800">{log.material_name}</p>
                                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mt-0.5">{log.type === "IN" ? "Receipt" : "Consumption"} | {new Date(log.created_at).toLocaleString()}</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-xl font-black text-slate-800">{log.quantity} {log.unit || "units"}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">No material logs found</div>
                                        )}
                                    </div>
                                )}

                                {mirrorFilter === "dsr" && (
                                    <div className="space-y-10 relative pl-4">
                                        <div className="absolute top-0 bottom-0 left-4 w-0.5 bg-slate-100" />
                                        {dsrData.length > 0 ? (
                                            dsrData.slice(0, 5).map((dsr, i) => (
                                                <div key={i} className={`relative pl-10 border-l-4 ${i === 0 ? "border-primary" : "border-slate-300"} py-2`}>
                                                    <div className="absolute top-4 -left-[10px] w-4 h-4 rounded-full bg-white border-4 border-slate-200" />
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <h5 className="text-lg font-black text-slate-800 tracking-tight">{dsr.work_done?.split('.')[0] || "Site Activity"}</h5>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{dsr.status || "Submitted"}</span>
                                                                <button
                                                                    onClick={() => handleExportIndividualDsrPdf(dsr.id)}
                                                                    className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors px-2 py-0.5 bg-slate-50 rounded border border-slate-100"
                                                                    title="Download PDF Report"
                                                                >
                                                                    <FileText className="w-3 h-3" />
                                                                    PDF
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{new Date(dsr.report_date).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">{dsr.work_done}</p>
                                                        {dsr.issues && (
                                                            <div className="mt-3 pt-3 border-t border-slate-200">
                                                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Issue Reported</p>
                                                                <p className="text-xs text-slate-500">{dsr.issues}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-10 text-slate-400 font-bold uppercase tracking-widest text-xs">No daily reports found</div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

const ContactItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
    <div className="flex items-center gap-4 group">
        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-all">
            {icon}
        </div>
        <div className="text-left">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-bold text-slate-700">{value}</p>
        </div>
    </div>
);

const MirrorTab: React.FC<{ active: boolean; onClick: () => void; label: string; count?: number }> = ({ active, onClick, label, count }) => (
    <button
        onClick={onClick}
        className={`relative pb-6 transition-all group ${active ? "text-primary" : "text-slate-400 hover:text-slate-600"}`}
    >
        <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-widest">{label}</span>
            {count && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${active ? "bg-primary text-white" : "bg-slate-100 text-slate-400"}`}>
                    {count}
                </span>
            )}
        </div>
        {active && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" />}
    </button>
);

export default EngineerProfilePage;
