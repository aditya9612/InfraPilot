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
  Activity
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
        if (!formData.incident_description) newErrors.incident_description = "Required";
        if (!formData.action_taken) newErrors.action_taken = "Required";
        if (!formData.responsible_person) newErrors.responsible_person = "Required";
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
                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Lodge Incident
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

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
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
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => setSelectedIncident(item)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
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
                title="Incident Insight"
                maxWidth="max-w-xl"
            >
                {selectedIncident && (
                    <div className="p-6">
                        <div className="bg-rose-600 rounded-[2rem] p-8 mb-8 text-white shadow-xl shadow-rose-100 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Critical Case Audit</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6">{selectedIncident.violation_type}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Case ID</p>
                                        <p className="text-lg font-black">{selectedIncident.id}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Protection</p>
                                        <p className="text-lg font-black">{selectedIncident.ppe_compliance}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10">
                            <div>
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-2')}>Technical Narration</p>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                                    "{selectedIncident.incident_description}"
                                </div>
                            </div>
                            <div>
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-2')}>Corrective Strategy</p>
                                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-sm text-emerald-700 font-bold leading-relaxed">
                                    "{selectedIncident.action_taken}"
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Injury Audit</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedIncident.injury_details}</p>
                                </div>
                                <div>
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Reporting Officer</p>
                                    <p className="text-sm font-bold text-slate-800">{selectedIncident.responsible_person}</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedIncident(null)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
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
                            </div>
                            <div>
                                <label className={labelClasses}>Breach Category</label>
                                <select name="violation_type" value={formData.violation_type} onChange={handleInputChange} className={inputClasses()}>
                                    <option value="Height Safety">Height Safety Breach</option>
                                    <option value="PPE Violation">PPE Non-Compliance</option>
                                    <option value="Material Handling">Unsafe Material Handling</option>
                                    <option value="Electrical Hazard">Electrical Hazard</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Audit Lead <span className="text-rose-500">*</span></label>
                                <input name="responsible_person" value={formData.responsible_person} onChange={handleInputChange} placeholder="Officer Name" className={inputClasses(errors.responsible_person)} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Field Diagnostics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Incident Narration <span className="text-rose-500">*</span></label>
                                <textarea name="incident_description" rows={3} value={formData.incident_description} onChange={handleInputChange} placeholder="Technical description of the breach occurrence..." className={`${inputClasses(errors.incident_description)} resize-none`} />
                            </div>
                            <div>
                                <label className={labelClasses}>PPE Compliance (%)</label>
                                <input name="ppe_compliance" value={formData.ppe_compliance} onChange={handleInputChange} placeholder="e.g. 100%" className={inputClasses()} />
                            </div>
                            <div>
                                <label className={labelClasses}>Injury Audit</label>
                                <input name="injury_details" value={formData.injury_details} onChange={handleInputChange} placeholder="Specifics or 'None'" className={inputClasses()} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Mitigation Protocol</h3>
                        <div>
                            <label className={labelClasses}>Mitigation Executed <span className="text-rose-500">*</span></label>
                            <textarea name="action_taken" rows={3} value={formData.action_taken} onChange={handleInputChange} placeholder="Protocol executed to normalize conditions..." className={`${inputClasses(errors.action_taken)} resize-none`} />
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
