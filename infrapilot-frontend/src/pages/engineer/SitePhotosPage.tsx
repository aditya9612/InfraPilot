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
    MapPin,
    Search,
    Trash2,
    Filter,
    Upload,
    Eye,
    Calendar,
    RotateCcw
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
    const [projectId, setProjectId] = useState<number | null>(null);

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Recent" | "Tasks" | "Zones">("All");

    // Modal States
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<number | null>(null);

    // Resolve Project ID from session
    useEffect(() => {
        const userStr = localStorage.getItem("infrapilot_user");
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const pId = user?.project_id || user?.user?.project_id;
                if (pId) {
                    setProjectId(Number(pId));
                } else {
                    setProjectId(36);
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(36);
            }
        }
    }, []);

    const fetchPhotos = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            let apiData: SitePhoto[] = [];
            try {
                const response = await sitePhotoService.getPhotos({ project_id: projectId || 0 });
                apiData = response.items || [];
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
    }, [projectId]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    const handleUpload = async (formData: FormData) => {
        try {
            const newPhoto = await sitePhotoService.uploadPhoto(formData);
            toast.success("Evidence uploaded successfully!");
            setPhotos(prev => [newPhoto, ...prev]);
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
        let data = photos;

        // Apply StatCard Filter
        if (activeStatFilter === "Recent") {
          // Filter photos from last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          data = data.filter(p => new Date(p.date) >= sevenDaysAgo);
        }

        return data.filter(p => {
            const matchesSearch = p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(p.id).includes(searchQuery);
            const matchesActivity = filterActivity === "All Activities" || p.activity_tag === filterActivity;
            const matchesLocation = filterLocation === "All Locations" || p.location_tag === filterLocation;
            return matchesSearch && matchesActivity && matchesLocation;
        });
    }, [photos, searchQuery, filterActivity, filterLocation, activeStatFilter]);

    const stats = {
        total: photos.length,
        thisWeek: photos.filter(p => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return new Date(p.date) >= sevenDaysAgo;
        }).length,
        activities: new Set(photos.map(p => p.activity_tag)).size,
        locations: new Set(photos.map(p => p.location_tag)).size,
    };

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";

    return (
        <>
            <Navbar title="Site Evidence" breadcrumb={["Engineer", "Site Photos", "Gallery"]} />

            <PageTransition className="p-6 bg-slate-50 h-[calc(100vh-64px)] overflow-hidden font-inter flex flex-col">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
                    <div className="font-inter">
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Evidence Documentation Ledger</h1>
                        <p className="text-slate-500 text-sm font-inter">
                            Maintain a chronological visual archive of project progress milestones.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter"
                    >
                        <Upload className="w-4 h-4" />
                        Log Site Photo
                    </button>
                </div>

                {/* ── Interactive Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
                    <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Total Evidence"
                          value={stats.total.toString()}
                          sub="Project Archive"
                          accent="text-slate-800" />
                    </div>
                    <div onClick={() => setActiveStatFilter("Recent")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Recent" ? "ring-2 ring-emerald-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
                      <StatCard
                          title="Recent Logs"
                          value={stats.thisWeek.toString()}
                          sub="Past 7 Days"
                          accent="text-emerald-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("All")} className="cursor-pointer group transition-all rounded-xl hover:scale-[1.01]">
                      <StatCard
                          title="Scoped Tasks"
                          value={stats.activities.toString()}
                          sub="Tracked Milestones"
                          accent="text-amber-500" />
                    </div>
                    <div onClick={() => setActiveStatFilter("All")} className="cursor-pointer group transition-all rounded-xl hover:scale-[1.01]">
                      <StatCard
                          title="Zonal Units"
                          value={stats.locations.toString()}
                          sub="Capture Points"
                          accent="text-indigo-500" />
                    </div>
                </div>

                {/* ── Evidence Vault Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter flex-1 flex flex-col min-h-0">
                    {/* Integrated Filter Bar */}
                    <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search by description or audit ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 font-inter">
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm font-inter">
                                <Filter className="w-4 h-4 text-slate-400" />
                                <select
                                    value={filterActivity}
                                    onChange={(e) => setFilterActivity(e.target.value)}
                                    className="bg-transparent text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer pr-2 font-inter"
                                >
                                    <option>All Activities</option>
                                    {ACTIVITY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm font-inter">
                                <MapPin className="w-4 h-4 text-slate-400" />
                                <select
                                    value={filterLocation}
                                    onChange={(e) => setFilterLocation(e.target.value)}
                                    className="bg-transparent text-xs font-bold uppercase tracking-widest text-slate-600 outline-none cursor-pointer pr-2 font-inter"
                                >
                                    <option>All Locations</option>
                                    {LOCATION_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            {activeStatFilter !== "All" && (
                              <button onClick={() => setActiveStatFilter("All")} className="p-2 text-slate-400 hover:text-rose-500 transition-colors font-inter">
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}
                        </div>
                    </div>

                    {/* Unified Photo Grid Container */}
                    <div className="flex-1 overflow-auto p-8 font-inter scrollbar-thin scrollbar-thumb-slate-200">
                        {isLoading ? (
                            <div className="py-32 text-center font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 font-inter" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing evidence vault...</p>
                            </div>
                        ) : filteredPhotos.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 font-inter">
                                {filteredPhotos.map(photo => (
                                    <div
                                        key={photo.id}
                                        className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 flex flex-col font-inter"
                                    >
                                        <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 font-inter">
                                            <img
                                                src={photo.url}
                                                alt={photo.activity_tag}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 font-inter"
                                            />
                                            {/* Design System Overlays */}
                                            <div className="absolute top-4 left-4 z-10 font-inter">
                                                <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[10px] font-bold text-slate-800 rounded-lg uppercase tracking-widest shadow-sm border border-white/20 font-inter">
                                                    {photo.activity_tag}
                                                </span>
                                            </div>

                                            {/* Interactive Actions */}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-3 z-20 font-inter">
                                                <button
                                                    onClick={() => setSelectedPhoto(photo)}
                                                    className="p-4 bg-primary text-white rounded-2xl scale-90 group-hover:scale-100 transition-all duration-500 shadow-xl shadow-primary/30"
                                                    title="Analyze Record"
                                                >
                                                    <Eye className="w-6 h-6" />
                                                </button>
                                                <button
                                                    onClick={() => { setPhotoToDelete(photo.id); setIsDeleteModalOpen(true); }}
                                                    className="p-4 bg-white text-rose-500 rounded-2xl scale-90 group-hover:scale-100 transition-all duration-500 shadow-xl"
                                                    title="Discard Evidence"
                                                >
                                                    <Trash2 className="w-6 h-6" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-6 flex flex-col flex-1 font-inter">
                                            <div className="flex items-center justify-between mb-4 font-inter">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-inter">AUDIT-#{photo.id}</span>
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 font-inter">Live Progress</span>
                                            </div>

                                            <p className="text-[13px] font-bold text-slate-600 leading-relaxed line-clamp-3 mb-6 flex-1 font-inter uppercase tracking-tight">
                                                {photo.description}
                                            </p>

                                            <div className="flex items-center gap-3 pt-5 border-t border-slate-50 mt-auto font-inter">
                                                <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center text-[11px] font-bold border-2 border-white shadow-lg shrink-0 font-inter">
                                                    {photo.uploaded_by.split(" ").map(n => n[0]).join("")}
                                                </div>
                                                <div className="overflow-hidden font-inter">
                                                    <p className="text-xs font-bold text-slate-800 truncate uppercase tracking-widest font-inter">{photo.uploaded_by}</p>
                                                    <div className="flex items-center gap-1.5 text-slate-400 font-inter">
                                                        <Calendar className="w-3 h-3 shrink-0" />
                                                        <p className="text-[10px] font-bold uppercase tracking-widest truncate font-inter">{photo.time} • {photo.date}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-32 text-center font-inter">
                                <Camera className="w-16 h-16 mx-auto mb-6 opacity-10 text-slate-800" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-50 font-inter">No evidence artifacts discovered in the project vault.</p>
                            </div>
                        )}
                    </div>
                </div>
            </PageTransition>

            <Modal
                isOpen={!!selectedPhoto}
                onClose={() => setSelectedPhoto(null)}
                title="Evidence Intelligence Analysis"
                maxWidth="max-w-xl"
            >
                {selectedPhoto && (
                    <div className="p-6 font-inter">
                        <div className="bg-slate-900 rounded-2xl p-10 mb-8 text-white shadow-2xl relative overflow-hidden font-inter">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-3 font-inter">Intelligence Artifact Record</p>
                                <h3 className="text-2xl font-bold tracking-tight leading-tight mb-8 font-inter">{selectedPhoto.location_tag}</h3>
                                <div className="grid grid-cols-2 gap-6 font-inter">
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 font-inter">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5 font-inter">Reference Code</p>
                                        <p className="text-xl font-bold text-blue-400 font-inter">#LOG-{selectedPhoto.id}</p>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 font-inter">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5 font-inter">Capture Sequence</p>
                                        <p className="text-xl font-bold font-inter">{selectedPhoto.date}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl overflow-hidden border-8 border-slate-50 shadow-2xl mb-8 aspect-video group relative font-inter">
                            <img src={selectedPhoto.url} alt="Site Artifact" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 font-inter" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl" />
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div className="font-inter">
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-3')}>Observation Intelligence</p>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-[13px] font-bold text-slate-600 leading-relaxed font-inter uppercase tracking-tight shadow-inner">
                                    "{selectedPhoto.description}"
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 font-inter">
                                <div className="font-inter">
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1.5')}>Milestone Domain</p>
                                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest font-inter">{selectedPhoto.activity_tag}</p>
                                </div>
                                <div className="font-inter">
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1.5')}>Responsible Engineer</p>
                                    <p className="text-sm font-bold text-slate-800 uppercase tracking-widest font-inter">{selectedPhoto.uploaded_by}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="w-full py-5 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl shadow-primary/30 active:scale-95 font-inter mb-2"
                        >
                            Dismiss Artifact Analysis
                        </button>
                    </div>
                )}
            </Modal>

            {/* ── Evidence Upload Modal ────────────────────────────────── */}
            <UploadPhotoModal
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onSubmit={handleUpload}
                projectId={projectId}
            />

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDeleteConfirm}
                title="Discard Evidence Artifact"
                message="Are you sure you want to discard this photographic artifact from the project vault? This operation is irreversible."
                confirmText="Archive Artifact"
                type="danger"
            />
        </>
    );
};

export default SitePhotosPage;
