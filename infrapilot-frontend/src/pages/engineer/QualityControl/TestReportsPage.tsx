import React, { useState, useRef } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

const TestReportsPage = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTest, setSelectedTest] = useState<any>(null);
    const [downloadingId, setDownloadingId] = useState<number | null>(null);
    const [reportFile, setReportFile] = useState<File | null>(null);

    const [testData, setTestData] = useState([
        { id: 1, inspectionType: "Pre-Concreting Audit", activity: "Footing F1-F10", testType: "Cube Strength", result: "21.5 N/mm²", standardValue: "20 N/mm²", status: "Pass", engineerName: "Arjun Mehta", remarks: "Satisfactory mix hydration and reinforcement mesh alignment.", date: "2024-03-28" },
        { id: 2, inspectionType: "Slump Check", activity: "Column Casting (Block A)", testType: "Slump Consistency", result: "110 mm", standardValue: "80-120 mm", status: "Pass", engineerName: "Suresh R.", remarks: "Optimal workability for dense reinforcement pouring.", date: "2024-04-01" },
        { id: 3, inspectionType: "Structural Audit", activity: "Foundation Raft", testType: "NDT Diagnostic", result: "28.2 N/mm²", standardValue: "30 N/mm²", status: "Fail", engineerName: "Vikram S.", remarks: "Localized honeycomb detected; sonic pulse velocity below threshold.", date: "2024-04-05" },
    ]);

    const [formData, setFormData] = useState({
        inspectionType: "",
        activity: "",
        testType: "Cube",
        result: "",
        standardValue: "",
        status: "Pass",
        engineerName: "Arjun Mehta",
        remarks: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleDownload = (id: number, testName: string) => {
        setDownloadingId(id);
        const toastId = toast.loading(`Securely retrieving protocol ${testName}...`, { position: "top-right" });

        setTimeout(() => {
            setDownloadingId(null);
            toast.success("Intelligence artifact decrypted!", { id: toastId, position: "top-right" });
        }, 1500);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const upd = { ...prev };
                delete upd[name];
                return upd;
            });
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReportFile(e.target.files[0]);
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.inspectionType) newErrors.inspectionType = "Required";
        if (!formData.activity) newErrors.activity = "Required";
        if (!formData.result) newErrors.result = "Required";
        if (!formData.standardValue) newErrors.standardValue = "Required";
        if (!formData.engineerName) newErrors.engineerName = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Test Protocol Parameters Incomplete.");
            return;
        }

        const newTest = {
            ...formData,
            id: Date.now(),
            date: new Date().toISOString().split("T")[0],
        };

        toast.loading("Scheduling Structural Diagnostic...", { id: "test-load" });
        setTimeout(() => {
            setTestData([newTest, ...testData]);
            toast.success("Test Protocol Operational!", { id: "test-load" });
            setIsModalOpen(false);
            handleReset();
        }, 1200);
    };

    const handleReset = () => {
        setFormData({
            inspectionType: "",
            activity: "",
            testType: "Cube",
            result: "",
            standardValue: "",
            status: "Pass",
            engineerName: "Arjun Mehta",
            remarks: "",
        });
        setReportFile(null);
        setErrors({});
    };

    return (
        <>
            <Navbar
                title="Compliance Terminal"
                breadcrumb={["InfraPilot", "Structural Intelligence", "Diagnostics"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Site Compliance Ledger</h2>
                        <p className="text-slate-500 text-sm font-medium">Advanced laboratory metrics and material integrity diagnostics.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + SCHEDULE TEST
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                        Structural Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Pending Lab Sync"
                            value="05"
                            sub="Awaiting Metrics"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Pass Rate (24h)"
                            value="92%"
                            sub="Compliant Spectrum"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Critical Violations"
                            value="01"
                            sub="Requires Re-test"
                            accent="text-rose-600"
                        />
                        <StatCard
                            title="Total Diagnostics"
                            value="1.2k"
                            sub="Verified Assets"
                            accent="text-blue-600"
                        />
                    </div>
                </section>

                <section className="mb-24">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2 px-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Compliance Matrix Ledger
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
                        {testData.map((t) => (
                            <div
                                key={t.id}
                                className="relative bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden cursor-pointer"
                                onClick={() => setSelectedTest(t)}
                            >
                                <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-full transition-all ${t.status === 'Pass' ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]"}`} />

                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-blue-600 transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:rotate-6 shadow-sm px-2 text-center leading-tight uppercase font-black">
                                            QC-{t.id}
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1 block">Activity: {t.activity}</span>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tighter group-hover:text-blue-600 transition-colors uppercase leading-tight font-black">{t.inspectionType}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 italic uppercase tracking-widest">{t.engineerName}</p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest border transition-all ${t.status === 'Pass' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'}`}>
                                        {t.status === 'Pass' ? 'COMPLIANT' : 'VIOLATION'}
                                    </span>
                                </div>

                                <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 grid grid-cols-2 gap-8 uppercase">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block font-black">Observed Metric</span>
                                        <p className={`text-3xl font-black tracking-tighter italic ${t.status === 'Pass' ? 'text-slate-800' : 'text-rose-600 animate-pulse'}`}>{t.result}</p>
                                        <p className="text-[10px] font-bold text-amber-500 mt-1 uppercase tracking-widest underline underline-offset-4 decoration-amber-200">Tolerance: {t.standardValue}</p>
                                    </div>
                                    <div className="space-y-1 border-l border-slate-200 pl-8 font-black">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block font-black">Diagnostic Mode</span>
                                        <p className="text-xl font-black tracking-tight text-blue-600 italic font-black">{t.testType}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Protocol Verified</p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between px-4 pt-2 border-t border-slate-50 mt-auto uppercase">
                                    <div className="flex flex-col font-black">
                                        <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase mb-1 font-black">Lab Sync Date</span>
                                        <span className="text-sm font-black text-slate-700 tracking-tighter italic underline underline-offset-4 decoration-slate-200 font-black">{t.date}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDownload(t.id, t.testType); }}
                                            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:bg-blue-50 transition-all shadow-sm active:scale-90"
                                        >
                                            {downloadingId === t.id ? (
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                            )}
                                        </button>
                                        <button className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-slate-200">
                                            →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </PageTransition>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Structural Diagnostic Scheduling"
                maxWidth="max-w-5xl"
            >
                <div className="p-12 bg-white">
                    <form id="test-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Scope Matrix */}
                        <div className="space-y-8">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-blue-600" />
                                <h3 className="admin-pulse-form-section-title">Diagnostic Scope Matrix</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="admin-pulse-form-group col-span-2">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Inspection Protocol Type</label>
                                    <select
                                        name="inspectionType"
                                        value={formData.inspectionType}
                                        onChange={handleChange}
                                        className={`admin-pulse-form-input cursor-pointer ${errors.inspectionType ? 'border-rose-300' : ''}`}
                                    >
                                        <option value="">Select Protocol Identification...</option>
                                        <option>Pre-Concreting Audit</option>
                                        <option>Structural Integrity Scan</option>
                                        <option>Slump Workability Check</option>
                                        <option>Material Strength Test</option>
                                    </select>
                                    {errors.inspectionType && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.inspectionType}</p>}
                                </div>

                                <div className="admin-pulse-form-group col-span-2">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Target Activity / Location</label>
                                    <input
                                        type="text"
                                        name="activity"
                                        value={formData.activity}
                                        onChange={handleChange}
                                        placeholder="e.g. SLAB S1 FOUNDATION REINFORCEMENT"
                                        className={`admin-pulse-form-input ${errors.activity ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.activity && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.activity}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Technical Specs */}
                        <div className="space-y-8 bg-slate-50/50 -mx-12 p-12 border-y border-slate-100 italic">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-emerald-600" />
                                <h3 className="admin-pulse-form-section-title">Technical Baseline Definitions</h3>
                            </div>

                            <div className="grid grid-cols-4 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Test Mode</label>
                                    <select name="testType" value={formData.testType} onChange={handleChange} className="admin-pulse-form-input font-black uppercase">
                                        <option>Cube</option>
                                        <option>Slump</option>
                                        <option>NDT</option>
                                        <option>Ultrasonic</option>
                                    </select>
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Observed Result</label>
                                    <input type="text" name="result" value={formData.result} onChange={handleChange} placeholder="VALUE" className={`admin-pulse-form-input text-blue-600 font-bold ${errors.result ? 'border-rose-300' : ''}`} />
                                    {errors.result && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.result}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Standard Value</label>
                                    <input type="text" name="standardValue" value={formData.standardValue} onChange={handleChange} placeholder="EXPECTED" className={`admin-pulse-form-input ${errors.standardValue ? 'border-rose-300' : ''}`} />
                                    {errors.standardValue && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.standardValue}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Verdict</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className={`admin-pulse-form-input font-black uppercase ${formData.status === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        <option>Pass</option>
                                        <option>Fail</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Engineer & Records */}
                        <div className="space-y-8">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-amber-500" />
                                <h3 className="admin-pulse-form-section-title">Execution Entity & Documentation</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Engineer In-Charge</label>
                                    <input type="text" name="engineerName" value={formData.engineerName} onChange={handleChange} className={`admin-pulse-form-input ${errors.engineerName ? 'border-rose-300' : ''}`} />
                                    {errors.engineerName && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.engineerName}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Diagnostic Report / Artifact</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`admin-pulse-form-input !h-[56px] flex items-center justify-between px-6 cursor-pointer border-2 border-dashed group transition-all ${reportFile ? 'bg-blue-50 border-blue-200' : 'hover:border-blue-600'}`}
                                    >
                                        <span className={`text-[10px] font-bold tracking-widest ${reportFile ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                                            {reportFile?.name || "+ ATTACH LAB REPORT"}
                                        </span>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                        <svg className={`w-5 h-5 ${reportFile ? 'text-blue-400' : 'text-slate-300 group-hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                </div>
                                <div className="admin-pulse-form-group col-span-2">
                                    <label className="admin-pulse-form-label">Operational Remarks</label>
                                    <textarea name="remarks" rows={3} value={formData.remarks} onChange={handleChange} placeholder="SUPPLEMENTAL DIAGNOSTIC DATA..." className="admin-pulse-form-input p-6 resize-none" />
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="admin-pulse-form-summary">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Diagnostic Verification Result</span>
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">{formData.status === 'Pass' ? 'STRUCTURAL PASS' : 'INTEGRITY FAILURE'}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.status === 'Pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-12 pb-12 rounded-b-[40px] flex items-center justify-end gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="admin-pulse-btn-text">Abort Schedule</button>
                    <button type="button" onClick={handleReset} className="admin-pulse-btn-text !text-blue-600 underline">Clear Protocol</button>
                    <button type="submit" form="test-form" className="admin-pulse-btn-primary">Synchronize Diagnostic</button>
                </div>
            </Modal>

            {/* Detailed View Modal */}
            <Modal
                isOpen={!!selectedTest}
                onClose={() => setSelectedTest(null)}
                title="Structural Diagnostic Intelligence"
                maxWidth="max-w-4xl"
            >
                {selectedTest && (
                    <div className="p-10 bg-white">
                        {/* Premium Banner */}
                        <div className="admin-pulse-details-banner">
                            <div className="admin-pulse-details-icon-container">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedTest.inspectionType}</h2>
                                    <span className={`admin-pulse-status-badge ${selectedTest.status === 'Pass' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' :
                                        'bg-rose-500/20 text-rose-100 border-rose-500/30 animate-pulse'
                                        } backdrop-blur-md border`}>
                                        {selectedTest.status.toUpperCase()}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-white tracking-tight mb-2 uppercase">{selectedTest.activity}</h3>
                                <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em]">Diagnostic Hash: QC-{selectedTest.id}-INTEGRITY</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-12">
                            {/* Left Column: Diagnostic Intelligence */}
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Diagnostic Intelligence</h3>
                                    </div>
                                    <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 mb-8">
                                        <div className="admin-pulse-details-group mb-6">
                                            <span className="admin-pulse-details-label">Observed Metric</span>
                                            <p className="text-4xl font-black text-slate-800 tracking-tighter italic">{selectedTest.result}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">Test Mode</span>
                                                <p className="font-black text-slate-700 uppercase">{selectedTest.testType}</p>
                                            </div>
                                            <div className="admin-pulse-details-group text-right">
                                                <span className="admin-pulse-details-label uppercase">Standard Tolerance</span>
                                                <p className="font-black text-blue-600 uppercase">{selectedTest.standardValue}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Execution Context</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-8">
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Engineer In-Charge</span>
                                            <p className="admin-pulse-details-value uppercase">{selectedTest.engineerName}</p>
                                        </div>
                                        <div className="admin-pulse-details-group">
                                            <span className="admin-pulse-details-label">Synchronization Date</span>
                                            <p className="admin-pulse-details-value uppercase">{selectedTest.date}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: Narrative & Action */}
                            <div className="space-y-10">
                                <div>
                                    <div className="admin-pulse-details-section-header">
                                        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                        <h3 className="admin-pulse-details-section-title">Operational Narrative</h3>
                                    </div>
                                    <div className="p-8 bg-blue-50/30 rounded-[32px] border border-blue-100 min-h-[200px]">
                                        <span className="admin-pulse-details-label mb-4 block underline underline-offset-4 decoration-blue-200">Remarks Portfolio</span>
                                        <p className="text-sm font-bold text-slate-700 leading-relaxed italic">{selectedTest.remarks}</p>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-900 rounded-[32px] border border-slate-800 flex items-center justify-between group overflow-hidden relative">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/20 transition-all"></div>
                                    <div className="flex flex-col gap-1 relative z-10">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Compliance Status</span>
                                        <p className="text-2xl font-black text-white tracking-tighter italic">{selectedTest.status === 'Pass' ? 'STRUCTURAL PASS' : 'CRITICAL FAILURE'}</p>
                                    </div>
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg relative z-10 ${selectedTest.status === 'Pass' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-rose-600 shadow-rose-500/20'}`}>
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic">VERIFIED BY INFRAPILOT CORE INFRASTRUCTURE</span>
                            <button onClick={() => setSelectedTest(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12">
                                Terminate Intel Session
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default TestReportsPage;
