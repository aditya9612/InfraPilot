import api from "./api";

export interface Notification {
    id: number;
    title: string;
    description: string;
    details: string;
    type: "Alert" | "Approval" | "System" | "Info";
    timestamp: string;
    read: boolean;
    role_target: "SiteEngineer" | "Admin" | "All";
}

let mockNotifications: Notification[] = [
    {
        id: 1,
        title: "Material Request Approved",
        description: "Your request for 500 Bags of Cement has been approved.",
        details: "The Project Manager has approved your material requisition MR-1042 for 500 Bags of Grade 53 Cement. The logistics team has been notified and the dispatch is scheduled for tomorrow morning. Please ensure the store is ready to receive the inventory and log the receipt in the system.",
        type: "Approval",
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
        read: false,
        role_target: "SiteEngineer"
    },
    {
        id: 2,
        title: "QC Audit Scheduled",
        description: "A quality control audit is scheduled for Block B.",
        details: "An external Quality Control auditor will visit Block B tomorrow at 10:00 AM for the scheduled reinforcement and concrete grade inspection. Please keep all the relevant checklists, material test reports, and drawings ready for verification.",
        type: "Info",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        read: false,
        role_target: "SiteEngineer"
    },
    {
        id: 3,
        title: "Safety Incident Logged",
        description: "A minor incident was logged at the North Wing.",
        details: "A safety violation (Missing PPE) was recorded at the North Wing today. No injuries were reported, but the worker has been warned and the contractor notified. Please review the Incident Report LOG-#4052 for more details and ensure strict compliance going forward.",
        type: "Alert",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        read: true,
        role_target: "SiteEngineer"
    },
    {
        id: 4,
        title: "DSR Rejected",
        description: "Yesterday's DSR was rejected by the Manager.",
        details: "The Daily Site Report (DSR-005) submitted yesterday has been rejected. Remark: 'Please provide more details on the concrete pouring volume and attach the batching plant slip'. Kindly update the draft in the DSR Vault and resubmit for approval.",
        type: "System",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        read: true,
        role_target: "SiteEngineer"
    }
];

export const notificationService = {
    getNotifications: async (role: string = "SiteEngineer"): Promise<Notification[]> => {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return mockNotifications.filter(n => n.role_target === role || n.role_target === "All").sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
    markAsRead: async (id: number): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 100));
        const notif = mockNotifications.find(n => n.id === id);
        if (notif) notif.read = true;
    },
    markAllAsRead: async (role: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 100));
        mockNotifications.forEach(n => {
            if (n.role_target === role || n.role_target === "All") n.read = true;
        });
    },

    /**
     * Get all general alerts
     * GET /api/v1/alerts
     */
    async listAlerts(): Promise<any[]> {
        const response = await api.get('/alerts');
        return response.data;
    },

    /**
     * Create a new alert
     * POST /api/v1/alerts
     */
    async createAlert(data: { project_id: number; alert_type: string; message: string; user_id: number }): Promise<any> {
        const response = await api.post('/alerts', data);
        return response.data;
    },

    /**
     * Mark alert as read
     * PUT /api/v1/alerts/{id}/read
     */
    async markAlertRead(id: number): Promise<any> {
        const response = await api.put(`/alerts/${id}/read`);
        return response.data;
    },

    /**
     * Delete an alert
     * DELETE /api/v1/alerts/{id}
     */
    async deleteAlert(id: number): Promise<void> {
        await api.delete(`/alerts/${id}`);
    }
};
