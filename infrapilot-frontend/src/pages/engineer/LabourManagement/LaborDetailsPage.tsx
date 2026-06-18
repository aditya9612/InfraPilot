import { useState, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
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
    mobile_number: "",
    email: "",
    pan_number: "",
    address: "",
    labour_type_id: 1,
    custom_daily_wage_rate: "",
    custom_ot_rate_per_hour: "",
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
    const [contractorFilter, setContractorFilter] = useState<string>("");
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
    const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

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
        const aadhaarDigits = formData.aadhaar_number.replace(/-/g, "");

        if (formData.aadhaar_number.trim()) {
            if (aadhaarDigits.length !== 12) newErrors.aadhaar_number = "Aadhaar must be exactly 12 digits";
            else if (/^(\d)\1+$/.test(aadhaarDigits)) newErrors.aadhaar_number = "Aadhaar cannot consist of all identical digits";
            else if (aadhaarDigits.startsWith("0") || aadhaarDigits.startsWith("1")) newErrors.aadhaar_number = "Aadhaar cannot start with 0 or 1";
        }

        if (!formData.labour_name.trim()) {
            newErrors.labour_name = "Labour name is required";
        } else if (!/^[a-zA-Z\s]+$/.test(formData.labour_name)) {
            newErrors.labour_name = "Name must contain only alphabets";
        }

        if (!formData.mobile_number.trim()) {
            newErrors.mobile_number = "Mobile number is required";
        } else if (!/^[6-9]\d{9}$/.test(formData.mobile_number)) {
            newErrors.mobile_number = "Enter a valid 10-digit Indian mobile number";
        }

        if (!formData.labour_type_id) newErrors.labour_type_id = "Labour type is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };



    const fetchLaborers = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log(`Synchronizing Personnel Registry for Project: ${projectId}`);
            let allItems: any[] = [];
            let offset = 0;
            let hasMore = true;

            while (hasMore) {
                const response = await labourService.getLabours(projectId, {
                    limit: 50,
                    offset: offset,
                    status: statusFilter === "All" ? undefined : statusFilter
                });
                
                const items = response.items || [];
                allItems = [...allItems, ...items];
                
                if (items.length < 50) {
                    hasMore = false;
                } else {
                    offset += 50;
                }
            }
            console.log(`Personnel Registry Sync Success: Fetched ${allItems.length} records`);

            // Get local additions
            const localKey = `created_labourers_${projectId || 92}`;
            const localSaved = localStorage.getItem(localKey);
            const localItems = localSaved ? JSON.parse(localSaved) : [];

            // Get local deletions
            const deletedKey = `deleted_labourers_ids_${projectId || 92}`;
            const deletedSaved = localStorage.getItem(deletedKey);
            const deletedIds = new Set(deletedSaved ? JSON.parse(deletedSaved) : []);

            let combined = allItems;
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
                    mobile_number: formData.mobile_number || undefined,
                    email: formData.email || undefined,
                    pan_number: formData.pan_number || undefined,
                    address: formData.address || undefined,
                    labour_type_id: Number(formData.labour_type_id),
                    custom_daily_wage_rate: formData.custom_daily_wage_rate ? Number(formData.custom_daily_wage_rate) : undefined,
                    custom_ot_rate_per_hour: formData.custom_ot_rate_per_hour ? Number(formData.custom_ot_rate_per_hour) : undefined,
                    contractor_id: Number(formData.contractor_id),
                    status: formData.status,
                    notes: formData.notes,
                };
                const updatedLaborer = await labourService.updateLabour(editId, updatePayload as any);

                // Update local state immediately with real data
                setLaborers(prev => prev.map(l => l.id === editId ? { ...l, ...updatedLaborer } : l));

                // Sync the update to localStorage to prevent old data from reappearing
                try {
                    const localKey = `created_labourers_${projectId || 92}`;
                    const localSaved = localStorage.getItem(localKey);
                    if (localSaved) {
                        const localItems = JSON.parse(localSaved);
                        const itemIndex = localItems.findIndex((l: any) => l.id === editId);
                        if (itemIndex !== -1) {
                            localItems[itemIndex] = { ...localItems[itemIndex], ...updatedLaborer };
                            localStorage.setItem(localKey, JSON.stringify(localItems));
                        }
                    }
                } catch (e) {
                    console.error("Failed to update localStorage", e);
                }

                toast.success("Profile updated successfully");
            } else {
                const createPayload = {
                    aadhaar_number: formData.aadhaar_number ? formData.aadhaar_number.replace(/-/g, "") : undefined,
                    labour_name: formData.labour_name,
                    mobile_number: formData.mobile_number,
                    email: formData.email || undefined,
                    pan_number: formData.pan_number || undefined,
                    address: formData.address || undefined,
                    labour_type_id: Number(formData.labour_type_id),
                    custom_daily_wage_rate: formData.custom_daily_wage_rate ? Number(formData.custom_daily_wage_rate) : undefined,
                    custom_ot_rate_per_hour: formData.custom_ot_rate_per_hour ? Number(formData.custom_ot_rate_per_hour) : undefined,
                    contractor_id: Number(formData.contractor_id),
                    status: formData.status,
                    notes: formData.notes,
                    project_id: projectId || 92,
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
        // Apply Contractor Name filter
        if (contractorFilter && l.contractor_name !== contractorFilter) return false;

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

    const sortedLaborers = [...baseFilteredLaborers].sort((a, b) => {
        if (sortOrder === "newest") {
            return b.id - a.id;
        } else {
            return a.id - b.id;
        }
    });

    const stats = {
        total: sortedLaborers.length,
        active: sortedLaborers.filter(l => l.status === "Active").length,
        skilled: sortedLaborers.filter(l => l.skill_type === "Skilled").length,
    };

    const filteredLaborers = sortedLaborers.filter(l => {
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

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                {/* ─── Header ──────────────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Workforce Personnel Ledger
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Centralized database of site workforce, performance metrics and compliance.
                        </p>
                    </div>
                    <button
                        onClick={() => { setFormMode("create"); setFormData(initialFormData); setErrors({}); setAssignProjectId(""); setIsFormModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Register Personnel
                    </button>
                </div>

                {/* ─── Summary Stats ─────────────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[
                        {
                            title: "Personnel Database",
                            value: stats.total.toString(),
                            sub: "Total Records",
                            accent: "text-slate-800",
                            status: "All",
                        },
                        {
                            title: "Active Labour",
                            value: stats.active.toString(),
                            sub: "Currently Deployed",
                            accent: "text-blue-500",
                            status: "Active",
                        },
                        {
                            title: "Technical Skill",
                            value: stats.skilled.toString(),
                            sub: "Skilled Labourers",
                            accent: "text-emerald-500",
                            status: "Skilled",
                        },
                    ].map((s) => (
                        <div
                            key={s.title}
                            onClick={() => setActiveStatFilter(s.status as any)}
                            className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all cursor-pointer hover:shadow-md hover:border-primary/20 hover:scale-[1.02] active:scale-95 group ${activeStatFilter === s.status ? "ring-2 ring-primary/20" : ""}`}
                        >
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                                {s.title}
                            </p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                {s.sub}
                            </p>
                        </div>
                    ))}
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
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contractor:</span>
                            <select
                                value={contractorFilter}
                                onChange={(e) => setContractorFilter(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter uppercase tracking-widest min-w-[160px]"
                            >
                                <option value="">All Contractors</option>
                                {[...new Set(laborers.map(l => l.contractor_name).filter(Boolean))].map(name => (
                                    <option key={name} value={name!}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-2 font-inter md:border-l md:border-slate-100 md:pl-4">
                            <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter uppercase tracking-widest">
                                <option value="newest">Newest First</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        {isLoading ? (
                            <div className="p-20 text-center text-slate-400 font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">Parsing Personnel Records...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left font-inter min-w-[3000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Role</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Aadhaar Number</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Labour Name</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Mobile Number</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">PAN Number</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Address</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Email</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Profile Image</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Labour Type Name</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Skill Category</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap text-right">Default Daily Wage (₹)</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap text-right">Custom Daily Wage (₹)</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap text-right">Custom OT Rate/Hr (₹)</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap text-right">Effective Daily Wage (₹)</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap text-right">Effective OT Rate (₹)</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Contractor Name</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Status</th>
                                        <th className="px-4 py-4 font-inter whitespace-nowrap">Notes</th>
                                        <th className="px-4 py-4 text-right font-inter whitespace-nowrap">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {paginatedLaborers.map((labor) => (
                                        <tr key={labor.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            {/* role */}
                                            <td className="px-4 py-4">
                                                <span className="text-xs text-slate-600 font-inter">{labor.role || "—"}</span>
                                            </td>
                                            {/* aadhaar_number */}
                                            <td className="px-4 py-4">
                                                <span className="text-xs font-mono text-slate-600 font-inter">{labor.aadhaar_number || "—"}</span>
                                            </td>
                                            {/* labour_name */}
                                            <td className="px-4 py-4">
                                                <span className="text-sm font-bold text-slate-800 font-inter whitespace-nowrap">{labor.labour_name}</span>
                                            </td>
                                            {/* mobile_number */}
                                            <td className="px-4 py-4">
                                                <span className="text-xs text-slate-600 font-inter">{labor.mobile_number || "—"}</span>
                                            </td>
                                            {/* pan_number */}
                                            <td className="px-4 py-4">
                                                <span className="text-xs font-mono text-slate-600 font-inter">{labor.pan_number || "—"}</span>
                                            </td>
                                            {/* address */}
                                            <td className="px-4 py-4">
                                                <span className="text-xs text-slate-500 font-inter max-w-[120px] block truncate" title={labor.address || ""}>{labor.address || "—"}</span>
                                            </td>
                                            {/* email */}
                                            <td className="px-4 py-4">
                                                <span className="text-xs text-slate-500 font-inter">{labor.email || "—"}</span>
                                            </td>
                                            {/* profile_image */}
                                            <td className="px-4 py-4">
                                                {labor.profile_image ? (
                                                    <img src={labor.profile_image} alt="profile" className="w-7 h-7 rounded-full object-cover border border-slate-200" />
                                                ) : (
                                                    <span className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold">{labor.labour_name?.charAt(0)}</span>
                                                )}
                                            </td>
                                            {/* labour_type_name */}
                                            <td className="px-4 py-4">
                                                <span className="text-xs font-bold text-slate-700 font-inter whitespace-nowrap">{labor.labour_type_name || "—"}</span>
                                            </td>
                                            {/* skill_category */}
                                            <td className="px-4 py-4">
                                                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">{labor.skill_category || "—"}</span>
                                            </td>
                                            {/* default_daily_wage */}
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-xs text-slate-500 tabular-nums font-inter">{labor.default_daily_wage != null ? `₹${labor.default_daily_wage}` : "—"}</span>
                                            </td>
                                            {/* custom_daily_wage_rate */}
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-xs font-bold text-slate-700 tabular-nums font-inter">{labor.custom_daily_wage_rate != null ? `₹${labor.custom_daily_wage_rate}` : "—"}</span>
                                            </td>
                                            {/* custom_ot_rate_per_hour */}
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-xs font-bold text-slate-700 tabular-nums font-inter">{labor.custom_ot_rate_per_hour != null ? `₹${labor.custom_ot_rate_per_hour}` : "—"}</span>
                                            </td>
                                            {/* effective_daily_wage */}
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-sm font-black text-emerald-600 tabular-nums font-inter">{labor.effective_daily_wage != null ? `₹${labor.effective_daily_wage}` : "—"}</span>
                                            </td>
                                            {/* effective_ot_rate */}
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-xs font-bold text-slate-600 tabular-nums font-inter">{labor.effective_ot_rate != null ? `₹${labor.effective_ot_rate}` : "—"}</span>
                                            </td>
                                            {/* contractor_name */}
                                            <td className="px-4 py-4">
                                                <span className="text-xs text-slate-500 font-inter">{labor.contractor_name || "—"}</span>
                                            </td>
                                            {/* status */}
                                            <td className="px-4 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter whitespace-nowrap ${labor.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {labor.status}
                                                </span>
                                            </td>
                                            {/* notes */}
                                            <td className="px-4 py-4">
                                                <p className="text-[10px] text-slate-400 font-bold font-inter truncate max-w-[120px]" title={labor.notes || ""}>{labor.notes || "—"}</p>
                                            </td>
                                            {/* actions */}
                                            <td className="px-4 py-4 text-right">
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
                                                    <button onClick={() => { setFormMode("edit"); setEditId(labor.id); setFormData({ aadhaar_number: formatAadhaar(labor.aadhaar_number), labour_name: labor.labour_name, mobile_number: labor.mobile_number || "", email: labor.email || "", pan_number: labor.pan_number || "", address: labor.address || "", labour_type_id: labor.labour_type_id ?? 1, custom_daily_wage_rate: labor.custom_daily_wage_rate?.toString() || "", custom_ot_rate_per_hour: labor.custom_ot_rate_per_hour?.toString() || "", contractor_id: labor.contractor_id ?? 1, status: labor.status, notes: labor.notes || "" }); setErrors({}); setIsFormModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"><Edit2 className="w-4 h-4" /></button>
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
                                                    className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
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
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Personnel Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                            {/* aadhaar_number */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Aadhaar Number</label>
                                <input type="text" value={formData.aadhaar_number} onChange={(e) => setFormData({ ...formData, aadhaar_number: formatAadhaar(e.target.value) })} placeholder="2345-6789-0123" className={`w-full px-4 py-2.5 bg-white border ${errors.aadhaar_number ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20`} />
                                {errors.aadhaar_number && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.aadhaar_number}</p>}
                            </div>

                            {/* labour_name * */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Labour Name <span className="text-rose-500">*</span></label>
                                <input type="text" value={formData.labour_name} onChange={(e) => setFormData({ ...formData, labour_name: e.target.value.replace(/[^a-zA-Z\s]/g, '') })} placeholder="Ramesh Shinde" className={`w-full px-4 py-2.5 bg-white border ${errors.labour_name ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20`} required />
                                {errors.labour_name && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.labour_name}</p>}
                            </div>

                            {/* mobile_number * */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mobile Number <span className="text-rose-500">*</span></label>
                                <input type="tel" value={formData.mobile_number} onChange={(e) => setFormData({ ...formData, mobile_number: e.target.value.replace(/\D/g, '').slice(0, 10) })} placeholder="9696969696" className={`w-full px-4 py-2.5 bg-white border ${errors.mobile_number ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20`} required />
                                {errors.mobile_number && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.mobile_number}</p>}
                            </div>

                            {/* pan_number */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">PAN Number</label>
                                <input type="text" value={formData.pan_number} onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase().slice(0, 10) })} placeholder="HHLM5621L" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>

                            {/* email */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
                                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="ramesh.shinde@gmail.com" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>

                            {/* address */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Address</label>
                                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Pune, Maharashtra" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>

                            {/* labour_type_id * */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Labour Type <span className="text-rose-500">*</span></label>
                                <select value={formData.labour_type_id} onChange={(e) => setFormData({ ...formData, labour_type_id: Number(e.target.value) })} className={`w-full px-4 py-2.5 bg-white border ${errors.labour_type_id ? 'border-rose-300' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all`}>
                                    <option value={1}>Skilled</option>
                                    <option value={2}>Semi-Skilled</option>
                                    <option value={3}>Unskilled</option>
                                    <option value={4}>Supervisor</option>
                                    <option value={5}>Foreman</option>
                                </select>
                                {errors.labour_type_id && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.labour_type_id}</p>}
                            </div>

                            {/* custom_daily_wage_rate */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Custom Daily Wage Rate (₹)</label>
                                <input type="number" value={formData.custom_daily_wage_rate} onChange={(e) => setFormData({ ...formData, custom_daily_wage_rate: e.target.value })} placeholder="900" min="0" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>

                            {/* custom_ot_rate_per_hour */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Custom OT Rate / Hour (₹)</label>
                                <input type="number" value={formData.custom_ot_rate_per_hour} onChange={(e) => setFormData({ ...formData, custom_ot_rate_per_hour: e.target.value })} placeholder="120" min="0" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>

                            {/* contractor_id */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contractor ID</label>
                                <input type="number" value={formData.contractor_id} onChange={(e) => setFormData({ ...formData, contractor_id: Number(e.target.value) })} placeholder="1" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                            </div>

                            {/* status */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all">
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>

                            {/* notes — full width */}
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Notes</label>
                                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="Experienced mason with 8 years of construction experience" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all resize-none focus:border-primary focus:ring-2 focus:ring-primary/20" rows={3} />
                            </div>

                        </div>
                    </div>
                </form>
            </Modal>

            {/* —————————————————————————————————— Detail Modal —————————————————————————————————— */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Personnel Profile" maxWidth="max-w-2xl">
                {selectedLaborer && (
                    <div className="p-6 font-inter">
                        {/* Header card */}
                        <div className="bg-primary rounded-2xl p-6 mb-6 text-white shadow-xl relative overflow-hidden">
                            <div className="flex items-center gap-5">
                                <div className="w-20 h-20 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative flex-shrink-0">
                                    {selectedLaborer.profile_image ? (
                                        <img src={selectedLaborer.profile_image} alt="profile" className="w-full h-full rounded-2xl object-cover" />
                                    ) : (
                                        <span className="text-3xl font-bold">{selectedLaborer.labour_name.charAt(0)}</span>
                                    )}
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${selectedLaborer.status === 'Active' ? 'bg-emerald-500' : 'bg-rose-500'} border-4 border-primary rounded-full`} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-bold tracking-tight">{selectedLaborer.labour_name}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${selectedLaborer.status === 'Active' ? 'bg-emerald-500/30 text-emerald-100' : 'bg-rose-500/30 text-rose-100'}`}>{selectedLaborer.status}</span>
                                    </div>
                                    <p className="text-white/70 text-xs font-bold mb-2">{selectedLaborer.role || 'Labour'} &nbsp;·&nbsp; {selectedLaborer.worker_code}</p>
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">{selectedLaborer.labour_type_name || '—'}</span>
                                        <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">{selectedLaborer.skill_category || '—'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* All fields in GET API sequence */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            {([
                                { label: 'ID', value: selectedLaborer.id },
                                { label: 'Worker Code', value: selectedLaborer.worker_code },
                                { label: 'User ID', value: selectedLaborer.user_id ?? '—' },
                                { label: 'Role', value: selectedLaborer.role || '—' },
                                { label: 'Aadhaar Number', value: selectedLaborer.aadhaar_number || '—' },
                                { label: 'Labour Name', value: selectedLaborer.labour_name },
                                { label: 'Mobile Number', value: selectedLaborer.mobile_number || '—' },
                                { label: 'PAN Number', value: selectedLaborer.pan_number || '—' },
                                { label: 'Address', value: selectedLaborer.address || '—' },
                                { label: 'Email', value: selectedLaborer.email || '—' },
                                { label: 'Labour Type ID', value: selectedLaborer.labour_type_id ?? '—' },
                                { label: 'Labour Type Name', value: selectedLaborer.labour_type_name || '—' },
                                { label: 'Skill Category', value: selectedLaborer.skill_category || '—' },
                                { label: 'Default Daily Wage (₹)', value: selectedLaborer.default_daily_wage != null ? `₹${selectedLaborer.default_daily_wage}` : '—' },
                                { label: 'Custom Daily Wage (₹)', value: selectedLaborer.custom_daily_wage_rate != null ? `₹${selectedLaborer.custom_daily_wage_rate}` : '—' },
                                { label: 'Custom OT Rate/Hr (₹)', value: selectedLaborer.custom_ot_rate_per_hour != null ? `₹${selectedLaborer.custom_ot_rate_per_hour}` : '—' },
                                { label: 'Effective Daily Wage (₹)', value: selectedLaborer.effective_daily_wage != null ? `₹${selectedLaborer.effective_daily_wage}` : '—', highlight: true },
                                { label: 'Effective OT Rate (₹)', value: selectedLaborer.effective_ot_rate != null ? `₹${selectedLaborer.effective_ot_rate}` : '—', highlight: true },
                                { label: 'Contractor ID', value: selectedLaborer.contractor_id ?? '—' },
                                { label: 'Contractor Name', value: selectedLaborer.contractor_name || '—' },
                                { label: 'Status', value: selectedLaborer.status },
                            ] as { label: string; value: any; highlight?: boolean }[]).map(({ label, value, highlight }) => (
                                <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                                    <p className={`text-sm font-bold truncate ${highlight ? 'text-emerald-600' : 'text-slate-800'}`}>{String(value)}</p>
                                </div>
                            ))}
                            {/* Notes — full width */}
                            <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                                <p className="text-sm font-bold text-slate-800">{selectedLaborer.notes || '—'}</p>
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
