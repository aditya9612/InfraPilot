import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface IssueRecord {
    id: string;
    issueTitle: string;
    category: "Material" | "Labor" | "Design";
    description: string;
    reportedDate: string;
    priority: "Low" | "Medium" | "High";
    assignedTo: string;
    status: "Open" | "Closed";
    resolutionNotes: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const issueHistory: IssueRecord[] = [
    {
        id: "ISS-501",
        issueTitle: "Cement Shortage for Slab Casting",
        category: "Material",
        description: "Supplier delayed delivery due to logistics issues. 500 bags pending.",
        reportedDate: "2026-04-12",
        priority: "High",
        assignedTo: "Procurement Team",
        status: "Open",
        resolutionNotes: "",
    },
    {
        id: "ISS-502",
        issueTitle: "Misalignment in Wing-B Columns",
        category: "Design",
        description: "Checking structural drawings. Discrepancy found between architectural and structural maps.",
        reportedDate: "2026-04-10",
        priority: "Medium",
        assignedTo: "Structural Consultant",
        status: "Closed",
        resolutionNotes: "Revised drawing G-34 received. Alignment corrected on site.",
    },
];

// ─── Badge Colors ────────────────────────────────────────────────────────────

const priorityColors: Record<string, string> = {
    High: "bg-rose-100 text-rose-600",
    Medium: "bg-amber-100 text-amber-600",
    Low: "bg-emerald-100 text-emerald-600",
};

const statusColors: Record<string, string> = {
    Open: "border border-rose-200 text-rose-500 bg-rose-50/50",
    Closed: "border border-emerald-200 text-emerald-500 bg-emerald-50/50",
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

const IssueTrackerPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<IssueRecord | null>(null);
    const [issueData, setIssueData] = useState<IssueRecord[]>(issueHistory);

    const [formData, setFormData] = useState({
        issueTitle: "",
        category: "Material" as any,
        description: "",
        reportedDate: new Date().toISOString().split("T")[0],
        priority: "Medium" as any,
        assignedTo: "",
        status: "Open" as any,
        resolutionNotes: "",
    });

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

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.issueTitle) newErrors.issueTitle = "Title is required";
        if (!formData.description) newErrors.description = "Description is required";
        if (!formData.assignedTo) newErrors.assignedTo = "Assigned party is required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please provide all required diagnostic details.");
            return;
        }

        const newEntry: IssueRecord = {
            id: `ISS-${500 + issueData.length + 1}`,
            ...formData,
        };

        setIssueData((prev) => [newEntry, ...prev]);
        toast.success("Issue Logged Successfully!");
        setIsFormModalOpen(false);
        setFormData({
            issueTitle: "",
            category: "Material",
            description: "",
            reportedDate: new Date().toISOString().split("T")[0],
            priority: "Medium",
            assignedTo: "",
            status: "Open",
            resolutionNotes: "",
        });
    };

    return (
        <>
            <Navbar
                title="Issue / Delay Tracker"
                breadcrumb={["InfraPilot", "Engineer", "Issues"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Bottleneck Management
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Project Constraint Tracker
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Register site issues, design delays, or resource shortages to ensure project momentum.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-blue-200 transition-all active:scale-95"
                    >
                        <span className="text-lg leading-none">+</span>
                        Lodge Site Issue
                    </button>
                </div>

                {/* Ledger */}
                <div className="grid grid-cols-1 gap-5">
                    {issueData.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                            onClick={() => setSelectedIssue(item)}
                        >
                            <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity ${item.priority === "High" ? "bg-rose-500" : item.priority === "Medium" ? "bg-amber-500" : "bg-emerald-500"}`} />

                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.issueTitle}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${priorityColors[item.priority]}`}>
                                                {item.priority} Priority
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            Category: {item.category} | Reported: {item.reportedDate}
                                        </p>
                                    </div>
                                    <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[item.status]}`}>
                                        {item.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-4 border-y border-slate-50">
                                    <ProfileField label="ASSIGNED TO" value={item.assignedTo} accent="text-blue-600" />
                                    <ProfileField label="ISSUE ID" value={item.id} mono />
                                    <ProfileField label="RESOLUTION STATUS" value={item.status} />
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                        Project Constraint Log • System Audit
                                    </span>
                                    <button
                                        className="text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        View Full Resolution Map →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedIssue}
                onClose={() => setSelectedIssue(null)}
                title="Constraint Resolution Map"
                maxWidth="max-w-[1000px]"
            >
                {selectedIssue && (
                    <div className="bg-white p-0 italic-none">
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-slate-900 to-blue-950 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/10 backdrop-blur-md rounded-[2.25rem] border border-white/20 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">{selectedIssue.category.substring(0, 1)}I</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-3xl font-black text-white tracking-tight">{selectedIssue.issueTitle}</h3>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 bg-white/10 text-white backdrop-blur-sm`}>
                                            {selectedIssue.status}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-white tracking-wide">Reported: {selectedIssue.reportedDate}</p>
                                    <p className="text-sm font-semibold text-slate-300/80 mt-1">Assigned To: <span className="text-white">{selectedIssue.assignedTo}</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 pb-12 space-y-12">
                            <div>
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 font-bold text-xs">P</div>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Issue Parameters</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-10 gap-x-16">
                                    <ProfileField label="CATEGORY" value={selectedIssue.category} />
                                    <ProfileField label="PRIORITY" value={selectedIssue.priority} accent={priorityColors[selectedIssue.priority]} />
                                    <div className="md:col-span-2">
                                        <ProfileField label="ISSUE DESCRIPTION" value={selectedIssue.description} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <ProfileField label="RESOLUTION NOTES" value={selectedIssue.resolutionNotes || "Pending resolution notes from assigned party."} accent="text-emerald-700 font-medium" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-12 py-8 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedIssue(null)}
                                className="px-12 py-4 bg-black text-white text-[13px] font-black rounded-2xl shadow-lg transition-all active:scale-95 uppercase"
                            >Close Audit</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title="Lodge Site Issue / Delay"
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8 italic-none">
                    <form id="issue-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Section 1: Issue Identity */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Issue Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="flex-1 lg:col-span-2 flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Issue Title *</label>
                                    <input
                                        name="issueTitle"
                                        value={formData.issueTitle}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Concrete Logistics Delay"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.issueTitle ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.issueTitle && <p className="text-[10px] text-rose-500 font-bold">{errors.issueTitle}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Material">Material Delay</option>
                                        <option value="Labor">Labor Shortage</option>
                                        <option value="Design">Design / Drawing Discrepancy</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Diagnostics */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Issue Diagnostics</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Reported Date *</label>
                                    <input
                                        name="reportedDate"
                                        type="date"
                                        value={formData.reportedDate}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Priority Level</label>
                                    <select
                                        name="priority"
                                        value={formData.priority}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Assigned To *</label>
                                    <input
                                        name="assignedTo"
                                        value={formData.assignedTo}
                                        onChange={handleInputChange}
                                        placeholder="Party responsible for resolution"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.assignedTo ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.assignedTo && <p className="text-[10px] text-rose-500 font-bold">{errors.assignedTo}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Narrative */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Resolution Path</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Issue Description *</label>
                                    <textarea
                                        name="description"
                                        rows={3}
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Brief description of the constraint…"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none resize-none transition-all ${errors.description ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.description && <p className="text-[10px] text-rose-500 font-bold">{errors.description}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Status</label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Open">Open</option>
                                        <option value="Closed">Closed / Resolved</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Resolution Notes</label>
                                    <textarea
                                        name="resolutionNotes"
                                        rows={3}
                                        value={formData.resolutionNotes}
                                        onChange={handleInputChange}
                                        placeholder="If resolved, specify the outcome…"
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
                    >Discard Changes</button>
                    <button
                        type="submit"
                        form="issue-form"
                        className="px-12 py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                    >Register Constraint</button>
                </div>
            </Modal>
        </>
    );
};

export default IssueTrackerPage;
