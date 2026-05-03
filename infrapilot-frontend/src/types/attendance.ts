export type AttendanceStatus = 'present' | 'absent';

export interface Attendance {
    id: number;
    labour_id: number;
    worker_name: string;
    labour_id_code: string;
    contractor_name: string;
    work_type: string;
    status: AttendanceStatus;
    check_in_time: string | null;
    check_out_time: string | null;
    working_hours: number;
    overtime_hours: number;
    wage_rate: number;
    location_address: string | null;
    check_in_image: string | null;
    check_out_image: string | null;
    date: string;
}

export interface CheckInPayload {
    project_id: number;
    task_description: string;
    location_address: string;
    check_in_image: File | string;
}

export interface CheckOutPayload {
    location_address: string;
    check_out_image: File | string;
    overtime_hours: number;
}
