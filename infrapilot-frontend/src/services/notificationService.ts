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
    source?: "general" | "project" | "task";
}

export const notificationService = {
    /**
     * Get aggregated notifications for a specific role
     * Combines general alerts, project alerts, and task alerts
     */
    getAllNotifications: async (): Promise<Notification[]> => {
        try {
            const [genRes, pRes, tRes] = await Promise.all([
                api.get('/alerts').catch(() => ({ data: [] })),
                api.get('/projects/alerts/projects').catch(() => ({ data: [] })),
                api.get('/projects/alerts/tasks').catch(() => ({ data: [] }))
            ]);

            const extractData = (res: any) => {
                const data = res.data;
                if (Array.isArray(data)) return data;
                return data?.items || data?.data || data?.alerts || [];
            };

            const genAlerts = extractData(genRes);
            const pAlerts = extractData(pRes);
            const tAlerts = extractData(tRes);

            const normalizeTimestamp = (ts: string) => {
                if (!ts) return new Date().toISOString();
                if (!ts.endsWith('Z') && !ts.includes('+') && !ts.includes('-')) {
                    return ts.replace(' ', 'T') + 'Z';
                }
                return ts;
            };

            const normalized: any[] = [
                ...genAlerts.map((a: any) => ({
                    id: a.id || a.uuid || a.alert_id || Math.random(),
                    title: "System Alert",
                    description: a.message || a.description || "New general alert",
                    details: a.message || a.details || "",
                    type: "Alert" as const,
                    timestamp: normalizeTimestamp(a.created_at || a.timestamp),
                    read: !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    is_read: !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    role_target: "All" as const,
                    source: "general" as const
                })),
                ...pAlerts.map((a: any) => ({
                    id: a.id || a.uuid || Math.random(),
                    title: "Project Alert",
                    description: `${a.project_name || 'Project'}: ${a.status || 'Updated'}`,
                    details: `Project "${a.project_name}" has reported a status change to ${a.status}. Due Date: ${a.end_date || 'N/A'}.`,
                    type: "Alert" as const,
                    timestamp: normalizeTimestamp(a.created_at || a.timestamp),
                    read: !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    is_read: !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    role_target: "All" as const,
                    source: "project" as const
                })),
                ...tAlerts.map((a: any) => ({
                    id: a.id || a.uuid || Math.random(),
                    title: "Task Update",
                    description: `${a.title || 'Task'}: ${a.status || 'Updated'}`,
                    details: `Task "${a.title}" is ${a.status}. Deadline: ${a.end_date || 'N/A'}.`,
                    type: "Info" as const,
                    timestamp: normalizeTimestamp(a.created_at || a.timestamp),
                    read: !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    is_read: !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    role_target: "All" as const,
                    source: "task" as const
                }))
            ];

            return normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            return [];
        }
    },

    getNotifications: async function () { return this.getAllNotifications(); },

    markAsRead: async (id: number | string, source = "general"): Promise<void> => {
        try {
            await api.put(`/alerts/${id}/read`);
        } catch (error) {
            console.error(`Failed to mark notification ${id} as read:`, error);
        }
    },

    markAllAsRead: async (_role: string, notifications: Notification[]): Promise<void> => {
        try {
            const unread = notifications.filter(n => !n.read);
            await Promise.all(unread.map(n =>
                notificationService.markAsRead(n.id, n.source)
            ));
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
        }
    },

    /**
     * Get all aggregated alerts (alias for getAllNotifications)
     */
    async listAlerts(limit = 100, offset = 0): Promise<any[]> {
        const all = await this.getAllNotifications();
        return all.slice(offset, offset + limit);
    },

    /**
     * Create a new alert
     * POST /api/v1/alerts
     */
    async createAlert(data: { project_id: number; alert_type: string; message: string; user_id: number }): Promise<any> {
        const response = await api.post('/alerts', data);
        return response.data;
    },

    async markAlertRead(id: number | string, source = "general"): Promise<any> {
        return this.markAsRead(id, source);
    },

    /**
     * Delete an alert
     * DELETE /api/v1/alerts/{id}
     */
    async deleteAlert(id: number): Promise<void> {
        await api.delete(`/alerts/${id}`);
    }
};
