import React, { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  FlaskConical, 
  CheckCircle2, 
  FileCheck, 
  AlertCircle, 
  Search, 
  Plus, 
  Edit2, 
  Trash2,
  Eye,
  Briefcase,
  Phone,
  Mail,
  FileText
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface TestRecord {
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
const testHistory: TestRecord[] = [
    {
        id: "QC-TST-201",
        inspection_type: "Material",
        activity: "Cement Setting Time Test",
        test_type: "Vicat Apparatus",
        result: "32 mins",
        standard_value: "> 30 mins",
        pass_fail: "Pass",
        engineer_name: "Amit Sharma",
        remarks: "Initial setting time complies with IS code requirements.",
        date: "2026-04-12",
        attach_report: true,
    },
    {
        id: "QC-TST-202",
        inspection_type: "Structure",
        activity: "M35 Concrete Cube Test (7 Days)",
        test_type: "Compression",
        result: "24.5 N/mm²",
        standard_value: "23.0 N/mm²",
        pass_fail: "Pass",
        engineer_name: "Rajesh Varma",
        remarks: "Strength achieved 70% of target. Satisfactory.",
        date: "2026-04-11",
        attach_report: true,
    },
    {
        id: "QC-TST-203",
        inspection_type: "Material",
        activity: "Steel Tensile Strength",
        test_type: "UTM",
        result: "480 N/mm²",
        standard_value: "500 N/mm²",
        pass_fail: "Fail",
        engineer_name: "Amit Sharma",
        remarks: "Yield strength below specified grade. Batch rejected.",
        date: "2026-04-10",
        attach_report: false,
    },
];

const QCTestReportsPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<TestRecord | null>(null);
    const [testList, setTestList] = useState<TestRecord[]>(testHistory);
    const [isEditMode, setIsEditMode] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [testToDelete, setTestToDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        id: "",
        inspection_type: "Material",
        activity: "",
        test_type: "Compression",
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
        if (!formData.inspection_type) newErrors.inspection_type = "Required";
        if (!formData.activity.trim()) newErrors.activity = "Required";
        if (!formData.test_type.trim()) newErrors.test_type = "Required";
        if (!formData.result.trim()) newErrors.result = "Required";
        if (!formData.pass_fail) newErrors.pass_fail = "Required";
        if (!formData.engineer_name.trim()) newErrors.engineer_name = "Required";
        if (!formData.remarks.trim()) newErrors.remarks = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData({
            id: "",
            inspection_type: "Material",
            activity: "",
            test_type: "Compression",
            result: "",
            standard_value: "",
            pass_fail: "Pass",
            engineer_name: "",
            remarks: "",
            report_file: null,
        });
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (record: TestRecord) => {
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
        if (!testToDelete) return;
        setTestList(prev => prev.filter(t => t.id !== testToDelete));
        toast.success("Test report deleted");
        setIsDeleteModalOpen(false);
        setTestToDelete(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }

        if (isEditMode) {
            setTestList(prev => prev.map(t => t.id === formData.id ? {
                ...t,
                inspection_type: formData.inspection_type,
                activity: formData.activity,
                test_type: formData.test_type,
                result: formData.result,
                standard_value: formData.standard_value,
                pass_fail: formData.pass_fail,
                engineer_name: formData.engineer_name,
                remarks: formData.remarks,
            } : t));
            toast.success("Report Updated!");
        } else {
            const newEntry: TestRecord = {
                id: `QC-TST-${200 + testList.length + 1}`,
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
            setTestList((prev) => [newEntry, ...prev]);
            toast.success("Test Logged!");
        }
        setIsFormModalOpen(false);
    };

    const filteredList = useMemo(() => {
        return testList.filter(t =>
            t.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.engineer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [testList, searchTerm]);

    // Stats
    const totalTests = testList.length;
    const passRate = Math.round((testList.filter(t => t.pass_fail === "Pass").length / (totalTests || 1)) * 100);
    const pendingReviews = testList.filter(t => !t.attach_report).length;
    const verifiedBatches = testList.filter(t => t.attach_report).length;

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
    const inputClasses = (error?: string) => `
        w-full px-4 py-2.5 bg-white border 
        ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
        rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
    `;

    return (
        <>
            <Navbar title="QC Test Reports" breadcrumb={["Engineer", "QC", "Test Registry"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Technical Test Logs</h1>
                        <p className="text-slate-500 text-sm">Material strength tests and lab analysis verifications.</p>
                    </div>
                    <button
                        onClick={handleOpenAdd}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log Lab Test
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Tests"
                        value={totalTests.toString()}
                        sub="Conducted Trials"
                        accent="text-slate-800"
                        icon={<FlaskConical className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Compliance"
                        value={`${passRate}%`}
                        sub="Batch Pass Rate"
                        accent="text-emerald-500"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Verified"
                        value={verifiedBatches.toString()}
                        sub="Reported Batches"
                        accent="text-blue-500"
                        icon={<FileCheck className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Pending Cert"
                        value={pendingReviews.toString()}
                        sub="Awaiting Uploads"
                        accent="text-amber-500"
                        icon={<AlertCircle className="w-5 h-5" />}
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
                                placeholder="Search by Test Name or ID..."
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
                                    <th className="px-6 py-4">Test Details</th>
                                    <th className="px-6 py-4">Protocol</th>
                                    <th className="px-6 py-4">Strength/Value</th>
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
                                                <div className="flex items-center justify-end gap-2 transition-opacity">
                                                    <button 
                                                        onClick={() => setSelectedTest(item)}
                                                        className="p-2 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
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
                                                        onClick={() => { setTestToDelete(item.id); setIsDeleteModalOpen(true); }}
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
                                            No test reports found.
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
                isOpen={!!selectedTest}
                onClose={() => setSelectedTest(null)}
                title="Test Intelligence Insight"
                maxWidth="max-w-xl"
            >
                {selectedTest && (
                    <div className="p-6 font-inter text-inter italic-none">
                        {/* ── Profile Style Header ────────────────── */}
                        <div className="bg-primary rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 flex items-center gap-6 font-inter">
                                <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative font-inter">
                                    <span className="text-4xl font-black font-inter">{selectedTest.activity.charAt(0)}</span>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 border-4 border-primary rounded-full animate-pulse" />
                                </div>
                                <div className="font-inter">
                                    <div className="flex items-center gap-3 mb-2 font-inter">
                                        <h3 className="text-2xl font-black tracking-tight font-inter">{selectedTest.activity}</h3>
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedTest.pass_fail === 'Pass' ? 'bg-emerald-500/20 text-emerald-100' : 'bg-rose-500/20 text-rose-100'}`}>
                                            {selectedTest.pass_fail}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                        <Mail className="w-3 h-3" />
                                        <span className="text-[11px] font-bold font-inter italic-none">lab.ref-{selectedTest.id.toLowerCase()}@infrapilot.com</span>
                                    </div>
                                    <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                        <span className="text-[10px] font-black uppercase tracking-widest font-inter">PROTOCOL: {selectedTest.test_type}</span>
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
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Lab Intelligence</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Test Category</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedTest.inspection_type}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Strength Result</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedTest.result}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Standard Benchmark</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedTest.standard_value}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Compliance Result</p>
                                        <p className={`text-sm font-black font-inter italic-none ${selectedTest.pass_fail === 'Pass' ? 'text-emerald-500' : 'text-rose-500'}`}>{selectedTest.pass_fail.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Details style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <Phone className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Lab Trail & Personnel</p>
                                </div>
                                <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Lab Incharge</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">{selectedTest.engineer_name}</p>
                                    </div>
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Lab Log ID</p>
                                        <p className="text-sm font-black text-slate-800 font-inter italic-none">LAB-{selectedTest.id}X-26</p>
                                    </div>
                                </div>
                            </div>

                            {/* Assignments style section */}
                            <div className="font-inter">
                                <div className="flex items-center gap-2 mb-6 font-inter">
                                    <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Technical Summary</p>
                                </div>
                                <div className="font-inter">
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed font-inter italic-none">
                                        {selectedTest.remarks || "No additional lab-specific technical remarks provided for this test cycle."}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedTest(null)}
                        >
                            Close Report
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                title={isEditMode ? "Modify Test Log" : "Register Test Result"}
                maxWidth="max-w-4xl"
                footer={
                    <>
                        <button onClick={() => setIsFormModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">
                            Cancel
                        </button>
                        <button
                            form="test-form"
                            type="submit"
                            className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                        >
                            {isEditMode ? "Update Log" : "Confirm Entry"}
                        </button>
                    </>
                }
            >
                <form id="test-form" onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Test Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className={labelClasses}>Test Category <span className="text-rose-500">*</span></label>
                                <select name="inspection_type" value={formData.inspection_type} onChange={handleInputChange} className={inputClasses()}>
                                    <option value="Material">Material</option>
                                    <option value="Structure">Structure</option>
                                    <option value="Chemical">Chemical</option>
                                    <option value="Soil">Soil</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClasses}>Test Name / Activity <span className="text-rose-500">*</span></label>
                                <input name="activity" value={formData.activity} onChange={handleInputChange} placeholder="e.g. 7-Day Cube Strength" className={inputClasses(errors.activity)} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Technical Results</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div>
                                <label className={labelClasses}>Apparatus / Method <span className="text-rose-500">*</span></label>
                                <input name="test_type" value={formData.test_type} onChange={handleInputChange} placeholder="UTM / Compression" className={inputClasses(errors.test_type)} />
                            </div>
                            <div>
                                <label className={labelClasses}>Result Value <span className="text-rose-500">*</span></label>
                                <input name="result" value={formData.result} onChange={handleInputChange} placeholder="Strength / Units" className={inputClasses(errors.result)} />
                            </div>
                            <div>
                                <label className={labelClasses}>Batch Status <span className="text-rose-500">*</span></label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setFormData(prev => ({ ...prev, pass_fail: "Pass" })); if (errors.pass_fail) setErrors(prev => { const u = {...prev}; delete u.pass_fail; return u; }); }}
                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${formData.pass_fail === "Pass" ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-white border-slate-200 text-slate-400"}`}
                                    >PASS</button>
                                    <button
                                        type="button"
                                        onClick={() => { setFormData(prev => ({ ...prev, pass_fail: "Fail" })); if (errors.pass_fail) setErrors(prev => { const u = {...prev}; delete u.pass_fail; return u; }); }}
                                        className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold transition-all border ${formData.pass_fail === "Fail" ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100" : "bg-white border-slate-200 text-slate-400"}`}
                                    >FAIL</button>
                                </div>
                                {errors.pass_fail && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.pass_fail}</p>}
                            </div>
                            <div className="md:col-span-3">
                                <label className={labelClasses}>Lab Engineer <span className="text-rose-500">*</span></label>
                                <input name="engineer_name" value={formData.engineer_name} onChange={handleInputChange} placeholder="Conducting Engineer" className={inputClasses(errors.engineer_name)} />
                                {errors.engineer_name && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.engineer_name}</p>}
                            </div>
                            <div className="md:col-span-3">
                                <label className={labelClasses}>Technical Commentary <span className="text-rose-500">*</span></label>
                                <textarea name="remarks" rows={3} value={formData.remarks} onChange={handleInputChange} placeholder="Notes on failure or observations..." className={`${inputClasses(errors.remarks)} resize-none`} />
                                {errors.remarks && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.remarks}</p>}
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Test Report"
                message="Are you sure you want to delete this lab analysis report? This action is permanent."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default QCTestReportsPage;
