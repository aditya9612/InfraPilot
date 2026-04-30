import React, { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { labourService } from "../../../services/labourService";
import type { LabourItem, UpdateLabourRequest } from "../../../types/labour";

// ─── Types ───────────────────────────────────────────────────────────────────

// Using LabourItem from types/labour.ts (same pattern as DSR)

const initialFormData = {
    labour_name: "",
    aadhaar_number: "",
    contractor_id: 1,
    skill_type: "",
    daily_wage_rate: "",
    status: "Active",
    notes: "",
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const LaborDetailsPage = () => {
    // ─── State Management ──────────────────────────────────────────────────
    const [laborers, setLaborers] = useState<LabourItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedLaborer, setSelectedLaborer] = useState<LabourItem | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [projectId, setProjectId] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [labourToDelete, setLabourToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ─── Resolve Project ID ──────────────────────────────────────────────────
    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        const user = userStr ? JSON.parse(userStr) : {};
        const pId = user?.project_id || user?.user?.project_id || user?.user?.project?.id || user?.user?.assigned_project?.id;
        if (pId) {
            setProjectId(Number(pId));
        } else {
            // Fallback discovery if needed
            const discoverProject = async () => {
                try {
                    const api = (await import("../../../services/api")).default;
                    const { data } = await api.get("/projects");
                    const items = Array.isArray(data) ? data : (data.items || []);
                    if (items.length > 0) {
                        setProjectId(Number(items[0].project_id || items[0].id));
                    }
                } catch (e) {
                    console.error("Project discovery failed", e);
                }
            };
            discoverProject();
        }
    }, []);

    // ─── Data Fetching ────────────────────────────────────────────────────────
    const fetchLaborers = useCallback(async () => {
        try {
            setIsLoading(true);

            // Use the resolved projectId if available, otherwise default to 1 as per user's latest spec
            const activeProjectId = projectId || 1;

            const params: any = { 
                limit: 20, 
                offset: 0,
                project_id: activeProjectId
            };
            if (searchTerm) params.search = searchTerm;
            if (statusFilter !== "All") params.status = statusFilter;

            console.log("GET /api/v1/labour Request Body (Params):", params);

            const response = await labourService.getLabours(activeProjectId, params);
            console.log("GET /api/v1/labour Response Body:", response);

            const items = response.items || (Array.isArray(response) ? response : []);
            setLaborers(items);
        } catch (error: any) {
            console.error("GET /api/v1/labour Error Status:", error.response?.status);
            console.error("GET /api/v1/labour Error Body:", error.response?.data);
            const detail = error.response?.data?.detail || "Failed to fetch labour list";
            toast.error(`Error: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
        } finally {
            setIsLoading(false);
        }
    }, [projectId, searchTerm, statusFilter]);

    useEffect(() => {
        fetchLaborers();
    }, [fetchLaborers]);

    const handleViewDetail = async (labourId: number) => {
        if (!labourId) {
            toast.error("Invalid ID for detail lookup");
            return;
        }
        console.log("Fetching Detail for Worker ID:", labourId);
        const loadingToast = toast.loading(`Retrieving profile #${labourId}...`);
        try {
            console.log("GET /api/v1/labour/" + labourId + " Request (Fetch Detail)");
            const data = await labourService.getLabourById(labourId);
            console.log("GET /api/v1/labour/" + labourId + " Response Body:", data);
            setSelectedLaborer(data);
            setIsDetailModalOpen(true);
            toast.dismiss(loadingToast);
        } catch (err: any) {
            console.error("Labor Detail API Failure:", err);
            const detail = err.response?.data?.detail || "Worker profile not found on server";
            toast.error(`API Error: ${detail}`, { id: loadingToast });
        }
    };

    // Stats
    const totalActive = laborers.filter(l => l.status === "Active").length;
    const avgWage = laborers.length > 0
        ? (laborers.reduce((s, l) => s + Number(l.daily_wage_rate), 0) / laborers.length).toFixed(0)
        : 0;

    // ── CRUD Handlers ────────────────────────────────────────────────────────
    const formatAadhar = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 12);
        const match = digits.match(/.{1,4}/g);
        return match ? match.join("-") : digits;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === "aadhaar_number") {
            finalValue = formatAadhar(value);
        }

        setFormData(prev => ({ ...prev, [name]: finalValue }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const validateForm = () => {
        const errs: Record<string, string> = {};
        if (!formData.labour_name.trim()) errs.labour_name = "Required";
        if (!formData.aadhaar_number.trim()) errs.aadhaar_number = "Required";
        if (!formData.skill_type) errs.skill_type = "Required";
        if (!formData.daily_wage_rate) errs.daily_wage_rate = "Required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleOpenCreate = () => {
        setFormMode("create");
        setFormData(initialFormData);
        setErrors({});
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (labor: LabourItem) => {
        setFormMode("edit");
        setEditId(labor.id);
        setFormData({
            labour_name: labor.labour_name,
            aadhaar_number: labor.aadhaar_number,
            contractor_id: labor.contractor_id,
            skill_type: labor.skill_type,
            daily_wage_rate: labor.daily_wage_rate.toString(),
            status: labor.status,
            notes: labor.notes || "",
        });
        setErrors({});
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (id: number) => {
        setLabourToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!labourToDelete) return;
        try {
            setIsDeleting(true);
            console.log("DELETE /api/v1/labour/" + labourToDelete + " Request");
            const result = await labourService.deleteLabour(labourToDelete);
            console.log("DELETE /api/v1/labour/" + labourToDelete + " Response Body:", result);
            toast.success("Worker record removed successfully!");
            setIsDeleteModalOpen(false);
            setLabourToDelete(null);
            fetchLaborers();
        } catch (error: any) {
            console.error("Delete Failure:", error.response?.data);
            toast.error("Failed to delete worker record");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields");
            return;
        }

        try {
            if (formMode === "edit") {
                const updatePayload: UpdateLabourRequest = {
                    labour_name: formData.labour_name,
                    skill_type: formData.skill_type,
                    daily_wage_rate: Number(formData.daily_wage_rate),
                    contractor_id: Number(formData.contractor_id),
                    status: formData.status,
                    notes: formData.notes,
                };
                console.log("PUT /api/v1/labour/" + editId + " Request Body:", updatePayload);
                const result = await labourService.updateLabour(editId!, updatePayload);
                console.log("PUT /api/v1/labour/" + editId + " Response Body:", result);
                toast.success("Worker profile updated!");
            } else {
                const createPayload = {
                    aadhaar_number: formData.aadhaar_number.replace(/\D/g, ""),
                    labour_name: formData.labour_name,
                    skill_type: formData.skill_type,
                    daily_wage_rate: Number(formData.daily_wage_rate),
                    contractor_id: Number(formData.contractor_id),
                    status: formData.status,
                    notes: formData.notes,
                    project_id: projectId,
                };
                console.log("POST /api/v1/labour Request Body:", JSON.stringify(createPayload, null, 2));
                const result = await labourService.createLabour(createPayload as any);
                console.log("POST /api/v1/labour Response Body:", result);
                
                // Now Assign to Project as requested: POST /api/v1/labour/assign-project
                const assignPayload = {
                    labour_id: result.id,
                    project_id: projectId
                };
                console.log("POST /api/v1/labour/assign-project Request Body:", assignPayload);
                const assignResult = await labourService.assignLabourToProject(result.id, projectId!);
                console.log("POST /api/v1/labour/assign-project Response Body:", assignResult);

                toast.success("New worker registered and assigned!");
            }
            setIsFormModalOpen(false);
            fetchLaborers();
        } catch (error: any) {
            console.error("API Error Full:", error.response?.data);
            console.error("API Error Status:", error.response?.status);
            const detail = error.response?.data?.detail || error.response?.data?.message || "Failed to save labor data";
            toast.error(`Error: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`);
        }
    };

    const filteredLaborers = useMemo(() => {
        return laborers.filter((l) => {
            const searchLower = (searchTerm || "").toLowerCase();
            const nameMatch = (l.labour_name || "").toLowerCase().includes(searchLower);
            const aadhaarMatch = (l.aadhaar_number || "").toLowerCase().includes(searchLower);
            const matchesSearch = nameMatch || aadhaarMatch;
            const matchesStatus = statusFilter === "All" || l.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [laborers, searchTerm, statusFilter]);

    return (
        <>
            <Navbar
                title="Labor Details"
                breadcrumb={["InfraPilot", "Engineer", "Labor", "Details"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Workforce Directory
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Labor Registry
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Comprehensive database of all site workers, skills, and performance history.
                        </p>
                    </div>

                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                    >
                        <span className="text-lg leading-none">+</span>
                        Add New Labor
                    </button>
                </div>

                {/* ── Workforce Snapshots (Activity Style) ────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        Workforce Snapshots
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Workers</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{laborers.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Personnel Database</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Active Records</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">{totalActive}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">{((totalActive / laborers.length) * 100 || 0).toFixed(0)}% Retention Rate</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Avg Wage Rate</p>
                            <p className="text-2xl font-bold text-amber-500 font-inter">₹{avgWage}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Daily Base Earnings</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter">

                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <span className="text-base font-bold text-slate-800 whitespace-nowrap">Workforce Filters</span>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0" />

                    {/* Search */}
                    <div className="flex flex-col gap-0.5 min-w-[200px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Search</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex flex-col gap-0.5 min-w-[130px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer pr-8"
                            >
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Labor Registry Grid ───────────────────────────────────── */}
                <div className="mb-20 min-h-[400px] relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 backdrop-blur-[2px] z-10 rounded-2xl">
                            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synchronizing Registry...</p>
                        </div>
                    ) : null}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 font-inter">
                        {filteredLaborers.map((labor) => (
                            <div
                                key={labor.id}
                                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col"
                            >
                                {/* Header: ID & Status */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">#{labor.worker_code || labor.id}</span>
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${labor.status === "Active"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-rose-50 text-rose-600"
                                        }`}>
                                        {labor.status}
                                    </span>
                                </div>

                                {/* Metadata */}
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter mb-2">
                                    {labor.skill_type} · LID {labor.id}
                                </p>

                                {/* Worker Name */}
                                <p className="text-2xl font-bold text-slate-900 font-inter leading-tight mb-1">{labor.labour_name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed mb-4">{labor.aadhaar_number}</p>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-auto">
                                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-50">
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Wage Rate</p>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold text-slate-800 font-inter">₹{labor.daily_wage_rate}</span>
                                        </div>
                                        <p className="text-[9px] text-slate-400 mt-1 font-medium italic-none uppercase tracking-tighter">Per day</p>
                                    </div>
                                    <div className="bg-primary/5 rounded-xl p-3 border border-primary/5">
                                        <p className="text-xs font-semibold text-primary/70 uppercase tracking-wider mb-1">Contractor</p>
                                        <p className="text-[11px] font-bold text-primary font-inter leading-tight line-clamp-1">ID: {labor.contractor_id}</p>
                                        <p className="text-[9px] text-primary/50 mt-1 font-medium capitalize">Assigned Partner</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => handleViewDetail(labor.id)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="View Detail"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleOpenEdit(labor)}
                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Edit Profile"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteClick(labor.id)}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Remove Worker"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredLaborers.length === 0 && (
                        <div className="bg-white rounded-xl p-20 text-center border border-slate-100 shadow-sm font-inter">
                            <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs font-inter">No personnel records match filters</p>
                        </div>
                    )}
                </div>
            </PageTransition>

            <Modal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                title="Personnel Insight"
                maxWidth="max-w-xl"
            >
                {selectedLaborer && (
                    <div className="bg-white p-6 italic-none text-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-100 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Workforce Profile</p>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-3xl font-black tracking-tight">{selectedLaborer.labour_name}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                        <svg className="w-6 h-6 opacity-40 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Worker Code</p>
                                        <p className="text-xl font-black">{selectedLaborer.worker_code}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Daily Wage</p>
                                        <p className="text-xl font-black">₹{selectedLaborer.daily_wage_rate}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Identity Context ───────────────────────────────── */}
                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.1em]">Identity Context</h4>
                            </div>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-12 px-2">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Aadhaar Number</p>
                                    <p className="text-sm font-black text-slate-800 tabular-nums">{selectedLaborer.aadhaar_number}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Skill Classification</p>
                                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{selectedLaborer.skill_type}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Contractor ID</p>
                                    <p className="text-sm font-black text-slate-800">{selectedLaborer.contractor_id}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Current Status</p>
                                    <span className={`inline-block px-3 py-1 rounded-lg text-[9px] font-black tracking-widest uppercase ${selectedLaborer.status === "Active" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                                        {selectedLaborer.status}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="mb-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-1 h-5 bg-indigo-500 rounded-full" />
                                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.1em]">Personnel Notes</h4>
                            </div>
                            <div className="grid grid-cols-1 px-2">
                                <div>
                                    <p className="text-sm font-medium text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        {selectedLaborer.notes || "No additional remarks logged for this personnel."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest"
                            >
                                Close Insight
                            </button>
                            <button
                                onClick={() => {
                                    setIsDetailModalOpen(false);
                                    handleOpenEdit(selectedLaborer);
                                }}
                                className="flex-[1.5] px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 justify-center active:scale-95"
                            >
                                Update Profile
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Labor Form Modal (DSR Style Sectioning) */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={formMode === "create" ? "Register New Personnel" : "Refine Worker Profile"}
                maxWidth="max-w-4xl"
            >
                <div className="p-8 italic-none text-inter bg-white">
                    <form id="labor-form" onSubmit={handleSubmit} className="space-y-10">

                        {/* Section: Professional Identity */}
                        <div className="p-6 rounded-3xl border border-slate-100 bg-slate-50/30">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Identity & Designation</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Labour Name <span className="text-rose-500">*</span></label>
                                    <input
                                        name="labour_name"
                                        value={formData.labour_name}
                                        onChange={handleChange}
                                        placeholder="Enter legal name"
                                        className={`w-full px-5 py-3.5 bg-white border rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all ${errors.labour_name ? "border-rose-200 bg-rose-50/30" : "border-slate-200/60 focus:border-primary"}`}
                                    />
                                    {errors.labour_name && <p className="text-[9px] font-bold text-rose-500 px-1">{errors.labour_name}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Aadhaar Number <span className="text-rose-500">*</span></label>
                                    <input
                                        name="aadhaar_number"
                                        value={formData.aadhaar_number}
                                        onChange={handleChange}
                                        placeholder="xxxx-xxxx-xxxx"
                                        className={`w-full px-5 py-3.5 bg-white border rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all ${errors.aadhaar_number ? "border-rose-200 bg-rose-50/30" : "border-slate-200/60 focus:border-primary"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Skill Type <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <select
                                            name="skill_type"
                                            value={formData.skill_type}
                                            onChange={handleChange}
                                            className="w-full appearance-none px-5 py-3.5 bg-white border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all cursor-pointer pr-12"
                                        >
                                            <option value="">Select Category</option>
                                            <option value="Skilled">Skilled</option>
                                            <option value="Unskilled">Unskilled</option>
                                        </select>
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Contractor ID <span className="text-rose-500">*</span></label>
                                    <input
                                        name="contractor_id"
                                        type="number"
                                        value={formData.contractor_id}
                                        onChange={handleChange}
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section: Financials & Status */}
                        <div className="p-6 rounded-3xl border border-slate-100 bg-slate-50/30">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Commercials & Status</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Daily Wage Rate (₹) <span className="text-rose-500">*</span></label>
                                    <input
                                        name="daily_wage_rate"
                                        type="number"
                                        value={formData.daily_wage_rate}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Worker Registry Status</label>
                                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/60">
                                        {["Active", "Inactive"].map(s => (
                                            <button
                                                key={s}
                                                type="button"
                                                onClick={() => setFormData(p => ({ ...p, status: s as any }))}
                                                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${formData.status === s ? "bg-primary text-white shadow-lg shadow-primary/20" : "text-slate-400 hover:text-slate-600"}`}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Performance Profile</label>
                                    <textarea
                                        name="notes"
                                        rows={3}
                                        value={formData.notes}
                                        onChange={handleChange as any}
                                        placeholder="Log experience details, specialized skills or behavior remarks..."
                                        className="w-full px-5 py-4 bg-white border border-slate-200/60 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => setIsFormModalOpen(false)}
                        className="text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-all"
                    >
                        Discard Changes
                    </button>
                    <button
                        type="submit"
                        form="labor-form"
                        className="px-10 py-3.5 bg-primary text-white text-sm font-bold rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-3 active:scale-95"
                    >
                        <span>{formMode === "create" ? "Confirm Registration" : "Save Refinements"}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    </button>
                </div>
            </Modal>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setLabourToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Deactivate Worker Identity"
                message="Are you sure you want to remove this labor record? This will permanently archive the identity and associated history from the registry."
                confirmText="Delete"
                type="danger"
                isLoading={isDeleting}
            />
        </>
    );
};

export default LaborDetailsPage;
