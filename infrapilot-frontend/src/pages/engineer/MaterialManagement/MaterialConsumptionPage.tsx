import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";

const MaterialConsumptionPage = () => {
    const [formData, setFormData] = useState({
        materialName: "",
        unit: "Bag",
        usedQty: "",
        consumptionDate: new Date().toISOString().split("T")[0],
        location: "Site",
        activityName: "",
        remarks: "",
    });

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
        if (!formData.materialName) newErrors.materialName = "Material selection is required";
        if (!formData.usedQty || Number(formData.usedQty) <= 0) newErrors.usedQty = "Valid quantity is required";
        if (!formData.location) newErrors.location = "Location is required";
        if (!formData.activityName) newErrors.activityName = "Activity linkage is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required mandatory fields", { position: "top-right" });
            return;
        }
        toast.success("Material consumption logged successfully!", { position: "top-right" });
        console.log("Logged Consumption:", formData);
    };

    return (
        <>
            <Navbar title="Material Consumption Log" breadcrumb={["Engineer", "Material", "Consumption"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Material Management</h1>
                        <p className="text-slate-500 text-sm">Log daily material usage for site activities.</p>
                    </div>

                    {/* Submenu Tabs */}
                    <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                        <Link to="/engineer/material/receipt" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                            Material Receipt
                        </Link>
                        <button className="px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 border-primary text-primary whitespace-nowrap">
                            Material Consumption
                        </button>
                        <Link to="/engineer/material/stock" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                            Current Stock
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 space-y-6">
                            <h2 className="text-xs font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                Material Usage / Consumption Log
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.materialName ? 'text-rose-500' : 'text-slate-400'}`}>Material Name</label>
                                        <select
                                            name="materialName"
                                            value={formData.materialName}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none font-medium appearance-none h-[52px] ${errors.materialName ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-primary/20'}`}
                                        >
                                            <option value="">Select Material...</option>
                                            <option>Cement (OPC 53)</option>
                                            <option>TMT Bars (12mm)</option>
                                            <option>Coarse Sand</option>
                                            <option>Crushed Stone (20mm)</option>
                                            <option>Bricks (Class A)</option>
                                        </select>
                                        {errors.materialName && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.materialName}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Unit</label>
                                        <select
                                            name="unit"
                                            value={formData.unit}
                                            onChange={handleChange}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium appearance-none h-[52px]"
                                        >
                                            <option>Bag</option>
                                            <option>Kg</option>
                                            <option>Ton</option>
                                            <option>Cu.m</option>
                                            <option>Nos</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.usedQty ? 'text-rose-500' : 'text-slate-400'}`}>Used / Consumed Quantity</label>
                                    <input
                                        type="number"
                                        name="usedQty"
                                        value={formData.usedQty}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none font-bold text-lg h-[52px] ${errors.usedQty ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-primary/20'}`}
                                    />
                                    {errors.usedQty && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.usedQty}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Date of usage</label>
                                    <input
                                        type="date"
                                        name="consumptionDate"
                                        value={formData.consumptionDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium h-[52px]"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Location (From)</label>
                                    <select
                                        name="location"
                                        value={formData.location}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium h-[52px] appearance-none"
                                    >
                                        <option value="Store">Main Store</option>
                                        <option value="Site">On-Site Shed</option>
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.activityName ? 'text-rose-500' : 'text-slate-400'}`}>Activity / Task Linked</label>
                                    <select
                                        name="activityName"
                                        value={formData.activityName}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none font-medium appearance-none h-[52px] ${errors.activityName ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-primary/20'}`}
                                    >
                                        <option value="">Select Activity...</option>
                                        <option>Excavation for Main Block</option>
                                        <option>RCC Column Casting (Floor 1)</option>
                                        <option>Brickwork - Partition Walls</option>
                                    </select>
                                    {errors.activityName && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.activityName}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Remarks / Notes</label>
                                    <textarea
                                        name="remarks"
                                        rows={3}
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        placeholder="e.g. wastage accounted for, used in beam B2..."
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({
                                        materialName: "",
                                        unit: "Bag",
                                        usedQty: "",
                                        consumptionDate: new Date().toISOString().split("T")[0],
                                        location: "Site",
                                        activityName: "",
                                        remarks: "",
                                    });
                                    setErrors({});
                                }}
                                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors order-2 sm:order-1"
                            >
                                Reset Form
                            </button>
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-12 py-3.5 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 order-1 sm:order-2"
                            >
                                Log Consumption
                            </button>
                        </div>
                    </form>
                </div>
            </PageTransition>
        </>
    );
};

export default MaterialConsumptionPage;
