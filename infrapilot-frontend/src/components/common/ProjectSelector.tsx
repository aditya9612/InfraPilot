import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useAuth } from '../../context/AuthContext';
import { ChevronDown, Briefcase } from 'lucide-react';

interface ProjectSelectorProps {
    variant?: 'navbar' | 'page';
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({ variant = 'navbar' }) => {
    const { assignedProjects, selectedProject, setSelectedProjectId, selectedProjectId } = useProject();
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Only show for PM and Site Engineer roles
    const showSelector = user?.role === 'ProjectManager' || user?.role === 'SiteEngineer' || user?.role === 'Admin';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!showSelector) return null;

    const isNavbar = variant === 'navbar';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 group min-w-[180px] max-w-[260px] shadow-sm ${isNavbar
                    ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
            >
                <div className={`flex items-center justify-center w-6 h-6 rounded-lg shrink-0 ${isNavbar ? "bg-blue-500" : "bg-primary/10"}`}>
                    <Briefcase className={`w-3.5 h-3.5 ${isNavbar ? "text-white" : "text-primary"}`} />
                </div>
                <div className="flex-1 text-left truncate">
                    <p className={`text-[10px] font-bold uppercase tracking-widest leading-none mb-0.5 ${isNavbar ? "text-blue-200" : "text-slate-400"}`}>Project View</p>
                    <p className="text-xs font-bold truncate leading-tight">
                        {selectedProject?.project_name || 'All Projects'}
                    </p>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isNavbar ? "text-blue-200" : "text-slate-400"} ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 bg-slate-50 border-b border-slate-100 italic text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Switch Project Context
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">

                        <button
                            onClick={() => {
                                setSelectedProjectId(null as any);
                                setIsOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${!selectedProjectId ? 'bg-blue-50 text-primary font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${!selectedProjectId ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                                <Briefcase className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm">All Projects</p>
                                <p className="text-[10px] opacity-70 font-medium tracking-tighter">View global metrics</p>
                            </div>
                        </button>

                        {/* Assigned Projects */}
                        {assignedProjects.length > 0 ? assignedProjects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => {
                                    setSelectedProjectId(project.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${Number(selectedProjectId) === project.id ? 'bg-blue-50 text-primary font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${Number(selectedProjectId) === project.id ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    <Briefcase className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm truncate">{project.project_name}</p>
                                    <p className="text-[10px] opacity-70 font-medium truncate uppercase tracking-tighter">Project ID: #{project.id}</p>
                                </div>
                            </button>
                        )) : (
                            <div className="px-4 py-8 text-center text-slate-400 text-xs italic">
                                No assigned projects found.
                            </div>
                        )}
                    </div>
                    {assignedProjects.length > 0 && (
                        <div className="p-2 bg-slate-50 border-t border-slate-100">
                            <p className="text-[9px] text-center font-bold text-slate-400 uppercase tracking-tighter">
                                Showing {assignedProjects.length} Assigned Project{assignedProjects.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectSelector;
