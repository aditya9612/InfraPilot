import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTextToAudio } from '../../utils/useTextToAudio';
import TaskDetailModal from '../../components/labour/TaskDetailModal';
import PageTransition from '../../components/common/PageTransition';
import Navbar from '../../components/common/Navbar';
import { useNavigate } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { attendanceService } from '../../services/attendanceService';
import { projectService } from '../../services/projectService';
import type { Task } from '../../types/task';
import {
    Clipboard,
    CheckCircle,
    AlertCircle,
    Volume2,
    Briefcase,
    User,
    ArrowRight,
    Loader2,
    Clock,
    Info,
    Calendar,
    IndianRupee,
    Zap,
    MapPin,
    Wallet,
    Timer,
    Award,
} from 'lucide-react';
import toast from 'react-hot-toast';

/* ─── helpers ─── */
const fmtDate = (d?: string) => {
    if (!d) return '-';
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtCurrency = (n: number | string | undefined | null): string => {
    const num = typeof n === 'number' ? n : parseFloat(String(n ?? '0'));
    if (isNaN(num)) return '0';
    return num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/* ─── Donut chart (pure SVG) ─── */
const AttendanceDonut: React.FC<{ present: number; absent: number; halfDays: number; total: number }> = ({
    present, absent, halfDays, total
}) => {
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    const radius = 54;
    const circumference = 2 * Math.PI * radius;
    const presentArc = total > 0 ? (present / total) * circumference : 0;
    const absentArc = total > 0 ? (absent / total) * circumference : 0;
    const halfArc = total > 0 ? (halfDays / total) * circumference : 0;

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-[140px] h-[140px]">
                <svg viewBox="0 0 128 128" className="w-full h-full -rotate-90">
                    {/* Background circle */}
                    <circle cx="64" cy="64" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="14" />
                    {/* Present (green) */}
                    <circle cx="64" cy="64" r={radius} fill="none" stroke="#10b981" strokeWidth="14"
                        strokeDasharray={`${presentArc} ${circumference - presentArc}`}
                        strokeDashoffset="0" strokeLinecap="round" />
                    {/* Absent (red) */}
                    {absent > 0 && (
                        <circle cx="64" cy="64" r={radius} fill="none" stroke="#ef4444" strokeWidth="14"
                            strokeDasharray={`${absentArc} ${circumference - absentArc}`}
                            strokeDashoffset={`${-presentArc}`} strokeLinecap="round" />
                    )}
                    {/* Half days (orange) */}
                    {halfDays > 0 && (
                        <circle cx="64" cy="64" r={radius} fill="none" stroke="#f59e0b" strokeWidth="14"
                            strokeDasharray={`${halfArc} ${circumference - halfArc}`}
                            strokeDashoffset={`${-(presentArc + absentArc)}`} strokeLinecap="round" />
                    )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-slate-800">{pct}%</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Attendance</span>
                </div>
            </div>
        </div>
    );
};

/* ─── main component ─── */
const LabourDashboard: React.FC = () => {
    const { user } = useAuth();
    const { speak } = useTextToAudio();
    const navigate = useNavigate();

    // ── state ──
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [_isCheckedOut, setIsCheckedOut] = useState(false);
    const [selectedTask, _setSelectedTask] = useState<Task | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const [tasks, setTasks] = useState<Task[]>([]);
    const [recentActivities, setRecentActivities] = useState<any[]>([]);

    // Stats
    const [totalTasks, setTotalTasks] = useState(0);
    const [completedTasks, setCompletedTasks] = useState(0);
    const [pendingTasks, setPendingTasks] = useState(0);
    const [hoursToday, setHoursToday] = useState(0);
    const [overtimeHours, setOvertimeHours] = useState(0);
    const [weeklyEarnings, setWeeklyEarnings] = useState(0);
    const [monthEarnings, setMonthEarnings] = useState(0);

    // Project & labour info
    const [projectName, setProjectName] = useState('');
    const [contractorName, setContractorName] = useState('');
    const [siteName, setSiteName] = useState('');
    const [siteAddress, setSiteAddress] = useState('');
    const [dailyWage, setDailyWage] = useState(0);
    const [overtimeRate, setOvertimeRate] = useState(0);
    const [skillType, setSkillType] = useState('');
    const [labourCategory, setLabourCategory] = useState('');

    // Attendance summary
    const [presentDays, setPresentDays] = useState(0);
    const [absentDays, setAbsentDays] = useState(0);
    const [halfDays, setHalfDays] = useState(0);
    const [totalDays, setTotalDays] = useState(0);
    const [attendanceStreak, setAttendanceStreak] = useState(0);

    // Payment summary
    const [totalAmount, setTotalAmount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState('');
    const [isOverdue, setIsOverdue] = useState(false);
    const [nextPaymentDate, setNextPaymentDate] = useState('');

    useEffect(() => {
        const savedIdStr = localStorage.getItem("client_selected_project_id") || localStorage.getItem("infrapilot_selected_project_id");
        const selectedPid = savedIdStr ? Number(savedIdStr) : 4;

        const fetchAll = async () => {
            setIsLoading(true);
            try {
                const [dashData, tasksResponse, todayStatus, attendanceList, paymentData] = await Promise.all([
                    dashboardService.getLabourDashboard(selectedPid).catch(() => null),
                    projectService.getTasks(selectedPid).catch(() => null),
                    attendanceService.getTodayStatus().catch(() => null),
                    attendanceService.getListAttendance({ project_id: selectedPid, page: 1, page_size: 100 }).catch(() => null),
                    dashboardService.getLabourPayments().catch(() => null),
                ]);

                // ── Today status ──
                if (todayStatus) {
                    const hasIn = !!(todayStatus.checked_in || todayStatus.attendance?.in_time || todayStatus.attendance?.check_in_time);
                    const hasOut = !!(todayStatus.checked_out || todayStatus.attendance?.out_time || todayStatus.attendance?.check_out_time);
                    setIsCheckedIn(hasIn && !hasOut);
                    setIsCheckedOut(hasOut);
                    setHoursToday(todayStatus.running_hours || todayStatus.attendance?.working_hours || todayStatus.attendance?.work_hours || 0);
                    setOvertimeHours(todayStatus.attendance?.overtime_hours || 0);
                }

                // ── Dashboard data ──
                if (dashData) {
                    const d: any = dashData;
                    const prof = d.profile || {};
                    const ov = d.overview || {};
                    const pymt = d.payment || d.payment_summary || {};
                    const lbr = d.labour || d.labour_details || d.profile || {};

                    const projName = d.project_name || prof.project_name || lbr.project_name;
                    if (projName) setProjectName(projName);

                    const contName = d.contractor_name || prof.contractor_name || lbr.contractor_name || user?.contractor_name || (user as any)?.contractor;
                    if (contName) setContractorName(contName);

                    const sName = d.site_name || prof.site_name || lbr.site_name;
                    if (sName) setSiteName(sName);

                    const sAddress = d.site_address || prof.site_address || lbr.site_address;
                    if (sAddress) setSiteAddress(sAddress);

                    const dw = d.daily_wage ?? prof.daily_wage ?? lbr.daily_wage ?? d.daily_wage_rate ?? 0;
                    setDailyWage(typeof dw === 'number' ? dw : parseFloat(dw) || 0);

                    const ot = d.overtime_rate ?? prof.overtime_rate ?? lbr.overtime_rate ?? d.ot_rate ?? 0;
                    setOvertimeRate(typeof ot === 'number' ? ot : parseFloat(ot) || 0);

                    setSkillType(d.skill_type ?? prof.skill_category ?? lbr.skill_category ?? lbr.skill ?? '');
                    setLabourCategory(d.labour_category ?? prof.labour_type ?? lbr.category ?? lbr.labour_type ?? '');

                    if (prof.check_in_status !== undefined || prof.is_checked_in !== undefined) {
                        const isProfCheckedIn = prof.check_in_status === 'CHECKED IN' || prof.is_checked_in === true;
                        if (!todayStatus) {
                            setIsCheckedIn(isProfCheckedIn);
                        }
                    }

                    // Hours today & overtime from overview if present
                    if (ov.today_hours !== undefined) setHoursToday(Number(ov.today_hours));
                    if (ov.overtime_hours !== undefined) setOvertimeHours(Number(ov.overtime_hours));

                    // Earnings from overview or top level
                    const wEarn = ov.weekly_earnings ?? d.weekly_earnings ?? 0;
                    setWeeklyEarnings(typeof wEarn === 'number' ? wEarn : parseFloat(wEarn) || 0);

                    const mEarn = ov.this_month_earnings ?? d.this_month_earnings ?? d.earnings_current_month ?? d.earnings ?? d.total_earnings ?? 0;
                    setMonthEarnings(typeof mEarn === 'number' ? mEarn : parseFloat(mEarn) || 0);

                    // Attendance from dashboard response
                    const pDays = d.present_days ?? d.attendance_summary?.present_days ?? 0;
                    const aDays = d.absent_days ?? d.attendance_summary?.absent_days ?? 0;
                    const hDays = d.half_days ?? d.attendance_summary?.half_days ?? 0;
                    setPresentDays(pDays);
                    setAbsentDays(aDays);
                    setHalfDays(hDays);
                    const calculatedTot = pDays + aDays + hDays;
                    setTotalDays(calculatedTot > 0 ? calculatedTot : (d.total_days ?? d.attendance_summary?.total_days ?? 0));
                    setAttendanceStreak(d.attendance_streak ?? d.streak ?? 0);

                    // Payment summary from dashboard response
                    const totAmt = pymt.total_amount ?? d.total_amount ?? 0;
                    const paidAmt = pymt.paid_amount ?? d.paid_amount ?? 0;
                    const pendAmt = pymt.pending_amount ?? d.pending_amount ?? 0;
                    const statusStr = pymt.payment_status ?? pymt.status ?? d.payment_status ?? '';
                    const overdueBool = pymt.is_overdue ?? d.is_overdue ?? false;

                    setTotalAmount(typeof totAmt === 'number' ? totAmt : parseFloat(totAmt) || 0);
                    setPaidAmount(typeof paidAmt === 'number' ? paidAmt : parseFloat(paidAmt) || 0);
                    setPendingAmount(typeof pendAmt === 'number' ? pendAmt : parseFloat(pendAmt) || 0);
                    if (statusStr) setPaymentStatus(statusStr);
                    setIsOverdue(Boolean(overdueBool));
                    if (pymt.next_payment_date || d.next_payment_date) {
                        setNextPaymentDate(pymt.next_payment_date ?? d.next_payment_date);
                    }

                    // Recent activity
                    const rawActivities = d.recent_activity || d.recent_activities || [];
                    setRecentActivities(rawActivities.map((a: any) => ({
                        title: a.title || a.type || a.activity_type || 'Activity',
                        description: a.description || a.message || a.details || '',
                        time: a.time || a.created_at || a.timestamp || '',
                    })));
                }

                // ── Payment overlay from dedicated endpoint ──
                if (paymentData) {
                    const p: any = paymentData;
                    const pSum = p.summary || p.payment_summary || (p.total_amount !== undefined ? p : null);
                    if (pSum && pSum.total_amount !== undefined && Number(pSum.total_amount) > 0) {
                        setTotalAmount(Number(pSum.total_amount));
                        if (pSum.paid_amount !== undefined) setPaidAmount(Number(pSum.paid_amount));
                        if (pSum.pending_amount !== undefined) setPendingAmount(Number(pSum.pending_amount));
                        if (pSum.payment_status || pSum.status) setPaymentStatus(pSum.payment_status || pSum.status);
                        if (pSum.is_overdue !== undefined) setIsOverdue(Boolean(pSum.is_overdue));
                        if (pSum.next_payment_date) setNextPaymentDate(pSum.next_payment_date);
                    }
                }

                // ── Attendance list for month summary ──
                if (attendanceList) {
                    const records = attendanceList.data || [];
                    const now = new Date();
                    const thisMonth = now.getMonth();
                    const thisYear = now.getFullYear();
                    const monthRecords = records.filter((r: any) => {
                        const rd = new Date(r.attendance_date);
                        return rd.getMonth() === thisMonth && rd.getFullYear() === thisYear;
                    });
                    if (monthRecords.length > 0) {
                        const pres = monthRecords.filter((r: any) => r.working_hours > 4 || r.work_hours > 4 || (!r.is_half_day && (r.check_in_time || r.in_time))).length;
                        const half = monthRecords.filter((r: any) => r.is_half_day).length;
                        const abs = monthRecords.length - pres - half;
                        const calculatedWorkDays = pres + (abs > 0 ? abs : 0) + half;
                        setPresentDays(prev => prev || pres);
                        setHalfDays(prev => prev || half);
                        setAbsentDays(prev => prev || (abs > 0 ? abs : 0));
                        setTotalDays(prev => prev || calculatedWorkDays || pres);

                        // Streak: consecutive present days from today backwards
                        const sorted = [...monthRecords].sort((a: any, b: any) => new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime());
                        let streak = 0;
                        for (const rec of sorted) {
                            if (rec.check_in_time || rec.in_time) streak++;
                            else break;
                        }
                        setAttendanceStreak(prev => prev || streak);
                    }
                }

                // ── Tasks ──
                const rawDashboardRecentTasks = dashData?.recent_tasks || dashData?.tasks || dashData?.assigned_tasks || [];
                const rawProjectTasks = Array.isArray(tasksResponse) ? tasksResponse : (tasksResponse?.items || tasksResponse?.data || []);
                const rawTasks = (Array.isArray(rawDashboardRecentTasks) && rawDashboardRecentTasks.length > 0)
                    ? rawDashboardRecentTasks
                    : rawProjectTasks;

                const dashTotal = dashData?.overview?.total_tasks ?? dashData?.total_tasks ?? dashData?.total;
                const dashCompleted = dashData?.overview?.completed_tasks ?? dashData?.completed_tasks ?? dashData?.completed;
                const dashPending = dashData?.overview?.pending_tasks ?? dashData?.pending_tasks ?? dashData?.pending;

                if (dashTotal !== undefined && dashTotal !== null) {
                    setTotalTasks(Number(dashTotal));
                    setCompletedTasks(Number(dashCompleted ?? 0));
                    setPendingTasks(Number(dashPending ?? 0));
                } else {
                    setTotalTasks(rawProjectTasks.length > 0 ? rawProjectTasks.length : (rawTasks.length || (dashData?.total ?? 0)));
                    setCompletedTasks(rawProjectTasks.length > 0
                        ? rawProjectTasks.filter((t: any) => (t.status || '').toLowerCase() === 'completed').length
                        : (dashData?.completed ?? 0));
                    setPendingTasks(rawProjectTasks.length > 0
                        ? rawProjectTasks.filter((t: any) => (t.status || '').toLowerCase() !== 'completed').length
                        : (dashData?.pending ?? 0));
                }

                const mappedTasks: Task[] = rawTasks.map((t: any) => {
                    const rawStatus = t.status || 'Pending';
                    let formattedStatus = 'Pending';
                    const sLower = String(rawStatus).toLowerCase();
                    if (sLower === 'in_progress' || sLower === 'in progress') formattedStatus = 'In Progress';
                    else if (sLower === 'completed') formattedStatus = 'Completed';
                    else if (sLower === 'planned') formattedStatus = 'Planned';
                    else if (sLower === 'cancelled' || sLower === 'canceled') formattedStatus = 'Cancelled';
                    else formattedStatus = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

                    const progVal = t.progress !== undefined 
                        ? Number(t.progress) 
                        : (t.progress_percent !== undefined ? Number(t.progress_percent) : (sLower === 'completed' ? 100 : 0));

                    return {
                        id: String(t.task_id || t.id || `T-${Math.random().toString(36).substr(2, 5).toUpperCase()}`),
                        name: t.title || t.name || t.task_name || 'Unnamed Task',
                        project: t.project_name || t.project || projectName || 'Sara City',
                        project_id: t.project_id || selectedPid || 4,
                        assignedTo: t.assigned_to_name || t.assignedTo || user?.name || 'Self',
                        assignedFrom: t.assigned_from === 'self' ? 'Self' : 'Site Engineer',
                        description: t.description || 'No description provided.',
                        status: formattedStatus as any,
                        priority: t.priority ? (t.priority.charAt(0).toUpperCase() + t.priority.slice(1).toLowerCase()) : 'Medium',
                        startDate: t.start_date || t.startDate || '',
                        endDate: t.end_date || t.endDate || '',
                        progress: Math.round(progVal)
                    };
                });
                setTasks(mappedTasks);

                // ── Project name fallback ──
                if (!projectName) {
                    const savedName = localStorage.getItem("client_selected_project_name") || localStorage.getItem("infrapilot_selected_project_name");
                    if (savedName) setProjectName(savedName);
                    else {
                        try {
                            const proj = await projectService.getProjectById(selectedPid);
                            if (proj) {
                                setProjectName((proj as any).project_name || (proj as any).name || '');
                                setSiteName(prev => prev || (proj as any).site_name || (proj as any).project_name || '');
                                setSiteAddress(prev => prev || (proj as any).site_address || (proj as any).address || '');
                            }
                        } catch { /* ignore */ }
                    }
                }

            } catch (err) {
                console.error("Failed to fetch labour dashboard data", err);
                toast.error("Could not load dashboard data");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAll();

        const handleProjectChange = () => {
            const updatedName = localStorage.getItem("client_selected_project_name") || localStorage.getItem("infrapilot_selected_project_name");
            if (updatedName) setProjectName(updatedName);
            fetchAll();
        };
        window.addEventListener('storage', handleProjectChange);
        window.addEventListener('project_changed', handleProjectChange);
        return () => {
            window.removeEventListener('storage', handleProjectChange);
            window.removeEventListener('project_changed', handleProjectChange);
        };
    }, [user?.name]);

    /* ── handlers ── */
    const handleUpdateTask = (id: string, status: string) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: status as any } : t));
        localStorage.setItem(`task_status_${id}`, status);
        toast.success(`Task marked as ${status}!`);
        setIsTaskModalOpen(false);
    };

    const handleTaskClick = (task: Task) => {
        if (task.status === 'Completed') return;
        navigate(`/labour/work-updates?taskId=${task.id}&projectId=${task.project_id || 4}&taskName=${encodeURIComponent(task.name)}&taskCategory=${encodeURIComponent(task.priority)}`);
    };

    /* ── stats row config ── */
    const stats = useMemo(() => [
        { label: 'Total Tasks', value: totalTasks, icon: Clipboard, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Completed', value: completedTasks, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Pending', value: pendingTasks, icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-50' },
        { label: 'Hours Today', value: `${hoursToday} hrs`, icon: Clock, color: 'text-indigo-500', bg: 'bg-indigo-50' },
        { label: 'Overtime Hours', value: `${overtimeHours} hrs`, icon: Timer, color: 'text-purple-500', bg: 'bg-purple-50' },
        { label: 'Weekly Earnings', value: `₹${fmtCurrency(weeklyEarnings)}`, icon: Wallet, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'This Month Earnings', value: `₹${fmtCurrency(monthEarnings)}`, icon: IndianRupee, color: 'text-green-600', bg: 'bg-green-50' },
    ], [totalTasks, completedTasks, pendingTasks, hoursToday, overtimeHours, weeklyEarnings, monthEarnings]);

    const statusBadge = (status: string) => {
        const s = status?.toLowerCase();
        if (s === 'in_progress' || s === 'in progress') return { label: 'In Progress', bg: 'bg-blue-500', text: 'text-white' };
        if (s === 'completed') return { label: 'Completed', bg: 'bg-emerald-500', text: 'text-white' };
        if (s === 'planned') return { label: 'Planned', bg: 'bg-slate-100', text: 'text-slate-600' };
        if (s === 'cancelled' || s === 'canceled') return { label: 'Cancelled', bg: 'bg-rose-100', text: 'text-rose-600' };
        return { label: status || 'Pending', bg: 'bg-slate-100', text: 'text-slate-600' };
    };

    const priorityBadge = (priority: string) => {
        const p = priority?.toLowerCase();
        if (p === 'high') return { label: 'High', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
        if (p === 'medium') return { label: 'Medium', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
        return { label: 'Low', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    };

    return (
        <>
            <Navbar title="Labour Portal" breadcrumb={['InfraPilot', 'Dashboard']} />
            <PageTransition className="p-4 md:p-6 lg:p-8 bg-[#F1F5F9] min-h-screen font-inter pb-20">

                {/* ═══════ WELCOME HEADER ═══════ */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <h1 className="text-2xl font-black text-slate-800 tracking-tight">
                                    Welcome, {user?.name || 'Worker'}
                                </h1>
                                <button
                                    onClick={() => speak(`Welcome, ${user?.name || 'Worker'}`)}
                                    className="text-slate-300 hover:text-blue-600 transition-colors"
                                >
                                    <Volume2 className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                    <Briefcase className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium">Project</span>
                                    <span className="text-slate-300 mx-1">|</span>
                                    <span className="font-bold text-slate-800">{projectName || user?.project_name || '-'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                    <User className="w-4 h-4 text-slate-400" />
                                    <span className="font-medium">Contractor</span>
                                    <span className="text-slate-300 mx-1">|</span>
                                    <span className="font-bold text-slate-800">{contractorName || user?.contractor_name || (user as any)?.contractor || '-'}</span>
                                </div>
                            </div>
                            {/* Skill tags */}
                            {(skillType || labourCategory) && (
                                <div className="flex items-center gap-2 mt-3">
                                    {skillType && (
                                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white">{skillType}</span>
                                    )}
                                    {labourCategory && (
                                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-white border border-emerald-400">{labourCategory}</span>
                                    )}
                                </div>
                            )}
                        </div>
                        {/* Status / Check In */}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                                <span className={`text-xs font-black uppercase tracking-wider ${isCheckedIn ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {isCheckedIn ? 'CHECKED IN' : 'NOT CHECKED IN'}
                                </span>
                            </div>
                            <button
                                onClick={() => navigate('/labour/attendance')}
                                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-95 ${
                                    isCheckedIn
                                        ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                                }`}
                            >
                                {isCheckedIn ? 'CHECK OUT' : 'CHECK IN'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ═══════ STATS ROW (7 cards) ═══════ */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{stat.label}</p>
                            <p className="text-xl font-black text-slate-800">{isLoading ? '...' : stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* ═══════ THREE‑COLUMN: Attendance | Labour Details | Payment ═══════ */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                    {/* ── Attendance Summary ── */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            Attendance Summary (This Month)
                        </h3>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-start gap-6">
                                    <AttendanceDonut present={presentDays} absent={absentDays} halfDays={halfDays} total={totalDays || 1} />
                                    <div className="space-y-3 flex-1 pt-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                                <span className="text-xs font-medium text-slate-600">Present Days</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">{presentDays}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                                                <span className="text-xs font-medium text-slate-600">Absent Days</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">{absentDays}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                                <span className="text-xs font-medium text-slate-600">Half Days</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">{halfDays}</span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                                            <span className="text-xs font-bold text-slate-500">Total Days</span>
                                            <span className="text-sm font-black text-slate-800">{totalDays}</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Streak bar */}
                                <div className="mt-5 bg-emerald-50 rounded-xl px-4 py-2.5 flex items-center gap-2 border border-emerald-100">
                                    <Award className="w-4 h-4 text-emerald-500" />
                                    <span className="text-xs font-bold text-emerald-700">Attendance Streak: {attendanceStreak} Days</span>
                                </div>
                            </>
                        )}
                    </div>

                    {/* ── Labour Details ── */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-500" />
                            Labour Details
                        </h3>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                            </div>
                        ) : (
                            <div className="space-y-5">
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Site Name</p>
                                    <p className="text-sm font-bold text-slate-800">{siteName || projectName || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Site Address</p>
                                    <p className="text-sm font-bold text-slate-800">{siteAddress || '-'}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                                    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Daily Wage</p>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <IndianRupee className="w-4 h-4 text-blue-500" />
                                            <span className="text-xl font-black text-slate-800">₹{fmtCurrency(dailyWage)}</span>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Overtime Rate</p>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Clock className="w-4 h-4 text-orange-500" />
                                            <span className="text-xl font-black text-slate-800">₹{fmtCurrency(overtimeRate)}</span>
                                            <span className="text-xs text-slate-400 font-bold">/hr</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Payment Summary ── */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-black text-slate-800 mb-5 flex items-center gap-2">
                            <Wallet className="w-4 h-4 text-blue-500" />
                            Payment Summary
                        </h3>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount</p>
                                        <p className="text-lg font-black text-slate-800">₹{fmtCurrency(totalAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Paid Amount</p>
                                        <p className="text-lg font-black text-emerald-600">₹{fmtCurrency(paidAmount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pending Amount</p>
                                        <p className="text-lg font-black text-red-500">₹{fmtCurrency(pendingAmount)}</p>
                                    </div>
                                </div>

                                <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Payment Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                            paymentStatus?.toLowerCase() === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                            paymentStatus?.toLowerCase() === 'partial' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                                            'bg-slate-50 text-slate-500 border-slate-200'
                                        }`}>
                                            {paymentStatus || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Is Overdue</p>
                                        <span className={`inline-block px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                            isOverdue ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                        }`}>
                                            {isOverdue ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════ BOTTOM: Recent Tasks + Recent Activity ═══════ */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                    {/* ── Recent Tasks ── */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-black text-slate-800">Recent Tasks</h3>
                            <button
                                onClick={() => navigate('/labour/tasks')}
                                className="text-[11px] font-bold text-blue-600 flex items-center gap-1 hover:underline"
                            >
                                View All <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Clipboard className="w-10 h-10 text-slate-200 mb-3" />
                                <p className="text-xs font-bold text-slate-400">No tasks assigned yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tasks.slice(0, 3).map((task, i) => {
                                    const stBadge = statusBadge(task.status);
                                    const prBadge = priorityBadge(task.priority);
                                    return (
                                        <div
                                            key={task.id || i}
                                            onClick={() => handleTaskClick(task)}
                                            className="border border-slate-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-start gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                                                        <Clipboard className="w-4 h-4 text-blue-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800">{task.name}</p>
                                                        <p className="text-[11px] text-slate-400 font-medium">{task.project || projectName}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${stBadge.bg} ${stBadge.text}`}>
                                                        {stBadge.label}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${prBadge.bg} ${prBadge.color} ${prBadge.border}`}>
                                                        {prBadge.label}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 text-[11px] text-slate-400 font-medium mb-2 pl-12">
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> Start Date &nbsp;{task.startDate ? fmtDate(task.startDate) : '-'}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> End Date &nbsp;{task.endDate ? fmtDate(task.endDate) : '-'}
                                                </span>
                                            </div>
                                            {/* Progress bar */}
                                            <div className="pl-12">
                                                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-blue-500 h-full rounded-full transition-all"
                                                        style={{ width: `${task.progress || 0}%` }}
                                                    />
                                                </div>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 text-right">{task.progress || 0}%</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Recent Activity ── */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col">
                        <div className="mb-5">
                            <h3 className="text-sm font-black text-slate-800">Recent Activity</h3>
                        </div>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
                            </div>
                        ) : recentActivities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Zap className="w-10 h-10 text-slate-200 mb-3" />
                                <p className="text-xs font-bold text-slate-400">No activity yet</p>
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                                {recentActivities.map((activity, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                                            <Clipboard className="w-4 h-4 text-emerald-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-800">{activity.title}</p>
                                            <p className="text-[11px] text-slate-400 font-medium truncate">{activity.description}</p>
                                        </div>
                                        <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                                            {activity.time ? fmtDate(activity.time) : '-'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════ INFO BANNER ═══════ */}
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-4 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                        <Info className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-800">Keep your attendance updated and complete your tasks on time.</p>
                        <p className="text-xs text-slate-500 mt-0.5">Your daily work and attendance help us build better projects together.</p>
                    </div>
                </div>

                <TaskDetailModal
                    isOpen={isTaskModalOpen}
                    task={selectedTask}
                    onClose={() => setIsTaskModalOpen(false)}
                    onUpdateStatus={handleUpdateTask}
                />
            </PageTransition>
        </>
    );
};

export default LabourDashboard;
