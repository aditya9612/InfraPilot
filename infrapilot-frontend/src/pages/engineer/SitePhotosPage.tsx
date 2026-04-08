import { useState, useRef } from "react";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";


const mockPhotos = [
  { id: 1, url: "https://placehold.co/400x300/2563EB/white?text=Foundation+Work", date: "2025-04-04", activity: "Foundation", location: "Block A", description: "RCC footing pour completed" },
  { id: 2, url: "https://placehold.co/400x300/16A34A/white?text=Column+Casting", date: "2025-04-03", activity: "RCC Work", location: "Column C3", description: "Column shuttering & casting" },
  { id: 3, url: "https://placehold.co/400x300/F59E0B/white?text=Material+Stock", date: "2025-04-02", activity: "Material", location: "Store Area", description: "Cement bags stacked properly" },
  { id: 4, url: "https://placehold.co/400x300/6366F1/white?text=Safety+Setup", date: "2025-04-01", activity: "Safety", location: "Site Perimeter", description: "Safety nets installed" },
  { id: 5, url: "https://placehold.co/400x300/0891B2/white?text=Machinery", date: "2025-03-30", activity: "Machinery", location: "Entry Point", description: "JCB excavation in progress" },
  { id: 6, url: "https://placehold.co/400x300/DC2626/white?text=Brickwork", date: "2025-03-28", activity: "Brickwork", location: "Block C Wall", description: "First floor brickwork" },
];

const ACTIVITY_TAGS = ["All", "Foundation", "RCC Work", "Brickwork", "Material", "Safety", "Machinery", "Other"];

const SitePhotosPage = () => {
  const [photos, setPhotos] = useState(mockPhotos);
  const [filterTag, setFilterTag] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], activity: "", location: "", description: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = photos.filter(p => filterTag === "All" || p.activity === filterTag);

  return (
    <DashboardLayout>
      <Navbar title="Site Photos" breadcrumb={["InfraPilot", "Engineer", "Photos"]}
        action={{ label: "📷 Upload Photo", onClick: () => setShowUpload(true) }} />

      <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Photos", value: photos.length, icon: "📷", color: "bg-blue-50 text-blue-600" },
            { label: "This Week", value: 4, icon: "📅", color: "bg-purple-50 text-purple-600" },
            { label: "Activities", value: [...new Set(photos.map(p => p.activity))].length, icon: "🏷️", color: "bg-orange-50 text-orange-600" },
            { label: "Locations", value: [...new Set(photos.map(p => p.location))].length, icon: "📍", color: "bg-green-50 text-green-600" },
          ].map((c, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between h-28">
              <span className={`w-8 h-8 ${c.color} rounded-lg flex items-center justify-center text-lg`}>{c.icon}</span>
              <div>
                <p className="text-xl font-bold text-slate-800 leading-none">{c.value}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight mt-1">{c.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Activity Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {ACTIVITY_TAGS.map(tag => (
            <button key={tag} onClick={() => setFilterTag(tag)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${filterTag === tag ? "bg-primary text-white border-primary" : "bg-white text-slate-400 border-slate-100"}`}>
              {tag}
            </button>
          ))}
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(photo => (
            <div key={photo.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 group">
              <div className="aspect-video overflow-hidden">
                <img src={photo.url} alt={photo.description} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="bg-blue-50 text-primary text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">{photo.activity}</span>
                  <span className="text-[9px] text-slate-400 font-medium">{photo.date}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 leading-snug">{photo.description}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">📍 {photo.location}</p>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center text-slate-400">
            <p className="text-4xl mb-3">📷</p>
            <p className="text-sm font-bold">No photos for this tag</p>
          </div>
        )}
      </div>

      {showUpload && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800">📷 Upload Site Photo</h3>
              <button onClick={() => setShowUpload(false)} className="text-slate-400 text-2xl">×</button>
            </div>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => fileRef.current?.click()}>
                {preview ? (
                  <img src={preview} className="w-full h-32 object-cover rounded-xl" />
                ) : (
                  <div>
                    <p className="text-3xl mb-2">📸</p>
                    <p className="text-sm font-bold text-slate-600">Tap to select photo</p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 10MB</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) setPreview(URL.createObjectURL(f)); }} />
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Activity Tag</label>
                <select className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700"
                  value={form.activity} onChange={e => setForm({ ...form, activity: e.target.value })}>
                  <option value="">Select Activity</option>
                  {ACTIVITY_TAGS.filter(t => t !== "All").map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">Photo Date *</label>
                <input type="date" className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700"
                  value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
              {[
                { label: "Location Tag", key: "location", placeholder: "e.g. Block A, Floor 2" },
                { label: "Description", key: "description", placeholder: "What does this photo show?" },
              ].map((f, i) => (
                <div key={i}>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em] mb-2">{f.label}</label>
                  <input type="text" placeholder={f.placeholder} className="w-full bg-slate-50 border-none rounded-xl p-4 text-sm text-slate-700"
                    value={form[f.key as keyof typeof form]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                </div>
              ))}
              <button className="w-full py-4 bg-primary text-white rounded-2xl text-base font-bold shadow-xl shadow-primary/30 active:scale-95"
                onClick={() => {
                  if (form.description) {
                    setPhotos(prev => [{
                      id: prev.length + 1,
                      url: preview || "https://placehold.co/400x300/2563EB/white?text=New+Photo",
                      date: form.date,
                      activity: form.activity || "Other",
                      location: form.location || "Site",
                      description: form.description
                    }, ...prev]);
                  }
                  setShowUpload(false); setPreview(null);
                }}>Upload Photo</button>

            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};
export default SitePhotosPage;
