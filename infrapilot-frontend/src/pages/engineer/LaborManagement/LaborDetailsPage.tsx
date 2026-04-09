import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";

const initialLaborData = [
    { id: 1, name: "Ram Singh", aadhaar: "4532 9821 1234", contractor: "ABC Constructions", type: "Skilled", skill: "Mason", mobile: "+91 98765 12345", wage: "650" },
    { id: 2, name: "Shyam Lal", aadhaar: "8821 3342 5678", contractor: "ABC Constructions", type: "Unskilled", skill: "Helper", mobile: "+91 98765 67890", wage: "450" },
    { id: 3, name: "Sita Devi", aadhaar: "1234 5678 9012", contractor: "Global Infra", type: "Skilled", skill: "Painter", mobile: "+91 98765 11223", wage: "600" },
];

const LaborDetailsPage = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [laborList, setLaborList] = useState(initialLaborData);
    const [showAddForm, setShowAddForm] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        aadhaar: "",
        contractor: "",
        type: "Skilled",
        skill: "",
        mobile: "",
        wage: "",
        attendance: "Present",
        inTime: "09:00",
        outTime: "18:00",
        workingHours: "9",
        overtime: "0"
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const formatAadhaar = (value: string) => {
        const val = value.replace(/\D/g, "").substring(0, 12);
        let formatted = "";
        for (let i = 0; i < val.length; i++) {
            if (i > 0 && i % 4 === 0) formatted += " ";
            formatted += val[i];
        }
        return formatted;
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name) newErrors.name = "Worker name is required";
        if (formData.aadhaar.replace(/\s/g, "").length !== 12) {
            newErrors.aadhaar = "Aadhaar must be 12 digits (XXXX XXXX XXXX)";
        }
        if (!formData.contractor) newErrors.contractor = "Contractor is required";
        if (!formData.skill) newErrors.skill = "Skill type is required";
        if (!formData.wage || isNaN(Number(formData.wage))) newErrors.wage = "Valid wage rate is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "aadhaar") {
            setFormData(prev => ({ ...prev, [name]: formatAadhaar(value) }));
        } else if (name === "mobile") {
            // Auto-prefix with +91 if a digit is entered as the first character
            if (value && /^[1-9]$/.test(value)) {
                setFormData(prev => ({ ...prev, [name]: `+91 ${value}` }));
            } else {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please correct the errors in the form.");
            return;
        }

        const newWorker = {
            ...formData,
            id: laborList.length + 1,
            mobile: formData.mobile || "N/A"
        };

        setLaborList([newWorker, ...laborList]);
        toast.success("Worker registered successfully!");
        setShowAddForm(false);
        setFormData({
            name: "",
            aadhaar: "",
            contractor: "",
            type: "Skilled",
            skill: "",
            mobile: "",
            wage: "",
            attendance: "Present",
            inTime: "09:00",
            outTime: "18:00",
            workingHours: "9",
            overtime: "0"
        });
        setErrors({});
    };

    const filteredLabor = laborList.filter(
        (l) => l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.contractor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <Navbar title="Labor Directory" breadcrumb={["Engineer", "Labor", "Details"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Labor Management</h1>
                        <p className="text-slate-500 text-sm">Manage detailed information and documentation for site labor.</p>
                    </div>
                </div>

                {/* Submenu Tabs */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                    <Link to="/engineer/labor/attendance" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                        Attendance
                    </Link>
                    <button className="px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 border-primary text-primary whitespace-nowrap">
                        Labor Details
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6 items-stretch sm:items-center">
                    <div className="relative w-full sm:w-80">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input
                            type="text"
                            placeholder="Search by worker or contractor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-primary/20 outline-none w-full"
                        />
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-lg w-full sm:w-auto ${showAddForm ? 'bg-slate-200 text-slate-600' : 'bg-primary text-white shadow-primary/20 hover:bg-blue-600'}`}
                    >
                        {showAddForm ? "Cancel" : "+ Add Worker"}
                    </button>
                </div>

                {showAddForm && (
                    <div className="space-y-6 mb-10 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Register New Worker</h2>
                        </div>

                        <form onSubmit={handleSubmit} id="worker-form">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Section 1: Worker Details */}
                                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 h-fit">
                                    <div className="border-b border-slate-50 pb-3">
                                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Worker Information</h3>
                                        <p className="text-[11px] text-slate-400 font-medium tracking-tight">Personal and professional identification details.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="md:col-span-2">
                                            <label className={`block text-xs font-bold mb-1.5 ${errors.name ? 'text-rose-500' : 'text-slate-500'}`}>Worker Full Name <span className="text-rose-500">*</span></label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                placeholder="e.g. Ramesh Kumar"
                                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all placeholder:text-slate-300 ${errors.name ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary'}`}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-xs font-bold mb-1.5 ${errors.aadhaar ? 'text-rose-500' : 'text-slate-500'}`}>Aadhaar Number <span className="text-rose-500">*</span></label>
                                            <input
                                                type="text"
                                                name="aadhaar"
                                                value={formData.aadhaar}
                                                onChange={handleChange}
                                                placeholder="XXXX XXXX XXXX"
                                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-bold tracking-widest outline-none transition-all ${errors.aadhaar ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary'}`}
                                            />
                                        </div>

                                        <div>
                                            <label className={`block text-xs font-bold mb-1.5 ${errors.contractor ? 'text-rose-500' : 'text-slate-500'}`}>Assigned Contractor <span className="text-rose-500">*</span></label>
                                            <input
                                                type="text"
                                                name="contractor"
                                                value={formData.contractor}
                                                onChange={handleChange}
                                                placeholder="Enter firm name"
                                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${errors.contractor ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary'}`}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 mb-1.5">Employment Category</label>
                                            <select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none h-[48px] focus:ring-4 focus:ring-primary/10 focus:border-primary"
                                            >
                                                <option>Skilled</option>
                                                <option>Semi-Skilled</option>
                                                <option>Unskilled</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className={`block text-xs font-bold mb-1.5 ${errors.skill ? 'text-rose-500' : 'text-slate-500'}`}>Primary Skill <span className="text-rose-500">*</span></label>
                                            <input
                                                type="text"
                                                name="skill"
                                                value={formData.skill}
                                                onChange={handleChange}
                                                placeholder="e.g. Mason"
                                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm outline-none transition-all ${errors.skill ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary'}`}
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className={`block text-xs font-bold mb-1.5 ${errors.wage ? 'text-rose-500' : 'text-slate-500'}`}>Daily Wage Rate (₹) <span className="text-rose-500">*</span></label>
                                            <input
                                                type="number"
                                                name="wage"
                                                value={formData.wage}
                                                onChange={handleChange}
                                                placeholder="Enter amount per day"
                                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-black outline-none transition-all ${errors.wage ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-4 focus:ring-primary/10 focus:border-primary'}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Section 2: Attendance & Shift */}
                                <div className="space-y-6">
                                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                                        <div className="border-b border-slate-50 pb-3">
                                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Shift & Operations</h3>
                                            <p className="text-[11px] text-slate-400 font-medium tracking-tight">Initial attendance and working hour configuration.</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Punch-In Status</label>
                                                <select
                                                    name="attendance"
                                                    value={formData.attendance}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none h-[48px] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                                >
                                                    <option value="Present">Present</option>
                                                    <option value="Absent">Absent</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Contact Number</label>
                                                <input
                                                    type="text"
                                                    name="mobile"
                                                    value={formData.mobile}
                                                    onChange={handleChange}
                                                    placeholder="+91 XXXXX XXXXX"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none transition-all focus:ring-4 focus:ring-primary/10 focus:border-primary"
                                                />
                                            </div>

                                            <div className="md:col-span-2 grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">In Time</label>
                                                    <input
                                                        type="time"
                                                        name="inTime"
                                                        value={formData.inTime}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none h-[48px] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Out Time</label>
                                                    <input
                                                        type="time"
                                                        name="outTime"
                                                        value={formData.outTime}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none h-[48px] focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Std. Hours</label>
                                                <input
                                                    type="number"
                                                    name="workingHours"
                                                    value={formData.workingHours}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none h-[48px] focus:ring-4 focus:ring-primary/10 focus:border-primary"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-1.5">Buffer/OT Hours</label>
                                                <input
                                                    type="number"
                                                    name="overtime"
                                                    value={formData.overtime}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none h-[48px] focus:ring-4 focus:ring-primary/10 focus:border-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 justify-end items-center pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowAddForm(false)}
                                            className="px-8 py-3.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all rounded-xl"
                                        >
                                            Discard Changes
                                        </button>
                                        <button
                                            type="submit"
                                            form="worker-form"
                                            className="px-12 py-3.5 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-600 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/30 transition-all active:scale-95"
                                        >
                                            Complete Registration
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                )}

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">Worker Information</th>
                                    <th className="px-6 py-4">ID / Aadhaar</th>
                                    <th className="px-6 py-4">Contractor</th>
                                    <th className="px-6 py-4">Work Type / Skill</th>
                                    <th className="px-6 py-4 text-right">Wage Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLabor.map(l => (
                                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase">
                                                    {l.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-slate-700 group-hover:text-primary transition-colors">{l.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded">
                                                {l.aadhaar}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">{l.contractor}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{l.type}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{l.skill}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-black text-emerald-600 text-sm">
                                            ₹{l.wage}/day
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default LaborDetailsPage;
