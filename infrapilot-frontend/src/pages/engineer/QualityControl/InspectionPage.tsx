import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";

const InspectionPage = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        inspectionType: "",
        activity: "",
        testType: "Cube",
        result: "",
        standardValue: "",
        status: "Pass",
        engineerName: "Arjun Mehta",
        remarks: "",
        hasReport: false,
    });

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
        if (e.target.files && e.target.files.length > 0) {
            setFormData(prev => ({ ...prev, hasReport: true }));
            if (errors.report) {
                setErrors(prev => {
                    const upd = { ...prev };
                    delete upd.report;
                    return upd;
                });
            }
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.inspectionType) newErrors.inspectionType = "Inspection type is required";
        if (!formData.activity) newErrors.activity = "Linked activity is required";
        if (!formData.result.trim()) newErrors.result = "Test result is required";
        if (!formData.standardValue.trim()) newErrors.standardValue = "Standard value is required";
        if (!formData.remarks.trim()) newErrors.remarks = "Remarks are required for audit";
        if (!formData.hasReport) newErrors.report = "Please attach the test report file";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all mandatory fields and attach report", { position: "top-right" });
            return;
        }
        toast.success("QC Inspection submitted successfully!", { position: "top-right" });
        console.log("QC Submission:", formData);
        handleReset();
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
            hasReport: false,
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setErrors({});
    };

    return (
        <>
            <Navbar title="Quality Control" breadcrumb={["Engineer", "QC", "Inspection"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Quality Control</h1>
                        <p className="text-slate-500 text-sm">Manage site inspections and laboratory test compliance.</p>
                    </div>

                    {/* Submenu Tabs */}
                    <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                        <button className="px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 border-primary text-primary whitespace-nowrap">
                            Inspection
                        </button>
                        <Link to="/engineer/qc/reports" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                            Test Reports
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 space-y-6">
                            <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                New Quality Check / Lab Log
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.inspectionType ? 'text-rose-500' : 'text-slate-400'}`}>Inspection Type</label>
                                    <select
                                        name="inspectionType"
                                        value={formData.inspectionType}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-medium appearance-none h-[52px] ${errors.inspectionType ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                    >
                                        <option value="">Select Type...</option>
                                        <option>Pre-Concreting Check</option>
                                        <option>Reinforcement Check</option>
                                        <option>Formwork Alignment</option>
                                        <option>Brickwork Alignment</option>
                                        <option>Finishing Inspection</option>
                                    </select>
                                    {errors.inspectionType && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.inspectionType}</p>}
                                </div>

                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.activity ? 'text-rose-500' : 'text-slate-400'}`}>Activity</label>
                                    <select
                                        name="activity"
                                        value={formData.activity}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-medium appearance-none h-[52px] ${errors.activity ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                    >
                                        <option value="">Select Activity...</option>
                                        <option>RCC Column Casting (Floor 1)</option>
                                        <option>Foundation Footing F5</option>
                                        <option>Main Block - Brickwork</option>
                                    </select>
                                    {errors.activity && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.activity}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Test Type (Cube, Slump)</label>
                                    <select
                                        name="testType"
                                        value={formData.testType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px] appearance-none"
                                    >
                                        <option value="Cube">Cube Test (Compressive)</option>
                                        <option value="Slump">Slump Test (Workability)</option>
                                        <option value="Soil">Soil Compaction</option>
                                        <option value="NDT">Non-Destructive Test</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.result ? 'text-rose-500' : 'text-slate-400'}`}>Result</label>
                                        <input
                                            type="text"
                                            name="result"
                                            value={formData.result}
                                            onChange={handleChange}
                                            placeholder="e.g. 25N"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.result ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.standardValue ? 'text-rose-500' : 'text-slate-400'}`}>Standard Value</label>
                                        <input
                                            type="text"
                                            name="standardValue"
                                            value={formData.standardValue}
                                            onChange={handleChange}
                                            placeholder="e.g. 20N"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.standardValue ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Pass / Fail</label>
                                    <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-[52px]">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, status: "Pass" }))}
                                            className={`flex-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${formData.status === 'Pass' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Pass
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, status: "Fail" }))}
                                            className={`flex-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${formData.status === 'Fail' ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            Fail
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Engineer Name</label>
                                    <input
                                        type="text"
                                        name="engineerName"
                                        value={formData.engineerName}
                                        readOnly
                                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-bold h-[52px] cursor-not-allowed"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.remarks ? 'text-rose-500' : 'text-slate-400'}`}>Remarks</label>
                                    <textarea
                                        name="remarks"
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        rows={3}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-medium resize-none transition-all ${errors.remarks ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        placeholder="Note any specific observations, deviations, or mandatory corrections..."
                                    />
                                    {errors.remarks && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.remarks}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.report ? 'text-rose-500' : 'text-slate-400'}`}>Attach Report</label>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full border-2 border-dashed rounded-2xl py-8 flex flex-col items-center justify-center cursor-pointer transition-all ${formData.hasReport ? 'bg-emerald-50 border-emerald-300' : errors.report ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                                    >
                                        <svg className={`w-8 h-8 mb-2 ${formData.hasReport ? 'text-emerald-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-sm font-bold text-slate-600">
                                            {formData.hasReport ? "File Attached Successfully" : "Click to Upload Report"}
                                        </p>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Max size: 5MB</p>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                    </div>
                                    {errors.report && <p className="text-[10px] text-rose-500 font-bold mt-2 text-center">{errors.report}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-full sm:flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-2xl transition-all order-2 sm:order-1"
                            >
                                Reset Form
                            </button>
                            <button
                                type="submit"
                                className="w-full sm:flex-[2] py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 order-1 sm:order-2"
                            >
                                Submit Inspection
                            </button>
                        </div>
                    </form>
                </div>
            </PageTransition>
        </>
    );
};

export default InspectionPage;
