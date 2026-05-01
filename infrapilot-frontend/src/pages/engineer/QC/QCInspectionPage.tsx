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
  Eye
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface InspectionRecord {
    id: string;
    inspection_type: string;
    activity: string;
    test_type: string;
    result: string;
    standard_value: string;
    pass_fail: "Pass" | "Fail";
    engineer_name: string;
    remarks: string;
    attach_report: boolean;
    date: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────
const inspectionHistory: InspectionRecord[] = [
    {
        id: "QC-INS-101",
        inspection_type: "Structure",
        activity: "Raft Reinforcement Inspection",
        test_type: "Visual Check",
        result: "Verified",
        standard_value: "As per Drawings",
        pass_fail: "Pass",
        engineer_name: "Amit Sharma",
        remarks: "All bars placed as per drawing. Spacing verified.",
        date: "2026-04-12",
        attach_report: true,
    },
    {
        id: "QC-INS-102",
        inspection_type: "Material",
        activity: "Course Aggregate Visual",
        test_type: "Visual",
        result: "Satisfactory",
        standard_value: "Graded Aggregate",
        pass_fail: "Pass",
        engineer_name: "Rajesh Varma",
        remarks: "Angular particles, no dust. Size verified.",
        date: "2026-04-11",
        attach_report: false,
    },
    {
        id: "QC-INS-103",
        inspection_type: "Finishing",
        activity: "Brickwork Leveling Check",
        test_type: "Leveling",
        result: "10mm Deviation",
        standard_value: "±2mm",
        pass_fail: "Fail",
        engineer_name: "Amit Sharma",
        remarks: "Level deviation of 10mm in west wall. Re-work required.",
        date: "2026-04-10",
        attach_report: true,
    },
];

const QCInspectionPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState<InspectionRecord | null>(null);
    const [inspectionList, setInspectionList] = useState<InspectionRecord[]>(inspectionHistory);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [inspectionToDelete, setInspectionToDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: "",
        inspection_type: "Structure",
        activity: "",
        test_type: "Cube",
        result: "",
        standard_value: "",
        pass_fail: "Pass" as "Pass" | "Fail",
        engineer_name: "",
        remarks: "",
        report_file: null as File | null,
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
        if (!formData.activity.trim()) newErrors.activity = "Required";
        if (!formData.test_type.trim()) newErrors.test_type = "Required";
        if (!formData.result.trim()) newErrors.result = "Required";
        if (!formData.engineer_name.trim()) newErrors.engineer_name = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData({
            id: "",
            inspection_type: "Structure",
            activity: "",
            test_type: "Cube",
            result: "",
            standard_value: "",
            pass_fail: "Pass",
            engineer_name: "",
            remarks: "",
            report_file: null,
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (record: InspectionRecord) => {
        setIsEditMode(true);
        setFormData({
            id: record.id,
            inspection_type: record.inspection_type,
            activity: record.activity,
            test_type: record.test_type,
            result: record.result,
            standard_value: record.standard_value,
            pass_fail: record.pass_fail,
            engineer_name: record.engineer_name,
            remarks: record.remarks,
            report_file: null,
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!inspectionToDelete) return;
        setInspectionList(prev => prev.filter(i => i.id !== inspectionToDelete));
        toast.success("Inspection record deleted");
        setIsDeleteModalOpen(false);
        setInspectionToDelete(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        if (isEditMode) {
            setInspectionList(prev => prev.map(i => i.id === formData.id ? {
                ...i,
                inspection_type: formData.inspection_type,
                activity: formData.activity,
                test_type: formData.test_type,
                result: formData.result,
                standard_value: formData.standard_value,
                pass_fail: formData.pass_fail,
                engineer_name: formData.engineer_name,
                remarks: formData.remarks,
            } : i));
            toast.success("Inspection Updated!");
        } else {
            const newEntry: InspectionRecord = {
                id: `QC-INS-${100 + inspectionList.length + 1}`,
                inspection_type: formData.inspection_type,
                activity: formData.activity,
                test_type: formData.test_type,
                result: formData.result,
                standard_value: formData.standard_value,
                pass_fail: formData.pass_fail,
                engineer_name: formData.engineer_name,
                remarks: formData.remarks,
                date: new Date().toISOString().split("T")[0],
                attach_report: !!formData.report_file,
            };
            setInspectionList((prev) => [newEntry, ...prev]);
            toast.success("Inspection Recorded!");
        }
        setIsFormModalOpen(false);
    };

    const filteredList = useMemo(() => {
        return inspectionList.filter(i =>
            i.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.engineer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [inspectionList, searchTerm]);

    // Stats
    const totalAudits = inspectionList.length;
    const passRate = Math.round((inspectionList.filter(i => i.pass_fail === "Pass").length / (totalAudits || 1)) * 100);
    const reportsFiled = inspectionList.filter(i => i.attach_report).length;
    const criticalFails = inspectionList.filter(i => i.pass_fail === "Fail").length;

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-white border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
    `;

    return (
        <>
            <Navbar title="QC Inspection" breadcrumb={["Engineer", "QC", "Inspection Registry"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Inspection Registry</h1>
                        <p className="text-slate-500 text-sm">Material inspection logs and structural audit reports.</p>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        New Inspection
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Audits"
                        value={totalAudits.toString()}
                        sub="Registered Logs"
                        accent="text-slate-800"
                        icon={<ClipboardCheck className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Pass Rate"
                        value={`${passRate}%`}
                        sub="Quality Adherence"
                        accent="text-emerald-500"
                        icon={<ShieldCheck className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Reports Filed"
                        value={reportsFiled.toString()}
                        sub="Digital Verifications"
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
                                placeholder="Search by Activity or Batch ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">Inspection Details</th>
                                    <th className="px-6 py-4">Test Type</th>
                                    <th className="px-6 py-4">Result</th>
                                    <th className="px-6 py-4">Engineer</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredList.length > 0 ? (
                                    filteredList.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-800">{item.activity}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{item.id} • {item.inspection_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-semibold text-slate-600">{item.test_type}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-slate-800">{item.result}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium text-slate-500">{item.engineer_name}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                                                    item.pass_fail === 'Pass' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 animate-pulse'
                                                }`}>
                                                    {item.pass_fail}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => setSelectedInspection(item)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
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
                                                        onClick={() => { setInspectionToDelete(item.id); setIsDeleteModalOpen(true); }}
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
                                        <td colSpan={6} className="px-6 py-20 text-center text-slate-400 italic">
                                            No inspection records found.
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
                isOpen={!!selectedInspection}
                onClose={() => setSelectedInspection(null)}
                title="Inspection Insight"
                maxWidth="max-w-xl"
            >
                {selectedInspection && (
                    <div className="p-6">
                        <div className="bg-primary/5 rounded-[2rem] p-8 mb-8 border border-primary/10 relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2">Audit Certificate</p>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-6">{selectedInspection.activity}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Batch ID</p>
                                        <p className="text-lg font-black text-slate-800">{selectedInspection.id}</p>
                                    </div>
                                    <div className="bg-white rounded-2xl p-4 shadow-sm">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Final Result</p>
                                        <p className={`text-lg font-black ${selectedInspection.pass_fail === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {selectedInspection.pass_fail.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-y-8 gap-x-12 px-2 mb-10">
                            <div>
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Type</p>
                                <p className="text-sm font-bold text-slate-800">{selectedInspection.inspection_type}</p>
                            </div>
                            <div>
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Test Protocol</p>
                                <p className="text-sm font-bold text-slate-800">{selectedInspection.test_type}</p>
                            </div>
                            <div>
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Observed Result</p>
                                <p className="text-sm font-bold text-primary">{selectedInspection.result}</p>
                            </div>
                            <div>
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Engineer</p>
                                <p className="text-sm font-bold text-slate-800">{selectedInspection.engineer_name}</p>
                            </div>
                        </div>

                        <div className="mb-10 px-2">
                            <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-2')}>Remarks</p>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
                                "{selectedInspection.remarks || "No additional commentary provided."}"
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedInspection(null)}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
                        >
                            Dismiss
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={isEditMode ? "Modify Inspection" : "New Inspection"}
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            form="inspection-form"
                            type="submit"
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            {isEditMode ? "Commit Updates" : "Save Entry"}
                        </button>
                    </>
                }
            >
                <form id="inspection-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Record Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClasses}>Inspection Type <span className="text-rose-500">*</span></label>
                                <select name="inspection_type" value={formData.inspection_type} onChange={handleInputChange} className={inputClasses()}>
                                    <option value="Structure">Structure</option>
                                    <option value="Material">Material</option>
                                    <option value="Finishing">Finishing</option>
                                    <option value="QC Validation">QC Validation</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Activity Name <span className="text-rose-500">*</span></label>
                                <input name="activity" value={formData.activity} onChange={handleInputChange} placeholder="e.g. Concrete Piling Inspection" className={inputClasses(errors.activity)} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Technical Diagnostics</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelClasses}>Test Protocol <span className="text-rose-500">*</span></label>
                                <input name="test_type" value={formData.test_type} onChange={handleInputChange} placeholder="Cube / Slump" className={inputClasses(errors.test_type)} />
                            </div>
                            <div>
                                <label className={labelClasses}>Observed Result <span className="text-rose-500">*</span></label>
                                <input name="result" value={formData.result} onChange={handleInputChange} placeholder="Observed Value" className={inputClasses(errors.result)} />
                            </div>
                            <div>
                                <label className={labelClasses}>Compliance Status</label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, pass_fail: "Pass" }))}
                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${formData.pass_fail === "Pass" ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-white border-slate-200 text-slate-400"}`}
                                    >PASS</button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, pass_fail: "Fail" }))}
                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${formData.pass_fail === "Fail" ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100" : "bg-white border-slate-200 text-slate-400"}`}
                                    >FAIL</button>
                                </div>
                            </div>
                            <div className="md:col-span-3">
                                <label className={labelClasses}>Lead Engineer <span className="text-rose-500">*</span></label>
                                <input name="engineer_name" value={formData.engineer_name} onChange={handleInputChange} placeholder="Responsible Engineer" className={inputClasses(errors.engineer_name)} />
                            </div>
                            <div className="md:col-span-3">
                                <label className={labelClasses}>Final Remarks</label>
                                <textarea name="remarks" rows={3} value={formData.remarks} onChange={handleInputChange} placeholder="Technical notes..." className={`${inputClasses()} resize-none`} />
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Inspection"
                message="Are you sure you want to delete this quality inspection log? This action cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default QCInspectionPage;
