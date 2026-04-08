import Navbar from "../../../components/common/Navbar";

const photos = [
  { id: 1, url: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=1200&h=800&fit=crop", date: "31 Mar 2026", desc: "Roof slab reinforcement and steel tying progress for Phase 3 casting.", tag: "Structure" },
  { id: 2, url: "https://images.unsplash.com/photo-1503387762-592dea58ef21?w=1200&h=800&fit=crop", date: "29 Mar 2026", desc: "Aerial view of the foundation progress and site layout marking.", tag: "Foundation" },
  { id: 3, url: "https://images.unsplash.com/photo-1590486803833-ffc45744a3ae?w=1200&h=800&fit=crop", date: "28 Mar 2026", desc: "Completion of external brickwork on the eastern wing of Level 1.", tag: "Masonry" },
  { id: 4, url: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=1200&h=800&fit=crop", date: "26 Mar 2026", desc: "Primary crane operations for lifting heavy structural steel beams.", tag: "Equipment" },
  { id: 5, url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=800&fit=crop", date: "25 Mar 2026", desc: "Quarterly safety audit and harness inspection for high-altitude work.", tag: "Safety" },
  { id: 6, url: "https://images.unsplash.com/photo-1515263487990-61b07816fe85?w=1200&h=800&fit=crop", date: "24 Mar 2026", desc: "Main concrete pour for the central support columns on the 3rd floor.", tag: "Structure" },
];

const tags = ["All", "Structure", "Foundation", "Masonry", "Equipment", "Safety"];

const ClientPhotosPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Site Updates", "Photos"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Photo Gallery</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">A visual chronicle of your project's transformation</p>
        </div>
        <div className="flex gap-2 flex-wrap bg-white p-2 rounded-[24px] shadow-sm border border-slate-100">
          {tags.map((tag, i) => (
            <button key={i} className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${i === 0 ? "bg-slate-900 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}>{tag}</button>
          ))}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {photos.map(photo => (
          <div key={photo.id} className="group bg-white rounded-[40px] overflow-hidden shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 flex flex-col">
            <div className="aspect-[4/3] overflow-hidden relative">
              <img src={photo.url} alt={photo.desc} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute top-5 left-5">
                 <span className="bg-white/90 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-slate-800 px-4 py-2 rounded-2xl shadow-sm border border-white/20">
                    {photo.tag}
                 </span>
              </div>
              <div className="absolute bottom-5 left-5 right-5 transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                 <p className="text-white text-[10px] font-black uppercase tracking-widest">Captured on {photo.date}</p>
              </div>
            </div>
            <div className="p-8 flex-1 flex flex-col justify-between">
              <div>
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-4 h-0.5 bg-primary rounded-full" />
                    Site Activity
                 </p>
                 <p className="text-sm font-bold text-slate-700 leading-relaxed mb-6 italic">"{photo.desc}"</p>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{photo.date}</span>
                 <button className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform active:scale-95">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
                 </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export default ClientPhotosPage;
