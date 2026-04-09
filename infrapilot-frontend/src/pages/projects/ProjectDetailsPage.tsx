import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { PROJECTS, PROJECT_MEMBERS, MILESTONES, TASKS, PROFIT_LOSS_DATA, PROJECT_EXPENSES } from "../../config/projectSeed";
import KanbanBoard from "../../components/projects/KanbanBoard";
import MilestoneTimeline from "../../components/projects/MilestoneTimeline";
import TeamMembersList from "../../components/projects/TeamMembersList";
import ProfitLossCard from "../../components/projects/ProfitLossCard";
import ProjectExpensesTable from "../../components/projects/ProjectExpensesTable";
import EditProjectModal from "../../components/dashboard/EditProjectModal";

const ProjectDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const projectId = id ? parseInt(id) : 0;
    
    // State for tabs
    const [activeTab, setActiveTab] = useState<"Overview" | "Tasks" | "Milestones" | "Finance" | "Members">("Overview");

    // Fetch data from seed
    const [project, setProject] = useState(() => PROJECTS.find(p => p.id === projectId));
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const members = useMemo(() => PROJECT_MEMBERS[projectId] || [], [projectId]);
    const milestones = useMemo(() => MILESTONES[projectId] || [], [projectId]);
    const tasks = useMemo(() => TASKS[projectId] || [], [projectId]);
    const profitLoss = useMemo(() => PROFIT_LOSS_DATA[projectId], [projectId]);
    const expenses = useMemo(() => PROJECT_EXPENSES[projectId] || [], [projectId]);

    // Dynamic Progress Calculation
    const calculatedProgress = useMemo(() => {
        if (!tasks || tasks.length === 0) return 0;
        const totalTasks = tasks.length;
        const completedTasksCount = tasks.filter(t => t.status === "Completed").length;
        return Math.round((completedTasksCount / totalTasks) * 100);
    }, [tasks]);

    // Timeline Phase Logic
    const currentPhase = useMemo(() => {
        if (!milestones || milestones.length === 0) return "Planning";
        const inProgress = milestones.find(m => m.status === "In Progress");
        if (inProgress) return inProgress.title;
        const completedCount = milestones.filter(m => m.status === "Completed").length;
        if (completedCount === milestones.length) return "Handover";
        return milestones[completedCount]?.title || "Executing";
    }, [milestones]);

    const handleUpdateProject = (updatedData: any) => {
        setProject(prev => prev ? { ...prev, ...updatedData, id: updatedData.project_id } : prev);
    };

    if (!project) {
        return (
            <>
                <Navbar title="Project Not Found" breadcrumb={["InfraPilot", "Projects", "Error"]} />
                <div className="flex flex-col items-center justify-center min-h-[60vh]">
                    <h1 className="text-4xl font-bold text-slate-300 mb-4">404</h1>
                    <p className="text-slate-500 mb-6">The project you are looking for does not exist.</p>
                    <button onClick={() => navigate(-1)} className="px-6 py-2 bg-primary text-white rounded-xl font-bold">Go Back</button>
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar title={project.project_name} breadcrumb={["InfraPilot", "Projects", project.project_name]} />
            
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                             <span className="px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-lg uppercase tracking-widest shadow-sm">PRJ-{project.id}</span>
                             <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${
                                project.status === "Active" ? "bg-green-100 text-success" : 
                                project.status === "Delayed" ? "bg-red-100 text-red-600" :
                                "bg-slate-100 text-slate-500"
                             }`}>
                                {project.status}
                             </span>
                        </div>
                        <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">{project.project_name}</h1>
                        <p className="text-slate-500 text-sm max-w-xl">{project.description}</p>
                    </div>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsEditModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 shadow-sm transition-all"
                        >
                             Edit Project
                        </button>
                        <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">
                             Generate Report
                        </button>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
                    {(["Overview", "Tasks", "Milestones", "Finance", "Members"] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
                                activeTab === tab 
                                ? "text-primary border-primary" 
                                : "text-slate-400 border-transparent hover:text-slate-600"
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="animate-in fade-in duration-500">
                    {activeTab === "Overview" && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-8">
                                {/* Basic Info Card */}
                                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="font-bold text-slate-800">Site Schedule & Monitoring</h3>
                                        <div className="flex items-center gap-2 px-3 py-1 bg-violet-50 border border-violet-100 rounded-lg">
                                            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                                            <span className="text-[10px] font-black text-violet-600 uppercase tracking-widest">Active Phase: {currentPhase}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50 transition-all hover:bg-white hover:shadow-md group">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</p>
                                            <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{new Date(project.start_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50 transition-all hover:bg-white hover:shadow-md group">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</p>
                                            <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{new Date(project.end_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50 transition-all hover:bg-white hover:shadow-md group">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Site Progress</p>
                                            <p className="text-sm font-bold text-slate-700 group-hover:text-primary transition-colors">{calculatedProgress}% Calculated</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <span>Task Completion Progress</span>
                                            <span className="text-slate-700 font-black">{calculatedProgress}%</span>
                                        </div>
                                        <div className="relative w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div 
                                                className="absolute top-0 left-0 h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                                                style={{ width: `${calculatedProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                                {profitLoss && <ProfitLossCard data={profitLoss} />}
                            </div>
                            
                            <div className="space-y-8">
                                <TeamMembersList members={members} />
                            </div>
                        </div>
                    )}

                    {activeTab === "Tasks" && (
                        <div className="h-[calc(100vh-280px)]">
                            <KanbanBoard tasks={tasks} />
                        </div>
                    )}

                    {activeTab === "Milestones" && (
                        <div className="max-w-4xl mx-auto">
                            <MilestoneTimeline milestones={milestones} />
                        </div>
                    )}

                    {activeTab === "Finance" && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-300">
                             <div className="bg-primary rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                                 <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                     <div>
                                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 mb-1">Site-wise Expense Tracking</p>
                                         <h4 className="text-2xl font-black">Financial Ledger: {project.project_name}</h4>
                                     </div>
                                     <div className="flex gap-4">
                                         <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                                            <p className="text-[9px] font-bold uppercase text-white/50">Total Site Expense</p>
                                            <p className="text-lg font-black">₹{expenses.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}</p>
                                         </div>
                                     </div>
                                 </div>
                             </div>
                             <ProjectExpensesTable expenses={expenses} />
                        </div>
                    )}

                    {activeTab === "Members" && (
                         <div className="max-w-4xl mx-auto">
                            <TeamMembersList members={members} />
                         </div>
                    )}
                </div>
            </PageTransition>

            <EditProjectModal 
                isOpen={isEditModalOpen} 
                onClose={() => setIsEditModalOpen(false)} 
                project={project || null} 
                onSubmit={handleUpdateProject}
            />
        </>
    );
};

export default ProjectDetailsPage;
