import { useParams, useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import { PROJECTS, PROJECT_MEMBERS, MILESTONES, TASKS, PROFIT_LOSS_DATA } from "../../config/projectSeed";
import KanbanBoard from "../../components/projects/KanbanBoard";
import MilestoneTimeline from "../../components/projects/MilestoneTimeline";
import TeamMembersList from "../../components/projects/TeamMembersList";
import ProfitLossCard from "../../components/projects/ProfitLossCard";
import EditProjectModal from "../../components/dashboard/EditProjectModal";

const ProjectDetailsPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const projectId = id ? parseInt(id) : 0;
    
    // State for tabs
    const [activeTab, setActiveTab] = useState<"Overview" | "Tasks" | "Milestones" | "Members">("Overview");

    // Fetch data from seed
    const [project, setProject] = useState(() => PROJECTS.find(p => p.id === projectId));
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const members = useMemo(() => PROJECT_MEMBERS[projectId] || [], [projectId]);
    const milestones = useMemo(() => MILESTONES[projectId] || [], [projectId]);
    const tasks = useMemo(() => TASKS[projectId] || [], [projectId]);
    const profitLoss = useMemo(() => PROFIT_LOSS_DATA[projectId], [projectId]);

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
                    {(["Overview", "Tasks", "Milestones", "Members"] as const).map((tab) => (
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
                                    <h3 className="font-bold text-slate-800 mb-6">Schedule & Progress</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Start Date</p>
                                            <p className="text-sm font-bold text-slate-700">{new Date(project.start_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">End Date</p>
                                            <p className="text-sm font-bold text-slate-700">{new Date(project.end_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-50">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Completion</p>
                                            <p className="text-sm font-bold text-slate-700">{project.completion_percentage}%</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                            <span>Overall Completion</span>
                                            <span className="text-slate-700">{project.completion_percentage}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                            <div 
                                                className="h-full bg-primary transition-all duration-1000"
                                                style={{ width: `${project.completion_percentage}%` }}
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
