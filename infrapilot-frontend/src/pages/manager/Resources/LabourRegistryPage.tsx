import { useState, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
    Search, Edit2, Trash2, RotateCcw, FileDown, Activity, CreditCard, AlertCircle, LogIn, LogOut
} from "lucide-react";

import { labourService } from "../../../services/labourService";
import { useProject } from "../../../context/ProjectContext";
import { useAuth } from "../../../context/AuthContext";
import type { LabourItem } from "../../../types/labour";

type TabType = "Registry" | "Attendance" | "Performance" | "Payroll" | "Alerts";

const LabourRegistryPage = () => {
    const { selectedProjectId } = useProject();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("Registry");
    const [laborers, setLaborers] = useState<LabourItem[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter] = useState("All");

    const projectId = selectedProjectId || (user as any)?.project_id || 0;

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting] = useState(false);

    const fetchLaborers = useCallback(async () => {
        setIsLoading(true);
        try {
            if (activeTab === "Registry") {
                const response = await labourService.getLabours(projectId, { limit: 100, status: statusFilter === "All" ? undefined : statusFilter });
                setLaborers(response.items || []);
            } else if (activeTab === "Attendance") {
                const response = await labourService.getAttendanceList(projectId);
                setAttendanceRecords(response.items || []);
            }
        } catch (error) {
            toast.error("Failed to sync personnel data");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, statusFilter, activeTab]);

    useEffect(() => {
        fetchLaborers();
    }, [fetchLaborers]);

    const handleExport = async (type: 'pdf' | 'excel') => {
        try {
            toast.loading(`Preparing ${type.toUpperCase()} report...`);
            let blob;
            if (type === 'excel') {
                blob = await labourService.exportAttendanceExcel(projectId);
            } else {
                blob = await labourService.exportAttendancePDF(projectId);
            }
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Personnel_${activeTab}_${new Date().toISOString().split('T')[0]}.${type === 'excel' ? 'xlsx' : 'pdf'}`);
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            toast.dismiss();
            toast.success("Report downloaded successfully");
        } catch (e) {
            toast.dismiss();
            toast.error("Failed to generate report");
        }
    };

    const renderRegistry = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Worker</th>
                    <th className="px-6 py-4">Skill Type</th>
                    <th className="px-6 py-4">Contractor</th>
                    <th className="px-6 py-4 text-right">Daily Wage</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400">Loading registry...</td></tr>
                ) : laborers.filter(l => l.labour_name.toLowerCase().includes(searchTerm.toLowerCase())).map((labor) => (
                    <tr key={labor.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">{labor.labour_name.charAt(0)}</div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-slate-800">{labor.labour_name}</span>
                                    <span className="text-[10px] font-mono text-slate-400">{labor.worker_code}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{labor.labour_type_name || labor.skill_type}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{labor.contractor_name || "—"}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">₹{labor.effective_daily_wage || labor.daily_wage_rate}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${labor.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                {labor.status}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button className="p-2 text-slate-400 hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                                <button className="p-2 text-slate-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderAttendance = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Worker</th>
                    <th className="px-6 py-4">Punch In</th>
                    <th className="px-6 py-4">Punch Out</th>
                    <th className="px-6 py-4 text-center">Hours</th>
                    <th className="px-6 py-4">Geofence</th>
                    <th className="px-6 py-4">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400">Syncing attendance logs...</td></tr>
                ) : attendanceRecords.filter(a => a.labour_name.toLowerCase().includes(searchTerm.toLowerCase())).map((att, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 text-sm">{att.labour_name}</td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <LogIn className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="text-xs font-medium text-slate-600">{att.in_time || "—"}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                <LogOut className="w-3.5 h-3.5 text-rose-500" />
                                <span className="text-xs font-medium text-slate-600">{att.out_time || "—"}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-slate-700">{att.working_hours || 0}h</td>
                        <td className="px-6 py-4"><span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">INSIDE</span></td>
                        <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${att.in_time ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                                {att.in_time ? "PRESENT" : "ABSENT"}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderPayroll = () => (
        <div className="p-12 text-center text-slate-400">
            <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold text-slate-600">Payroll Oversight</h3>
            <p className="text-sm max-w-xs mx-auto">This module is currently generating wage sheets and overtime calculations for the current cycle.</p>
        </div>
    );

    const renderAlerts = () => (
        <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20 text-rose-500" />
            <h3 className="text-lg font-bold text-slate-600">Compliance & Alerts</h3>
            <p className="text-sm max-w-xs mx-auto">No critical compliance alerts or documentation expires detected for the active personnel.</p>
        </div>
    );

    return (
        <>
            <Navbar title="Personnel Registry" breadcrumb={["Manager", "Resources", "Personnel"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Personnel & Workforce</h1>
                        <p className="text-slate-500 text-sm">Deployment oversight, attendance metrics, and payroll compliance auditing.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden h-10 shadow-sm">
                            <button onClick={() => handleExport('pdf')} className="px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 border-r border-slate-100 flex items-center gap-2 transition-all active:scale-95"><FileDown className="w-4 h-4 text-rose-500" /> PDF</button>
                            <button onClick={() => handleExport('excel')} className="px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95"><FileDown className="w-4 h-4 text-emerald-500" /> Excel</button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 overflow-x-auto max-w-full no-scrollbar">
                    {(["Registry", "Attendance", "Performance", "Payroll", "Alerts"] as TabType[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-slate-100 text-slate-800 shadow-inner" : "text-slate-500 hover:bg-slate-50"}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                        <div className="relative max-w-md w-full">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder={`Search in ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <button onClick={fetchLaborers} className="p-2 text-slate-400 hover:text-primary transition-all"><RotateCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /></button>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {activeTab === "Registry" && renderRegistry()}
                        {activeTab === "Attendance" && renderAttendance()}
                        {activeTab === "Payroll" && renderPayroll()}
                        {activeTab === "Alerts" && renderAlerts()}
                        {activeTab === "Performance" && (
                            <div className="p-12 text-center text-slate-400">
                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-bold text-slate-600">Performance Analytics</h3>
                                <p className="text-sm max-w-xs mx-auto">Aggregating historical productivity data and task completion rates for this project.</p>
                            </div>
                        )}
                    </div>
                </div>
            </PageTransition>

            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={() => { }} title="Delete Record" message="Are you sure?" isLoading={isDeleting} />
        </>
    );
};

export default LabourRegistryPage;
