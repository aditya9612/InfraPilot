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
  Clock,
  PlusSquare,
  ClipboardList
} from "lucide-react";

import { checklistService } from "../../../services/checklistService";
import type { ChecklistItem, ChecklistLog } from "../../../services/checklistService";

const ChecklistsPage = () => {
    // Core Data States
    const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
    const [logs, setLogs] = useState<ChecklistLog[]>([]);
    const [activeTab, setActiveTab] = useState<"Daily Checklist" | "Activity Checklist">("Daily Checklist");
    const [projectId] = useState<number>(36); // Re-aligned with project-specific scope 36
    
    // UI States
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Modal Visibility States
    const [isNewModalOpen, setIsNewModalOpen] = useState(false);
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    // Selection / Form States
    const [selectedChecklist, setSelectedChecklist] = useState<ChecklistItem | null>(null);
    const [newChecklistName, setNewChecklistName] = useState("");
    const [newChecklistType, setNewChecklistType] = useState("Safety");
    const [newChecklistItems, setNewChecklistItems] = useState<string[]>([]);
    const [tempItemText, setTempItemText] = useState("");
    const [addItemText, setAddItemText] = useState("");
    const [executeStatus, setExecuteStatus] = useState<"Done" | "Pending">("Done");
    const [executeRemarks, setExecuteRemarks] = useState("");
    const [deleteId, setDeleteId] = useState<number | null>(null);

    // ─── INITIALIZATION ──────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            console.log(`Fetching Data for Project: ${projectId}`);
            const [clRes, logsRes] = await Promise.all([
                checklistService.listChecklists(),
                checklistService.listLogs(projectId)
            ]);
            setChecklists(clRes);
            setLogs(logsRes.items || []);
            console.log("Data Sync Success (200 OK)");
        } catch (err) {
            toast.error("Failed to sync checklist vault");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ─── ACTIONS ─────────────────────────────────────────────────────────

    const handleCreateChecklist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChecklistName.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Create Checklist
            const created = await checklistService.createChecklist({
                project_id: projectId,
                name: newChecklistName,
                type: newChecklistType
            });

            // 2. Add Items in loop
            for (const item of newChecklistItems) {
                await checklistService.addItem({
                    checklist_id: created.id,
                    item: item
                });
            }

            toast.success("Checklist created successfully!");
            setIsNewModalOpen(false);
            setNewChecklistName("");
            setNewChecklistItems([]);
            fetchData();
        } catch (err) {
            toast.error("Failed to create checklist");
        } finally {
            setIsSubmitting(false);
        }
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
            setIsAddItemModalOpen(false);
            setAddItemText("");
            fetchData();
        } catch (err) {
            toast.error("Failed to add item");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExecuteChecklist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!executeRemarks.trim() || !selectedChecklist) {
            toast.error("Remarks are required");
            return;
        }

        setIsSubmitting(true);
        try {
            await checklistService.executeChecklist({
                project_id: projectId,
                checklist_id: selectedChecklist.id,
                status: executeStatus,
                remarks: executeRemarks
            });
            toast.success("Checklist executed successfully!");
            setIsExecuteModalOpen(false);
            setExecuteRemarks("");
            fetchData();
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
            toast.success("Checklist deleted successfully!");
            setIsDeleteModalOpen(false);
            setDeleteId(null);
            fetchData();
        } catch (err) {
            toast.error("Failed to delete checklist");
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── HELPERS ─────────────────────────────────────────────────────────

    const filteredChecklists = useMemo(() => {
        return checklists.filter(c => c.type === activeTab);
    }, [checklists, activeTab]);

    const addTempItem = () => {
        if (tempItemText.trim()) {
            setNewChecklistItems(prev => [...prev, tempItemText.trim()]);
            setTempItemText("");
        }
    };

    // ─── RENDER ──────────────────────────────────────────────────────────

    return (
        <>
            <Navbar title="Checklists" breadcrumb={["Engineer", "Execution", "Checklists"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header Row ────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Checklists</h1>
                        <p className="text-slate-500 text-sm">Manage daily and activity checklists</p>
                    </div>
                    <button
                        onClick={() => setIsNewModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Checklist
                    </button>
                </div>

                {/* ── Tab Bar ────────────────────────────────────────────── */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8 overflow-x-auto scrollbar-hide">
                    {["Daily Checklist", "Activity Checklist"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 text-sm font-bold transition-all relative whitespace-nowrap ${
                                activeTab === tab ? "text-primary" : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            {tab}
                            {activeTab === tab && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full" />
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Checklist Cards Grid ──────────────────────────────── */}
                {isLoading ? (
                    <div className="py-20 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing checklists...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {filteredChecklists.map((cl) => (
                            <div key={cl.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-primary transition-colors leading-tight mb-1">{cl.name}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                            cl.type === "Daily Checklist" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"
                                        }`}>
                                            {cl.type === "Daily Checklist" ? "Daily" : "Activity"}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                                            <ClipboardList className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-600">Items Sync</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                        <span>Status</span>
                                        <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 rounded-lg">Pending</span>
                                    </div>
                                    <p className="text-[11px] text-slate-400 italic line-clamp-1">No recent remarks recorded.</p>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => { setSelectedChecklist(cl); setIsAddItemModalOpen(true); }}
                                        className="flex flex-col items-center gap-1 p-2 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-primary rounded-xl transition-all"
                                    >
                                        <PlusSquare className="w-4 h-4" />
                                        <span className="text-[9px] font-bold uppercase">Add Item</span>
                                    </button>
                                    <button 
                                        onClick={() => { setSelectedChecklist(cl); setIsExecuteModalOpen(true); }}
                                        className="flex flex-col items-center gap-1 p-2 bg-primary hover:bg-blue-600 text-white rounded-xl transition-all shadow-lg shadow-primary/10"
                                    >
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-[9px] font-bold uppercase">Execute</span>
                                    </button>
                                    <button 
                                        onClick={() => { setDeleteId(cl.id); setIsDeleteModalOpen(true); }}
                                        className="flex flex-col items-center gap-1 p-2 bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        <span className="text-[9px] font-bold uppercase">Delete</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredChecklists.length === 0 && (
                            <div className="col-span-full py-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm italic font-inter italic-none">No {activeTab}s registered yet.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Execution Logs Section ────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-50">
                        <h2 className="text-lg font-bold text-slate-800">Execution Logs</h2>
                        <p className="text-xs text-slate-400">Historical performance data for all checklists</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">Checklist Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Remarks</th>
                                    <th className="px-6 py-4 text-right">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-800">
                                                    {checklists.find(c => c.id === log.checklist_id)?.name || "Ref: #" + log.checklist_id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    log.status === 'Done' ? 'bg-emerald-100 text-emerald-600' : 'bg-yellow-100 text-yellow-600'
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 italic line-clamp-1 max-w-xs">
                                                {log.remarks}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5 text-xs font-medium text-slate-400">
                                                    <Clock className="w-3 h-3" />
                                                    {log.created_at ? new Date(log.created_at).toLocaleDateString() : "Just now"}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm italic">
                                            No execution history found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            {/* ── MODALS ────────────────────────────────────────────────── */}

            {/* Modal 1: New Checklist */}
            <Modal
                isOpen={isNewModalOpen}
                onClose={() => setIsNewModalOpen(false)}
                title="Create New Checklist"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsNewModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                        <button 
                            onClick={handleCreateChecklist}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isSubmitting ? "Creating..." : "Create Checklist"}
                        </button>
                    </div>
                }
            >
                <div className="space-y-6 p-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Checklist Name</label>
                            <input 
                                type="text" 
                                value={newChecklistName}
                                onChange={(e) => setNewChecklistName(e.target.value)}
                                placeholder="e.g. Foundation Pouring"
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Category</label>
                             <select 
                                value={newChecklistType}
                                onChange={(e) => setNewChecklistType(e.target.value)}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            >
                                <option value="Safety">Safety</option>
                                <option value="Quality">Quality</option>
                                <option value="Daily Checklist">Daily Checklist</option>
                                <option value="Activity Checklist">Activity Checklist</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Add Verification Points</label>
                        <div className="flex gap-2 mb-4">
                            <input 
                                type="text" 
                                value={tempItemText}
                                onChange={(e) => setTempItemText(e.target.value)}
                                placeholder="Enter task..."
                                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white transition-all"
                            />
                            <button 
                                type="button"
                                onClick={addTempItem}
                                className="px-4 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-all"
                            >
                                Add Item
                            </button>
                        </div>
                        
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            {newChecklistItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold">{idx + 1}</div>
                                        <span className="text-sm font-semibold text-slate-700">{item}</span>
                                    </div>
                                    <button 
                                        onClick={() => setNewChecklistItems(prev => prev.filter((_, i) => i !== idx))}
                                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {newChecklistItems.length === 0 && (
                                <p className="text-center py-8 text-xs text-slate-400 italic">No items added yet. Minimum 1 required.</p>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal 2: Add Item */}
            <Modal
                isOpen={isAddItemModalOpen}
                onClose={() => setIsAddItemModalOpen(false)}
                title="Append Verification Point"
                maxWidth="max-w-md"
                footer={
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsAddItemModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                        <button 
                            onClick={handleAddItem}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 disabled:opacity-50"
                        >
                            {isSubmitting ? "Adding..." : "Add Item"}
                        </button>
                    </div>
                }
            >
                <div className="p-1">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Verification Task</label>
                    <input 
                        type="text" 
                        value={addItemText}
                        onChange={(e) => setAddItemText(e.target.value)}
                        placeholder="e.g. Check for air bubbles"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                </div>
            </Modal>

            {/* Modal 3: Execute Checklist */}
            <Modal
                isOpen={isExecuteModalOpen}
                onClose={() => setIsExecuteModalOpen(false)}
                title="Execute Audit"
                maxWidth="max-w-lg"
                footer={
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setIsExecuteModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                        <button 
                            onClick={handleExecuteChecklist}
                            disabled={isSubmitting}
                            className="px-8 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50"
                        >
                            {isSubmitting ? "Submitting..." : "Submit Audit"}
                        </button>
                    </div>
                }
            >
                <div className="space-y-6 p-1">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Checklist</p>
                        <p className="text-sm font-bold text-slate-800">{selectedChecklist?.name}</p>
                    </div>
                    
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Compliance Status</label>
                        <div className="flex gap-2">
                            {["Done", "Pending"].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setExecuteStatus(s as any)}
                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all border ${
                                        executeStatus === s 
                                            ? (s === "Done" ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-yellow-500 border-yellow-500 text-white shadow-lg shadow-yellow-100") 
                                            : "bg-white border-slate-200 text-slate-400"
                                    }`}
                                >
                                    {s.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Execution Remarks</label>
                        <textarea 
                            rows={4}
                            value={executeRemarks}
                            onChange={(e) => setExecuteRemarks(e.target.value)}
                            placeholder="Describe findings, deviations, or confirmations..."
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                        />
                    </div>
                </div>
            </Modal>

            {/* Modal 4: Confirm Delete */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Purge Checklist"
                message="Are you sure you want to delete this checklist? This action will permanently remove all associated tasks and historical logs."
                confirmText={isSubmitting ? "Purging..." : "Delete Permanently"}
                type="danger"
            />
        </>
    );
};

export default ChecklistsPage;
