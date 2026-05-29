import { useState, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Eye,
    Filter,
    Briefcase,
    Phone,
    Mail,
    FileText,
    Building2,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

import { labourService } from "../../../services/labourService";
import { projectService } from "../../../services/projectService";
import type { LabourItem } from "../../../types/labour";

const initialFormData = {
    aadhaar_number: "",
    labour_name: "",
    skill_type: "Skilled",
    daily_wage_rate: "",
    contractor_id: 1,
    status: "Active",
    notes: "",
};

const formatAadhaar = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join("-") : digits;
};

const LaborDetailsPage = () => {
    const [laborers, setLaborers] = useState<LabourItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedLaborer, setSelectedLaborer] = useState<LabourItem | null>(null);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editId, setEditId] = useState<number | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [projectId] = useState<number>(() => {
        try {
            const userStr = localStorage.getItem("infrapilot_user");
            if (userStr) {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;
                return pId ? Number(pId) : 92;
            }
            return 92;
        } catch (err) {
            console.error("Failed to load user project context:", err);
            return 92;
        }
    });
    const [contractorFilter, setContractorFilter] = useState<number | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [labourToDelete, setLabourToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Active" | "Skilled">("All");
    const [projects, setProjects] = useState<any[]>([]);
    const [assignProjectId, setAssignProjectId] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    useEffect(() => {
        if (isFormModalOpen) {
            const fetchProjects = async () => {
                try {
                    const res = await projectService.getProjects(100, 0);
                    const projectsList = Array.isArray(res) ? res : (res.items || res.data || []);
                    setProjects(projectsList);
                } catch (err) {
                    console.error("Failed to fetch projects", err);
                }
            };
            fetchProjects();
        }
    }, [isFormModalOpen]);

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.aadhaar_number.trim()) newErrors.aadhaar_number = "Aadhaar number is required";
        if (formData.aadhaar_number.replace(/-/g, "").length !== 12) newErrors.aadhaar_number = "Aadhaar must be exactly 12 digits";

        if (!formData.labour_name.trim()) {
            newErrors.labour_name = "Name is required";
        } else if (!/^[a-zA-Z\s]+$/.test(formData.labour_name)) {
            newErrors.labour_name = "Name must contain only alphabets";
        }
        if (!formData.skill_type.trim()) newErrors.skill_type = "Skill type is required";
        if (!formData.daily_wage_rate || Number(formData.daily_wage_rate) <= 0)
            newErrors.daily_wage_rate = "Valid wage rate is required";
        if (!formData.contractor_id) newErrors.contractor_id = "Contractor ID is required";
        if (!formData.status.trim()) newErrors.status = "Status is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };



    const fetchLaborers = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log(`Synchronizing Personnel Registry for Project: ${projectId}`);
            const response = await labourService.getLabours(projectId, {
                limit: 50, // Reverted to 50 to prevent 422 error
                offset: 0,
                status: statusFilter === "All" ? undefined : statusFilter
            });
            console.log("Personnel Registry Sync Success:", response);

            // Get local additions
            const localKey = `created_labourers_${projectId || 92}`;
            const localSaved = localStorage.getItem(localKey);
            const localItems = localSaved ? JSON.parse(localSaved) : [];

            // Get local deletions
            const deletedKey = `deleted_labourers_ids_${projectId || 92}`;
            const deletedSaved = localStorage.getItem(deletedKey);
            const deletedIds = new Set(deletedSaved ? JSON.parse(deletedSaved) : []);

            let combined = response.items || [];
            // Merge, avoiding duplicates
            const existingIds = new Set(combined.map((l: any) => l.id));
            localItems.forEach((l: any) => {
                if (!existingIds.has(l.id)) {
                    combined.unshift(l);
                }
            });

            // Filter out deleted laborers
            combined = combined.filter((l: any) => !deletedIds.has(l.id));

            setLaborers(combined);
        } catch (error: any) {
            console.error("Personnel Registry Sync Failure:", error.response?.data || error.message);
            toast.error("Failed to sync personnel registry");
        } finally {
            setIsLoading(false);
        }
    }, [projectId, searchTerm, statusFilter]);

    useEffect(() => {
        fetchLaborers();
    }, [fetchLaborers]);

    const [loadingId, setLoadingId] = useState<number | null>(null);

    const handleViewDetail = async (labourId: number) => {
        setLoadingId(labourId);
        try {
            console.log(`Executing Detail Fetch: GET /labour/${labourId}`);
            const data = await labourService.getLabourById(labourId);
            setSelectedLaborer(data);
            setIsDetailModalOpen(true);
        } catch (err: any) {
            console.error("Detail Fetch Error:", err.response?.data || err.message);
            toast.error("Failed to retrieve profile details");
        } finally {
            setLoadingId(null);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!labourToDelete) return;
        try {
            setIsDeleting(true);
            console.log(`Executing API Request: DELETE /labour/${labourToDelete}`);
            await labourService.deleteLabour(labourToDelete);

            // ── Immediately remove from UI so list never goes blank ──
            setLaborers(prev => prev.filter(l => l.id !== labourToDelete));

            // Sync deletion locally in localStorage
            try {
                const localKey = `created_labourers_${projectId || 92}`;
                const localSaved = localStorage.getItem(localKey);
                if (localSaved) {
                    const localItems = JSON.parse(localSaved);
                    const updatedItems = localItems.filter((l: any) => l.id !== labourToDelete);
                    localStorage.setItem(localKey, JSON.stringify(updatedItems));
                }

                const deletedKey = `deleted_labourers_ids_${projectId || 92}`;
                const deletedSaved = localStorage.getItem(deletedKey);
                const deletedItems = deletedSaved ? JSON.parse(deletedSaved) : [];
                if (!deletedItems.includes(labourToDelete)) {
                    deletedItems.push(labourToDelete);
                    localStorage.setItem(deletedKey, JSON.stringify(deletedItems));
                }
            } catch (e) {
                console.error("Failed to sync deletion locally:", e);
            }

            toast.success("Worker record deleted successfully");
            setIsDeleteModalOpen(false);
            setLabourToDelete(null);
            // Background re-sync to make sure server state matches
            fetchLaborers();
        } catch (error: any) {
            console.error("Delete API Error:", error.response?.data || error.message);
            toast.error(error.response?.data?.message || "Record removal failed");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please correct the errors in the form");
            return;
        }
        setIsSubmitting(true);
        try {
            if (formMode === "edit" && editId) {
                const updatePayload = {
                    labour_name: formData.labour_name,
                    skill_type: formData.skill_type,
                    daily_wage_rate: Number(formData.daily_wage_rate).toFixed(2),
                    contractor_id: Number(formData.contractor_id),
                    status: formData.status,
                    notes: formData.notes,
                };
                const updatedLaborer = await labourService.updateLabour(editId, updatePayload as any);

                // Update local state immediately with real data
                setLaborers(prev => prev.map(l => l.id === editId ? { ...l, ...updatedLaborer } : l));

                toast.success("Profile updated successfully");
            } else {
                const createPayload = {
                    aadhaar_number: formData.aadhaar_number.replace(/-/g, ""),
                    labour_name: formData.labour_name,
                    skill_type: formData.skill_type,
                    daily_wage_rate: Number(formData.daily_wage_rate),
                    contractor_id: Number(formData.contractor_id),
                    status: formData.status,
                    notes: formData.notes,
                    project_id: projectId || 92, // Only include if user has set a project
                };
                console.log("Step 1: Registering Personnel...", createPayload);
                const newLaborer = await labourService.createLabour(createPayload);

                // Step 2: Explicitly assign worker to the project to ensure they appear in the list
                const activePId = assignProjectId ? Number(assignProjectId) : (projectId || 92);
                console.log(`Step 2: Assigning Worker ${newLaborer.id} to Project ${activePId}...`);
                try {
                    await labourService.assignLabourToProject(newLaborer.id, activePId);
                } catch (assignError: any) {
                    console.error("Assignment Failed, rolling back labour creation:", assignError);
                    await labourService.deleteLabour(newLaborer.id);
                    throw new Error("Failed to assign project. Worker registration rolled back.");
                }

                // Add to local state immediately
                setLaborers(prev => [newLaborer, ...prev]);
                // Store in localStorage for instant sync with Attendance page
                try {
                    const localKey = `created_labourers_${activePId}`;
                    const localSaved = localStorage.getItem(localKey);
                    const localItems = localSaved ? JSON.parse(localSaved) : [];
                    localItems.unshift(newLaborer);
                    localStorage.setItem(localKey, JSON.stringify(localItems));
                } catch (e) {
                    console.error("Failed to save created worker to localStorage", e);
                }
                toast.success("Personnel registered successfully");
            }
            setIsFormModalOpen(false);
            setFormData(initialFormData); // Refresh/Reset form data
            setErrors({}); // Clear errors

            // Now that we've assigned them, a fetch should safely see them
            setTimeout(() => {
                fetchLaborers();
            }, 1000);
        } catch (error: any) {
            console.error("Submission Error:", error.response?.data || error.message);
            toast.error(error.response?.data?.detail || "Registration failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const baseFilteredLaborers = laborers.filter(l => {
        // Apply Contractor ID filter
        if (contractorFilter !== null && l.contractor_id !== contractorFilter) return false;

        // Apply Status Filter
        if (statusFilter !== "All" && l.status !== statusFilter) return false;

        // Apply Search Term filter (Name, ID, Worker Code, Aadhaar)
        const search = searchTerm.toLowerCase().trim();
        if (search) {
            return (
                l.labour_name.toLowerCase().includes(search) ||
                l.worker_code.toLowerCase().includes(search) ||
                l.id.toString().includes(search) ||
                l.aadhaar_number.includes(search) ||
                l.aadhaar_number.replace(/-/g, "").includes(search)
            );
        }

        return true;
    });

    const stats = {
        total: baseFilteredLaborers.length,
        active: baseFilteredLaborers.filter(l => l.status === "Active").length,
        skilled: baseFilteredLaborers.filter(l => l.skill_type === "Skilled").length,
    };

    const filteredLaborers = baseFilteredLaborers.filter(l => {
        // Apply Stat Cards filter
        if (activeStatFilter === "Active" && l.status !== "Active") return false;
        if (activeStatFilter === "Skilled" && l.skill_type !== "Skilled") return false;
        return true;
    });

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [projectId, contractorFilter, searchTerm, statusFilter, activeStatFilter]);

    const paginatedLaborers = filteredLaborers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <>
            <Navbar title="Personnel Registry" breadcrumb={["Engineer", "Workforce", "Detail Directory"]} />

            <PageTransition className="p-4 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto pb-8 font-inter flex flex-col">
                {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Workforce Personnel Ledger</h1>
                        <p className="text-slate-500 text-sm italic-none">Centralized database of site workforce, performance metrics and compliance.</p>
                    </div>
                    <button
                        onClick={() => { setFormMode("create"); setFormData(initialFormData); setErrors({}); setAssignProjectId(""); setIsFormModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Register Personnel
                    </button>
                </div>

                {/* â”€â”€ Summary Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard title="Personnel Database" value={stats.total.toString()} sub="Total Records" accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Active")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Active" ? "ring-2 ring-blue-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard title="Active Labour" value={stats.active.toString()} sub="Currently Deployed" accent="text-blue-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Skilled")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Skilled" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                        <StatCard title="Technical Skill" value={stats.skilled.toString()} sub="Skilled Labourers" accent="text-emerald-500" />
                    </div>
                </div>

                {/* â”€â”€ Main Container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex flex-col md:flex-row md:items-center flex-wrap gap-4 bg-white font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                            <input type="text" placeholder="Search by name, ID or Aadhaar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter" />
                        </div>
                        <div className="flex items-center gap-2 font-inter">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter uppercase tracking-widest">
                                <option value="All">All Status</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-3 md:border-l md:border-slate-100 md:pl-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contractor ID:</span>
                            <input
                                type="number"
                                placeholder="ID"
                                value={contractorFilter || ''}
                                onChange={(e) => setContractorFilter(e.target.value ? Number(e.target.value) : null)}
                                className="w-20 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Parsing Personnel Records...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Labour Name</th>
                                        <th className="px-6 py-4 font-inter">Aadhaar Number</th>
                                        <th className="px-6 py-4 font-inter">Skill Type</th>
                                        <th className="px-6 py-4 font-inter text-center">Daily Wage Rate</th>
                                        <th className="px-6 py-4 font-inter text-center">Contractor ID</th>
                                        <th className="px-6 py-4 font-inter">Status</th>
                                        <th className="px-6 py-4 font-inter">Notes</th>
                                        <th className="px-6 py-4 text-right font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {paginatedLaborers.map((labor) => (
                                        <tr key={labor.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-800 font-inter">{labor.labour_name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-slate-500 font-inter">{labor.aadhaar_number}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-slate-700 font-inter uppercase tracking-tight">{labor.skill_type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm font-bold text-slate-800 tabular-nums font-inter">{labor.daily_wage_rate}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold text-slate-500 font-inter">{labor.contractor_id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter ${labor.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {labor.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] text-slate-400 font-bold font-inter truncate max-w-[150px]" title={labor.notes}>
                                                    {labor.notes}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 font-inter">
                                                    <button
                                                        onClick={() => handleViewDetail(labor.id)}
                                                        disabled={loadingId !== null}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                        title="View Details"
                                                    >
                                                        {loadingId === labor.id ? (
                                                            <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    <button onClick={() => { setFormMode("edit"); setEditId(labor.id); setFormData({ aadhaar_number: formatAadhaar(labor.aadhaar_number), labour_name: labor.labour_name, skill_type: labor.skill_type, daily_wage_rate: labor.daily_wage_rate.toString(), contractor_id: labor.contractor_id, status: labor.status, notes: labor.notes || "" }); setErrors({}); setIsFormModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => { setLabourToDelete(labor.id); setIsDeleteModalOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* â”€â”€ Pagination Controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        {!isLoading && filteredLaborers.length > 0 && (
                            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                            {/* Left: Items per page */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                                <select 
                                    value={itemsPerPage} 
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            {/* Center: Showing info */}
                            <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredLaborers.length)} of {filteredLaborers.length} records
                            </div>

                            {/* Right: Pagination */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                
                                {(() => {
                                    const totalItems = filteredLaborers.length;
                                    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                    const pages = [];
                                    if (totalPages <= 5) {
                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                    } else {
                                        if (currentPage <= 3) {
                                            pages.push(1, 2, 3, 4, '...', totalPages);
                                        } else if (currentPage >= totalPages - 2) {
                                            pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                        } else {
                                            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                        }
                                    }

                                    return pages.map((page, index) => {
                                        if (page === '...') {
                                            return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                        }
                                        const pageNum = page as number;
                                        const isActive = currentPage === pageNum;
                                        return (
                                            <button
                                                key={`page-${pageNum}`}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${
                                                    isActive 
                                                        ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary' 
                                                        : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                                                }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    });
                                })()}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredLaborers.length / itemsPerPage), prev + 1))}
                                    disabled={currentPage === Math.max(1, Math.ceil(filteredLaborers.length / itemsPerPage)) || filteredLaborers.length === 0}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        )}

                    </div>
                </div>
            </PageTransition>

            {/* â”€â”€ Form Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={formMode === 'create' ? 'Register New Personnel' : 'Update Personnel Profile'}
                maxWidth="max-w-4xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button
                            type="button"
                            onClick={() => setIsFormModalOpen(false)}
                            className="min-w-[180px] px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all font-inter"
                        >
                            Cancel
                        </button>
                        <button
                            form="personnel-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="min-w-[180px] px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-inter"
                        >
                            {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {formMode === 'create' ? 'Confirm Registration' : 'Update Profile'}
                        </button>
                    </div>
                }
            >
                <form id="personnel-form" onSubmit={handleSubmit} className="space-y-6">
                    {formMode === 'create' && (
                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-bold text-primary">Assign to project</h3>
                                </div>
                            </div>
                            <p className="text-[11px] text-blue-500 mb-4 ml-6">Labour create hone ke baad automatically project assign ho jayega</p>
                            <div className="ml-6">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">SELECT PROJECT *</label>
                                <select
                                    value={assignProjectId}
                                    onChange={(e) => setAssignProjectId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">-- Select your project --</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Personnel Identity & Professional Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Aadhaar Number <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={formData.aadhaar_number}
                                    onChange={(e) => setFormData({ ...formData, aadhaar_number: formatAadhaar(e.target.value) })}
                                    placeholder="2345-6789-0123"
                                    className={`w-full px-4 py-2.5 bg-white border ${errors.aadhaar_number ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all`}
                                    required
                                />
                                {errors.aadhaar_number && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.aadhaar_number}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Labour Name <span className="text-rose-500">*</span></label>
                                <input type="text" value={formData.labour_name} onChange={(e) => setFormData({ ...formData, labour_name: e.target.value.replace(/[^a-zA-Z\s]/g, '') })} placeholder="Suresh Yadav" className={`w-full px-4 py-2.5 bg-white border ${errors.labour_name ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20`} required />
                                {errors.labour_name && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.labour_name}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Skill Type <span className="text-rose-500">*</span></label>
                                <select value={formData.skill_type} onChange={(e) => setFormData({ ...formData, skill_type: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all">
                                    <option value="Skilled">Skilled</option>
                                    <option value="Unskilled">Unskilled</option>
                                </select>
                                {errors.skill_type && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.skill_type}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Daily Wage Rate <span className="text-rose-500">*</span></label>
                                <input type="text" value={formData.daily_wage_rate} onChange={(e) => setFormData({ ...formData, daily_wage_rate: e.target.value.replace(/[^0-9.]/g, '') })} placeholder="900.00" className={`w-full px-4 py-2.5 bg-white border ${errors.daily_wage_rate ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all`} required />
                                {errors.daily_wage_rate && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.daily_wage_rate}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contractor ID <span className="text-rose-500">*</span></label>
                                <input type="number" value={formData.contractor_id} onChange={(e) => setFormData({ ...formData, contractor_id: Number(e.target.value) })} placeholder="1" className={`w-full px-4 py-2.5 bg-white border ${errors.contractor_id ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all`} required />
                                {errors.contractor_id && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.contractor_id}</p>}
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status <span className="text-rose-500">*</span></label>
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                                {errors.status && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.status}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notes <span className="text-rose-500">*</span></label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Helper for general site works" className={`w-full px-4 py-2.5 bg-white border ${errors.notes ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all resize-none`} rows={3} required />
                                {errors.notes && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.notes}</p>}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* â”€â”€ Detail Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Personnel Profile Insight" maxWidth="max-w-xl">
                {selectedLaborer && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* â”€â”€ Profile Style Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                        <div className="bg-primary rounded-2xl p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-bold font-inter">{selectedLaborer.labour_name.charAt(0)}</span>
                                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${selectedLaborer.status?.toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-rose-500'} border-4 border-primary rounded-full animate-pulse`} />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-bold tracking-tight font-inter">{selectedLaborer.labour_name}</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter">{selectedLaborer.skill_type}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter">worker.{selectedLaborer.worker_code.toLowerCase()}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-bold uppercase tracking-widest font-inter">DAILY WAGE: ₹{selectedLaborer.daily_wage_rate}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Professional Information style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Professional Information</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Worker ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none uppercase">{selectedLaborer.worker_code}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Daily Base</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">₹{selectedLaborer.daily_wage_rate}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Aadhaar Reference</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">XXXX-XXXX-{selectedLaborer.aadhaar_number.slice(-4)}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Skill Category</p>
                                        <p className="text-sm font-black text-blue-600 font-inter italic-none">{selectedLaborer.skill_type}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Audit Trail & Logistics</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Registration Date</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">2026-04-10</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Contractor ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">CONT-0{selectedLaborer.contractor_id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Assignments style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em] font-inter">Deployment Status</p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 sm:gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Assigned Site</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">Skyline Tower A</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Attendance Integrity</p>
                                        <p className="text-sm font-black text-emerald-500 font-inter italic-none">High Consistency</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsDetailModalOpen(false)}
                            className="w-full py-5 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter mb-2"
                        >
                            Dismiss Profile Insight
                        </button>
                    </div>
                )}
            </Modal>

            <ConfirmModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteConfirm} title="Remove Personnel Entry" message="Are you sure you want to delete this labor record?" confirmText="Confirm Deletion" type="danger" isLoading={isDeleting} />
        </>
    );
};

export default LaborDetailsPage;
