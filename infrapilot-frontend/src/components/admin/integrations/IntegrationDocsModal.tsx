import { CheckCircle2, BookOpen, Settings2, Zap } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  integration: {
    id: string;
    name: string;
    category: string;
    description: string;
    icon: string;
    color: string;
  } | null;
}

const IntegrationDocsModal = ({ isOpen, onClose, integration }: Props) => {
  if (!isOpen || !integration) return null;

  const getDocsContent = (id: string) => {
    const contents: Record<string, { setup: string[]; features: string[]; note: string }> = {
      whatsapp: {
        setup: [
          "Obtain WhatsApp Business API credentials via Meta Developer Portal.",
          "Configure Webhook URL in InfraPilot Settings to receive message status.",
          "Verify your business phone number and display name.",
        ],
        features: [
          "Automated daily site progress reports to stakeholders.",
          "Real-time material arrival alerts for site engineers.",
          "Direct communication bridge between clients and project managers.",
        ],
        note: "Requires a verified Meta Business Account and active credit line for messaging.",
      },
      tally: {
        setup: [
          "Install the InfraPilot-Tally Connector on your local Tally ERP instance.",
          "Map your Tally Ledgers to InfraPilot Project Cost Categories.",
          "Enable 'ODBC' and 'Local Tally Server' settings in TallyPrime.",
        ],
        features: [
          "One-click sync of material purchase orders to Tally vouchers.",
          "Automatic labor payment entries in Tally 'Payment' registers.",
          "Real-time cost reconciliation between site expenses and accounting books.",
        ],
        note: "Supports TallyPrime 2.0 and above with active Tally.NET subscription.",
      },
      drive: {
        setup: [
          "Authorize Google Drive API access via the 'Connect' button.",
          "Select the root 'Project Folder' in your Drive directory.",
          "Configure sub-folder structures for Blueprints, Photos, and Invoices.",
        ],
        features: [
          "Automatic backup of all site photos uploaded to InfraPilot.",
          "Direct sync of PDF blueprints for offline viewing on mobile.",
          "Collaborative document editing via Google Workspace integration.",
        ],
        note: "Storage limits depend on your Google Workspace organization plan.",
      },
      s3: {
        setup: [
          "Generate AWS IAM Access Key and Secret Key with S3 Put/Get permissions.",
          "Provide your S3 Bucket Name and Region (e.g., ap-south-1).",
          "Set up Lifecycle Policies for automatic archival of old project files.",
        ],
        features: [
          "Ultra-fast storage for heavy AutoCAD (DXF/DWG) and 3D BIM models.",
          "Cloud-native image resizing and optimization for site photos.",
          "Multi-region data redundancy for critical project documentation.",
        ],
        note: "Optimized for large files and high-concurrency access patterns.",
      },
      razorpay: {
        setup: [
          "Copy API Key and Secret Key from your Razorpay Dashboard (Settings > API Keys).",
          "Enable 'Standard Checkout' and 'Payouts' features.",
          "Set up the Webhook Secret to verify transaction signatures.",
        ],
        features: [
          "Direct vendor payments via UPI, NEFT, and Net Banking.",
          "Automated payout releases based on site milestone approvals.",
          "Instant settlement of petty cash expenses for site engineers.",
        ],
        note: "Transaction fees apply as per your Razorpay business agreement.",
      },
    };

    return contents[id] || {
      setup: ["Contact InfraPilot support for custom integration setup."],
      features: ["Advanced workflow automation tailored to your business needs."],
      note: "Documentation for this module is currently being updated.",
    };
  };

  const docs = getDocsContent(integration.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-white/20 font-inter flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-10 pb-6 shrink-0">
          <div className="flex items-center gap-5">
            <div className={`w-16 h-16 ${integration.color} text-white rounded-2xl flex items-center justify-center text-3xl shadow-xl shrink-0`}>
              {integration.icon}
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-2">
                {integration.name}
              </h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="w-3 h-3 text-primary" />
                Technical Implementation Guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-[1.2rem] transition-all"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-10 pt-4 overflow-y-auto custom-scrollbar flex-1 space-y-10">
          {/* Summary */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Integration Summary
            </h4>
            <p className="text-sm text-slate-600 font-medium leading-relaxed">
              {integration.description} This integration allows InfraPilot to seamlessly exchange data with {integration.name}, improving operational efficiency and reducing manual data entry.
            </p>
          </div>

          {/* Setup Steps */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings2 className="w-3.5 h-3.5 text-primary" />
              Configuration Checklist
            </h4>
            <div className="space-y-3">
              {docs.setup.map((step, i) => (
                <div key={i} className="flex items-start gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-100 hover:border-primary/20 transition-colors">
                  <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black text-primary shrink-0 shadow-sm">
                    {i + 1}
                  </span>
                  <p className="text-xs text-slate-600 font-bold leading-normal">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Features */}
          <div>
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Operational Capabilities
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {docs.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <p className="text-xs text-slate-600 font-semibold">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Important Note */}
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-2">
               <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
               <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Requirement Note</span>
            </div>
            <p className="text-[11px] text-amber-700 font-bold leading-relaxed italic">
              "{docs.note}"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-10 py-8 border-t border-slate-50 bg-[#fbfcff] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-4 bg-slate-800 text-white rounded-2xl text-sm font-black shadow-xl hover:bg-slate-900 transition-all active:scale-[0.98]"
          >
            I Understand, Return to Integrations
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntegrationDocsModal;
