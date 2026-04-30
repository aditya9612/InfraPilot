import React, { useState, useRef } from "react";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import toast from "react-hot-toast";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SitePhoto {
    id: number;
    url: string;
    date: string;
    time: string;
    activity_tag: string;
    location_tag: string;
    description: string;
    uploaded_by: string;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────────

const activityTags = [
    "Foundation Work",
    "RCC Column Casting",
    "Slab Pouring",
    "Brickwork / Masonry",
    "Plumbing Installation",
    "Electrical Wiring",
    "Safety Audit",
    "Material Delivery",
    "Machinery Setup",
    "Quality Inspection",
];

const locationTags = [
    "Block A – Ground Floor",
    "Block B – First Floor",
    "Block C – Terrace",
    "Site Office",
    "Material Yard",
    "North Zone",
    "South Zone",
    "East Wing",
    "West Wing",
    "Entry Gate",
];

const mockPhotos: SitePhoto[] = [
    {
        id: 101,
        url: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=800&q=80",
        date: "2026-04-13",
        time: "10:30 AM",
        activity_tag: "Foundation Work",
        location_tag: "Block A – Ground Floor",
        description: "Base slab reinforcement work completed for Block A. Concrete grade M25. Quality approved by QC lead.",
        uploaded_by: "Karan Singh",
    },
    {
        id: 102,
        url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
        date: "2026-04-12",
        time: "03:45 PM",
        activity_tag: "RCC Column Casting",
        location_tag: "Block B – First Floor",
        description: "Column C24 shuttering inspection completed. All alignments verified by site engineer.",
        uploaded_by: "Karan Singh",
    },
    {
        id: 103,
        url: "https://images.unsplash.com/photo-1590725140246-20acdee442be?auto=format&fit=crop&w=800&q=80",
        date: "2026-04-11",
        time: "08:00 AM",
        activity_tag: "Safety Audit",
        location_tag: "North Zone",
        description: "Morning safety walk completed. All PPE compliance confirmed. No violations found during audit.",
        uploaded_by: "Karan Singh",
    },
];

// ─── Profile Field Helper ────────────────────────────────────────────────────────



// ─── Initial Form State ─────────────────────────────────────────────────────────

const initialForm = {
    date: new Date().toISOString().split("T")[0],
    activity_tag: "",
    location_tag: "",
    description: "",
    has_photo: false,
    file_name: "",
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const SitePhotosPage = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);
    const [photos, setPhotos] = useState<SitePhoto[]>(mockPhotos);

    const [formData, setFormData] = useState(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterActivity, setFilterActivity] = useState("All Activities");
    const [filterLocation, setFilterLocation] = useState("All Locations");
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFormData(prev => ({ ...prev, has_photo: true, file_name: e.target.files![0].name }));
            if (errors.photo) setErrors(prev => { const u = { ...prev }; delete u.photo; return u; });
        }
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!formData.has_photo) errs.photo = "Please upload a photo";
        if (!formData.date) errs.date = "Date is required";
        if (!formData.activity_tag) errs.activity_tag = "Activity Tag is required";
        if (!formData.location_tag) errs.location_tag = "Location Tag is required";
        if (!formData.description.trim()) errs.description = "Description is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please fill all required fields.");
            return;
        }
        setIsSubmitting(true);
        toast.loading("Uploading photo…", { id: "photo-upload" });
        setTimeout(() => {
            const newPhoto: SitePhoto = {
                id: Date.now(),
                url: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=800&q=80",
                date: formData.date,
                time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                activity_tag: formData.activity_tag,
                location_tag: formData.location_tag,
                description: formData.description,
                uploaded_by: "Karan Singh",
            };
            setPhotos(prev => [newPhoto, ...prev]);
            toast.success("Photo uploaded successfully!", { id: "photo-upload" });
            setIsSubmitting(false);
            setIsUploadOpen(false);
            setFormData(initialForm);
            setErrors({});
        }, 1500);
    };
    const handleDeleteClick = (id: number) => {
        setPhotoToDelete(id);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!photoToDelete) return;
        setPhotos(prev => prev.filter(p => p.id !== photoToDelete));
        toast.success("Site photo deleted successfully");
        setIsDeleteModalOpen(false);
        setPhotoToDelete(null);
    };

    // ── Filter Bar ────────────────────────────────────────────────────────

    return (
        <>
            <Navbar
                title="Site Photos"
                breadcrumb={["InfraPilot", "Engineer", "Site Photos"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Site Engineer
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Site Photos
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Upload, tag, and manage site photographs with activity and location metadata.
                        </p>
                    </div>
                    <button
                        onClick={() => { setFormData(initialForm); setErrors({}); setIsUploadOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                        </svg>
                        Upload Photo
                    </button>
                </div>

                {/* ── Stat Cards ───────────────────────────────────────────── */}
                <div className="mb-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">
                        Photo Summary
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Total Photos", value: String(photos.length), sub: "All uploads", accent: "text-primary" },
                            { label: "This Week", value: "12", sub: "New uploads", accent: "text-emerald-500" },
                            { label: "Activity Tags", value: String(activityTags.length), sub: "Categories", accent: "text-amber-500" },
                            { label: "Location Tags", value: String(locationTags.length), sub: "Site zones", accent: "text-indigo-500" },
                        ].map(s => (
                            <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{s.label}</p>
                                <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{s.sub}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by description or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                        />
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap gap-4">
                        <select
                            value={filterActivity}
                            onChange={(e) => setFilterActivity(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none transition-all cursor-pointer"
                        >
                            <option>All Activities</option>
                            {activityTags.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select
                            value={filterLocation}
                            onChange={(e) => setFilterLocation(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold text-slate-600 focus:outline-none transition-all cursor-pointer"
                        >
                            <option>All Locations</option>
                            {locationTags.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>

                {/* ── Photo Grid ───────────────────────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {photos
                        .filter(p => {
                            const matchesSearch = p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                String(p.id).includes(searchQuery);
                            const matchesActivity = filterActivity === "All Activities" || p.activity_tag === filterActivity;
                            const matchesLocation = filterLocation === "All Locations" || p.location_tag === filterLocation;
                            return matchesSearch && matchesActivity && matchesLocation;
                        })
                        .map(photo => (
                            <div
                                key={photo.id}
                                className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 cursor-pointer"
                                onClick={() => setSelectedPhoto(photo)}
                            >
                                <div className="aspect-[4/3] relative overflow-hidden">
                                    <img
                                        src={photo.url}
                                        alt={photo.activity_tag}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute top-4 left-4">
                                        <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-black text-slate-800 rounded-lg uppercase tracking-widest shadow-sm">
                                            {photo.activity_tag}
                                        </span>
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteClick(photo.id); }}
                                            className="p-2 bg-white/90 backdrop-blur-md text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-lg"
                                            title="Delete Photo"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        <p className="text-[10px] font-bold truncate pr-2">{photo.location_tag}</p>
                                        <p className="text-[10px] font-black tabular-nums shrink-0">{photo.date}</p>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IMG-{photo.id}</span>
                                        <span className="text-[9px] font-black text-primary uppercase tracking-widest bg-primary/5 px-2 py-0.5 rounded-full">SITE CAPTURE</span>
                                    </div>
                                    <p className="text-[13px] font-bold text-slate-700 leading-snug line-clamp-2 mb-4 h-10">
                                        {photo.description}
                                    </p>
                                    <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 border-2 border-white shadow-sm">
                                            {photo.uploaded_by.split(" ").map(n => n[0]).join("")}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-800">{photo.uploaded_by}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{photo.time}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>

                {photos.filter(p => {
                    const matchesSearch = p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        String(p.id).includes(searchQuery);
                    const matchesActivity = filterActivity === "All Activities" || p.activity_tag === filterActivity;
                    const matchesLocation = filterLocation === "All Locations" || p.location_tag === filterLocation;
                    return matchesSearch && matchesActivity && matchesLocation;
                }).length === 0 && (
                        <div className="bg-white rounded-3xl p-20 text-center border border-slate-100 shadow-sm col-span-full">
                            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No site evidence found</p>
                            <p className="text-slate-300 text-xs mt-1">Try adjusting your filters or search query.</p>
                        </div>
                    )}


            </PageTransition>

            {/* ═══════════════════════════════════════════════════════════════
                UPLOAD PHOTO MODAL
            ═══════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                title="Register Site Evidence"
                maxWidth="max-w-2xl"
            >
                <div className="bg-white p-2 italic-none font-inter">
                    <form id="photo-form" onSubmit={handleSubmit} className="p-6 md:p-10 space-y-10">
                        {/* Section 1: Visual Evidence */}
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-6 w-1 bg-blue-600 rounded-full" />
                                <h3 className="text-[11px] font-black text-slate-800 tracking-[0.2em] uppercase">Visual Artifact</h3>
                            </div>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full h-40 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-500 overflow-hidden relative group ${formData.has_photo
                                    ? "bg-emerald-50/20 border-emerald-200"
                                    : errors.photo
                                        ? "bg-rose-50 border-rose-200"
                                        : "bg-slate-50/50 border-slate-100 hover:border-blue-400 hover:bg-blue-50/50"
                                    }`}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                                {formData.has_photo ? (
                                    <div className="text-center relative z-10">
                                        <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-lg">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Capture Recorded</p>
                                        <p className="text-[9px] text-slate-500 mt-1 font-bold">{formData.file_name}</p>
                                    </div>
                                ) : (
                                    <div className="text-center relative z-10 transition-transform group-hover:scale-105">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Asset Image</p>
                                    </div>
                                )}
                            </div>
                            {errors.photo && <p className="text-[9px] font-bold text-rose-500 mt-2 px-1 uppercase tracking-widest">{errors.photo}</p>}
                        </section>

                        {/* Section 2: Metadata */}
                        <section>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="h-6 w-1 bg-emerald-500 rounded-full" />
                                <h3 className="text-[11px] font-black text-slate-800 tracking-[0.2em] uppercase">Contextual Metadata</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Observed Date *</label>
                                    <input type="date" name="date" value={formData.date} onChange={handleChange} className={`w-full px-5 py-4 bg-slate-50/50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all ${errors.date ? "border-rose-300" : "border-slate-100"}`} />
                                    {errors.date && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 px-1">{errors.date}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Activity Tag *</label>
                                    <select name="activity_tag" value={formData.activity_tag} onChange={handleChange} className={`w-full px-5 py-4 bg-slate-50/50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all ${errors.activity_tag ? "border-rose-300" : "border-slate-100"}`}>
                                        <option value="">Select Activity</option>
                                        {activityTags.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                    {errors.activity_tag && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 px-1">{errors.activity_tag}</p>}
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Location Zone *</label>
                                    <select name="location_tag" value={formData.location_tag} onChange={handleChange} className={`w-full px-5 py-4 bg-slate-50/50 border rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all ${errors.location_tag ? "border-rose-300" : "border-slate-100"}`}>
                                        <option value="">Select Location</option>
                                        {locationTags.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                    {errors.location_tag && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 px-1">{errors.location_tag}</p>}
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Description */}
                        <section>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-6 w-1 bg-amber-500 rounded-full" />
                                <h3 className="text-[11px] font-black text-slate-800 tracking-[0.2em] uppercase">Observation Narrative</h3>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Narrative Insight *</label>
                                <textarea name="description" rows={4} value={formData.description} onChange={handleChange} placeholder="Capture milestones or quality observations..." className={`w-full px-6 py-5 bg-slate-50/50 border rounded-[2rem] text-sm font-bold text-slate-600 leading-relaxed transition-all focus:outline-none focus:ring-4 focus:ring-amber-500/5 ${errors.description ? "border-rose-300" : "border-slate-100"}`} />
                                {errors.description && <p className="text-[9px] font-bold text-rose-500 tracking-widest uppercase mt-1 px-1">{errors.description}</p>}
                            </div>
                        </section>
                    </form>
                </div>

                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex items-center justify-between font-inter">
                    <button
                        type="button"
                        onClick={() => setIsUploadOpen(false)}
                        className="text-xs font-bold text-slate-400 hover:text-slate-800 tracking-widest uppercase transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="photo-form"
                        disabled={isSubmitting}
                        className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95"
                    >
                        {isSubmitting ? (
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        )}
                        Upload Evidence
                    </button>
                </div>
            </Modal>

            {/* PHOTO DETAIL MODAL */}
            <Modal
                isOpen={!!selectedPhoto}
                onClose={() => setSelectedPhoto(null)}
                title="Evidence Intelligence"
                maxWidth="max-w-2xl"
            >
                {selectedPhoto && (
                    <div className="bg-white p-6 italic-none font-inter text-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-50" />

                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Visual Site Artifact</p>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight">{selectedPhoto.location_tag}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                                        <svg className="w-6 h-6 opacity-40" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Evidence ID</p>
                                        <p className="text-xl font-black">#{selectedPhoto.id}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1">Observation Date</p>
                                        <p className="text-xl font-black tabular-nums">{selectedPhoto.date}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Visual Asset ──────────────────────────────────── */}
                        <div className="rounded-[2rem] overflow-hidden border-4 border-slate-50 shadow-inner mb-8 group relative aspect-video">
                            <img
                                src={selectedPhoto.url}
                                alt="Site Asset"
                                className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-105"
                            />
                            <div className="absolute top-4 right-4 px-3 py-1 bg-black/20 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
                                {selectedPhoto.time}
                            </div>
                        </div>

                        {/* ── Diagnostic Floor ──────────────────────────────── */}
                        <div className="space-y-8 mb-10 px-1">
                            {/* Metadata Specifications */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Metadata Specifications</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Asset Tag</p>
                                        <p className="text-sm font-black text-blue-600 uppercase">{selectedPhoto.activity_tag}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Captured By</p>
                                        <p className="text-sm font-black text-slate-800">{selectedPhoto.uploaded_by}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Location Zone</p>
                                        <p className="text-sm font-black text-slate-800">{selectedPhoto.location_tag}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Asset Type</p>
                                        <p className="text-sm font-black text-slate-800 uppercase tabular-nums">High-Res Capture</p>
                                    </div>
                                </div>
                            </div>

                            {/* Observation Narrative */}
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Observation Narrative</p>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 font-inter text-sm text-slate-600 leading-relaxed italic-none">
                                    {selectedPhoto.description || "No additional narrative recorded for this artifact."}
                                </div>
                            </div>

                            {/* Verified Intelligence Footer */}
                            <div>
                                <div className="flex items-center gap-5 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 group">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-emerald-900 mb-0.5 uppercase tracking-wide">Verified Site Evidence</p>
                                        <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-[0.2em]">Validated Architectural Record</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest font-inter"
                            >
                                Dismiss Insight
                            </button>
                            <button
                                className="flex-[1.5] px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 justify-center active:scale-95"
                            >
                                Export Evidence
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setPhotoToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
                title="Delete Site Evidence"
                message="Are you sure you want to delete this photographic record? This will permanently remove the visual artifact and its associated metadata from the system."
                confirmText="Delete"
                type="danger"
            />
        </>
    );
};

export default SitePhotosPage;
