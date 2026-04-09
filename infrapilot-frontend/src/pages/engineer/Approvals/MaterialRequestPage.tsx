import { useState } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";

const initialRequests = [
    { id: 1, type: "Material Request", description: "Grade 43 OPC Cement for Block A foundation", quantity: "500 Bags", requestedBy: "S. Engineer", approvedBy: "Project Manager", status: "Approved", date: "2026-04-05" },
    { id: 2, type: "Material Request", description: "16mm TMT Reinforcement Bars", quantity: "12 Tons", requestedBy: "S. Engineer", approvedBy: "Procurement Head", status: "Pending", date: "2026-04-07" },
    { id: 3, type: "Material Request", description: "PVC Conduit Pipes - 25mm", quantity: "800 Meters", requestedBy: "S. Engineer", approvedBy: "MEP Lead", status: "Rejected", date: "2026-04-03" },
];

const MaterialRequestPage = () => {
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        type: "Material Request",
        description: "",
        quantity: "",
        requestedBy: "Site Engineer",
        approvedBy: "",
        status: "Pending"
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
        if (!formData.description.trim()) newErrors.description = "Description is required";
        if (!formData.quantity.trim()) newErrors.quantity = "Quantity is required";
        if (!formData.requestedBy.trim()) newErrors.requestedBy = "Requester name is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all mandatory fields", { position: "top-right" });
            return;
        }
        toast.success("Material request submitted successfully!", { position: "top-right" });
        setShowForm(false);
        handleReset();
    };

    const handleReset = () => {
        setFormData({
            type: "Material Request",
            description: "",
            quantity: "",
            requestedBy: "Site Engineer",
            approvedBy: "",
            status: "Pending"
        });
        setErrors({});
    };

    return (
        <>
            <Navbar title="Material Requisition" breadcrumb={["Engineer", "Approvals", "Material Request"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Material Approvals</h1>
                            <p className="text-slate-500 text-sm">Create and track formal requests for site materials.</p>
                        </div>
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${showForm ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-primary text-white shadow-primary/20 hover:bg-blue-600'}`}
                        >
                            {showForm ? 'Cancel Request' : '+ New Requisition'}
                        </button>
                    </div>

                    {showForm && (
                        <div className="mb-12 bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in slide-in-from-top-4 duration-500">
                            <form onSubmit={handleSubmit} className="p-10">
                                <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    Formal Requisition Gateway
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Request Type</label>
                                        <input
                                            type="text"
                                            name="type"
                                            value={formData.type}
                                            readOnly
                                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl outline-none font-bold h-[52px] text-slate-500"
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.quantity ? 'text-rose-500' : 'text-slate-400'}`}>Quantity Required</label>
                                        <input
                                            type="text"
                                            name="quantity"
                                            value={formData.quantity}
                                            onChange={handleChange}
                                            placeholder="e.g. 500 Bags / 10 Tons"
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.quantity ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.requestedBy ? 'text-rose-500' : 'text-slate-400'}`}>Requested By</label>
                                        <input
                                            type="text"
                                            name="requestedBy"
                                            value={formData.requestedBy}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.requestedBy ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Approved By</label>
                                        <input
                                            type="text"
                                            name="approvedBy"
                                            value={formData.approvedBy}
                                            onChange={handleChange}
                                            placeholder="Authority name (Optional)"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Request Status</label>
                                        <div className="flex bg-slate-50 border border-slate-200 rounded-xl p-1 h-[52px]">
                                            {['Pending', 'Approved', 'Rejected'].map(s => (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, status: s }))}
                                                    className={`flex-1 rounded-lg text-[9px] font-black uppercase tracking-tight transition-all ${formData.status === s ? (s === 'Approved' ? 'bg-emerald-500 text-white' : s === 'Rejected' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white') : 'text-slate-400'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.description ? 'text-rose-500' : 'text-slate-400'}`}>Description / Justification</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows={2}
                                            placeholder="Specify the exact material specs and purpose..."
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-medium resize-none transition-all ${errors.description ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 max-w-md ml-auto">
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all"
                                    >
                                        Clear Draft
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                                    >
                                        Submit Request
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
                                        <th className="px-8 py-6">Description</th>
                                        <th className="px-8 py-6">Requested By</th>
                                        <th className="px-8 py-6">Qty</th>
                                        <th className="px-8 py-6">Approver</th>
                                        <th className="px-8 py-6 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {initialRequests.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-8 py-6">
                                                <p className="font-bold text-slate-800 tracking-tight text-sm line-clamp-1">{r.description}</p>
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">{r.date}</p>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-bold text-slate-600 uppercase tracking-tight">{r.requestedBy}</td>
                                            <td className="px-8 py-6 text-xs font-black text-primary italic uppercase tracking-widest">{r.quantity}</td>
                                            <td className="px-8 py-6 text-xs font-bold text-slate-500 uppercase tracking-tight">{r.approvedBy || "---"}</td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center">
                                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${r.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : r.status === 'Rejected' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {r.status}
                                                    </span>
                                                </div>
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

export default MaterialRequestPage;
