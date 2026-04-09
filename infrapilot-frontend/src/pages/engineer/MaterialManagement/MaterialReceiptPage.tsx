import React, { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";

const MaterialReceiptPage = () => {
    const [formData, setFormData] = useState({
        materialName: "",
        unit: "Bag",
        receivedQty: "",
        supplierName: "",
        billNumber: "",
        receivedDate: new Date().toISOString().split("T")[0],
        location: "Store",
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
        if (!formData.materialName) newErrors.materialName = "Material name is required";
        if (!formData.receivedQty || Number(formData.receivedQty) <= 0) newErrors.receivedQty = "Valid quantity is required";
        if (!formData.supplierName) newErrors.supplierName = "Supplier name is required";
        if (!formData.billNumber) newErrors.billNumber = "Bill number is required";
        if (!formData.location) newErrors.location = "Location is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields", { position: "top-right" });
            return;
        }
        toast.success("Material receipt logged successfully!", { position: "top-right" });
        console.log("Logged Receipt:", formData);
    };

    return (
        <>
            <Navbar title="Material Receipt (GRN)" breadcrumb={["Engineer", "Material", "Receipt"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Material Management</h1>
                        <p className="text-slate-500 text-sm">Log and track incoming materials at the site.</p>
                    </div>

                    {/* Submenu Tabs */}
                    <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                        <button className="px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 border-primary text-primary whitespace-nowrap">
                            Material Receipt
                        </button>
                        <Link to="/engineer/material/consumption" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                            Material Consumption
                        </Link>
                        <Link to="/engineer/material/stock" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                            Current Stock
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 space-y-6">
                            <h2 className="text-xs font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                Inbound Material Log (GRN)
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
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.receivedQty ? 'text-rose-500' : 'text-slate-400'}`}>Received Quantity</label>
                                    <input
                                        type="number"
                                        name="receivedQty"
                                        value={formData.receivedQty}
                                        onChange={handleChange}
                                        placeholder="0.00"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none font-bold text-lg h-[52px] ${errors.receivedQty ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-primary/20'}`}
                                    />
                                    {errors.receivedQty && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.receivedQty}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Receipt Date</label>
                                    <input
                                        type="date"
                                        name="receivedDate"
                                        value={formData.receivedDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none font-medium h-[52px]"
                                    />
                                </div>

                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.supplierName ? 'text-rose-500' : 'text-slate-400'}`}>Supplier Name</label>
                                    <input
                                        type="text"
                                        name="supplierName"
                                        value={formData.supplierName}
                                        onChange={handleChange}
                                        placeholder="Enter vendor name"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none font-medium h-[52px] ${errors.supplierName ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-primary/20'}`}
                                    />
                                    {errors.supplierName && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.supplierName}</p>}
                                </div>

                                <div>
                                    <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.billNumber ? 'text-rose-500' : 'text-slate-400'}`}>Bill / Invoice Number</label>
                                    <input
                                        type="text"
                                        name="billNumber"
                                        value={formData.billNumber}
                                        onChange={handleChange}
                                        placeholder="e.g. INV-102"
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-2 outline-none font-medium h-[52px] ${errors.billNumber ? 'border-rose-300 ring-rose-50' : 'border-slate-200 focus:ring-primary/20'}`}
                                    />
                                    {errors.billNumber && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.billNumber}</p>}
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Location</label>
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
                            </div>
                        </div>

                        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
                            <button
                                type="button"
                                onClick={() => {
                                    setFormData({
                                        materialName: "",
                                        unit: "Bag",
                                        receivedQty: "",
                                        supplierName: "",
                                        billNumber: "",
                                        receivedDate: new Date().toISOString().split("T")[0],
                                        location: "Store",
                                    });
                                    setErrors({});
                                }}
                                className="w-full sm:w-auto px-6 py-3.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors order-2 sm:order-1"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                className="w-full sm:w-auto px-12 py-3.5 bg-primary text-white text-sm font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 order-1 sm:order-2"
                            >
                                Log Receipt
                            </button>
                        </div>
                    </form>
                </div>
            </PageTransition>
        </>
    );
};

export default MaterialReceiptPage;
