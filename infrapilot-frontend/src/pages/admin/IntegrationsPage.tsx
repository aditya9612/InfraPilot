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
import razorpayImage from "../../assets/razorpay.png";
import whatsappImage from "../../assets/images.jpeg";
import driveImage from "../../assets/download.png";
import tallyImage from "../../assets/tally-prime.png";
import awsImage from "../../assets/downloadaws.png";

// ─── Official Brand SVG Components ─────────────────────────────────────────

const WhatsAppLogo = ({ className }: { className?: string }) => (
  <img src={whatsappImage} alt="WhatsApp" className={className} />
);

const TallyLogo = ({ className }: { className?: string }) => (
  <img src={tallyImage} alt="TallyPrime" className={className} />
);

const GoogleDriveLogo = ({ className }: { className?: string }) => (
  <img src={driveImage} alt="Google Drive" className={className} />
);

const AWSS3Logo = ({ className }: { className?: string }) => (
  <img src={awsImage} alt="AWS" className={className} />
);

const RazorpayLogo = ({ className }: { className?: string }) => (
  <img src={razorpayImage} alt="Razorpay" className={className} />
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
