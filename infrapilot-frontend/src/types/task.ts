export interface Task {
    id: string;
    name: string;
    project: string;
    contractorId?: string;
    assignedFrom?: 'Self' | 'Site Engineer';
    assignedTo: string;
    description: string;
    priority: 'Low' | 'Medium' | 'High';
    startDate: string;
    endDate: string;
    status: 'Pending' | 'In Progress' | 'Completed' | 'Hold';
    progress: number;
}
