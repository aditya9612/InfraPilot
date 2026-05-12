import { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  Plus, 
  Trash2,
  CheckCircle2,
  PlusSquare,
  ClipboardList,
  Search,
  Activity,
  AlertCircle,
  FileText,
  RotateCcw,
  Layout,
  Layers
} from "lucide-react";

import { checklistService } from "../../../services/checklistService";
import type { ChecklistItem, ChecklistLog } from "../../../services/checklistService";

const typeColors: Record<string, string> = {
    "Daily Checklist": "bg-blue-50 text-blue-600 border-blue-100",
    "Safety": "bg-rose-50 text-rose-600 border-rose-100",
    "Quality": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "Activity Checklist": "bg-purple-50 text-purple-600 border-purple-100",
};

const ChecklistsPage = () => {
    // Core Data States
    const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
    const [logs, setLogs] = useState<ChecklistLog[]>([]);
    const [activeTab, setActiveTab] = useState<"Daily Checklist" | "Activity Checklist" | "Safety" | "Quality">("Daily Checklist");
    const [projectId, setProjectId] = useState<number>(36);
    
    // UI States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Pending" | "Done">("All");

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

    // Resolve Project ID
    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id || user?.id;
                if (pId) setProjectId(Number(pId));
            } catch (e) {
                console.error("Failed to resolve project ID", e);
            }
        }
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [clRes, logsRes] = await Promise.all([
                checklistService.listChecklists(),
                checklistService.listLogs(projectId)
            ]);
            setChecklists(clRes);
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
        if (!newChecklistName.trim()) {
            toast.error("Name is required");
            return;
        }

        setIsSubmitting(true);
        try {
            const created = await checklistService.createChecklist({
                project_id: projectId,
                name: newChecklistName,
                type: newChecklistType
            });

            for (const item of newChecklistItems) {
                await checklistService.addItem({
                    checklist_id: created.id,
                    item: item
                });
            }

            toast.success("Checklist created successfully!");
            setChecklists(prev => [created, ...prev]);
            setIsNewModalOpen(false);
            setNewChecklistName("");
            setNewChecklistItems([]);
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
            const response = await checklistService.executeChecklist({
                project_id: projectId,
                checklist_id: selectedChecklist.id,
                status: executeStatus,
                remarks: executeRemarks
            });
            toast.success("Checklist executed successfully!");
            setLogs(prev => [response, ...prev]);
            setIsExecuteModalOpen(false);
            setExecuteRemarks("");
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
            setChecklists(prev => prev.filter(c => c.id !== deleteId));
            setLogs(prev => prev.filter(l => l.checklist_id !== deleteId));
            setIsDeleteModalOpen(false);
            setDeleteId(null);
        } catch (err) {
            toast.error("Failed to delete checklist");
        } finally {
            setIsSubmitting(false);
        }
    };

    const stats = useMemo(() => {
        const total = checklists.length;
        const executed = logs.length;
        const done = logs.filter(l => l.status === "Done").length;
        const pending = total - done;

        return {
            total,
            executed,
            done,
            pending,
            compliance: Math.round((done / (total || 1)) * 100)
        };
    }, [checklists, logs]);

    const filteredLogs = useMemo(() => {
        let data = logs;

        // Apply StatCard Filter
        if (activeStatFilter === "Done") {
          data = data.filter(l => l.status === "Done");
        } else if (activeStatFilter === "Pending") {
          data = data.filter(l => l.status === "Pending");
        }

        return data.filter(log => {
            const checklistName = checklists.find(c => c.id === log.checklist_id)?.name || "";
            return checklistName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   log.remarks.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [logs, checklists, searchTerm, activeStatFilter]);

    const addTempItem = () => {
        if (tempItemText.trim()) {
            setNewChecklistItems(prev => [...prev, tempItemText.trim()]);
            setTempItemText("");
        }
    };

    const labelClasses = "block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";
    const inputClasses = "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter";

    return (
        <>
            <Navbar title="Checklists" breadcrumb={["Engineer", "Execution", "Checklist Vault"]} />

            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none font-inter">Checklist Intelligence Ledger</h1>
                        <p className="text-slate-500 text-sm italic-none font-inter">Systematic verification protocols and site execution logs.</p>
                    </div>
                    <button
                        onClick={() => setIsNewModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                    >
                        <Plus className="w-4 h-4" />
                        New Checklist
                    </button>
                </div>

                {/* ── Interactive Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-slate-800 bg-slate-100 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Total Vault"
                          value={stats.total.toString()}
                          sub="Protocols Logged"
                          accent="text-slate-800"
                          icon={<Layers className={`w-5 h-5 ${activeStatFilter === "All" ? "text-slate-800 scale-110" : "text-slate-400 group-hover:text-slate-800"} transition-all`} />}
                      />
                    </div>
                    <div onClick={() => setActiveStatFilter("Done")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Done" ? "ring-2 ring-emerald-500 bg-emerald-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Compliance"
                          value={`${stats.compliance}%`}
                          sub="Audit Success"
                          accent="text-emerald-500"
                          icon={<CheckCircle2 className={`w-5 h-5 ${activeStatFilter === "Done" ? "text-emerald-500 scale-110" : "text-slate-400 group-hover:text-emerald-500"} transition-all`} />}
                      />
                    </div>
                    <div onClick={() => setActiveStatFilter("Pending")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Pending" ? "ring-2 ring-rose-500 bg-rose-50 shadow-md scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Pending Audits"
                          value={stats.pending.toString()}
                          sub="Attention Required"
                          accent="text-rose-500"
                          icon={<AlertCircle className={`w-5 h-5 ${activeStatFilter === "Pending" ? "text-rose-500 scale-110" : "text-slate-400 group-hover:text-rose-500"} transition-all`} />}
                      />
                    </div>
                    <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
                      <StatCard
                          title="Global Health"
                          value="94%"
                          sub="Process Momentum"
                          accent="text-blue-500"
                          icon={<Activity className="w-5 h-5 text-blue-500" />}
                      />
                    </div>
                </div>

                {/* ── Tab Selector ────────────────────────────────────────────── */}
                <div className="flex items-center gap-8 border-b border-slate-200 mb-8 overflow-x-auto scrollbar-hide font-inter">
                    {["Daily Checklist", "Activity Checklist", "Safety", "Quality"].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative whitespace-nowrap font-inter ${
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

                {/* ── Protocols Registry ──────────────────────────────── */}
                <div className="mb-12 font-inter">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 font-inter">
                      {checklists.filter(c => c.type === activeTab).map((cl) => (
                          <div key={cl.id} className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 group relative overflow-hidden font-inter">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-primary/10 transition-colors" />
                              
                              <div className="flex items-start justify-between mb-8 relative z-10 font-inter">
                                  <div className="flex-1 font-inter">
                                      <h3 className="text-lg font-black text-slate-800 group-hover:text-primary transition-colors leading-tight mb-2 font-inter italic-none">{cl.name}</h3>
                                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border font-inter ${typeColors[cl.type] || "bg-slate-50 text-slate-400"}`}>
                                          {cl.type}
                                      </span>
                                  </div>
                                  <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-primary group-hover:text-white transition-all duration-500 font-inter">
                                    <ClipboardList className="w-5 h-5" />
                                  </div>
                              </div>

                              <div className="space-y-6 mb-8 relative z-10 font-inter">
                                  <div className="flex items-center justify-between font-inter">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Intelligence Domain</span>
                                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest font-inter">VERIFIED VAULT</span>
                                  </div>
                                  <div className="flex items-center justify-between font-inter">
                                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Reference Hash</span>
                                      <span className="text-[10px] font-black text-primary uppercase tracking-widest font-inter">LOG-#{cl.id}</span>
                                  </div>
                              </div>

                              <div className="grid grid-cols-3 gap-3 relative z-10 font-inter">
                                  <button 
                                      onClick={() => { setSelectedChecklist(cl); setIsAddItemModalOpen(true); }}
                                      className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-primary rounded-2xl transition-all font-inter active:scale-95 border border-slate-100"
                                      title="Add Item"
                                  >
                                      <PlusSquare className="w-4 h-4" />
                                      <span className="text-[9px] font-black uppercase tracking-widest">Append</span>
                                  </button>
                                  <button 
                                      onClick={() => { setSelectedChecklist(cl); setIsExecuteModalOpen(true); }}
                                      className="flex flex-col items-center gap-2 p-3 bg-primary text-white rounded-2xl transition-all shadow-lg shadow-primary/20 hover:bg-blue-600 font-inter active:scale-95"
                                      title="Execute Audit"
                                  >
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span className="text-[9px] font-black uppercase tracking-widest">Audit</span>
                                  </button>
                                  <button 
                                      onClick={() => { setDeleteId(cl.id); setIsDeleteModalOpen(true); }}
                                      className="flex flex-col items-center gap-2 p-3 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all font-inter active:scale-95 border border-slate-100"
                                      title="Archive"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                      <span className="text-[9px] font-black uppercase tracking-widest">Discard</span>
                                  </button>
                              </div>
                          </div>
                      ))}
                      {checklists.filter(c => c.type === activeTab).length === 0 && (
                          <div className="col-span-full py-32 text-center bg-white rounded-[2rem] border-4 border-dashed border-slate-50 font-inter">
                              <Layout className="w-16 h-16 mx-auto mb-6 text-slate-200" />
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic-none font-inter">No technical protocols discovered in the {activeTab} domain.</p>
                          </div>
                      )}
                  </div>
                </div>

                {/* ── Execution Intelligence Registry ────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
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
                        {activeStatFilter !== "All" && (
                          <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                    </div>
                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Protocol Identity</th>
                                    <th className="px-6 py-4 font-inter">Compliance Profile</th>
                                    <th className="px-6 py-4 font-inter">Intelligence Remarks</th>
                                    <th className="px-6 py-4 text-right font-inter">Audit Sequence</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex flex-col font-inter">
                                                  <span className="text-sm font-bold text-slate-800 font-inter italic-none">
                                                      {checklists.find(c => c.id === log.checklist_id)?.name || "Ref: #" + log.checklist_id}
                                                  </span>
                                                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-inter">LOG-#{log.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-inter">
                                                <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border font-inter ${
                                                    log.status === 'Done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 font-inter">
                                                <div className="flex items-center gap-2 font-inter max-w-xs">
                                                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                  <span className="text-xs font-bold text-slate-600 italic-none font-inter uppercase tracking-tight truncate">
                                                      {log.remarks}
                                                  </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-inter">
                                                <div className="flex flex-col items-end font-inter">
                                                  <span className="text-xs font-bold text-slate-800 font-inter italic-none">{log.created_at ? new Date(log.created_at).toLocaleDateString() : "Live Audit"}</span>
                                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-inter">Timestamp</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px] font-inter italic-none">
                                            No execution intelligence artifacts discovered in the project vault.
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
                title="Initiate Technical Protocol"
                maxWidth="max-w-2xl"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button onClick={() => setIsNewModalOpen(false)} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter">Cancel</button>
                        <button 
                            onClick={handleCreateChecklist}
                            disabled={isSubmitting}
                            className="flex-[2] py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : "Commit Protocol"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-8 font-inter">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
                          <Activity className="w-4 h-4 text-primary" />
                          Protocol Intelligence Profile
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
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
                                    <option value="Safety">Safety</option>
                                    <option value="Quality">Quality</option>
                                    <option value="Daily Checklist">Daily Checklist</option>
                                    <option value="Activity Checklist">Activity Checklist</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm font-inter">
                        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3 flex items-center gap-2 font-inter">
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
                                className="px-6 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 font-inter"
                            >
                                Append Point
                            </button>
                        </div>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar font-inter">
                            {newChecklistItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group/item hover:bg-blue-50 hover:border-blue-100 transition-all font-inter">
                                    <div className="flex items-center gap-4 font-inter">
                                        <div className="w-6 h-6 bg-primary text-white rounded-lg flex items-center justify-center text-[10px] font-black font-inter">{idx + 1}</div>
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-tight font-inter">{item}</span>
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
                                <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-[1.5rem] font-inter">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-inter">No verification points added. Minimum 1 required.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Modal 2: Add Item */}
            <Modal
                isOpen={isAddItemModalOpen}
                onClose={() => setIsAddItemModalOpen(false)}
                title="Append Intelligence Point"
                maxWidth="max-w-md"
                footer={
                    <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                        <button onClick={() => setIsAddItemModalOpen(false)} className="flex-1 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all font-inter">Cancel</button>
                        <button 
                            onClick={handleAddItem}
                            disabled={isSubmitting}
                            className="flex-[2] py-3 bg-primary text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : "Append Point"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 font-inter">
                    <label className={labelClasses}>New Technical Verification Point</label>
                    <input 
                        type="text" 
                        value={addItemText}
                        onChange={(e) => setAddItemText(e.target.value)}
                        placeholder="e.g. Verify aggregate compaction ratio"
                        className={inputClasses}
                    />
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
                            className="flex-[2] py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 font-inter"
                        >
                            {isSubmitting ? "Syncing..." : "Commit Field Audit"}
                        </button>
                    </div>
                }
            >
                <div className="p-6 space-y-8 font-inter">
                    <div className="p-6 bg-slate-900 rounded-[1.5rem] border border-slate-800 text-white shadow-2xl relative overflow-hidden font-inter">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="relative z-10 font-inter">
                          <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] mb-2 font-inter">Active Protocol Execution</p>
                          <p className="text-lg font-black tracking-tight font-inter italic-none">{selectedChecklist?.name}</p>
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
                                    className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border font-inter ${
                                        executeStatus === s 
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
                        <label className={labelClasses}>Field Audit Intelligence Remarks</label>
                        <textarea 
                            rows={4}
                            value={executeRemarks}
                            onChange={(e) => setExecuteRemarks(e.target.value)}
                            placeholder="Describe technical observations, deviations, or site confirmations..."
                            className={`${inputClasses} resize-none font-bold`}
                        />
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
