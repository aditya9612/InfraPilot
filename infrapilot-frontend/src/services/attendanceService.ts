import api from "./api";

export interface AttendanceRecord {
    id: number;
    user_id: number;
    full_name?: string;
    in_time?: string;
    out_time?: string;
    check_in_time?: string;
    check_out_time?: string;
    work_hours?: number;
    working_hours?: number;
    overtime_hours?: number;
    attendance_date: string;
    project_id?: number | null;
    work_location_type?: string | null;
    is_outside_geofence?: boolean;
    is_late?: boolean;
    late_minutes?: number;
    is_early_departure?: boolean;
    early_minutes?: number;
    is_approved?: boolean;
    approved_by_id?: number | null;
    remarks?: string | null;
    work_summary?: string;
    task_deadline_reason?: string;
    work_report_pdf?: string;
    check_in_address?: string | null;
    check_out_address?: string | null;
    task_id?: string | null;
    task_description?: string | null;
}

export interface AttendanceListResponse {
    data: AttendanceRecord[];
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface TodayStatusResponse {
    checked_in: boolean;
    checked_out: boolean;
    attendance: AttendanceRecord | null;
    running_hours: number;
    date: string;
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
            const response = await api.get("users/attendance", { params });
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
            const response = await api.put(`users/attendance/${id}/approve`, {
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
            const response = await api.get(`users/${userId}/attendance`, { params });
            const data = response.data;
            return Array.isArray(data) ? data : (data.items || data.data || []);
        } catch (error: any) {
            console.error(`Get User ${userId} Attendance Error:`, error.response?.data || error.message);
            return [];
        }
    },

    /**
     * Labour Module: Check In
     * POST /api/v1/attendance/check-in
     */
    async checkIn(formData: FormData) {
        try {
            const response = await api.post("attendance/check-in", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            return response.data;
        } catch (error: any) {
            console.error("checkIn API error:", error.response?.data || error.message);
            // Provide a mock response so the UI can update state even if backend is unreachable
            const todayStr = new Date().toISOString().split('T')[0];
            const timeStr = new Date().toISOString();
            const mockId = Math.floor(Math.random() * 9000) + 1000;
            const mockResponse = {
                id: mockId,
                user_id: null,
                attendance_date: (formData.get('attendance_date') as string) || todayStr,
                in_time: (formData.get('in_time') as string) || timeStr,
                check_in_time: timeStr,
                out_time: null,
                check_out_time: null,
                working_hours: 0,
                project_id: Number(formData.get('project_id')) || null,
                check_in_address: (formData.get('check_in_address') as string) || null,
                check_out_address: null,
                task_id: (formData.get('task_id') as string) || null,
                task_description: (formData.get('task_description') as string) || null,
                remarks: (formData.get('remarks') as string) || null,
                work_location_type: (formData.get('work_location_type') as string) || null,
                is_approved: false,
                is_outside_geofence: false,
                is_late: false,
                late_minutes: 0,
            };
            try {
                const stored = localStorage.getItem('mock_self_attendance_global');
                const list = stored ? JSON.parse(stored) : [];
                list.unshift(mockResponse);
                localStorage.setItem('mock_self_attendance_global', JSON.stringify(list));
            } catch (e) { /* ignore */ }
            // Re-throw so caller can decide whether to toast an error or treat as success
            throw error;
        }
    },

    /**
     * Labour Module: Check Out
     * PUT /api/v1/attendance/check-out/{id}
     */
    async checkOut(id: number, data: any) {
        const isFormData = data instanceof FormData;
        const response = await api.put(`attendance/${id}/check-out`, data, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : {},
        });
        return response.data;
    },

    /**
     * Labour Module: Today's Status
     * GET /api/v1/attendance/today
     */
    async getTodayStatus(): Promise<TodayStatusResponse> {
        try {
            const response = await api.get<TodayStatusResponse>("attendance/today");
            return response.data;
        } catch (error: any) {
            console.warn("getTodayStatus failed, checking mock storage:", error.message);
            // Fallback: check local mock storage to see if user checked in today
            try {
                const stored = localStorage.getItem('mock_self_attendance_global');
                const list = stored ? JSON.parse(stored) : [];
                const today = new Date().toISOString().split('T')[0];
                const todayRecord = list.find((r: any) => r.attendance_date === today);
                return {
                    checked_in: !!todayRecord,
                    checked_out: !!(todayRecord?.out_time),
                    attendance: todayRecord || null,
                    running_hours: 0,
                    date: today,
                };
            } catch (e) {
                throw error;
            }
        }
    },

    /**
     * Labour Module: List Attendance
     * GET /api/v1/attendance/list
     */
    async getListAttendance(params: { user_id?: number; project_id?: number; page?: number; page_size?: number } = {}): Promise<AttendanceListResponse> {
        try {
            const response = await api.get<AttendanceListResponse>("attendance/list", { params });
            return response.data;
        } catch (error: any) {
            console.warn("getListAttendance failed, using mock storage:", error.message);
            try {
                const stored = localStorage.getItem('mock_self_attendance_global');
                const items = stored ? JSON.parse(stored) : [];
                return {
                    data: items,
                    total_count: items.length,
                    page: params.page || 1,
                    page_size: params.page_size || 10,
                    total_pages: Math.ceil(items.length / (params.page_size || 10)) || 1,
                };
            } catch (e) {
                return { data: [], total_count: 0, page: 1, page_size: 10, total_pages: 1 };
            }
        }
    },
};
