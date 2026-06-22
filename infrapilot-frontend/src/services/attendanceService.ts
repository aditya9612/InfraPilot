import api from "./api";

export interface AttendanceRecord {
    id: number;
    user_id: number;
    full_name?: string;
    check_in_time?: string;
    check_out_time?: string;
    work_hours?: number;
    overtime_hours?: number;
    attendance_date: string;
    project_id?: number;
    work_location_type?: string;
    is_outside_geofence?: boolean;
    is_late?: boolean;
    late_minutes?: number;
    is_early_departure?: boolean;
    early_minutes?: number;
    is_approved?: boolean;
    approved_by_id?: number;
    remarks?: string;
    work_summary?: string;
    task_deadline_reason?: string;
    work_report_pdf?: string;
}

export const attendanceService = {
    /**
     * Get all attendance records (Admin view)
     * GET /api/v1/users/attendance
     */
    async getAllAttendance(params: {
        date?: string;
        project_id?: number;
        user_id?: number;
        is_approved?: boolean;
        limit?: number;
        offset?: number;
    } = {}): Promise<{ items: AttendanceRecord[]; total: number }> {
        try {
            const response = await api.get("/users/attendance", { params });
            const data = response.data;
            const items = Array.isArray(data) ? data : (data.items || data.data || []);
            return { items, total: data.total ?? items.length };
        } catch (error: any) {
            console.error("Get Attendance Error:", error.response?.data || error.message);
            return { items: [], total: 0 };
        }
    },

    /**
     * Approve or reject an attendance record
     * PUT /api/v1/users/attendance/{id}/approve
     */
    async approveAttendance(id: number, is_approved: boolean, remarks?: string) {
        try {
            const response = await api.put(`/users/attendance/${id}/approve`, {
                is_approved,
                remarks,
            });
            return response.data;
        } catch (error: any) {
            console.error(`Approve Attendance ${id} Error:`, error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get attendance for a specific user
     * GET /api/v1/users/{user_id}/attendance
     */
    async getUserAttendance(userId: number, params: { date?: string; limit?: number } = {}) {
        try {
            const response = await api.get(`/users/${userId}/attendance`, { params });
            const data = response.data;
            return Array.isArray(data) ? data : (data.items || data.data || []);
        } catch (error: any) {
            console.error(`Get User ${userId} Attendance Error:`, error.response?.data || error.message);
            return [];
        }
    },
};
