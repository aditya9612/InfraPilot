import React, { useState, useRef } from "react";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface SitePhoto {
    id: number;
    url: string;
    date: string;
    time: string;
    activityTag: string;
    locationTag: string;
    description: string;
    uploadedBy: string;
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
        activityTag: "Foundation Work",
        locationTag: "Block A – Ground Floor",
        description: "Base slab reinforcement work completed for Block A. Concrete grade M25. Quality approved by QC lead.",
        uploadedBy: "Karan Singh",
    },
    {
        id: 102,
        url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
        date: "2026-04-12",
        time: "03:45 PM",
        activityTag: "RCC Column Casting",
        locationTag: "Block B – First Floor",
        description: "Column C24 shuttering inspection completed. All alignments verified by site engineer.",
        uploadedBy: "Karan Singh",
    },
    {
        id: 103,
        url: "https://images.unsplash.com/photo-1590725140246-20acdee442be?auto=format&fit=crop&w=800&q=80",
        date: "2026-04-11",
        time: "08:00 AM",
        activityTag: "Safety Audit",
        locationTag: "North Zone",
        description: "Morning safety walk completed. All PPE compliance confirmed. No violations found during audit.",
        uploadedBy: "Karan Singh",
    },
];

// ─── Profile Field Helper ────────────────────────────────────────────────────────

const ProfileField = ({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent?: string;
}) => (
    <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] block mb-1">
            {label}
        </span>
        <p className={`text-sm font-bold text-slate-800 leading-snug ${accent ?? ""}`}>
            {value || "—"}
        </p>
    </div>
);

// ─── Initial Form State ─────────────────────────────────────────────────────────

const initialForm = {
    date: new Date().toISOString().split("T")[0],
    activityTag: "",
    locationTag: "",
    description: "",
    hasPhoto: false,
    fileName: "",
};

// ─── Main Component ─────────────────────────────────────────────────────────────

const SitePhotosPage = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);
    const [photos, setPhotos] = useState<SitePhoto[]>(mockPhotos);
    const [filterTag, setFilterTag] = useState("All");

    const [formData, setFormData] = useState(initialForm);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            setFormData(prev => ({ ...prev, hasPhoto: true, fileName: e.target.files![0].name }));
            if (errors.photo) setErrors(prev => { const u = { ...prev }; delete u.photo; return u; });
        }
    };

    const validate = () => {
        const errs: Record<string, string> = {};
        if (!formData.date) errs.date = "Date is required";
        if (!formData.activityTag) errs.activityTag = "Activity Tag is required";
        if (!formData.locationTag) errs.locationTag = "Location Tag is required";
        if (!formData.description.trim()) errs.description = "Description is required";
        if (!formData.hasPhoto) errs.photo = "Please upload a photo";
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
                activityTag: formData.activityTag,
                locationTag: formData.locationTag,
                description: formData.description,
                uploadedBy: "Karan Singh",
            };
            setPhotos(prev => [newPhoto, ...prev]);
            toast.success("Photo uploaded successfully!", { id: "photo-upload" });
            setIsSubmitting(false);
            setIsUploadOpen(false);
            setFormData(initialForm);
            setErrors({});
        }, 1500);
    };

    // ── Filter ────────────────────────────────────────────────────────────
    const filterTabs = ["All", ...activityTags.slice(0, 5)];
    const filtered = filterTag === "All" ? photos : photos.filter(p => p.activityTag === filterTag);

    return (
        <>
            <Navbar
                title="Site Photos"
                breadcrumb={["InfraPilot", "Engineer", "Site Photos"]}
            />

            <PageTransition className="p-8 bg-slate-50 min-h-screen font-inter">

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1">
                            Site Engineer
                        </p>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">
                            Site Photos
                        </h1>
                        <p className="text-slate-500 text-sm font-medium">
                            Upload, tag, and manage site photographs with activity and location metadata.
                        </p>
                    </div>
                    <button
                        onClick={() => { setFormData(initialForm); setErrors({}); setIsUploadOpen(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-2xl shadow-md shadow-blue-200 transition-all"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

                {/* ── Filter Tabs ──────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">
                        Photo Gallery
                    </h2>
                    <div className="flex flex-wrap gap-2">
                        {filterTabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilterTag(tab)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${filterTag === tab
                                        ? "bg-slate-800 text-white shadow-sm"
                                        : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300"
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Photo List ───────────────────────────────────────────── */}
                <div className="grid grid-cols-1 gap-5">
                    {filtered.map(photo => (
                        <div
                            key={photo.id}
                            className="relative bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all flex flex-col md:flex-row gap-6 items-start md:items-center group cursor-pointer"
                            onClick={() => setSelectedPhoto(photo)}
                        >
                            {/* Accent bar */}
                            <div className="absolute left-0 top-4 bottom-4 w-1 bg-blue-600 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity" />

                            {/* Thumbnail */}
                            <div className="w-24 h-24 rounded-2xl overflow-hidden border border-slate-100 shadow-sm shrink-0">
                                <img
                                    src={photo.url}
                                    alt={photo.activityTag}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                {/* Top row */}
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-lg font-black text-slate-800">IMG-{photo.id}</span>
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg uppercase tracking-widest">
                                        {photo.activityTag}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400 ml-auto uppercase tracking-widest shrink-0">
                                        {photo.date} · {photo.time}
                                    </span>
                                </div>

                                {/* Details grid */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3 border-y border-slate-50">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Date</p>
                                        <p className="text-xs font-bold text-slate-700">{photo.date}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Activity Tag</p>
                                        <p className="text-xs font-bold text-slate-700">{photo.activityTag}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Location Tag</p>
                                        <p className="text-xs font-bold text-slate-700">{photo.locationTag}</p>
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Action</p>
                                        <button
                                            title="View Photo"
                                            onClick={e => { e.stopPropagation(); setSelectedPhoto(photo); }}
                                            className="p-1.5 w-fit text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-slate-500 font-medium mt-3 line-clamp-1">
                                    {photo.description}
                                </p>
                            </div>
                        </div>
                    ))}

                    {filtered.length === 0 && (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100 shadow-sm">
                            <p className="text-slate-400 text-sm font-medium">No photos found for this tag.</p>
                        </div>
                    )}
                </div>

            </PageTransition>

            {/* ═══════════════════════════════════════════════════════════════
                UPLOAD PHOTO MODAL
            ═══════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                title="Upload Site Photo"
                maxWidth="max-w-2xl"
            >
                <div className="px-8 pt-6 pb-8 bg-white">
                    <form id="photo-form" onSubmit={handleSubmit} className="space-y-6">

                        {/* ─ 1. Upload Photo ─────────────────────────────── */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-blue-600 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Upload Photo</h3>
                            </div>
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className={`w-full h-40 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${formData.hasPhoto
                                        ? "bg-emerald-50 border-emerald-300"
                                        : errors.photo
                                            ? "bg-rose-50 border-rose-300"
                                            : "bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50"
                                    }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                {formData.hasPhoto ? (
                                    <div className="text-center">
                                        <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white">
                                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-bold text-emerald-700">Photo Selected</p>
                                        <p className="text-[10px] text-emerald-600 mt-0.5 font-medium">{formData.fileName}</p>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                                            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-xs font-bold text-slate-500">Click to Upload Photo <span className="text-rose-500">*</span></p>
                                        <p className="text-[10px] text-slate-400 mt-0.5">PNG, JPG, WEBP supported</p>
                                    </div>
                                )}
                            </div>
                            {errors.photo && <p className="text-[10px] font-bold text-rose-500 mt-1.5">{errors.photo}</p>}
                        </div>

                        {/* ─ 2. Date ─────────────────────────────────────── */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-emerald-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Photo Date</h3>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${errors.date ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
                                {errors.date && <p className="text-[10px] font-bold text-rose-500">{errors.date}</p>}
                            </div>
                        </div>

                        {/* ─ 3 & 4. Activity Tag + Location Tag ─────────── */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-amber-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Tags</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Activity Tag <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="activityTag"
                                        value={formData.activityTag}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer ${errors.activityTag ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    >
                                        <option value="">Select activity…</option>
                                        {activityTags.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                    {errors.activityTag && <p className="text-[10px] font-bold text-rose-500">{errors.activityTag}</p>}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Location Tag <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="locationTag"
                                        value={formData.locationTag}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none cursor-pointer ${errors.locationTag ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    >
                                        <option value="">Select location…</option>
                                        {locationTags.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                    {errors.locationTag && <p className="text-[10px] font-bold text-rose-500">{errors.locationTag}</p>}
                                </div>
                            </div>
                        </div>

                        {/* ─ 5. Description ──────────────────────────────── */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-1 h-5 bg-violet-500 rounded-full" />
                                <h3 className="text-sm font-black text-slate-800 tracking-wide">Description</h3>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Description <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Describe what is shown in this photo — activity, observations, quality notes…"
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${errors.description ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                />
                                {errors.description && <p className="text-[10px] font-bold text-rose-500">{errors.description}</p>}
                            </div>
                        </div>

                    </form>

                    {/* Footer */}
                    <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => setIsUploadOpen(false)}
                            className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            form="photo-form"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-200 transition-all"
                        >
                            {isSubmitting ? (
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                            )}
                            Upload Photo
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ═══════════════════════════════════════════════════════════════
                PHOTO DETAIL MODAL  (matches DSR / User Profile style)
            ═══════════════════════════════════════════════════════════════ */}
            <Modal
                isOpen={!!selectedPhoto}
                onClose={() => setSelectedPhoto(null)}
                title="Photo Details"
                maxWidth="max-w-2xl"
            >
                {selectedPhoto && (
                    <div className="bg-white">

                        {/* Blue Banner */}
                        <div className="bg-gradient-to-br from-blue-500 to-blue-700 mx-6 mt-6 rounded-2xl p-6 flex items-center gap-5">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/30 shrink-0">
                                <img
                                    src={selectedPhoto.url}
                                    alt="Site"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1.5">
                                    <h2 className="text-xl font-black text-white tracking-tight leading-none">
                                        IMG-{selectedPhoto.id}
                                    </h2>
                                    <span className="px-3 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full border border-white/30 uppercase tracking-wider">
                                        {selectedPhoto.activityTag}
                                    </span>
                                </div>
                                <p className="text-blue-100 text-sm font-semibold mb-0.5">
                                    {selectedPhoto.locationTag}
                                </p>
                                <p className="text-blue-200 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    {selectedPhoto.date} · {selectedPhoto.time}
                                </p>
                            </div>
                        </div>

                        {/* Photo preview */}
                        <div className="mx-6 mt-4 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
                            <img
                                src={selectedPhoto.url}
                                alt="Site"
                                className="w-full h-52 object-cover"
                            />
                        </div>

                        {/* Body */}
                        <div className="px-8 py-6 space-y-7">

                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                                        Photo Tags & Date
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                                    <ProfileField label="Date" value={selectedPhoto.date} />
                                    <ProfileField label="Time" value={selectedPhoto.time} />
                                    <ProfileField label="Activity Tag" value={selectedPhoto.activityTag} accent="text-blue-600" />
                                    <ProfileField label="Location Tag" value={selectedPhoto.locationTag} />
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                                        Description
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                                    {selectedPhoto.description}
                                </p>
                            </div>

                            <hr className="border-slate-100" />

                            <div>
                                <div className="flex items-center gap-2.5 mb-4">
                                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]">
                                        Uploaded By
                                    </span>
                                </div>
                                <ProfileField label="Engineer" value={selectedPhoto.uploadedBy} />
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="px-8 pb-7 flex justify-end">
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="px-7 py-3 bg-slate-900 hover:bg-black text-white text-sm font-bold rounded-xl transition-all tracking-wide"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default SitePhotosPage;
