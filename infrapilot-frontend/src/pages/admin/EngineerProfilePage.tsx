import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import {
    Camera, Package, Wind, Droplets,
    Thermometer, Users, ChevronLeft, Calendar,
    TrendingUp, MapPin, Phone, Mail,
    CreditCard, Fingerprint,
    LayoutGrid, LayoutList, AlertTriangle
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
    const [dsrPage, setDsrPage] = useState(0);
    const DSR_PAGE_SIZE = 10;
    const [materialPage, setMaterialPage] = useState(0);
    const MATERIAL_PAGE_SIZE = 10;
    const [materialLogs, setMaterialLogs] = useState<any[]>([]);
    const [assignedProjects, setAssignedProjects] = useState<any[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<number | null>(null);
    const [engineerData, setEngineerData] = useState<any>(null);
    const [sitePhotos, setSitePhotos] = useState<any[]>([]);
    const [issueAnalytics, setIssueAnalytics] = useState<{ total_reports: number; reports_with_issues: number } | null>(null);
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
            if (!engineerData) return;
            try {
                let activities: any[] = [];
                let attendanceRes: any = { items: [] };
                let issuesRes: any = { items: [] };
                let expensesRes: any = [];
                let dsrsRes: any = { items: [] };
                let photos: any = { items: [] };
                let today = new Date().toISOString().split('T')[0];

                if (activeProjectId) {
                    [activities, attendanceRes, issuesRes, expensesRes, dsrsRes, photos] = await Promise.all([
                        workProgressService.listActivities(activeProjectId!, engineerData.user_id).catch(() => []),
                        labourService.getAttendanceList(activeProjectId!, today, today).catch(() => ({ items: [] })),
                        issueService.listIssues({ project_id: activeProjectId!, limit: 1000 }).catch(() => ({ items: [] })),
                        expenseService.getExpensesByProject(activeProjectId!).catch(() => []),
                        dsrService.getDsrByProject(activeProjectId!, { limit: 100, offset: 0 }).catch(() => ({ items: [] as any[] })),
                        sitePhotoService.getPhotos({ project_id: activeProjectId!, limit: 20 }).catch(() => ({ items: [] as any[] }))
                    ]);
                }

                // Fetch issue analytics separately (non-blocking)
                if (activeProjectId) {
                    dsrService.getIssueAnalytics(activeProjectId).then(setIssueAnalytics).catch(() => setIssueAnalytics(null));
                } else {
                    setIssueAnalytics(null);
                }

                const dsrsList = (dsrsRes as any)?.items || [];
                const dsrTotal = (dsrsRes as any)?.total || dsrsList.length;
                let allDsrs = [...dsrsList];

                // Fetch remaining pages if total > 100
                if (activeProjectId && dsrTotal > 100) {
                    const extraPages = Math.ceil((dsrTotal - 100) / 100);
                    const extraRequests = Array.from({ length: extraPages }, (_, i) =>
                        dsrService.getDsrByProject(activeProjectId!, { limit: 100, offset: (i + 1) * 100 }).catch(() => ({ items: [] }))
                    );
                    const extraResults = await Promise.all(extraRequests);
                    extraResults.forEach(r => {
                        allDsrs = allDsrs.concat((r as any)?.items || []);
                    });
                }

                const latestDsr = allDsrs[0];

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
                } else if (activeProjectId) {
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

                const ap = activeProjectId ? assignedProjects.find(p => p.id === activeProjectId) : null;
                let activeActivitiesCount = 0;
                let progress = 0;
                let activeActivitiesList = (activities as any[]).filter((a: any) => a.status !== "COMPLETED" && (Number(a.completion_percentage) || 0) < 100);

                if ((activities as any[]).length > 0) {
                    activeActivitiesCount = activeActivitiesList.length;
                    progress = Math.round((activities as any[]).reduce((sum: number, a: any) => sum + (Number(a.completion_percentage) || 0), 0) / (activities as any[]).length);
                } else if (ap) {
                    const totalT = Number(ap.total_tasks) || 0;
                    const compT = Number(ap.completed_tasks) || 0;
                    activeActivitiesCount = Math.max(0, totalT - compT);
                    progress = Math.round(Number(ap.completion_percentage) || Number(ap.execution_completion_percentage) || 0);
                }
                const expenses = Array.isArray(expensesRes) ? expensesRes : ((expensesRes as any)?.items || []);
                const totalExpenses = (expenses as any[]).reduce((sum: number, e: any) => sum + (e.amount || e.total_amount || 0), 0);

                let mlRes: any[] = [];
                if (activeProjectId) {
                    const mlData = await materialService.getLogs({ project_id: activeProjectId, limit: 100 }).catch(() => []);
                    mlRes = Array.isArray(mlData) ? mlData : [];
                }
                setMaterialLogs(Array.isArray(mlRes) ? mlRes : []);

                setVitals({
                    total_labour_today: activeLabourCount,
                    skilled_labour: skilledCount,
                    unskilled_labour: unskilledCount,
                    active_activities: activeActivitiesCount,
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

                // Using allDsrs for data state
                setDsrData(allDsrs);
                setDsrPage(0);
                setMaterialPage(0);
                setSitePhotos((photos as any)?.items || []);

                const u = engineerData;
                const activeProject = assignedProjects.find(p => p.id === activeProjectId);
                const activeTask = activeActivitiesList[0]?.activity_name || allDsrs[0]?.work_done?.split('.')[0] || "Site Supervision";

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
                    aadhaar_number: u.aadhaar_number || u.aadhar_number || u.aadhaar || u.aadhar || "NOT_SET",
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
        if (!engineer || !activeProjectId) {
            toast.error("No active project selected to export report.");
            return;
        }
        const toastId = toast.loading("Compiling Site Report...");
        try {
            // Try the backend DSR export API first
            await dsrService.exportDsrExcel(activeProjectId);
            toast.success("Site Report Downloaded!", { id: toastId });
        } catch (apiErr: any) {
            // API not available — fall back to client-side PDF generation
            console.warn("DSR export API unavailable, generating PDF locally:", apiErr?.message);
            try {
                const { jsPDF } = await import("jspdf");
                const autoTable = (await import("jspdf-autotable")).default;

                const doc = new jsPDF();
                const primaryColor: [number, number, number] = [37, 99, 235];
                const pageWidth = doc.internal.pageSize.getWidth();

                // ── Header ──────────────────────────────────────────────
                doc.setFillColor(...primaryColor);
                doc.rect(0, 0, pageWidth, 38, "F");
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(18);
                doc.setFont("helvetica", "bold");
                doc.text("SITE ENGINEER REPORT", 14, 16);
                doc.setFontSize(9);
                doc.setFont("helvetica", "normal");
                doc.text(`Generated: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`, 14, 24);
                doc.text(`Project: ${engineer.activeProjectName}`, 14, 31);

                // ── Engineer Info ────────────────────────────────────────
                doc.setTextColor(30, 41, 59);
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Engineer Profile", 14, 50);

                autoTable(doc, {
                    startY: 55,
                    body: [
                        ["Name", engineer.name, "Role", engineer.specialization],
                        ["Mobile", engineer.mobile || "—", "Email", engineer.email || "—"],
                        ["Status", engineer.status, "Joining Date", engineer.joiningDate || "—"],
                        ["PAN", engineer.pan_number || "—", "Aadhaar", engineer.aadhaar_number || "—"],
                        ["Projects", engineer.projects || "—", "Performance", engineer.performance || "—"],
                    ],
                    theme: "grid",
                    styles: { fontSize: 9, cellPadding: 3 },
                    columnStyles: {
                        0: { fontStyle: "bold", fillColor: [241, 245, 249], cellWidth: 35 },
                        2: { fontStyle: "bold", fillColor: [241, 245, 249], cellWidth: 35 },
                    },
                });

                // ── Site Vitals ──────────────────────────────────────────
                const afterProfile = (doc as any).lastAutoTable.finalY + 10;
                doc.setFontSize(12);
                doc.setFont("helvetica", "bold");
                doc.text("Site Vitals", 14, afterProfile);

                autoTable(doc, {
                    startY: afterProfile + 5,
                    head: [["Metric", "Value"]],
                    body: [
                        ["Total Labour Today", String(vitals.total_labour_today)],
                        ["Skilled Labour", String(vitals.skilled_labour)],
                        ["Unskilled Labour", String(vitals.unskilled_labour)],
                        ["Active Activities", String(vitals.active_activities)],
                        ["Open Issues", String(vitals.open_issues?.total || 0)],
                        ["High Priority Issues", String(vitals.open_issues?.high_priority || 0)],
                        ["Total Expenses", `₹${(vitals.total_expenses || 0).toLocaleString("en-IN")}`],
                        ["Progress", `${vitals.progress || 0}%`],
                        ["Weather", engineer.weather || "—"],
                    ],
                    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 9 },
                    styles: { fontSize: 9, cellPadding: 3 },
                    columnStyles: {
                        0: { fontStyle: "bold", fillColor: [241, 245, 249], cellWidth: 70 },
                    },
                });

                // ── DSR Logs ─────────────────────────────────────────────
                if (dsrData.length > 0) {
                    const afterVitals = (doc as any).lastAutoTable.finalY + 10;
                    doc.setFontSize(12);
                    doc.setFont("helvetica", "bold");
                    doc.text("Recent DSR Logs", 14, afterVitals);

                    autoTable(doc, {
                        startY: afterVitals + 5,
                        head: [["Date", "Weather", "Work Done", "Labour Count"]],
                        body: dsrData.slice(0, 10).map((d: any) => [
                            d.report_date || d.date || "—",
                            d.weather || "—",
                            (d.work_done || d.activities_summary || "—").substring(0, 60),
                            String(d.total_labour || d.labour_count || "—"),
                        ]),
                        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 9 },
                        styles: { fontSize: 8, cellPadding: 2, overflow: "ellipsize" },
                    });
                }

                // ── Footer ───────────────────────────────────────────────
                const pageCount = (doc.internal as any).getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setFontSize(8);
                    doc.setTextColor(148, 163, 184);
                    doc.text(
                        `InfraPilot — Confidential Site Report | Page ${i} of ${pageCount}`,
                        pageWidth / 2,
                        doc.internal.pageSize.getHeight() - 8,
                        { align: "center" }
                    );
                }

                const safeName = (engineer.name || "engineer").replace(/\s+/g, "_");
                doc.save(`Site_Report_${safeName}_${new Date().toISOString().split("T")[0]}.pdf`);
                toast.success("Site Report Downloaded!", { id: toastId });
            } catch (pdfErr) {
                console.error("Export failed:", pdfErr);
                toast.error("Failed to export site report.", { id: toastId });
            }
        }
    };



    return (
        <>
            <Navbar title="Engineer Intelligence" breadcrumb={["Admin", "Staff", engineer.name]} />
            <PageTransition className="bg-slate-100 min-h-screen">

                {/* ── Hero Header ───────────────────────────────────────── */}
                <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 px-6 md:px-10 pt-8 pb-0 relative overflow-hidden -mt-20 pt-[calc(5rem+2rem)]">
                    <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/4" />
                    </div>
                    <div className="relative z-10">
                        <button onClick={() => navigate("/admin/engineers")}
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-bold text-sm mb-6">
                            <ChevronLeft className="w-4 h-4" /> Back to Staff Force
                        </button>
                        <div className="flex flex-col md:flex-row md:items-end gap-6 pb-8">
                            <div className="w-24 h-24 rounded-2xl bg-white/20 border-4 border-white/30 shadow-2xl overflow-hidden shrink-0">
                                {engineerData?.profile_image ? (
                                    <img src={getFullImageUrl(engineerData.profile_image)} alt={engineer.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-white text-3xl font-black">{engineer.name.charAt(0)}</div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="px-2.5 py-1 bg-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-lg">{engineer.status}</span>
                                    {engineer.experience && <span className="px-2.5 py-1 bg-white/10 text-white/70 text-[10px] font-bold uppercase tracking-widest rounded-lg">{engineer.experience} Exp</span>}
                                </div>
                                <h1 className="text-3xl font-black text-white tracking-tight">{engineer.name}</h1>
                                <p className="text-white/60 text-sm font-semibold mt-1">{engineer.specialization}</p>
                            </div>
                            <button onClick={handleExport}
                                className="shrink-0 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95">
                                Export Site Report
                            </button>
                        </div>
                        {/* 4-stat strip */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10 rounded-t-2xl overflow-hidden">
                            {[
                                { label: "Labour Today", value: vitals.total_labour_today, icon: <Users className="w-4 h-4" />, color: "text-white" },
                                { label: "Active Tasks", value: vitals.active_activities, icon: <TrendingUp className="w-4 h-4" />, color: "text-emerald-300" },
                                { label: "Open Issues", value: vitals.open_issues?.total ?? 0, icon: <AlertTriangle className="w-4 h-4" />, color: "text-amber-300" },
                                { label: "Progress", value: `${vitals.progress}%`, icon: <Camera className="w-4 h-4" />, color: "text-blue-200" },
                            ].map(s => (
                                <div key={s.label} className="bg-white/10 px-5 py-4 flex items-center gap-3">
                                    <span className={s.color}>{s.icon}</span>
                                    <div>
                                        <p className="text-white/50 text-[9px] font-black uppercase tracking-widest">{s.label}</p>
                                        <p className={`text-xl font-black ${s.color}`}>{s.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* ── Main Content ────────────────────────────────────── */}
                <div className="p-6 md:p-10 grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-8 items-start bg-slate-100">
                    {/* LEFT SIDEBAR */}
                    <div className="space-y-5">
                        {/* Contact card */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Information</h3>
                            <ContactItem icon={<Phone className="w-4 h-4" />} label="Mobile" value={engineer.mobile} />
                            <ContactItem icon={<Mail className="w-4 h-4" />} label="Email" value={engineer.email} />
                            <ContactItem icon={<MapPin className="w-4 h-4" />} label="Deployed At" value={engineer.projects} />
                            <ContactItem icon={<Calendar className="w-4 h-4" />} label="Joining Date" value={engineer.joiningDate} />
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-50">
                                <ContactItem icon={<CreditCard className="w-4 h-4" />} label="PAN" value={engineer.pan_number} />
                                <ContactItem icon={<Fingerprint className="w-4 h-4" />} label="Aadhaar" value={engineer.aadhaar_number} />
                            </div>
                        </div>
                        {/* Weather card */}
                        <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-28 h-28 bg-primary/30 rounded-full blur-2xl -mb-14 -mr-14" />
                            <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4">Site Weather</h3>
                            <div className="grid grid-cols-2 gap-4 relative z-10 mb-4">
                                <div>
                                    <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                                        <Thermometer className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Temp</span>
                                    </div>
                                    <p className="text-2xl font-black">{liveWeather.temperature}°C</p>
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                                        <Droplets className="w-3.5 h-3.5" />
                                        <span className="text-[9px] font-black uppercase tracking-widest">Humidity</span>
                                    </div>
                                    <p className="text-2xl font-black">{liveWeather.humidity}%</p>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wind className="w-4 h-4 text-slate-400" />
                                    <span className="text-sm font-bold">{liveWeather.windSpeed} km/h</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{liveWeather.condition}</span>
                            </div>
                        </div>

                        {/* Labour card */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800">Labour Density</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total: {vitals.total_labour_today}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-primary/5 rounded-xl text-center">
                                    <p className="text-2xl font-black text-primary">{vitals.skilled_labour}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Skilled</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl text-center">
                                    <p className="text-2xl font-black text-slate-600">{vitals.unskilled_labour}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Helpers</p>
                                </div>
                            </div>
                        </div>
                        {/* Issue Analytics */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center text-rose-500">
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800">Issue Analytics</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">DSR Summary</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl text-center">
                                    <p className="text-2xl font-black text-slate-800">{issueAnalytics ? issueAnalytics.total_reports : vitals.open_issues?.total ?? 0}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Total Reports</p>
                                </div>
                                <div className="p-3 bg-rose-50 rounded-xl text-center">
                                    <p className="text-2xl font-black text-rose-600">{issueAnalytics ? issueAnalytics.reports_with_issues : vitals.open_issues?.high_priority ?? 0}</p>
                                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mt-1">With Issues</p>
                                </div>
                            </div>
                            {issueAnalytics && issueAnalytics.total_reports > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issue Rate</span>
                                        <span className="text-[10px] font-black text-rose-500">{Math.round((issueAnalytics.reports_with_issues / issueAnalytics.total_reports) * 100)}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-400 rounded-full transition-all duration-700" style={{ width: `${Math.round((issueAnalytics.reports_with_issues / issueAnalytics.total_reports) * 100)}%` }} />
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Active task */}
                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-800">Live Supervision</h3>
                                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest animate-pulse">Session Active</p>
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                <p className="text-sm font-bold text-slate-700">{engineer.activeTask}</p>
                            </div>
                        </div>
                    </div>{/* end LEFT SIDEBAR */}

                    {/* RIGHT MAIN PANEL */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 7rem)', position: 'sticky', top: '1rem' }}>
                        {/* Tab Bar */}
                        <div className="px-6 pt-5 pb-0 flex items-center justify-between border-b border-slate-100 flex-wrap gap-3">
                            <div className="flex gap-1">
                                {[
                                    { key: "photos", label: "Site Photos", count: sitePhotos.length + dsrData.filter(d => d.dsr_image).length },
                                    { key: "materials", label: "Material Log", count: undefined },
                                    { key: "dsr", label: "Daily Reports", count: dsrData.length },
                                ].map(tab => (
                                    <button key={tab.key} onClick={() => setMirrorFilter(tab.key as any)}
                                        className={`relative px-4 py-3 text-xs font-black uppercase tracking-widest rounded-t-xl transition-all flex items-center gap-2 ${mirrorFilter === tab.key ? "bg-primary text-white" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                            }`}>
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${mirrorFilter === tab.key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"}`}>{tab.count}</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                            {assignedProjects.length > 1 && (
                                <div className="flex items-center gap-2 pb-2">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Site:</span>
                                    <select className="bg-slate-50 border border-slate-200 text-xs font-bold text-primary rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-100"
                                        value={activeProjectId || ""} onChange={(e) => setActiveProjectId(Number(e.target.value))}>
                                        {assignedProjects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-hidden p-6 flex flex-col min-h-0">
                            {mirrorFilter === "photos" && (() => {
                                const dsrPhotos = dsrData.filter(d => d.dsr_image).map((d: any) => ({
                                    url: sitePhotoService.resolveUrl(d.dsr_image), caption: d.report_date, sub: d.work_done
                                }));
                                const spPhotos = sitePhotos.map((p: any) => ({
                                    url: sitePhotoService.resolveUrl(p.url || p.photo_url),
                                    caption: p.date || p.activity_tag || "Site Photo",
                                    sub: p.description || p.location_tag || ""
                                }));
                                return <div className="flex-1 overflow-y-auto"><PhotoGallery photos={[...spPhotos, ...dsrPhotos]} /></div>;
                            })()}

                            {mirrorFilter === "materials" && (() => {
                                const totalMatPages = Math.ceil(materialLogs.length / MATERIAL_PAGE_SIZE);
                                const pagedMats = materialLogs.slice(materialPage * MATERIAL_PAGE_SIZE, (materialPage + 1) * MATERIAL_PAGE_SIZE);
                                return (
                                    <div className="flex flex-col h-full">
                                        {/* Scrollable list */}
                                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                            {materialLogs.length > 0 ? pagedMats.map((log, i) => (
                                                <div key={log.id || i} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-100">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${(log.type || "").toUpperCase() === "IN" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"}`}>
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-slate-800">{log.material_name || `Material #${log.material_id}`}</p>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-0.5">{log.issue_type || log.type || "CONSUMPTION"} · {new Date(log.created_at).toLocaleString()}</p>
                                                            {log.total_amount > 0 && <p className="text-[10px] text-slate-400">₹{log.total_amount?.toLocaleString("en-IN")}</p>}
                                                        </div>
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className={`text-base font-black ${(log.type || "").toUpperCase() === "IN" ? "text-emerald-600" : "text-blue-600"}`}>
                                                            {(log.type || "").toUpperCase() === "IN" ? "+" : ""}{log.quantity} units
                                                        </p>
                                                        {log.payment_pending > 0 && <p className="text-[10px] text-amber-500 font-bold">₹{log.payment_pending?.toLocaleString("en-IN")} pending</p>}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                                    <Package className="w-10 h-10 mb-3 opacity-30" />
                                                    <p className="font-bold uppercase tracking-widest text-xs">No material logs found</p>
                                                </div>
                                            )}
                                        </div>
                                        {/* Always-visible pagination footer */}
                                        {totalMatPages > 1 && (
                                            <div className="shrink-0 pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{materialPage * MATERIAL_PAGE_SIZE + 1}–{Math.min((materialPage + 1) * MATERIAL_PAGE_SIZE, materialLogs.length)} of {materialLogs.length} logs</p>
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => setMaterialPage(p => Math.max(0, p - 1))} disabled={materialPage === 0} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                                    </button>
                                                    {Array.from({ length: totalMatPages }, (_, i) => i).slice(Math.max(0, materialPage - 2), Math.min(totalMatPages, materialPage + 3)).map(p => (
                                                        <button key={p} onClick={() => setMaterialPage(p)} className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${materialPage === p ? "bg-primary text-white shadow-sm" : "border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>{p + 1}</button>
                                                    ))}
                                                    <button onClick={() => setMaterialPage(p => Math.min(totalMatPages - 1, p + 1))} disabled={materialPage >= totalMatPages - 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {mirrorFilter === "dsr" && (() => {
                                const totalDsrPages = Math.ceil(dsrData.length / DSR_PAGE_SIZE);
                                const pagedDsrs = dsrData.slice(dsrPage * DSR_PAGE_SIZE, (dsrPage + 1) * DSR_PAGE_SIZE);
                                return (
                                    <div className="flex flex-col h-full">
                                        {/* Scrollable DSR list */}
                                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                            {dsrData.length > 0 ? pagedDsrs.map((dsr, i) => (
                                                <div key={dsr.id || i} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden hover:shadow-sm transition-all">
                                                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`w-2 h-2 rounded-full shrink-0 ${dsr.status === "Submitted" ? "bg-primary" : dsr.status === "Approved" ? "bg-emerald-500" : "bg-amber-400"}`} />
                                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{dsr.status || "Submitted"}</span>
                                                        </div>
                                                        <span className="text-[11px] font-bold text-slate-400">{new Date(dsr.report_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
                                                    </div>
                                                    <div className="px-5 py-4">
                                                        <p className="text-sm font-bold text-slate-800 mb-1">{dsr.work_done?.split('.')[0] || "Site Activity"}</p>
                                                        <p className="text-xs text-slate-500 leading-relaxed">{dsr.work_done}</p>
                                                        {dsr.issues && (
                                                            <div className="mt-3 pt-3 border-t border-slate-200">
                                                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Issue Reported</p>
                                                                <p className="text-xs text-slate-500">{dsr.issues}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="text-center py-20 text-slate-400 font-bold uppercase tracking-widest text-xs">No daily reports found</div>
                                            )}
                                        </div>
                                        {/* Always-visible pagination footer */}
                                        {totalDsrPages > 1 && (
                                            <div className="shrink-0 pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{dsrPage * DSR_PAGE_SIZE + 1}–{Math.min((dsrPage + 1) * DSR_PAGE_SIZE, dsrData.length)} of {dsrData.length} reports</p>
                                                <div className="flex items-center gap-1.5">
                                                    <button onClick={() => setDsrPage(p => Math.max(0, p - 1))} disabled={dsrPage === 0} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                                    </button>
                                                    {Array.from({ length: totalDsrPages }, (_, i) => i).slice(Math.max(0, dsrPage - 2), Math.min(totalDsrPages, dsrPage + 3)).map(p => (
                                                        <button key={p} onClick={() => setDsrPage(p)} className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold transition-all ${dsrPage === p ? "bg-primary text-white shadow-sm" : "border border-slate-200 text-slate-500 hover:bg-slate-50"}`}>{p + 1}</button>
                                                    ))}
                                                    <button onClick={() => setDsrPage(p => Math.min(totalDsrPages - 1, p + 1))} disabled={dsrPage >= totalDsrPages - 1} className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed">
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    </div>{/* end RIGHT MAIN PANEL */}
                </div>{/* end grid */}
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

const PhotoGallery: React.FC<{ photos: { url: string | null; caption: string; sub: string }[] }> = ({ photos }) => {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

    const openLightbox = (i: number) => setLightboxIdx(i);
    const closeLightbox = () => setLightboxIdx(null);
    const goPrev = () => setLightboxIdx(prev => (prev !== null && prev > 0 ? prev - 1 : prev));
    const goNext = () => setLightboxIdx(prev => (prev !== null && prev < photos.length - 1 ? prev + 1 : prev));

    // Keyboard navigation
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (lightboxIdx === null) return;
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
            if (e.key === "Escape") closeLightbox();
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [lightboxIdx]);

    return (
        <>
            {/* View toggle */}
            <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{photos.length} Photos</span>
                <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                    <button
                        onClick={() => setViewMode("grid")}
                        title="Grid view"
                        className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        <LayoutGrid size={14} strokeWidth={2.5} />
                    </button>
                    <button
                        onClick={() => setViewMode("list")}
                        title="List view"
                        className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                    >
                        <LayoutList size={14} strokeWidth={2.5} />
                    </button>
                </div>
            </div>

            {photos.length > 0 ? (
                viewMode === "grid" ? (
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {photos.map((item, i) => (
                            <div
                                key={i}
                                onClick={() => openLightbox(i)}
                                className="group relative aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 hover:border-primary/40 hover:shadow-md transition-all cursor-zoom-in"
                            >
                                <img src={item.url || ""} alt="Site" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-all">
                                    <p className="text-[8px] text-white font-black uppercase tracking-widest truncate">{item.caption}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {photos.map((item, i) => (
                            <div
                                key={i}
                                onClick={() => openLightbox(i)}
                                className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/30 hover:bg-white hover:shadow-sm transition-all cursor-zoom-in group"
                            >
                                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                                    <img src={item.url || ""} alt="Site" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-slate-700 uppercase tracking-widest">{item.caption}</p>
                                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">{item.sub}</p>
                                </div>
                                <div className="ml-auto shrink-0 w-6 h-6 rounded-lg bg-slate-100 group-hover:bg-primary group-hover:text-white flex items-center justify-center transition-all">
                                    <Camera className="w-3 h-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="aspect-square bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                            <Camera className="w-6 h-6 text-slate-200" />
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox */}
            {lightboxIdx !== null && photos[lightboxIdx] && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4"
                    onClick={closeLightbox}
                >
                    <button onClick={closeLightbox} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-lg font-bold transition-all">✕</button>

                    {lightboxIdx > 0 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goPrev(); }}
                            className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl font-bold transition-all"
                        >‹</button>
                    )}
                    {lightboxIdx < photos.length - 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goNext(); }}
                            className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl font-bold transition-all"
                        >›</button>
                    )}

                    <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={photos[lightboxIdx].url || ""}
                            alt="Site photo"
                            className="w-full max-h-[80vh] object-contain rounded-2xl"
                        />
                        <div className="text-center mt-4">
                            <p className="text-white font-black text-sm uppercase tracking-widest">{photos[lightboxIdx].caption}</p>
                            <p className="text-white/50 text-xs font-medium mt-1">{photos[lightboxIdx].sub}</p>
                            <p className="text-white/30 text-[10px] mt-2">{lightboxIdx + 1} / {photos.length}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default EngineerProfilePage;
