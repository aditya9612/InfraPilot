import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import {
    User, Building2, Mail, Phone, Briefcase, FileText, MessageCircle,
    Send, Upload, Trash2, PlusCircle, ArrowLeft,
    ClipboardList, CreditCard
} from "lucide-react";
import toast from "react-hot-toast";
import { userService } from "../../services/userService";

// ─── Mocked data (to be replaced with API) ───────────────────────────────────

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
    { id: "overview", label: "Overview", icon: User },
    { id: "ledger", label: "Financial Ledger", icon: CreditCard },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "comms", label: "Communication", icon: MessageCircle },
];

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ client, onSaveNotes }: any) {
    const [notes, setNotes] = useState(client.notes ?? "");
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact Information</h3>
                <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={client.email} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Mobile" value={client.mobile} />
                <InfoRow icon={<Building2 className="w-4 h-4" />} label="Company" value={client.company} />
                <InfoRow icon={<User className="w-4 h-4" />} label="Address" value={client.address} />
                <InfoRow icon={<ClipboardList className="w-4 h-4" />} label="GSTIN" value={client.gst} />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Project & Status</h3>
                <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Linked Project" value={client.project} />
                <div className="flex items-center gap-3 pt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${client.status === "Active" ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                        }`}>{client.status}</span>
                </div>
                <div className="space-y-2 pt-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Notes</p>
                    <textarea
                        rows={4}
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        placeholder="Add internal notes about this client..."
                    />
                    <button
                        onClick={() => { onSaveNotes(notes); toast.success("Notes saved!"); }}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all"
                    >Save Notes</button>
                </div>
            </div>
        </div>
    );
}

// ─── Financial Ledger Tab ─────────────────────────────────────────────────────
function LedgerTab({ client, navigate }: any) {
    const [invoices, setInvoices] = useState(client.invoices ?? []);
    const totalBilled = invoices.reduce((s: number, i: any) => s + i.amount, 0);
    const totalReceived = invoices.filter((i: any) => i.status === "Paid").reduce((s: number, i: any) => s + i.amount, 0);
    const outstanding = totalBilled - totalReceived;

    const handleMarkPaid = (id: string) => {
        setInvoices((prev: any[]) => prev.map(i => i.id === id ? { ...i, status: "Paid" } : i));
        toast.success("Invoice marked as paid.");
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
                <SummaryCard label="Total Billed" value={`₹${totalBilled.toLocaleString()}`} color="text-slate-800" />
                <SummaryCard label="Received" value={`₹${totalReceived.toLocaleString()}`} color="text-emerald-600" />
                <SummaryCard label="Outstanding" value={`₹${outstanding.toLocaleString()}`} color="text-rose-500" />
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-700">Invoice History</h3>
                    <button
                        onClick={() => navigate("/admin/invoices/create")}
                        className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-blue-600 transition-all"
                    >
                        <PlusCircle className="w-3.5 h-3.5" /> Create Invoice
                    </button>
                </div>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                            <th className="px-6 py-3">Invoice No</th>
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Amount</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {invoices.map((inv: any) => (
                            <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-3 font-bold text-slate-700">{inv.id}</td>
                                <td className="px-6 py-3 text-slate-500 text-xs">{inv.date}</td>
                                <td className="px-6 py-3 font-bold text-slate-800">₹{inv.amount.toLocaleString()}</td>
                                <td className="px-6 py-3">
                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${inv.status === "Paid" ? "bg-emerald-100 text-emerald-600" :
                                        inv.status === "Overdue" ? "bg-rose-100 text-rose-600" :
                                            "bg-amber-100 text-amber-600"
                                        }`}>{inv.status}</span>
                                </td>
                                <td className="px-6 py-3 text-right">
                                    {inv.status !== "Paid" && (
                                        <button
                                            onClick={() => handleMarkPaid(inv.id)}
                                            className="text-xs font-bold text-emerald-600 hover:underline"
                                        >Mark Paid</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {invoices.length === 0 && (
                    <div className="p-12 text-center text-slate-400 text-sm">No invoices yet.</div>
                )}
            </div>
        </div>
    );
}

// ─── Documents Tab ────────────────────────────────────────────────────────────
const DOC_CATEGORIES = ["Contract", "Agreement", "Invoice", "Site Photo", "Other"];

function DocumentsTab({ client }: any) {
    const [docs, setDocs] = useState(client.documents ?? []);
    const [category, setCategory] = useState("Contract");

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const newDoc = {
            id: `d${Date.now()}`, name: file.name, category,
            date: new Date().toISOString().split("T")[0],
            size: `${(file.size / 1024).toFixed(0)} KB`,
        };
        setDocs((prev: any[]) => [newDoc, ...prev]);
        toast.success(`${file.name} uploaded successfully!`);
        e.target.value = "";
    };

    const handleDelete = (id: string) => {
        setDocs((prev: any[]) => prev.filter((d: any) => d.id !== id));
        toast.success("Document removed.");
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="text-sm font-black text-slate-700 mb-4">Upload Document</h3>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                    >
                        {DOC_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <label className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold cursor-pointer hover:bg-blue-600 transition-all">
                        <Upload className="w-4 h-4" /> Choose File
                        <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50">
                    <h3 className="text-sm font-black text-slate-700">Uploaded Documents ({docs.length})</h3>
                </div>
                {docs.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm">No documents uploaded yet.</div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-50">
                                <th className="px-6 py-3">File Name</th>
                                <th className="px-6 py-3">Category</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Size</th>
                                <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {docs.map((d: any) => (
                                <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-3 font-semibold text-slate-700 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" /> {d.name}
                                    </td>
                                    <td className="px-6 py-3">
                                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">{d.category}</span>
                                    </td>
                                    <td className="px-6 py-3 text-slate-400 text-xs">{d.date}</td>
                                    <td className="px-6 py-3 text-slate-400 text-xs">{d.size}</td>
                                    <td className="px-6 py-3 text-right">
                                        <button onClick={() => handleDelete(d.id)} className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

// ─── Communication Tab ────────────────────────────────────────────────────────
function CommunicationTab({ client }: any) {
    const [log, setLog] = useState(client.communications ?? []);

    const handleWhatsApp = () => {
        const msg = `*Hello ${client.name}*,\n\nThis is a message from InfraPilot regarding your project *${client.project}*.\n\nFor any queries, please feel free to reach out.\n\nRegards,\nInfraPilot Team`;
        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
        setLog((prev: any[]) => [{
            id: `c${Date.now()}`, type: "WhatsApp",
            date: new Date().toLocaleString(), preview: "General message sent.",
        }, ...prev]);
        toast.success("WhatsApp opened.");
    };

    const handleEmail = () => {
        const subject = `Message from InfraPilot — ${client.project}`;
        const body = `Dear ${client.name},\n\nThis is a message from InfraPilot regarding your project ${client.project}.\n\nRegards,\nInfraPilot Team`;
        window.location.href = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setLog((prev: any[]) => [{
            id: `c${Date.now()}`, type: "Email",
            date: new Date().toLocaleString(), preview: subject,
        }, ...prev]);
        toast.success("Email client opened.");
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col sm:flex-row gap-4">
                <button onClick={handleWhatsApp} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition-all">
                    <MessageCircle className="w-4 h-4" /> Send WhatsApp
                </button>
                <button onClick={handleEmail} className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all">
                    <Send className="w-4 h-4" /> Send Email
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-50">
                    <h3 className="text-sm font-black text-slate-700">Communication History</h3>
                </div>
                {log.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 text-sm">No communications logged yet.</div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {log.map((c: any) => (
                            <div key={c.id} className="px-6 py-4 flex items-start gap-4 hover:bg-slate-50/50 transition-colors">
                                <span className={`mt-0.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0 ${c.type === "WhatsApp" ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600"
                                    }`}>{c.type}</span>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700">{c.preview}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{c.date}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}


// ─── Shared helpers ───────────────────────────────────────────────────────────
function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 text-primary">{icon}</div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-semibold text-slate-700">{value || "—"}</p>
            </div>
        </div>
    );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const ClientDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("overview");
    const [client, setClient] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchClientData = async () => {
            if (!id) return;
            try {
                setIsLoading(true);
                const u = await userService.getUserById(parseInt(id));

                // Map API user to the expected client structure
                const mappedClient = {
                    id: u.user_id,
                    name: u.full_name,
                    company: u.designation || "N/A",
                    email: u.email,
                    mobile: u.mobile_number,
                    project: u.address || "No Project Linked",
                    status: u.is_active ? "Active" : "Inactive",
                    address: u.address || "No Address Provided",
                    gst: u.pan_number || "—", // Using PAN as placeholder for GST if not available
                    notes: "VIP client. Prefers WhatsApp updates.", // Keep original mock notes or set to empty
                    portalEnabled: u.is_active,
                    invoices: [], // These would normally come from a different service
                    documents: [],
                    communications: [],
                };

                setClient(mappedClient);
            } catch (error) {
                console.error("Failed to fetch client:", error);
                toast.error("Failed to load client details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchClientData();
    }, [id]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading client intelligence...</p>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center h-screen gap-4">
                <p className="text-slate-500 text-lg font-semibold">Client not found.</p>
                <button onClick={() => navigate("/admin/clients")} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold hover:bg-blue-600 transition-all">
                    Back to Clients
                </button>
            </div>
        );
    }

    const handleSaveNotes = (notes: string) => {
        setClient((prev: any) => ({ ...prev, notes }));
    };

    return (
        <>
            <Navbar title="Client Profile" breadcrumb={["Admin", "Clients", client.name]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen">

                {/* Back button + Hero Header */}
                <div className="mb-6">
                    <button onClick={() => navigate("/admin/clients")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-primary transition-colors mb-4 font-semibold">
                        <ArrowLeft className="w-4 h-4" /> Back to Clients
                    </button>

                    <div className="relative overflow-hidden bg-gradient-to-br from-primary to-blue-700 rounded-3xl p-8 text-white shadow-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl -ml-16 -mb-16" />
                        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-3xl font-black shrink-0">
                                {client.name.charAt(0)}
                            </div>
                            <div className="text-center sm:text-left">
                                <div className="flex flex-col sm:flex-row items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-black tracking-tight">{client.name}</h1>
                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/20 border border-white/20`}>
                                        {client.status}
                                    </span>
                                </div>
                                <p className="text-white/80 text-sm">{client.company}</p>
                                <p className="text-white/60 text-xs mt-1">{client.project}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1.5 shadow-sm mb-6 overflow-x-auto">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" /> {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Tab Content */}
                {activeTab === "overview" && <OverviewTab client={client} onSaveNotes={handleSaveNotes} />}
                {activeTab === "ledger" && <LedgerTab client={client} navigate={navigate} />}
                {activeTab === "documents" && <DocumentsTab client={client} />}
                {activeTab === "comms" && <CommunicationTab client={client} />}

            </PageTransition>
        </>
    );
};

export default ClientDetailPage;
