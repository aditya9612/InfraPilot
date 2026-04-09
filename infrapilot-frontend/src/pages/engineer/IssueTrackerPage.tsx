import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const initialIssues = [
    { id: 1, title: "Cement Shortage", category: "Material", priority: "High", date: "2024-04-05", status: "Open", assignedTo: "Procurement Team", description: "Running low on Grade 43 cement. Only 50 bags left in stock. Next delivery expected in 48 hours but construction demand is high.", resolutionNotes: "" },
    { id: 2, title: "Drawing Delay - 4th Floor", category: "Design", priority: "Medium", date: "2024-04-02", status: "Open", assignedTo: "Design Head", description: "Structural drawings for 4th floor columns pending. Need them to finalize the shuttering layout.", resolutionNotes: "" },
    { id: 3, title: "Water pump breakdown", category: "Machinery", priority: "High", date: "2024-04-07", status: "Closed", assignedTo: "Maintenance", description: "Main site pump non-functional due to motor burnout.", resolutionNotes: "Pump repaired by external technician. Tested and verified flow rate on 2024-04-08." },
];

const IssueTrackerPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [selectedIssue, setSelectedIssue] = useState<typeof initialIssues[0] | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        category: "Material",
        description: "",
        date: new Date().toISOString().split("T")[0],
        priority: "Medium",
        assignedTo: "",
        status: "Open",
        resolutionNotes: ""
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        if (!formData.title.trim()) newErrors.title = "Issue title is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (!formData.assignedTo.trim()) newErrors.assignedTo = "Please specify who is assigned to this issue";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all mandatory fields", { position: "top-right" });
            return;
        }
        toast.success("Issue reported successfully!", { position: "top-right" });
        handleReset();
        setShowForm(false);
    };

    const handleReset = () => {
        setFormData({
            title: "",
            category: "Material",
            description: "",
            date: new Date().toISOString().split("T")[0],
            priority: "Medium",
            assignedTo: "",
            status: "Open",
            resolutionNotes: ""
        });
        setErrors({});
    };

    const filteredIssues = initialIssues.filter(
        (i) => i.title.toLowerCase().includes(searchTerm.toLowerCase()) || i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar title="Issue & Delay Tracker" breadcrumb={["Engineer", "Issues"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen relative">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Site Issues</h1>
                            <p className="text-slate-500 text-sm">Track roadblocks, design gaps, and material shortages.</p>
                        </div>

                        <div className="flex flex-1 md:max-w-md items-center bg-white rounded-2xl px-4 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
                            <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search issues..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
                            />
                        </div>

                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${showForm ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-primary text-white shadow-lg shadow-primary/20 hover:bg-blue-600'}`}
                        >
                            {showForm ? 'Cancel Report' : '+ Report Issue'}
                        </button>
                    </div>

                    {showForm && (
                        <div className="mb-12 bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-top duration-500">
                            <form onSubmit={handleSubmit} className="p-8">
                                <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    Log New Site Issue or Delay
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <div className="md:col-span-2">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.title ? 'text-rose-500' : 'text-slate-400'}`}>Issue Title</label>
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            placeholder="e.g. Concrete mix delivery delay"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.title ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                        {errors.title && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.title}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Category</label>
                                        <select
                                            name="category"
                                            value={formData.category}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px] appearance-none"
                                        >
                                            <option>Material</option>
                                            <option>Labor</option>
                                            <option>Design</option>
                                            <option>Machinery</option>
                                            <option>Safety</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Reported Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Priority</label>
                                        <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-[52px]">
                                            {['Low', 'Medium', 'High'].map(p => (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, priority: p }))}
                                                    className={`flex-1 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all ${formData.priority === p ? (p === 'High' ? 'bg-rose-500 text-white' : p === 'Medium' ? 'bg-amber-500 text-white' : 'bg-primary text-white') : 'text-slate-400'}`}
                                                >
                                                    {p}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Status</label>
                                        <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-[52px]">
                                            {['Open', 'Closed'].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, status: s }))}
                                                    className={`flex-1 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${formData.status === s ? (s === 'Open' ? 'bg-amber-500 text-white shadow-md' : 'bg-emerald-500 text-white shadow-md') : 'text-slate-400'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="md:col-span-3">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.description ? 'text-rose-500' : 'text-slate-400'}`}>Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={3}
                                            placeholder="Detailed information about the roadblock..."
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-medium resize-none transition-all ${errors.description ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                        {errors.description && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.description}</p>}
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.assignedTo ? 'text-rose-500' : 'text-slate-400'}`}>Assigned To</label>
                                        <input
                                            type="text"
                                            name="assignedTo"
                                            value={formData.assignedTo}
                                            onChange={handleChange}
                                            placeholder="Enter name or department"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.assignedTo ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                        {errors.assignedTo && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.assignedTo}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Resolution Notes</label>
                                        <input
                                            type="text"
                                            name="resolutionNotes"
                                            value={formData.resolutionNotes}
                                            onChange={handleChange}
                                            placeholder="Add updates or final resolution details..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px]"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8">
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="w-full sm:flex-1 py-3.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-xl transition-all order-2 sm:order-1"
                                    >
                                        Clear Form
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-full sm:flex-[2] py-3.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 order-1 sm:order-2"
                                    >
                                        Submit Issue Report
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredIssues.map(issue => (
                            <div
                                key={issue.id}
                                onClick={() => setSelectedIssue(issue)}
                                className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 relative group overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 cursor-pointer active:scale-95"
                            >
                                <div className={`absolute top-0 left-0 w-1.5 h-full ${issue.priority === 'High' ? 'bg-rose-500' :
                                    issue.priority === 'Medium' ? 'bg-amber-500' : 'bg-primary'
                                    }`} />
                                <div className="flex justify-between items-start mb-6">
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${issue.status === 'Open' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                                        }`}>
                                        {issue.status}
                                    </span>
                                    <span className="text-[10px] font-black text-slate-400 tracking-tighter italic">{issue.date}</span>
                                </div>
                                <h3 className="font-bold text-slate-800 text-lg mb-3 tracking-tight group-hover:text-primary transition-colors leading-tight">{issue.title}</h3>
                                <p className="text-sm text-slate-500 mb-6 line-clamp-2 font-medium">{issue.description}</p>
                                <div className="flex gap-2 mb-8">
                                    <span className="px-3 py-1.5 bg-slate-50 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest italic">{issue.category}</span>
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${issue.priority === 'High' ? 'text-rose-500 bg-rose-50' : issue.priority === 'Medium' ? 'text-amber-500 bg-amber-50' : 'text-primary bg-primary/5'
                                        }`}>
                                        {issue.priority} Priority
                                    </span>
                                </div>
                                <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">Assigned To</p>
                                        <p className="text-xs font-bold text-slate-700 tracking-tight">{issue.assignedTo}</p>
                                    </div>
                                    <button className="w-10 h-10 rounded-xl bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all group/btn">
                                        <svg className="w-5 h-5 transition-transform group-hover/btn:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Details Modal */}
                {selectedIssue && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedIssue(null)}>
                        <div
                            className="bg-white w-full max-w-3xl rounded-[32px] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="space-y-0 relative">
                                {/* Premium Issue Header - Admin Style */}
                                <div className="relative overflow-hidden bg-primary p-8 md:p-10 text-white shadow-xl">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                                    <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
                                        <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-2xl shadow-xl shrink-0">
                                            <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent italic">
                                                {selectedIssue.title.charAt(0)}
                                            </span>
                                        </div>

                                        <div className="text-center md:text-left space-y-2 flex-1">
                                            <div className="flex flex-col md:flex-row items-center gap-3">
                                                <h3 className="text-2xl font-black tracking-tight">{selectedIssue.title}</h3>
                                                <span className={`px-2.5 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest ${selectedIssue.status === 'Open' ? 'text-rose-200' : 'text-emerald-300'}`}>
                                                    {selectedIssue.status}
                                                </span>
                                            </div>
                                            <p className="text-white/70 text-sm font-bold flex items-center justify-center md:justify-start gap-2 italic">
                                                Record ID: #ISS-00{selectedIssue.id} | Reported by Site Engineer
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setSelectedIssue(null)}
                                            className="absolute top-0 right-0 md:relative md:top-auto md:right-auto w-10 h-10 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 md:p-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                        {/* Issue Overview */}
                                        <Section
                                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                                            title="Issue Overview"
                                        >
                                            <InfoItem label="Reported Category" value={selectedIssue.category} />
                                            <InfoItem label="Report Date" value={selectedIssue.date} />
                                            <div className="group">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 group-hover:text-primary transition-colors">Priority Impact</p>
                                                <span className={`text-xs font-black uppercase px-2 py-0.5 rounded ${selectedIssue.priority === 'High' ? 'bg-rose-50 text-rose-600' : selectedIssue.priority === 'Medium' ? 'bg-amber-50 text-amber-600' : 'bg-primary/10 text-primary'}`}>
                                                    {selectedIssue.priority} Priority
                                                </span>
                                            </div>
                                        </Section>

                                        {/* Assignment Details */}
                                        <Section
                                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                                            title="Assignment Details"
                                        >
                                            <InfoItem label="Assigned Stakeholder" value={selectedIssue.assignedTo} />
                                            <InfoItem label="Department Focus" value={selectedIssue.category + " Dept."} />
                                        </Section>

                                        {/* Full Width Sections */}
                                        <Section
                                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>}
                                            title="Detailed Description"
                                            fullWidth
                                        >
                                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100/50">
                                                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                                    "{selectedIssue.description || "No description provided."}"
                                                </p>
                                            </div>
                                        </Section>

                                        <Section
                                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                            title="Final Resolution & Notes"
                                            fullWidth
                                        >
                                            <div className={`${selectedIssue.status === 'Closed' ? 'bg-emerald-50 border-emerald-100/30' : 'bg-amber-50 border-amber-100/30'} rounded-2xl p-5 border`}>
                                                <p className={`text-sm font-bold ${selectedIssue.status === 'Closed' ? 'text-emerald-700' : 'text-amber-700'} leading-relaxed`}>
                                                    {selectedIssue.resolutionNotes || "Action Pending: This issue is currently being tracked for resolution updates."}
                                                </p>
                                            </div>
                                        </Section>
                                    </div>

                                    <button
                                        onClick={() => setSelectedIssue(null)}
                                        className="w-full py-4 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-slate-200 hover:bg-black hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        Dismiss Issue Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </PageTransition>
        </>
    );
};

// --- Helper Components for Premium Detail View ---

const Section: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode, fullWidth?: boolean }> = ({ icon, title, children, fullWidth }) => (
    <div className={`space-y-4 ${fullWidth ? 'md:col-span-2' : ''}`}>
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="text-primary">{icon}</div>
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{title}</h4>
        </div>
        <div className="space-y-4 pt-1">
            {children}
        </div>
    </div>
);

const InfoItem: React.FC<{ label: string, value: string, valueClass?: string }> = ({ label, value, valueClass }) => (
    <div className="group">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-tighter mb-0.5 group-hover:text-primary transition-colors">{label}</p>
        <p className={`text-sm font-bold text-slate-800 ${valueClass}`}>{value || '—'}</p>
    </div>
);

export default IssueTrackerPage;
