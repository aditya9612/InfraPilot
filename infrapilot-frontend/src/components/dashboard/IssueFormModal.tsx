import React from "react";
import Modal from "../common/Modal";

interface IssueFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    formMode: "create" | "edit";
    formData: any;
    errors: Record<string, string>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleSubmit: (e: React.FormEvent) => void;
}

const IssueFormModal: React.FC<IssueFormModalProps> = ({
    isOpen,
    onClose,
    formMode,
    formData,
    errors,
    handleInputChange,
    handleSubmit
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={formMode === "create" ? "Lodge Site Constraint" : "Modify Constraint Log"}
            maxWidth="max-w-4xl"
        >
            <div className="bg-primary px-8 py-5 flex items-center justify-between border-b border-white/10 shadow-lg shadow-primary/20">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white font-inter tracking-tight uppercase leading-none">
                            {formMode === "create" ? "Lodge Site Issue" : "Update Site Registry"}
                        </h2>
                        <p className="text-[10px] text-blue-100 font-bold uppercase tracking-[0.2em] mt-1 leading-none">Constraint Analysis Protocol</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-blue-100 hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="bg-white p-8 italic-none font-inter text-inter">
                <form id="issue-form" onSubmit={handleSubmit} className="p-8 space-y-12 text-inter">
                    {/* Section 1: Issue Identity */}
                    <section className="font-inter">
                        <div className="flex items-center gap-4 mb-8 font-inter">
                            <h3 className="text-[15px] font-bold text-slate-800 font-inter underline decoration-blue-500 decoration-2 underline-offset-8 uppercase tracking-tight">Issue Identity</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex flex-col gap-1.5 font-inter">
                                <label className="text-[13px] font-bold text-slate-700 font-inter">Issue Headline <span className="text-rose-500">*</span></label>
                                <input
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Succinct title of the Project Bottleneck"
                                    className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.title ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
                                {errors.title && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.title}</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                                <div className="flex flex-col gap-1.5 font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Classification Category <span className="text-rose-500">*</span></label>
                                    <div className="relative font-inter">
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer pr-10 font-inter ${errors.category ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                        >
                                            <option value="Material">Material Delay / Shortage</option>
                                            <option value="Labor">Labor Disruption / Conflict</option>
                                            <option value="Design">Architectural / Design Clarification</option>
                                            <option value="Delay">Planning / Execution Delay</option>
                                            <option value="Quality">Quality / Inspection Issue</option>
                                            <option value="Safety">Safety / Compliance Alert</option>
                                        </select>
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                        </span>
                                    </div>
                                    {errors.category && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.category}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5 font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Priority Matrix <span className="text-rose-500">*</span></label>
                                    <div className="relative font-inter">
                                        <select
                                            name="priority"
                                            value={formData.priority}
                                            onChange={handleInputChange}
                                            className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all appearance-none cursor-pointer pr-10 font-inter ${errors.priority ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                        >
                                            <option value="Low">Low Priority</option>
                                            <option value="Medium">Medium Priority</option>
                                            <option value="High">Critical Priority</option>
                                        </select>
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                        </span>
                                    </div>
                                    {errors.priority && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.priority}</p>}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Narrative Details */}
                    <section className="font-inter">
                        <div className="flex items-center gap-4 mb-8 font-inter">
                            <h3 className="text-[15px] font-bold text-slate-800 font-inter underline decoration-amber-500 decoration-2 underline-offset-8 uppercase tracking-tight">Narrative Details</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex flex-col gap-1.5 font-inter">
                                <label className="text-[13px] font-bold text-slate-700 font-inter">Constraint Narration <span className="text-rose-500">*</span></label>
                                <textarea
                                    name="description"
                                    rows={3}
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Technical narration of the reported bottleneck..."
                                    className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all resize-none font-inter leading-relaxed ${errors.description ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
                                {errors.description && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.description}</p>}
                            </div>
                            <div className="flex flex-col gap-1.5 font-inter">
                                <label className="text-[13px] font-bold text-slate-700 font-inter">Observed Date <span className="text-rose-500">*</span></label>
                                <input
                                    name="reported_date"
                                    type="date"
                                    value={formData.reported_date}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.reported_date ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
                                {errors.reported_date && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.reported_date}</p>}
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Response Matrix */}
                    <section className="font-inter">
                        <div className="flex items-center gap-4 mb-8 font-inter">
                            <h3 className="text-[15px] font-bold text-slate-800 font-inter underline decoration-emerald-500 decoration-2 underline-offset-8 uppercase tracking-tight">Response Matrix</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter">
                                <div className="flex flex-col gap-1.5 font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Assigned Party <span className="text-rose-500">*</span></label>
                                    <input
                                        name="assigned_to"
                                        value={formData.assigned_to || ""}
                                        onChange={handleInputChange}
                                        placeholder="Who needs to act?"
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.assigned_to ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.assigned_to && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.assigned_to}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5 font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 font-inter">Current Status</label>
                                    <div className="relative font-inter">
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none appearance-none cursor-pointer pr-10 font-inter"
                                        >
                                            <option value="Open">Registry Open</option>
                                            <option value="Closed">Resolved & Closed</option>
                                        </select>
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5 font-inter">
                                <label className="text-[13px] font-bold text-slate-700 font-inter">Resolution Outcome Notes</label>
                                <textarea
                                    name="resolution"
                                    rows={2}
                                    value={formData.resolution || ""}
                                    onChange={handleInputChange}
                                    placeholder="Final resolution details or closure outcome..."
                                    className="w-full px-4 py-3 bg-emerald-50/20 border border-emerald-100 rounded-lg text-[13px] text-emerald-800 focus:outline-none transition-all resize-none font-inter leading-relaxed italic-none"
                                />
                            </div>
                        </div>
                    </section>
                </form>
            </div>

            <div className="bg-white px-8 py-6 border-t border-slate-100 flex items-center justify-between font-inter">
                <button
                    type="button"
                    onClick={onClose}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-800 uppercase tracking-widest transition-all font-inter"
                >
                    Discard Analysis
                </button>
                <button
                    type="submit"
                    form="issue-form"
                    className="px-8 py-3 bg-primary text-white text-[13px] font-bold rounded-lg shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95 font-inter"
                >
                    {formMode === "create" ? "Lodge Site Issue" : "Commit Updates"}
                </button>
            </div>
        </Modal>
    );
};

export default IssueFormModal;
