import { useState, useMemo, useEffect, useCallback } from "react";
import PageTransition from "../../components/common/PageTransition";
import Navbar from "../../components/common/Navbar";
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
    Calendar,
    RotateCcw,
    LayoutGrid,
    List as ListIcon,
    ChevronLeft,
    ChevronRight,
    Eye,
    Clock,
    ChevronDown
} from "lucide-react";

import { sitePhotoService } from "../../services/sitePhotoService";
import { projectService } from "../../services/projectService";
import type { SitePhoto } from "../../types/sitePhoto";

// â”€â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const ACTIVITY_TAGS = [
    "Foundation Work",
    "RCC Column Casting",
    "Slab Pouring",
    "Brickwork / Masonry",
    "Safety Audit",
    "Quality Inspection",
];

export const LOCATION_TAGS = [
    "Block A – Ground Floor",
    "Block B – First Floor",
    "Block C – Terrace",
    "Site Office",
    "Material Yard",
    "North Zone",
];



const SitePhotosPage = () => {
    const [photos, setPhotos] = useState<SitePhoto[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterActivity, setFilterActivity] = useState("All Activities");
    const [filterLocation, setFilterLocation] = useState("All Locations");
    const [projectId, setProjectId] = useState<number | null>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(12); // Grid friendly number

    // Interactive StatCard Filter
    const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Recent" | "Tasks" | "Zones">("All");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

    // Modal States
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<SitePhoto | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [photoToDelete, setPhotoToDelete] = useState<number | string | null>(null);

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
                    setProjectId(92);
                }
            } catch (e) {
                console.error("Failed to resolve project ID", e);
                setProjectId(92);
            }
        }
    }, []);

    const fetchPhotos = useCallback(async () => {
        if (!projectId) return;
        setIsLoading(true);
        try {
            const [response, projRes] = await Promise.all([
                sitePhotoService.getPhotos({ project_id: projectId }),
                projectService.getProjects(100, 0).catch(() => [])
            ]);
            setPhotos(response.items || []);
            const projList = Array.isArray(projRes) ? projRes : (projRes?.items || projRes?.data || []);
            setProjects(projList);
        } catch (error) {
            console.error("Failed to fetch photos:", error);
            toast.error("Failed to sync evidence logs");
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    // Reset pagination on filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterActivity, filterLocation, activeStatFilter]);

    const handleUpload = async (formData: FormData) => {
        try {
            const newPhoto = await sitePhotoService.uploadPhoto(formData);
            toast.success("Evidence uploaded successfully!");
            // Instantly update UI with the new record
            setPhotos(prev => [newPhoto, ...prev]);
            setIsUploadOpen(false);
        } catch (error) {
            console.error("Upload Error:", error);
            toast.error("Failed to upload photo");
        }
    };

    const handleDeleteConfirm = async () => {
        if (!photoToDelete) return;
        const toastId = toast.loading("Archiving evidence artifact...");
        try {
            await sitePhotoService.deletePhoto(Number(photoToDelete));
            toast.success("Evidence record removed", { id: toastId });

            // Optimistic update
            setPhotos(prev => prev.filter(p => p.id !== photoToDelete));

            // Explicit refetch to ensure server sync
            fetchPhotos();

            setIsDeleteModalOpen(false);
            setPhotoToDelete(null);
        } catch (error) {
            toast.error("Failed to remove evidence", { id: toastId });
        }
    };

    const baseFilteredPhotos = useMemo(() => {
        return photos.filter(p => {
            const desc = p.description || "";
            const actTag = p.activity_tag || "";
            const locTag = p.location_tag || "";

            const matchesSearch = desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                String(p.id).includes(searchQuery);
            const matchesActivity = filterActivity === "All Activities" || actTag === filterActivity;
            const matchesLocation = filterLocation === "All Locations" || locTag === filterLocation;
            return matchesSearch && matchesActivity && matchesLocation;
        });
    }, [photos, searchQuery, filterActivity, filterLocation]);

    const filteredPhotos = useMemo(() => {
        let data = [...baseFilteredPhotos];

        // Apply StatCard Filter
        if (activeStatFilter === "Recent") {
            // Filter photos from last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            data = data.filter(p => new Date(p.date) >= sevenDaysAgo);
        } else if (activeStatFilter === "Tasks") {
            // Only show photos with valid activity tags (not empty)
            data = data.filter(p => !!p.activity_tag);
        } else if (activeStatFilter === "Zones") {
            // Only show photos with valid location tags (not empty)
            data = data.filter(p => !!p.location_tag);
        }

        // Apply Sort Order
        data.sort((a, b) => {
            if (sortOrder === "latest") {
                return Number(b.id) - Number(a.id);
            } else {
                return Number(a.id) - Number(b.id);
            }
        });

        return data;
    }, [baseFilteredPhotos, activeStatFilter, sortOrder]);

    const paginatedPhotos = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredPhotos.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredPhotos, currentPage, itemsPerPage]);


    const stats = useMemo(() => {
        return {
            total: baseFilteredPhotos.length,
            thisWeek: baseFilteredPhotos.filter(p => {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return new Date(p.date) >= sevenDaysAgo;
            }).length,
            activities: baseFilteredPhotos.filter(p => !!p.activity_tag).length,
            locations: baseFilteredPhotos.filter(p => !!p.location_tag).length,
        };
    }, [baseFilteredPhotos]);

    const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";

    return (
        <>
            <Navbar title="Site Evidence" breadcrumb={["Engineer", "Site Photos", "Gallery"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            Evidence Documentation Ledger
                        </h1>
                        <p className="text-slate-500 text-sm">
                            Maintain a chronological visual archive of project progress milestones.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setIsUploadOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all"
                        >
                            <Upload className="w-4 h-4" />
                            Log Site Photo
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
                    {[
                        {
                            title: "Total Evidence",
                            value: stats.total.toString(),
                            sub: "Project Archive",
                            accent: "text-slate-800",
                            status: "All",
                        },
                        {
                            title: "Recent Logs",
                            value: stats.thisWeek.toString(),
                            sub: "Past 7 Days",
                            accent: "text-emerald-500",
                            status: "Recent",
                        },
                    ].map((s) => (
                        <div
                            key={s.title}
                            onClick={() => s.status && setActiveStatFilter(s.status as any)}
                            className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all ${s.status ? 'hover:shadow-md cursor-pointer active:scale-95 hover:border-primary/20' : 'cursor-default'} group`}
                        >
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 group-hover:text-primary transition-colors">
                                {s.title}
                            </p>
                            <p className={`text-2xl font-bold ${s.accent}`}>{s.value}</p>
                            {s.sub && (
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                                    {s.sub}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* â”€â”€ Evidence Vault Container â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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

                            <div className="relative flex items-center">
                                <div className="absolute left-3 text-slate-400 pointer-events-none">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <select
                                    value={sortOrder}
                                    onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                                    className="appearance-none bg-white border border-primary rounded-full text-sm font-bold text-primary shadow-sm pl-9 pr-8 py-1.5 outline-none cursor-pointer"
                                >
                                    <option value="latest">Latest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                                <div className="absolute right-3 text-slate-400 pointer-events-none">
                                    <ChevronDown className="w-4 h-4" />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200 ml-auto font-inter">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                title="Grid View"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={`p-1.5 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                                title="List View"
                            >
                                <ListIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Unified Photo Grid Container */}
                    <div className="flex-1 overflow-auto p-4 md:p-8 font-inter scrollbar-thin scrollbar-thumb-slate-200">
                        {isLoading ? (
                            <div className="py-32 text-center font-inter">
                                <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4 font-inter" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing evidence vault...</p>
                            </div>
                        ) : filteredPhotos.length > 0 ? (
                            viewMode === "grid" ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 font-inter">
                                    {paginatedPhotos.map(photo => (
                                        <div
                                            key={photo.id}
                                            className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-2 transition-all duration-500 flex flex-col font-inter"
                                        >
                                            <div className="aspect-[4/3] relative overflow-hidden bg-slate-100 font-inter">
                                                <img
                                                    src={sitePhotoService.resolveUrl(photo.url || null) || ""}
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
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center gap-2 z-20 font-inter">
                                                    <button
                                                        onClick={() => setSelectedPhoto(photo)}
                                                        className="p-2 bg-white text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                        title="View Evidence"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => { setPhotoToDelete(photo.id); setIsDeleteModalOpen(true); }}
                                                        className="p-2 bg-white text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                        title="Discard Evidence"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
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
                                                        {(photo.uploaded_by || "Infra Pilot").split(" ").map(n => n[0]).join("")}
                                                    </div>
                                                    <div className="overflow-hidden font-inter">
                                                        <p className="text-xs font-bold text-slate-800 truncate uppercase tracking-widest font-inter">{photo.uploaded_by}</p>
                                                        <div className="flex items-center gap-1.5 text-slate-400 font-inter">
                                                            <Calendar className="w-3 h-3 shrink-0" />
                                                            <p className="text-[10px] font-bold uppercase tracking-widest truncate font-inter">{photo.time} â€¢ {photo.date}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden font-inter">
                                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                                        <table className="w-full text-left font-inter min-w-[1000px]">
                                            <thead>
                                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                                    <th className="px-6 py-4 font-inter">Evidence</th>
                                                    <th className="px-6 py-4 font-inter">Project</th>
                                                    <th className="px-6 py-4 font-inter">Audit Details</th>
                                                    <th className="px-6 py-4 font-inter">Category & Domain</th>
                                                    <th className="px-6 py-4 font-inter">Technical Auditor</th>
                                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 font-inter">
                                                {paginatedPhotos.map(photo => (
                                                    <tr key={photo.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                                        <td className="px-6 py-4 font-inter">
                                                            <div className="w-16 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-200 shadow-sm group-hover:scale-105 transition-transform font-inter">
                                                                <img
                                                                    src={sitePhotoService.resolveUrl(photo.url || null) || ""}
                                                                    alt="Audit"
                                                                    className="w-full h-full object-cover font-inter"
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-inter">
                                                            <span className="text-sm font-bold text-slate-800 uppercase tracking-widest">
                                                                {projects.find(p => Number(p.id) === Number(photo.project_id))?.project_name || 
                                                                 projects.find(p => Number(p.id) === Number(photo.project_id))?.name || 
                                                                 `Project #${photo.project_id}`}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-inter">
                                                            <div className="flex flex-col font-inter">
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">AUDIT-#{photo.id}</span>
                                                                <span className="text-sm font-bold text-slate-800 line-clamp-1 font-inter uppercase tracking-tight">{photo.description}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-inter">
                                                            <div className="flex flex-col font-inter">
                                                                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest font-inter">{photo.activity_tag}</span>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest font-inter">{photo.location_tag}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 font-inter">
                                                            <div className="flex items-center gap-2 font-inter">
                                                                <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold font-inter">
                                                                    {(photo.uploaded_by || "IP").split(" ").map(n => n[0]).join("")}
                                                                </div>
                                                                <div className="flex flex-col font-inter">
                                                                    <p className="text-[10px] font-bold text-slate-800 font-inter uppercase tracking-widest">{photo.uploaded_by}</p>
                                                                    <p className="text-[10px] text-slate-400 font-bold font-inter">{photo.date}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-inter">
                                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                                <button
                                                                    onClick={() => setSelectedPhoto(photo)}
                                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                                    title="View Insight"
                                                                >
                                                                    <Eye className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => { setPhotoToDelete(photo.id); setIsDeleteModalOpen(true); }}
                                                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                                    title="Discard Evidence"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="py-32 text-center font-inter">
                                <Camera className="w-16 h-16 mx-auto mb-6 opacity-10 text-slate-800" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-50 font-inter">No evidence artifacts discovered in the project vault.</p>
                            </div>
                        )}
                    </div>

                    {/* â”€â”€ Pagination â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
                    {!isLoading && filteredPhotos.length > 0 && (
                        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
                            {/* Left: Items per page */}
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            {/* Center: Showing info */}
                            <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredPhotos.length)} of {filteredPhotos.length} records
                            </div>

                            {/* Right: Pagination */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {(() => {
                                    const totalItems = filteredPhotos.length;
                                    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                                    const pages = [];
                                    if (totalPages <= 5) {
                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                    } else {
                                        if (currentPage <= 3) {
                                            pages.push(1, 2, 3, 4, '...', totalPages);
                                        } else if (currentPage >= totalPages - 2) {
                                            pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                        } else {
                                            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                        }
                                    }

                                    return pages.map((page, index) => {
                                        if (page === '...') {
                                            return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                                        }
                                        const pageNum = page as number;
                                        const isActive = currentPage === pageNum;
                                        return (
                                            <button
                                                key={`page-${pageNum}`}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                                                        ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                                                        : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    });
                                })()}

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredPhotos.length / itemsPerPage), prev + 1))}
                                    disabled={currentPage === Math.max(1, Math.ceil(filteredPhotos.length / itemsPerPage)) || filteredPhotos.length === 0}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
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
                        <div className="bg-primary rounded-2xl p-10 mb-8 text-white shadow-2xl relative overflow-hidden font-inter">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-100 mb-3 font-inter">Intelligence Artifact Record</p>
                                <h3 className="text-2xl font-bold tracking-tight leading-tight mb-8 font-inter">{selectedPhoto?.location_tag}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-inter">
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 font-inter">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5 font-inter">Reference Code</p>
                                        <p className="text-xl font-bold text-white font-inter">#LOG-{selectedPhoto?.id}</p>
                                    </div>
                                    <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10 font-inter">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1.5 font-inter">Capture Sequence</p>
                                        <p className="text-xl font-bold font-inter">{selectedPhoto?.date}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl overflow-hidden border-8 border-slate-50 shadow-2xl mb-8 aspect-video group relative font-inter">
                            <img src={sitePhotoService.resolveUrl(selectedPhoto?.url || null) || ""} alt="Site Artifact" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 font-inter" />
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-2xl" />
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div className="font-inter">
                                <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-3')}>Observation Intelligence</p>
                                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-[13px] font-bold text-slate-600 leading-relaxed font-inter uppercase tracking-tight shadow-inner">
                                    "{selectedPhoto?.description}"
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 font-inter">
                                <div className="font-inter">
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1.5')}>Milestone Domain</p>
                                    <p className="text-sm font-bold text-blue-600 uppercase tracking-widest font-inter">{selectedPhoto?.activity_tag}</p>
                                </div>
                                <div className="font-inter">
                                    <p className={labelClasses.replace('mb-1.5 ml-1', 'mb-1.5')}>Responsible Engineer</p>
                                    <p className="text-sm font-bold text-slate-800 uppercase tracking-widest font-inter">{selectedPhoto?.uploaded_by}</p>
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

            {/* â”€â”€ Evidence Upload Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
