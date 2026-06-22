import api from "./api";

export interface Notification {
    id: number | string;
    title: string;
    description: string;
    details: string;
    type: "Alert" | "Approval" | "System" | "Info";
    timestamp: string;
    created_at?: string;
    read: boolean;
    is_read?: boolean;
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

            const generateVirtualId = (prefix: string, item: any, index: number) => {
                const uniqueStr = `${prefix}-${item.project_id || item.task_id || ''}-${item.status || ''}-${item.created_at || item.timestamp || ''}-${index}`;
                let hash = 0;
                for (let i = 0; i < uniqueStr.length; i++) {
                    hash = ((hash << 5) - hash) + uniqueStr.charCodeAt(i);
                    hash = hash & hash;
                }
                return `${prefix}-${Math.abs(hash)}-${index}`;
            };

            const readIdsStr = localStorage.getItem('infrapilot_alerts_read_ids');
            const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
            const isVirtuallyRead = (id: string | number) => readIds.includes(String(id));

            const deletedIdsStr = localStorage.getItem('infrapilot_alerts_deleted_ids');
            const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
            const isVirtuallyDeleted = (id: string | number) => deletedIds.includes(String(id));

            const normalized: any[] = [
                ...genAlerts.map((a: any) => ({
                    ...a,
                    id: a.id || a.uuid || a.alert_id || `gen-${Math.random()}`,
                    title: "System Alert",
                    description: a.message || a.description || "New general alert",
                    details: a.message || a.details || "",
                    type: "Alert" as const,
                    timestamp: normalizeTimestamp(a.created_at || a.timestamp),
                    read: !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    is_read: !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    role_target: "All" as const,
                    source: "general" as const,
                    status: (a.alert_type && typeof a.alert_type === 'string' && a.alert_type.includes('||')) ? a.alert_type.split('||')[0] : a.status,
                    alert_type: (a.alert_type && typeof a.alert_type === 'string' && a.alert_type.includes('||')) ? a.alert_type.split('||')[1] : a.alert_type
                })),
                ...pAlerts.map((a: any, index: number) => ({
                    ...a,
                    id: a.id ? `proj-${a.id}` : (a.uuid ? `proj-${a.uuid}` : generateVirtualId('proj', a, index)),
                    title: "Project Alert",
                    description: `${a.project_name || 'Project'}: ${a.status || 'Updated'}`,
                    details: `Project "${a.project_name}" has reported a status change to ${a.status}. Due Date: ${a.end_date || 'N/A'}.`,
                    type: "Alert" as const,
                    timestamp: normalizeTimestamp(a.created_at || a.timestamp),
                    read: isVirtuallyRead(a.id ? `proj-${a.id}` : (a.uuid ? `proj-${a.uuid}` : generateVirtualId('proj', a, index))) || !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    is_read: isVirtuallyRead(a.id ? `proj-${a.id}` : (a.uuid ? `proj-${a.uuid}` : generateVirtualId('proj', a, index))) || !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    role_target: "All" as const,
                    source: "project" as const,
                    status: (a.alert_type && typeof a.alert_type === 'string' && a.alert_type.includes('||')) ? a.alert_type.split('||')[0] : a.status,
                    alert_type: (a.alert_type && typeof a.alert_type === 'string' && a.alert_type.includes('||')) ? a.alert_type.split('||')[1] : a.alert_type
                })),
                ...tAlerts.map((a: any, index: number) => ({
                    ...a,
                    id: a.id ? `task-${a.id}` : (a.uuid ? `task-${a.uuid}` : generateVirtualId('task', a, index)),
                    title: "Task Update",
                    description: `${a.title || 'Task'}: ${a.status || 'Updated'}`,
                    details: `Task "${a.title}" is ${a.status}. Deadline: ${a.end_date || 'N/A'}.`,
                    type: "Info" as const,
                    timestamp: normalizeTimestamp(a.created_at || a.timestamp),
                    read: isVirtuallyRead(a.id ? `task-${a.id}` : (a.uuid ? `task-${a.uuid}` : generateVirtualId('task', a, index))) || !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    is_read: isVirtuallyRead(a.id ? `task-${a.id}` : (a.uuid ? `task-${a.uuid}` : generateVirtualId('task', a, index))) || !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    role_target: "All" as const,
                    source: "task" as const,
                    status: (a.alert_type && typeof a.alert_type === 'string' && a.alert_type.includes('||')) ? a.alert_type.split('||')[0] : a.status,
                    alert_type: (a.alert_type && typeof a.alert_type === 'string' && a.alert_type.includes('||')) ? a.alert_type.split('||')[1] : a.alert_type
                }))
            ].filter(a => !isVirtuallyDeleted(a.id));

            return normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            return [];
        }
    },

    getNotifications: async function () { return this.getAllNotifications(); },

    markAsRead: async (id: number | string, source = "general"): Promise<void> => {
        try {
            if (source === "general" && !String(id).includes('proj-') && !String(id).includes('task-') && !String(id).includes('.')) {
                await api.put(`/alerts/${id}/read`);
            } else {
                const readIdsStr = localStorage.getItem('infrapilot_alerts_read_ids');
                const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
                if (!readIds.includes(String(id))) {
                    readIds.push(String(id));
                    if (readIds.length > 500) readIds.shift(); // Keep bounded
                    localStorage.setItem('infrapilot_alerts_read_ids', JSON.stringify(readIds));
                }
            }
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
    async deleteAlert(id: number | string): Promise<void> {
        if (!String(id).includes('proj-') && !String(id).includes('task-') && !String(id).includes('.')) {
            await api.delete(`/alerts/${id}`);
        } else {
            // Virtual deletion for project/task alerts
            const deletedIdsStr = localStorage.getItem('infrapilot_alerts_deleted_ids');
            const deletedIds = deletedIdsStr ? JSON.parse(deletedIdsStr) : [];
            if (!deletedIds.includes(String(id))) {
                deletedIds.push(String(id));
                if (deletedIds.length > 500) deletedIds.shift(); // Keep bounded
                localStorage.setItem('infrapilot_alerts_deleted_ids', JSON.stringify(deletedIds));
            }
        }
    },

    // --- New Notifications API ---
    
    /**
     * Get real notification list
     * GET /api/v1/notifications
     */
    listNotifications: async (limit = 50, offset = 0) => {
        try {
            const response = await api.get('/notifications', { params: { limit, offset } });
            return response.data;
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
            throw error;
        }
    },

    /**
     * Get unread notification count
     * GET /api/v1/notifications/unread-count
     */
    getUnreadCount: async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            return response.data;
        } catch (error) {
            console.error("Failed to fetch unread count:", error);
            return { count: 0 };
        }
    },

    /**
     * Mark all notifications as read
     * POST /api/v1/notifications/read-all
     */
    markAllNotificationsAsRead: async () => {
        try {
            const response = await api.post('/notifications/read-all');
            return response.data;
        } catch (error) {
            console.error("Failed to mark all as read:", error);
            throw error;
        }
    },

    /**
     * Mark specific notification as read
     * PUT /api/v1/notifications/{id}/read
     */
    markNotificationAsRead: async (id: number | string) => {
        try {
            const response = await api.put(`/notifications/${id}/read`);
            return response.data;
        } catch (error) {
            console.error(`Failed to mark notification ${id} as read:`, error);
            throw error;
        }
    },

    /**
     * Delete notification
     * DELETE /api/v1/notifications/{id}
     */
    deleteNotification: async (id: number | string) => {
        try {
            const response = await api.delete(`/notifications/${id}`);
            return response.data;
        } catch (error) {
            console.error(`Failed to delete notification ${id}:`, error);
            throw error;
        }
    }
};
