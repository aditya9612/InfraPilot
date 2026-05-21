import React, { useState } from "react";
import Modal from "../common/Modal";
import { Camera, ClipboardList, Package, User, Wind, Droplets, Thermometer, Users } from "lucide-react";

interface ViewEngineerModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineer: any;
}

const ViewEngineerModal: React.FC<ViewEngineerModalProps> = ({
  isOpen,
  onClose,
  engineer,
}) => {
  const [activeTab, setActiveTab] = useState<"profile" | "activity">("profile");
  const [activityFilter, setActivityFilter] = useState<"photos" | "materials" | "dsr">("photos");

  if (!engineer) return null;

  const isOnSite = engineer.status === "On Site";

  const footer = (
    <div className="flex justify-between items-center w-full">
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "profile" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
        >
          <User className="w-3.5 h-3.5 inline mr-1.5" /> Profile & Vitals
        </button>
        <button
          onClick={() => setActiveTab("activity")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === "activity" ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
        >
          <Camera className="w-3.5 h-3.5 inline mr-1.5" /> Site Mirror
        </button>
      </div>
      <button
        onClick={onClose}
        className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
      >
        Close
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={activeTab === "profile" ? "Engineer Command Center" : `Site Mirror: ${engineer.name}`}
      footer={footer}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {activeTab === "profile" ? (
          <div className="space-y-8 pb-4">
            {/* Mission Control Header */}
            <div className="relative overflow-hidden bg-primary rounded-2xl p-8 text-white shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
              <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="w-28 h-28 rounded-3xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center font-bold text-3xl shadow-2xl shrink-0">
                    {engineer.name?.charAt(0)}
                  </div>
                  <div className="text-center md:text-left space-y-2">
                    <div className="flex flex-col md:flex-row items-center gap-3">
                      <h3 className="text-2xl font-black tracking-tight">{engineer.name}</h3>
                      <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-white border border-white/20">
                        {engineer.specialization || "Engineering Staff"}
                      </span>
                    </div>
                    <p className="text-white/80 font-medium">{engineer.email}</p>
                    <div className="pt-2 flex gap-3">
                      <div className="px-3 py-1 bg-white/10 rounded-full border border-white/10 text-[10px] font-bold">
                        TEAM SIZE: {engineer.laborCount || 0}
                      </div>
                      <div className={`px-3 py-1 rounded-full border text-[10px] font-bold ${isOnSite ? "bg-emerald-500/20 border-emerald-500/30 text-white" : "bg-slate-500/20 border-slate-500/30 text-white"}`}>
                        {engineer.status}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Live Weather Insight */}
                <div className="hidden lg:flex flex-col items-end gap-2 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <Thermometer className="w-5 h-5 text-amber-300" />
                    <span className="text-lg font-black">{engineer.weather || "32°C"}</span>
                  </div>
                  <div className="flex gap-4 text-[10px] font-bold uppercase text-white/60">
                    <div className="flex items-center gap-1"><Droplets className="w-3 h-3" /> 54% Humid</div>
                    <div className="flex items-center gap-1"><Wind className="w-3 h-3" /> 12km/h</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
              <Section icon={<Users className="w-5 h-5" />} title="Labor Density (Supervised)">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Skilled Labor</p>
                    <p className="text-xl font-black text-primary">{Math.round(engineer.laborCount * 0.6 || 0)}</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-1">Unskilled Labor</p>
                    <p className="text-xl font-black text-slate-600">{Math.round(engineer.laborCount * 0.4 || 0)}</p>
                  </div>
                </div>
                <InfoItem label="Current Direct Reports" value={`${engineer.laborCount} Workers`} />
              </Section>

              <Section icon={<ClipboardList className="w-5 h-5" />} title="Current Site Mission">
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-2">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Live Activity</p>
                  <p className="text-sm font-bold text-slate-800">{engineer.activeTask || "No active supervision session"}</p>
                </div>
                <InfoItem label="Assigned Project" value={engineer.projects || "Unassigned"} />
                <InfoItem label="Est. Completion" value="68% Phase Progress" valueClass="text-primary" />
              </Section>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-[500px]">
            {/* Mirror Tabs */}
            <div className="flex gap-4 border-b border-slate-100 mb-6">
              <button
                onClick={() => setActivityFilter("photos")}
                className={`pb-3 text-xs font-bold transition-all px-2 ${activityFilter === "photos" ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600"}`}
              >
                Site Photos
              </button>
              <button
                onClick={() => setActivityFilter("materials")}
                className={`pb-3 text-xs font-bold transition-all px-2 ${activityFilter === "materials" ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600"}`}
              >
                Material Log
              </button>
              <button
                onClick={() => setActivityFilter("dsr")}
                className={`pb-3 text-xs font-bold transition-all px-2 ${activityFilter === "dsr" ? "text-primary border-b-2 border-primary" : "text-slate-400 hover:text-slate-600"}`}
              >
                DSR Feed
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {activityFilter === "photos" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="group relative aspect-video bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
                      <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                        <Camera className="w-8 h-8 opacity-20" />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-all">
                        <p className="text-[10px] text-white font-medium">Site Area {i} - 10:45 AM</p>
                      </div>
                    </div>
                  ))}
                  <div className="aspect-video bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Waiting for sync...</p>
                  </div>
                </div>
              )}

              {activityFilter === "materials" && (
                <div className="space-y-3">
                  {[
                    { item: "Cement (Grade 43)", qty: "45 Bags", time: "09:15 AM", task: "Foundation Pours" },
                    { item: "Steel TMT (12mm)", qty: "120 kg", time: "11:30 AM", task: "Pillar Reinforcement" },
                    { item: "Bricks (Fly Ash)", qty: "1500 units", time: "02:20 PM", task: "Wall Construction" },
                  ].map((log, i) => (
                    <div key={i} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{log.item}</p>
                          <p className="text-[10px] text-slate-500">{log.task} | Today, {log.time}</p>
                        </div>
                      </div>
                      <p className="text-sm font-black text-primary">{log.qty}</p>
                    </div>
                  ))}
                </div>
              )}

              {activityFilter === "dsr" && (
                <div className="space-y-6">
                  {[
                    { title: "Day Shift Completion", status: "Submitted", time: "Just Now", details: "Casting for floor 4 completed. Curing in progress for floor 3. No safety incidents reported." },
                    { title: "Material Inward", status: "Verified", time: "2h ago", details: "Received 500 bags of cement. Quality tested and approved. Storage in Main Godown." },
                  ].map((dsr, i) => (
                    <div key={i} className="relative pl-6 border-l-2 border-primary/20 hover:border-primary transition-all">
                      <div className="absolute top-0 -left-[9px] w-4 h-4 rounded-full bg-white border-2 border-primary" />
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="text-sm font-black text-slate-800">{dsr.title}</h5>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{dsr.time}</span>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-600 leading-relaxed font-medium">{dsr.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <div className="text-primary">{icon}</div>
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{title}</h4>
    </div>
    <div className="space-y-4 pt-1">{children}</div>
  </div>
);

const InfoItem: React.FC<{ label: string; value: string; valueClass?: string }> = ({ label, value, valueClass }) => (
  <div>
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{label}</p>
    <p className={`text-sm font-bold text-slate-700 ${valueClass ?? ""}`}>{value || "—"}</p>
  </div>
);

export default ViewEngineerModal;
