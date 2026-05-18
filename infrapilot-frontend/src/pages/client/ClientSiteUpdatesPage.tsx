import Navbar from "../../components/common/Navbar";

const photos = [
  { id: 1, url: "https://images.unsplash.com/photo-1541888946425-d81bb19480c5?w=600&h=400&fit=crop", date: "31 Mar 2026", desc: "Roof slab reinforcement", tag: "Structure" },
  { id: 2, url: "https://images.unsplash.com/photo-1503387762-592dea58ef21?w=600&h=400&fit=crop", date: "29 Mar 2026", desc: "Foundation progress view", tag: "Foundation" },
  { id: 3, url: "https://images.unsplash.com/photo-1590486803833-ffc45744a3ae?w=600&h=400&fit=crop", date: "28 Mar 2026", desc: "External brickwork — L1", tag: "Masonry" },
  { id: 4, url: "https://images.unsplash.com/photo-1565008576549-57569a49371d?w=600&h=400&fit=crop", date: "26 Mar 2026", desc: "Crane operations on site", tag: "Equipment" },
  { id: 5, url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop", date: "25 Mar 2026", desc: "Safety harness inspection", tag: "Safety" },
  { id: 6, url: "https://images.unsplash.com/photo-1515263487990-61b07816fe85?w=600&h=400&fit=crop", date: "24 Mar 2026", desc: "Concrete pour — 3rd slab", tag: "Structure" },
];

const tags = ["All", "Structure", "Foundation", "Masonry", "Equipment", "Safety"];

const ClientSiteUpdatesPage = () => (
  <>
    <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Site Updates"]} />
    <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Site Updates</h1>
          <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">Latest photos & field updates from your site</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {tags.map((tag, i) => (
            <button key={i} className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${i === 0 ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-white border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600"}`}>{tag}</button>
          ))}
        </div>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {photos.map(photo => (
          <div key={photo.id} className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300">
            <div className="aspect-[4/3] overflow-hidden relative">
              <img src={photo.url} alt={photo.desc} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-[9px] font-bold uppercase tracking-widest text-slate-600 px-2.5 py-1 rounded-full">{photo.tag}</span>
            </div>
            <div className="p-4">
              <p className="text-sm font-bold text-slate-700">{photo.desc}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">{photo.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </>
);

export default ClientSiteUpdatesPage;
