import { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { projectService } from "../../services/projectService";
import { userService } from "../../services/userService";
import { Users, Truck, MapPin, ArrowRightLeft, TrendingUp, AlertCircle, Search } from "lucide-react";
import toast from "react-hot-toast";

const ResourceOrchestratorPage = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [engineers, setEngineers] = useState<any[]>([]);
    const [laborGroups, setLaborGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsRes, usersRes] = await Promise.all([
                    projectService.getProjects(),
                    userService.getAllUsers(100, 0, "")
                ]);

                const projectList = Array.isArray(projectsRes) ? projectsRes : projectsRes.items || [];
                setProjects(projectList);

                const allUsers = Array.isArray(usersRes) ? usersRes : usersRes.items || [];
                setEngineers(allUsers.filter((u: any) => u.role === "SiteEngineer"));

                // Mock Labor Groups for orchestration view
                setLaborGroups([
                    { id: 1, name: "Alpha Constructions", strength: 45, skill: "Masonry", current_site: projectList[0]?.project_name },
                    { id: 2, name: "Om Contractors", strength: 30, skill: "Earthworks", current_site: projectList[1]?.project_name },
                    { id: 3, name: "Skyline Services", strength: 25, skill: "Electrical", current_site: "Main Head office" },
                ]);

            } catch (err) {
                toast.error("Failed to sync resource vault.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleReassign = (resource: any) => {
        toast.success(`Mobilization Initiated: Reassigning ${resource.name || resource.full_name}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-50">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <>
            <Navbar title="Resource Orchestrator" breadcrumb={["Manager", "Resources", "Orchestrator"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                <div className="max-w-[1600px] mx-auto space-y-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Mobilization & Orchestration</h1>
                            <p className="text-slate-500 font-medium">Optimize workforce deployment across active construction sites.</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all">
                                <ArrowRightLeft className="w-4 h-4" />
                                Smart Batch Reassign
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard title="Active Engineers" value={engineers.length.toString()} sub="Deployed On-Site" icon={<Users className="w-5 h-5 text-primary" />} />
                        <StatCard title="Labor Strength" value="1240" sub="Across All Projects" icon={<Truck className="w-5 h-5 text-emerald-500" />} />
                        <StatCard title="Avg. Deployment" value="84%" sub="Resource Utilization" icon={<TrendingUp className="w-5 h-5 text-blue-500" />} />
                        <StatCard title="Understaffed" value="2" sub="Projects At Risk" accent="text-rose-600" icon={<AlertCircle className="w-5 h-5 text-rose-600" />} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Engineer Pool */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-lg font-black text-slate-700 uppercase tracking-tight">Engineer Deployment Map</h2>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" placeholder="Search by name..." className="pl-10 pr-4 py-2 bg-slate-50 rounded-xl text-xs outline-none border border-transparent focus:border-primary/20 w-64" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {engineers.map(eng => (
                                        <div key={eng.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-primary/20 transition-all group">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-primary shadow-sm">
                                                        {eng.full_name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-bold text-slate-800">{eng.full_name}</h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{eng.mobile_number}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleReassign(eng)}
                                                    className="p-2 bg-white text-slate-400 hover:text-primary rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all"
                                                >
                                                    <ArrowRightLeft className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200/50">
                                                <MapPin className="w-3 h-3 text-slate-300" />
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Assigned to: </span>
                                                <span className="text-[10px] font-black text-primary uppercase">M-Hub Project alpha</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Labor Squads */}
                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                                <h2 className="text-lg font-black text-slate-700 uppercase tracking-tight mb-6">Labor Squad Orchestration</h2>
                                <div className="space-y-3">
                                    {laborGroups.map(group => (
                                        <div key={group.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-inner">
                                                    <Truck className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800 uppercase">{group.name}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{group.skill}</span>
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                        <span className="text-[10px] font-bold text-emerald-500">{group.strength} Workers</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 mt-4 md:mt-0">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Current Deployment</p>
                                                    <p className="text-xs font-black text-slate-700">{group.current_site}</p>
                                                </div>
                                                <button
                                                    onClick={() => handleReassign(group)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all"
                                                >
                                                    <ArrowRightLeft className="w-3 h-3" />
                                                    Reassign
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Project Saturation Heatmap */}
                        <div className="space-y-6">
                            <div className="bg-slate-800 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-xl font-black mb-1">Site Saturation</h3>
                                    <p className="text-slate-400 text-sm mb-8">Resource vs Task Load</p>

                                    <div className="space-y-6">
                                        {projects.slice(0, 5).map((p, idx) => (
                                            <div key={p.id}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-bold uppercase tracking-widest">{p.project_name}</span>
                                                    <span className="text-xs font-black text-emerald-400">{80 - (idx * 15)}%</span>
                                                </div>
                                                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                                    <div className={`h-full ${idx === 3 ? 'bg-rose-500' : 'bg-emerald-500'} rounded-full`} style={{ width: `${80 - (idx * 15)}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
                            </div>

                            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
                                <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest mb-4">Mobilization History</h3>
                                <div className="space-y-4">
                                    {[1, 2].map(i => (
                                        <div key={i} className="flex items-start gap-3 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                            <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-800">Engineer Rajesh M reassigned to Metro Hub</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">2 hours ago</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default ResourceOrchestratorPage;
