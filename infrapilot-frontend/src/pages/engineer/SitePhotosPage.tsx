import { useState, useRef } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const initialPhotos = [
    { id: 1, url: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?auto=format&fit=crop&w=800&q=80", date: "2026-04-05", activity: "Foundation Footing", location: "Sector A-1", description: "Base slab reinforcement work in progress for block A." },
    { id: 2, url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80", date: "2026-04-06", activity: "RCC Column Casting", location: "Level 2", description: "Column C24 shuttering inspection completed before pouring." },
    { id: 3, url: "https://images.unsplash.com/photo-1517089596392-db9a5e9478ca?auto=format&fit=crop&w=800&q=80", date: "2026-04-07", activity: "Curing Work", location: "Floor 1", description: "Daily curing of brickwork and slabs in East wing." },
];

const SitePhotosPage = () => {
    const [showUpload, setShowUpload] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split("T")[0],
        activity: "",
        location: "",
        description: "",
        hasPhoto: false
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, hasPhoto: true }));
            if (errors.photo) {
                setErrors(prev => {
                    const upd = { ...prev };
                    delete upd.photo;
                    return upd;
                });
            }
        }
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.hasPhoto) newErrors.photo = "Please upload a photo";
        if (!formData.activity.trim()) newErrors.activity = "Activity tag is required";
        if (!formData.location.trim()) newErrors.location = "Location tag is required";
        if (!formData.description.trim()) newErrors.description = "Description is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.error("Please fill all details and upload a photo", { position: "top-right" });
            return;
        }
        toast.success("Site photo uploaded successfully!", { position: "top-right" });
        setShowUpload(false);
        handleReset();
    };

    const handleReset = () => {
        setFormData({
            date: new Date().toISOString().split("T")[0],
            activity: "",
            location: "",
            description: "",
            hasPhoto: false
        });
        setErrors({});
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDownload = (photo: typeof initialPhotos[0]) => {
        toast.loading("Preparing high-res download...", { duration: 1500, position: "top-right" });

        setTimeout(() => {
            const link = document.createElement("a");
            link.href = photo.url;
            link.download = `InfraPilot_${photo.activity.replace(/\s+/g, '_')}_${photo.date}.jpg`;
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Download started!", { position: "top-right" });
        }, 1600);
    };

    return (
        <>
            <Navbar title="Site Photo Gallery" breadcrumb={["Engineer", "Photos"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Project Visuals</h1>
                            <p className="text-slate-500 text-sm">Visual documentation of site progress and milestones.</p>
                        </div>
                        <button
                            onClick={() => setShowUpload(!showUpload)}
                            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg ${showUpload ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-primary text-white shadow-primary/20 hover:bg-blue-600'}`}
                        >
                            {showUpload ? 'Cancel Upload' : '+ Upload Progress Photo'}
                        </button>
                    </div>

                    {showUpload && (
                        <div className="mb-12 bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
                            <form onSubmit={handleSubmit} className="p-10">
                                <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                                    Upload New Progress Documentation
                                </h2>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="space-y-6">
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className={`w-full aspect-video rounded-[32px] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${formData.hasPhoto ? 'bg-emerald-50 border-emerald-300' : errors.photo ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                                        >
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileChange}
                                                className="hidden"
                                                accept="image/*"
                                            />
                                            {formData.hasPhoto ? (
                                                <div className="text-center group">
                                                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                        <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                                    </div>
                                                    <p className="text-emerald-700 font-black uppercase text-[10px] tracking-widest">Photo Captured</p>
                                                    <p className="text-emerald-500 text-[10px] mt-1">Tap to change file</p>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                                        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    </div>
                                                    <p className="text-slate-800 font-bold tracking-tight">Drag progress photo here</p>
                                                    <p className="text-slate-400 text-xs mt-1">PNG, JPG up to 10MB</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Date of Capture</label>
                                                <input
                                                    type="date"
                                                    name="date"
                                                    value={formData.date}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold h-[52px]"
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.activity ? 'text-rose-500' : 'text-slate-400'}`}>Activity Tag</label>
                                                <input
                                                    type="text"
                                                    name="activity"
                                                    value={formData.activity}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Masonry"
                                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.activity ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                                />
                                                {errors.activity && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.activity}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.location ? 'text-rose-500' : 'text-slate-400'}`}>Location Tag</label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleChange}
                                                placeholder="e.g. Block B, Floor 1"
                                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-bold h-[52px] ${errors.location ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                            />
                                            {errors.location && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.location}</p>}
                                        </div>

                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.description ? 'text-rose-500' : 'text-slate-400'}`}>Description</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={3}
                                                placeholder="What exactly is shown in this photo?"
                                                className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none font-medium resize-none transition-all ${errors.description ? 'border-rose-300 ring-4 ring-rose-50' : 'border-slate-200 focus:ring-2 focus:ring-primary/20'}`}
                                            />
                                            {errors.description && <p className="text-[10px] text-rose-500 font-bold mt-1.5 ml-1">{errors.description}</p>}
                                        </div>

                                        <div className="pt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="w-full sm:flex-1 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 rounded-2xl transition-all order-2 sm:order-1"
                                            >
                                                Clear Details
                                            </button>
                                            <button
                                                type="submit"
                                                className="w-full sm:flex-[2] bg-primary text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 order-1 sm:order-2"
                                            >
                                                Upload To Gallery
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {initialPhotos.map(photo => (
                            <div key={photo.id} className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm group hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col">
                                <div className="relative aspect-square overflow-hidden">
                                    <img src={photo.url} alt="Site" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                    <div className="absolute top-4 left-4 flex gap-2">
                                        <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-xl text-white text-[10px] font-black uppercase tracking-widest">
                                            {photo.date}
                                        </div>
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                                        <p className="text-white text-xs font-medium leading-relaxed italic line-clamp-3">"{photo.description}"</p>
                                    </div>
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase tracking-widest">{photo.activity}</h3>
                                        <button
                                            onClick={() => handleDownload(photo)}
                                            className="w-8 h-8 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-primary hover:text-white transition-all shadow-sm"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-primary uppercase tracking-widest mt-auto">
                                        <div className="w-2 h-2 rounded-full bg-primary/20 flex items-center justify-center">
                                            <div className="w-1 h-1 rounded-full bg-primary"></div>
                                        </div>
                                        {photo.location}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default SitePhotosPage;
