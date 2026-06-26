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
    source?: "general" | "project" | "task" | "direct";
    created_at: string;
}

export const notificationService = {
    /**
     * Get aggregated notifications for a specific role
     * Combines general alerts, project alerts, and task alerts
     */
    getAllNotifications: async (): Promise<Notification[]> => {
        try {
            const [genRes, pRes, tRes, nRes] = await Promise.all([
                api.get('/alerts').catch(() => ({ data: [] })),
                api.get('/projects/alerts/projects').catch(() => ({ data: [] })),
                api.get('/projects/alerts/tasks').catch(() => ({ data: [] })),
                api.get('/notifications').catch(() => ({ data: [] }))
            ]);

            const extractData = (res: any) => {
                const data = res.data;
                if (Array.isArray(data)) return data;
                return data?.items || data?.data || data?.alerts || [];
            };

            const genAlerts = extractData(genRes);
            const pAlerts = extractData(pRes);
            const tAlerts = extractData(tRes);
            const sysNotifications = extractData(nRes);

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
                    message: a.message || a.details || a.description || "",
                    type: "Alert" as const,
                    timestamp: normalizeTimestamp(a.created_at || a.timestamp),
                    created_at: normalizeTimestamp(a.created_at || a.timestamp),
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
                    message: `Project "${a.project_name}" has reported a status change to ${a.status}. Due Date: ${a.end_date || 'N/A'}.`,
                    type: "Alert" as const,
                    timestamp: normalizeTimestamp(a.created_at || a.timestamp),
                    created_at: normalizeTimestamp(a.created_at || a.timestamp),
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
                    message: `Task "${a.title}" is ${a.status}. Deadline: ${a.end_date || 'N/A'}.`,
                    type: "Info" as const,
                    timestamp: normalizeTimestamp(a.created_at || a.timestamp),
                    created_at: normalizeTimestamp(a.created_at || a.timestamp),
                    read: isVirtuallyRead(a.id ? `task-${a.id}` : (a.uuid ? `task-${a.uuid}` : generateVirtualId('task', a, index))) || !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    is_read: isVirtuallyRead(a.id ? `task-${a.id}` : (a.uuid ? `task-${a.uuid}` : generateVirtualId('task', a, index))) || !!(a.is_read || a.read || a.isRead || a.status === 'read'),
                    role_target: "All" as const,
                    source: "task" as const,
                    status: (a.alert_type && typeof a.alert_type === 'string' && a.alert_type.includes('||')) ? a.alert_type.split('||')[0] : a.status,
                    alert_type: (a.alert_type && typeof a.alert_type === 'string' && a.alert_type.includes('||')) ? a.alert_type.split('||')[1] : a.alert_type
                })),
                ...sysNotifications.map((n: any) => ({
                    ...n,
                    id: n.id || `sys-${Math.random()}`,
                    title: n.title || "System Message",
                    description: n.message || n.description || "",
                    details: n.message || n.details || "",
                    message: n.message || n.details || "",
                    type: (n.type === 'alert' ? 'Alert' : n.type === 'success' ? 'Info' : 'System') as any,
                    timestamp: normalizeTimestamp(n.created_at),
                    created_at: normalizeTimestamp(n.created_at),
                    read: !!n.is_read,
                    is_read: !!n.is_read,
                    role_target: "All" as const,
                    source: "system" as const,
                    status: n.type === 'alert' ? 'Warning' : n.type === 'success' ? 'Normal' : 'Info',
                    // Resolve project_id from any available field
                    project_id: n.project_id || n.reference_id || n.entity_id || n.related_id || null,
                    // Carry over names if they exist in the raw response
                    project_name: n.project_name || null,
                    user_name: n.user_name || n.full_name || n.username || null,
                    user_id: n.user_id || n.created_by || n.actor_id || null
                }))
            ].filter(a => !isVirtuallyDeleted(a.id));

            return normalized.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (error) {
            console.warn("Failed to fetch/process aggregated notifications (falling back to empty list):", error);
            return [];
        }
    },

    getNotifications: async function () { return this.getAllNotifications(); },

    markAsRead: async (id: number | string, source = "general"): Promise<void> => {
        try {
            if (source === "system") {
                // Determine if ID is virtual or numeric
                const numericId = String(id).replace('sys-', '');
                if (!isNaN(Number(numericId))) {
                    await api.put(`/notifications/${numericId}/read`);
                }
            } else if (source === "general" && !String(id).includes('proj-') && !String(id).includes('task-') && !String(id).includes('.')) {
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

    /**
     * Fetch from the new /notifications endpoint
     * GET /api/v1/notifications?limit=50&offset=0
     */
    getNotificationsOverview: async (limit = 50, offset = 0): Promise<Notification[]> => {
        try {
            const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`);
            const rawItems = response.data?.items || response.data?.data || response.data || [];
            
            if (!Array.isArray(rawItems)) return [];

            return rawItems.map((item: any) => ({
                id: item.id || item.notification_id,
                title: item.title || item.alert_type || "Notification",
                description: item.message || item.description || "",
                details: item.message || item.details || item.content || "",
                type: (item.type || "Info") as any,
                timestamp: item.created_at || item.timestamp || new Date().toISOString(),
                created_at: item.created_at || item.timestamp || new Date().toISOString(),
                read: !!(item.is_read || item.read || item.status === 'read'),
                role_target: (item.role_target || "All") as any,
                source: "direct" as const
            }));
        } catch (error) {
            console.error("Failed to fetch notifications from /notifications:", error);
            return [];
        }
    }
};
