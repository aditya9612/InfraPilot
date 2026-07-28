export interface Task {
    id: string;
    name: string;
    project: string;
    project_id?: number;
    contractorId?: string;
    assignedFrom?: string;
    assignedTo: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    startDate: string;
    endDate: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Hold' | 'Planned' | 'Cancelled';
    progress: number;
    audioUrl?: string;
    imageUrl?: string;
}
