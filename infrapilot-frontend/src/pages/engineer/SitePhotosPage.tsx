import { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
import StatCard from "../../components/common/StatCard";
import Modal from "../../components/common/Modal";
import ConfirmModal from "../../components/common/ConfirmModal";
import UploadPhotoModal from "../../components/forms/UploadPhotoModal";
import toast from "react-hot-toast";
import { 
  Camera, 
  Tag, 
  MapPin, 
  Search, 
  Trash2,
  Activity,
  Filter,
  Image as ImageIcon,
  Upload,
  Eye,
  Calendar
} from "lucide-react";

import { sitePhotoService } from "../../services/sitePhotoService";
import type { SitePhoto } from "../../types/sitePhoto";

// ─── Constants ──────────────────────────────────────────────────────────────
const ACTIVITY_TAGS = [
    "Foundation Work",
    "RCC Column Casting",
    "Slab Pouring",
    "Brickwork / Masonry",
    "Safety Audit",
    "Quality Inspection",
];

const LOCATION_TAGS = [
    "Block A – Ground Floor",
    "Block B – First Floor",
    "Block C – Terrace",
    "Site Office",
    "Material Yard",
    "North Zone",
];

// ─── Demo Data ──────────────────────────────────────────────────────────────
const DEMO_PHOTOS: SitePhoto[] = [
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

const SitePhotosPage = () => {
    const [photos, setPhotos] = useState<SitePhoto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterActivity, setFilterActivity] = useState("All Activities");
    const [filterLocation, setFilterLocation] = useState("All Locations");
    
    // Modal States
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);

    const fetchPhotos = useCallback(async () => {
        setIsLoading(true);
        try {
            let apiData: SitePhoto[] = [];
            try {
                const response = await sitePhotoService.getPhotos();
                apiData = response.items;
            } catch (err) {
                console.warn("API unavailable, using demo data.");
            }

            if (apiData.length === 0) {
                setPhotos(DEMO_PHOTOS);
            } else {
                setPhotos(apiData);
            }
        } catch (error) {
            toast.error("Failed to sync evidence logs");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    const handleUpload = async (formData: FormData) => {
        try {
            await sitePhotoService.uploadPhoto(formData);
            toast.success("Evidence uploaded successfully!");
            fetchPhotos();
        } catch (error) {
            toast.error("Failed to upload photo");
            throw error;
        }
    };

    const handleDeleteConfirm = async () => {
        if (!photoToDelete) return;
        try {
            await sitePhotoService.deletePhoto(photoToDelete);
            toast.success("Evidence record removed");
            setIsDeleteModalOpen(false);
            fetchPhotos();
        } catch (error) {
            toast.error("Failed to remove evidence");
        }
    };

    const filteredPhotos = useMemo(() => {
        return photos.filter(p => {
            const matchesSearch = p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(p.id).includes(searchQuery);
            const matchesActivity = filterActivity === "All Activities" || p.activity_tag === filterActivity;
            const matchesLocation = filterLocation === "All Locations" || p.location_tag === filterLocation;
            return matchesSearch && matchesActivity && matchesLocation;
        });
    }, [photos, searchQuery, filterActivity, filterLocation]);

    const stats = {
        total: photos.length,
        thisWeek: 12, // Dummy stat for UX
        activities: ACTIVITY_TAGS.length,
        locations: LOCATION_TAGS.length,
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";

    return (
        <>
            <Navbar title="Site Evidence" breadcrumb={["Engineer", "Site Photos", "Gallery"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Photographic Documentation</h1>
                        <p className="text-slate-500 text-sm italic-none">Maintain a visual ledger of progress milestones and site constraints.</p>
                    </div>
                    <button
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Upload className="w-4 h-4" />
                        Log Site Photo
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Evidence"
                        value={stats.total.toString()}
                        sub="Verified Uploads"
                        accent="text-slate-800"
                        icon={<ImageIcon className="w-5 h-5" />}
                    />
                    <StatCard
                        title="New Logs"
                        value={stats.thisWeek.toString()}
                        sub="Captured This Week"
                        accent="text-emerald-500"
                        icon={<Activity className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Tagged Tasks"
                        value={stats.activities.toString()}
                        sub="Unique Activities"
                        accent="text-amber-500"
                        icon={<Tag className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Zonal Tags"
                        value={stats.locations.toString()}
                        sub="Location Points"
                        accent="text-indigo-500"
                        icon={<MapPin className="w-5 h-5" />}
                    />
                </div>

                {/* ── Filter Bar & Evidence Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12">
                    {/* Integrated Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30">
                        <div className="relative flex-1 max-w-md">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by description or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                <Filter className="w-3.5 h-3.5 text-slate-400" />
                                <select 
                                    value={filterActivity} 
                                    onChange={(e) => setFilterActivity(e.target.value)} 
                                    className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer pr-2"
                                >
                                    <option>All Activities</option>
                                    {ACTIVITY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <select 
                                    value={filterLocation} 
                                    onChange={(e) => setFilterLocation(e.target.value)} 
                                    className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer pr-2"
                                >
                                    <option>All Locations</option>
                                    {LOCATION_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Unified Photo Grid Container */}
                    <div className="p-8">
                        {isLoading ? (
                            <div className="py-32 text-center text-slate-400">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Syncing photographic vault...</p>
                            </div>
                        ) : filteredPhotos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                {filteredPhotos.map(photo => (
                                    <div
                                        key={photo.id}
                                        className="group bg-white rounded-3xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-500 flex flex-col"
                                    >
                                        <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                                            <img
                                                src={photo.url}
                                                alt={photo.activity_tag}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                                            />
                                            {/* Tag Overlays as per design */}
                                            <div className="absolute top-4 left-4 z-10">
                                                <span className="px-3 py-1 bg-white/90 backdrop-blur-sm text-[9px] font-black text-slate-800 rounded-lg uppercase tracking-widest shadow-sm border border-white/20">
                                                    {photo.activity_tag}
                                                </span>
                                            </div>
                                            
                                            {/* Action Buttons */}
                                            <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedPhoto(photo)}
                                                    className="p-3 bg-primary text-white rounded-2xl hover:scale-110 transition-transform shadow-lg shadow-primary/20"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => { setPhotoToDelete(photo.id); setIsDeleteModalOpen(true); }}
                                                    className="p-3 bg-white text-rose-500 rounded-2xl hover:scale-110 transition-transform shadow-lg"
                                                    title="Remove Evidence"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex items-center justify-between mb-3 font-inter">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IMG-{photo.id}</span>
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg">SITE CAPTURE</span>
                                            </div>
                                            
                                            <p className="text-[14px] font-medium text-slate-600 leading-relaxed line-clamp-3 mb-6 flex-1 italic-none">
                                                {photo.description}
                                            </p>

                                            <div className="flex items-center gap-3 pt-5 border-t border-slate-50 mt-auto font-inter">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-black text-primary border-2 border-white shadow-sm shrink-0">
                                                    {photo.uploaded_by.split(" ").map(n => n[0]).join("")}
                                                </div>
                                                <div className="overflow-hidden">
                                                    <p className="text-xs font-black text-slate-800 truncate">{photo.uploaded_by}</p>
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Calendar className="w-3 h-3 shrink-0" />
                                                        <p className="text-[9px] font-bold uppercase tracking-widest truncate">{photo.time}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-32 text-center text-slate-400 italic-none">
                                <Camera className="w-16 h-16 mx-auto mb-6 opacity-10" />
                                <p className="text-sm font-black uppercase tracking-widest opacity-50">No evidence found matching your filters</p>
                            </div>
                        )}
                    </div>
                </div>
            </PageTransition>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedPhoto}
                onClose={() => setSelectedPhoto(null)}
                title="Evidence Intelligence"
                maxWidth="max-w-xl"
            >
                {selectedPhoto && (
                    <div className="p-6 font-inter">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden">
                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2">Visual Artifact Documentation</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6">{selectedPhoto.location_tag}</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Evidence ID</p>
                                        <p className="text-lg font-black text-blue-400">#{selectedPhoto.id}</p>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Captured Date</p>
                                        <p className="text-lg font-black">{selectedPhoto.date}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-[2.5rem] overflow-hidden border-8 border-slate-50 shadow-2xl mb-8 aspect-video group relative">
                            <img src={selectedPhoto.url} alt="Site Asset" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-[2.5rem]" />
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div>
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-3')}>Observation Narrative</p>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm text-slate-600 leading-relaxed italic-none">
                                    "{selectedPhoto.description}"
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Project Task</p>
                                    <p className="text-sm font-black text-blue-600 uppercase tracking-tight">{selectedPhoto.activity_tag}</p>
                                </div>
                                <div>
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1')}>Reporting Engineer</p>
                                    <p className="text-sm font-black text-slate-800">{selectedPhoto.uploaded_by}</p>
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={() => setSelectedPhoto(null)}
                            className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-95"
                        >
                            Dismiss Analysis
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Form Modal ────────────────────────────────── */}
            <UploadPhotoModal 
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSubmit={handleUpload}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Remove Evidence Record"
                message="Are you sure you want to delete this photographic artifact? This action will permanently remove the record from the project vault."
                confirmText="Delete Artifact"
                type="danger"
            />
        </>
    );
};

export default SitePhotosPage;
