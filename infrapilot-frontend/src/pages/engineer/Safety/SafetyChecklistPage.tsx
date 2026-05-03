import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  ClipboardCheck, 
  ShieldCheck, 
  FileText, 
  AlertOctagon, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Eye,
  Briefcase,
  Phone,
  Mail
} from "lucide-react";

const statusColors: Record<string, string> = {
    'Completed': 'bg-emerald-600',
    'Pending': 'bg-rose-600',
    'Action Required': 'bg-rose-600',
};

// ─── Types ───────────────────────────────────────────────────────────────────
interface ChecklistRecord {
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
const checklistHistory: ChecklistRecord[] = [
    {
        id: "SF-CHK-201",
        date: "2026-04-13",
        checklist_status: "Completed",
        ppe_compliance: "95%",
        violation_type: "None",
        incident_description: "General Site Inspection",
        injury_details: "None",
        action_taken: "Routine Check Completed",
        responsible_person: "Suresh Mani",
    },
    {
        id: "SF-CHK-202",
        date: "2026-04-12",
        checklist_status: "Issues Found",
        ppe_compliance: "75%",
        violation_type: "Height Safety",
        incident_description: "Workers without harness on level 4",
        injury_details: "Potential fall hazard identified",
        action_taken: "Work stopped, safety briefing conducted",
        responsible_person: "Vikram Singh",
    },
];

const SafetyChecklistPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedAudit, setSelectedAudit] = useState<ChecklistRecord | null>(null);
    const [checklistData, setChecklistData] = useState<ChecklistRecord[]>(checklistHistory);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [auditToDelete, setAuditToDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: "",
        date: new Date().toISOString().split("T")[0],
        checklist_status: "Completed",
        ppe_compliance: "100%",
        violation_type: "None",
        incident_description: "",
        injury_details: "None",
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
        if (!formData.checklist_status) newErrors.checklist_status = "Required";
        if (!formData.responsible_person.trim()) newErrors.responsible_person = "Required";
        if (!formData.action_taken.trim()) newErrors.action_taken = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData({
            id: "",
            date: new Date().toISOString().split("T")[0],
            checklist_status: "Completed",
            ppe_compliance: "100%",
            violation_type: "None",
            incident_description: "",
            injury_details: "None",
            action_taken: "",
            responsible_person: "",
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (record: ChecklistRecord) => {
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
        if (!auditToDelete) return;
        setChecklistData(prev => prev.filter(t => t.id !== auditToDelete));
        toast.success("Safety record deleted");
        setIsDeleteModalOpen(false);
        setAuditToDelete(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        if (isEditMode) {
            setChecklistData(prev => prev.map(t => t.id === formData.id ? {
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
            toast.success("Audit Updated!");
        } else {
            const newEntry: ChecklistRecord = {
                ...formData,
                id: `SF-CHK-${200 + checklistData.length + 1}`,
            };
            setChecklistData((prev) => [newEntry, ...prev]);
            toast.success("Safety Audit Recorded!");
        }
        setIsFormModalOpen(false);
    };

    const filteredHistory = useMemo(() => {
        return checklistData.filter(item => {
            const matchesSearch = item.responsible_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.incident_description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesSearch;
        });
    }, [checklistData, searchTerm]);

    // Stats
    const totalAudits = checklistData.length;
    const complianceRate = Math.round((checklistData.filter(c => c.checklist_status === "Completed").length / (totalAudits || 1)) * 100);
    const cleanAudits = checklistData.filter(c => c.checklist_status === "Completed").length;
    const criticalFails = checklistData.filter(c => c.checklist_status === "Issues Found").length;

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-white border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
    `;

    return (
        <>
            <Navbar title="Safety Checklist" breadcrumb={["Engineer", "Safety", "Audit Log"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Safety Checklist</h1>
                        <p className="text-slate-500 text-sm">Site audit sessions and PPE compliance tracking.</p>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log Audit
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Audits"
                        value={totalAudits.toString()}
                        sub="Audit Sessions"
                        accent="text-slate-800"
                        icon={<ClipboardCheck className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Compliance Rate"
                        value={`${complianceRate}%`}
                        sub="Overall Adherence"
                        accent="text-emerald-500"
                        icon={<ShieldCheck className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Clean Audits"
                        value={cleanAudits.toString()}
                        sub="Safe Sessions"
                        accent="text-blue-500"
                        icon={<FileText className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Critical Fails"
                        value={criticalFails.toString()}
                        sub="Needs Rectification"
                        accent="text-rose-500"
                        icon={<AlertOctagon className="w-5 h-5" />}
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
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">Audit Description</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">PPE Compliance</th>
                                    <th className="px-6 py-4">Lead Officer</th>
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
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    item.checklist_status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {item.checklist_status}
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
                                                        onClick={() => setSelectedAudit(item)}
                                                        className={`p-2 text-white rounded-xl shadow-lg transition-all active:scale-95 ${statusColors[item.checklist_status as keyof typeof statusColors] || 'bg-primary'} ${item.checklist_status ? `shadow-${statusColors[item.checklist_status as keyof typeof statusColors]?.split('-')[1]}/20` : 'shadow-primary/20'}`}
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
                                                        onClick={() => { setAuditToDelete(item.id); setIsDeleteModalOpen(true); }}
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
                                            No audit records found.
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
                isOpen={!!selectedAudit}
                onClose={() => setSelectedAudit(null)}
                title="Safety Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedAudit && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className={`${statusColors[selectedAudit.checklist_status as keyof typeof statusColors] || 'bg-primary'} rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter`}>
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-black font-inter">{selectedAudit.checklist_status.charAt(0)}</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-primary rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter">Audit Session</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedAudit.checklist_status === 'Completed' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100'}`}>
                                            {selectedAudit.checklist_status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter italic-none">safety.ref-{selectedAudit.id.toLowerCase()}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-inter">AUDIT DATE: {selectedAudit.date}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            {/* Professional Information style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Briefcase className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Protocol Compliance</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">PPE Compliance</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedAudit.ppe_compliance}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Responsible Officer</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedAudit.responsible_person}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Compliance Level</p>
                                        <p className={`text-sm font-black font-inter italic-none ${selectedAudit.checklist_status === 'Completed' ? 'text-emerald-500' : 'text-rose-500'}`}>{selectedAudit.checklist_status.toUpperCase()}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Verification ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedAudit.id}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Audit Trail & Observations</p>
                                </div>
                                <div className="grid grid-cols-1 gap-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Lead Engineer Remarks</p>
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed font-inter italic-none">
                                            "{selectedAudit.incident_description}"
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Assignments style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Protocol Integrity</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Action Taken</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedAudit.action_taken}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">System Sync</p>
                                        <p className="text-sm font-black text-emerald-500 font-inter italic-none">Verified Record</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedAudit(null)}
                            className={`w-full py-4 ${statusColors[selectedAudit.checklist_status as keyof typeof statusColors] || 'bg-primary'} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${selectedAudit.checklist_status ? `shadow-${statusColors[selectedAudit.checklist_status as keyof typeof statusColors]?.split('-')[1]}/20` : 'shadow-primary/20'}`}
                        >
                            Close insight
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={isEditMode ? "Modify Safety Audit" : "New Safety Audit Entry"}
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            form="safety-form"
                            type="submit"
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            {isEditMode ? "Update Master Audit" : "Finalize Protocol Entry"}
                        </button>
                    </>
                }
            >
                <form id="safety-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Audit Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClasses}>Audit Date <span className="text-rose-500">*</span></label>
                                <input name="date" type="date" value={formData.date} onChange={handleInputChange} className={inputClasses(errors.date)} />
                            </div>
                            <div>
                                <label className={labelClasses}>Responsible Officer <span className="text-rose-500">*</span></label>
                                <input name="responsible_person" value={formData.responsible_person} onChange={handleInputChange} placeholder="Audit Lead Name" className={inputClasses(errors.responsible_person)} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Verification Data</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelClasses}>Checklist Status <span className="text-rose-500">*</span></label>
                                <select name="checklist_status" value={formData.checklist_status} onChange={handleInputChange} className={inputClasses()}>
                                    <option value="Completed">Completed - Safe</option>
                                    <option value="Issues Found">Issues Found</option>
                                    <option value="Pending">Pending Audit</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>PPE Compliance (%) <span className="text-rose-500">*</span></label>
                                <input name="ppe_compliance" value={formData.ppe_compliance} onChange={handleInputChange} placeholder="e.g. 100%" className={inputClasses()} />
                            </div>
                            <div>
                                <label className={labelClasses}>Violation Type <span className="text-rose-500">*</span></label>
                                <input name="violation_type" value={formData.violation_type} onChange={handleInputChange} placeholder="Specific Hazard" className={inputClasses()} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Field Observations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClasses}>Audit Narration <span className="text-rose-500">*</span></label>
                                <textarea name="incident_description" rows={3} value={formData.incident_description} onChange={handleInputChange} placeholder="Technical description of the audit session..." className={`${inputClasses()} resize-none`} />
                            </div>
                            <div>
                                <label className={labelClasses}>Injury Audit <span className="text-rose-500">*</span></label>
                                <textarea name="injury_details" rows={3} value={formData.injury_details} onChange={handleInputChange} placeholder="Medical audit findings..." className={`${inputClasses()} resize-none`} />
                            </div>
                            <div className="md:col-span-2">
                                <label className={labelClasses}>Corrective Action Taken <span className="text-rose-500">*</span></label>
                                <input name="action_taken" value={formData.action_taken} onChange={handleInputChange} placeholder="Protocol executed to mitigate risks" className={inputClasses(errors.action_taken)} />
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Audit"
                message="Are you sure you want to delete this safety audit record? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default SafetyChecklistPage;
