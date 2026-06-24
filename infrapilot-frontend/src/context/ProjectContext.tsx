import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { projectService } from '../services/projectService';
import type { Project } from '../types/project';

interface ProjectContextType {
    selectedProjectId: number | null;
    selectedProject: Project | null;
    assignedProjects: Project[];
    isLoading: boolean;
    setSelectedProjectId: (id: number | null) => void;
    refreshProjects: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [selectedProjectId, setSelectedProjectIdState] = useState<number | null>(null);
    const [assignedProjects, setAssignedProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refreshProjects = useCallback(async (force = false) => {
        if (!isAuthenticated || !user) {
            setAssignedProjects([]);
            return;
        }

        setIsLoading(true);
        try {
            if (user.role === 'ProjectManager') {
                const projects = await projectService.getAssignedProjects(Number(user.id), force);
                setAssignedProjects(projects);

                // Auto-select first project if none selected
                if (projects.length > 0 && !selectedProjectId) {
                    const savedId = localStorage.getItem('infrapilot_selected_project_id');
                    const idToSelect = savedId ? Number(savedId) : projects[0].id;

                    // Verify savedId is still in assigned projects
                    if (projects.some(p => p.id === idToSelect)) {
                        setSelectedProjectIdState(idToSelect);
                    } else {
                        setSelectedProjectIdState(projects[0].id);
                    }
                }
            } else if (user.role === 'SiteEngineer') {
                // Site Engineer project is fixed in their user object
                const engineerProject = {
                    id: user.project_id || 92,
                    project_name: user.project_name || 'SARA CITY',
                    status: 'Ongoing'
                } as Project;
                setAssignedProjects([engineerProject]);
                setSelectedProjectIdState(engineerProject.id);
            }
        } catch (error) {
            console.error('Failed to fetch assigned projects:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, isAuthenticated, selectedProjectId]);

    useEffect(() => {
        refreshProjects();
    }, [isAuthenticated, user?.id]);

    const setSelectedProjectId = (id: number | null) => {
        setSelectedProjectIdState(id);
        if (id) {
            localStorage.setItem('infrapilot_selected_project_id', String(id));
        } else {
            localStorage.removeItem('infrapilot_selected_project_id');
        }
    };

    const selectedProject = assignedProjects.find(p => p.id === selectedProjectId) || null;

    return (
        <ProjectContext.Provider
            value={{
                selectedProjectId,
                selectedProject,
                assignedProjects,
                isLoading,
                setSelectedProjectId,
                refreshProjects
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProject must be used within a ProjectProvider');
    }
    return context;
};
