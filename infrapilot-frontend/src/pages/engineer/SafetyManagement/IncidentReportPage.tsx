import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";

const IncidentReportPage = () => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        checklistStatus: "Checked - All Clear",
        ppeCompliance: "Compliant",
        violationType: "None",
        description: "",
        injuryDetails: "",
        actionTaken: "",
        responsiblePerson: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.description.trim()) newErrors.description = "Incident description is required";
        if (!formData.injuryDetails.trim()) newErrors.injuryDetails = "Please specify injury or damage details";
        if (!formData.actionTaken.trim()) newErrors.actionTaken = "Action taken is required";
        if (!formData.responsiblePerson.trim()) newErrors.responsiblePerson = "Responsible person name is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all mandatory fields before submitting", { position: "top-right" });
            return;
        }
        toast.success("Incident Report submitted successfully!", { position: "top-right" });
        console.log("Safety Submission:", formData);
        handleReset();
    };

    const handleReset = () => {
        setFormData({
            date: new Date().toISOString().split("T")[0],
            checklistStatus: "Checked - All Clear",
            ppeCompliance: "Compliant",
            violationType: "None",
            description: "",
            injuryDetails: "",
            actionTaken: "",
            responsiblePerson: "",
        });
        setErrors({});
    };

    return (
        <>
            <Navbar title="Safety Management" breadcrumb={["Engineer", "Safety", "Incident Report"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Safety Management</h1>
                        <p className="text-slate-500 text-sm">Report accidents, violations, or safety issues immediately.</p>
                    </div>

                    {/* Submenu Tabs */}
                    <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                        <Link to="/engineer/safety/checklist" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                            Safety Checklist
                        </Link>
                        <button className="px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 border-primary text-primary whitespace-nowrap">
                            Incident Report
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden mb-12">
                        <div className="p-8 space-y-8">
                            <h2 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                New Safety Incident / Violation Log
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Report Date</label>
                                    <input
                                        type="date"
                                        name="date"
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Safety Checklist Status</label>
                                    <select
                                        name="checklistStatus"
                                        value={formData.checklistStatus}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px] appearance-none"
                                    >
                                        <option>Checked - All Clear</option>
                                        <option>Checked - Minor Issues</option>
                                        <option>Unchecked / Pending</option>
                                        <option>Red Flagged</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PPE Compliance</label>
                                    <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-[52px]">
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, ppeCompliance: "Compliant" }))}
                                            className={`flex-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${formData.ppeCompliance === 'Compliant' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-400'}`}
                                        >
                                            Compliant
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, ppeCompliance: "Non-Compliant" }))}
                                            className={`flex-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${formData.ppeCompliance === 'Non-Compliant' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-400'}`}
                                        >
                                            Non-Compliant
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Violation Type</label>
                                    <select
                                        name="violationType"
                                        value={formData.violationType}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px] appearance-none text-rose-600"
                                    >
                                        <option>None</option>
                                        <option>PPE Violation</option>
                                        <option>Safety Guard Missing</option>
                                        <option>Unsafe Work Practice</option>
                                        <option>Equipment Misuse</option>
                                        <option>Near Miss Event</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.description ? 'text-rose-500' : 'text-slate-400'}`}>Incident Description</label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Describe exactly what happened..."
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none resize-none font-medium h-[100px] transition-all ${errors.description ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                    />
                                    {errors.description && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.description}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.injuryDetails ? 'text-rose-500' : 'text-slate-400'}`}>Injury Details / Damage Report</label>
                                    <textarea
                                        name="injuryDetails"
                                        value={formData.injuryDetails}
                                        onChange={handleChange}
                                        rows={2}
                                        placeholder="Describe injuries sustained or structural damage incurred..."
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none resize-none font-medium h-[80px] transition-all ${errors.injuryDetails ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                    />
                                    {errors.injuryDetails && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.injuryDetails}</p>}
                                </div>

                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.actionTaken ? 'text-rose-500' : 'text-slate-400'}`}>Action Taken</label>
                                    <input
                                        type="text"
                                        name="actionTaken"
                                        value={formData.actionTaken}
                                        onChange={handleChange}
                                        placeholder="e.g. First aid provided, work halted"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.actionTaken ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                    />
                                    {errors.actionTaken && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.actionTaken}</p>}
                                </div>
                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.responsiblePerson ? 'text-rose-500' : 'text-slate-400'}`}>Responsible Person</label>
                                    <input
                                        type="text"
                                        name="responsiblePerson"
                                        value={formData.responsiblePerson}
                                        onChange={handleChange}
                                        placeholder="Name of witness or supervisor"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.responsiblePerson ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                    />
                                    {errors.responsiblePerson && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.responsiblePerson}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-2xl transition-all"
                            >
                                Reset Report
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] py-4 bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                Submit Incident Log
                            </button>
                        </div>
                    </form>
                </div>
            </PageTransition>
        </>
    );
};

export default IncidentReportPage;
