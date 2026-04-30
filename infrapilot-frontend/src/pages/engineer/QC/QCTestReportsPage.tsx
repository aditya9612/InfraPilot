import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";

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
        id: "QC-TEST-501",
        inspection_type: "Structure",
        test_type: "Cube Test (7 Days)",
        activity: "M25 Grade Raft Concrete",
        result: "18.5 N/mm²",
        standard_value: "> 16.25 N/mm²",
        pass_fail: "Pass",
        engineer_name: "Sunil Verma",
        remarks: "Strength achieved 74% of target. Target was 65%.",
        date: "2026-04-12",
        attach_report: true,
    },
    {
        id: "QC-TEST-502",
        inspection_type: "Structure",
        test_type: "Slump Test",
        activity: "Column Casting Block B",
        result: "115 mm",
        standard_value: "100 - 130 mm",
        pass_fail: "Pass",
        engineer_name: "Sunil Verma",
        remarks: "Workability good for pumpable concrete.",
        date: "2026-04-12",
        attach_report: false,
    },
    {
        id: "QC-TEST-503",
        inspection_type: "Structure",
        test_type: "Cube Test (28 Days)",
        activity: "M30 Grade Plinth Beam",
        result: "24.2 N/mm²",
        standard_value: "> 30.0 N/mm²",
        pass_fail: "Fail",
        engineer_name: "Sunil Verma",
        remarks: "Under-strength. Core test required for verification.",
        date: "2026-04-10",
        attach_report: true,
    },
];

// ─── Main Component ─────────────────────────────────────────────────────────────

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
        inspection_type: "Structure",
        test_type: "Cube",
        activity: "",
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
            test_type: "Cube",
            activity: "",
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
            test_type: record.test_type,
            activity: record.activity,
            result: record.result,
            standard_value: record.standard_value,
            pass_fail: record.pass_fail,
            engineer_name: record.engineer_name,
            remarks: record.remarks,
            report_file: null,
        });
        setIsFormModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setTestToDelete(id);
        setIsDeleteModalOpen(true);
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
                test_type: formData.test_type,
                activity: formData.activity,
                result: formData.result,
                standard_value: formData.standard_value,
                pass_fail: formData.pass_fail,
                engineer_name: formData.engineer_name,
                remarks: formData.remarks,
            } : t));
            toast.success("Test Report Updated!");
        } else {
            const newEntry: TestRecord = {
                id: `QC-TEST-${500 + testList.length + 1}`,
                inspection_type: formData.inspection_type,
                test_type: formData.test_type,
                activity: formData.activity,
                result: formData.result,
                standard_value: formData.standard_value,
                pass_fail: formData.pass_fail,
                engineer_name: formData.engineer_name,
                remarks: formData.remarks,
                date: new Date().toISOString().split("T")[0],
                attach_report: !!formData.report_file,
            };
            setTestList((prev) => [newEntry, ...prev]);
            toast.success("Test Report Saved!");
        }
        setIsFormModalOpen(false);
    };

    const filteredList = testList.filter(t =>
        t.activity.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.test_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.engineer_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar
                title="QC Test Reports"
                breadcrumb={["InfraPilot", "Engineer", "QC", "Reports"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-inter">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">
                            Quality Assurance Validation
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Test Reports
                        </h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl font-inter">
                            Structural strength, workability, and chemical composition test records with scientific validation.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                        >
                            <span className="text-lg leading-none font-inter">+</span>
                            New Test Report
                        </button>
                    </div>
                </div>

                {/* ── Summary Stat Cards (Activity Style) ────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        Validation Performance
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-1 group-hover:w-full h-full bg-blue-500 transition-all duration-500 opacity-10 group-hover:opacity-5" />
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Tests</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{testList.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Lab Records</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Compliance Rate</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">
                                {Math.round((testList.filter(t => t.pass_fail === "Pass").length / (testList.length || 1)) * 100)}%
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Quality Adherence</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter relative group">
                            <div className="absolute inset-0 bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative z-10 font-inter">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-rose-600 transition-colors font-inter">Critical Fails</p>
                                <p className="text-2xl font-bold text-rose-500 font-inter font-inter">{testList.filter(t => t.pass_fail === "Fail").length}</p>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter font-inter">Needs Rectification</p>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Digitized Reports</p>
                            <p className="text-2xl font-bold text-blue-600 font-inter">{testList.filter(t => t.attach_report).length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Digital Verifications</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter">

                    {/* Icon + Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-200">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                        </div>
                        <span className="text-base font-bold text-slate-800 whitespace-nowrap">Lab Filters</span>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0" />

                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search by Activity or Test Type..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                        />
                    </div>
                </div>

                {/* ── Test Report Grid ────────────────────────────────────────── */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        {filteredList.map((item) => (
                            <div
                                key={item.id}
                                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col"
                            >
                                {/* Header: Type & Pass/Fail */}
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.inspection_type}</span>
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${item.pass_fail === "Pass"
                                        ? "bg-emerald-50 text-emerald-600"
                                        : "bg-rose-50 text-rose-600"
                                        }`}>
                                        {item.pass_fail}
                                    </span>
                                </div>

                                {/* Test Type Name */}
                                <p className="text-lg font-bold text-slate-900 font-inter leading-tight mb-0.5">{item.test_type}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-widest uppercase">{item.id}</p>

                                {/* Activity / Location */}
                                <p className="text-xs font-medium text-slate-500 mt-3 line-clamp-1 italic-none">{item.activity}</p>

                                {/* Technical Breakdown */}
                                <div className="grid grid-cols-2 gap-3 mt-6 mb-6">
                                    <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-50">
                                        <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Result</p>
                                        <p className="text-xs font-black text-blue-600 truncate">{item.result}</p>
                                    </div>
                                    <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-50">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Standard</p>
                                        <p className="text-xs font-black text-slate-700 truncate">{item.standard_value}</p>
                                    </div>
                                </div>

                                {/* Engineer & Actions */}
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Exec Lead</p>
                                        <p className="text-xs font-bold text-slate-700">{item.engineer_name}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedTest(item)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="View Detail"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleOpenEdit(item)}
                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Edit Report"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(item.id)}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                            title="Delete Record"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredList.length === 0 && (
                        <div className="bg-white rounded-xl p-20 text-center border border-slate-100 shadow-sm font-inter">
                            <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs font-inter">No test reports match filters</p>
                        </div>
                    )}
                </div>
            </PageTransition>

            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedTest}
                onClose={() => setSelectedTest(null)}
                title="Test Analysis Insight"
                maxWidth="max-w-xl"
            >
                {selectedTest && (
                    <div className="bg-white p-6 italic-none font-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl shadow-blue-100 mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Scientific Lab Records</p>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedTest.test_type}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                        <svg className="w-6 h-6 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Batch ID</p>
                                        <p className="text-xl font-black">{selectedTest.id}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Status</p>
                                        <p className="text-xl font-black">{selectedTest.pass_fail.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Technical Diagnostics ──────────────────────────── */}
                        <div className="grid grid-cols-2 gap-y-8 gap-x-12 px-1 mb-10 font-inter">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Inspection Context</p>
                                <p className="text-sm font-black text-slate-800 tracking-tight">{selectedTest.inspection_type}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Activity Area</p>
                                <p className="text-sm font-black text-slate-800 line-clamp-1">{selectedTest.activity}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Validation Result</p>
                                <p className="text-sm font-black text-indigo-600 tabular-nums">{selectedTest.result}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Standard Required</p>
                                <p className="text-sm font-black text-slate-800 tabular-nums">{selectedTest.standard_value}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Responsible Lead</p>
                                <p className="text-sm font-black text-slate-800">{selectedTest.engineer_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Analysis Date</p>
                                <p className="text-sm font-black text-slate-800 tabular-nums">{selectedTest.date}</p>
                            </div>
                        </div>

                        {/* ── Lab Commentary ─────────────────────────────────── */}
                        <div className="mb-10 px-1 font-inter">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Laboratory Observations</p>
                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 italic-none text-sm text-slate-600 leading-relaxed font-inter">
                                "{selectedTest.remarks || "No supplementary lab notes provided by the validation lead."}"
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50 font-inter">
                            <button
                                onClick={() => setSelectedTest(null)}
                                className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-400 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest font-inter"
                            >
                                Close Analysis
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedTest);
                                    setSelectedTest(null);
                                }}
                                className="flex-[1.5] px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 justify-center active:scale-95 font-inter"
                            >
                                Modify Registry
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* ── FORM MODAL (Add / Edit) ────────────────────────────────── */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title={isEditMode ? "Modify Test Report" : "New Material Test Entry"}
                maxWidth="max-w-4xl"
            >
                <div className="bg-white p-6 md:p-8 italic-none font-inter">
                    <form id="test-form" onSubmit={handleSubmit} className="space-y-10">
                        {/* Section 1: Record Identity */}
                        <div>
                            <div className="flex items-center gap-3 mb-8 font-inter">
                                <div className="w-1 h-6 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase font-inter">Record Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-inter">
                                <div className="flex flex-col gap-2 font-inter">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Inspection Type <span className="text-rose-500 font-inter">*</span></label>
                                    <input
                                        name="inspection_type"
                                        value={formData.inspection_type}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Structure, Finishing"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:outline-none font-inter"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 font-inter">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Activity <span className="text-rose-500 font-inter">*</span></label>
                                    <input
                                        name="activity"
                                        value={formData.activity}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Raft Concrete Piling"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 transition-all font-inter ${errors.activity ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2 font-inter">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Test Type <span className="text-rose-500 font-inter">*</span></label>
                                    <input
                                        name="test_type"
                                        value={formData.test_type}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Cube, Slump"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl text-sm font-black text-slate-800 focus:outline-none font-inter ${errors.test_type ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Verification Data */}
                        <div>
                            <div className="flex items-center gap-3 mb-8 font-inter">
                                <div className="w-1 h-6 bg-emerald-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase font-inter">Verification Data</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 font-inter">
                                <div className="flex flex-col gap-2 font-inter">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Result / Value <span className="text-rose-500 font-inter">*</span></label>
                                    <input
                                        name="result"
                                        value={formData.result}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 18.5 N/mm²"
                                        className={`w-full px-5 py-3.5 bg-blue-50 border border-blue-100 rounded-2xl text-sm font-black text-blue-600 focus:outline-none font-inter ${errors.result ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                                <div className="flex flex-col gap-2 font-inter">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Standard Required</label>
                                    <input
                                        name="standard_value"
                                        value={formData.standard_value}
                                        onChange={handleInputChange}
                                        placeholder="As per IS Codes"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:outline-none font-inter"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 font-inter">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Compliance</label>
                                    <div className="flex gap-4 font-inter">
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, pass_fail: "Pass" }))} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border font-inter ${formData.pass_fail === "Pass" ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-white border-slate-200 text-slate-400 hover:border-emerald-300"}`}>PASS</button>
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, pass_fail: "Fail" }))} className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border font-inter ${formData.pass_fail === "Fail" ? "bg-rose-600 border-rose-600 text-white shadow-lg shadow-rose-100" : "bg-white border-slate-200 text-slate-400 hover:border-rose-300"}`}>FAIL</button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2 font-inter">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Lead Engineer <span className="text-rose-500 font-inter">*</span></label>
                                    <input
                                        name="engineer_name"
                                        value={formData.engineer_name}
                                        onChange={handleInputChange}
                                        placeholder="Responsible Engineer"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-2xl text-sm font-black text-slate-800 focus:outline-none font-inter ${errors.engineer_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Technical Remarks */}
                        <div className="flex flex-col gap-2 font-inter">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 font-inter">Laboratory Observations</label>
                            <textarea
                                name="remarks"
                                rows={4}
                                value={formData.remarks}
                                onChange={handleInputChange}
                                placeholder="Final audit notes, laboratory observations, and corrective actions..."
                                className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium text-slate-700 focus:outline-none resize-none transition-all font-inter"
                            />
                        </div>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-5 border-t border-slate-100 flex items-center justify-between font-inter">
                    <button onClick={() => setIsFormModalOpen(false)} className="text-xs font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest outline-none font-inter">Discard</button>
                    <button type="submit" form="test-form" className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 justify-center active:scale-95 font-inter">
                        {isEditMode ? "Update Report" : "Save to Registry"}
                    </button>
                </div>
            </Modal>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setTestToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Test Report"
                message="Are you sure you want to delete this QC test report? This will permanently remove the laboratory validation data and cannot be undone."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default QCTestReportsPage;
