import { useState } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";
import {
  Plus, HelpCircle,
  ExternalLink, ShieldCheck
} from "lucide-react";
import RequestIntegrationModal from "../../components/admin/integrations/RequestIntegrationModal";
import IntegrationDocsModal from "../../components/admin/integrations/IntegrationDocsModal";

// ─── Official Brand SVG Components ─────────────────────────────────────────

const WhatsAppLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.031 2.097c-5.517 0-9.997 4.48-9.997 9.997 0 1.764.462 3.473 1.332 4.978L2 22l5.143-1.35c1.464.798 3.102 1.218 4.772 1.218 5.517 0 9.997-4.48 9.997-9.997 0-5.517-4.48-9.997-9.997-9.997zm6.34 14.542c-.26.732-1.503 1.354-2.072 1.44-.504.076-1.161.13-1.84-.112-2.88-1.026-4.743-4.004-4.887-4.195-.143-.19-1.164-1.548-1.164-2.946 0-1.398.718-2.085 1.006-2.37.26-.26.575-.325.767-.325.19 0 .382.002.548.01.173.008.406-.065.635.497.26.635.885 2.15.962 2.306.077.156.128.338.026.545-.103.208-.155.338-.307.52-.153.18-.32.403-.457.541-.153.153-.312.32-.134.624.178.304.79 1.298 1.696 2.102.834.738 1.54 1.05 1.844 1.178.304.128.483.107.664-.1.181-.208.775-.902.983-1.212.208-.309.416-.26.702-.156.286.104 1.82.858 2.132 1.014.312.156.52.234.598.364s.078.96-.182 1.692z" />
  </svg>
);

const TallyLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#006699" />
    <path d="M7 7h10v2h-4v8h-2v-8H7V7z" fill="white" />
  </svg>
);

const GoogleDriveLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 3.5l4 7h-8l4-7z" fill="#00AA47" />
    <path d="M12.5 10.5l4 7h-8l4-7z" fill="#FFBA00" />
    <path d="M15.5 3.5l4 7h-8l4-7z" fill="#0066DA" />
  </svg>
);

const AWSS3Logo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
    <path d="M12 6c-3.31 0-6 2.69-6 6h2c0-2.21 1.79-4 4-4s4 1.79 4 4h2c0-3.31-2.69-6-6-6z" fill="#FF9900" />
  </svg>
);

const RazorpayLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M21.947 5.166l-2.181 3.527-2.181 3.527L10.364 24H0L11.564 3.754 13.745 0h8.202z" fill="#3395FF" />
  </svg>
);

const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState([
    { id: "whatsapp", name: "WhatsApp Business", category: "Communication", description: "Automated site updates and daily reports via WhatsApp.", status: "Connected", icon: WhatsAppLogo, color: "text-emerald-500", bgColor: "bg-emerald-50" },
    { id: "tally", name: "TallyPrime", category: "Accounting", description: "Seamless sync of material invoices and labor payments.", status: "Disconnected", icon: TallyLogo, color: "text-blue-600", bgColor: "bg-blue-50" },
    { id: "drive", name: "Google Drive", category: "Cloud Storage", description: "Sync project blueprints and site photos to cloud.", status: "Connected", icon: GoogleDriveLogo, color: "text-amber-500", bgColor: "bg-amber-50" },
    { id: "s3", name: "AWS S3", category: "Storage", description: "High-performance storage for AutoCAD and 3D files.", status: "Disconnected", icon: AWSS3Logo, color: "text-orange-500", bgColor: "bg-orange-50" },
    { id: "razorpay", name: "Razorpay", category: "Payments", description: "Direct payment integration for vendors and contractors.", status: "Disconnected", icon: RazorpayLogo, color: "text-indigo-600", bgColor: "bg-indigo-50" },
  ]);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isDocsModalOpen, setIsDocsModalOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  const toggleConnection = async (id: string) => {
    setConnectingId(id);
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIntegrations(prev => prev.map(int => {
      if (int.id === id) {
        const newStatus = int.status === "Connected" ? "Disconnected" : "Connected";
        if (newStatus === "Connected") toast.success(`${int.name} connected!`);
        else toast.error(`${int.name} disconnected.`);
        return { ...int, status: newStatus };
      }
      return int;
    }));
    setConnectingId(null);
  };

  return (
    <>
      <Navbar title="External Integrations" breadcrumb={["Admin", "Configuration", "Integrations"]} />

      <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
        <div>
          <div className="mb-10">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">Ecosystem & Add-ons</h1>
            <p className="text-slate-500 text-sm font-medium">Connect your existing tools to InfraPilot for a unified workflow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((int) => (
              <div key={int.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all overflow-hidden group">
                <div className="p-6 flex items-start gap-4">
                  <div className={`w-12 h-12 ${int.bgColor} ${int.color} rounded-xl flex items-center justify-center shadow-lg shadow-slate-200/50 shrink-0 group-hover:scale-110 transition-transform p-2.5`}>
                    <int.icon className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-bold text-slate-800 truncate">{int.name}</h3>
                        {int.status === "Connected" && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${int.status === "Connected" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                        }`}>
                        {int.status}
                      </span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">{int.category}</p>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed mb-6 line-clamp-2">
                      {int.description}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                      <button
                        onClick={() => { setSelectedIntegration(int); setIsDocsModalOpen(true); }}
                        className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
                      >
                        Documentation <ExternalLink className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => toggleConnection(int.id)}
                        disabled={connectingId !== null}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all min-w-[100px] flex items-center justify-center ${int.status === "Connected"
                            ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                            : "bg-primary/5 text-primary hover:bg-primary/10"
                          } ${connectingId === int.id ? "opacity-70" : ""}`}
                      >
                        {connectingId === int.id ? (
                          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          int.status === "Connected" ? "Disconnect" : "Connect Now"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Custom Integration Request Card */}
            <div
              onClick={() => setIsRequestModalOpen(true)}
              className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/40 hover:bg-white transition-all min-h-[200px]"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                <Plus className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-700 mb-1">Request Custom Integration</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1 justify-center">
                Enterprise Feature <HelpCircle className="w-3 h-3 text-slate-300" />
              </p>
            </div>
          </div>
        </div>
      </PageTransition>

      <RequestIntegrationModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
      />

      <IntegrationDocsModal
        isOpen={isDocsModalOpen}
        onClose={() => setIsDocsModalOpen(false)}
        integration={selectedIntegration}
      />
    </>
  );
};

export default IntegrationsPage;
