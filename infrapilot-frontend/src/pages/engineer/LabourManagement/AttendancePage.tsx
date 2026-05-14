import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import StatCard from '../../../components/common/StatCard';
import {
    Clock,
    Calendar,
    Search,
    Camera,
    MapPin,
    Activity,
    LogOut,
    Eye,
    Trash2,
    Mail,
    RotateCcw
} from "lucide-react";
import { labourService } from '../../../services/labourService';
import type { AttendanceRecord, LabourItem } from '../../../types/labour';
import CheckInModal from '../../../components/attendance/CheckInModal';
import CheckOutModal from '../../../components/attendance/CheckOutModal';
import Modal from '../../../components/common/Modal';
import ConfirmModal from '../../../components/common/ConfirmModal';
import toast from 'react-hot-toast';

const AttendancePage: React.FC = () => {
    const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
    const [labours, setLabours] = useState<LabourItem[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Present" | "Absent" | "OT" | "Efficiency">("All");

    // Modal States
    const [checkInTarget, setCheckInTarget] = useState<any | null>(null);
    const [checkOutTarget, setCheckOutTarget] = useState<any | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
    const [attendanceToDelete, setAttendanceToDelete] = useState<AttendanceRecord | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loadingAttendanceId, setLoadingAttendanceId] = useState<number | null>(null);

    const [projectId, setProjectId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(false);



    const fetchData = async () => {
        setIsLoading(true);
        try {
            console.log("Syncing Attendance Registry for Project:", projectId);

            // Fetch labours — graceful if project doesn't exist
            let registeredLabours: any[] = [];
            try {
                const labourRes = await labourService.getLabours(projectId);
                registeredLabours = labourRes.items || [];
            } catch (err) {
                console.warn("Labour list fetch failed for project:", projectId);
            }

            // Fetch attendance — only if project_id is provided, graceful on error
            let rawAttendances: any[] = [];
            if (projectId) {
                try {
                    const attendanceRes = await labourService.getAttendanceList(projectId);
                    rawAttendances = attendanceRes.items || [];
                } catch (err) {
                    console.warn("Attendance list fetch failed for project:", projectId);
                }
            }

            const attendanceMap = new Map(rawAttendances.map(a => [Number(a.labour_id), a]));

            // Merge workers with attendance data
            const enrichedAttendances = registeredLabours.map((labour: any) => {
                const attendance = attendanceMap.get(Number(labour.id));

                if (attendance) {
                    return {
                        ...attendance,
                        labour_name: attendance.labour_name && attendance.labour_name !== "Unknown" ? attendance.labour_name : (labour?.labour_name || "Unknown Worker"),
                        worker_code: labour?.worker_code || "N/A",
                        skill_type: labour?.skill_type || "General"
                    };
                } else {
                    return {
                        id: 0,
                        labour_id: labour.id,
                        labour_name: labour.labour_name,
                        worker_code: labour.worker_code,
                        skill_type: labour.skill_type,
                        status: "absent",
                        in_time: "--:--",
                        out_time: null,
                        check_in_image: null,
                        check_out_image: null
                    };
                }
            });

            console.log("Registry Enriched. Total Workers:", enrichedAttendances.length);
            setAttendances(enrichedAttendances);
            setLabours(registeredLabours);
        } catch (error: any) {
            console.error("Attendance Sync Failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAttendanceDetails = async (attendance: AttendanceRecord) => {
        setLoadingAttendanceId(attendance.id);
        try {
            console.log("Refetching detailed audit for worker:", attendance.labour_name);
            const details = await labourService.getLabourAttendance(attendance.labour_id);

            // Ensure we find the exact matching record or use the latest one
            const record = Array.isArray(details)
                ? (details.find((d: any) => (d.id || d.attendance_id) === (attendance.id || attendance.attendance_id)) || details[0])
                : details;

            if (record) {
                console.log("Refetch SUCCESS. Audit detail resolved:", record);
                setSelectedAttendance({ ...attendance, ...record });
            } else {
                setSelectedAttendance(attendance);
            }
            setIsDetailModalOpen(true);
        } catch (error) {
            console.warn('Audit refetch failed. Falling back to registry data.');
            setSelectedAttendance(attendance);
            setIsDetailModalOpen(true);
        } finally {
            setLoadingAttendanceId(null);
        }
    };



    // Fetch on mount and whenever projectId changes
    useEffect(() => {
        fetchData();
    }, [projectId]);

    const today = new Date().toISOString().split('T')[0];

    // Workers who checked in TODAY
    const todayAttendances = useMemo(() => {
        return attendances.filter(a => a.attendance_date === today && a.status !== 'absent');
    }, [attendances, today]);

    // Workers who checked in today but have NOT checked out yet → available for check-out
    const activeWorkers = useMemo(() => {
        return todayAttendances.filter(a => a.in_time && a.in_time !== '--:--' && !a.out_time);
    }, [todayAttendances]);

    // Workers who have NOT checked in today → available for check-in
    const availableForCheckIn = useMemo(() => {
        const checkedInTodayIds = new Set(todayAttendances.map(a => Number(a.labour_id)));
        return labours.filter(l => !checkedInTodayIds.has(Number(l.id)));
    }, [labours, todayAttendances]);

    const stats = useMemo(() => {
        const total = labours.length;
        // Workers currently on-site (In-time set, Out-time empty)
        const present = attendances.filter(a => !a.out_time).length;
        // Total workers in roster minus anyone who checked in today
        const checkedInIds = new Set(attendances.map(a => a.labour_id));
        const absent = labours.filter(l => !checkedInIds.has(l.id)).length;

        const otWorkers = attendances.filter(a => a.overtime_hours > 0).length;

        // Sum total working + overtime hours for the day
        const manHours = attendances.reduce((acc, a) => acc + (a.working_hours || 0) + (a.overtime_hours || 0), 0);

        return { total, present, absent, otWorkers, manHours: Math.round(manHours) };
    }, [attendances, labours]);

    const filteredAttendances = useMemo(() => {
        // Start with the full roster of workers
        const roster = labours.map(l => {
            const attendance = attendances.find(a => a.labour_id === l.id);
            if (attendance) return attendance;

            // Return a virtual 'Absent' record for workers not checked in
            return {
                id: l.id,
                labour_id: l.id,
                labour_name: l.labour_name,
                worker_code: l.worker_code,
                attendance_date: new Date().toISOString().split('T')[0],
                in_time: '—',
                out_time: null,
                working_hours: 0,
                overtime_hours: 0,
                status: "Absent",
                check_in_address: '',
                check_out_address: null,
                check_in_image: null,
                check_out_image: null
            } as AttendanceRecord;
        });

        let data = roster;

        // Apply StatCard Filter
        if (activeStatFilter === "Present") {
            data = data.filter(a => a.status !== "Absent" && !a.out_time);
        } else if (activeStatFilter === "Absent") {
            data = data.filter(a => a.status === "Absent");
        } else if (activeStatFilter === "OT") {
            data = data.filter(a => a.overtime_hours > 0);
        }

        console.log("Filtering Registry: Total Roster:", data.length, "Search:", searchTerm, "Status Filter:", statusFilter);

        return data.filter(a => {
            const matchesSearch = !searchTerm ||
                a.labour_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                a.worker_code?.toLowerCase().includes(searchTerm.toLowerCase());

            // Aggressive status matching
            let currentStatus = a.status?.toLowerCase();
            if (a.out_time && a.out_time !== '—' && currentStatus !== 'absent') {
                currentStatus = 'completed';
            }

            const matchesStatus = statusFilter === 'All' ||
                (currentStatus === statusFilter.toLowerCase());

            return matchesSearch && matchesStatus;
        });
    }, [attendances, labours, searchTerm, statusFilter, activeStatFilter]);

    return (
        <>
            <Navbar title="Daily Attendance" breadcrumb={["Engineer", "Human Resources", "Attendance Registry"]} />

            <PageTransition className="p-6 bg-slate-50 font-inter flex flex-col min-h-screen">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Workforce Attendance Registry</h1>
                        <p className="text-slate-500 text-sm">Securely track worker check-in/out with GPS and photo validation.</p>
                    </div>
                    <div className="flex gap-3">

                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 shadow-sm">
                            <Calendar className="w-4 h-4 text-primary" />
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* ── Summary Stats with Interactive Filtering ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div onClick={() => setActiveStatFilter("Present")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Present" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Present Now"
                            value={stats.present.toString()}
                            sub="Verified On-Site"
                            accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Absent")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Absent" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Absent"
                            value={stats.absent.toString()}
                            sub="No Report Today"
                            accent="text-rose-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("OT")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "OT" ? "ring-2 ring-amber-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="OT Active"
                            value={stats.otWorkers.toString()}
                            sub="Workers in Overtime"
                            accent="text-amber-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Efficiency")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Efficiency" ? "ring-2 ring-blue-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Man-Hours"
                            value={`${stats.manHours}h`}
                            sub="Daily Productivity"
                            accent="text-blue-500" />
                    </div>
                </div>

                {/* ── Registry Table Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 font-inter">
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status:</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none cursor-pointer uppercase tracking-widest"
                            >
                                <option value="All">All Status</option>
                                <option value="present">Present</option>
                                <option value="completed">Completed</option>
                                <option value="absent">Absent</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Project ID:</span>
                            <input
                                type="number"
                                placeholder="ID"
                                value={projectId || ''}
                                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : null)}
                                className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                            />
                            {activeStatFilter !== "All" && (
                                <button onClick={() => setActiveStatFilter("All")} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Syncing attendance vault...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                        <th className="px-6 py-4">Worker Identity</th>
                                        <th className="px-6 py-4">Contractor</th>
                                        <th className="px-6 py-4 text-center">In Time</th>
                                        <th className="px-6 py-4 text-center">Out Time</th>
                                        <th className="px-6 py-4 text-center">Shift Hrs</th>
                                        <th className="px-6 py-4 text-center">OT</th>
                                        <th className="px-6 py-4 text-center">Security Check</th>
                                        <th className="px-6 py-4 text-right">Registry Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredAttendances.map((a) => (
                                        <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold relative">
                                                        {a.labour_name?.charAt(0)}
                                                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${a.status?.toLowerCase() === 'absent' ? 'bg-rose-500' : 'bg-emerald-500'} border-2 border-white rounded-full`} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-bold text-slate-800">{a.labour_name}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                                    {'Individual'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums">{a.in_time || '—'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-sm font-bold tabular-nums ${a.out_time ? 'text-slate-700' : 'text-slate-300'}`}>
                                                    {a.out_time || '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-700 tabular-nums">{a.working_hours || 0}h</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-xs font-bold tabular-nums ${a.overtime_hours > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                                                    {a.overtime_hours || 0}h
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {a.status === 'Absent' ? (
                                                    <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Absent</span>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-3">
                                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${a.check_in_image ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-50'}`}>
                                                            <Camera className="w-3 h-3" />
                                                            <span className="text-[9px] font-bold uppercase tracking-widest">{a.check_in_image ? 'Selfie ✓' : 'Pending'}</span>
                                                        </div>
                                                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${a.check_in_address ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-50'}`}>
                                                            <MapPin className="w-3 h-3" />
                                                            <span className="text-[9px] font-bold uppercase tracking-widest">{a.check_in_address ? 'GPS ✓' : 'Pending'}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    {a.status !== 'Absent' ? (
                                                        <>
                                                            <button
                                                                onClick={() => fetchAttendanceDetails(a)}
                                                                disabled={loadingAttendanceId === a.id}
                                                                className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                                                            >
                                                                {loadingAttendanceId === a.id ? (
                                                                    <Clock className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Eye className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setAttendanceToDelete(a);
                                                                    setIsDeleteModalOpen(true);
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">N/A</span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        {!isLoading && filteredAttendances.length === 0 && (
                            <div className="flex-1 flex flex-col items-center justify-center p-20 text-slate-400 bg-slate-50/30">
                                <Activity className="w-12 h-12 mb-4 opacity-20" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">No matching attendance records found</p>
                                <p className="text-xs text-slate-400 mt-2">Adjust your filters or search terms</p>
                            </div>
                        )}
                    </div>

                    {/* Dual Action Section: Check-In & Check-Out */}
                    <div className="bg-white border-t border-slate-100 p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-y-12 lg:gap-0">
                            {/* Left Section: Check-In */}
                            <div className="lg:pr-12">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Available For Check-In</h3>
                                        <p className="text-slate-500 text-sm font-medium">Select a worker to log their entry selfie.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-slate-100">
                                        {availableForCheckIn.length} Available
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                    {availableForCheckIn.length > 0 ? availableForCheckIn.map((labour) => (
                                        <button
                                            key={labour.id}
                                            onClick={() => setCheckInTarget(labour)}
                                            className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all text-left group"
                                        >
                                            <h4 className="text-base font-bold text-slate-800 mb-4">{labour.labour_name}</h4>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Skill Category</span>
                                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">{labour.skill_type}</span>
                                                </div>
                                                <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform border border-slate-100">
                                                    <Camera className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="col-span-2 p-8 text-center text-slate-400">
                                            <p className="text-[10px] font-bold uppercase tracking-widest">All workers checked in for today</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Black Vertical Line (Desktop) / Horizontal (Mobile) */}
                            <div className="hidden lg:block w-px bg-black opacity-10" />
                            <div className="block lg:hidden h-px bg-black opacity-10 w-full" />

                            {/* Right Section: Check-Out */}
                            <div className="lg:pl-12">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 uppercase tracking-tight">Active For Check-Out</h3>
                                        <p className="text-slate-500 text-sm font-medium">Verify work completion and record exit selfie.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-xl border border-slate-100">
                                        {activeWorkers.length} Active Shifts
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                                    {activeWorkers.length > 0 ? activeWorkers.map((a) => (
                                        <button
                                            key={a.id || `active-${a.labour_id}`}
                                            onClick={async () => {
                                                if (!a.id || a.id === a.labour_id) {
                                                    setLoadingAttendanceId(a.labour_id);
                                                    try {
                                                        const history = await labourService.getLabourAttendance(a.labour_id);
                                                        const latest = Array.isArray(history) ? history[0] : history;
                                                        if (latest && (latest.id || latest.attendance_id)) {
                                                            setCheckOutTarget({ ...a, id: latest.id || latest.attendance_id });
                                                        } else {
                                                            setCheckOutTarget(a);
                                                        }
                                                    } catch (err) {
                                                        setCheckOutTarget(a);
                                                    } finally {
                                                        setLoadingAttendanceId(null);
                                                    }
                                                } else {
                                                    setCheckOutTarget(a);
                                                }
                                            }}
                                            className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:bg-slate-100 transition-all text-left group"
                                        >
                                            <h4 className="text-base font-bold text-slate-800 mb-4">{a.labour_name}</h4>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">In Time: {a.in_time}</span>
                                                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                                                        {loadingAttendanceId === a.labour_id ? 'Resolving ID...' : `${a.working_hours || 0} hrs Active`}
                                                    </span>
                                                </div>
                                                <div className="w-10 h-10 bg-white text-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform border border-slate-100">
                                                    {loadingAttendanceId === a.labour_id ? (
                                                        <Clock className="w-5 h-5 animate-spin" />
                                                    ) : (
                                                        <LogOut className="w-5 h-5" />
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="col-span-full h-full flex flex-col items-center justify-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No active shifts found</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* ── Modals ─────────────────────────────────────── */}
                <CheckInModal
                    isOpen={!!checkInTarget}
                    onClose={() => setCheckInTarget(null)}
                    labour={checkInTarget}
                    onSuccess={fetchData}
                    projectId={projectId}
                />
                <CheckOutModal
                    isOpen={!!checkOutTarget}
                    onClose={() => setCheckOutTarget(null)}
                    attendance={checkOutTarget}
                    onSuccess={fetchData}
                />

                {/* ── Detail Modal ────────────────────────────────── */}
                <Modal
                    isOpen={isDetailModalOpen}
                    onClose={() => setIsDetailModalOpen(false)}
                    title="Attendance Audit Insight"
                    maxWidth="max-w-2xl"
                >
                    {selectedAttendance && (
                        <div className="p-6 font-inter space-y-8">
                            <div className="bg-primary rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden font-inter">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                                <div className="relative z-10 flex items-center gap-8 font-inter">
                                    <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20 shadow-inner group relative font-inter">
                                        <span className="text-4xl font-bold">{selectedAttendance.labour_name?.charAt(0) || '?'}</span>
                                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${selectedAttendance.status?.toLowerCase() === 'absent' ? 'bg-rose-500' : 'bg-emerald-500'} border-4 border-primary rounded-full`} />
                                    </div>
                                    <div className="flex-1 font-inter">
                                        <div className="flex items-center gap-3 mb-2 font-inter">
                                            <h3 className="text-2xl font-bold tracking-tight uppercase">{selectedAttendance.labour_name || 'Unknown Worker'}</h3>
                                        </div>
                                        <div className="flex items-center gap-3 text-white/70 mb-4 font-inter">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold lowercase tracking-tight">worker.profile@infrapilot.com</span>
                                        </div>
                                        <div className="bg-white/15 px-4 py-2 rounded-xl border border-white/10 inline-flex items-center gap-3 font-inter">
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Shift Date:</span>
                                            <span className="text-xs font-bold uppercase tracking-widest">{selectedAttendance.attendance_date || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 font-inter">
                                <div className="flex items-center gap-3 mb-4 font-inter">
                                    <div className="p-2 bg-blue-50 text-primary rounded-xl border border-blue-100">
                                        <Camera className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Security Validation Audit</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6 font-inter">
                                    <div className="space-y-3 font-inter">
                                        <div className="aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 relative group shadow-sm font-inter">
                                            <img src={selectedAttendance.check_in_image || undefined} alt="In" className="w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                                <p className="text-[10px] font-bold text-white uppercase tracking-widest">Check-In Selfie</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 font-inter">
                                        {selectedAttendance.check_out_image ? (
                                            <div className="aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden border border-slate-100 relative group shadow-sm font-inter">
                                                <img src={selectedAttendance.check_out_image || undefined} alt="Out" className="w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                                    <p className="text-[10px] font-bold text-white uppercase tracking-widest">Check-Out Selfie</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-[4/5] bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center font-inter">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm font-inter">
                                                    <Activity className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Awaiting Exit</p>
                                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter mt-1">Selfie Required at Check-Out</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 font-inter">
                                <div className="flex items-center gap-3 mb-4 font-inter">
                                    <div className="p-2 bg-blue-50 text-primary rounded-xl border border-blue-100">
                                        <MapPin className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Audit Trail & Logistics</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 px-2 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-inter">Check-In Time</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">{selectedAttendance.in_time}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-inter">Check-Out Time</p>
                                        <p className="text-sm font-bold text-slate-800 font-inter">{selectedAttendance.out_time || 'Shift in Progress'}</p>
                                    </div>
                                    <div className="col-span-2 font-inter">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 font-inter">Verified Address</p>
                                        <p className="text-sm font-bold text-slate-800 leading-relaxed font-inter">
                                            IN: {selectedAttendance.check_in_address || 'Pune (Project Site A)'}
                                            {selectedAttendance.check_out_address && (
                                                <>
                                                    <br />
                                                    OUT: {selectedAttendance.check_out_address}
                                                </>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 font-inter">
                                <div className="flex items-center gap-3 mb-4 font-inter">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Daily Activity & Task Audit</h3>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 font-inter">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 font-inter text-slate-400">Work Description</p>
                                    <p className="text-sm font-bold text-slate-700 leading-relaxed font-inter italic">
                                        "{selectedAttendance.task_description || 'No work description provided for this shift.'}"
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 font-inter">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-inter">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">Overtime Rate</p>
                                        <p className="text-xs font-bold text-slate-700 font-inter">₹{selectedAttendance.overtime_rate || 0}/hr</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 font-inter">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 font-inter">Earnings Estimate</p>
                                        <p className="text-xs font-bold text-emerald-600 font-inter">₹{selectedAttendance.total_wage || 0}</p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="w-full py-5 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-2xl shadow-primary/30 active:scale-95 font-inter shadow-primary/20"
                            >
                                Dismiss Audit Insight
                            </button>
                        </div>
                    )}
                </Modal>

                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={async () => {
                        if (!attendanceToDelete) return;
                        setIsDeleting(true);
                        try {
                            await labourService.deleteAttendance(attendanceToDelete.id);
                            toast.success('Attendance record purged');
                            setIsDeleteModalOpen(false);
                            fetchData();
                        } catch (error) {
                            toast.error('Purge failed');
                        } finally {
                            setIsDeleting(false);
                        }
                    }}
                    title="Purge Attendance Entry"
                    message={`Are you sure you want to permanently delete the attendance record for ${attendanceToDelete?.labour_name}? This action cannot be reversed.`}
                    confirmText="Purge Record"
                    type="danger"
                    isLoading={isDeleting}
                />
            </PageTransition>
        </>
    );
};

export default AttendancePage;
