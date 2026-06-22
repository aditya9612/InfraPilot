import React from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, Briefcase, Globe, Layout } from 'lucide-react';

const ProjectSelector: React.FC = () => {
    const { user } = useAuth();
    const {
        selectedProjectId,
        setSelectedProjectId,
        assignedProjects,
        isLoading,
        selectedProject
    } = useProject();

    // Only show for ProjectManager and SiteEngineer
    if (!user || (user.role !== 'ProjectManager' && user.role !== 'SiteEngineer')) {
        return null;
    }

    // Site Engineer's project is fixed, they don't need a dropdown but can see the project name
    if (user.role === 'SiteEngineer') {
        return (
            <div className="flex items-center gap-2.5 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <Briefcase className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Active Site</p>
                    <p className="text-xs font-black text-slate-800 truncate uppercase">
                        {selectedProject?.project_name || 'Loading...'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative group">
            <div className="flex items-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-primary/30 transition-all cursor-pointer min-w-[200px] max-w-[300px]">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isLoading ? 'bg-slate-100 animate-pulse' : 'bg-slate-50 text-primary'}`}>
                    <Globe className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1.5">Project Context</p>
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-black text-slate-800 truncate uppercase tracking-tight">
                            {selectedProject?.project_name || (isLoading ? 'Syncing...' : 'Select Project')}
                        </p>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary transition-colors shrink-0" />
                    </div>
                </div>
            </div>

            {/* Premium Dropdown List */}
            <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden transform translate-y-2 group-hover:translate-y-0">
                <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your Assigned Sites</span>
                    <span className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-[9px] font-bold text-slate-500">
                        {assignedProjects.length} Active
                    </span>
                </div>
                <div className="max-h-[320px] overflow-y-auto p-2 scrollbar-thin">
                    {assignedProjects.length === 0 && !isLoading && (
                        <div className="p-8 text-center">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Briefcase className="w-5 h-5 text-slate-300" />
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Projects Assigned</p>
                        </div>
                    )}
                    {assignedProjects.map((project) => (
                        <div
                            key={project.id}
                            onClick={() => setSelectedProjectId(project.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer mb-1 last:mb-0 ${selectedProjectId === project.id
                                ? 'bg-primary/5 border border-primary/10 ring-1 ring-primary/5'
                                : 'hover:bg-slate-50 border border-transparent'
                                }`}
                        >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedProjectId === project.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                <span className="text-[10px] font-black">{project.id}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                    <p className={`text-xs font-black truncate uppercase tracking-tight ${selectedProjectId === project.id ? 'text-primary' : 'text-slate-700'
                                        }`}>
                                        {project.project_name}
                                    </p>
                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${project.status === 'Ongoing' ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{project.status}</p>
                                    <p className="text-[9px] font-black text-primary/70">{project.completion_percentage}%</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {assignedProjects.length > 0 && (
                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                        <button
                            className="w-full py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                            onClick={() => setSelectedProjectId(null)}
                        >
                            <Layout className="w-3.5 h-3.5" />
                            Consolidated View
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectSelector;
