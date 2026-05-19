import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { useAuth } from "../../context/AuthContext";
import { projectService } from "../../services/projectService";
import { dsrService } from "../../services/dsrService";
import { expenseService } from "../../services/expenseService";
import toast from "react-hot-toast";
import { Wallet, Clock, TrendingUp } from "lucide-react";

// ─── Main Component ───────────────────────────────────────────────────────────
const EngineerDashboard = () => {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [project, setProject] = useState<any>(null);
    const [stats, setStats] = useState({
        laborCount: 0,
        activeActivities: 0,
        openIssues: 0,
        expenseTotal: 0
    });
    const [activities, setActivities] = useState<any[]>([]);
    const [expenses, setExpenses] = useState<any[]>([]);
    const [milestones, setMilestones] = useState<any[]>([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            try {
                setIsLoading(true);

                // 1. Find engineer's project
                const projectsRes = await projectService.getProjects(100, 0);
                const allProjects = Array.isArray(projectsRes) ? projectsRes : (projectsRes.items || projectsRes.data || []);

                let foundProjectId = null;
                const recentProjects = allProjects.slice(0, 10);
                const membersLists = await Promise.all(recentProjects.map((p: any) => projectService.getProjectMembers(p.id).catch(() => [])));

                const foundIndex = membersLists.findIndex(list => {
                    const items = Array.isArray(list) ? list : (list.items || list.data || []);
                    return items.some((m: any) => String(m.user_id || m.user?.id || m.id) === String(user.id));
                });

                if (foundIndex !== -1) {
                    foundProjectId = recentProjects[foundIndex].id;
                } else if (allProjects.length > 0) {
                    foundProjectId = allProjects[0].id; // Demo Fallback
                }

                if (foundProjectId) {
                    const [pData, dsrRes, expRes, msData] = await Promise.all([
                        projectService.getProjectById(foundProjectId),
                        dsrService.getDsrByProject(foundProjectId).catch(() => ({ items: [] })),
                        expenseService.getExpensesByProject(foundProjectId).catch(() => []),
                        projectService.getMilestones(foundProjectId).catch(() => [])
                    ]);

                    setProject(pData);
                    setActivities(dsrRes.items || []);
                    setExpenses(expRes);
                    setMilestones(msData);

                    const latestDsr = dsrRes.items?.[0];
                    setStats({
                        laborCount: latestDsr?.total_labour || 0,
                        activeActivities: dsrRes.items?.length || 0,
                        openIssues: dsrRes.items?.filter((d: any) => d.issues).length || 0,
                        expenseTotal: expRes.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0)
                    });
                }
            } catch (error) {
                console.error("Dashboard Load Error:", error);
                toast.error("Failed to load real-time site data.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    const overallProgress = project?.completion_percentage || 0;
    const radius = 70;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference - (circumference * overallProgress) / 100;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium animate-pulse">Syncing site intelligence...</p>
            </div>
        );
    }

    return (
        <>
            <Navbar title="Site Overview" breadcrumb={["InfraPilot", "Engineer", "Dashboard"]} />

            <PageTransition className="p-4 md:p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">

                {/* ── Header ─────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">Project</p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{project?.project_name || "No Project Assigned"}</h1>
                        <p className="text-slate-500 text-sm">Real-time site progress, labor, and material monitoring.</p>
                    </div>
                </div>

                {/* ── Site Vitals ───────────────────────────────────────────── */}
                <div className="mb-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Site Vitals</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Labor Today"
                            value={stats.laborCount.toString()}
                            sub="Live Attendance"
                            accent="text-primary" />
                        <StatCard
                            title="Active Activities"
                            value={stats.activeActivities.toString()}
                            sub="Current DSR Entries"
                            accent="text-blue-500" />
                        <StatCard
                            title="Open Issues"
                            value={stats.openIssues.toString()}
                            sub="Pending Resolution"
                            accent="text-rose-500" />
                        <StatCard
                            title="Site Expenses"
                            value={`₹${(stats.expenseTotal / 1000).toFixed(1)}k`}
                            sub="Total Project Cost"
                            accent="text-violet-500" />
                    </div>
                </div>

                {/* ── Today's Work + Progress Circle ────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-6 md:mb-8">
                    <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Recent Work Summary</h2>
                                <p className="text-xs text-slate-400">Live activity log from Daily Service Reports</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            {activities.length > 0 ? activities.slice(0, 3).map((act, i) => (
                                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-1">
                                        <p className="text-sm font-bold text-slate-700">{act.work_done?.split('.')[0] || "Site Activity"}</p>
                                        <span className={`w-fit px-2 py-0.5 text-[10px] font-bold rounded shrink-0 bg-blue-100 text-blue-600`}>{act.status || "Submitted"}</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">{act.work_done}</p>
                                    <p className="text-[10px] text-slate-400 font-bold">{new Date(act.report_date).toLocaleDateString()}</p>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest border-2 border-dashed border-slate-100 rounded-xl">No activities logged yet</div>
                            )}
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
                        <div className="mt-8 p-3 bg-blue-50/50 rounded-xl w-full border border-blue-100/50">
                            <p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest mb-1">Status</p>
                            <p className="text-sm font-black text-slate-700">{project?.status || "Active"}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Expense Register */}
                    <div className="bg-slate-900 rounded-[2rem] p-8 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="relative z-10">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-xl font-black text-white tracking-tight">Recent Expenses</h3>
                                <Wallet className="w-6 h-6 text-primary" />
                            </div>
                            <div className="space-y-5">
                                {expenses.length > 0 ? expenses.slice(0, 4).map((exp, i) => (
                                    <div key={i} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 group-hover:bg-primary group-hover:text-white transition-all">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{exp.category}</p>
                                                <p className="text-[10px] text-white/40 font-medium">{new Date(exp.date).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <p className="text-sm font-black text-white">₹{(exp.amount || 0).toLocaleString()}</p>
                                    </div>
                                )) : (
                                    <p className="text-white/40 text-xs text-center py-4">No expense records found</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Timeline Tracking</h3>
                            <TrendingUp className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-6">
                            {milestones.length > 0 ? milestones.slice(0, 4).map((m, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${m.status === 'Completed' ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-primary group-hover:text-white"}`}>
                                            {i + 1}
                                        </div>
                                        {i !== 3 && i !== milestones.length - 1 && <div className="w-0.5 flex-1 bg-slate-100 my-1" />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-black ${m.status === 'Completed' ? "text-emerald-600" : "text-slate-800"}`}>{m.title}</p>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{new Date(m.start_date).toLocaleDateString()} - {new Date(m.end_date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-slate-400 text-xs text-center py-4">No milestones defined</p>
                            )}
                        </div>
                    </div>
                </div>

            </PageTransition>
        </>
    );
};

export default EngineerDashboard;
