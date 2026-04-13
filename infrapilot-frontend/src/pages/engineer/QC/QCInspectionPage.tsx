import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InspectionRecord {
    id: string;
    inspectionType: string;
    activity: string;
    engineerName: string;
    status: "Pass" | "Fail";
    remarks: string;
    date: string;
    reportAttached: boolean;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const inspectionHistory: InspectionRecord[] = [
    {
        id: "QC-INS-101",
        inspectionType: "Structure",
        activity: "Raft Reinforcement Inspection",
        engineerName: "Amit Sharma",
        status: "Pass",
        remarks: "All bars placed as per drawing. Spacing verified.",
        date: "2026-04-12",
        reportAttached: true,
    },
    {
        id: "QC-INS-102",
        inspectionType: "Material",
        activity: "Course Aggregate Visual",
        engineerName: "Rajesh Varma",
        status: "Pass",
        remarks: "Angular particles, no dust. Size verified.",
        date: "2026-04-11",
        reportAttached: false,
    },
    {
        id: "QC-INS-103",
        inspectionType: "Finishing",
        activity: "Brickwork Leveling Check",
        engineerName: "Amit Sharma",
        status: "Fail",
        remarks: "Level deviation of 10mm in west wall. Re-work required.",
        date: "2026-04-10",
        reportAttached: true,
    },
];

// ─── Badge Colors ────────────────────────────────────────────────────────────

const statusColors: Record<string, string> = {
    Pass: "bg-emerald-100 text-emerald-600",
    Fail: "bg-rose-100 text-rose-600",
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

const QCInspectionPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);
    const [inspectionList, setInspectionList] = useState<InspectionRecord[]>(inspectionHistory);

    const [formData, setFormData] = useState({
        inspectionType: "Structure",
        activity: "",
        engineerName: "",
        status: "Pass" as "Pass" | "Fail",
        remarks: "",
        attachReport: null as File | null,
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
        if (!formData.activity) newErrors.activity = "Required";
        if (!formData.engineerName) newErrors.engineerName = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        const newEntry: InspectionRecord = {
            id: `QC-INS-${100 + inspectionList.length + 1}`,
            inspectionType: formData.inspectionType,
            activity: formData.activity,
            engineerName: formData.engineerName,
            status: formData.status,
            remarks: formData.remarks,
            date: new Date().toISOString().split("T")[0],
            reportAttached: !!formData.attachReport,
        };

        setInspectionList((prev) => [newEntry, ...prev]);
        toast.success("Inspection Recorded!");
        setIsFormModalOpen(false);
        setFormData({
            inspectionType: "Structure",
            activity: "",
            engineerName: "",
            status: "Pass",
            remarks: "",
            attachReport: null,
        });
    };

    return (
        <>
            <Navbar
                title="QC Inspection"
                breadcrumb={["InfraPilot", "Engineer", "QC", "Inspection"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Quality Standards
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Site Inspection Registry
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Official registry for structural, material, and finishing inspections.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-emerald-200 transition-all active:scale-95"
                    >
                        <span className="text-lg leading-none">+</span>
                        Record Inspection
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Inspections</p>
                        <p className="text-2xl font-bold text-slate-800">{inspectionList.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Passed</p>
                        <p className="text-2xl font-bold text-emerald-500">{inspectionList.filter(i => i.status === "Pass").length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Failed / Rework</p>
                        <p className="text-2xl font-bold text-rose-500">{inspectionList.filter(i => i.status === "Fail").length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Pass Ratio</p>
                        <p className="text-2xl font-bold text-blue-600">
                            {Math.round((inspectionList.filter(i => i.status === "Pass").length / inspectionList.length) * 100)}%
                        </p>
                    </div>
                </div>

                {/* Ledger */}
                <div className="grid grid-cols-1 gap-5">
                    {inspectionList.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                            onClick={() => setSelectedInspection(item)}
                        >
                            <div className="absolute left-0 top-4 bottom-4 w-1 bg-emerald-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.activity}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusColors[item.status]}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            {item.inspectionType} | Date: {item.date} | ID: {item.id}
                                        </p>
                                    </div>
                                    {item.reportAttached && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-100">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            Report Attached
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-4 border-y border-slate-50">
                                    <ProfileField label="INSPECTING ENGINEER" value={item.engineerName} />
                                    <ProfileField label="REMARKS" value={item.remarks} />
                                    <ProfileField label="INSPECTION TYPE" value={item.inspectionType} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                        Quality Assurance Registry • {item.id}
                                    </span>
                                    <button
                                        className="text-[10px] font-black text-emerald-600 hover:text-emerald-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        View Full Audit Metrics →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedInspection}
                onClose={() => setSelectedInspection(null)}
                title="QC Inspection Details"
                maxWidth="max-w-[1000px]"
            >
                {selectedInspection && (
                    <div className="bg-white p-0 italic-none">
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-emerald-600 to-teal-600 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-[2rem] border border-white/30 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">
                                        QC
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-3xl font-black text-white tracking-tight">
                                            {selectedInspection.activity}
                                        </h3>
                                        <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 bg-white/10 text-white backdrop-blur-sm">
                                            {selectedInspection.status}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-white tracking-wide">
                                        {selectedInspection.inspectionType} Inspection
                                    </p>
                                    <p className="text-sm font-semibold text-emerald-100/80 mt-1">
                                        Inspected by: <span className="text-white">{selectedInspection.engineerName}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 pb-12 space-y-12">
                            <div>
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Inspection Audit</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-10 gap-x-16">
                                    <ProfileField label="ACTIVITY NAME" value={selectedInspection.activity} />
                                    <ProfileField label="INSPECTION ID" value={selectedInspection.id} mono />
                                    <ProfileField label="ENGINEER NAME" value={selectedInspection.engineerName} />
                                    <ProfileField label="STATUS" value={selectedInspection.status} accent={selectedInspection.status === "Pass" ? "text-emerald-600" : "text-rose-500"} />
                                    <div className="md:col-span-2">
                                        <ProfileField label="ENGINEER REMARKS" value={selectedInspection.remarks} />
                                    </div>
                                </div>
                            </div>

                            {selectedInspection.reportAttached && (
                                <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-blue-900 leading-none mb-1">inspection_report_{selectedInspection.id}.pdf</p>
                                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Sign-off Report Attached</p>
                                        </div>
                                    </div>
                                    <button className="px-6 py-2 bg-white text-blue-600 text-[10px] font-black rounded-lg border border-blue-100 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest">Download</button>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 px-12 py-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedInspection(null)}
                                className="px-12 py-4 bg-[#0f172a] hover:bg-black text-white text-[11px] font-black rounded-xl shadow-lg transition-all active:scale-95 uppercase tracking-widest"
                            >
                                Close Details
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Form Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title="New QC Inspection Log"
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8 italic-none">
                    <form id="inspection-form" onSubmit={handleSubmit} className="space-y-12">

                        {/* Section 1: Details */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1 h-6 bg-emerald-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Inspection Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Inspection Type</label>
                                    <select
                                        name="inspectionType"
                                        value={formData.inspectionType}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Structure">Structure</option>
                                        <option value="Material">Material</option>
                                        <option value="Finishing">Finishing</option>
                                        <option value="Plumbing / Electrical">Plumbing / Electrical</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Activity Name *</label>
                                    <input
                                        name="activity"
                                        value={formData.activity}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Column Reinforcement Check"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.activity ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.activity && <p className="text-[10px] text-rose-500 font-bold">{errors.activity}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Engineer Name *</label>
                                    <input
                                        name="engineerName"
                                        value={formData.engineerName}
                                        onChange={handleInputChange}
                                        placeholder="Name of inspecting engineer"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.engineerName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.engineerName && <p className="text-[10px] text-rose-500 font-bold">{errors.engineerName}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Pass / Fail Status</label>
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, status: "Pass" }))}
                                            className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all border ${formData.status === "Pass" ? "bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"}`}
                                        >PASS</button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, status: "Fail" }))}
                                            className={`flex-1 py-3.5 rounded-xl text-sm font-bold transition-all border ${formData.status === "Fail" ? "bg-rose-50 border-rose-500 text-rose-600 shadow-sm" : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"}`}
                                        >FAIL</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Remarks & Report */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1 h-6 bg-slate-800 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Documentation</h3>
                            </div>
                            <div className="flex flex-col gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Remarks</label>
                                    <textarea
                                        name="remarks"
                                        rows={4}
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                        placeholder="Provide detailed inspection notes or re-work instructions…"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none resize-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Attach Signed Report (PDF)</label>
                                    <label className="w-full h-32 rounded-2xl border-2 border-dashed border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 flex flex-col items-center justify-center cursor-pointer transition-all group">
                                        <input
                                            type="file"
                                            accept=".pdf"
                                            onChange={(e) => setFormData(prev => ({ ...prev, attachReport: e.target.files ? e.target.files[0] : null }))}
                                            className="hidden"
                                        />
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 group-hover:text-emerald-700 transition-all">{formData.attachReport ? formData.attachReport.name : "Select Document"}</p>
                                                <p className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-500 uppercase tracking-widest">{formData.attachReport ? `${(formData.attachReport.size / 1024).toFixed(1)} KB` : "Drop PDF here or click to browse"}</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={() => setIsFormModalOpen(false)}
                        className="text-sm font-bold text-slate-400 hover:text-slate-800 transition-all"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        form="inspection-form"
                        className="px-12 py-4 bg-slate-900 hover:bg-black text-white text-sm font-black rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95"
                    >
                        Save Inspection
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default QCInspectionPage;
