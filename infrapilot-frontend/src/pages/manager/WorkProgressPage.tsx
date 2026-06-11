import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { 
  Clipboard, 
  Calendar, 
  FileText, 
  ChevronRight, 
  TrendingUp, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Filter,
  BarChart2
} from "lucide-react";

const WorkProgressPage = () => {
    const navigate = useNavigate();
    const { tab } = useParams();
    const activeTab = tab || "daily";

    const tabs = [
        { id: "daily", label: "Daily Progress", icon: <Clipboard className="w-4 h-4" /> },
        { id: "weekly", label: "Weekly Progress", icon: <Calendar className="w-4 h-4" /> },
        { id: "reports", label: "Progress Reports", icon: <FileText className="w-4 h-4" /> },
    ];

    const handleTabChange = (tabId: string) => {
        navigate(`/manager/work-progress/${tabId}`);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar 
                title="Work Progress" 
                breadcrumb={["Manager", "Work Progress", tabs.find(t => t.id === activeTab)?.label || "Daily"]} 
            />

            <PageTransition className="p-6 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Project Execution Hub</h1>
                        <p className="text-slate-500 mt-1">Monitor site velocity, milestones, and daily operational excellence.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                            <Download className="w-4 h-4 text-primary" />
                            Export Data
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex p-1.5 bg-slate-200/50 backdrop-blur-sm rounded-2xl mb-8 w-fit border border-white/50 shadow-inner">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                activeTab === t.id 
                                ? "text-primary shadow-sm" 
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                            }`}
                        >
                            {activeTab === t.id && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white rounded-xl"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10">{t.icon}</span>
                            <span className="relative z-10">{t.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === "daily" && <DailyProgressView />}
                        {activeTab === "weekly" && <WeeklyProgressView />}
                        {activeTab === "reports" && <ProgressReportsView />}
                    </motion.div>
                </AnimatePresence>
            </PageTransition>
        </div>
    );
};

const DailyProgressView = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
                title="Active Labor" 
                value="248" 
                sub="Across 4 sites" 
                accent="text-primary"
                icon={<Users className="w-5 h-5 text-primary" />}
            />
            <StatCard 
                title="Tasks Completed" 
                value="12/15" 
                sub="Today's target" 
                accent="text-emerald-500"
                icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
            />
            <StatCard 
                title="Pending Approvals" 
                value="07" 
                sub="DSR submissions" 
                accent="text-amber-500"
                icon={<Clipboard className="w-5 h-5 text-amber-500" />}
            />
            <StatCard 
                title="Critical Alerts" 
                value="02" 
                sub="Resource delays" 
                accent="text-rose-500"
                icon={<AlertCircle className="w-5 h-5 text-rose-500" />}
            />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800">Daily Site Activity Feed</h3>
                    <button className="text-primary text-xs font-bold hover:underline">View All Logs</button>
                </div>
                <div className="divide-y divide-slate-50">
                    {[
                        { time: "09:45 AM", project: "Skyline Residency", activity: "Foundation pouring commenced for Sector B", status: "In Progress", user: "Arjun M." },
                        { time: "11:20 AM", project: "Metro Ph-II", activity: "Steel reinforcement inspection completed", status: "Success", user: "Sana K." },
                        { time: "02:15 PM", project: "Coastal Bridge", activity: "Concrete curing report uploaded", status: "Success", user: "Rahul D." },
                        { time: "04:30 PM", project: "Skyline Residency", activity: "Material dispatch for slab 4 verified", status: "Success", user: "Arjun M." },
                    ].map((log, i) => (
                        <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                            <div className="w-16 text-[10px] font-bold text-slate-400">{log.time}</div>
                            <div className="flex-1">
                                <div className="text-xs font-bold text-slate-800">{log.project}</div>
                                <div className="text-xs text-slate-500">{log.activity}</div>
                            </div>
                            <div className="text-right">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tight ${log.status === "Success" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-primary"}`}>{log.status}</span>
                                <div className="text-[10px] text-slate-400 mt-0.5">by {log.user}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-800 mb-4">Manpower Distribution</h3>
                <div className="space-y-6">
                    {[
                        { label: "Skilled Masonry", count: 85, total: 100, color: "bg-primary" },
                        { label: "Steel Workers", count: 42, total: 50, color: "bg-blue-400" },
                        { label: "Electricians", count: 18, total: 25, color: "bg-indigo-400" },
                        { label: "General Labour", count: 103, total: 120, color: "bg-slate-400" },
                    ].map((item, i) => (
                        <div key={i}>
                            <div className="flex justify-between text-xs font-bold mb-2">
                                <span className="text-slate-600">{item.label}</span>
                                <span className="text-slate-900">{item.count} / {item.total}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.count / item.total) * 100}%` }}
                                    className={`h-full ${item.color}`}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-50">
                    <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-xl border border-primary/10">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        <div>
                            <div className="text-xs font-bold text-primary">Attendance Optimization</div>
                            <div className="text-[10px] text-slate-500">92% efficiency vs industry avg 84%</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const WeeklyProgressView = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50">
            <h3 className="text-lg font-bold text-slate-800">Weekly Milestones Tracking</h3>
            <p className="text-sm text-slate-500">Performance analysis for Week 24 (June 07 - June 14)</p>
        </div>
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4 mb-8">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={i} className={`p-4 rounded-xl border flex flex-col items-center gap-2 ${i === 3 ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-slate-50 border-slate-200"}`}>
                        <span className="text-xs font-bold opacity-70">{day}</span>
                        <span className={`text-lg font-black ${i === 3 ? "text-white" : "text-slate-800"}`}>{0 + i + 7}</span>
                        {i < 4 ? <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> : <div className="w-1.5 h-1.5 bg-slate-300 rounded-full" />}
                    </div>
                ))}
            </div>

            <div className="space-y-4">
                {[
                    { title: "Slab Casting - Floor 4", project: "Skyline Residency", progress: 100, status: "Completed", color: "border-l-emerald-500" },
                    { title: "Internal Plastering", project: "Metro Ph-II", progress: 65, status: "In Progress", color: "border-l-primary" },
                    { title: "Mechanical Fitouts", project: "Coastal Bridge", progress: 30, status: "Delayed", color: "border-l-rose-500" },
                    { title: "External Painting", project: "Green Valley", progress: 0, status: "Pending", color: "border-l-slate-300" },
                ].map((item, i) => (
                    <div key={i} className={`p-4 bg-white border border-slate-100 border-l-4 ${item.color} rounded-xl shadow-sm flex items-center justify-between group hover:shadow-md transition-shadow`}>
                        <div className="flex gap-4 items-center">
                            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                <BarChart2 className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
                                <p className="text-xs text-slate-500">{item.project}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <div className="hidden md:block w-32">
                                <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                    <span>Progress</span>
                                    <span>{item.progress}%</span>
                                </div>
                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary" style={{ width: `${item.progress}%` }} />
                                </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                item.status === "Completed" ? "bg-emerald-100 text-emerald-600" :
                                item.status === "In Progress" ? "bg-blue-100 text-primary" :
                                item.status === "Delayed" ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-500"
                            }`}>
                                {item.status}
                            </span>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

const ProgressReportsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
            { title: "Consolidated Daily Reports", icon: <FileText />, desc: "Complete site logs, labor attendance and material intake for the current week.", type: "Daily" },
            { title: "Weekly Milestone Analysis", icon: <TrendingUp />, desc: "Comparative study of planned vs actual progress across all active projects.", type: "Weekly" },
            { title: "Resource Utilization Summary", icon: <Users />, desc: "Deep dive into labor efficiency and machinery uptime metrics.", type: "Resource" },
            { title: "Engineering Audit Logs", icon: <CheckCircle2 />, desc: "Technical compliance and quality control verification reports.", type: "QC" },
            { title: "Delay & Risk Assessment", icon: <AlertCircle />, desc: "Identification of bottlenecks and predictive impact analysis.", type: "Risk" },
            { title: "Monthly Project Scorecard", icon: <BarChart2 />, desc: "Executive summary of holistic project performance and ROI tracking.", type: "Monthly" },
        ].map((report, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors mb-4">
                    {report.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">{report.type}</span>
                    <span className="text-[10px] text-slate-400 font-medium">Updated 2h ago</span>
                </div>
                <h4 className="font-bold text-slate-800 mb-2 group-hover:text-primary transition-colors">{report.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">{report.desc}</p>
                <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-colors">Preview</button>
                    <button className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-primary/20 transition-all">Download</button>
                </div>
            </div>
        ))}
    </div>
);

export default WorkProgressPage;
