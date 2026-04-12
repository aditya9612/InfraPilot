import React, { useState, useRef } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import toast from "react-hot-toast";

const InspectionPage = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [reportFile, setReportFile] = useState<File | null>(null);

    const [formData, setFormData] = useState({
        inspectionType: "",
        activity: "",
        testType: "Cube",
        result: "",
        standardValue: "",
        status: "Pass",
        engineerName: "Arjun Mehta", // Default engineer
        remarks: "",
    });

    const [inspections, setInspections] = useState([
        {
            id: 101,
            inspectionType: "Safety Protocol Check",
            activity: "High-Rise Scaffolding",
            testType: "Visual",
            result: "Compliant",
            standardValue: "Safety Code 2024",
            status: "Pass",
            engineerName: "Arjun Mehta",
            remarks: "All harnesses verified",
            date: "2024-04-10"
        },
        {
            id: 102,
            inspectionType: "Structural Alignment",
            activity: "Column C12 Casting",
            testType: "Laser Level",
            result: "+4mm",
            standardValue: "< ±5mm",
            status: "Requires Correction",
            engineerName: "Arjun Mehta",
            remarks: "Slight deviation beyond tolerance",
            date: "2024-04-09"
        },
    ]);

    const [errors, setErrors] = useState<Record<string, string>>({});

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
            toast.error("Audit Protocol Incomplete.");
            return;
        }

        const newLog = {
            ...formData,
            id: Date.now(),
            date: new Date().toISOString().split("T")[0],
        };

        toast.loading("Synchronizing Quality Audit Data...", { id: "audit-load" });
        setTimeout(() => {
            setInspections([newLog, ...inspections]);
            toast.success("Audit Protocol Synchronized!", { id: "audit-load" });
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
                title="Quality Audit Terminal"
                breadcrumb={["InfraPilot", "Quality Management", "Audits"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Field Inspection Ledger</h2>
                        <p className="text-slate-500 text-sm font-medium">Real-time compliance monitoring and structural verification.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + PERFORM AUDIT
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Compliance Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Scheduled Today"
                            value="06"
                            sub="Target Sync"
                            accent="text-blue-600"
                        />
                        <StatCard
                            title="Active Deviations"
                            value="02"
                            sub="Critical NCs"
                            accent="text-rose-600"
                        />
                        <StatCard
                            title="Total Compliance"
                            value="94.8%"
                            sub="Project Health"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Pending Reviews"
                            value="04"
                            sub="Awaiting Sign-off"
                            accent="text-amber-500"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Audit History & Findings
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {inspections.map((item) => (
                            <div key={item.id} className="relative bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-2xl hover:shadow-slate-200/50 transition-all group overflow-hidden">
                                <div className={`absolute left-0 top-10 bottom-10 w-2 rounded-r-full transition-all ${item.status === 'Pass' ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : "bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                                    }`} />

                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-[24px] bg-slate-50 border border-slate-100 flex items-center justify-center text-[10px] font-black text-emerald-600 transition-all group-hover:bg-slate-900 group-hover:text-white group-hover:rotate-6 shadow-sm px-2 text-center leading-tight">
                                            {item.inspectionType.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mb-1 block">AUDIT {item.id} | {item.date}</span>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tighter group-hover:text-emerald-600 transition-colors uppercase">{item.inspectionType}</h3>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1 italic">Loc: {item.activity}</p>
                                        </div>
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black tracking-widest border transition-all ${item.status === 'Pass' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                                        }`}>
                                        {item.status === 'Pass' ? 'COMPLIANT' : 'FAILURE'}
                                    </span>
                                </div>

                                <div className="p-8 bg-slate-50/50 rounded-[32px] border border-slate-100 grid grid-cols-2 gap-8">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block">Metric Observation</span>
                                        <p className="text-2xl font-black tracking-tighter text-slate-800">{item.result}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{item.testType} Analysis</p>
                                    </div>
                                    <div className="space-y-1 border-l border-slate-200 pl-8">
                                        <span className="text-[10px] font-black text-slate-400 tracking-widest uppercase block">Target Standard</span>
                                        <p className="text-sm font-black tracking-tight text-blue-600">{item.standardValue}</p>
                                        <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Protocol Verified</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 px-4 pt-2 border-t border-slate-50 mt-auto">
                                    <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                                        {item.engineerName.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[12px] font-black text-slate-700 tracking-tight">{item.engineerName}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">{item.remarks}</span>
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
                title="Field Audit Compliance Protocol"
                maxWidth="max-w-5xl"
            >
                <div className="p-12 bg-white">
                    <form id="inspection-form" onSubmit={handleSubmit} className="space-y-12">
                        {/* Scope Identification */}
                        <div className="space-y-8">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-emerald-600" />
                                <h3 className="admin-pulse-form-section-title">Audit Scope Identification</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="admin-pulse-form-group col-span-2">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Inspection Type</label>
                                    <select
                                        name="inspectionType"
                                        value={formData.inspectionType}
                                        onChange={handleChange}
                                        className={`admin-pulse-form-input cursor-pointer ${errors.inspectionType ? 'border-rose-300' : ''}`}
                                    >
                                        <option value="">Select Audit Type...</option>
                                        <option>Structural Alignment</option>
                                        <option>Concrete Quality Control</option>
                                        <option>Electrical Safety Check</option>
                                        <option>Finishing Standards Audit</option>
                                        <option>Safety Protocol Check</option>
                                    </select>
                                    {errors.inspectionType && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.inspectionType}</p>}
                                </div>

                                <div className="admin-pulse-form-group col-span-2">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Execution Activity</label>
                                    <input
                                        type="text"
                                        name="activity"
                                        value={formData.activity}
                                        onChange={handleChange}
                                        placeholder="e.g. SLAB S12 REINFORCEMENT"
                                        className={`admin-pulse-form-input ${errors.activity ? 'border-rose-300' : ''}`}
                                    />
                                    {errors.activity && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.activity}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Technical Diagnostics */}
                        <div className="space-y-8 bg-slate-50/50 -mx-12 p-12 border-y border-slate-100 italic">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-blue-600" />
                                <h3 className="admin-pulse-form-section-title">Technical Core Diagnostics</h3>
                            </div>

                            <div className="grid grid-cols-4 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Test Category</label>
                                    <select name="testType" value={formData.testType} onChange={handleChange} className="admin-pulse-form-input">
                                        <option>Cube</option>
                                        <option>Slump</option>
                                        <option>NDT</option>
                                        <option>Laser</option>
                                        <option>Visual</option>
                                    </select>
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Result Observed</label>
                                    <input type="text" name="result" value={formData.result} onChange={handleChange} placeholder="VALUE" className={`admin-pulse-form-input text-blue-600 font-bold ${errors.result ? 'border-rose-300' : ''}`} />
                                    {errors.result && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.result}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Standard Value</label>
                                    <input type="text" name="standardValue" value={formData.standardValue} onChange={handleChange} placeholder="THRESHOLD" className={`admin-pulse-form-input ${errors.standardValue ? 'border-rose-300' : ''}`} />
                                    {errors.standardValue && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.standardValue}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Verdict</label>
                                    <select name="status" value={formData.status} onChange={handleChange} className={`admin-pulse-form-input font-bold ${formData.status === 'Pass' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        <option>Pass</option>
                                        <option>Fail</option>
                                        <option>Requires Correction</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Authority & Evidence */}
                        <div className="space-y-8">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-amber-500" />
                                <h3 className="admin-pulse-form-section-title">Authority Sign-off & Documentation</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Engineer Name</label>
                                    <input type="text" name="engineerName" value={formData.engineerName} onChange={handleChange} className={`admin-pulse-form-input ${errors.engineerName ? 'border-rose-300' : ''}`} />
                                    {errors.engineerName && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.engineerName}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label">Attach Audit Report / Artifact</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`admin-pulse-form-input !h-[56px] flex items-center justify-between px-6 cursor-pointer border-2 border-dashed group transition-all ${reportFile ? 'bg-emerald-50 border-emerald-200' : 'hover:border-blue-600'}`}
                                    >
                                        <span className={`text-[10px] font-bold tracking-widest ${reportFile ? 'text-emerald-600' : 'text-slate-400 group-hover:text-blue-600'}`}>
                                            {reportFile ? reportFile.name : "+ SELECT DOCUMENT"}
                                        </span>
                                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                        <svg className={`w-5 h-5 ${reportFile ? 'text-emerald-400' : 'text-slate-300 group-hover:text-blue-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    </div>
                                </div>
                                <div className="admin-pulse-form-group col-span-2">
                                    <label className="admin-pulse-form-label">Operational Remarks</label>
                                    <textarea name="remarks" rows={3} value={formData.remarks} onChange={handleChange} placeholder="SUPPLEMENTAL AUDIT NOTES..." className="admin-pulse-form-input resize-none p-6" />
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="admin-pulse-form-summary">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Compliance Status Verdict</span>
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">{formData.status === 'Pass' ? 'APPROVED' : 'ACTION REQUIRED'}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.status === 'Pass' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-12 pb-12 rounded-b-[40px] flex items-center justify-end gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="admin-pulse-btn-text">Abort Audit</button>
                    <button type="button" onClick={handleReset} className="admin-pulse-btn-text !text-blue-600 underline">Clear Protocol</button>
                    <button type="submit" form="inspection-form" className="admin-pulse-btn-primary !bg-emerald-600 hover:!bg-emerald-700 shadow-emerald-500/30">Synchronize Audit</button>
                </div>
            </Modal>

        </>
    );
};

export default InspectionPage;
