import { useState } from "react";
import Navbar from "../../../components/common/Navbar";

const photos = [
  // ── Structure ────────────────────────────────────────────────────────────
  { id: 1,  url: "/photos/structure.png",   date: "31 Mar 2026", desc: "Roof slab reinforcement and steel tying progress for Phase 3 casting.",          tag: "Structure" },
  { id: 2,  url: "/photos/structure_2.png", date: "24 Mar 2026", desc: "Main concrete pour for the central support columns on the 3rd floor.",           tag: "Structure" },
  { id: 3,  url: "/photos/structure_3.png", date: "18 Mar 2026", desc: "Steel frame erection completed for the eastern wing — Level 4 underway.",        tag: "Structure" },
  { id: 4,  url: "/photos/structure_4.png", date: "10 Mar 2026", desc: "Beam-column joint inspection after concrete curing period on Level 2.",           tag: "Structure" },

  // ── Foundation ───────────────────────────────────────────────────────────
  { id: 5,  url: "/photos/foundation.png",                                                                     date: "29 Mar 2026", desc: "Pile boring operations and rebar grid layout for the northern block foundation.", tag: "Foundation" },
  { id: 6,  url: "https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=1200&h=800&fit=crop",           date: "22 Mar 2026", desc: "Reinforced concrete foundation slab curing for the main structure footprint.",    tag: "Foundation" },
  { id: 7,  url: "https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=1200&h=800&fit=crop",        date: "15 Mar 2026", desc: "Deep excavation and ground stabilization works for the northern wing basement.",   tag: "Foundation" },
  { id: 8,  url: "/photos/foundation_new.png",                                                                 date: "05 Mar 2026", desc: "Industrial concrete pour for the central foundation raft — Phase 1.",             tag: "Foundation" },



  // ── Masonry ──────────────────────────────────────────────────────────────
  { id: 9,  url: "/photos/masonry.png",   date: "28 Mar 2026", desc: "Detailed brick-by-brick wall construction on the Level 1 block.",                  tag: "Masonry" },
  { id: 10, url: "/photos/masonry_2.png", date: "21 Mar 2026", desc: "Structural stone-brick hybrid masonry for the primary support walls.",            tag: "Masonry" },
  { id: 11, url: "/photos/masonry_3.png", date: "14 Mar 2026", desc: "Completed red brick pattern with high-density mortar jointing.",                  tag: "Masonry" },
  { id: 12, url: "/photos/masonry_4.png", date: "07 Mar 2026", desc: "Industrial AAC block masonry for efficient structural insulation.",                tag: "Masonry" },

  // ── Equipment ────────────────────────────────────────────────────────────
  { id: 13, url: "/photos/equipment.png",   date: "26 Mar 2026", desc: "Tower crane and heavy equipment fleet operational for Phase 3 lifts.",           tag: "Equipment" },
  { id: 14, url: "/photos/equipment_2.png", date: "20 Mar 2026", desc: "Tower crane load test and operator certification completed on-site.",             tag: "Equipment" },
  { id: 15, url: "/photos/equipment_3.png", date: "13 Mar 2026", desc: "Concrete mixer truck fleet staged for the Phase 3 pour — 6 units deployed.",     tag: "Equipment" },
  { id: 16, url: "/photos/equipment_4.png", date: "06 Mar 2026", desc: "Excavator and backhoe deployed for eastside utility trench works.",               tag: "Equipment" },

  // ── Safety ───────────────────────────────────────────────────────────────
  { id: 17, url: "/photos/safety.png",   date: "25 Mar 2026", desc: "Safety officers conducting PPE inspection and site walk-through with crew.",      tag: "Safety" },
  { id: 18, url: "/photos/safety_2.png", date: "19 Mar 2026", desc: "Quarterly safety audit and harness inspection for high-altitude work.",           tag: "Safety" },
  { id: 19, url: "/photos/safety_3.png", date: "12 Mar 2026", desc: "Edge protection barriers and safety nets installed on Level 3 perimeter.",        tag: "Safety" },
  { id: 20, url: "/photos/safety_4.png", date: "04 Mar 2026", desc: "Fire extinguisher placement audit and extinguisher refilling completed.",          tag: "Safety" },
];



const tags = ["All", "Structure", "Foundation", "Masonry", "Equipment", "Safety"];

const ClientPhotosPage = () => {
  const [activeTag, setActiveTag] = useState("All");

  // "All" tab → one representative (latest) photo per category
  const filteredPhotos = activeTag === "All"
    ? ["Structure", "Foundation", "Masonry", "Equipment", "Safety"].map(
        (cat) => photos.find((p) => p.tag === cat)!
      )
    : photos.filter((p) => p.tag === activeTag);

  return (
    <>
      <Navbar title="Project Transparency Portal" breadcrumb={["InfraPilot", "Client", "Site Updates", "Photos"]} />
      <div className="p-6 bg-slate-50 min-h-screen font-inter pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Project Photo Gallery</h1>
            <p className="text-slate-400 font-medium mt-1 uppercase tracking-widest text-[10px]">A visual chronicle of your project's transformation</p>
          </div>
          <div className="flex gap-2 flex-wrap bg-white p-2 rounded-[24px] shadow-sm border border-slate-100">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag)}
                className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
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

        {/* Photo Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <svg className="w-16 h-16 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-black uppercase tracking-widest">No photos in this category yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPhotos.map(photo => (
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
        )}
      </div>
    </>
  );
};

export default ClientPhotosPage;
