import { useState } from "react";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import toast from "react-hot-toast";

const IssueTrackerPage = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<any>(null);

    const [formData, setFormData] = useState({
        issueTitle: "",
        category: "Material",
        description: "",
        reportedDate: new Date().toISOString().split("T")[0],
        priority: "Medium",
        assignedTo: "",
        status: "Open",
        resolutionNotes: "",
    });

    const [issues, setIssues] = useState([
        {
            id: 101,
            issueTitle: "Cement Grade 43 Shortage",
            category: "Material",
            description: "Critical shortage of Grade 43 cement impacting foundation work in Block A.",
            reportedDate: "2024-04-05",
            priority: "High",
            assignedTo: "Procurement Lead",
            status: "Open",
            resolutionNotes: "Waiting for vendor confirmation on expedited delivery."
        },
        {
            id: 102,
            issueTitle: "Drawing Variance - 4th Floor",
            category: "Design",
            description: "Column Reinforcement drawing mismatch with architectural plan.",
            reportedDate: "2024-04-02",
            priority: "High",
            assignedTo: "Structural Head",
            status: "Closed",
            resolutionNotes: "Redesigned drawing approved and issued to site."
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

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.issueTitle.trim()) newErrors.issueTitle = "Required";
        if (!formData.description.trim()) newErrors.description = "Required";
        if (!formData.assignedTo.trim()) newErrors.assignedTo = "Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Constraint parameters incomplete.");
            return;
        }

        const newIssue = {
            ...formData,
            id: Date.now(),
        };

        toast.loading("Registering Operational Constraint...", { id: "issue-load" });
        setTimeout(() => {
            setIssues([newIssue, ...issues]);
            toast.success("Bottleneck Registered!", { id: "issue-load" });
            setIsModalOpen(false);
            handleReset();
        }, 1200);
    };

    const handleReset = () => {
        setFormData({
            issueTitle: "",
            category: "Material",
            description: "",
            reportedDate: new Date().toISOString().split("T")[0],
            priority: "Medium",
            assignedTo: "",
            status: "Open",
            resolutionNotes: "",
        });
        setErrors({});
    };

    return (
        <>
            <Navbar
                title="Operational Constraints"
                breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Control"]}
                            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Operational Bottlenecks</h1>
                        <p className="text-slate-500 text-sm font-medium">Tracking material delays, design variances, and labor shortages with critical impact analysis.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + REGISTER ISSUE
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                        Resolution Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Active Blockers"
                            value="03"
                            sub="Work Halted"
                            accent="text-rose-600"
                        />
                        <StatCard
                            title="Avg Resolution"
                            value="4.2h"
                            sub="Response Flux"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Closure Rate"
                            value="92.4%"
                            sub="Efficiency Baseline"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Schedule Impact"
                            value="12d"
                            sub="Total Latency"
                            accent="text-primary"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Operational Constraint Matrix
                    </h2>
                    <div className="grid grid-cols-1 gap-6 mb-24">
                        {issues.map((issue) => (
                            <div
                                key={issue.id}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                                onClick={() => setSelectedIssue(issue)}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity ${issue.status === 'Open' ? "bg-rose-500" : "bg-emerald-500"}`} />

                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="text-xl font-black text-slate-800 tracking-tighter uppercase">ISS-{issue.id}</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${issue.status === 'Open' ? 'bg-rose-100 text-rose-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {issue.status.toUpperCase()}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 ml-auto tracking-widest uppercase">{issue.reportedDate}</span>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Constraint Title</span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{issue.issueTitle}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Classification</span>
                                            <p className="text-[11px] font-black text-blue-600 uppercase">{issue.category}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Strategic Priority</span>
                                            <p className={`text-[11px] font-black ${issue.priority === 'High' ? 'text-rose-600' : 'text-amber-500'} uppercase`}>{issue.priority}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Assigned Resolver</span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{issue.assignedTo}</p>
                                        </div>
                    
                                    </div>

                                    <div className="pt-2">
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Variance Intelligence Matrix</span>
                                        <p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic text-balance lowercase">"{issue.description}"</p>
                                    </div>
                                </div>

                                <button className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-slate-200">
                                    →
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                <Modal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    title="Operational Constraint Registration"
                    maxWidth="max-w-5xl"
                >
                    <div className="p-12 bg-white">
                        <form id="issue-form" onSubmit={handleSubmit} className="space-y-12">
                            <div className="space-y-8">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
                                    <h3 className="admin-pulse-form-section-title">Constraint Profile Identification</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-8">
                                    <div className="admin-pulse-form-group col-span-2">
                                        <label className="admin-pulse-form-label admin-pulse-form-required">Issue Title</label>
                                        <input type="text" name="issueTitle" value={formData.issueTitle} onChange={handleChange} placeholder="e.g. CEMENT GRADE 43 SHORTAGE" className={`admin-pulse-form-input ${errors.issueTitle ? 'border-rose-300' : ''}`} />
                                        {errors.issueTitle && <p className="text-[10px] font-bold text-rose-500 mt-2 ">{errors.issueTitle}</p>}
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label">Category Classification</label>
                                        <select name="category" value={formData.category} onChange={handleChange} className="admin-pulse-form-input cursor-pointer">
                                            <option>Material</option>
                                            <option>Labor</option>
                                            <option>Design</option>
                                            <option>Machinery</option>
                                            <option>Regulatory</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 bg-slate-50/50 -mx-12 p-12 border-y border-slate-100 italic">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-blue-600" />
                                    <h3 className="admin-pulse-form-section-title">Technical Description & Context</h3>
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Variance Intelligence Description</label>
                                    <textarea name="description" rows={3} value={formData.description} onChange={handleChange} placeholder="PROVIDE ACTIONABLE INTELLIGENCE ON THE CONSTRAINT..." className={`admin-pulse-form-input resize-none p-6 ${errors.description ? 'border-rose-300' : ''}`} />
                                    {errors.description && <p className="text-[10px] font-bold text-rose-500 mt-2 ">{errors.description}</p>}
                                </div>
                            </div>

                            <div className="space-y-8 ">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-amber-500" />
                                    <h3 className="admin-pulse-form-section-title">Assignment & Baseline Status</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-8">
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label">Reported Date</label>
                                        <input type="date" name="reportedDate" value={formData.reportedDate} onChange={handleChange} className="admin-pulse-form-input" />
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label">Priority Spectrum</label>
                                        <select name="priority" value={formData.priority} onChange={handleChange} className={`admin-pulse-form-input cursor-pointer font-bold ${formData.priority === 'High' ? 'text-rose-600' : 'text-blue-600'}`}>
                                            <option>Low</option>
                                            <option>Medium</option>
                                            <option>High</option>
                                        </select>
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label">Current Status</label>
                                        <select name="status" value={formData.status} onChange={handleChange} className={`admin-pulse-form-input cursor-pointer font-bold ${formData.status === 'Open' ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            <option>Open</option>
                                            <option>Closed</option>
                                        </select>
                                    </div>
                                    <div className="admin-pulse-form-group col-span-2">
                                        <label className="admin-pulse-form-label admin-pulse-form-required">Assigned Resolver / Authority</label>
                                        <input type="text" name="assignedTo" value={formData.assignedTo} onChange={handleChange} placeholder="LEAD AUTHORITY FOR RESOLUTION" className={`admin-pulse-form-input ${errors.assignedTo ? 'border-rose-300' : ''}`} />
                                        {errors.assignedTo && <p className="text-[10px] font-bold text-rose-500 mt-2 ">{errors.assignedTo}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8 bg-slate-900 -mx-12 p-12 text-white">
                                <div className="admin-pulse-form-section-header">
                                    <div className="admin-pulse-form-section-indicator bg-blue-500" />
                                    <h3 className="admin-pulse-form-section-title !text-white">Resolution Protocol Notes</h3>
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label !text-slate-400">Strategic Resolution Baseline</label>
                                    <textarea name="resolutionNotes" rows={2} value={formData.resolutionNotes} onChange={handleChange} placeholder="DOCUMENT STEPS TAKEN OR PLANNED FOR SYSTEMIC RESOLUTION..." className="admin-pulse-form-input !bg-slate-800 !border-slate-700 !text-white p-6 resize-none" />
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="admin-pulse-form-summary">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Constraint Operational Impact</span>
                                    <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">{formData.priority === 'High' ? 'CRITICAL PATH DELAY' : 'OBSERVATIONAL VARIANCE'}</p>
                                </div>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${formData.priority === 'High' ? 'bg-rose-100 text-rose-600' : 'bg-blue-100 text-blue-600'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="bg-white px-12 pb-12 rounded-b-[40px] flex items-center justify-end gap-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="admin-pulse-btn-text">Abort Protocol</button>
                        <button type="button" onClick={handleReset} className="admin-pulse-btn-text !text-blue-600 underline">Reset Pulse</button>
                        <button type="submit" form="issue-form" className="admin-pulse-btn-primary">Synchronize Ledger</button>
                    </div>
                </Modal>


                {selectedIssue && (
                    <Modal
                        isOpen={!!selectedIssue}
                        onClose={() => setSelectedIssue(null)}
                        title="Constraint Intelligence Portfolio"
                        maxWidth="max-w-4xl"
                    >
                        <div className="p-10 bg-white">
                            {/* Premium Banner */}
                            <div className="admin-pulse-details-banner">
                                <div className="admin-pulse-details-icon-container bg-rose-600">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedIssue.issueTitle}</h2>
                                        <span className={`admin-pulse-status-badge ${selectedIssue.status === 'Open' ? 'bg-rose-500/20 text-rose-100 border-rose-500/30 animate-pulse' :
                                            'bg-emerald-500/20 text-emerald-100 border-emerald-500/30'
                                            } backdrop-blur-md border`}>
                                            {selectedIssue.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-xl font-black text-white tracking-tight uppercase">{selectedIssue.category} CLASSIFICATION</h3>
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-[0.2em] border ${selectedIssue.priority === 'High' ? 'bg-rose-600 text-white border-rose-400' : 'bg-blue-600 text-white border-blue-400'}`}>
                                            {selectedIssue.priority.toUpperCase()} PRIORITY
                                        </span>
                                    </div>
                                    <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Constraint Hash: ISS-{selectedIssue.id}-BLOCKADE</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12">
                                {/* Left Column: Intelligence Matrix */}
                                <div className="space-y-10">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Constraint Intelligence Matrix</h3>
                                        </div>
                                        <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100 mb-8 uppercase font-black">
                                            <div className="grid grid-cols-2 gap-8 mb-6">
                                                <div className="admin-pulse-details-group">
                                                    <span className="admin-pulse-details-label uppercase">Reported Date</span>
                                                    <p className="text-xl font-black text-slate-800 tracking-tighter italic">{selectedIssue.reportedDate}</p>
                                                </div>
                                                <div className="admin-pulse-details-group text-right">
                                                    <span className="admin-pulse-details-label uppercase">Priority Level</span>
                                                    <p className={`text-xl font-black tracking-tighter italic ${selectedIssue.priority === 'High' ? 'text-rose-600' : 'text-blue-600'}`}>{selectedIssue.priority.toUpperCase()}</p>
                                                </div>
                                            </div>
                                            <div className="admin-pulse-details-group border-t border-slate-200 pt-6">
                                                <span className="admin-pulse-details-label uppercase mb-2 block">Assigned Authority</span>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-2xl font-black text-slate-700 tracking-tighter italic underline underline-offset-4 decoration-blue-200">{selectedIssue.assignedTo}</p>
                                                    <span className="text-[10px] font-bold text-blue-600 italic">Resolver Sync Active</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Root Cause Identification</h3>
                                        </div>
                                        <div className="p-8 bg-rose-50/30 rounded-[32px] border border-rose-100 font-black uppercase">
                                            <span className="admin-pulse-details-label mb-4 block underline underline-offset-4 decoration-rose-200 uppercase font-black">Constraint Description</span>
                                            <p className="text-sm font-bold text-slate-700 leading-relaxed italic uppercase font-black">"{selectedIssue.description}"</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Operational Narrative */}
                                <div className="space-y-10">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <h3 className="admin-pulse-details-section-title">Strategic Resolution Protocol</h3>
                                        </div>
                                        <div className="p-8 bg-slate-900 rounded-[32px] border border-slate-800 min-h-[300px] font-black uppercase shadow-2xl shadow-slate-900/40 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-blue-600/20 transition-all"></div>
                                            <span className="admin-pulse-details-label mb-6 block underline underline-offset-4 decoration-slate-700 uppercase font-black text-slate-400">Resolution Artifact Ledger</span>
                                            <p className="text-base font-bold text-white leading-[1.8] italic uppercase font-black tracking-tight">
                                                {selectedIssue.resolutionNotes || "AWAITING STRATEGIC RESOLUTION ARTIFACT FROM ASSIGNED RESOLVER..."}
                                            </p>
                                            <div className="absolute bottom-8 left-8 flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${selectedIssue.status === 'Open' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                                <span className="text-[10px] font-black text-slate-500 tracking-[0.2em]">PROTOCOL STATUS: {selectedIssue.status.toUpperCase()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-8 bg-blue-50/50 rounded-[32px] border border-blue-100 flex items-center justify-between font-black uppercase">
                                        <div className="flex flex-col gap-1 uppercase font-black">
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest font-black">Current Blockade Intensity</span>
                                            <p className="text-2xl font-black text-slate-800 tracking-tighter italic font-black">{selectedIssue.priority === 'High' ? 'CRITICAL PATH' : 'LOW IMPACT'}</p>
                                        </div>
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${selectedIssue.priority === 'High' ? 'bg-rose-600 shadow-rose-500/20' : 'bg-blue-600 shadow-blue-500/20'}`}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-10 border-t border-slate-100 flex items-center justify-between font-black uppercase">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] italic font-black">CONSTRAINT INTELLIGENCE SYNCED WITH CORE LEDGER</span>
                                <button onClick={() => setSelectedIssue(null)} className="admin-pulse-btn-primary bg-slate-900 shadow-slate-900/20 hover:bg-black px-12 font-black uppercase">
                                    Archive Dossier
                                </button>
                            </div>
                        </div>
                    </Modal>
                )}
            </PageTransition>
        </>
    );
};

export default IssueTrackerPage;
