import { useState, useEffect, useMemo } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";
import { attendanceService, type AttendanceRecord } from "../../services/attendanceService";
import { CheckCircle2, XCircle, Clock, AlertTriangle, MapPin, FileText } from "lucide-react";

const AdminAttendancePage = () => {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
    const [approvalFilter, setApprovalFilter] = useState<"all" | "pending" | "approved">("all");
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 15;

    const fetchAttendance = async () => {
        setIsLoading(true);
        try {
            const params: any = {};
            if (dateFilter) params.date = dateFilter;
            if (approvalFilter === "pending") params.is_approved = false;
            if (approvalFilter === "approved") params.is_approved = true;

            const { items } = await attendanceService.getAllAttendance(params);
            setRecords(items);
        } catch (err) {
            toast.error("Failed to load attendance records");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendance();
    }, [dateFilter, approvalFilter]);

    const handleApprove = async (id: number, approved: boolean) => {
        try {
            await attendanceService.approveAttendance(id, approved);
            toast.success(approved ? "Attendance approved!" : "Attendance rejected.");
            fetchAttendance();
        } catch {
            toast.error("Failed to update approval status.");
        }
    };

    const filtered = useMemo(() => records, [records]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const paged = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    useEffect(() => { setCurrentPage(0); }, [dateFilter, approvalFilter]);

    return (
        <>
            <Navbar title="Attendance Management" breadcrumb={["Admin", "Users", "Attendance"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Attendance</h1>
                        <p className="text-slate-500 text-sm">Monitor daily attendance, overtime, and geofence alerts.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <select
                            value={approvalFilter}
                            onChange={(e) => setApprovalFilter(e.target.value as any)}
                            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="all">All Records</option>
                            <option value="pending">Pending Approval</option>
                            <option value="approved">Approved</option>
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { label: "Total Records", value: records.length, icon: <Clock className="w-4 h-4" />, color: "text-primary bg-primary/10" },
                        { label: "Approved", value: records.filter(r => r.is_approved === true).length, icon: <CheckCircle2 className="w-4 h-4" />, color: "text-emerald-600 bg-emerald-50" },
                        { label: "Pending", value: records.filter(r => r.is_approved == null || r.is_approved === false).length, icon: <XCircle className="w-4 h-4" />, color: "text-amber-600 bg-amber-50" },
                        { label: "Geofence Alerts", value: records.filter(r => r.is_outside_geofence).length, icon: <AlertTriangle className="w-4 h-4" />, color: "text-rose-600 bg-rose-50" },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${stat.color.split(" ")[1]}`}>
                                <span className={stat.color.split(" ")[0]}>{stat.icon}</span>
                            </div>
                            <div>
                                <p className="text-xl font-black text-slate-800">{stat.value}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#f0f7ff] border-b border-blue-100 text-[10px] font-bold uppercase tracking-widest text-[#2d5f9e]">
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Check In</th>
                                    <th className="px-6 py-4">Check Out</th>
                                    <th className="px-6 py-4">Hours</th>
                                    <th className="px-6 py-4">Flags</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                                                Loading attendance...
                                            </div>
                                        </td>
                                    </tr>
                                ) : paged.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-6 py-12 text-center text-slate-400 italic text-sm">
                                            No attendance records found for selected filters.
                                        </td>
                                    </tr>
                                ) : (
                                    paged.map((rec) => (
                                        <tr key={rec.id} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-700 text-xs">{rec.full_name || `User #${rec.user_id}`}</p>
                                                <p className="text-[10px] text-slate-400">ID: {rec.user_id}</p>
                                            </td>
                                            <td className="px-6 py-4 text-xs font-semibold text-slate-600">{rec.attendance_date}</td>
                                            <td className="px-6 py-4 text-xs text-slate-600">{rec.check_in_time ? new Date(rec.check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                                            <td className="px-6 py-4 text-xs text-slate-600">{rec.check_out_time ? new Date(rec.check_out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                                            <td className="px-6 py-4 text-xs font-bold text-slate-700">
                                                {rec.work_hours != null ? `${Number(rec.work_hours).toFixed(1)}h` : "—"}
                                                {rec.overtime_hours ? <span className="ml-1 text-amber-500">(+{Number(rec.overtime_hours).toFixed(1)}h OT)</span> : null}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-0.5">
                                                    {rec.is_late && <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">LATE {rec.late_minutes}m</span>}
                                                    {rec.is_early_departure && <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">EARLY -{rec.early_minutes}m</span>}
                                                    {rec.is_outside_geofence && <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" /> OUT OF ZONE</span>}
                                                    {!rec.is_late && !rec.is_early_departure && !rec.is_outside_geofence && <span className="text-[9px] text-slate-300">—</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[10px] text-slate-500">{rec.work_location_type || "—"}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${rec.is_approved === true ? "bg-emerald-100 text-emerald-600" : rec.is_approved === false ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
                                                    {rec.is_approved === true ? "Approved" : rec.is_approved === false ? "Rejected" : "Pending"}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {rec.is_approved !== true && (
                                                        <button onClick={() => handleApprove(rec.id, true)} title="Approve" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all">
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {rec.is_approved !== false && (
                                                        <button onClick={() => handleApprove(rec.id, false)} title="Reject" className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {rec.work_report_pdf && (
                                                        <a href={rec.work_report_pdf} target="_blank" rel="noopener noreferrer" title="View Work Report" className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                                                            <FileText className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                        </p>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700">{currentPage + 1}</div>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1} className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default AdminAttendancePage;
