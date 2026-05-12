import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import StatCard from '../../../components/common/StatCard';
import { 
    Users, 
    UserX, 
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
    Sheet,
    FileText,
    RotateCcw
} from "lucide-react";
import { labourService } from '../../../services/labourService';
import { projectService } from '../../../services/projectService';
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

    useEffect(() => {
        const initializeProject = async () => {
            try {
                const userStr = localStorage.getItem("infrapilot_user");
                if (userStr) {
                    const user = JSON.parse(userStr);
                    const storedPId = user?.project_id || user?.user?.project_id;
                    if (storedPId) {
                        setProjectId(Number(storedPId));
                        return;
                    }
                }
                
                // Fallback discovery
                const projectsResponse = await projectService.getProjects(1, 0);
                const projects = Array.isArray(projectsResponse) ? projectsResponse : (projectsResponse.items || []);
                if (projects && projects.length > 0) {
                    setProjectId(Number(projects[0].project_id || projects[0].id));
                } else {
                    setProjectId(36);
                }
            } catch (err) {
                console.error("Attendance Project Resolution Error:", err);
                setProjectId(36);
            }
        };
        initializeProject();
    }, []);

    const fetchData = async () => {
        if (projectId === null) return;
        setIsLoading(true);
        try {
            const [attendanceRes, labourRes] = await Promise.all([
                labourService.getAttendanceList(projectId || 0),
                labourService.getLabours(projectId || 0)
            ]);
            setAttendances(attendanceRes.items || []);
            setLabours(labourRes.items || []);
        } catch (error: any) {
            toast.error('Failed to load attendance data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAttendanceDetails = async (attendance: AttendanceRecord) => {
        setLoadingAttendanceId(attendance.id);
        try {
            const details = await labourService.getLabourAttendance(attendance.labour_id);
            const record = Array.isArray(details) 
                ? details.find((d: any) => d.id === attendance.id) || details[0]
                : details;
            setSelectedAttendance(record || attendance);
            setIsDetailModalOpen(true);
        } catch (error) {
            toast.error('Failed to fetch detailed audit logs');
            setSelectedAttendance(attendance);
            setIsDetailModalOpen(true);
        } finally {
            setLoadingAttendanceId(null);
        }
    };

    const handleExport = async (type: 'excel' | 'pdf') => {
        if (!projectId) return;
        const loadingToast = toast.loading(`Generating ${type.toUpperCase()}...`);
        try {
            let blob;
            let filename;
            const today = new Date().toISOString().split('T')[0];
            if (type === 'excel') {
                blob = await labourService.exportAttendanceExcel(projectId, today, today);
                filename = `attendance_report_${today}.xlsx`;
            } else {
                blob = await labourService.exportAttendancePDF(projectId, today, today);
                filename = `attendance_report_${today}.pdf`;
            }
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(`${type.toUpperCase()} Generated!`, { id: loadingToast });
        } catch (error: any) {
            toast.error(`Failed to export ${type.toUpperCase()}`, { id: loadingToast });
        }
    };

    useEffect(() => {
        fetchData();
    }, [projectId]);

    const activeWorkers = useMemo(() => {
        return attendances.filter(a => !a.out_time);
    }, [attendances]);

    const stats = useMemo(() => {
        const total = attendances.length;
        const present = activeWorkers.length;
        const absent = labours.length - present;
        const otWorkers = attendances.filter(a => a.overtime_hours > 0).length;
        return { total, present, absent, otWorkers };
    }, [attendances, activeWorkers, labours]);

    const filteredAttendances = useMemo(() => {
        if (activeStatFilter === "Absent") {
            // Find labors who haven't checked in yet
            const presentIds = new Set(attendances.map(a => a.labour_id));
            const absentLabours = labours.filter(l => !presentIds.has(l.id));
            
            // Map them to an attendance-like object for the table
            return absentLabours.map(l => ({
                id: l.id, // using actual ID as number
                labour_id: l.id,
                labour_name: l.labour_name,
                worker_code: l.worker_code,
                attendance_date: new Date().toISOString().split('T')[0],
                in_time: '—',
                out_time: null,
                working_hours: 0,
                overtime_hours: 0,
                task_id: null,
                check_in_address: '',
                check_out_address: null,
                check_in_image: null,
                check_out_image: null,
                status: "Absent"
            } as AttendanceRecord));
        }

        let data = attendances;

        // Apply StatCard Filter
        if (activeStatFilter === "Present") {
            data = data.filter(a => !a.out_time);
        } else if (activeStatFilter === "OT") {
            data = data.filter(a => a.overtime_hours > 0);
        }

        return data.filter(a => {
            const matchesSearch = a.labour_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                a.worker_code?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [attendances, labours, searchTerm, statusFilter, activeStatFilter]);

    return (
        <>
            <Navbar title="Daily Attendance" breadcrumb={["Engineer", "Human Resources", "Attendance Registry"]} />
            
            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Workforce Attendance Registry</h1>
                        <p className="text-slate-500 text-sm italic-none">Securely track worker check-in/out with GPS and photo validation.</p>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => handleExport('excel')}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all active:scale-95"
                        >
                            <Sheet className="w-4 h-4" />
                            <span>Excel</span>
                        </button>
                        <button 
                            onClick={() => handleExport('pdf')}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all active:scale-95"
                        >
                            <FileText className="w-4 h-4" />
                            <span>PDF</span>
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 shadow-sm">
                            <Calendar className="w-4 h-4 text-primary" />
                            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* ── Summary Stats with Interactive Filtering ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div onClick={() => setActiveStatFilter("Present")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Present" ? "ring-2 ring-emerald-500 bg-emerald-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Present Now"
                            value={stats.present.toString()}
                            sub="Verified On-Site"
                            accent="text-emerald-500"
                            icon={<Users className={`w-5 h-5 ${activeStatFilter === "Present" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveStatFilter("Absent")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Absent" ? "ring-2 ring-rose-500 bg-rose-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Absent"
                            value={stats.absent.toString()}
                            sub="No Report Today"
                            accent="text-rose-500"
                            icon={<UserX className={`w-5 h-5 ${activeStatFilter === "Absent" ? "text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-500"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveStatFilter("OT")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "OT" ? "ring-2 ring-amber-500 bg-amber-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="OT Active"
                            value={stats.otWorkers.toString()}
                            sub="Workers in Overtime"
                            accent="text-amber-500"
                            icon={<Clock className={`w-5 h-5 ${activeStatFilter === "OT" ? "text-amber-500 scale-110" : "text-slate-400 group-hover:text-amber-500"} transition-all`} />}
                        />
                    </div>
                    <div onClick={() => setActiveStatFilter("Efficiency")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Efficiency" ? "ring-2 ring-blue-500 bg-blue-50/50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard
                            title="Man-Hours"
                            value="384h"
                            sub="Daily Productivity"
                            accent="text-blue-500"
                            icon={<Activity className={`w-5 h-5 ${activeStatFilter === "Efficiency" ? "text-blue-500 scale-110" : "text-slate-400 group-hover:text-blue-500"} transition-all`} />}
                        />
                    </div>
                </div>

                {/* ── Registry Table Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                            <select 
                                value={statusFilter} 
                                onChange={(e) => setStatusFilter(e.target.value)} 
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black text-slate-600 outline-none cursor-pointer uppercase tracking-widest"
                            >
                                <option value="All">All Status</option>
                                <option value="present">Present</option>
                                <option value="absent">Completed</option>
                            </select>
                            {activeStatFilter !== "All" && (
                                <button onClick={() => setActiveStatFilter("All")} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                    <RotateCcw className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing attendance vault...</p>
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
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold">
                                                    {a.labour_name?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{a.labour_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{a.worker_code}</span>
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
                                                <span className="text-[10px] font-black text-rose-300 uppercase tracking-widest italic">Absent</span>
                                            ) : (
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${a.check_in_image ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-50'}`}>
                                                        <Camera className="w-3 h-3" />
                                                        <span className="text-[9px] font-black uppercase tracking-tighter">{a.check_in_image ? 'Selfie ✓' : 'Pending'}</span>
                                                    </div>
                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border ${a.check_in_address ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-100 opacity-50'}`}>
                                                        <MapPin className="w-3 h-3" />
                                                        <span className="text-[9px] font-black uppercase tracking-tighter">{a.check_in_address ? 'GPS ✓' : 'Pending'}</span>
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
                                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">N/A</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Dual Action Section: Check-In & Check-Out */}
                    <div className="bg-primary border-t border-white/10 p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            {/* Left Section: Check-In */}
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-white italic-none uppercase tracking-tight">Available For Check-In</h3>
                                        <p className="text-white/60 text-sm font-medium italic-none">Select a worker to log their entry selfie.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10">
                                        {labours.length} Roster Units
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {labours.slice(0, 4).map((labour) => (
                                        <button 
                                            key={labour.id}
                                            onClick={() => setCheckInTarget(labour)}
                                            className="bg-white/10 p-5 rounded-[1.5rem] border border-white/10 hover:bg-white/20 transition-all text-left group"
                                        >
                                            <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-1 opacity-70">{labour.worker_code}</p>
                                            <h4 className="text-base font-bold text-white uppercase italic-none mb-4">{labour.labour_name}</h4>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1">Skill Category</span>
                                                    <span className="text-[11px] font-bold text-white/80 uppercase tracking-wide">{labour.skill_type}</span>
                                                </div>
                                                <div className="w-10 h-10 bg-white text-primary rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                    <Camera className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Right Section: Check-Out */}
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-white italic-none uppercase tracking-tight">Active For Check-Out</h3>
                                        <p className="text-white/60 text-sm font-medium italic-none">Verify work completion and record exit selfie.</p>
                                    </div>
                                    <div className="px-4 py-2 bg-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-xl border border-white/10">
                                        {activeWorkers.length} Active Shifts
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {activeWorkers.length > 0 ? activeWorkers.map((a) => (
                                        <button 
                                            key={a.id}
                                            onClick={() => setCheckOutTarget(a)}
                                            className="bg-white/10 p-5 rounded-[1.5rem] border border-white/10 hover:bg-white/20 transition-all text-left group"
                                        >
                                            <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-1 opacity-70">{a.worker_code || 'LAB--'}</p>
                                            <h4 className="text-base font-bold text-white uppercase italic-none mb-4">{a.labour_name}</h4>
                                            <div className="flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mb-1">In Time: {a.in_time}</span>
                                                    <span className="text-[11px] font-bold text-white/80 uppercase tracking-wide">{a.working_hours} hrs Active</span>
                                                </div>
                                                <div className="w-10 h-10 bg-white text-rose-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                                    <LogOut className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </button>
                                    )) : (
                                        <div className="col-span-2 h-full flex flex-col items-center justify-center py-10 bg-white/5 rounded-[1.5rem] border border-dashed border-white/10">
                                            <p className="text-white/40 text-xs font-bold uppercase tracking-widest">No active shifts found</p>
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
                        <div className="p-6 font-inter space-y-8 italic-none">
                            <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden font-inter">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
                                <div className="relative z-10 flex items-center gap-8 font-inter">
                                    <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2rem] flex items-center justify-center border border-white/20 shadow-inner group relative font-inter">
                                        <span className="text-4xl font-black">{selectedAttendance.labour_name?.charAt(0) || '?'}</span>
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-primary rounded-full" />
                                    </div>
                                    <div className="flex-1 font-inter">
                                        <div className="flex items-center gap-3 mb-2 font-inter">
                                            <h3 className="text-2xl font-black tracking-tight uppercase">{selectedAttendance.labour_name || 'Unknown Worker'}</h3>
                                            <span className="px-3 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">{selectedAttendance.worker_code || 'LAB--'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-white/70 mb-4 font-inter">
                                            <Mail className="w-3.5 h-3.5" />
                                            <span className="text-xs font-bold lowercase tracking-tight">worker.{(selectedAttendance.worker_code || 'worker').toLowerCase()}@infrapilot.com</span>
                                        </div>
                                        <div className="bg-white/15 px-4 py-2 rounded-xl border border-white/10 inline-flex items-center gap-3 font-inter">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Shift Date:</span>
                                            <span className="text-xs font-black uppercase tracking-widest">{selectedAttendance.attendance_date || 'N/A'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 font-inter">
                                <div className="flex items-center gap-3 mb-4 font-inter">
                                    <div className="p-2 bg-blue-50 text-primary rounded-xl border border-blue-100">
                                        <Camera className="w-4 h-4" />
                                    </div>
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Security Validation Audit</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-6 font-inter">
                                    <div className="space-y-3 font-inter">
                                        <div className="aspect-[4/5] bg-slate-100 rounded-[1.5rem] overflow-hidden border border-slate-100 relative group shadow-sm font-inter">
                                            <img src={selectedAttendance.check_in_image || undefined} alt="In" className="w-full h-full object-cover" />
                                            <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Check-In Selfie</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-3 font-inter">
                                        {selectedAttendance.check_out_image ? (
                                            <div className="aspect-[4/5] bg-slate-100 rounded-[1.5rem] overflow-hidden border border-slate-100 relative group shadow-sm font-inter">
                                                <img src={selectedAttendance.check_out_image || undefined} alt="Out" className="w-full h-full object-cover" />
                                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Check-Out Selfie</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-[4/5] bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center p-6 text-center font-inter">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm font-inter">
                                                    <Activity className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Awaiting Exit</p>
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
                                    <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Audit Trail & Logistics</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-y-8 px-2 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">Check-In Time</p>
                                        <p className="text-sm font-black text-slate-800 font-inter">{selectedAttendance.in_time}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">Check-Out Time</p>
                                        <p className="text-sm font-black text-slate-800 font-inter">{selectedAttendance.out_time || 'Shift in Progress'}</p>
                                    </div>
                                    <div className="col-span-2 font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter">Verified Address</p>
                                        <p className="text-sm font-black text-slate-800 leading-relaxed font-inter">
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

                            <button 
                                onClick={() => setIsDetailModalOpen(false)}
                                className="w-full py-5 bg-primary text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-2xl shadow-primary/30 active:scale-95 font-inter shadow-primary/20"
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
