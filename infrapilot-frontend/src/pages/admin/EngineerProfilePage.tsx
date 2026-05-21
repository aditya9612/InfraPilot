import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { generateEngineerReportPDF } from "../../utils/projectPDFGenerator";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import {
    Camera, Package, Wind, Droplets,
    Thermometer, Users, ChevronLeft, Calendar,
    TrendingUp, MapPin, Phone, Mail
} from "lucide-react";
import { userService } from "../../services/userService";
import { dsrService } from "../../services/dsrService";
import { projectService } from "../../services/projectService";
import { materialService } from "../../services/materialService";

const EngineerProfilePage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [mirrorFilter, setMirrorFilter] = useState<"photos" | "materials" | "dsr">("photos");
    const [engineer, setEngineer] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dsrData, setDsrData] = useState<any[]>([]);
    const [materialLogs, setMaterialLogs] = useState<any[]>([]);
    const [labourTrend, setLabourTrend] = useState<any>(null);
    const [projectId, setProjectId] = useState<number | null>(null);

    useEffect(() => {
        const fetchEngineer = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const u = await userService.getUserById(parseInt(id));

                // Find project where user is a member
                const projectsRes = await projectService.getProjects(100, 0);
                const allProjects = Array.isArray(projectsRes) ? projectsRes : (projectsRes.items || projectsRes.data || []);

                let foundProjectId = null;
                // Brute force check for now: find a project where this user is listed as a member
                // Or if address matches a project name
                const projectMatchesAddress = allProjects.find((p: any) => p.project_name === u.address);
                if (projectMatchesAddress) {
                    foundProjectId = projectMatchesAddress.id;
                } else {
                    // Try checking members for recent projects
                    const recentProjects = allProjects.slice(0, 10);
                    const membersLists = await Promise.all(recentProjects.map((p: any) => projectService.getProjectMembers(p.id).catch(() => [])));
                    const foundIndex = membersLists.findIndex(list => {
                        const items = Array.isArray(list) ? list : (list.items || list.data || []);
                        return items.some((m: any) => (m.user_id || m.user?.id || m.id) === u.user_id);
                    });
                    if (foundIndex !== -1) {
                        foundProjectId = recentProjects[foundIndex].id;
                    }
                }

                setProjectId(foundProjectId);

                if (foundProjectId) {
                    const [dsrs, logs, trend] = await Promise.all([
                        dsrService.getDsrByProject(foundProjectId).catch(() => ({ items: [] })),
                        materialService.getLogs({ project_id: foundProjectId, limit: 10 }).catch(() => []),
                        dsrService.getLabourTrend(foundProjectId).catch(() => [])
                    ]);

                    const latestDsr = dsrs.items?.[0];
                    const activeTrend = trend[trend.length - 1] || null;

                    setDsrData(dsrs.items || []);
                    setMaterialLogs(logs);
                    setLabourTrend(activeTrend);

                    // Map to UI structure with real data
                    const mapped = {
                        id: u.user_id,
                        name: u.full_name,
                        email: u.email,
                        mobile: u.mobile_number,
                        projects: u.address || (foundProjectId ? allProjects.find((p: any) => p.id === foundProjectId)?.project_name : "Not Assigned"),
                        experience: u.joining_date ? `${Math.floor((new Date().getTime() - new Date(u.joining_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} Years` : "5 Years",
                        performance: "Outstanding",
                        status: u.is_active ? "On Site" : "Leave",
                        specialization: u.designation || "Site Engineer",
                        lastDsr: latestDsr?.report_date || u.updated_at || new Date().toISOString(),
                        weather: latestDsr?.weather || "Sunny, 32°C",
                        laborCount: latestDsr?.total_labour || 0,
                        activeTask: latestDsr?.work_done ? latestDsr?.work_done.split('.')[0] : "Site Supervision",
                        joiningDate: u.joining_date || "2024-01-01",
                        humidity: "54%",
                        windSpeed: "12 km/h",
                        photos: []
                    };
                    setEngineer(mapped);
                } else {
                    // Mapping for user with no project
                    const mappedFallback = {
                        id: u.user_id,
                        name: u.full_name,
                        email: u.email,
                        mobile: u.mobile_number,
                        projects: u.address || "Not Assigned",
                        experience: u.joining_date ? `${Math.floor((new Date().getTime() - new Date(u.joining_date).getTime()) / (1000 * 60 * 60 * 24 * 365))} Years` : "5 Years",
                        performance: "Outstanding",
                        status: u.is_active ? "On Site" : "Leave",
                        specialization: u.designation || "Site Engineer",
                        lastDsr: "N/A",
                        weather: "N/A",
                        laborCount: 0,
                        activeTask: "Unassigned",
                        joiningDate: u.joining_date || "2024-01-01",
                        humidity: "N/A",
                        windSpeed: "N/A",
                        photos: []
                    };
                    setEngineer(mappedFallback);
                }
            } catch (error) {
                console.error("Failed to fetch engineer:", error);
                toast.error("Failed to load engineer profile.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchEngineer();
    }, [id]);

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

    const handleExport = () => {
        toast.promise(
            new Promise((resolve) => {
                setTimeout(() => {
                    generateEngineerReportPDF(engineer);
                    resolve(true);
                }, 1500);
            }),
            {
                loading: 'Compiling Site Intelligence...',
                success: 'Site Report Generated!',
                error: 'Failed to export report.',
            }
        );
    };

    const handleContact = () => {
        window.location.href = `mailto:${engineer.email}?subject=Site Intelligence Inquiry: ${engineer.projects}&body=Hello ${engineer.name},%0D%0A%0D%0AI am reaching out regarding the current status at ${engineer.projects}.`;
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
                        <button
                            onClick={handleContact}
                            className="px-5 py-2 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                        >
                            Contact Engineer
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
                                <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 flex items-center justify-center text-white text-4xl font-black shadow-2xl border-4 border-white">
                                    {engineer.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{engineer.name}</h2>
                                    <p className="text-primary font-bold text-xs uppercase tracking-[0.2em] mt-1">{engineer.specialization}</p>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                                        {engineer.status}
                                    </span>
                                    <span className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">
                                        {engineer.experience} Exp
                                    </span>
                                </div>
                            </div>

                            {/* Quick Contacts */}
                            <div className="mt-8 space-y-4 pt-8 border-t border-slate-50">
                                <ContactItem icon={<Phone className="w-4 h-4" />} label="Mobile" value={engineer.mobile} />
                                <ContactItem icon={<Mail className="w-4 h-4" />} label="Official Email" value={engineer.email} />
                                <div className="flex items-center justify-between group cursor-pointer" onClick={() => projectId && window.open(`/admin/projects/${projectId}`, '_blank')}>
                                    <ContactItem icon={<MapPin className="w-4 h-4" />} label="Current Deployment" value={engineer.projects} />
                                    {projectId && <div className="text-[9px] font-bold text-primary group-hover:underline">View Project</div>}
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
                                    <p className="text-3xl font-black">{engineer.weather.includes(',') ? engineer.weather.split(',')[1].trim() : engineer.weather}</p>
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Droplets className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Humidity</span>
                                    </div>
                                    <p className="text-3xl font-black">{engineer.humidity}</p>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Wind className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <p className="text-[9px] font-black text-white/40 uppercase tracking-tighter">Wind Speed</p>
                                        <p className="text-sm font-bold">{engineer.windSpeed}</p>
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
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Total: {engineer.laborCount} Staff</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                        <p className="text-xl font-black text-primary">
                                            {labourTrend ? labourTrend.labour : Math.round(engineer.laborCount * 0.6)}
                                        </p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Skilled Staff</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                        <p className="text-xl font-black text-slate-600">
                                            {engineer.laborCount ? Math.max(0, engineer.laborCount - (labourTrend?.labour || Math.round(engineer.laborCount * 0.6))) : 0}
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
                                <div className="flex gap-8">
                                    <MirrorTab
                                        active={mirrorFilter === "photos"}
                                        onClick={() => setMirrorFilter("photos")}
                                        label="Site Photos"
                                        count={dsrData.filter(d => d.dsr_image).length}
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
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                                    Live Site Mirror
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                {mirrorFilter === "photos" && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                        {dsrData.filter(d => d.dsr_image).length > 0 ? (
                                            dsrData.filter(d => d.dsr_image).map((item: any, i: number) => (
                                                <div key={i} className="group relative aspect-square bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100 hover:border-primary/30 transition-all cursor-zoom-in">
                                                    <img src={item.dsr_image} alt="Site activity" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                                                        <p className="text-[10px] text-white font-black uppercase tracking-widest">{item.report_date} • Live Feed</p>
                                                        <p className="text-[9px] text-white/60 font-medium mt-1 truncate">
                                                            {item.work_done}
                                                        </p>
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
                                )}

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
                                                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{dsr.status || "Submitted"}</span>
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
