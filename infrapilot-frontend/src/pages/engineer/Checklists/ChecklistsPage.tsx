import { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import {
    Plus,
    Trash2,
    CheckCircle2,
    ClipboardList,
    Search,
    Activity,
    FileText,
    RotateCcw,
    Layout,
    ChevronLeft,
    ChevronRight,
    Edit3,
    Save,
    X,
    Eye
} from "lucide-react";

import { checklistService } from "../../../services/checklistService";
import type { ChecklistItem, ChecklistItemEntry, ChecklistLog } from "../../../services/checklistService";
import { projectService } from "../../../services/projectService";
import { useProject } from "../../../context/ProjectContext";

const typeColors: Record<string, string> = {
    "daily checklist": "bg-blue-50 text-blue-600 border-blue-100",
    "safety": "bg-rose-50 text-rose-600 border-rose-100",
    "quality": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "activity checklist": "bg-purple-50 text-purple-600 border-purple-100",
};

const ChecklistsPage = () => {
    // Core Data States
    const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
    const [logs, setLogs] = useState<ChecklistLog[]>([]);
    const [activeTab, setActiveTab] = useState<"Daily Checklist" | "Activity Checklist">("Daily Checklist");
    const { selectedProjectId, setSelectedProjectId } = useProject();
    const projectId = selectedProjectId || 0;

    // UI States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Pending" | "Done">("All");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Modal Visibility States
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isEditChecklistModalOpen, setIsEditChecklistModalOpen] = useState(false);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isViewItemsModalOpen, setIsViewItemsModalOpen] = useState(false);

    // Selection / Form States
    const [selectedChecklist, setSelectedChecklist] = useState<ChecklistItem | null>(null);
    const [newChecklistName, setNewChecklistName] = useState("");
    const [newChecklistType, setNewChecklistType] = useState("Daily Checklist");
    const [newChecklistProjectId, setNewChecklistProjectId] = useState("");
    const [editChecklistName, setEditChecklistName] = useState("");
    const [editChecklistDescription, setEditChecklistDescription] = useState("");
    const [editChecklistProjectId, setEditChecklistProjectId] = useState("");
    const [editChecklistIsActive, setEditChecklistIsActive] = useState(true);
    const [projects, setProjects] = useState<any[]>([]);
    const [newChecklistItems, setNewChecklistItems] = useState<string[]>([]);
    const [tempItemText, setTempItemText] = useState("");
    const [addItemText, setAddItemText] = useState("");
    const [executeStatus, setExecuteStatus] = useState<"Done" | "Pending">("Done");
    const [executeRemarks, setExecuteRemarks] = useState("");
    const [executeError, setExecuteError] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [currentChecklistItems, setCurrentChecklistItems] = useState<ChecklistItemEntry[]>([]);
    const [isFetchingItems, setIsFetchingItems] = useState(false);
    const [editingItemId, setEditingItemId] = useState<number | null>(null);
    const [editItemText, setEditItemText] = useState("");

    // Resolve Project ID and fetch assigned projects list
    useEffect(() => {

        // Fetch all assigned projects
        const fetchProjects = async () => {
            try {
                const res = await projectService.getProjects(100, 0);
                const list = Array.isArray(res) ? res : (res.items || res.data || []);
                setProjects(list);
            } catch (error) {
                console.error("Failed to fetch projects", error);
            }
        };
        fetchProjects();
    }, []);

    const fetchData = useCallback(async () => {
        if (!projectId) return;
        try {
            const [clRes, logsRes] = await Promise.all([
                checklistService.listChecklists(projectId),
                checklistService.listLogs(projectId)
            ]);

            // Merge with local storage created checklists to support mock/virtual fallback persistence
            const localSaved = localStorage.getItem("created_checklists");
            const localChecklists = localSaved ? JSON.parse(localSaved) : [];
            const combined = [...clRes];
            const existingIds = new Set(combined.map(c => c.id));
            localChecklists.forEach((c: any) => {
                if (!existingIds.has(c.id)) {
                    combined.unshift(c);
                }
            });

            // Fallback strict filter to ensure ONLY current project checklists show up
            const projectSpecificCombined = combined.filter(c => Number(c.project_id) === Number(projectId));

            const sortedCombined = projectSpecificCombined.sort((a: any, b: any) => Number(b.id) - Number(a.id));
            setChecklists(sortedCombined);
            setLogs(logsRes.items || []);
        } catch (err) {
            toast.error("Failed to sync checklist vault");
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateChecklist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChecklistProjectId) {
            toast.error("Project is required");
            return;
        }
        if (!newChecklistName.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const created = await checklistService.createChecklist({
                project_id: Number(newChecklistProjectId),
                name: newChecklistName,
                type: newChecklistType
            });

            for (const item of newChecklistItems) {
                await checklistService.addItem({
                    checklist_id: created.id,
                    item: item
                });
            }

            // Save to localStorage for robust virtual/fallback persistence
            try {
                const localSaved = localStorage.getItem("created_checklists");
                const localChecklists = localSaved ? JSON.parse(localSaved) : [];
                localChecklists.unshift(created);
                localStorage.setItem("created_checklists", JSON.stringify(localChecklists));
            } catch (err) {
                console.error("Failed to save created checklist to localStorage", err);
            }

            toast.success("Checklist created successfully!");
            if (projectId !== Number(newChecklistProjectId)) {
                if (setSelectedProjectId) {
                    setSelectedProjectId(Number(newChecklistProjectId));
                }
            }
            setActiveTab(newChecklistType as any);
            await fetchData();
            setIsNewModalOpen(false);
            setNewChecklistName("");
            setNewChecklistProjectId("");
            setNewChecklistItems([]);
        } catch (err) {
            toast.error("Failed to create checklist");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (cl: any) => {
        setSelectedChecklist(cl);
        setEditChecklistName(cl.name);
        setEditChecklistDescription(cl.description || "");
        setEditChecklistProjectId(cl.project_id?.toString() || projectId.toString());
        setEditChecklistIsActive(cl.is_active !== undefined ? cl.is_active : true);
        setIsEditChecklistModalOpen(true);
    };

    const handleUpdateChecklist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChecklist) return;
        if (!editChecklistName.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            await checklistService.updateChecklist(selectedChecklist.id, {
                name: editChecklistName,
                description: editChecklistDescription,
                project_id: Number(editChecklistProjectId),
                is_active: editChecklistIsActive
            });

            // Update in localStorage if exists
            try {
                const localSaved = localStorage.getItem("created_checklists");
                if (localSaved) {
                    const localChecklists = JSON.parse(localSaved);
                    const index = localChecklists.findIndex((c: any) => c.id === selectedChecklist.id);
                    if (index !== -1) {
                        localChecklists[index] = {
                            ...localChecklists[index],
                            name: editChecklistName,
                            description: editChecklistDescription,
                            project_id: Number(editChecklistProjectId),
                            is_active: editChecklistIsActive
                        };
                        localStorage.setItem("created_checklists", JSON.stringify(localChecklists));
                    }
                }
            } catch (err) {
                console.error("Failed to update localStorage", err);
            }

            toast.success("Checklist updated successfully!");
            await fetchData();
            setIsEditChecklistModalOpen(false);
            setSelectedChecklist(null);
        } catch (err) {
            toast.error("Failed to update checklist");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchChecklistItems = async (checklistId: number) => {
        setIsFetchingItems(true);
        try {
            const items = await checklistService.getItems(checklistId);
            setCurrentChecklistItems(items);
        } catch (error) {
            toast.error("Failed to fetch items");
            setCurrentChecklistItems([]);
        } finally {
            setIsFetchingItems(false);
        }
    };

    const openManageItemsModal = (cl: ChecklistItem) => {
        setSelectedChecklist(cl);
        setIsAddItemModalOpen(true);
        fetchChecklistItems(cl.id);
    };

    const openViewItemsModal = (cl: ChecklistItem) => {
        setSelectedChecklist(cl);
        setIsViewItemsModalOpen(true);
        fetchChecklistItems(cl.id);
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!addItemText.trim() || !selectedChecklist) return;

        setIsSubmitting(true);
        try {
            await checklistService.addItem({
                checklist_id: selectedChecklist.id,
                item: addItemText
            });
            toast.success("Item added successfully!");
            setAddItemText("");
            await fetchChecklistItems(selectedChecklist.id);
        } catch (err) {
            toast.error("Failed to add item");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateItem = async (itemId: number) => {
        if (!editItemText.trim() || !selectedChecklist) return;
        setIsSubmitting(true);
        try {
            await checklistService.updateItem(itemId, { item: editItemText });
            toast.success("Item updated successfully!");
            setEditingItemId(null);
            setEditItemText("");
            await fetchChecklistItems(selectedChecklist.id);
        } catch (err) {
            toast.error("Failed to update item");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        setIsSubmitting(true);
        try {
            await checklistService.deleteItem(itemId);
            toast.success("Item deleted successfully!");
            if (selectedChecklist) {
                await fetchChecklistItems(selectedChecklist.id);
            }
        } catch (err) {
            toast.error("Failed to delete item");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExecuteChecklist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!executeRemarks.trim() || !selectedChecklist) {
            setExecuteError(true);
            toast.error("Remarks are required");
            return;
        }
        setExecuteError(false);
        setIsSubmitting(true);
        try {
            const response = await checklistService.executeChecklist({
                project_id: Number(projectId),
                checklist_id: Number(selectedChecklist.id),
                status: executeStatus.toUpperCase(),
                remarks: executeRemarks
            });
            toast.success("Checklist executed successfully!");
            setLogs(prev => [response, ...prev]);
            await fetchData();
            setIsExecuteModalOpen(false);
            setExecuteRemarks("");
            setExecuteError(false);
        } catch (err) {
            toast.error("Failed to execute checklist");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        setIsSubmitting(true);
        try {
            await checklistService.deleteChecklist(deleteId);

            // Remove from localStorage
            try {
                const localSaved = localStorage.getItem("created_checklists");
                if (localSaved) {
                    const localChecklists = JSON.parse(localSaved);
                    const filtered = localChecklists.filter((c: any) => c.id !== deleteId);
                    localStorage.setItem("created_checklists", JSON.stringify(filtered));
                }
            } catch (err) {
                console.error("Failed to update localStorage", err);
            }

            toast.success("Checklist deleted successfully!");
            setChecklists(prev => prev.filter(c => c.id !== deleteId));
            setLogs(prev => prev.filter(l => l.checklist_id !== deleteId));
            await fetchData();
            setIsDeleteModalOpen(false);
            setDeleteId(null);
        } catch (err) {
            toast.error("Failed to delete checklist");
        } finally {
            setIsSubmitting(false);
        }
    };

    const stats = useMemo(() => {
        const activeChecklists = checklists.filter(c => c.type?.toLowerCase() === activeTab.toLowerCase());
        const total = activeChecklists.length;

        const latestLogsMap = new Map();
        const sortedLogs = [...logs].sort((a, b) => b.id - a.id);

        sortedLogs.forEach(log => {
            if (!latestLogsMap.has(log.checklist_id)) {
                latestLogsMap.set(log.checklist_id, log);
            }
        });

        let done = 0;
        activeChecklists.forEach(c => {
            const latestLog = latestLogsMap.get(c.id);
            if (latestLog && (latestLog.status === "Done" || latestLog.status === "DONE" || latestLog.status === "Passed")) {
                done++;
            }
        });

        let globalDone = 0;
        checklists.forEach(c => {
            const latestLog = latestLogsMap.get(c.id);
            if (latestLog && (latestLog.status === "Done" || latestLog.status === "DONE" || latestLog.status === "Passed")) {
                globalDone++;
            }
        });

        const pending = total - done;
        const compliance = total > 0 ? Math.round((done / total) * 100) : 0;
        const globalHealth = checklists.length > 0 ? Math.round((globalDone / checklists.length) * 100) : 0;

        return {
            total,
            executed: logs.filter(l => activeChecklists.some(c => c.id === l.checklist_id)).length,
            done,
            pending,
            compliance,
            globalHealth,
            globalDone,
            globalTotal: checklists.length
        };
    }, [checklists, logs, activeTab]);

    const filteredChecklists = useMemo(() => {
        let cls = checklists.filter(c => c.type?.toLowerCase() === activeTab.toLowerCase());

        return cls.filter(cl => {
            const latestLog = [...logs].sort((a, b) => b.id - a.id).find(l => l.checklist_id === cl.id);
            const isDone = latestLog?.status === 'Done' || latestLog?.status === 'DONE' || latestLog?.status === 'Passed';

            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                const statusText = isDone ? 'done' : 'pending';
                const remarksText = (latestLog?.remarks || '').toLowerCase();

                const matchesName = cl.name.toLowerCase().includes(term);
                const matchesStatus = statusText.includes(term);
                const matchesRemarks = remarksText.includes(term);

                if (!matchesName && !matchesStatus && !matchesRemarks) {
                    return false;
                }
            }

            if (activeStatFilter !== "All") {
                if (activeStatFilter === "Done" && !isDone) return false;
                if (activeStatFilter === "Pending" && isDone) return false;
            }

            return true;
        });
    }, [checklists, logs, activeTab, activeStatFilter, searchTerm]);

    const paginatedChecklists = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredChecklists.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredChecklists, currentPage, itemsPerPage]);

    // Reset page on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, activeStatFilter]);

    const addTempItem = () => {
        if (tempItemText.trim()) {
            setNewChecklistItems(prev => [...prev, tempItemText.trim()]);
            setTempItemText("");
        }
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
    const inputClasses = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter";

    return (
        <>
            <Navbar title="Checklists" breadcrumb={["Engineer", "Execution", "Checklist Vault"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Checklist Intelligence Ledger
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Systematic verification protocols and site execution logs.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setIsNewModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                        >
                            <Plus className="w-4 h-4" />
                            New Checklist
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        {
                            title: "Total Checklists",
                            value: stats.total.toString(),
                            sub: "Protocols Logged",
                            accent: "text-slate-800",
                            status: "All",
                        },
                        {
                            title: "Compliance",
                            value: `${stats.compliance}%`,
                            sub: `${stats.done} / ${stats.total} Passed`,
                            accent: "text-emerald-500",
                            status: "Done",
                        },
                        {
                            title: "Pending Audits",
                            value: stats.pending.toString(),
                            sub: `${stats.pending} Need Action`,
                            accent: "text-rose-500",
                            status: "Pending",
                        },
                        {
                            title: "Global Health",
                            value: `${stats.globalHealth}%`,
                            sub: `${stats.globalDone} / ${stats.globalTotal} Overall`,
                            accent: "text-blue-500",
                            status: null,
                        },
                    ].map((s) => (
                        <div
                            key={s.title}
                            onClick={() => s.status && setActiveStatFilter(s.status as any)}
                            className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all ${s.status ? 'hover:shadow-md cursor-pointer active:scale-95 hover:border-primary/20' : 'cursor-default'} group`}
                        >
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                                {s.title}
                            </p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            {s.sub && (
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                    {s.sub}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* â”€â”€ Tab Selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex flex-wrap gap-2 mb-8 font-inter">
                    {["Daily Checklist", "Activity Checklist"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab
                                ? "bg-slate-800 text-white shadow-lg scale-105"
                                : "bg-white text-slate-400 border border-slate-100 hover:bg-slate-50"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* â”€â”€ Scrollable Content Area â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                <div className="flex-1 overflow-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                    {/* â”€â”€ Protocols Registry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <div className="mb-12 font-inter">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 font-inter">
                            {checklists.filter(c => c.type?.toLowerCase() === activeTab.toLowerCase()).map((cl) => (
                                <div key={cl.id} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group relative overflow-hidden font-inter">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />

                                    <div className="flex items-start justify-between mb-8 relative z-10 font-inter">
                                        <div className="flex-1 font-inter">
                                            <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors leading-tight mb-2 font-inter">{cl.name}</h3>
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border font-inter ${(cl.type && typeColors[cl.type.toLowerCase()]) || "bg-slate-50 text-slate-400"}`}>
                                                {cl.type}
                                            </span>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 font-inter">
                                            <ClipboardList className="w-5 h-5" />
                                        </div>
                                    </div>

                                    <div className="space-y-6 mb-8 relative z-10 font-inter">
                                        <div className="flex items-center justify-between font-inter">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">Intelligence Domain</span>
                                            <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest font-inter">VERIFIED VAULT</span>
                                        </div>

                                    </div>

                                    <div className="grid grid-cols-3 gap-3 relative z-10 font-inter">
                                        <button
                                            onClick={() => openManageItemsModal(cl)}
                                            className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-primary rounded-2xl transition-all font-inter active:scale-95 border border-slate-100"
                                            title="Manage Items"
                                        >
                                            <Layout className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Manage Items</span>
                                        </button>
                                        <button
                                            onClick={() => { setSelectedChecklist(cl); setExecuteError(false); setIsExecuteModalOpen(true); }}
                                            className="flex flex-col items-center gap-2 p-3 bg-primary text-white rounded-2xl transition-all shadow-lg shadow-primary/20 hover:bg-blue-600 font-inter active:scale-95"
                                            title="Execute Audit"
                                        >
                                            <CheckCircle2 className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Execute Checklist</span>
                                        </button>
                                        <button
                                            onClick={() => { setDeleteId(cl.id); setIsDeleteModalOpen(true); }}
                                            className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all font-inter active:scale-95 border border-slate-100"
                                            title="Archive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {checklists.filter(c => c.type?.toLowerCase() === activeTab.toLowerCase()).length === 0 && (
                                <div className="col-span-full py-32 text-center bg-white rounded-2xl border-4 border-dashed border-slate-50 font-inter">
                                    <Layout className="w-16 h-16 mx-auto mb-6 text-slate-200" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">No technical protocols discovered in the {activeTab} domain.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* â”€â”€ Execution Intelligence Registry â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter flex flex-col">
                        <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
                            <div className="relative flex-1 max-w-md font-inter">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Search className="w-4 h-4" />
                                </span>
                                <input
                                    type="text"
                                    placeholder="Search by protocol or remarks..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                                />
                            </div>
                            <div className="flex items-center gap-3 font-inter">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Filter:</span>
                                <select
                                    value={activeStatFilter}
                                    onChange={(e) => setActiveStatFilter(e.target.value as "All" | "Pending" | "Done")}
                                    className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer font-inter uppercase tracking-widest min-w-[140px]"
                                >
                                    <option value="All">ALL</option>
                                    <option value="Done">DONE</option>
                                    <option value="Pending">PENDING</option>
                                </select>
                                {activeStatFilter !== "All" && (
                                    <button onClick={() => setActiveStatFilter("All")} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors font-inter" title="Reset Filter">
                                        <RotateCcw className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                            <table className="w-full text-left font-inter min-w-[1000px]">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                        <th className="px-6 py-4 font-inter">Protocol Identity</th>
                                        <th className="px-6 py-4 font-inter">Compliance Profile</th>
                                        <th className="px-6 py-4 font-inter">Intelligence Remarks</th>
                                        <th className="px-6 py-4 text-right font-inter">Audit Sequence</th>
                                        <th className="px-6 py-4 text-center font-inter">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 font-inter">
                                    {paginatedChecklists.length > 0 ? (
                                        paginatedChecklists.map((cl) => {
                                            const latestLog = [...logs].sort((a, b) => b.id - a.id).find(l => l.checklist_id === cl.id);
                                            const isDone = latestLog?.status === 'Done' || latestLog?.status === 'DONE' || latestLog?.status === 'Passed';
                                            return (
                                                <tr key={cl.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                    <td className="px-6 py-4 font-inter">
                                                        <div className="flex flex-col font-inter">
                                                            <span className="text-sm font-bold text-slate-800 font-inter">
                                                                {cl.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 font-inter">
                                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border font-inter ${isDone ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                                            }`}>
                                                            {isDone ? 'DONE' : 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 font-inter">
                                                        <div className="flex items-center gap-2 font-inter max-w-xs">
                                                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                            <span className="text-xs font-bold text-slate-600 font-inter uppercase tracking-tight truncate">
                                                                {latestLog?.remarks || "PENDING AUDIT"}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-inter">
                                                        <div className="flex flex-col items-end font-inter">
                                                            <span className="text-xs font-bold text-slate-800 font-inter">{latestLog?.created_at ? new Date(latestLog.created_at).toLocaleDateString() : "Not Audited"}</span>
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">Timestamp</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-inter">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openViewItemsModal(cl)}
                                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter inline-flex"
                                                                title="View Items"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => openEditModal(cl)}
                                                                className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter inline-flex"
                                                                title="Edit Checklist"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => { setDeleteId(cl.id); setIsDeleteModalOpen(true); }}
                                                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter inline-flex"
                                                                title="Delete Checklist"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter">
                                                No checklists discovered in the project vault.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* â”€â”€ Pagination Controls â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    {filteredChecklists.length > 0 && (
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
                                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredChecklists.length)} of {filteredChecklists.length} records
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
                                    const totalItems = filteredChecklists.length;
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
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredChecklists.length / itemsPerPage), prev + 1))}
                                    disabled={currentPage === Math.max(1, Math.ceil(filteredChecklists.length / itemsPerPage)) || filteredChecklists.length === 0}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* â”€â”€ MODALS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

            {/* Modal 1: New Checklist */}
            <Modal
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                title="Initiate Technical Protocol"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button onClick={() => setIsNewModalOpen(false)} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter">Cancel</button>
                        <button
                            onClick={handleCreateChecklist}
                            disabled={isSubmitting}
                            className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : "Commit Protocol"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-8 font-inter">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <Activity className="w-4 h-4 text-primary" />
                            Protocol Intelligence Profile
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                            <div className="font-inter md:col-span-2">
                                <label className={labelClasses}>Project Context <span className="text-rose-500">*</span></label>
                                <select
                                    value={newChecklistProjectId}
                                    onChange={(e) => setNewChecklistProjectId(e.target.value)}
                                    className={inputClasses}
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => (
                                        <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                            {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Descriptive Title <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={newChecklistName}
                                    onChange={(e) => setNewChecklistName(e.target.value)}
                                    placeholder="e.g. Foundation Pouring Protocol"
                                    className={inputClasses}
                                />
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Domain Category <span className="text-rose-500">*</span></label>
                                <select
                                    value={newChecklistType}
                                    onChange={(e) => setNewChecklistType(e.target.value)}
                                    className={inputClasses}
                                >
                                    <option value="Daily Checklist">Daily Checklist</option>
                                    <option value="Activity Checklist">Activity Checklist</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            Verification Points Matrix
                        </h3>
                        <div className="flex gap-3 mb-6 font-inter">
                            <input
                                type="text"
                                value={tempItemText}
                                onChange={(e) => setTempItemText(e.target.value)}
                                placeholder="Enter technical verification point..."
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all font-inter"
                            />
                            <button
                                type="button"
                                onClick={addTempItem}
                                className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 font-inter"
                            >
                                ADD ITEM
                            </button>
                        </div>

                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar font-inter">
                            {newChecklistItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group/item hover:bg-blue-50 hover:border-blue-100 transition-all font-inter">
                                    <div className="flex items-center gap-4 font-inter">
                                        <div className="w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center text-[10px] font-bold font-inter">{idx + 1}</div>
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight font-inter">{item}</span>
                                    </div>
                                    <button
                                        onClick={() => setNewChecklistItems(prev => prev.filter((_, i) => i !== idx))}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-white rounded-xl transition-all font-inter"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {newChecklistItems.length === 0 && (
                                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-2xl font-inter">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">No verification points added. Minimum 1 required.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal 1.5: Edit Checklist */}
            <Modal
                isOpen={isEditChecklistModalOpen}
                onClose={() => setIsEditChecklistModalOpen(false)}
                title="Update Technical Protocol"
                maxWidth="max-w-xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button onClick={() => setIsEditChecklistModalOpen(false)} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter">Cancel</button>
                        <button
                            onClick={handleUpdateChecklist}
                            disabled={isSubmitting}
                            className="flex-[2] py-3 bg-primary text-white rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : "Update Protocol"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-8 font-inter">
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                            <Edit3 className="w-4 h-4 text-primary" />
                            Update Intelligence Profile
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                            <div className="font-inter md:col-span-2">
                                <label className={labelClasses}>Project Context <span className="text-rose-500">*</span></label>
                                <select
                                    value={editChecklistProjectId}
                                    onChange={(e) => setEditChecklistProjectId(e.target.value)}
                                    className={inputClasses}
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => (
                                        <option key={p.id || p.project_id} value={p.id || p.project_id}>
                                            {p.name || p.project_name || `Project #${p.id || p.project_id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="font-inter md:col-span-2">
                                <label className={labelClasses}>Descriptive Title <span className="text-rose-500">*</span></label>
                                <input
                                    type="text"
                                    value={editChecklistName}
                                    onChange={(e) => setEditChecklistName(e.target.value)}
                                    placeholder="e.g. Foundation Pouring Protocol"
                                    className={inputClasses}
                                />
                            </div>
                            <div className="font-inter md:col-span-2">
                                <label className={labelClasses}>Description</label>
                                <textarea
                                    rows={3}
                                    value={editChecklistDescription}
                                    onChange={(e) => setEditChecklistDescription(e.target.value)}
                                    placeholder="e.g. Verification steps for the foundation..."
                                    className={inputClasses + " resize-none"}
                                />
                            </div>
                            <div className="font-inter">
                                <label className={labelClasses}>Status</label>
                                <select
                                    value={editChecklistIsActive ? "true" : "false"}
                                    onChange={(e) => setEditChecklistIsActive(e.target.value === "true")}
                                    className={inputClasses}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal 2: Manage Items */}
            <Modal
                isOpen={isAddItemModalOpen}
                onClose={() => setIsAddItemModalOpen(false)}
                title="Manage Verification Points"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button onClick={() => setIsAddItemModalOpen(false)} className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-all font-inter">Done</button>
                    </div>
                }
            >
                <div className="p-6 font-inter space-y-6">
                    {/* Add Item Form */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex gap-3">
                        <input
                            type="text"
                            value={addItemText}
                            onChange={(e) => setAddItemText(e.target.value)}
                            placeholder="Add new verification point..."
                            className={inputClasses}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddItem(e as any);
                            }}
                        />
                        <button
                            onClick={handleAddItem}
                            disabled={isSubmitting || !addItemText.trim()}
                            className="px-6 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 font-inter whitespace-nowrap"
                        >
                            {isSubmitting && addItemText.trim() ? "Adding..." : "Add Point"}
                        </button>
                    </div>

                    {/* Existing Items List */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Existing Points</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {isFetchingItems ? (
                                <div className="py-8 text-center text-slate-400 text-sm font-semibold">Loading points...</div>
                            ) : currentChecklistItems.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-sm font-semibold">No points found. Add one above.</div>
                            ) : (
                                currentChecklistItems.map((item, idx) => (
                                    <div key={item.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-100 transition-all font-inter">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-6 h-6 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</div>
                                            {editingItemId === item.id ? (
                                                <input
                                                    type="text"
                                                    value={editItemText}
                                                    onChange={(e) => setEditItemText(e.target.value)}
                                                    className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateItem(item.id);
                                                        if (e.key === 'Escape') setEditingItemId(null);
                                                    }}
                                                />
                                            ) : (
                                                <span className="text-sm font-semibold text-slate-700">{item.item}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            {editingItemId === item.id ? (
                                                <>
                                                    <button onClick={() => handleUpdateItem(item.id)} disabled={isSubmitting} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Save"><Save className="w-4 h-4" /></button>
                                                    <button onClick={() => setEditingItemId(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-all" title="Cancel"><X className="w-4 h-4" /></button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => { setEditingItemId(item.id); setEditItemText(item.item); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteItem(item.id)} disabled={isSubmitting} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal 2.5: View Items */}
            <Modal
                isOpen={isViewItemsModalOpen}
                onClose={() => setIsViewItemsModalOpen(false)}
                title="View Verification Points"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button onClick={() => setIsViewItemsModalOpen(false)} className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter">Close</button>
                    </div>
                }
            >
                <div className="p-6 font-inter space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Points for {selectedChecklist?.name}</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto custom-scrollbar p-2 space-y-2">
                            {isFetchingItems ? (
                                <div className="py-8 text-center text-slate-400 text-sm font-semibold">Loading points...</div>
                            ) : currentChecklistItems.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-sm font-semibold">No points found.</div>
                            ) : (
                                currentChecklistItems.map((item, idx) => (
                                    <div key={item.id} className="flex items-center p-3 bg-white border border-slate-100 rounded-xl font-inter hover:bg-slate-50 transition-all">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="w-6 h-6 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0">{idx + 1}</div>
                                            <span className="text-sm font-semibold text-slate-700">{item.item}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal 3: Execute Checklist */}
            <Modal
                isOpen={isExecuteModalOpen}
                onClose={() => setIsExecuteModalOpen(false)}
                title="Execute Field Audit"
                maxWidth="max-w-lg"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button onClick={() => setIsExecuteModalOpen(false)} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter">Cancel</button>
                        <button
                            onClick={handleExecuteChecklist}
                            disabled={isSubmitting}
                            className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : "Commit Field Audit"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-8 font-inter">
                    <div className="p-6 bg-primary rounded-2xl border border-primary/20 text-white shadow-2xl relative overflow-hidden font-inter">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="relative z-10 font-inter">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 font-inter">Active Protocol Execution</p>
                            <p className="text-lg font-bold tracking-tight font-inter">{selectedChecklist?.name}</p>
                        </div>
                    </div>

                    <div className="font-inter">
                        <label className={labelClasses}>Operational Compliance Status</label>
                        <div className="flex gap-3 font-inter">
                            {["Done", "Pending"].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setExecuteStatus(s as any)}
                                    className={`flex-1 py-4 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border font-inter ${executeStatus === s
                                        ? (s === "Done" ? "bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-200 scale-[1.02]" : "bg-amber-500 border-yellow-500 text-white shadow-xl shadow-yellow-200 scale-[1.02]")
                                        : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                                        }`}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="font-inter">
                        <label className={labelClasses}>
                            Field Audit Intelligence Remarks <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                            rows={4}
                            value={executeRemarks}
                            onChange={(e) => {
                                setExecuteRemarks(e.target.value);
                                if (e.target.value.trim()) setExecuteError(false);
                            }}
                            placeholder="Describe technical observations, deviations, or site confirmations..."
                            className={`${inputClasses} resize-none font-bold ${executeError ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}`}
                        />
                        {executeError && <p className="text-xs text-rose-500 mt-1.5 font-bold font-inter">Remarks are required to commit the audit.</p>}
                    </div>
                </div>
            </Modal>

            {/* Modal 4: Confirm Delete */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Discard Technical Protocol"
                message="Are you sure you want to discard this technical protocol from the project vault? This operation will permanently archive all verification history."
                confirmText="Discard Protocol"
                type="danger"
            />
        </>
    );
};

export default ChecklistsPage;
