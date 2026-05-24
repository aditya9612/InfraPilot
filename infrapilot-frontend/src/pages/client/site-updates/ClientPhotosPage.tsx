import { useState, useEffect, useCallback } from "react";
import Navbar from "../../../components/common/Navbar";
import { sitePhotoService } from "../../../services/sitePhotoService";

const tags = ["All", "Structure", "Foundation", "Masonry", "Equipment", "Safety"];

const ClientPhotosPage = () => {
  const [activeTag, setActiveTag] = useState("All");
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const projectId = 96; // Scoped to Project 96

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const params: any = { project_id: projectId };
        if (activeTag !== "All") {
          params.activity_tag = activeTag;
        }

        const response = await sitePhotoService.getPhotos(params);
        const fetchedItems = response.items || [];

        // Resolve URLs
        const sorted = fetchedItems.map((p: any) => ({
          ...p,
          displayUrl: sitePhotoService.resolveUrl((p.url || p.photo_url) ?? null) || "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=800&q=80",
          displayDate: p.date ? new Date(p.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A"
        })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setPhotos(sorted);
      } catch (error) {
        console.error("Failed to fetch gallery:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [activeTag]);

  const openModal = (photo: any, index: number) => {
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const closeModal = () => setSelectedPhoto(null);

  const goNext = useCallback(() => {
    const next = (selectedIndex + 1) % photos.length;
    setSelectedIndex(next);
    setSelectedPhoto(photos[next]);
  }, [selectedIndex, photos]);

  const goPrev = useCallback(() => {
    const prev = (selectedIndex - 1 + photos.length) % photos.length;
    setSelectedIndex(prev);
    setSelectedPhoto(photos[prev]);
  }, [selectedIndex, photos]);

  // Keyboard navigation
  useEffect(() => {
    if (!selectedPhoto) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedPhoto, goNext, goPrev]);

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Site Updates", "Photos"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Photo Gallery</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">A visual chronicle of your project's transformation</p>
          </div>
          <div className="flex gap-2 bg-white p-2 rounded-[24px] shadow-sm border border-slate-100 overflow-x-auto max-w-full custom-scrollbar">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`flex-shrink-0 whitespace-nowrap px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  activeTag === tag
                    ? "bg-slate-900 text-white shadow-lg"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
             <div className="w-10 h-10 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Project Archives...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-black uppercase tracking-widest">No photos found for {activeTag}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {photos.map((photo, index) => (
              <div key={photo.id} className="group bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col">
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img src={photo.displayUrl} alt={photo.description} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute top-5 left-5">
                    <span className="bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-slate-800 px-4 py-2 rounded-2xl shadow-sm border border-white/20">
                      {photo.activity_tag || photo.tag || 'Site Update'}
                    </span>
                  </div>
                  <div className="absolute bottom-5 left-5 right-5 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="text-white text-[10px] font-black uppercase tracking-widest">Captured • {photo.displayDate}</p>
                  </div>
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-primary rounded-full" />
                      {photo.location_tag || 'Site Location'}
                    </p>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed mb-6 italic line-clamp-2">"{photo.description || 'No description provided'}"</p>
                  </div>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{photo.displayDate}</span>
                    <button
                      onClick={() => openModal(photo, index)}
                      title="Zoom photo"
                      className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-110 hover:bg-primary transition-all active:scale-95"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          onClick={closeModal}
        >
          {/* Modal Container - stop propagation so clicking photo doesn't close */}
          <div
            className="relative max-w-5xl w-full mx-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-10"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Prev Button */}
            {photos.length > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-14 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Image */}
            <img
              src={selectedPhoto.displayUrl}
              alt={selectedPhoto.description}
              className="w-full max-h-[75vh] object-contain rounded-3xl shadow-2xl"
            />

            {/* Next Button */}
            {photos.length > 1 && (
              <button
                onClick={goNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-14 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Caption */}
            <div className="mt-6 text-center">
              <p className="text-white font-bold text-sm">{selectedPhoto.description || 'No description provided'}</p>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
                {selectedPhoto.activity_tag || 'Site Update'} • {selectedPhoto.displayDate}
                {photos.length > 1 && ` • ${selectedIndex + 1} / ${photos.length}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClientPhotosPage;
