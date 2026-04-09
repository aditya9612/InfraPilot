import { useState, useRef } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const initialDrawings = [
    { id: 1, name: "Foundation Layout - Block A", version: "v2.1", approvedBy: "Project Head", date: "2026-03-15", type: "Architectural", fileSelected: true, remarks: "Revised footing dimensions." },
    { id: 2, name: "Column Reinforcement Schedule", version: "v1.4", approvedBy: "Structural EngG", date: "2026-03-20", type: "Structural", fileSelected: true, remarks: "Updated for seismic zone 4." },
    { id: 3, name: "Ground Floor Electrical Plan", version: "v1.0", approvedBy: "MEP Consultant", date: "2026-04-01", type: "Electrical", fileSelected: true, remarks: "Initial approved layout." },
];

const DrawingsPage = () => {
    const [showUpload, setShowUpload] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        version: "v1.0",
        approvedBy: "",
        date: new Date().toISOString().split("T")[0],
        remarks: "",
        hasFile: false
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, hasFile: true }));
            if (errors.file) {
                setErrors(prev => {
                    const upd = { ...prev };
                    delete upd.file;
                    return upd;
                });
            }
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Drawing name is required";
        if (!formData.version.trim()) newErrors.version = "Version code is required";
        if (!formData.approvedBy.trim()) newErrors.approvedBy = "Approver name is required";
        if (!formData.hasFile) newErrors.file = "Please upload the document file";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all mandatory fields and upload a file", { position: "top-right" });
            return;
        }
        toast.success("Drawing uploaded successfully!", { position: "top-right" });
        setShowUpload(false);
        handleReset();
    };

    const handleReset = () => {
        setFormData({
            name: "",
            version: "v1.0",
            approvedBy: "",
            date: new Date().toISOString().split("T")[0],
            remarks: "",
            hasFile: false
        });
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <>
            <Navbar title="Drawings & Documents" breadcrumb={["Engineer", "Drawings"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Technical Documents</h1>
                            <p className="text-slate-500 text-sm">Access the latest approved blueprints and design documents.</p>
                        </div>
                        <button
                            onClick={() => setShowUpload(!showUpload)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${showUpload ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-primary text-white shadow-primary/20 hover:bg-blue-600'}`}
                        >
                            {showUpload ? 'Cancel Upload' : '+ Upload New Drawing'}
                        </button>
                    </div>

                    {showUpload && (
                        <div className="mb-12 bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-top-4 duration-500">
                            <form onSubmit={handleSubmit} className="p-10">
                                <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    Document Registry & Technical Filing
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                    <div className="md:col-span-2">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.name ? 'text-rose-500' : 'text-slate-400'}`}>Drawing Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Structural Slab Layout - Wing B"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.name ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                        {errors.name && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.version ? 'text-rose-500' : 'text-slate-400'}`}>Version Code</label>
                                        <input
                                            type="text"
                                            name="version"
                                            value={formData.version}
                                            onChange={handleChange}
                                            placeholder="v1.0"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] animate-none ${errors.version ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.approvedBy ? 'text-rose-500' : 'text-slate-400'}`}>Approved By</label>
                                        <input
                                            type="text"
                                            name="approvedBy"
                                            value={formData.approvedBy}
                                            onChange={handleChange}
                                            placeholder="Enter authority name"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.approvedBy ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Release Date</label>
                                        <input
                                            type="date"
                                            name="date"
                                            value={formData.date}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px]"
                                        />
                                    </div>
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`flex items-center justify-center border-2 border-dashed rounded-xl cursor-pointer transition-all hover:bg-slate-50 h-[52px] mt-auto ${errors.file ? 'bg-rose-50 border-rose-300' : formData.hasFile ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'}`}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <div className="flex items-center gap-2">
                                            <svg className={`w-4 h-4 ${formData.hasFile ? 'text-emerald-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${formData.hasFile ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                {formData.hasFile ? 'File Attached' : 'Attach Blueprint'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Technical Remarks (Optional)</label>
                                        <textarea
                                            name="remarks"
                                            value={formData.remarks}
                                            onChange={handleChange}
                                            rows={2}
                                            placeholder="Add specific notes or observation about this version..."
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-medium resize-none transition-all focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-md ml-auto">
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="w-full sm:flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all order-2 sm:order-1"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        type="submit"
                                        className="w-full sm:flex-[2] bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 order-1 sm:order-2"
                                    >
                                        Submit Document
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden mb-12">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-slate-50">
                                        <th className="px-8 py-6">Technical Drawing</th>
                                        <th className="px-8 py-6">Revision</th>
                                        <th className="px-8 py-6">Authorization</th>
                                        <th className="px-8 py-6">Remarks</th>
                                        <th className="px-8 py-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {initialDrawings.map(d => (
                                        <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-[18px] bg-blue-50 text-blue-500 flex items-center justify-center font-black text-[10px] shadow-sm transform group-hover:rotate-12 transition-transform">PDF</div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 tracking-tight group-hover:text-primary transition-colors text-base">{d.name}</p>
                                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">{d.date}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">{d.version}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-xs font-bold text-slate-600 tracking-tight uppercase tracking-tight">{d.approvedBy}</p>
                                            </td>
                                            <td className="px-8 py-6 max-w-xs">
                                                <p className="text-xs text-slate-400 line-clamp-1 italic font-medium">{d.remarks || "No additional remarks."}</p>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <button
                                                    onClick={() => toast.success(`${d.name} archived successfully!`, { position: "top-right", icon: '📦' })}
                                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-white hover:shadow-lg hover:shadow-primary/30 transition-all flex items-center gap-2 ml-auto"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    Archive
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default DrawingsPage;
