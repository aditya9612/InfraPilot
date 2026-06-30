import { useState, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import Pagination from "../../../components/common/Pagination";
import ProjectSelector from "../../../components/common/ProjectSelector";
import toast from "react-hot-toast";
import {
    Search, Trash2, RotateCcw, FileDown, Activity, CreditCard, AlertCircle,
    LogIn, LogOut, Camera, MapPin, Eye, Filter, Calendar, Plus, Edit2
} from "lucide-react";
import { labourService } from "../../../services/labourService";
import { masterService } from "../../../services/masterService";
import { useProject } from "../../../context/ProjectContext";
import { useAuth } from "../../../context/AuthContext";
import type { LabourItem } from "../../../types/labour";
import CheckInModal from "../../../components/attendance/CheckInModal";
import CheckOutModal from "../../../components/attendance/CheckOutModal";

type TabType = "Registry" | "Attendance" | "Performance" | "Payroll" | "Alerts";

const formatAadhaar = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join("-") : digits;
};

const initialFormData = {
    aadhaar_number: "", labour_name: "", mobile_number: "", email: "",
    pan_number: "", address: "", labour_type_id: 1, custom_daily_wage_rate: "",
    custom_ot_rate_per_hour: "", contractor_id: "" as string | number,
    status: "Active", notes: "", profile_image: "",
};

export const calculateTotalHours = (inTime?: string | null, outTime?: string | null) => {
    if (!inTime || inTime === "--:--" || !outTime || outTime === "--:--") return null;
    try {
        const parse = (t: string) => {
            if (t.includes("T")) { const d = new Date(t); return d.getHours() + d.getMinutes() / 60; }
            const parts = t.split(" "); const time = parts[0]; const mod = parts[1] || "";
            let [h, m] = time.split(":").map(Number);
            if (mod === "PM" && h < 12) h += 12;
            if (mod === "AM" && h === 12) h = 0;
            return h + (m || 0) / 60;
        };
        let diff = parse(outTime) - parse(inTime);
        if (diff < 0) diff += 24;
        return diff.toFixed(1).replace(/\.0$/, "");
    } catch { return null; }
};

const LabourRegistryPage = () => {
    const { selectedProjectId, isLoading: isProjectLoading, selectedProject } = useProject();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>("Registry");
    const [laborers, setLaborers] = useState<LabourItem[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 10;

    // Attendance filters
    const [empDurationFilter, setEmpDurationFilter] = useState("Today");
    const [empStatusFilter, setEmpStatusFilter] = useState("All Status");
    const [dashboardStats, setDashboardStats] = useState({ total_labour: 0, present: 0 });

    // Attendance check-in/out modals
    const [isCheckInOpen, setIsCheckInOpen] = useState(false);
    const [isCheckOutOpen, setIsCheckOutOpen] = useState(false);
    const [selectedLabour, setSelectedLabour] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // Location modal
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
    const [selectedLocationLabour, setSelectedLocationLabour] = useState<any>(null);

    // Image preview
    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    const projectId = selectedProjectId || (user as any)?.project_id;

    // Delete
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Create/Edit form
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [labourTypes, setLabourTypes] = useState<any[]>([]);

    useEffect(() => {
        if (isFormModalOpen) {
            masterService.getEntities("labour-types").then(setLabourTypes).catch(() => {});
        }
    }, [isFormModalOpen]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.labour_name.trim()) newErrors.labour_name = "Labour name is required";
        else if (!/^[a-zA-Z\s]+$/.test(formData.labour_name)) newErrors.labour_name = "Name must contain only alphabets";
        if (!formData.mobile_number.trim()) newErrors.mobile_number = "Mobile number is required";
        else if (!/^[6-9]\d{9}$/.test(formData.mobile_number)) newErrors.mobile_number = "Enter a valid 10-digit Indian mobile number";
        if (!formData.labour_type_id) newErrors.labour_type_id = "Labour type is required";
        const aadhaarDigits = formData.aadhaar_number.replace(/-/g, "");
        if (formData.aadhaar_number.trim()) {
            if (aadhaarDigits.length !== 12) newErrors.aadhaar_number = "Aadhaar must be exactly 12 digits";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ─── Fetch Registry ───────────────────────────────────────────────────────
    const fetchLaborers = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const response = await labourService.getLabours(projectId, { limit: 100, status: statusFilter === "All" ? undefined : statusFilter });
            const items = response.items || [];
            const localKey = `created_labourers_${projectId}`;
            const localSaved = localStorage.getItem(localKey);
            const localItems = localSaved ? JSON.parse(localSaved) : [];
            const deletedKey = `deleted_labourers_ids_${projectId}`;
            const deletedSaved = localStorage.getItem(deletedKey);
            const deletedIds = new Set(deletedSaved ? JSON.parse(deletedSaved) : []);
            const existingIds = new Set(items.map((l: any) => l.id));
            const merged = [...items];
            localItems.forEach((l: any) => { if (!existingIds.has(l.id)) merged.unshift(l); });
            setLaborers(merged.filter((l: any) => !deletedIds.has(l.id)));
        } catch { toast.error("Failed to sync registry"); }
        finally { setIsLoading(false); }
    }, [projectId, statusFilter]);

    // ─── Fetch Attendance (exact Site Engineer approach) ──────────────────────
    const fetchAttendance = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const today = new Date().toISOString().split("T")[0];
            let fromDate = today, toDate = today;
            if (empDurationFilter === "Current Month") {
                const d = new Date();
                fromDate = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
                toDate = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
            } else if (empDurationFilter === "Last Month") {
                const d = new Date();
                fromDate = new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().split("T")[0];
                toDate = new Date(d.getFullYear(), d.getMonth(), 0).toISOString().split("T")[0];
            }
            try {
                const stats = await labourService.getAttendanceDashboard(projectId, fromDate, toDate);
                if (stats) setDashboardStats({ total_labour: stats.total_labour || 0, present: stats.present || 0 });
            } catch {}
            let allLabourers: any[] = [];
            try {
                const labRes = await labourService.getLabours(projectId, { limit: 100 });
                allLabourers = labRes.items || [];
                const localKey = `created_labourers_${projectId}`;
                const localSaved = localStorage.getItem(localKey);
                if (localSaved) {
                    const localItems = JSON.parse(localSaved);
                    const existingIds = new Set(allLabourers.map((l: any) => l.id));
                    localItems.forEach((l: any) => { if (!existingIds.has(l.id)) allLabourers.unshift(l); });
                }
                const deletedKey = `deleted_labourers_ids_${projectId}`;
                const deletedSaved = localStorage.getItem(deletedKey);
                const deletedIds = new Set(deletedSaved ? JSON.parse(deletedSaved) : []);
                allLabourers = allLabourers.filter((l: any) => !deletedIds.has(l.id));
            } catch {}
            const data = await labourService.getAttendanceList(projectId, fromDate, toDate);
            const attendances = data.items || [];
            const enriched = allLabourers.map((lab: any) => {
                const att = attendances.find((a: any) => Number(a.labour_id) === Number(lab.id));
                if (att) return { ...lab, ...att, labour_name: lab.labour_name || att.labour_name, contractor_name: lab.contractor_name || att.contractor_name };
                return { ...lab, labour_id: lab.id, attendance_date: fromDate, status: "absent", in_time: null, out_time: null };
            });
            attendances.forEach((att: any) => {
                if (!enriched.find((e: any) => Number(e.labour_id) === Number(att.labour_id))) enriched.push(att);
            });
            setAttendanceRecords(enriched);
        } catch { toast.error("Failed to sync attendance"); }
        finally { setIsLoading(false); }
    }, [projectId, empDurationFilter]);

    useEffect(() => { if (!isProjectLoading && projectId) { if (activeTab === "Registry") fetchLaborers(); else if (activeTab === "Attendance") fetchAttendance(); } }, [activeTab, fetchLaborers, fetchAttendance, isProjectLoading, projectId]);
    useEffect(() => { setCurrentPage(0); }, [activeTab, searchTerm]);
    useEffect(() => { if (activeTab === "Attendance") fetchAttendance(); }, [empDurationFilter]);

    // ─── Handlers ─────────────────────────────────────────────────────────────
    const handleDeleteClick = (id: number) => { setDeletingId(id); setIsDeleteModalOpen(true); };
    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        setIsDeleting(true);
        try {
            await labourService.deleteLabour(deletingId);
            toast.success("Worker deleted.");
            setLaborers(prev => prev.filter(l => l.id !== deletingId));
            const deletedKey = `deleted_labourers_ids_${projectId}`;
            const prev = localStorage.getItem(deletedKey);
            const arr = prev ? JSON.parse(prev) : [];
            if (!arr.includes(deletingId)) { arr.push(deletingId); localStorage.setItem(deletedKey, JSON.stringify(arr)); }
            setIsDeleteModalOpen(false); setDeletingId(null);
            fetchLaborers();
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || "Failed to delete worker.");
        } finally { setIsDeleting(false); }
    };

    const handleEditClick = (labor: any) => {
        setFormMode("edit"); setEditId(labor.id);
        setFormData({ aadhaar_number: labor.aadhaar_number || "", labour_name: labor.labour_name || "", mobile_number: labor.mobile_number || "", email: labor.email || "", pan_number: labor.pan_number || "", address: labor.address || "", labour_type_id: labor.labour_type_id || 1, custom_daily_wage_rate: labor.custom_daily_wage_rate || "", custom_ot_rate_per_hour: labor.custom_ot_rate_per_hour || "", contractor_id: labor.contractor_id || "", status: labor.status || "Active", notes: labor.notes || "", profile_image: "" });
        setErrors({}); setIsFormModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) { toast.error("Please correct the errors"); return; }
        setIsSubmitting(true);
        try {
            if (formMode === "edit" && editId) {
                const payload = { aadhaar_number: formData.aadhaar_number ? formData.aadhaar_number.replace(/-/g, "") : null, labour_name: formData.labour_name, mobile_number: formData.mobile_number || undefined, email: formData.email || null, pan_number: formData.pan_number || null, address: formData.address || null, labour_type_id: Number(formData.labour_type_id), custom_daily_wage_rate: formData.custom_daily_wage_rate ? Number(formData.custom_daily_wage_rate) : undefined, custom_ot_rate_per_hour: formData.custom_ot_rate_per_hour ? Number(formData.custom_ot_rate_per_hour) : undefined, contractor_id: formData.contractor_id ? Number(formData.contractor_id) : undefined, status: formData.status, notes: formData.notes };
                const updated = await labourService.updateLabour(editId, payload as any);
                setLaborers(prev => prev.map(l => l.id === editId ? { ...l, ...updated } : l));
                toast.success("Worker updated successfully!");
            } else {
                const activePId = projectId;
                const payload = { project_id: activePId, aadhaar_number: formData.aadhaar_number ? formData.aadhaar_number.replace(/-/g, "") : null, labour_name: formData.labour_name, mobile_number: formData.mobile_number, email: formData.email || null, pan_number: formData.pan_number || null, address: formData.address || null, labour_type_id: Number(formData.labour_type_id), custom_daily_wage_rate: formData.custom_daily_wage_rate ? Number(formData.custom_daily_wage_rate) : null, custom_ot_rate_per_hour: formData.custom_ot_rate_per_hour ? Number(formData.custom_ot_rate_per_hour) : null, contractor_id: formData.contractor_id ? Number(formData.contractor_id) : null, status: formData.status || "Active", notes: formData.notes || null, profile_image: formData.profile_image || null };
                const newLaborer = await labourService.createLabour(payload);
                try { await labourService.assignLabourToProject(newLaborer.id, activePId); } catch (e: any) { await labourService.deleteLabour(newLaborer.id); throw new Error("Failed to assign project. Worker rolled back."); }
                setLaborers(prev => [newLaborer, ...prev]);
                const localKey = `created_labourers_${activePId}`;
                const localSaved = localStorage.getItem(localKey);
                const localItems = localSaved ? JSON.parse(localSaved) : [];
                localItems.unshift(newLaborer);
                localStorage.setItem(localKey, JSON.stringify(localItems));
                toast.success("Personnel registered successfully!");
            }
            setIsFormModalOpen(false); setFormData(initialFormData); setErrors({});
            setTimeout(() => fetchLaborers(), 1000);
        } catch (err: any) {
            toast.error(err?.response?.data?.detail || err.message || "Submission failed");
        } finally { setIsSubmitting(false); }
    };

    const handleExport = async (type: "pdf" | "excel") => {
        try {
            toast.loading(`Preparing ${type.toUpperCase()} report...`);
            const blob = type === "excel" ? await labourService.exportAttendanceExcel(projectId) : await labourService.exportAttendancePDF(projectId);
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a"); link.href = url;
            link.setAttribute("download", `Personnel_${activeTab}_${new Date().toISOString().split("T")[0]}.${type === "excel" ? "xlsx" : "pdf"}`);
            document.body.appendChild(link); link.click(); link.parentNode?.removeChild(link);
            toast.dismiss(); toast.success("Report downloaded!");
        } catch { toast.dismiss(); toast.error("Failed to generate report"); }
    };

    // ─── Derived data ─────────────────────────────────────────────────────────
    const filteredLaborers = laborers.filter(l => (l.labour_name || "").toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredAttendance = attendanceRecords.filter(a => {
        const today = new Date().toISOString().split("T")[0];
        if (empDurationFilter === "Today" && a.attendance_date && a.attendance_date !== today) return false;
        if (empStatusFilter !== "All Status") {
            const status = a.status || (a.in_time ? "present" : "absent");
            if (empStatusFilter === "Present" && status !== "present") return false;
            if (empStatusFilter === "Absent" && status !== "absent") return false;
        }
        if (searchTerm) return (a.labour_name || "").toLowerCase().includes(searchTerm.toLowerCase());
        return true;
    });
    const currentListData = activeTab === "Registry" ? filteredLaborers : activeTab === "Attendance" ? filteredAttendance : [];
    const pagedData = currentListData.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    const getProjectName = () => selectedProject?.project_name || `Project #${projectId}`;
    const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all";
    const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

    // ─── Render helpers ───────────────────────────────────────────────────────
    const renderRegistry = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Worker</th><th className="px-6 py-4">Skill Type</th>
                    <th className="px-6 py-4">Contractor</th><th className="px-6 py-4 text-right">Daily Wage</th>
                    <th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {isLoading ? <tr><td colSpan={6} className="p-10 text-center text-slate-400">Loading registry...</td></tr>
                : pagedData.length > 0 ? pagedData.map((labor: any) => (
                    <tr key={labor.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">{(labor.labour_name || "U").charAt(0)}</div>
                                <div className="flex flex-col"><span className="text-sm font-bold text-slate-800">{labor.labour_name}</span><span className="text-[10px] font-mono text-slate-400">{labor.worker_code}</span></div>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{labor.labour_type_name || labor.skill_type || "—"}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{labor.contractor_name || "—"}</td>
                        <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">₹{labor.effective_daily_wage || labor.daily_wage_rate || "—"}</td>
                        <td className="px-6 py-4"><span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${labor.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>{labor.status}</span></td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => handleEditClick(labor)} className="p-2 text-slate-400 hover:text-primary rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteClick(labor.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </td>
                    </tr>
                )) : <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">No workforce records found</td></tr>}
            </tbody>
        </table>
    );

    const renderAttendance = () => (
        <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 p-4 border-b border-slate-50">
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-5-4M9 20H4v-2a4 4 0 015-4m0 0a4 4 0 100-8 4 4 0 000 8zm8 0a4 4 0 100-8 4 4 0 000 8z" /></svg>
                    </div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Labour</p><h3 className="text-xl font-black text-slate-800">{dashboardStats.total_labour}</h3></div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Present Today</p><h3 className="text-xl font-black text-slate-800">{dashboardStats.present}</h3></div>
                </div>
            </div>
            {/* Attendance table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Date</th><th className="px-6 py-4">Labour Name</th>
                            <th className="px-6 py-4">Contractor</th><th className="px-6 py-4">Department</th>
                            <th className="px-6 py-4 text-center">Check In</th><th className="px-6 py-4 text-center">Check Out</th>
                            <th className="px-6 py-4 text-center">Hours</th><th className="px-6 py-4">Location</th>
                            <th className="px-6 py-4">Status</th><th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? <tr><td colSpan={10} className="p-10 text-center text-slate-400">Syncing attendance...</td></tr>
                        : filteredAttendance.length === 0 ? <tr><td colSpan={10} className="p-10 text-center text-slate-400">No attendance records found</td></tr>
                        : filteredAttendance.map((lab, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">{lab.attendance_date || "N/A"}</span></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{(lab.labour_name || "U").charAt(0).toUpperCase()}</div>
                                        <span className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{lab.labour_name || "Unknown"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4"><span className="text-xs font-bold text-slate-800">{lab.contractor_name || "—"}</span></td>
                                <td className="px-6 py-4"><span className="px-3 py-1 border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">{lab.department || lab.skill_type || "—"}</span></td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        {lab.in_time && lab.check_in_image ? (
                                            <div className="w-8 h-8 rounded-full border-2 border-emerald-400 overflow-hidden cursor-pointer" onClick={() => setPreviewImage({ url: lab.check_in_image, title: "Check-In – " + lab.labour_name })}><img src={lab.check_in_image} alt="" className="w-full h-full object-cover" /></div>
                                        ) : <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Camera className="w-3 h-3" /></div>}
                                        <span className={`text-[10px] font-bold flex items-center gap-1 ${lab.in_time ? "text-emerald-600" : "text-slate-400"}`}><LogIn className="w-3 h-3" />{lab.in_time || "—"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center gap-1">
                                        {lab.out_time && lab.check_out_image ? (
                                            <div className="w-8 h-8 rounded-full border-2 border-rose-400 overflow-hidden cursor-pointer" onClick={() => setPreviewImage({ url: lab.check_out_image, title: "Check-Out – " + lab.labour_name })}><img src={lab.check_out_image} alt="" className="w-full h-full object-cover" /></div>
                                        ) : <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400"><Camera className="w-3 h-3" /></div>}
                                        <span className={`text-[10px] font-bold flex items-center gap-1 ${lab.out_time ? "text-rose-600" : "text-slate-400"}`}><LogOut className="w-3 h-3" />{lab.out_time || "—"}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-slate-800">
                                        {(() => { const c = calculateTotalHours(lab.in_time, lab.out_time); return c ? `${c}/8 hr` : lab.working_hours ? `${lab.working_hours}/8 hr` : "-"; })()}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 cursor-pointer hover:underline" onClick={() => { setSelectedLocationLabour(lab); setIsLocationModalOpen(true); }}>
                                        <MapPin className="w-3 h-3" /> View
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-widest ${lab.status === "absent" ? "bg-rose-50 text-rose-500 border-rose-200" : "bg-emerald-50 text-emerald-500 border-emerald-200"}`}>{lab.status || "present"}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        {(!lab.in_time || lab.in_time === "--:--") ? (
                                            <button onClick={() => { setSelectedLabour(lab); setIsCheckInOpen(true); }} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-100" title="Check In"><LogIn className="w-4 h-4" /></button>
                                        ) : (!lab.out_time || lab.out_time === "--:--") ? (
                                            <button onClick={() => { setSelectedLabour(lab); setIsCheckOutOpen(true); }} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-all border border-rose-100" title="Check Out"><LogOut className="w-4 h-4" /></button>
                                        ) : null}
                                        <button onClick={() => { setSelectedLabour(lab); setIsViewModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" title="View"><Eye className="w-4 h-4" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );

    return (
        <>
            <Navbar title="Personnel Registry" breadcrumb={["Manager", "Resources", "Personnel"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div><h1 className="text-2xl font-bold text-slate-800 tracking-tight">Personnel & Workforce</h1><p className="text-slate-500 text-sm">Deployment oversight, attendance metrics, and payroll compliance auditing.</p></div>
                    <div className="flex items-center gap-3">
                        <ProjectSelector variant="page" />
                        {activeTab === "Registry" && (
                            <button onClick={() => { setFormMode("create"); setFormData(initialFormData); setErrors({}); setIsFormModalOpen(true); }} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95">
                                <Plus className="w-4 h-4" /> Register Personnel
                            </button>
                        )}
                        <div className="flex bg-white border border-slate-200 rounded-xl overflow-hidden h-10 shadow-sm">
                            <button onClick={() => handleExport("pdf")} className="px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 border-r border-slate-100 flex items-center gap-2 transition-all active:scale-95"><FileDown className="w-4 h-4 text-rose-500" /> PDF</button>
                            <button onClick={() => handleExport("excel")} className="px-4 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95"><FileDown className="w-4 h-4 text-emerald-500" /> Excel</button>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 overflow-x-auto max-w-full no-scrollbar">
                    {(["Registry", "Attendance", "Performance", "Payroll", "Alerts"] as TabType[]).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-slate-100 text-slate-800 shadow-inner" : "text-slate-500 hover:bg-slate-50"}`}>{tab}</button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col min-h-0">
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4 flex-wrap">
                        <div className="relative max-w-md w-full">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder={`Search in ${activeTab}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="flex items-center gap-2">
                            {activeTab === "Attendance" && (
                                <>
                                    <div className="relative">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                        <select value={empStatusFilter} onChange={e => setEmpStatusFilter(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none bg-white">
                                            <option value="All Status">All Status</option>
                                            <option value="Present">Present</option>
                                            <option value="Absent">Absent</option>
                                        </select>
                                    </div>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
                                        <select value={empDurationFilter} onChange={e => setEmpDurationFilter(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none bg-white">
                                            <option value="Today">Today</option>
                                            <option value="Current Month">Current Month</option>
                                            <option value="Last Month">Last Month</option>
                                        </select>
                                    </div>
                                </>
                            )}
                            <button onClick={() => activeTab === "Attendance" ? fetchAttendance() : fetchLaborers()} className="p-2 text-slate-400 hover:text-primary transition-all"><RotateCcw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {activeTab === "Registry" && renderRegistry()}
                        {activeTab === "Attendance" && renderAttendance()}
                        {activeTab === "Payroll" && <div className="p-12 text-center text-slate-400"><CreditCard className="w-12 h-12 mx-auto mb-4 opacity-20" /><h3 className="text-lg font-bold text-slate-600">Payroll Oversight</h3></div>}
                        {activeTab === "Alerts" && <div className="p-12 text-center text-slate-400"><AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-20 text-rose-500" /><h3 className="text-lg font-bold text-slate-600">Compliance & Alerts</h3></div>}
                        {activeTab === "Performance" && <div className="p-12 text-center text-slate-400"><Activity className="w-12 h-12 mx-auto mb-4 opacity-20" /><h3 className="text-lg font-bold text-slate-600">Performance Analytics</h3></div>}
                    </div>
                    {activeTab !== "Attendance" && <Pagination currentPage={currentPage} totalItems={currentListData.length} pageSize={PAGE_SIZE} onPageChange={setCurrentPage} label={activeTab === "Registry" ? "Workers" : "Records"} />}
                </div>
            </PageTransition>

            {/* Delete Confirm */}
            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setDeletingId(null); }} onConfirm={handleDeleteConfirm} title="Delete Worker" message="This will permanently remove the worker record." confirmText="Delete" type="danger" isLoading={isDeleting} />

            {/* Create / Edit Form Modal — exact Site Engineer fields */}
            <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={formMode === "edit" ? "Edit Personnel" : "Register Personnel"} maxWidth="max-w-2xl"
                footer={<div className="flex justify-end gap-3"><button onClick={() => setIsFormModalOpen(false)} disabled={isSubmitting} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button><button form="personnel-form" type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all">{isSubmitting ? "Saving..." : formMode === "edit" ? "Save Changes" : "Register"}</button></div>}>
                <form id="personnel-form" onSubmit={handleSubmit}>
                    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <p className={labelCls}>Project</p>
                            <p className="text-sm font-bold text-slate-800">{getProjectName()}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className={labelCls}>Aadhaar Number</label><input value={formData.aadhaar_number} onChange={e => setFormData(p => ({ ...p, aadhaar_number: formatAadhaar(e.target.value) }))} placeholder="2345-6789-0123" className={`${inputCls} ${errors.aadhaar_number ? "border-rose-300" : ""}`} />{errors.aadhaar_number && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.aadhaar_number}</p>}</div>
                            <div><label className={labelCls}>Labour Name <span className="text-rose-500">*</span></label><input value={formData.labour_name} onChange={e => setFormData(p => ({ ...p, labour_name: e.target.value.replace(/[^a-zA-Z\s]/g, "") }))} placeholder="Ramesh Shinde" className={`${inputCls} ${errors.labour_name ? "border-rose-300" : ""}`} />{errors.labour_name && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.labour_name}</p>}</div>
                            <div><label className={labelCls}>Mobile Number <span className="text-rose-500">*</span></label><input type="tel" value={formData.mobile_number} onChange={e => setFormData(p => ({ ...p, mobile_number: e.target.value.replace(/\D/g, "").slice(0, 10) }))} placeholder="9696969696" className={`${inputCls} ${errors.mobile_number ? "border-rose-300" : ""}`} />{errors.mobile_number && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.mobile_number}</p>}</div>
                            <div><label className={labelCls}>Email</label><input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="ramesh@gmail.com" className={inputCls} /></div>
                            <div><label className={labelCls}>PAN Number</label><input value={formData.pan_number} onChange={e => setFormData(p => ({ ...p, pan_number: e.target.value.toUpperCase().slice(0, 10) }))} placeholder="HHLM5621L" className={inputCls} /></div>
                            <div><label className={labelCls}>Address</label><input value={formData.address} onChange={e => setFormData(p => ({ ...p, address: e.target.value }))} placeholder="Pune, Maharashtra" className={inputCls} /></div>
                            <div><label className={labelCls}>Labour Type <span className="text-rose-500">*</span></label>
                                <select value={formData.labour_type_id || ""} onChange={e => setFormData(p => ({ ...p, labour_type_id: Number(e.target.value) }))} className={`${inputCls} ${errors.labour_type_id ? "border-rose-300" : ""}`}>
                                    <option value="" disabled>Select Labour Type</option>
                                    {labourTypes.map((t: any) => <option key={t.id} value={t.id}>{t.name || t.type_name || `Type ${t.id}`}</option>)}
                                </select>
                                {errors.labour_type_id && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.labour_type_id}</p>}
                            </div>
                            <div><label className={labelCls}>Custom Daily Wage (₹)</label><input type="number" value={formData.custom_daily_wage_rate} onChange={e => setFormData(p => ({ ...p, custom_daily_wage_rate: e.target.value }))} placeholder="900" min={0} className={inputCls} /></div>
                            <div><label className={labelCls}>Custom OT Rate / Hour (₹)</label><input type="number" value={formData.custom_ot_rate_per_hour} onChange={e => setFormData(p => ({ ...p, custom_ot_rate_per_hour: e.target.value }))} placeholder="120" min={0} className={inputCls} /></div>
                            <div><label className={labelCls}>Contractor ID</label><input type="number" value={formData.contractor_id} onChange={e => setFormData(p => ({ ...p, contractor_id: e.target.value }))} placeholder="1" className={inputCls} /></div>
                            <div><label className={labelCls}>Status</label>
                                <select value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                                    <option value="Active">Active</option><option value="Inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="md:col-span-2"><label className={labelCls}>Notes</label><textarea value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="notes" className={inputCls + " resize-none"} /></div>
                            <div className="md:col-span-2"><label className={labelCls}>Profile Image</label>
                                <input type="file" accept="image/*" onChange={e => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setFormData(p => ({ ...p, profile_image: r.result as string })); r.readAsDataURL(f); } }} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Check In/Out Modals */}
            {isCheckInOpen && selectedLabour && (
                <CheckInModal isOpen={isCheckInOpen} onClose={() => { setIsCheckInOpen(false); setSelectedLabour(null); }} labour={selectedLabour} onSuccess={() => { setIsCheckInOpen(false); setSelectedLabour(null); fetchAttendance(); }} projectId={projectId} />
            )}
            {isCheckOutOpen && selectedLabour && (
                <CheckOutModal isOpen={isCheckOutOpen} onClose={() => { setIsCheckOutOpen(false); setSelectedLabour(null); }} attendance={selectedLabour} onSuccess={() => { setIsCheckOutOpen(false); setSelectedLabour(null); fetchAttendance(); }} />
            )}

            {/* Attendance Detail Modal */}
            <Modal isOpen={isViewModalOpen} onClose={() => setIsViewModalOpen(false)} title="Attendance Details" maxWidth="max-w-md">
                {selectedLabour && (
                    <div className="p-6 space-y-3">
                        {[["Labour", selectedLabour.labour_name || "—"], ["Date", selectedLabour.attendance_date || "—"], ["Contractor", selectedLabour.contractor_name || "—"], ["Department", selectedLabour.department || selectedLabour.skill_type || "—"], ["Check In", selectedLabour.in_time || "—"], ["Check Out", selectedLabour.out_time || "—"], ["Hours", selectedLabour.working_hours ? `${selectedLabour.working_hours} hrs` : "—"], ["Status", selectedLabour.status || "—"]].map(([label, value]) => (
                            <div key={label} className="flex justify-between items-start border-b border-slate-50 pb-2 last:border-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                                <span className="text-sm font-bold text-slate-800">{value}</span>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* Location Modal */}
            <Modal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} title="Location Details" maxWidth="max-w-sm">
                {selectedLocationLabour && (
                    <div className="p-6 space-y-4">
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Check-in Location</p><div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex gap-2"><MapPin className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /><p className="text-sm font-semibold text-emerald-700">{selectedLocationLabour.check_in_address || "—"}</p></div></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Check-out Location</p><div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex gap-2"><MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" /><p className="text-sm font-semibold text-rose-700">{selectedLocationLabour.check_out_address || "—"}</p></div></div>
                    </div>
                )}
            </Modal>

            {/* Image Preview */}
            <Modal isOpen={!!previewImage} onClose={() => setPreviewImage(null)} title={previewImage?.title || "Image Preview"} maxWidth="max-w-sm">
                {previewImage && <div className="w-full"><img src={previewImage.url} alt={previewImage.title} className="w-full h-auto object-cover rounded-b-2xl" /></div>}
            </Modal>
        </>
    );
};

export default LabourRegistryPage;
