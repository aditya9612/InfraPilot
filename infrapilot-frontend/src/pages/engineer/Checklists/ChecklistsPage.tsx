import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChecklistItem {
    id: string;
    task: string;
    status: "Done" | "Pending";
}

interface ChecklistRecord {
    id: string;
    checklist_name: string;
    item_list: ChecklistItem[];
    status: "Done" | "Pending";
    remarks: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const checklistHistory: ChecklistRecord[] = [
    {
        id: "CHK-901",
        checklist_name: "Site Opening Inventory Check",
        item_list: [
            { id: "1", task: "Security Guard Presence", status: "Done" },
            { id: "2", task: "Logbooks Updated", status: "Done" },
            { id: "3", task: "Safety Gear Check", status: "Done" },
        ],
        status: "Done",
        remarks: "All morning protocols observed.",
    },
    {
        id: "CHK-902",
        checklist_name: "Column Reinforcement Verification",
        item_list: [
            { id: "1", task: "Steel Grade Verification", status: "Done" },
            { id: "2", task: "Spacing as per GFC", status: "Done" },
            { id: "3", task: "Binding Wire Tightness", status: "Pending" },
        ],
        status: "Pending",
        remarks: "Binding wire checks pending for Wing C columns.",
    },
];

const initialFormData = {
    checklist_name: "",
    remarks: "",
};

// ─── Profile Field Helper ──────────────────────────────────────────────────────


// ─── Main Component ─────────────────────────────────────────────────────────────

const ChecklistsPage = () => {
    const [checklistData, setChecklistData] = useState<ChecklistRecord[]>(checklistHistory);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [editId, setEditId] = useState<string | null>(null);
    const [selectedChecklist, setSelectedChecklist] = useState<ChecklistRecord | null>(null);
    const [formData, setFormData] = useState(initialFormData);
    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [newItemTask, setNewItemTask] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("All Status");

    // Summary stats
    const totalChecks = checklistData.length;
    const completedCount = checklistData.filter(c => c.status === "Done").length;
    const pendingCount = checklistData.filter(c => c.status === "Pending").length;

    // ── Interaction Handlers ───────────────────────────────────────────────────
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const addItem = () => {
        if (!newItemTask.trim()) return;
        setItems(prev => [
            ...prev,
            { id: Math.random().toString(36).substr(2, 9), task: newItemTask.trim(), status: "Pending" }
        ]);
        setNewItemTask("");
        if (errors.items) setErrors(prev => { const u = { ...prev }; delete u.items; return u; });
    };

    const toggleItemStatus = (id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, status: item.status === "Done" ? "Pending" : "Done" } : item
        ));
    };

    const deleteItem = (id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!formData.checklist_name.trim()) errs.checklist_name = "Name is required";
        if (items.length === 0) errs.items = "Add at least one verification point";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleOpenCreate = () => {
        setFormMode("create");
        setFormData(initialFormData);
        setItems([]);
        setErrors({});
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (record: ChecklistRecord) => {
        setFormMode("edit");
        setEditId(record.id);
        setFormData({
            checklist_name: record.checklist_name,
            remarks: record.remarks,
        });
        setItems([...record.item_list]);
        setErrors({});
        setIsFormModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Are you sure you want to delete this checklist log?")) {
            setChecklistData(prev => prev.filter(c => c.id !== id));
            toast.success("Checklist deleted");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please provide all required verification details.");
            return;
        }

        const doneCount = items.filter(i => i.status === "Done").length;
        const status = doneCount === items.length ? "Done" : "Pending";

        const entryData: ChecklistRecord = {
            id: formMode === "edit" ? editId! : `CHK-${900 + checklistData.length + 1}`,
            ...formData,
            item_list: [...items],
            status,
        };

        if (formMode === "edit") {
            setChecklistData(prev => prev.map(c => c.id === editId ? entryData : c));
            toast.success("Checklist updated successfully");
        } else {
            setChecklistData(prev => [entryData, ...prev]);
            toast.success("New checklist initiated!");
        }
        setIsFormModalOpen(false);
    };

    const filteredList = useMemo(() => {
        return checklistData.filter(item => {
            const matchesStatus = filterStatus === "All Status" || item.status === filterStatus;
            const matchesSearch = item.checklist_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [checklistData, searchTerm, filterStatus]);

    return (
        <>
            <Navbar
                title="Operational Checklists"
                breadcrumb={["InfraPilot", "Engineer", "Checklists"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-inter">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">
                            Compliance & Quality Assurance
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Checklists Vault
                        </h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl font-inter">
                            Standardized verification logs for site openings and activity-specific quality inspections.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                        <button
                            onClick={handleOpenCreate}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                        >
                            <span className="text-lg leading-none font-inter">+</span>
                            Create New Checklist
                        </button>
                    </div>
                </div>

                {/* ── Summary Stat Cards (Activity Style) ────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        Checklist Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Logs</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{totalChecks}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Verification Archives</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Compliant</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">{completedCount}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Verified Done</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter relative overflow-hidden group">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">In Progress</p>
                            <p className="text-2xl font-bold text-rose-500 font-inter">{pendingCount}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Action Required</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Last Activity</p>
                            <p className="text-2xl font-bold text-blue-600 font-inter italic-none">Today</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Latest Log Entry</p>
                        </div>
                    </div>
                </div>

                {/* ── Tabular Ledger (Tabular View) ───────────────────────────────── */}
                <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 overflow-hidden font-inter text-inter text-slate-800 mb-20">

                    {/* Filter Bar (Activity Style) */}
                    <div className="p-4 md:p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by Project or Checklist ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-3 font-inter">
                            <div className="relative font-inter">
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all cursor-pointer font-inter"
                                >
                                    <option value="All Status">All Status</option>
                                    <option value="Done">Verified Done</option>
                                    <option value="Pending">Pending Audit</option>
                                </select>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 font-inter">
                        {filteredList.map((item) => (
                            <div key={item.id} className="group bg-white rounded-3xl border border-slate-100 p-6 shadow-sm hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-500 relative flex flex-col font-inter">
                                <div className="flex items-start justify-between mb-4 font-inter">
                                    <div className="font-inter">
                                        <div className="flex items-center gap-2 mb-1 font-inter">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] font-inter">Registry ID: {item.id}</p>
                                        </div>
                                        <h3 className="text-base font-black text-slate-800 tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors font-inter uppercase-none">
                                            {item.checklist_name}
                                        </h3>
                                    </div>
                                    <span className={`px-3 py-1 text-[9px] font-black rounded-lg border font-inter whitespace-nowrap uppercase tracking-widest ${item.status === "Done" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                                        {item.status}
                                    </span>
                                </div>

                                <div className="space-y-4 mb-6 flex-1 font-inter">
                                    <div className="flex items-center justify-between py-3 border-y border-slate-50 font-inter">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter">Verification Pts</span>
                                        <div className="text-right font-inter">
                                            <p className="text-xs font-black text-slate-800 tabular-nums font-inter">{item.item_list.length} Checked</p>
                                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest font-inter">{item.item_list.filter(i => i.status === "Done").length} Verified</p>
                                        </div>
                                    </div>

                                    <div className="font-inter">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 font-inter text-center">Protocol Remarks</span>
                                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/50">
                                            <p className="text-[11px] font-medium text-slate-500 line-clamp-2 italic-none leading-relaxed font-inter">
                                                {item.remarks || "No additional technical remarks recorded."}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-50 font-inter">
                                    <button
                                        onClick={() => setSelectedChecklist(item)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all font-inter"
                                    >
                                        View Insight
                                    </button>
                                    <div className="flex items-center gap-2 font-inter">
                                        <button
                                            onClick={() => handleOpenEdit(item)}
                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all font-inter"
                                            title="Modify Record"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                            title="Delete Log"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PageTransition>

            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedChecklist}
                onClose={() => setSelectedChecklist(null)}
                title="Checklist Insight"
                maxWidth="max-w-2xl"
            >
                {selectedChecklist && (
                    <div className="bg-white p-6 italic-none font-inter text-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />

                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Compliance Record</p>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedChecklist.checklist_name}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                        <svg className="w-6 h-6 opacity-40" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Compliance Status</p>
                                        <p className="text-xl font-black">{selectedChecklist.status.toUpperCase()}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Verified Points</p>
                                        <p className="text-xl font-black tabular-nums">{selectedChecklist.item_list.filter(i => i.status === "Done").length} / {selectedChecklist.item_list.length}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Diagnostic Floor ──────────────────────────────── */}
                        <div className="space-y-8 mb-10 px-1">
                            {/* Verification Point List */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Item List (Verification Matrix)</p>
                                <div className="space-y-2.5 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedChecklist.item_list.map((point) => (
                                        <div key={point.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] shadow-sm ${point.status === "Done" ? "bg-emerald-500 text-white" : "bg-white border-2 border-slate-200 text-slate-300"}`}>
                                                    {point.status === "Done" ? "✓" : "!"}
                                                </div>
                                                <span className={`text-sm font-black transition-all ${point.status === "Done" ? "text-slate-800" : "text-slate-400 italic"}`}>{point.task}</span>
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${point.status === "Done" ? "text-emerald-500" : "text-rose-500"}`}>
                                                {point.status}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Remarks */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Technical Remarks</p>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-inter text-sm text-slate-600 leading-relaxed italic-none">
                                    {selectedChecklist.remarks || "No additional technical remarks recorded for this audit perspective."}
                                </div>
                            </div>

                            {/* Verified Asset Footer */}
                            <div className="pt-2">
                                <div className="flex items-center gap-5 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-emerald-900 mb-0.5 uppercase tracking-wide">Quality Benchmark Verification</p>
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Digitally Timestamped</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50 font-inter">
                            <button
                                onClick={() => setSelectedChecklist(null)}
                                className="flex-1 py-3 text-[11px] font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all font-inter"
                            >
                                Close Audit
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedChecklist);
                                    setSelectedChecklist(null);
                                }}
                                className="flex-[1.5] px-8 py-3 bg-primary text-white text-[13px] font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 justify-center active:scale-95 font-inter"
                            >
                                Modify Registry
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title={formMode === "create" ? "Create New Checklist" : "Modify Audit Definition"}
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-2 italic-none font-inter">
                    <form id="checklist-form" onSubmit={handleSubmit} className="p-8 space-y-12 text-inter">
                        {/* Section 1: Core Perspective */}
                        <section className="font-inter">
                            <div className="flex items-center gap-4 mb-8 font-inter">
                                <h3 className="text-[15px] font-bold text-slate-800 font-inter underline decoration-blue-500 decoration-2 underline-offset-8 uppercase">Core Perspective</h3>
                            </div>
                            <div className="flex flex-col gap-1.5 font-inter">
                                <label className="text-[13px] font-bold text-slate-700 font-inter">Checklist Name <span className="text-rose-500">*</span></label>
                                <input
                                    name="checklist_name"
                                    value={formData.checklist_name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Site Opening Inventory Check"
                                    className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.checklist_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
                                {errors.checklist_name && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.checklist_name}</p>}
                            </div>
                        </section>

                        {/* Section 2: Verification Matrix */}
                        <section className="font-inter">
                            <div className="flex items-center gap-4 mb-8 font-inter">
                                <h3 className="text-[15px] font-bold text-slate-800 font-inter underline decoration-emerald-500 decoration-2 underline-offset-8 uppercase">Verification Matrix</h3>
                            </div>
                            <div className="space-y-6 font-inter">
                                <div className="flex gap-4 font-inter">
                                    <input
                                        value={newItemTask}
                                        onChange={(e) => setNewItemTask(e.target.value)}
                                        placeholder="Add a verification point..."
                                        className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-inter"
                                    />
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="px-6 py-2.5 bg-primary text-white text-[13px] font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 font-inter"
                                    >
                                        Add Point
                                    </button>
                                </div>
                                <div className="space-y-3 font-inter">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 group transition-all hover:bg-slate-50 hover:border-emerald-200 shadow-sm font-inter">
                                            <div className="flex items-center gap-4 flex-1 font-inter">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleItemStatus(item.id)}
                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${item.status === "Done" ? "bg-emerald-500 border-emerald-500 shadow-md shadow-emerald-200" : "bg-white border-slate-300"}`}
                                                >
                                                    {item.status === "Done" && <span className="text-white text-[10px] font-black">✓</span>}
                                                </button>
                                                <span className={`text-[13px] font-semibold transition-all ${item.status === "Done" ? "text-slate-400 line-through" : "text-slate-700 tracking-tight"}`}>{item.task}</span>
                                            </div>
                                            <button type="button" onClick={() => deleteItem(item.id)} className="text-rose-400 hover:text-rose-600 font-black text-xl px-2 font-inter transition-colors">×</button>
                                        </div>
                                    ))}
                                    {items.length === 0 && (
                                        <p className="text-xs text-slate-400 font-bold italic text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 opacity-60 font-inter">
                                            Verification points pending...
                                        </p>
                                    )}
                                    {errors.items && <p className="text-[10px] font-bold text-rose-500 mt-2 ml-1 font-inter">{errors.items}</p>}
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Technical Remarks */}
                        <section className="font-inter">
                            <div className="flex items-center gap-4 mb-8 font-inter">
                                <h3 className="text-[15px] font-bold text-slate-800 font-inter underline decoration-amber-500 decoration-2 underline-offset-8 uppercase">Technical Remarks</h3>
                            </div>
                            <div className="flex flex-col gap-1.5 font-inter">
                                <label className="text-[13px] font-bold text-slate-700 font-inter">Registry Observations</label>
                                <textarea
                                    name="remarks"
                                    rows={4}
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    placeholder="Additional site observations or technical notes..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all resize-none font-inter"
                                />
                            </div>
                        </section>
                    </form>
                </div>

                <div className="bg-white px-8 py-6 border-t border-slate-100 flex items-center justify-between font-inter">
                    <button
                        type="button"
                        onClick={() => setIsFormModalOpen(false)}
                        className="text-[11px] font-bold text-slate-400 hover:text-slate-800 tracking-widest uppercase transition-all font-inter"
                    >
                        Discard Analysis
                    </button>
                    <button
                        type="submit"
                        form="checklist-form"
                        className="px-8 py-2.5 bg-primary text-white text-[13px] font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 font-inter"
                    >
                        {formMode === "create" ? "Add Checklist" : "Commit Changes"}
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default ChecklistsPage;
