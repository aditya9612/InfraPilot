import React, { useState, useRef } from "react";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

const SitePhotosPage = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [photos, setPhotos] = useState([
        { id: 101, url: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=800&q=80", date: "2024-04-10", time: "10:30 AM", activity: "Block A - Footing Pouring", category: "Foundation", location: "Sector 4", capturedBy: "Karan Singh", description: "Base slab reinforcement work completed for block A. Concrete grade M25.", coordinates: "19.0760° N, 72.8777° E", remarks: "Quality approved by QC lead." },
        { id: 102, url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80", date: "2024-04-09", time: "03:45 PM", activity: "RCC Column Casting", category: "RCC", location: "Level 2", capturedBy: "Karan Singh", description: "Column C24 shuttering inspection completed.", coordinates: "19.0761° N, 72.8778° E", remarks: "Alignment verified." },
    ]);

    const [formData, setFormData] = useState({
        activity: "",
        category: "Foundation",
        location: "",
        description: "",
        remarks: "",
        hasPhoto: false
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData(prev => ({ ...prev, hasPhoto: true }));
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.activity.trim()) newErrors.activity = "Required";
        if (!formData.location.trim()) newErrors.location = "Required";
        if (!formData.description.trim()) newErrors.description = "Required";
        if (!formData.hasPhoto) newErrors.photo = "Photo Required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all required fields and upload photo.");
            return;
        }

        const newPhoto = {
            id: Date.now(),
            url: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=800&q=80", // Mock URL
            date: new Date().toLocaleDateString(),
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            activity: formData.activity,
            category: formData.category,
            location: formData.location,
            capturedBy: "Karan Singh",
            description: formData.description,
            coordinates: "19.0762° N, 72.8779° E",
            remarks: formData.remarks || "No additional remarks."
        };

        toast.loading("Synchronizing Media Asset...");
        setTimeout(() => {
            setPhotos([newPhoto, ...photos]);
            toast.dismiss();
            toast.success("Visual Evidence Logged!");
            setIsModalOpen(false);
            setFormData({
                activity: "",
                category: "Foundation",
                location: "",
                description: "",
                remarks: "",
                hasPhoto: false
            });
        }, 1200);
    };

    return (
        <>
            <Navbar
                title="Project Visual Archive"
                breadcrumb={["InfraPilot", "Dashboard", "Engineer", "Visuals"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tighter mb-2">Visual Site Intelligence</h2>
                        <p className="text-slate-500 text-sm font-medium">Document construction progress, quality audits, and safety compliance with geotagged media.</p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            + CAPTURE EVIDENCE
                        </button>
                    </div>
                </div>

                <section className="mb-12">
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                        Media Vitals
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Assets"
                            value="128"
                            sub="Cloud Synced"
                            accent="text-blue-600"
                        />
                        <StatCard
                            title="Storage"
                            value="2.4GB"
                            sub="Efficiency Optimized"
                            accent="text-emerald-500"
                        />
                        <StatCard
                            title="Last Upload"
                            value="2h Ago"
                            sub="Block A Updates"
                            accent="text-amber-500"
                        />
                        <StatCard
                            title="Critical Tags"
                            value="05"
                            sub="Requires Action"
                            accent="text-rose-600"
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-[10px] font-black text-slate-400 tracking-[0.3em] mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Optical Construction Archive
                    </h2>
                    <div className="grid grid-cols-1 gap-6 mb-24">
                        {photos.map((photo) => (
                            <div
                                key={photo.id}
                                className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-start md:items-center hover:shadow-xl hover:shadow-slate-200/50 cursor-pointer group transition-all"
                            >
                                <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600" />

                                <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm border border-slate-100 flex-shrink-0">
                                    <img src={photo.url} alt="Site" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>

                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-4 mb-2">
                                        <span className="text-xl font-black text-slate-800 tracking-tighter uppercase">IMG-{photo.id}</span>
                                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-widest">
                                            {photo.category}
                                        </span>
                                        <span className="text-[10px] font-black text-slate-400 ml-auto tracking-widest uppercase">{photo.date} | {photo.time}</span>
                                    </div>

                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-4 border-y border-slate-50">
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Activity Reference</span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{photo.activity}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Spatial Location</span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{photo.location}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Captured By</span>
                                            <p className="text-[11px] font-black text-slate-700 uppercase">{photo.capturedBy}</p>
                                        </div>
                                        <div>
                                            <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">GPS Telemetry</span>
                                            <p className="text-[11px] font-black text-blue-600 uppercase italic truncate">{photo.coordinates}</p>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <span className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-1 block">Field Narrative</span>
                                        <p className="text-[11px] font-medium text-slate-500 line-clamp-1 italic text-balance lowercase">"{photo.description}"</p>
                                    </div>
                                </div>

                                <button className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all shadow-xl shadow-slate-200">
                                    →
                                </button>
                            </div>
                        ))}
                    </div>
                </section>
            </PageTransition>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title="Visual Evidence Protocol"
                maxWidth="max-w-4xl"
            >
                <div className="p-12 bg-white">
                    <form id="photo-form" onSubmit={handleSubmit} className="space-y-12">
                        <div className="space-y-8">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)]" />
                                <h3 className="admin-pulse-form-section-title">Optical Asset Capture</h3>
                            </div>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full aspect-video rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${formData.hasPhoto ? "bg-green-50/50 border-green-200" : "bg-slate-50/50 border-slate-200 hover:bg-slate-100"}`}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                {formData.hasPhoto ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-xl">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                        </div>
                                        <p className="text-xs font-bold text-emerald-700 tracking-widest uppercase">Asset Authenticated</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600 shadow-sm border border-slate-100">
                                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        </div>
                                        <p className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Select Media for Uplink</p>
                                    </div>
                                )}
                            </div>
                            {errors.photo && <p className="text-[10px] font-bold text-rose-500 text-center mt-4">{errors.photo}</p>}
                        </div>

                        <div className="space-y-8 bg-slate-50/50 -mx-12 p-12 border-y border-slate-100 italic">
                            <div className="admin-pulse-form-section-header">
                                <div className="admin-pulse-form-section-indicator bg-amber-500" />
                                <h3 className="admin-pulse-form-section-title">Visual Categorization</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Activity / Title Reference</label>
                                    <input type="text" name="activity" value={formData.activity} onChange={handleChange} placeholder="e.g. Slab Reinforcement Inspection" className="admin-pulse-form-input" />
                                    {errors.activity && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.activity}</p>}
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Category Assignment</label>
                                    <select name="category" value={formData.category} onChange={handleChange} className="admin-pulse-form-input cursor-pointer appearance-none">
                                        <option>Foundation</option>
                                        <option>RCC Work</option>
                                        <option>Finishing</option>
                                        <option>Safety Audit</option>
                                        <option>Machinery Setup</option>
                                        <option>Material Delivery</option>
                                    </select>
                                </div>
                                <div className="admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Location / Sector</label>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Zone/Block" className="admin-pulse-form-input" />
                                    {errors.location && <p className="text-[10px] font-bold text-rose-500 mt-2">{errors.location}</p>}
                                </div>
                                <div className="col-span-2 admin-pulse-form-group">
                                    <label className="admin-pulse-form-label admin-pulse-form-required">Description & Remarks</label>
                                    <textarea name="description" rows={3} value={formData.description} onChange={handleChange} placeholder="Primary observations..." className="admin-pulse-form-input resize-none p-6" />
                                </div>
                            </div>
                        </div>

                        {/* Summary Box */}
                        <div className="admin-pulse-form-summary">
                            <div>
                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Metadata Synchronization</span>
                                <p className="text-2xl font-black text-slate-800 tracking-tighter mt-1">{formData.activity ? formData.activity.toUpperCase() : 'WAITING FOR INPUT...'}</p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-12 pb-12 rounded-b-[40px] flex items-center justify-end gap-4">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="admin-pulse-btn-text">Discard</button>
                    <button type="submit" form="photo-form" className="admin-pulse-btn-primary">Synchronize Archive</button>
                </div>
            </Modal>

        </>
    );
};

export default SitePhotosPage;
