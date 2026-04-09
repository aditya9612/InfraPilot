import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const machineryData = [
    { id: 1, name: "JCB Excavator", equipmentId: "MC-001", operator: "Suresh P.", hours: 8, fuel: "45L", condition: "Good", rentalCost: "18000", maintenanceDate: "2024-04-20" },
    { id: 2, name: "Tower Crane", equipmentId: "MC-022", operator: "Vinod K.", hours: 10, fuel: "Electric", condition: "Good", rentalCost: "25000", maintenanceDate: "2024-05-15" },
    { id: 3, name: "Concrete Mixer", equipmentId: "MC-015", operator: "Rahul B.", hours: 5, fuel: "15L", condition: "Repair", rentalCost: "5000", maintenanceDate: "2024-04-05" },
];

const MachineryPage = () => {
    const [formData, setFormData] = useState({
        equipmentName: "",
        equipmentId: "",
        operatorName: "",
        workingHours: "",
        fuelUsed: "",
        condition: "Good",
        rentalCost: "",
        maintenanceDate: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
        if (!formData.equipmentName.trim()) newErrors.equipmentName = "Equipment name is required";
        if (!formData.equipmentId.trim()) newErrors.equipmentId = "Equipment ID is required";
        if (!formData.operatorName.trim()) newErrors.operatorName = "Operator name is required";
        if (!formData.workingHours || Number(formData.workingHours) < 0) newErrors.workingHours = "Valid hours required";
        if (!formData.fuelUsed.trim()) newErrors.fuelUsed = "Fuel usage is required";
        if (!formData.rentalCost || Number(formData.rentalCost) < 0) newErrors.rentalCost = "Rental cost is required";
        if (!formData.maintenanceDate) newErrors.maintenanceDate = "Maintenance date is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all mandatory fields", { position: "top-right" });
            return;
        }
        toast.success("Machinery usage log saved successfully!", { position: "top-right" });
        console.log("Saved Log:", formData);
        handleReset();
    };

    const handleReset = () => {
        setFormData({
            equipmentName: "",
            equipmentId: "",
            operatorName: "",
            workingHours: "",
            fuelUsed: "",
            condition: "Good",
            rentalCost: "",
            maintenanceDate: "",
        });
        setErrors({});
    };

    return (
        <>
            <Navbar title="Machinery & Equipment" breadcrumb={["Engineer", "Machinery"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Input Form */}
                    <div className="lg:col-span-12 xl:col-span-5">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Machinery Usage Log</h2>
                            <p className="text-slate-500 text-sm">Log daily equipment performance and operational costs.</p>
                        </div>
                        <form onSubmit={handleSubmit} className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="p-8 space-y-6">
                                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    Usage & Performance Data
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="md:col-span-2">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.equipmentName ? 'text-rose-500' : 'text-slate-400'}`}>Equipment Name</label>
                                        <input
                                            type="text"
                                            name="equipmentName"
                                            value={formData.equipmentName}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-medium h-[52px] transition-all ${errors.equipmentName ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:border-primary/50'}`}
                                            placeholder="e.g. Caterpillar Excavator 320"
                                        />
                                        {errors.equipmentName && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.equipmentName}</p>}
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.equipmentId ? 'text-rose-500' : 'text-slate-400'}`}>Equipment ID / Code</label>
                                        <input
                                            type="text"
                                            name="equipmentId"
                                            value={formData.equipmentId}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-medium h-[52px] ${errors.equipmentId ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:border-primary/50'}`}
                                            placeholder="MC-001"
                                        />
                                        {errors.equipmentId && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.equipmentId}</p>}
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.operatorName ? 'text-rose-500' : 'text-slate-400'}`}>Operator Name</label>
                                        <input
                                            type="text"
                                            name="operatorName"
                                            value={formData.operatorName}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-medium h-[52px] ${errors.operatorName ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:border-primary/50'}`}
                                            placeholder="Operator Full Name"
                                        />
                                        {errors.operatorName && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.operatorName}</p>}
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.workingHours ? 'text-rose-500' : 'text-slate-400'}`}>Working Hours</label>
                                        <input
                                            type="number"
                                            name="workingHours"
                                            value={formData.workingHours}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.workingHours ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:border-primary/50'}`}
                                            placeholder="0.00"
                                        />
                                        {errors.workingHours && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.workingHours}</p>}
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.fuelUsed ? 'text-rose-500' : 'text-slate-400'}`}>Fuel Used (Ltr / Unit)</label>
                                        <input
                                            type="text"
                                            name="fuelUsed"
                                            value={formData.fuelUsed}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-medium h-[52px] ${errors.fuelUsed ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:border-primary/50'}`}
                                            placeholder="e.g. 50L"
                                        />
                                        {errors.fuelUsed && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.fuelUsed}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Equipment Condition</label>
                                        <select
                                            name="condition"
                                            value={formData.condition}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px] appearance-none"
                                        >
                                            <option value="Good">Good / Functional</option>
                                            <option value="Repair">Needs Repair</option>
                                            <option value="Breakdown">Breakdown</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.rentalCost ? 'text-rose-500' : 'text-slate-400'}`}>Rental Cost (Daily)</label>
                                        <input
                                            type="number"
                                            name="rentalCost"
                                            value={formData.rentalCost}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.rentalCost ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:border-primary/50'}`}
                                            placeholder="₹ 0.00"
                                        />
                                        {errors.rentalCost && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.rentalCost}</p>}
                                    </div>

                                    <div className="md:col-span-2 text-rose-500">
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.maintenanceDate ? 'text-rose-500' : 'text-slate-400'}`}>Next Maintenance Date</label>
                                        <input
                                            type="date"
                                            name="maintenanceDate"
                                            value={formData.maintenanceDate}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-medium h-[52px] ${errors.maintenanceDate ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:border-primary/50 text-slate-700'}`}
                                        />
                                        {errors.maintenanceDate && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{errors.maintenanceDate}</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3 sm:gap-4">
                                <button type="button" onClick={handleReset} className="w-full sm:flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-500 hover:bg-slate-100 rounded-2xl transition-all order-2 sm:order-1">Reset</button>
                                <button type="submit" className="w-full sm:flex-[2] py-4 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 order-1 sm:order-2">Save Usage Log</button>
                            </div>
                        </form>
                    </div>

                    {/* Right: List */}
                    <div className="lg:col-span-12 xl:col-span-7">
                        <div className="mb-6">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Fleet Status</h2>
                            <p className="text-slate-500 text-sm">Real-time tracking of site equipment and availability.</p>
                        </div>
                        <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                            <th className="px-8 py-6">Machinery Details</th>
                                            <th className="px-6 py-6">Today's metrics</th>
                                            <th className="px-6 py-6">Rental cost</th>
                                            <th className="px-8 py-6 text-right">Condition</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {machineryData.map(m => (
                                            <tr key={m.id} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-8 py-6">
                                                    <div>
                                                        <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">{m.name}</p>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-black tracking-tighter">{m.equipmentId}</span>
                                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Op: {m.operator}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-center">
                                                            <p className="text-sm font-black text-slate-900">{m.hours}h</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase">Time</p>
                                                        </div>
                                                        <div className="w-px h-6 bg-slate-200"></div>
                                                        <div className="text-center">
                                                            <p className="text-sm font-black text-slate-900">{m.fuel}</p>
                                                            <p className="text-[9px] text-slate-400 font-bold uppercase">Fuel</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-6">
                                                    <p className="text-sm font-black text-emerald-600">₹{Number(m.rentalCost).toLocaleString()}</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase">Daily Rate</p>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${m.condition === 'Good' ? 'bg-emerald-500 text-white shadow-emerald-100' : 'bg-rose-500 text-white shadow-rose-100'}`}>
                                                        {m.condition}
                                                    </span>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">Next Maint: {m.maintenanceDate}</p>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default MachineryPage;
