import React, { useState } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ───────────────────────────────────────────────────────────────────

interface TestRecord {
    id: string;
    testType: string;
    activity: string;
    result: string;
    standardValue: string;
    status: "Pass" | "Fail";
    engineerName: string;
    remarks: string;
    date: string;
    reportAttached: boolean;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const testHistory: TestRecord[] = [
    {
        id: "QC-TEST-501",
        testType: "Cube Test (7 Days)",
        activity: "M25 Grade Raft Concrete",
        result: "18.5 N/mm²",
        standardValue: "> 16.25 N/mm²",
        status: "Pass",
        engineerName: "Sunil Verma",
        remarks: "Strength achieved 74% of target. Target was 65%.",
        date: "2026-04-12",
        reportAttached: true,
    },
    {
        id: "QC-TEST-502",
        testType: "Slump Test",
        activity: "Column Casting Block B",
        result: "115 mm",
        standardValue: "100 - 130 mm",
        status: "Pass",
        engineerName: "Sunil Verma",
        remarks: "Workability good for pumpable concrete.",
        date: "2026-04-12",
        reportAttached: false,
    },
    {
        id: "QC-TEST-503",
        testType: "Cube Test (28 Days)",
        activity: "M30 Grade Plinth Beam",
        result: "24.2 N/mm²",
        standardValue: "> 30.0 N/mm²",
        status: "Fail",
        engineerName: "Sunil Verma",
        remarks: "Under-strength. Core test required for verification.",
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

const QCTestReportsPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<TestRecord | null>(null);
    const [testList, setTestList] = useState<TestRecord[]>(testHistory);

    const [formData, setFormData] = useState({
        testType: "Cube",
        activity: "",
        result: "",
        standardValue: "",
        status: "Pass" as "Pass" | "Fail",
        engineerName: "",
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
        if (!formData.result) newErrors.result = "Required";
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

        const newEntry: TestRecord = {
            id: `QC-TEST-${500 + testList.length + 1}`,
            testType: formData.testType === "Cube" ? "Cube Test (7/28 Days)" : "Slump Test",
            activity: formData.activity,
            result: formData.result,
            standardValue: formData.standardValue,
            status: formData.status,
            engineerName: formData.engineerName,
            remarks: formData.remarks,
            date: new Date().toISOString().split("T")[0],
            reportAttached: !!formData.attachReport,
        };

        setTestList((prev) => [newEntry, ...prev]);
        toast.success("Test Report Saved!");
        setIsFormModalOpen(false);
        setFormData({
            testType: "Cube",
            activity: "",
            result: "",
            standardValue: "",
            status: "Pass",
            engineerName: "",
            remarks: "",
            attachReport: null,
        });
    };

    return (
        <>
            <Navbar
                title="QC Test Reports"
                breadcrumb={["InfraPilot", "Engineer", "QC", "Reports"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter italic-none">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Scientific Validation
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Material Test Reports
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Structural strength, workability, and chemical composition test records.
                        </p>
                    </div>

                    <button
                        onClick={() => setIsFormModalOpen(true)}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-md shadow-indigo-200 transition-all active:scale-95"
                    >
                        <span className="text-lg leading-none">+</span>
                        Create Test Report
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total Tests</p>
                        <p className="text-2xl font-bold text-slate-800">{testList.length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Approved Results</p>
                        <p className="text-2xl font-bold text-emerald-500">{testList.filter(t => t.status === "Pass").length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Defective / Low Strength</p>
                        <p className="text-2xl font-bold text-rose-500">{testList.filter(t => t.status === "Fail").length}</p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Testing Compliance</p>
                        <p className="text-2xl font-bold text-indigo-600">100%</p>
                    </div>
                </div>

                {/* Ledger */}
                <div className="grid grid-cols-1 gap-5">
                    {testList.map((item) => (
                        <div
                            key={item.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 cursor-pointer group transition-all"
                            onClick={() => setSelectedTest(item)}
                        >
                            <div className="absolute left-0 top-4 bottom-4 w-1 bg-indigo-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-black text-slate-800 tracking-tight">{item.testType}</h3>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${statusColors[item.status]}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                            {item.activity} | Date: {item.date} | ID: {item.id}
                                        </p>
                                    </div>
                                    {item.reportAttached && (
                                        <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-100">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            Report Attached
                                        </span>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                    <ProfileField label="OBSERVED RESULT" value={item.result} accent="text-slate-800" />
                                    <ProfileField label="STANDARD VALUE" value={item.standardValue} />
                                    <ProfileField label="LAB ENGINEER" value={item.engineerName} />
                                    <ProfileField label="DATE" value={item.date} />
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic opacity-60">
                                        Lab Test Registry • {item.id}
                                    </span>
                                    <button
                                        className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-[0.2em] transition-all"
                                    >
                                        View Full Scientific Analysis →
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </PageTransition>

            {/* Detail Modal */}
            <Modal
                isOpen={!!selectedTest}
                onClose={() => setSelectedTest(null)}
                title="QC Test Analysis"
                maxWidth="max-w-[1000px]"
            >
                {selectedTest && (
                    <div className="bg-white p-0 italic-none">
                        <div className="mx-8 mt-8 mb-10 p-10 rounded-[2.5rem] bg-gradient-to-r from-indigo-900 via-blue-900 to-slate-900 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="flex items-center gap-8 relative z-10">
                                <div className="w-24 h-24 flex items-center justify-center bg-white/20 backdrop-blur-md rounded-[2rem] border border-white/30 shadow-inner">
                                    <span className="text-3xl font-black text-white tracking-widest uppercase">
                                        LAB
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-2">
                                        <h3 className="text-3xl font-black text-white tracking-tight">
                                            {selectedTest.testType}
                                        </h3>
                                        <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] border border-white/20 bg-white/10 text-white backdrop-blur-sm">
                                            {selectedTest.status}
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-white tracking-wide">
                                        {selectedTest.activity}
                                    </p>
                                    <p className="text-sm font-semibold text-indigo-100/80 mt-1">
                                        Verified by: <span className="text-white">Sr. Lab Engineer {selectedTest.engineerName}</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="px-12 pb-12 space-y-12">
                            <div>
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-50 pb-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    </div>
                                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Scientific Results</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-y-10 gap-x-16">
                                    <ProfileField label="OBSERVED STRENGTH / VALUE" value={selectedTest.result} accent="text-indigo-600" />
                                    <ProfileField label="REQUIRED STANDARD" value={selectedTest.standardValue} />
                                    <ProfileField label="ENGINEER NAME" value={selectedTest.engineerName} />
                                    <ProfileField label="TEST DATE" value={selectedTest.date} />
                                    <div className="md:col-span-2">
                                        <ProfileField label="OBSERVATIONS & REMARKS" value={selectedTest.remarks} />
                                    </div>
                                </div>
                            </div>

                            {selectedTest.reportAttached && (
                                <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-indigo-900 leading-none mb-1">lab_test_report_{selectedTest.id}.pdf</p>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Authenticated Lab Report Attached</p>
                                        </div>
                                    </div>
                                    <button className="px-6 py-2 bg-white text-indigo-600 text-[10px] font-black rounded-lg border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all uppercase tracking-widest">Download</button>
                                </div>
                            )}
                        </div>

                        <div className="bg-slate-50 px-12 py-6 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedTest(null)}
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
                title="New Material Test Entry"
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8 italic-none">
                    <form id="test-form" onSubmit={handleSubmit} className="space-y-12">

                        {/* Section 1: Identity */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1 h-6 bg-indigo-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Test Identity</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Test Type</label>
                                    <select
                                        name="testType"
                                        value={formData.testType}
                                        onChange={handleInputChange}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Cube">Cube Test</option>
                                        <option value="Slump">Slump Test</option>
                                        <option value="Rebound">Rebound Hammer</option>
                                        <option value="UPV">UPV Test</option>
                                    </select>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Activity Context *</label>
                                    <input
                                        name="activity"
                                        value={formData.activity}
                                        onChange={handleInputChange}
                                        placeholder="e.g. Raft Concrete Piling"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.activity ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.activity && <p className="text-[10px] text-rose-500 font-bold">{errors.activity}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Engineer In-charge *</label>
                                    <input
                                        name="engineerName"
                                        value={formData.engineerName}
                                        onChange={handleInputChange}
                                        placeholder="Lab Engineer Name"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.engineerName ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.engineerName && <p className="text-[10px] text-rose-500 font-bold">{errors.engineerName}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Technicals */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1 h-6 bg-slate-800 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Technical Values</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Observed Result *</label>
                                    <input
                                        name="result"
                                        value={formData.result}
                                        onChange={handleInputChange}
                                        placeholder="e.g. 24.5 N/mm²"
                                        className={`w-full px-5 py-3.5 bg-slate-50 border rounded-xl text-sm font-bold text-slate-800 focus:outline-none transition-all ${errors.result ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.result && <p className="text-[10px] text-rose-500 font-bold">{errors.result}</p>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Standard Value</label>
                                    <input
                                        name="standardValue"
                                        value={formData.standardValue}
                                        onChange={handleInputChange}
                                        placeholder="As per IS Codes"
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none"
                                    />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Overall Status</label>
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

                        {/* Section 3: Remarks */}
                        <div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-1 h-6 bg-indigo-100 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase">Observations</h3>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Technical Remarks</label>
                                <textarea
                                    name="remarks"
                                    rows={4}
                                    value={formData.remarks}
                                    onChange={handleInputChange}
                                    placeholder="Summary of lab observations…"
                                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none resize-none"
                                />
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
                        form="test-form"
                        className="px-12 py-4 bg-indigo-900 hover:bg-slate-900 text-white text-sm font-black rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95"
                    >
                        Save Test Results
                    </button>
                </div>
            </Modal>
        </>
    );
};

export default QCTestReportsPage;
