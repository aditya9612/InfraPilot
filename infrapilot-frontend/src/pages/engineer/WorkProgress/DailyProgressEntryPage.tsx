import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";

const DailyProgressEntryPage = () => {
    const [formData, setFormData] = useState({
        activityName: "",
        boqCode: "",
        plannedQty: "",
        todayProgress: "",
        totalCompleted: "",
        remainingQty: "",
        percentage: "",
        startDate: "",
        endDate: "",
        status: "On Track",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.activityName) newErrors.activityName = "Activity is required";
        if (!formData.boqCode) newErrors.boqCode = "BOQ code is required";
        if (!formData.plannedQty) newErrors.plannedQty = "Planned quantity is required";
        if (!formData.todayProgress) newErrors.todayProgress = "Today's progress is required";
        if (!formData.startDate) newErrors.startDate = "Start date is required";
        if (!formData.endDate) newErrors.endDate = "End date is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        let updatedData = { ...formData, [name]: value };

        // Clear error
        if (errors[name]) {
            setErrors(prev => {
                const upd = { ...prev };
                delete upd[name];
                return upd;
            });
        }

        // Auto-calculate logic
        if (name === "todayProgress" || name === "plannedQty") {
            const planned = parseFloat(name === "plannedQty" ? value : formData.plannedQty) || 0;
            const today = parseFloat(name === "todayProgress" ? value : formData.todayProgress) || 0;
            const previousCompleted = 500; // Mock historical data
            const total = previousCompleted + today;
            const remaining = Math.max(0, planned - total);
            const percent = planned > 0 ? Math.min(100, Math.round((total / planned) * 100)) : 0;

            updatedData = {
                ...updatedData,
                totalCompleted: total.toString(),
                remainingQty: remaining.toString(),
                percentage: percent.toString()
            };
        }

        setFormData(updatedData);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error("Please fill all required fields.");
            return;
        }

        toast.success("Daily progress log saved successfully!");
        console.log("Progress Submission:", formData);
    };

    return (
        <>
            <Navbar title="Daily Progress Entry" breadcrumb={["Engineer", "Work Progress", "Daily Entry"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-800">Work Progress</h1>
                        <p className="text-slate-500 text-sm">Enter the quantities of work completed for today's activities.</p>
                    </div>

                    {/* Submenu Tabs */}
                    <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                        <Link to="/engineer/progress/activities" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                            Activity List
                        </Link>
                        <button className="px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 border-primary text-primary whitespace-nowrap">
                            Daily Progress Entry
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${errors.activityName ? 'text-rose-500' : 'text-slate-400'}`}>Select Activity</label>
                                    <select
                                        name="activityName"
                                        value={formData.activityName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium appearance-none ${errors.activityName ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200'}`}
                                    >
                                        <option value="">Choose an activity...</option>
                                        <option>Excavation for Main Block</option>
                                        <option>PCC Foundation</option>
                                        <option>RCC Column Casting (Floor 1)</option>
                                        <option>Brickwork - Partition Walls</option>
                                    </select>
                                    {errors.activityName && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.activityName}</p>}
                                </div>

                                <div>
                                    <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${errors.boqCode ? 'text-rose-500' : 'text-slate-400'}`}>BOQ Code</label>
                                    <input
                                        type="text"
                                        name="boqCode"
                                        value={formData.boqCode}
                                        onChange={handleChange}
                                        placeholder="e.g. CV-201"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium ${errors.boqCode ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200'}`}
                                    />
                                    {errors.boqCode && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.boqCode}</p>}
                                </div>

                                <div>
                                    <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${errors.plannedQty ? 'text-rose-500' : 'text-slate-400'}`}>Planned Quantity (Total)</label>
                                    <input
                                        type="number"
                                        name="plannedQty"
                                        value={formData.plannedQty}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium ${errors.plannedQty ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200'}`}
                                    />
                                    {errors.plannedQty && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.plannedQty}</p>}
                                </div>

                                <div>
                                    <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${errors.startDate ? 'text-rose-500' : 'text-slate-400'}`}>Start Date</label>
                                    <input
                                        type="date"
                                        name="startDate"
                                        value={formData.startDate}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium ${errors.startDate ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200'}`}
                                    />
                                    {errors.startDate && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.startDate}</p>}
                                </div>

                                <div>
                                    <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${errors.endDate ? 'text-rose-500' : 'text-slate-400'}`}>End Date</label>
                                    <input
                                        type="date"
                                        name="endDate"
                                        value={formData.endDate}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium ${errors.endDate ? 'border-rose-300 ring-2 ring-rose-50' : 'border-slate-200'}`}
                                    />
                                    {errors.endDate && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.endDate}</p>}
                                </div>

                                <div className="p-6 bg-primary/5 border border-primary/10 rounded-3xl relative col-span-1 md:col-span-2 my-4">
                                    <div className="absolute -top-3 left-6 px-3 py-0.5 bg-white text-[10px] font-black text-primary uppercase tracking-widest border border-slate-100 rounded-full shadow-sm">
                                        Today's Entry
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                        <div>
                                            <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${errors.todayProgress ? 'text-rose-500' : 'text-primary'}`}>Quantity Completed Today</label>
                                            <input
                                                type="number"
                                                name="todayProgress"
                                                value={formData.todayProgress}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-3 bg-white border rounded-xl outline-none font-bold text-primary text-xl ${errors.todayProgress ? 'border-rose-300 ring-2 ring-rose-50' : 'border-primary/20 focus:border-primary'}`}
                                            />
                                            {errors.todayProgress && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.todayProgress}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Work Status</label>
                                            <select
                                                name="status"
                                                value={formData.status}
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium appearance-none h-[52px]"
                                            >
                                                <option>On Track</option>
                                                <option>Ahead of Schedule</option>
                                                <option>Slight Delay</option>
                                                <option>Critical Delay</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 col-span-1 md:col-span-2">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col group">
                                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">Total Completed</label>
                                        <input
                                            type="number"
                                            name="totalCompleted"
                                            value={formData.totalCompleted}
                                            onChange={handleChange}
                                            className="bg-transparent border-none outline-none text-lg font-bold text-slate-700 w-full"
                                        />
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col group">
                                        <label className="text-[10px] text-slate-400 font-black uppercase tracking-wider mb-2 group-focus-within:text-primary transition-colors">Remaining Qty</label>
                                        <input
                                            type="number"
                                            name="remainingQty"
                                            value={formData.remainingQty}
                                            onChange={handleChange}
                                            className="bg-transparent border-none outline-none text-lg font-bold text-slate-700 w-full"
                                        />
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border-2 border-emerald-100 ring-4 ring-emerald-50/50 flex flex-col group">
                                        <label className="text-[10px] text-emerald-500 font-black uppercase tracking-wider mb-2">Manual % Entry</label>
                                        <div className="flex items-center">
                                            <input
                                                type="number"
                                                name="percentage"
                                                value={formData.percentage}
                                                onChange={handleChange}
                                                className="bg-transparent border-none outline-none text-lg font-black text-emerald-600 w-full"
                                            />
                                            <span className="text-emerald-600 font-black">%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({
                                    activityName: "",
                                    boqCode: "",
                                    plannedQty: "",
                                    todayProgress: "",
                                    totalCompleted: "",
                                    remainingQty: "",
                                    percentage: "",
                                    startDate: "",
                                    endDate: "",
                                    status: "On Track",
                                })}
                                className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors order-2 sm:order-1"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-10 py-3 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 order-1 sm:order-2"
                            >
                                Log Progress
                            </button>
                        </div>
                    </form>
                </div>
            </PageTransition>
        </>
    );
};

export default DailyProgressEntryPage;
