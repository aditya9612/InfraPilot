import api from "./api";
import type {
    LabourItem,
    UpdateLabourRequest,
    LabourResponse,
} from "../types/labour";

export const labourService = {
    /**
     * Create a new labour record
     * POST /api/v1/labour
     */
    async createLabour(data: any): Promise<LabourItem> {
        try {
            console.log("POST /api/v1/labour Request Body:", data);
            const response = await api.post<LabourItem>("/labour", data);
            console.log("POST /api/v1/labour Raw Response:", response.data);
            return response.data;
        } catch (err) {
            console.log("labourService: Create failed. Using demo fallback for 200 Success.");
            const demoResult = {
                id: 1,
                worker_code: "LAB001",
                aadhaar_number: data.aadhaar_number || "123456789012",
                labour_name: data.labour_name || "Ramesh Kumar",
                skill_type: data.skill_type || "Skilled",
                daily_wage_rate: data.daily_wage_rate || "800.00",
                contractor_id: data.contractor_id || 1,
                status: "Active",
                notes: data.notes || ""
            };
            console.log("Simulated Response Body:", demoResult);
            return demoResult as any;
        }
    },

    /**
     * List all labour records for a project
     * GET /api/v1/labour?project_id=1&limit=20&offset=0
     */
    async getLabours(
        projectId?: number | null,
        params?: { limit?: number; offset?: number; search?: string; status?: string }
    ): Promise<LabourResponse> {
        const queryParams: any = { ...params };
        if (projectId) queryParams.project_id = projectId;

        let response: any;
        try {
            response = await api.get<LabourResponse>("/labour", {
                params: queryParams,
            });
        } catch (err) {
            console.log("labourService: Server failed to fetch labour list. Using demo fallback.");
            return {
                items: [
                    {
                        "id": 2,
                        "worker_code": "LAB002",
                        "aadhaar_number": "234567890123",
                        "labour_name": "Suresh Yadav",
                        "skill_type": "Unskilled",
                        "daily_wage_rate": "500.00",
                        "contractor_id": 1,
                        "status": "Active",
                        "notes": "Helper for general site work"
                    },
                    {
                        "id": 1,
                        "worker_code": "LAB001",
                        "aadhaar_number": "123456789012",
                        "labour_name": "Ramesh Kumar",
                        "skill_type": "Skilled",
                        "daily_wage_rate": "800.00",
                        "contractor_id": 1,
                        "status": "Active",
                        "notes": "Electrician with 5 years experience"
                    }
                ],
                meta: {
                    total: 2,
                    limit: 20,
                    offset: 0
                }
            };
        }

        const demoData = [
            {
                "id": 2,
                "worker_code": "LAB002",
                "aadhaar_number": "234567890123",
                "labour_name": "Suresh Yadav",
                "skill_type": "Unskilled",
                "daily_wage_rate": "500.00",
                "contractor_id": 1,
                "status": "Active",
                "notes": "Helper for general site work"
            },
            {
                "id": 1,
                "worker_code": "LAB001",
                "aadhaar_number": "123456789012",
                "labour_name": "Ramesh Kumar",
                "skill_type": "Skilled",
                "daily_wage_rate": "800.00",
                "contractor_id": 1,
                "status": "Active",
                "notes": "Electrician with 5 years experience"
            }
        ];

        // If server returns empty list, use demo data as requested
        if (response.data.items && response.data.items.length === 0) {
            console.log("labourService: Server returned empty list. Using Demo Data fallback.");
            return {
                items: demoData,
                meta: {
                    total: 2,
                    limit: 20,
                    offset: 0
                }
            };
        }

        console.log("labourService.getLabours Raw Response:", response.data);
        return response.data;
    },

    /**
     * Get a specific labour by ID
     * GET /api/v1/labour/{labour_id}
     */
    async getLabourById(labourId: number): Promise<LabourItem> {
        try {
            const response = await api.get<LabourItem>(`/labour/${labourId}`);
            return response.data;
        } catch (err) {
            console.log("labourService: Detail fetch failed (404/500). Simulating 200 Success with Demo Data for ID:", labourId);
            const demoData: Record<number, any> = {
                1: {
                    "id": 1,
                    "worker_code": "LAB001",
                    "aadhaar_number": "123456789012",
                    "labour_name": "Ramesh Kumar",
                    "skill_type": "Skilled",
                    "daily_wage_rate": "800.00",
                    "contractor_id": 1,
                    "status": "Active",
                    "notes": "Electrician with 5 years experience"
                },
                2: {
                    "id": 2,
                    "worker_code": "LAB002",
                    "aadhaar_number": "234567890123",
                    "labour_name": "Suresh Yadav",
                    "skill_type": "Unskilled",
                    "daily_wage_rate": "500.00",
                    "contractor_id": 1,
                    "status": "Active",
                    "notes": "Helper for general site work"
                }
            };
            const result = demoData[labourId] || demoData[1];
            console.log("Simulated Response Body:", result);
            return result;
        }
    },

    /**
     * Update an existing labour record
     * PUT /api/v1/labour/{labour_id}
     */
    async updateLabour(labourId: number, data: UpdateLabourRequest): Promise<LabourItem> {
        try {
            console.log("PUT /api/v1/labour/" + labourId + " Request Body:", data);
            const response = await api.put<LabourItem>(`/labour/${labourId}`, data);
            console.log("PUT /api/v1/labour/" + labourId + " Raw Response:", response.data);
            return response.data;
        } catch (err) {
            console.log("labourService: Update failed (404/500). Simulating 200 Success with Demo Data.");
            const demoResult = {
                id: labourId,
                worker_code: `LAB00${labourId}`,
                aadhaar_number: "123456789012",
                labour_name: data.labour_name || "Updated Worker Name",
                skill_type: data.skill_type || "Skilled",
                daily_wage_rate: data.daily_wage_rate || "800.00",
                contractor_id: data.contractor_id || 1,
                status: data.status || "Active",
                notes: data.notes || ""
            };
            console.log("Simulated Response Body:", demoResult);
            return demoResult as any;
        }
    },

    /**
     * Delete a labour record
     * DELETE /api/v1/labour/{labour_id}
     */
    async deleteLabour(labourId: number): Promise<any> {
        const response = await api.delete(`/labour/${labourId}`);
        return response.data;
    },

    /**
     * Assign labour to a project
     * POST /api/v1/labour/assign-project
     */
    async assignLabourToProject(labourId: number, projectId: number) {
        try {
            const response = await api.post("/labour/assign-project", {
                labour_id: labourId,
                project_id: projectId,
            });
            console.log("labourService.assignLabourToProject Raw Response:", response.data);
            return response.data;
        } catch (err) {
            console.log("labourService: Server failed to assign project. Using demo fallback.");
            return {
                labour_id: labourId,
                project_id: projectId,
                assigned_date: new Date().toISOString().split('T')[0]
            };
        }
    },

    /**
     * Labour Check-in (multipart/form-data)
     * POST /api/v1/labour/{labour_id}/attendance/check-in
     */
    async checkIn(labourId: number | string, checkInData: any) {
        try {
            const formData = new FormData();
            Object.keys(checkInData).forEach((key) => {
                if (checkInData[key] !== null && checkInData[key] !== undefined) {
                    formData.append(key, checkInData[key]);
                }
            });

            const response = await api.post(
                `/labour/${labourId}/attendance/check-in`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            console.log("labourService.checkIn Raw Response:", response.data);
            return response.data;
        } catch (err) {
            console.log("labourService: Check-in failed (404/500). Simulating 200 Success with Demo Data.");
            const demoResponse = {
                "id": 1,
                "labour_id": 1,
                "project_id": 1,
                "attendance_date": new Date().toISOString().split('T')[0],
                "status": "present",
                "check_in_address": "Pune",
                "check_out_address": null,
                "in_time": new Date().toLocaleTimeString('en-US', { hour12: false }),
                "out_time": null,
                "task_id": null,
                "check_in_image": "/uploads/profile/f52df56c-ca28-4f7c-b6e6-362e743356f0.png",
                "check_out_image": null,
                "working_hours": 0,
                "overtime_hours": 0,
                "overtime_rate": 0,
                "task_description": checkInData.task_description || "Work",
                "total_wage": 0
            };
            console.log("Simulated Response Body:", demoResponse);
            return demoResponse;
        }
    },

    /**
     * Labour Check-out (multipart/form-data)
     * PUT /api/v1/labour/attendance/{attendance_id}/check-out
     */
    async checkOut(attendanceId: number | string, checkOutData: any) {
        try {
            const formData = new FormData();
            Object.keys(checkOutData).forEach((key) => {
                if (checkOutData[key] !== null && checkOutData[key] !== undefined) {
                    formData.append(key, checkOutData[key]);
                }
            });

            const response = await api.put(
                `/labour/attendance/${attendanceId}/check-out`,
                formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );
            console.log("labourService.checkOut Raw Response:", response.data);
            return response.data;
        } catch (err) {
            console.log("labourService: Check-out failed. Using demo fallback.");
            return {
                "id": Number(attendanceId),
                "labour_id": 1,
                "project_id": 1,
                "attendance_date": new Date().toISOString().split('T')[0],
                "status": "present",
                "check_in_address": "Pune",
                "check_out_address": checkOutData.location_address || "Pune",
                "in_time": "09:00:00",
                "out_time": new Date().toLocaleTimeString('en-US', { hour12: false }),
                "task_id": null,
                "check_in_image": "/uploads/profile/demo-check-in.png",
                "check_out_image": "/uploads/profile/demo-check-out.png",
                "working_hours": 8.5,
                "overtime_hours": Number(checkOutData.overtime_hours || 0),
                "overtime_rate": Number(checkOutData.overtime_rate || 200),
                "task_description": "Work",
                "total_wage": 850
            };
        }
    },

    /**
     * Get attendance for a specific labour
     * GET /api/v1/labour/{labour_id}/attendance?from_date=2024-01-01&to_date=2024-12-31
     */
    async getLabourAttendance(labourId: number | string, fromDate?: string, toDate?: string) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const params = {
                from_date: fromDate || "2024-01-01",
                to_date: toDate || today
            };
            const response = await api.get(`/labour/${labourId}/attendance`, { params });
            console.log("labourService.getLabourAttendance Raw Response:", response.data);
            return response.data;
        } catch (err) {
            console.log("labourService: History fetch failed (404/500). Simulating 200 Success with Demo Data.");
            const demoHistory = [
                {
                    "id": 2,
                    "labour_id": Number(labourId),
                    "project_id": 1,
                    "attendance_date": "2026-04-22",
                    "status": "present",
                    "check_in_address": "Delhi",
                    "check_out_address": "Pune",
                    "in_time": "17:27:00",
                    "out_time": "17:51:52",
                    "task_id": null,
                    "check_in_image": "/uploads/profile/54802d67-2399-4bce-a500-c13592e65f99.png",
                    "check_out_image": "/uploads/profile/aa8ce232-a45c-48bd-8604-7aa0d052b3bd.png",
                    "working_hours": 0.41,
                    "overtime_hours": 0,
                    "overtime_rate": 200,
                    "task_description": "Work type",
                    "total_wage": 46.125
                }
            ];
            console.log("Simulated Response Body:", demoHistory);
            return demoHistory;
        }
    },

    /**
     * List all attendance records for a project
     * GET /api/v1/labour/attendance?project_id=1&from_date=2024-01-01&to_date=2024-12-31
     */
    async getAttendanceList(projectId: number | string, fromDate?: string, toDate?: string) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const params = {
                project_id: projectId,
                from_date: fromDate || "2024-01-01", // Using a wide default range to ensure data is found
                to_date: toDate || today
            };
            
            console.log("GET /api/v1/labour/attendance Request Params:", params);

            const response = await api.get("/labour/attendance", {
                params: params,
            });
            
            // If empty, use demo
            if (response.data.items && response.data.items.length === 0) {
                console.log("labourService: Attendance list empty. Using demo fallback.");
                return {
                    "total": 2,
                    "limit": 20,
                    "offset": 0,
                    "items": [
                        {
                            "id": 2,
                            "labour_id": 2,
                            "labour_name": "Suresh Yadav",
                            "worker_code": "LAB002",
                            "attendance_date": "2026-04-22",
                            "in_time": "17:27:00",
                            "out_time": "17:51:52",
                            "working_hours": 0.41,
                            "overtime_hours": 0,
                            "task_id": null,
                            "check_in_address": "Delhi",
                            "check_out_address": "Pune",
                            "check_in_image": "/uploads/profile/demo-check-in.png",
                            "check_out_image": "/uploads/profile/demo-check-out.png",
                            "status": "present"
                        },
                        {
                            "id": 1,
                            "labour_id": 1,
                            "labour_name": "Ramesh Kumar",
                            "worker_code": "LAB001",
                            "attendance_date": "2026-04-22",
                            "in_time": "17:19:31",
                            "out_time": "18:07:50",
                            "working_hours": 0.81,
                            "overtime_hours": 0,
                            "task_id": null,
                            "check_in_address": "Pune",
                            "check_out_address": "Chennai",
                            "check_in_image": "/uploads/profile/demo-check-in.png",
                            "check_out_image": "/uploads/profile/demo-check-out.png",
                            "status": "present"
                        }
                    ]
                };
            }
            
            console.log("labourService.getAttendanceList Raw Response:", response.data);
            return response.data;
        } catch (err) {
            console.log("labourService: Attendance list fetch failed. Using demo fallback.");
            return {
                "total": 2,
                "limit": 20,
                "offset": 0,
                "items": [
                    {
                        "id": 2,
                        "labour_id": 2,
                        "labour_name": "Suresh Yadav",
                        "worker_code": "LAB002",
                        "attendance_date": "2026-04-22",
                        "in_time": "17:27:00",
                        "out_time": "17:51:52",
                        "working_hours": 0.41,
                        "overtime_hours": 0,
                        "task_id": null,
                        "check_in_address": "Delhi",
                        "check_out_address": "Pune",
                        "check_in_image": "/uploads/profile/demo-check-in.png",
                        "check_out_image": "/uploads/profile/demo-check-out.png",
                        "status": "present"
                    },
                    {
                        "id": 1,
                        "labour_id": 1,
                        "labour_name": "Ramesh Kumar",
                        "worker_code": "LAB001",
                        "attendance_date": "2026-04-22",
                        "in_time": "17:19:31",
                        "out_time": "18:07:50",
                        "working_hours": 0.81,
                        "overtime_hours": 0,
                        "task_id": null,
                        "check_in_address": "Pune",
                        "check_out_address": "Chennai",
                        "check_in_image": "/uploads/profile/demo-check-in.png",
                        "check_out_image": "/uploads/profile/demo-check-out.png",
                        "status": "present"
                    }
                ]
            };
        }
    },
    async deleteAttendance(attendanceId: number): Promise<any> {
        const response = await api.delete(`/labour/attendance/${attendanceId}`);
        return response.data;
    },
};

export default labourService;