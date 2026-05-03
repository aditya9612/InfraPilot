import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Eye,
  Activity,
  Briefcase,
  Phone,
  Mail,
  FileText
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface IncidentRecord {
    id: string;
    date: string;
    checklist_status: string;
    ppe_compliance: string;
    violation_type: string;
    incident_description: string;
    injury_details: string;
    action_taken: string;
    responsible_person: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const incidentHistory: IncidentRecord[] = [
    {
        id: "SF-INC-401",
        date: "2026-04-12",
        checklist_status: "Issues Found",
        ppe_compliance: "60%",
        violation_type: "Height Safety",
        incident_description: "Worker slipped on scaffolding while plastering. Safety harness was not hooked.",
        injury_details: "Minor bruise on elbow. No serious injury.",
        action_taken: "Immediate site stand-down. Retraining of worker and supervisor.",
        responsible_person: "Vikram Singh",
    },
];

const IncidentReportPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
    const [incidentData, setIncidentData] = useState<IncidentRecord[]>(incidentHistory);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: "",
        date: new Date().toISOString().split("T")[0],
        checklist_status: "Issues Found",
        ppe_compliance: "100%",
        violation_type: "Height Safety",
        incident_description: "",
        injury_details: "",
        action_taken: "",
        responsible_person: "",
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
        if (!formData.violation_type) newErrors.violation_type = "Required";
        if (!formData.responsible_person.trim()) newErrors.responsible_person = "Required";
        if (!formData.incident_description.trim()) newErrors.incident_description = "Required";
        if (!formData.ppe_compliance.trim()) newErrors.ppe_compliance = "Required";
        if (!formData.injury_details.trim()) newErrors.injury_details = "Required";
        if (!formData.action_taken.trim()) newErrors.action_taken = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData({
            id: "",
            date: new Date().toISOString().split("T")[0],
            checklist_status: "Issues Found",
            ppe_compliance: "100%",
            violation_type: "Height Safety",
            incident_description: "",
            injury_details: "",
            action_taken: "",
            responsible_person: "",
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (record: IncidentRecord) => {
        setIsEditMode(true);
        setFormData({
            id: record.id,
            date: record.date,
            checklist_status: record.checklist_status,
            ppe_compliance: record.ppe_compliance,
            violation_type: record.violation_type,
            incident_description: record.incident_description,
            injury_details: record.injury_details,
            action_taken: record.action_taken,
            responsible_person: record.responsible_person,
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!incidentToDelete) return;
        setIncidentData(prev => prev.filter(t => t.id !== incidentToDelete));
        toast.success("Incident record deleted");
        setIsDeleteModalOpen(false);
        setIncidentToDelete(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        if (isEditMode) {
            setIncidentData(prev => prev.map(t => t.id === formData.id ? {
                ...t,
                date: formData.date,
                checklist_status: formData.checklist_status,
                ppe_compliance: formData.ppe_compliance,
                violation_type: formData.violation_type,
                incident_description: formData.incident_description,
                injury_details: formData.injury_details,
                action_taken: formData.action_taken,
                responsible_person: formData.responsible_person,
            } : t));
            toast.success("Incident Updated!");
        } else {
            const newEntry: IncidentRecord = {
                ...formData,
                id: `SF-INC-${400 + incidentData.length + 1}`,
            };
            setIncidentData((prev) => [newEntry, ...prev]);
            toast.success("Incident Report Lodged!");
        }
        setIsFormModalOpen(false);
    };

    const filteredHistory = useMemo(() => {
        return incidentData.filter(item => {
            const matchesSearch = item.responsible_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.incident_description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [incidentData, searchTerm]);

    // Stats
    const totalLogged = incidentData.length;
    const heightSafetyViolations = incidentData.filter(i => i.violation_type === "Height Safety").length;
    const resolvedCases = incidentData.filter(i => i.action_taken !== "").length;
    const ppeComplianceAvg = Math.round(incidentData.reduce((acc, i) => acc + parseInt(i.ppe_compliance), 0) / (totalLogged || 1));

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-white border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
    `;

    return (
        <>
            <Navbar title="Incident Registry" breadcrumb={["Engineer", "Safety", "Lodge Incident"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Incident Registry</h1>
                        <p className="text-slate-500 text-sm">Official logging for site safety violations and injury occurrences.</p>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log Incident
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Logged"
                        value={totalLogged.toString()}
                        sub="Incident Entries"
                        accent="text-slate-800"
                        icon={<AlertTriangle className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Height Safety"
                        value={heightSafetyViolations.toString()}
                        sub="Critical Violations"
                        accent="text-rose-500"
                        icon={<ShieldAlert className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Resolved"
                        value={resolvedCases.toString()}
                        sub="Corrective Actions"
                        accent="text-emerald-500"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                    />
                    <StatCard
                        title="PPE Compliance"
                        value={`${ppeComplianceAvg}%`}
                        sub="Safety Adherence"
                        accent="text-blue-500"
                        icon={<Activity className="w-5 h-5" />}
                    />
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-8">
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by description or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">Incident Details</th>
                                    <th className="px-6 py-4">Violation Type</th>
                                    <th className="px-6 py-4">PPE Level</th>
                                    <th className="px-6 py-4">Auditor</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredHistory.length > 0 ? (
                                    filteredHistory.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800 line-clamp-1">{item.incident_description}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.id} • {item.date}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                                                    {item.violation_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-800">{item.ppe_compliance}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-slate-500">{item.responsible_person}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 transition-opacity">
                                                    <button 
                                                        onClick={() => setSelectedIncident(item)}
                                                        className="p-2 bg-rose-600 text-white rounded-xl shadow-lg shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleOpenEdit(item)}
                                                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => { setIncidentToDelete(item.id); setIsDeleteModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">
                                            No incident reports found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedIncident}
                onClose={() => setSelectedIncident(null)}
                title="Incident Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedIncident && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className="bg-rose-600 rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-rose-400/30 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-black font-inter">{selectedIncident.violation_type.charAt(0)}</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white border-4 border-rose-600 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />
                                    </div>
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter">Incident Registry</h3>
                                        <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-inter">{selectedIncident.violation_type}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter italic-none">incident.ref-{selectedIncident.id.toLowerCase()}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-inter">OBSERVED: {selectedIncident.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Professional Information style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-rose-50 rounded-lg font-inter">
                                        <Briefcase className="w-4 h-4 text-rose-600" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Breach Intelligence</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Violation Type</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedIncident.violation_type}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Audit Lead</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedIncident.responsible_person}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Severity Level</p>
                                        <p className="text-sm font-black text-rose-600 font-inter italic-none">CRITICAL</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Case ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">CAS-{selectedIncident.id}X</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-rose-50 rounded-lg font-inter">
                                        <Phone className="w-4 h-4 text-rose-600" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Incident Narration</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Visual Evidence/Observations</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter italic-none">
                                            "{selectedIncident.incident_description}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assignments style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-emerald-50 rounded-lg font-inter">
                                        <FileText className="w-4 h-4 text-emerald-600" />
                                    </div>
                                    <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.15em] font-inter">Corrective Action Taken</p>
                                </div>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-sm text-emerald-800 font-bold leading-relaxed font-inter italic-none">
                                    {selectedIncident.action_taken}
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedIncident(null)}
                            className="w-full py-4 bg-rose-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                        >
                            Dismiss analysis
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={isEditMode ? "Modify Case Registry" : "Lodge Critical Incident"}
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            form="incident-form"
                            type="submit"
                            className="px-8 py-2.5 bg-rose-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
                        >
                            {isEditMode ? "Update Master Registry" : "Finalize Incident Lodge"}
                        </button>
                    </>
                }
            >
                <form id="incident-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Registry Metadata</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelClasses}>Observation Date <span className="text-rose-500">*</span></label>
                                <input name="date" type="date" value={formData.date} onChange={handleInputChange} className={inputClasses(errors.date)} />
                                {errors.date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.date}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Breach Category <span className="text-rose-500">*</span></label>
                                <select name="violation_type" value={formData.violation_type} onChange={handleInputChange} className={inputClasses(errors.violation_type)}>
                                    <option value="Height Safety">Height Safety Breach</option>
                                    <option value="PPE Violation">PPE Non-Compliance</option>
                                    <option value="Material Handling">Unsafe Material Handling</option>
                                    <option value="Electrical Hazard">Electrical Hazard</option>
                                </select>
                                {errors.violation_type && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.violation_type}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Audit Lead <span className="text-rose-500">*</span></label>
                                <input name="responsible_person" value={formData.responsible_person} onChange={handleInputChange} placeholder="Officer Name" className={inputClasses(errors.responsible_person)} />
                                {errors.responsible_person && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.responsible_person}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Field Diagnostics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Incident Narration <span className="text-rose-500">*</span></label>
                                <textarea name="incident_description" rows={3} value={formData.incident_description} onChange={handleInputChange} placeholder="Technical description of the breach occurrence..." className={`${inputClasses(errors.incident_description)} resize-none`} />
                                {errors.incident_description && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.incident_description}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>PPE Compliance (%) <span className="text-rose-500">*</span></label>
                                <input name="ppe_compliance" value={formData.ppe_compliance} onChange={handleInputChange} placeholder="e.g. 100%" className={inputClasses(errors.ppe_compliance)} />
                                {errors.ppe_compliance && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.ppe_compliance}</p>}
                            </div>
                            <div>
                                <label className={labelClasses}>Injury Audit <span className="text-rose-500">*</span></label>
                                <input name="injury_details" value={formData.injury_details} onChange={handleInputChange} placeholder="Specifics or 'None'" className={inputClasses(errors.injury_details)} />
                                {errors.injury_details && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.injury_details}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Mitigation Protocol</h3>
                        <div>
                            <label className={labelClasses}>Mitigation Executed <span className="text-rose-500">*</span></label>
                            <textarea name="action_taken" rows={3} value={formData.action_taken} onChange={handleInputChange} placeholder="Protocol executed to normalize conditions..." className={`${inputClasses(errors.action_taken)} resize-none`} />
                            {errors.action_taken && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.action_taken}</p>}
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Case"
                message="Are you sure you want to delete this incident report? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default IncidentReportPage;
