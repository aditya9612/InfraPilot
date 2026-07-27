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
            if (user.role === 'ProjectManager' || user.role === 'SiteEngineer' || user.role === 'Manager') {
                let localProjects: Project[] = [];
                const userStr = localStorage.getItem('infrapilot_user');
                if (userStr) {
                    try {
                        const parsedUser = JSON.parse(userStr);
                        localProjects = parsedUser?.assigned_projects || parsedUser?.user?.assigned_projects || [];
                    } catch (e) { }
                }

                try {
                    const projects = await projectService.getAssignedProjects(Number(user.id), force);
                    let finalProjects = projects.length > 0 ? projects : localProjects;

                    if (finalProjects.length === 0 && user.project_id) {
                        finalProjects = [{
                            id: user.project_id,
                            project_name: user.project_name || `Project ${user.project_id}`,
                            owner_id: 0,
                            description: "",
                            type: "RESIDENTIAL",
                            location_type: "URBAN",
                            site_address: "",
                            city: "",
                            state: "",
                            country: "",
                            pincode: "",
                            latitude: 0,
                            longitude: 0,
                            start_date: new Date().toISOString().split('T')[0],
                            end_date: new Date().toISOString().split('T')[0],
                            status: "Ongoing",
                            completion_percentage: 0
                        } as Project];
                    }

                    setAssignedProjects(finalProjects);

                    // Auto-select first project if none selected
                    if (finalProjects.length > 0 && !selectedProjectId) {
                        const savedId = localStorage.getItem('infrapilot_selected_project_id');
                        const idToSelect = savedId ? Number(savedId) : finalProjects[0].id;

                        // Trust the saved ID if it exists, otherwise use the first assigned project
                        setSelectedProjectIdState(idToSelect);

                        // If the ID isn't in finalProjects, it might have been selected in settings
                        if (savedId && !finalProjects.some(p => p.id === idToSelect)) {
                            // Optionally fetch the specific project or let the UI handle the missing name
                            const cachedName = localStorage.getItem('infrapilot_selected_project_name') || `Project ${idToSelect}`;
                            finalProjects.push({ id: idToSelect, project_name: cachedName, status: 'Active' } as unknown as Project);
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch assigned projects:', error);
                    const fallbackProjects = localProjects.length > 0 ? localProjects : (user.project_id ? [{
                        id: user.project_id,
                        project_name: user.project_name || `Project ${user.project_id}`,
                        owner_id: 0,
                        description: "",
                        type: "RESIDENTIAL",
                        location_type: "URBAN",
                        site_address: "",
                        city: "",
                        state: "",
                        country: "",
                        pincode: "",
                        latitude: 0,
                        longitude: 0,
                        start_date: new Date().toISOString().split('T')[0],
                        end_date: new Date().toISOString().split('T')[0],
                        status: "Ongoing",
                        completion_percentage: 0
                    } as Project] : []);
                    setAssignedProjects(fallbackProjects);
                    if (fallbackProjects.length > 0 && !selectedProjectId) {
                        setSelectedProjectIdState(fallbackProjects[0].id);
                    }
                }
            } else if (user.role === 'Admin') {
                let allAdminProjects: any[] = [];
                let offset = 0;
                const limit = 100;
                while (true) {
                    const res = await projectService.getProjects(limit, undefined, "", "", offset);
                    const chunk = (res as any)?.items || (Array.isArray(res) ? res : []);
                    if (chunk.length === 0) break;
                    allAdminProjects = [...allAdminProjects, ...chunk];
                    if (chunk.length < limit || allAdminProjects.length >= 2000) break;
                    offset += limit;
                }
                setAssignedProjects(allAdminProjects);
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
