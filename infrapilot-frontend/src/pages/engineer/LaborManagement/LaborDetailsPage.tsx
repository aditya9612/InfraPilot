import React, { useState } from "react";
import { Link } from "react-router-dom";
import PageTransition from "../../../components/common/PageTransition";
import Modal from "../../../components/common/Modal";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";

const initialLaborData = [
    {
        id: "LAB-1001",
        name: "Ram Singh",
        aadhaar: "4532 9821 1234",
        contractor: "ABC Constructions",
        workType: "Mason (Skilled)",
        attendance: "Present",
        inTime: "09:00",
        outTime: "18:00",
        workingHours: 9,
        overtime: 0,
        wageRate: 650,
    },
    {
        id: "LAB-1002",
        name: "Shyam Lal",
        aadhaar: "8821 3342 5678",
        contractor: "ABC Constructions",
        workType: "Helper (Unskilled)",
        attendance: "Absent",
        inTime: "",
        outTime: "",
        workingHours: 0,
        overtime: 0,
        wageRate: 450,
    },
];

const LaborDetailsPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [laborList, setLaborList] = useState(initialLaborData);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedLabor, setSelectedLabor] = useState<any>(null);

    const [formData, setFormData] = useState({
        name: "",
        aadhaar: "",
        contractor: "",
        workType: "",
        attendance: "Present",
        inTime: "09:00",
        outTime: "18:00",
        workingHours: "9",
        overtime: "0",
        wageRate: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errors[name]) {
            setErrors(prev => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = "Required";
        if (!formData.aadhaar) newErrors.aadhaar = "Required";
        if (!formData.contractor) newErrors.contractor = "Required";
        if (!formData.workType) newErrors.workType = "Required";
        if (!formData.wageRate) newErrors.wageRate = "Required";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields.");
            return;
        }

        const newWorker = {
            ...formData,
            id: `LAB-${Date.now().toString().slice(-4)}`,
            workingHours: Number(formData.workingHours) || 0,
            overtime: Number(formData.overtime) || 0,
            wageRate: Number(formData.wageRate) || 0,
        };

        toast.loading("Registering personnel...", { id: "reg-load" });
        setTimeout(() => {
            setLaborList([newWorker, ...laborList]);
            toast.success("Personnel Registered Successfully!", { id: "reg-load" });
            setIsFormModalOpen(false);
            setFormData({
                name: "",
                aadhaar: "",
                contractor: "",
                workType: "",
                attendance: "Present",
                inTime: "09:00",
                outTime: "18:00",
                workingHours: "9",
                overtime: "0",
                wageRate: "",
            });
        }, 1200);
    };

    const filteredLabor = laborList.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.contractor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.aadhaar.includes(searchTerm)
    );

    return (
        <>
            <Navbar
                title="Personnel Asset Hub"
                breadcrumb={["InfraPilot", "Labor Management", "Labor Details"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-10">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Personnel Operational Matrix</h1>
                        <p className="text-slate-500 text-sm font-medium">End-to-end workforce lifecycle management and registry oversight.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsFormModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + REGISTER WORKER
                        </button>
                    </div>
                </div>

                <section className="mb-10">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                        Force Metrics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Operational Strength"
                            value="157"
                            sub="Active Personnel"
                            accent="text-blue-600"
                        />
                        <StatCard
                            title="Shift Fulfillment"
                            value="94%"
                            sub="Stable"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Skilled Ratio"
                            value="82"
                            sub="Expert Assets"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Compliance Delta"
                            value="100%"
                            sub="Identity Verified"
                            accent="text-rose-600"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Personnel Asset Ledger
                    </h2>
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
                        <div className="flex gap-2 p-1.5 bg-slate-100/50 rounded-[20px] w-fit border border-slate-200/50 backdrop-blur-sm shadow-inner">
                            <Link to="/engineer/labor/attendance" className="px-8 py-3 text-[10px] font-black tracking-widest text-slate-400 hover:text-slate-700 transition-all rounded-[14px]">Attendance Protocol</Link>
                            <button className="px-8 py-3 bg-white text-[10px] font-black tracking-widest text-blue-600 shadow-xl shadow-blue-500/10 rounded-[14px]">Personnel Directory</button>
                        </div>
                        <div className="relative w-full lg:w-[450px]">
                            <input
                                type="text"
                                placeholder="Search personnel..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white px-5 py-3 rounded-2xl border-none shadow-sm shadow-slate-200/50 text-[12px] font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-blue-600/10 transition-all"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 pb-24">
                        {filteredLabor.map((person) => (
                            <div
                                key={person.id}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                                onClick={() => setSelectedLabor(person)}
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-600 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="text-xl font-black text-slate-800 tracking-tighter">{person.name}</span>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-widest ${person.attendance === 'Present' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{person.attendance}</span>
                                        <span className="text-[10px] font-black text-slate-400 ml-auto tracking-widest uppercase">{person.id}</span>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">ID / Aadhaar</span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{person.aadhaar}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Contractor Name</span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{person.contractor}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Work Type</span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{person.workType}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Current Wage Rate</span>
                                            <p className="text-[11px] font-black text-blue-600 uppercase">₹{person.wageRate}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="md:w-48 text-right">
                                    <button
                                        className="bg-blue-50 text-blue-600 px-6 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase hover:bg-blue-600 hover:text-white transition-all w-full"
                                        onClick={(e) => { e.stopPropagation(); setSelectedLabor(person); }}
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Form Modal styled exactly like DSR */}
                <Modal
                    isOpen={isFormModalOpen}
                    onClose={() => setIsFormModalOpen(false)}
                    title="Workforce Governance Entry"
                    maxWidth="max-w-4xl"
                >
                    <div className="p-10 bg-slate-50/50">
                        <form id="labor-form" onSubmit={handleSubmit} className="space-y-12 bg-white p-10 rounded-[32px] shadow-sm border border-slate-100">

                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                                    <h3 className="text-[13px] font-black text-slate-800 tracking-widest leading-none uppercase">Identity Metadata</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase text-[10px]">Worker Name</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Legal Name" className="admin-pulse-form-input font-black" />
                                        {errors.name && <p className="text-[10px] font-bold text-rose-500 mt-2 px-1">{errors.name}</p>}
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase text-[10px]">ID / Aadhaar</label>
                                        <input type="text" name="aadhaar" value={formData.aadhaar} onChange={handleChange} placeholder="0000 0000 0000" className="admin-pulse-form-input font-black" />
                                        {errors.aadhaar && <p className="text-[10px] font-bold text-rose-500 mt-2 px-1">{errors.aadhaar}</p>}
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase text-[10px]">Contractor Name</label>
                                        <input type="text" name="contractor" value={formData.contractor} onChange={handleChange} placeholder="e.g. ABC Constructions" className="admin-pulse-form-input font-black" />
                                        {errors.contractor && <p className="text-[10px] font-bold text-rose-500 mt-2 px-1">{errors.contractor}</p>}
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase text-[10px]">Work Type</label>
                                        <input type="text" name="workType" value={formData.workType} onChange={handleChange} placeholder="e.g. Mason (Skilled)" className="admin-pulse-form-input font-black" />
                                        {errors.workType && <p className="text-[10px] font-bold text-rose-500 mt-2 px-1">{errors.workType}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                                    <h3 className="text-[13px] font-black text-slate-800 tracking-widest leading-none uppercase">Shift Governance & Pay</h3>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    <div className="col-span-2 admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase text-[10px]">Attendance</label>
                                        <select name="attendance" value={formData.attendance} onChange={handleChange} className="admin-pulse-form-input font-black">
                                            <option value="Present">Present</option>
                                            <option value="Absent">Absent</option>
                                        </select>
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label uppercase text-[10px]">In Time</label>
                                        <input type="time" name="inTime" value={formData.inTime} onChange={handleChange} className="admin-pulse-form-input font-black" disabled={formData.attendance === 'Absent'} />
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label uppercase text-[10px]">Out Time</label>
                                        <input type="time" name="outTime" value={formData.outTime} onChange={handleChange} className="admin-pulse-form-input font-black" disabled={formData.attendance === 'Absent'} />
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label uppercase text-[10px]">Working Hrs</label>
                                        <input type="number" name="workingHours" value={formData.workingHours} onChange={handleChange} className="admin-pulse-form-input font-black" disabled={formData.attendance === 'Absent'} />
                                    </div>
                                    <div className="admin-pulse-form-group">
                                        <label className="admin-pulse-form-label uppercase text-[10px]">Overtime (Hrs)</label>
                                        <input type="number" name="overtime" value={formData.overtime} onChange={handleChange} className="admin-pulse-form-input font-black" disabled={formData.attendance === 'Absent'} />
                                    </div>
                                    <div className="col-span-2 admin-pulse-form-group">
                                        <label className="admin-pulse-form-label admin-pulse-form-label-required uppercase text-[10px]">Wage Rate (₹ / Day)</label>
                                        <input type="number" name="wageRate" value={formData.wageRate} onChange={handleChange} placeholder="e.g. 650" className="admin-pulse-form-input font-black text-blue-600" />
                                        {errors.wageRate && <p className="text-[10px] font-bold text-rose-500 mt-2 px-1">{errors.wageRate}</p>}
                                    </div>
                                </div>
                            </div>

                        </form>
                    </div>
                    <div className="admin-pulse-modal-footer bg-slate-50/50 p-10 border-t border-slate-50 flex items-center justify-end gap-6">
                        <button type="button" onClick={() => setIsFormModalOpen(false)} className="px-10 py-5 text-[11px] font-black text-slate-400 tracking-widest hover:text-slate-600 transition-all">DISCARD</button>
                        <button type="submit" form="labor-form" className="admin-pulse-button-primary bg-blue-500 hover:bg-blue-600 px-6 py-2 text-white bold tracking-widest !rounded-[12px]">REGISTER PERSONNEL</button>
                    </div>
                </Modal>

                <Modal
                    isOpen={!!selectedLabor}
                    onClose={() => setSelectedLabor(null)}
                    title="Personnel Profile"
                    maxWidth="max-w-4xl"
                >
                    {selectedLabor && (
                        <div className="p-10 bg-white">
                            <div className="admin-pulse-details-banner">
                                <div className="admin-pulse-details-icon-container">
                                    {selectedLabor.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <h2 className="text-3xl font-black tracking-tight leading-none uppercase">{selectedLabor.name}</h2>
                                        <span className={`admin-pulse-status-badge ${selectedLabor.attendance === 'Present' ? 'bg-emerald-500/20 text-emerald-100 border-emerald-500/30' : 'bg-slate-500/20 text-slate-100 border-slate-500/30'} backdrop-blur-md border`}>
                                            {selectedLabor.attendance.toUpperCase()}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-black text-white tracking-tight mb-2 uppercase">{selectedLabor.workType}</h3>
                                    <p className="text-blue-200/60 text-[10px] font-black uppercase tracking-[0.2em]">Profile Register ID: {selectedLabor.id}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-12">
                                <div className="space-y-10">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <h3 className="admin-pulse-details-section-title uppercase">Identity Framework</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-8">
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">Aadhaar Identification</span>
                                                <p className="admin-pulse-details-value font-mono">{selectedLabor.aadhaar}</p>
                                            </div>
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">Contracting Entity</span>
                                                <p className="admin-pulse-details-value">{selectedLabor.contractor}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-10">
                                    <div>
                                        <div className="admin-pulse-details-section-header">
                                            <h3 className="admin-pulse-details-section-title uppercase">Shift & Compensation</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">Clock In / Out</span>
                                                <p className="admin-pulse-details-value">{selectedLabor.inTime || '-'} to {selectedLabor.outTime || '-'}</p>
                                            </div>
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">Net Hours</span>
                                                <p className="text-3xl font-black text-slate-900 tracking-tighter">{selectedLabor.workingHours}h</p>
                                            </div>
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">Daily Wage Rate</span>
                                                <p className="text-3xl font-black text-blue-600 tracking-tighter">₹{selectedLabor.wageRate}</p>
                                            </div>
                                            <div className="admin-pulse-details-group">
                                                <span className="admin-pulse-details-label uppercase">Overtime Delta</span>
                                                <p className="text-xl font-black text-amber-500 tracking-tighter">{selectedLabor.overtime}h</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </PageTransition>
        </>
    );
};

export default LaborDetailsPage;
