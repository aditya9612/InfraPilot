import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChecklistRecord {
    id: string;
    date: string;
    checklistStatus: "Completed" | "Pending" | "Issues Found";
    ppeCompliance: "100%" | "Partial" | "Non-Compliant";
    responsiblePerson: string;
    remarks: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const checklistHistory: ChecklistRecord[] = [
    {
        id: "SF-CHK-201",
        date: "2026-04-13",
        checklistStatus: "Completed",
        ppeCompliance: "100%",
        responsiblePerson: "Suresh Mani",
        remarks: "All safety nets secured. Handrails installed at heights.",
    },
    {
        id: "SF-CHK-202",
        date: "2026-04-12",
        checklistStatus: "Issues Found",
        ppeCompliance: "Partial",
        responsiblePerson: "Vikram Singh",
        remarks: "2 workers found without helmets on 3rd floor. Warning issued.",
    },
];

// ─── Badge Colors ────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
    Completed: "bg-emerald-100 text-emerald-600",
    Pending: "bg-amber-100 text-amber-600",
    "Issues Found": "bg-rose-100 text-rose-600",
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

const SafetyChecklistPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState<ChecklistRecord | null>(null);
    const [checklistData, setChecklistData] = useState<ChecklistRecord[]>(checklistHistory);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        checklistStatus: "Completed" as any,
        ppeCompliance: "100%" as any,
        responsiblePerson: "",
        remarks: "",
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
        if (!formData.date) newErrors.date = "Required";
        if (!formData.responsiblePerson) newErrors.responsiblePerson = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        const newEntry: ChecklistRecord = {
            id: `SF-CHK-${200 + checklistData.length + 1}`,
            ...formData,
        };

        setChecklistData((prev) => [newEntry, ...prev]);
        toast.success("Safety Audit Decorded!");
        setIsFormModalOpen(false);
        setFormData({
            date: new Date().toISOString().split("T")[0],
            checklistStatus: "Completed",
            ppeCompliance: "100%",
            responsiblePerson: "",
            remarks: "",
        });
    };

    return (
        <>
            <Navbar
                title="Safety Checklist"
                breadcrumb={["InfraPilot", "Engineer", "Safety", "Checklist"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Operational Safety
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Daily Safety Audit
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Official registry for site safety checks, PPE compliance, and hazard mitigation.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center gap-2 bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95"
                    >
                        <span className="text-lg leading-none">+</span>
                        Record Safety Audit
                    </button>
                </div>

                {/* Ledger */}
                <div className="grid grid-cols-1 gap-5">
                    {checklistData.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                            onClick={() => setSelectedAudit(item)}
                        >
                            <div className="absolute left-0 top-4 bottom-4 w-1 bg-amber-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-black text-slate-800 tracking-tight">Safety Audit - {item.date}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusColors[item.checklistStatus]}`}>
                                                {item.checklistStatus}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            Compliance: {item.ppeCompliance} | ID: {item.id}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-4 border-y border-slate-50">
                                    <ProfileField label="RESPONSIBLE OFFICER" value={item.responsiblePerson} />
                                    <ProfileField label="PPE COMPLIANCE" value={item.ppeCompliance} accent={item.ppeCompliance === "100%" ? "text-emerald-600" : "text-amber-600"} />
                                    <ProfileField label="AUDIT STATUS" value={item.checklistStatus} />
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                        Safety Compliance Registry • {item.id}
                                    </span>
                                    <button
                                        className="text-[10px] font-black text-amber-600 hover:text-amber-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        View Full Compliance Audit →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedAudit}
                onClose={() => setSelectedAudit(null)}
                title="Safety Audit Details"
                maxWidth="max-w-[1000px]"
            >
                {selectedAudit && (
                    <div className="bg-white p-0 italic-none">
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-slate-800 to-slate-950 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-[2.25rem] border border-white/30 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">SAFE</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-3xl font-black text-white tracking-tight">Audit {selectedAudit.date}</h3>
                                        <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 bg-white/10 text-white backdrop-blur-sm">
                                            {selectedAudit.checklistStatus}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-white tracking-wide">PPE Compliance: {selectedAudit.ppeCompliance}</p>
                                    <p className="text-sm font-semibold text-slate-300/80 mt-1">Responsible Officer: <span className="text-white">{selectedAudit.responsiblePerson}</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 pb-12 space-y-12">
                            <div>
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 font-bold text-xs">S</div>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Compliance metrics</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-10 gap-x-16">
                                    <ProfileField label="AUDIT DATE" value={selectedAudit.date} />
                                    <ProfileField label="AUDIT ID" value={selectedAudit.id} mono />
                                    <ProfileField label="PPE COMPLIANCE" value={selectedAudit.ppeCompliance} />
                                    <ProfileField label="OFFICER" value={selectedAudit.responsiblePerson} />
                                    <div className="md:col-span-2">
                                        <ProfileField label="OFFICER REMARKS" value={selectedAudit.remarks} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-12 py-8 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedAudit(null)}
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
                title="New Safety Audit"
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-8 italic-none">
                    <form id="safety-form" onSubmit={handleSubmit} className="space-y-12">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Audit Identifiers</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Audit Date *</label>
                                    <input
                                        name="date"
                                        type="date"
                                        value={formData.date}
                                        onChange={handleInputChange}
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.date ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.date && <p className="text-[10px] text-rose-500 font-bold">{errors.date}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Responsible Person *</label>
                                    <input
                                        name="responsiblePerson"
                                        value={formData.responsiblePerson}
                                        onChange={handleInputChange}
                                        placeholder="Name of safety officer"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.responsiblePerson ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.responsiblePerson && <p className="text-[10px] text-rose-500 font-bold">{errors.responsiblePerson}</p>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Audit Results</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Checklist Status</label>
                                    <select
                                        name="checklistStatus"
                                        value={formData.checklistStatus}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Completed">Completed - Safe</option>
                                        <option value="Pending">Pending Audit</option>
                                        <option value="Issues Found">Issues Found / Hazard</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">PPE Compliance</label>
                                    <select
                                        name="ppeCompliance"
                                        value={formData.ppeCompliance}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="100%">100% Compliant</option>
                                        <option value="Partial">Partial Compliance</option>
                                        <option value="Non-Compliant">Non-Compliant</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-slate-400 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Documentation</h3>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Remarks / Hazard Details</label>
                                <textarea
                                    name="remarks"
                                    rows={4}
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    placeholder="Brief summary of site safety conditions…"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none resize-none"
                                />
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => setIsFormModalOpen(false)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-all font-inter"
                    >Discard</button>
                    <button
                        type="submit"
                        form="safety-form"
                        className="px-12 py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest"
                    >Save Audit</button>
                </div>
            </Modal>
        </>
    );
};

export default SafetyChecklistPage;
