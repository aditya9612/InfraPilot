import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Navigate } from "react-router-dom";
import DashboardLayout from "../../components/common/DashboardLayout";
import Navbar from "../../components/common/Navbar";

// ─── Types ───────────────────────────────────────────────────────────────────
interface LabourCount {
  skilled: number;
  unskilled: number;
}

interface DSRForm {
  date: string;
  projectName: string;
  siteLocation: string;
  weatherCondition: string;
  workDoneToday: string;
  workPlannedTomorrow: string;
  labour: LabourCount;
  contractorName: string;
  machineryUsed: string;
  materialReceived: string;
  materialConsumed: string;
  issuesDelays: string;
  safetyObservations: string;
  engineerRemarks: string;
  photos: File[];
  gpsLocation: string;
}

const WEATHER_OPTIONS = ["☀️ Sunny", "⛅ Partly Cloudy", "☁️ Cloudy", "🌧️ Rainy", "⛈️ Stormy", "🌫️ Foggy"];

const PROJECT_OPTIONS = [
  "NH-44 Highway Widening",
  "Metro Rail Phase 2",
  "Smart City – Nagpur",
  "Flyover Bridge – Wardha Road",
  "Industrial Zone Development",
];

const SECTIONS = [
  { id: "basic", label: "Basic Info", icon: "📋" },
  { id: "work", label: "Work Details", icon: "🔨" },
  { id: "resources", label: "Resources", icon: "👷" },
  { id: "materials", label: "Materials", icon: "📦" },
  { id: "observations", label: "Observations", icon: "🔍" },
  { id: "media", label: "Photos & GPS", icon: "📍" },
];

const inp = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

// ─── Sub-components ───────────────────────────────────────────────────────────
const SectionTitle = ({ icon, title }: { icon: string; title: string }) => (
  <div className="flex items-center gap-3 pb-3 border-b-2 border-slate-100 mb-4">
    <span className="text-xl">{icon}</span>
    <h2 className="text-lg font-bold text-slate-800">{title}</h2>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="block text-xs font-bold text-slate-400 uppercase tracking-[0.15em]">{label}</label>
    {children}
  </div>
);

const SectionFooter = ({
  onBack, onNext, nextLabel,
}: {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
}) => (
  <div className={`flex pt-4 border-t border-slate-100 mt-6 ${onBack ? "justify-between" : "justify-end"}`}>
    {onBack && (
      <button type="button" onClick={onBack}
        className="px-5 py-2.5 border border-slate-200 bg-white text-slate-500 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
        ← Back
      </button>
    )}
    {onNext && (
      <button type="button" onClick={onNext}
        className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/30 active:scale-95 transition-all">
        {nextLabel || "Next →"}
      </button>
    )}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const DSRPage = () => {
  const { user } = useAuth();

  if (!user || user.role !== "Site Engineer") {
    return <Navigate to="/unauthorized" replace />;
  }

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState<DSRForm>({
    date: today,
    projectName: "",
    siteLocation: "",
    weatherCondition: "",
    workDoneToday: "",
    workPlannedTomorrow: "",
    labour: { skilled: 0, unskilled: 0 },
    contractorName: "",
    machineryUsed: "",
    materialReceived: "",
    materialConsumed: "",
    issuesDelays: "",
    safetyObservations: "",
    engineerRemarks: "",
    photos: [],
    gpsLocation: "",
  });

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState("basic");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { captureGPS(); }, []);

  const captureGPS = () => {
    if (!navigator.geolocation) { setGpsError("GPS not supported on this device."); return; }
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, gpsLocation: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}` }));
        setGpsLoading(false);
      },
      () => { setGpsError("Location access denied."); setGpsLoading(false); },
      { timeout: 8000 }
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = [...form.photos, ...Array.from(e.target.files || [])].slice(0, 10);
    setForm(f => ({ ...f, photos: files }));
    setPhotoUrls(files.map(f => URL.createObjectURL(f)));
  };

  const removePhoto = (idx: number) => {
    const files = form.photos.filter((_, i) => i !== idx);
    setForm(f => ({ ...f, photos: files }));
    setPhotoUrls(files.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  const resetForm = () => {
    setForm({
      date: today,
      projectName: "",
      siteLocation: "",
      weatherCondition: "",
      workDoneToday: "",
      workPlannedTomorrow: "",
      labour: { skilled: 0, unskilled: 0 },
      contractorName: "",
      machineryUsed: "",
      materialReceived: "",
      materialConsumed: "",
      issuesDelays: "",
      safetyObservations: "",
      engineerRemarks: "",
      photos: [],
      gpsLocation: "",
    });
    setPhotoUrls([]);
    setSubmitted(false);
    setActiveSection("basic");
    captureGPS();
  };

  // ── Submitted success screen ─────────────────────────────────────────────
  if (submitted) {
    return (
      <DashboardLayout>
        <Navbar title="Daily Site Report" breadcrumb={["InfraPilot", "Engineer", "DSR"]} />
        <div className="p-4 md:p-8 bg-slate-50 min-h-screen flex items-center justify-center">
          <div className="bg-white rounded-3xl p-10 shadow-md border border-slate-100 text-center max-w-sm w-full">
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Report Submitted!</h2>
            <p className="text-sm text-slate-500 mb-1">
              {form.projectName || "Project"} &nbsp;·&nbsp;
              {new Date(form.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-xs text-primary font-semibold mb-6">Submitted by: {user.name}</p>
            <button
              className="w-full py-3 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all"
              onClick={resetForm}
            >
              + New Report
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── Main page ────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <Navbar
        title="Daily Site Report"
        breadcrumb={["InfraPilot", "Engineer", "DSR"]}
      />

      <div className="p-4 md:p-6 bg-slate-50 min-h-screen pb-24">

        {/* Top info strip */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 mb-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">
              📝 Daily Site Report
            </p>
            <p className="text-base font-bold text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-400">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
          </div>
          <div className="bg-primary text-white rounded-2xl px-4 py-2 text-center min-w-[52px]">
            <p className="text-2xl font-black leading-none">{new Date().getDate()}</p>
            <p className="text-[10px] font-semibold uppercase tracking-widest">
              {new Date().toLocaleString("en-IN", { month: "short" })}
            </p>
          </div>
        </div>

        {/* Section tab nav */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-5 overflow-x-auto">
          <div className="flex min-w-max md:min-w-0">
            {SECTIONS.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex-1 justify-center ${activeSection === s.id
                  ? "border-primary text-primary bg-blue-50"
                  : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
              >
                <span>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ══ Basic Info ══ */}
          {activeSection === "basic" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
              <SectionTitle icon="📋" title="Basic Information" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Date *">
                  <input type="date" className={inp} value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
                </Field>
                <Field label="Project Name *">
                  <select className={inp} value={form.projectName}
                    onChange={e => setForm(f => ({ ...f, projectName: e.target.value }))} required>
                    <option value="">Select Project</option>
                    {PROJECT_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </Field>
                <Field label="Site Location *">
                  <input className={inp} placeholder="e.g. Km 42+300, Wardha Road"
                    value={form.siteLocation}
                    onChange={e => setForm(f => ({ ...f, siteLocation: e.target.value }))} required />
                </Field>
                <Field label="Weather Condition *">
                  <div className="flex flex-wrap gap-2 pt-1">
                    {WEATHER_OPTIONS.map(w => (
                      <button key={w} type="button"
                        onClick={() => setForm(f => ({ ...f, weatherCondition: w }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${form.weatherCondition === w
                          ? "bg-blue-50 border-primary text-primary"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300"
                          }`}>
                        {w}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
              <SectionFooter onNext={() => setActiveSection("work")} nextLabel="Next: Work Details →" />
            </div>
          )}

          {/* ══ Work Details ══ */}
          {activeSection === "work" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
              <SectionTitle icon="🔨" title="Work Details" />
              <Field label="Work Done Today *">
                <textarea className={`${inp} resize-none`} rows={4}
                  placeholder="Describe all work activities completed today..."
                  value={form.workDoneToday}
                  onChange={e => setForm(f => ({ ...f, workDoneToday: e.target.value }))} required />
              </Field>
              <Field label="Work Planned Tomorrow *">
                <textarea className={`${inp} resize-none`} rows={4}
                  placeholder="Describe work planned for tomorrow..."
                  value={form.workPlannedTomorrow}
                  onChange={e => setForm(f => ({ ...f, workPlannedTomorrow: e.target.value }))} required />
              </Field>
              <SectionFooter onBack={() => setActiveSection("basic")} onNext={() => setActiveSection("resources")} nextLabel="Next: Resources →" />
            </div>
          )}

          {/* ══ Resources ══ */}
          {activeSection === "resources" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
              <SectionTitle icon="👷" title="Labour & Machinery" />

              {/* Labour counter */}
              <div className="bg-slate-50 rounded-2xl p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Labour Count</p>
                <div className="grid grid-cols-3 gap-3">
                  {(["skilled", "unskilled"] as const).map(type => (
                    <div key={type} className="flex flex-col items-center gap-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase text-center">
                        {type === "skilled" ? "Skilled" : "Unskilled"}
                      </p>
                      <div className="flex items-center gap-2">
                        <button type="button"
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-primary font-bold text-lg flex items-center justify-center hover:border-primary transition-colors"
                          onClick={() => setForm(f => ({ ...f, labour: { ...f.labour, [type]: Math.max(0, f.labour[type] - 1) } }))}>
                          −
                        </button>
                        <span className="text-xl font-bold text-slate-800 w-8 text-center">{form.labour[type]}</span>
                        <button type="button"
                          className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-primary font-bold text-lg flex items-center justify-center hover:border-primary transition-colors"
                          onClick={() => setForm(f => ({ ...f, labour: { ...f.labour, [type]: f.labour[type] + 1 } }))}>
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex flex-col items-center justify-center gap-1 bg-green-50 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total</p>
                    <span className="text-2xl font-black text-success">{form.labour.skilled + form.labour.unskilled}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Contractor Name">
                  <input className={inp} placeholder="Contractor / subcontractor name"
                    value={form.contractorName}
                    onChange={e => setForm(f => ({ ...f, contractorName: e.target.value }))} />
                </Field>
                <Field label="Machinery Used">
                  <input className={inp} placeholder="e.g. JCB, Concrete Mixer, Crane"
                    value={form.machineryUsed}
                    onChange={e => setForm(f => ({ ...f, machineryUsed: e.target.value }))} />
                </Field>
              </div>
              <SectionFooter onBack={() => setActiveSection("work")} onNext={() => setActiveSection("materials")} nextLabel="Next: Materials →" />
            </div>
          )}

          {/* ══ Materials ══ */}
          {activeSection === "materials" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
              <SectionTitle icon="📦" title="Material Tracking" />
              <Field label="Material Received">
                <textarea className={`${inp} resize-none`} rows={3}
                  placeholder="e.g. 50 bags OPC 53 cement, 10 MT TMT steel rods..."
                  value={form.materialReceived}
                  onChange={e => setForm(f => ({ ...f, materialReceived: e.target.value }))} />
              </Field>
              <Field label="Material Consumed">
                <textarea className={`${inp} resize-none`} rows={3}
                  placeholder="e.g. 30 bags cement, 5 MT steel used in column casting..."
                  value={form.materialConsumed}
                  onChange={e => setForm(f => ({ ...f, materialConsumed: e.target.value }))} />
              </Field>
              <SectionFooter onBack={() => setActiveSection("resources")} onNext={() => setActiveSection("observations")} nextLabel="Next: Observations →" />
            </div>
          )}

          {/* ══ Observations ══ */}
          {activeSection === "observations" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-5">
              <SectionTitle icon="🔍" title="Issues & Observations" />
              <Field label="Issues / Delays">
                <textarea className={`${inp} resize-none !border-red-200`} rows={3}
                  placeholder="Mention any issues, delays, or blockers faced today..."
                  value={form.issuesDelays}
                  onChange={e => setForm(f => ({ ...f, issuesDelays: e.target.value }))} />
              </Field>
              <Field label="Safety Observations">
                <textarea className={`${inp} resize-none !border-green-200`} rows={3}
                  placeholder="Safety incidents, near-misses, PPE compliance, toolbox talks..."
                  value={form.safetyObservations}
                  onChange={e => setForm(f => ({ ...f, safetyObservations: e.target.value }))} />
              </Field>
              <Field label="Engineer Remarks *">
                <textarea className={`${inp} resize-none`} rows={3}
                  placeholder="Your overall remarks and observations for the day..."
                  value={form.engineerRemarks}
                  onChange={e => setForm(f => ({ ...f, engineerRemarks: e.target.value }))} required />
              </Field>
              <SectionFooter onBack={() => setActiveSection("materials")} onNext={() => setActiveSection("media")} nextLabel="Next: Photos & GPS →" />
            </div>
          )}

          {/* ══ Photos & GPS ══ */}
          {activeSection === "media" && (
            <div className="space-y-4">
              {/* GPS */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <SectionTitle icon="📍" title="Photos & GPS Location" />
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">📡</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">GPS Location</p>
                    <p className="text-xs text-slate-400">Auto-captured on page load</p>
                  </div>
                  <button type="button" onClick={captureGPS} disabled={gpsLoading}
                    className="px-3 py-1.5 border border-primary bg-blue-50 text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition-all disabled:opacity-50">
                    {gpsLoading ? "Locating..." : "🔄 Refresh"}
                  </button>
                </div>
                {form.gpsLocation
                  ? <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-success font-semibold">📍 {form.gpsLocation}</div>
                  : gpsError
                    ? <p className="text-danger text-sm font-medium">⚠️ {gpsError}</p>
                    : <p className="text-slate-400 text-sm">Fetching location...</p>
                }
              </div>

              {/* Photo upload */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                  📷 Site Photos ({form.photos.length}/10)
                </p>
                <div
                  className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center cursor-pointer hover:bg-slate-50 transition-colors flex flex-col items-center gap-2"
                  onClick={() => fileInputRef.current?.click()}>
                  <span className="text-3xl">📸</span>
                  <p className="text-sm font-bold text-slate-600">Tap to add photos</p>
                  <p className="text-xs text-slate-400">JPG, PNG up to 10MB each</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoChange} />
                {photoUrls.length > 0 && (
                  <div className="grid grid-cols-4 md:grid-cols-6 gap-2 mt-3">
                    {photoUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-[10px] flex items-center justify-center">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">📋 Report Summary</p>
                <div className="divide-y divide-slate-50">
                  {[
                    ["Project", form.projectName || "—"],
                    ["Date", form.date || "—"],
                    ["Location", form.siteLocation || "—"],
                    ["Weather", form.weatherCondition || "—"],
                    ["Total Labour", `${form.labour.skilled + form.labour.unskilled} workers`],
                    ["Photos", `${form.photos.length} uploaded`],
                    ["GPS", form.gpsLocation || "Not captured"],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between py-2 text-sm">
                      <span className="text-slate-400 font-medium">{label}</span>
                      <span className="text-slate-700 font-semibold text-right max-w-[60%] truncate">{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit footer */}
              <div className="flex items-center justify-between pt-2">
                <button type="button" onClick={() => setActiveSection("observations")}
                  className="px-5 py-2.5 border border-slate-200 bg-white text-slate-500 rounded-xl font-semibold text-sm hover:bg-slate-50 transition-colors">
                  ← Back
                </button>
                <button type="submit"
                  className="px-8 py-3 bg-success text-white rounded-2xl font-bold text-sm shadow-xl shadow-green-200 active:scale-95 transition-all">
                  ✅ Submit Daily Report
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </DashboardLayout>
  );
};

export default DSRPage;
