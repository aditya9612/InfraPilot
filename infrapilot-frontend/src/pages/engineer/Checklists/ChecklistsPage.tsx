import React, { useState } from "react";
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
    checklistName: string;
    type: "Daily" | "Activity";
    items: ChecklistItem[];
    overallStatus: "Complete" | "Partial" | "Pending";
    remarks: string;
    date: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const checklistHistory: ChecklistRecord[] = [
    {
        id: "CHK-901",
        checklistName: "Site Opening Inventory Check",
        type: "Daily",
        items: [
            { id: "1", task: "Security Guard Presence", status: "Done" },
            { id: "2", task: "Logbooks Updated", status: "Done" },
            { id: "3", task: "Safety Gear Check", status: "Done" },
        ],
        overallStatus: "Complete",
        remarks: "All morning protocols observed.",
        date: "2026-04-12",
    },
    {
        id: "CHK-902",
        checklistName: "Column Reinforcement Verification",
        type: "Activity",
        items: [
            { id: "1", task: "Steel Grade Verification", status: "Done" },
            { id: "2", task: "Spacing as per GFC", status: "Done" },
            { id: "3", task: "Binding Wire Tightness", status: "Pending" },
        ],
        overallStatus: "Partial",
        remarks: "Binding wire checks pending for Wing C columns.",
        date: "2026-04-13",
    },
];

// ─── Badge Colors ────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
    Complete: "border border-emerald-200 text-emerald-500 bg-emerald-50/50",
    Partial: "border border-amber-200 text-amber-500 bg-amber-50/50",
    Pending: "border border-rose-200 text-rose-500 bg-rose-50/50",
};

// ─── Profile Field Helper ──────────────────────────────────────────────────────

const ProfileField = ({
    label,
    value,
    accent,
    mono = false,
}: {
    label: string;
    value: string;
    accent?: string;
    mono?: boolean;
}) => (
    <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-1">
            {label}
        </span>
        <p className={`text-sm font-bold text-slate-800 leading-snug ${mono ? "font-mono tracking-tight" : ""} ${accent ?? ""}`}>
            {value || "—"}
        </p>
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────

const ChecklistsPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedChecklist, setSelectedChecklist] = useState<ChecklistRecord | null>(null);
    const [checklistData, setChecklistData] = useState<ChecklistRecord[]>(checklistHistory);

    const [formData, setFormData] = useState({
        checklistName: "",
        type: "Daily" as any,
        remarks: "",
        date: new Date().toISOString().split("T")[0],
    });

    const [items, setItems] = useState<ChecklistItem[]>([]);
    const [newItemTask, setNewItemTask] = useState("");
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const newErrs = { ...prev };
                delete newErrs[name];
                return newErrs;
            });
        }
    };

    const addItem = () => {
        if (!newItemTask) return;
        setItems(prev => [
            ...prev,
            { id: Math.random().toString(36).substr(2, 9), task: newItemTask, status: "Pending" }
        ]);
        setNewItemTask("");
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
        const newErrors: Record<string, string> = {};
        if (!formData.checklistName) newErrors.checklistName = "Name is required";
        if (items.length === 0) newErrors.items = "Add at least one verification item";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please provide all required verification details.");
            return;
        }

        const doneCount = items.filter(i => i.status === "Done").length;
        const overallStatus = doneCount === items.length ? "Complete" : doneCount > 0 ? "Partial" : "Pending";

        const newEntry: ChecklistRecord = {
            id: `CHK-${900 + checklistData.length + 1}`,
            ...formData,
            items: [...items],
            overallStatus,
        };

        setChecklistData((prev) => [newEntry, ...prev]);
        toast.success("Checklist Logged Successfully!");
        setIsFormModalOpen(false);
        setFormData({
            checklistName: "",
            type: "Daily",
            remarks: "",
            date: new Date().toISOString().split("T")[0],
        });
        setItems([]);
    };

    return (
        <>
            <Navbar
                title="Site Checklists"
                breadcrumb={["InfraPilot", "Engineer", "Checklists"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Compliance & Quality
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Operational Checklists
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Daily site openings, activity-specific quality checks, and verification logs.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-emerald-200 transition-all active:scale-95"
                    >
                        <span className="text-lg leading-none">+</span>
                        Initiate Checklist
                    </button>
                </div>

                {/* Registry Ledger */}
                <div className="grid grid-cols-1 gap-5">
                    {checklistData.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                            onClick={() => setSelectedChecklist(item)}
                        >
                            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity ${item.overallStatus === "Complete" ? "bg-emerald-500" : item.overallStatus === "Partial" ? "bg-amber-500" : "bg-rose-500"}`} />

                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-[10px] border transition-all uppercase px-2 text-center leading-tight ${item.type === "Daily" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-purple-50 text-purple-600 border-purple-100"}`}>
                                            {item.type.substring(0, 1)}C
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.checklistName}</h3>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${item.type === "Daily" ? "bg-blue-100 text-blue-600" : "bg-purple-100 text-purple-600"}`}>
                                                    {item.type} Type
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                ID: {item.id} | Tracked: {item.date}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[item.overallStatus]}`}>
                                        {item.overallStatus}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 py-4 border-y border-slate-50">
                                    <ProfileField label="TASK COUNT" value={`${item.items.length} Points`} />
                                    <ProfileField label="COMPLETION" value={`${item.items.filter(i => i.status === "Done").length} Resolved`} accent="text-emerald-600" />
                                    <ProfileField label="CHECK DATE" value={item.date} />
                                    <ProfileField label="ENTITY ID" value={item.id} mono />
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                        Site Compliance Monitor • Active
                                    </span>
                                    <button
                                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        Inspect Item Details →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Inspect Detail Modal (Contractor Profile Style) */}
            <Modal
                isOpen={!!selectedChecklist}
                onClose={() => setSelectedChecklist(null)}
                title="Verification Point Audit"
                maxWidth="max-w-[1000px]"
            >
                {selectedChecklist && (
                    <div className="bg-white p-0 italic-none">
                        <div className={`mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r shadow-xl relative overflow-hidden group ${selectedChecklist.type === "Daily" ? "from-blue-600 to-blue-800" : "from-purple-600 to-purple-800"}`}>
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-[2.25rem] border border-white/30 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">{selectedChecklist.type.substring(0, 1)}C</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-3xl font-black text-white tracking-tight">{selectedChecklist.checklistName}</h3>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 bg-white/10 text-white backdrop-blur-sm`}>
                                            {selectedChecklist.overallStatus}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-white tracking-wide">Category: {selectedChecklist.type}</p>
                                    <p className="text-sm font-semibold text-white/80 mt-1 italic">Diagnostic Trace: <span className="text-white">{selectedChecklist.id}</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 pb-12 space-y-12">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div>
                                    <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xs">V</div>
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Verification Points</h4>
                                    </div>
                                    <div className="space-y-4">
                                        {selectedChecklist.items.map((point) => (
                                            <div key={point.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                <span className="text-sm font-bold text-slate-700">{point.task}</span>
                                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${point.status === "Done" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"}`}>
                                                    {point.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">M</div>
                                        <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Audit Metadata</h4>
                                    </div>
                                    <div className="space-y-10">
                                        <ProfileField label="REGISTRATION DATE" value={selectedChecklist.date} />
                                        <ProfileField label="REMARKS / OBSERVATIONS" value={selectedChecklist.remarks} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-12 py-8 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedChecklist(null)}
                                className="px-12 py-4 bg-black text-white text-[13px] font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase"
                            >Close Audit</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Checklist Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title="Initiate Site Verification Point"
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8 italic-none">
                    <form id="checklist-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Section 1: Definition */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Checklist Definition</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Checklist Name *</label>
                                    <input
                                        name="checklistName"
                                        value={formData.checklistName}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Basement Floor Cleaning"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.checklistName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.checklistName && <p className="text-[10px] text-rose-500 font-bold">{errors.checklistName}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Type *</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none appearance-none"
                                    >
                                        <option value="Daily">Daily Checklist</option>
                                        <option value="Activity">Activity Specific</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Verification Points */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Verification Points</h3>
                            </div>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <input
                                        value={newItemTask}
                                        onChange={(e) => setNewItemTask(e.target.value)}
                                        placeholder="Enter verification point (e.g. Columns checked for plumb)"
                                        className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="px-8 py-3.5 bg-slate-900 text-white text-sm font-black rounded-xl hover:bg-black transition-all shadow-md active:scale-95"
                                    >+ ADD</button>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 group transition-all hover:bg-white hover:shadow-sm">
                                            <div className="flex items-center gap-4 flex-1">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleItemStatus(item.id)}
                                                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${item.status === "Done" ? "bg-emerald-500 border-emerald-500" : "border-slate-300"}`}
                                                >
                                                    {item.status === "Done" && <span className="text-white text-xs">✓</span>}
                                                </button>
                                                <span className={`text-sm font-bold transition-all ${item.status === "Done" ? "text-slate-400 line-through" : "text-slate-800"}`}>
                                                    {item.task}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => deleteItem(item.id)}
                                                className="text-rose-400 hover:text-rose-600 text-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >×</button>
                                        </div>
                                    ))}
                                    {items.length === 0 && <p className="text-xs text-slate-400 font-medium italic text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">No verification points added yet.</p>}
                                    {errors.items && <p className="text-[10px] text-rose-500 font-bold">{errors.items}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Finalization */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Audit Finalization</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Check Date *</label>
                                    <input
                                        name="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Overall Remarks</label>
                                    <textarea
                                        name="remarks"
                                        rows={3}
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                        placeholder="Technical observations or summary of verification…"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => setIsFormModalOpen(false)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-all font-inter"
                    >Discard Draft</button>
                    <button
                        type="submit"
                        form="checklist-form"
                        className="px-12 py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                    >Submit Checklist</button>
                </div>
            </Modal>
        </>
    );
};

export default ChecklistsPage;
