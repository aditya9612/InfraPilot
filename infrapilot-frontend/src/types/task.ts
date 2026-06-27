export interface Task {
    id: string;
    name: string;
    project: string;
    contractorId?: string;
    assignedFrom?: string;
    assignedTo: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    startDate: string;
    endDate: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Hold' | 'Planned';
    progress: number;
    audioUrl?: string;
    imageUrl?: string;
}
