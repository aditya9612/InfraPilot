import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface IncidentRecord {
    id: string;
    date: string;
    violationType: string;
    incidentDescription: string;
    injuryDetails: string;
    actionTaken: string;
    responsiblePerson: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const incidentHistory: IncidentRecord[] = [
    {
        id: "SF-INC-401",
        date: "2026-04-12",
        violationType: "Height Safety",
        incidentDescription: "Worker slipped on scaffolding while plastering. Safety harness was not hooked.",
        injuryDetails: "Minor bruise on elbow. No serious injury.",
        actionTaken: "Immediate site stand-down. Retraining of worker and supervisor.",
        responsiblePerson: "Vikram Singh",
    },
];

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

const IncidentReportPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
    const [incidentData, setIncidentData] = useState<IncidentRecord[]>(incidentHistory);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        violationType: "Height Safety",
        incidentDescription: "",
        injuryDetails: "",
        actionTaken: "",
        responsiblePerson: "",
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
        if (!formData.incidentDescription) newErrors.incidentDescription = "Required";
        if (!formData.actionTaken) newErrors.actionTaken = "Required";
        if (!formData.responsiblePerson) newErrors.responsiblePerson = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required diagnostic fields.");
            return;
        }

        const newEntry: IncidentRecord = {
            id: `SF-INC-${400 + incidentData.length + 1}`,
            ...formData,
        };

        setIncidentData((prev) => [newEntry, ...prev]);
        toast.success("Incident Report Lodged!");
        setIsFormModalOpen(false);
        setFormData({
            date: new Date().toISOString().split("T")[0],
            violationType: "Height Safety",
            incidentDescription: "",
            injuryDetails: "",
            actionTaken: "",
            responsiblePerson: "",
        });
    };

    return (
        <>
            <Navbar
                title="Incident Report"
                breadcrumb={["InfraPilot", "Engineer", "Safety", "Incident"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Crisis Documentation
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Site Incident Registry
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Official registry for documenting accidents, near-misses, and safety violations.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-rose-200 transition-all active:scale-95"
                    >
                        <span className="text-lg leading-none">+</span>
                        Lodge Incident Report
                    </button>
                </div>

                {/* Ledger */}
                <div className="grid grid-cols-1 gap-5">
                    {incidentData.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                            onClick={() => setSelectedIncident(item)}
                        >
                            <div className="absolute left-0 top-4 bottom-4 w-1 bg-rose-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 font-black text-xl border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition-all">
                                            !
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.violationType} Incident</h3>
                                                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-600">
                                                    Reported
                                                </span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                Date: {item.date} | ID: {item.id}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-8 py-4 border-y border-slate-50">
                                    <ProfileField label="RESPONSIBLE PERSON" value={item.responsiblePerson} />
                                    <ProfileField label="INCIDENT BRIEF" value={item.incidentDescription.substring(0, 40) + "..."} />
                                    <ProfileField label="ACTION TAKEN" value={item.actionTaken.substring(0, 40) + "..."} accent="text-rose-600" />
                                </div>

                                <div className="flex items-center justify-between mt-2">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                        Critical Incident Log • {item.id}
                                    </span>
                                    <button
                                        className="text-[10px] font-black text-rose-600 hover:text-rose-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        View Full Incident Analysis →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {incidentData.length === 0 && (
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-12 text-center">
                            <p className="text-emerald-800 font-bold text-lg mb-1">Zero Incidents Reported Today</p>
                            <p className="text-emerald-600 text-sm font-medium italic-none">Safe site conditions maintained. Good work!</p>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedIncident}
                onClose={() => setSelectedIncident(null)}
                title="Critical Incident Audit"
                maxWidth="max-w-[1000px]"
            >
                {selectedIncident && (
                    <div className="bg-white p-0 italic-none">
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-rose-700 to-rose-900 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-[2.25rem] border border-white/30 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">SOS</span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-3xl font-black text-white tracking-tight">{selectedIncident.violationType}</h3>
                                        <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 bg-white/10 text-white backdrop-blur-sm">CRITICAL</span>
                                    </div>
                                    <p className="text-sm font-bold text-white tracking-wide">Reported on {selectedIncident.date}</p>
                                    <p className="text-sm font-semibold text-rose-100/80 mt-1">Responsible Person: <span className="text-white">{selectedIncident.responsiblePerson}</span></p>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 pb-12 space-y-12">
                            <div>
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 font-bold text-xs">!</div>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Incident Diagnostics</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-10 gap-x-16">
                                    <ProfileField label="INCIDENT DATE" value={selectedIncident.date} />
                                    <ProfileField label="INCIDENT ID" value={selectedIncident.id} mono />
                                    <div className="md:col-span-2">
                                        <ProfileField label="INCIDENT DESCRIPTION" value={selectedIncident.incidentDescription} />
                                    </div>
                                    <div className="md:col-span-2">
                                        <ProfileField label="INJURY DETAILS" value={selectedIncident.injuryDetails} accent="text-rose-600" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <ProfileField label="ACTION TAKEN" value={selectedIncident.actionTaken} accent="text-emerald-700" />
                                    </div>
                                    <ProfileField label="RESPONSIBLE PARTY" value={selectedIncident.responsiblePerson} />
                                    <ProfileField label="VIOLATION TYPE" value={selectedIncident.violationType} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-12 py-8 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedIncident(null)}
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
                title="Lodge New Incident Report"
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8 italic-none">
                    <form id="incident-form" onSubmit={handleSubmit} className="space-y-12">
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-rose-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Event Basics</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Incident Date *</label>
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
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Violation Type</label>
                                    <select
                                        name="violationType"
                                        value={formData.violationType}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Height Safety">Height Safety</option>
                                        <option value="PPE Violation">PPE Violation</option>
                                        <option value="Material Handling">Material Handling</option>
                                        <option value="Electrical Hazard">Electrical Hazard</option>
                                        <option value="Machinery Misuse">Machinery Misuse</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Responsible Person *</label>
                                    <input
                                        name="responsiblePerson"
                                        value={formData.responsiblePerson}
                                        onChange={handleInputChange}
                                        placeholder="Name of witness/officer"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.responsiblePerson ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.responsiblePerson && <p className="text-[10px] text-rose-500 font-bold">{errors.responsiblePerson}</p>}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Incident & Injury Details</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Incident Description *</label>
                                    <textarea
                                        name="incidentDescription"
                                        rows={3}
                                        value={formData.incidentDescription}
                                        onChange={handleInputChange}
                                        placeholder="Describe what happened in detail…"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none resize-none transition-all ${errors.incidentDescription ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.incidentDescription && <p className="text-[10px] text-rose-500 font-bold">{errors.incidentDescription}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Injury Details (If any)</label>
                                    <input
                                        name="injuryDetails"
                                        value={formData.injuryDetails}
                                        onChange={handleInputChange}
                                        placeholder="Specify nature of injury..."
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Corrective Action</h3>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Action Taken *</label>
                                <textarea
                                    name="actionTaken"
                                    rows={3}
                                    value={formData.actionTaken}
                                    onChange={handleInputChange}
                                    placeholder="Steps taken to mitigate further risk…"
                                    className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none resize-none transition-all ${errors.actionTaken ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
                                {errors.actionTaken && <p className="text-[10px] text-rose-500 font-bold">{errors.actionTaken}</p>}
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
                        form="incident-form"
                        className="px-12 py-4 bg-rose-600 hover:bg-rose-700 text-white text-sm font-black rounded-2xl shadow-xl shadow-rose-200 transition-all active:scale-95 uppercase tracking-widest"
                    >Lodged Incident</button>
                </div>
            </Modal>
        </>
    );
};

export default IncidentReportPage;
