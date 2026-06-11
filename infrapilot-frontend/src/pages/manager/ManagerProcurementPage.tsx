import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import StatCard from "../../components/common/StatCard";
import { 
  ShoppingCart, 
  ClipboardList, 
  FileText, 
  Plus, 
  Filter, 
  Search,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Download,
  Calendar
} from "lucide-react";

const ManagerProcurementPage = () => {
    const navigate = useNavigate();
    const { tab } = useParams();
    const activeTab = tab || "material";

    const tabs = [
        { id: "material", label: "Material Requests", icon: <Package className="w-4 h-4" /> },
        { id: "purchase-req", label: "Purchase Requests", icon: <ClipboardList className="w-4 h-4" /> },
        { id: "purchase-order", label: "Purchase Orders", icon: <ShoppingCart className="w-4 h-4" /> },
    ];

    const handleTabChange = (tabId: string) => {
        navigate(`/manager/procurement/${tabId}`);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <Navbar 
                title="Procurement Management" 
                breadcrumb={["Manager", "Procurement", tabs.find(t => t.id === activeTab)?.label || "Material Requests"]} 
            />

            <PageTransition className="p-6 lg:p-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Supply Chain Orchestrator</h1>
                        <p className="text-slate-500 mt-1">Manage material lifecycles from requisition to fulfillment.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all shadow-sm">
                            <Download className="w-4 h-4 text-primary" />
                            Export
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition-all shadow-lg shadow-primary/20">
                            <Plus className="w-4 h-4" />
                            New {activeTab === "material" ? "Request" : activeTab === "purchase-req" ? "Purchase Req" : "Order"}
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard 
                        title="Pending Requests" 
                        value="12" 
                        sub="Awaiting review" 
                        accent="text-amber-500"
                        icon={<Clock className="w-5 h-5 text-amber-500" />}
                    />
                    <StatCard 
                        title="Open Orders" 
                        value="08" 
                        sub="In transit/Delivery" 
                        accent="text-primary"
                        icon={<ShoppingCart className="w-5 h-5 text-primary" />}
                    />
                    <StatCard 
                        title="Delivered (MTD)" 
                        value="45" 
                        sub="This month" 
                        accent="text-emerald-500"
                        icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    />
                    <StatCard 
                        title="Procurement Spend" 
                        value="₹4.2M" 
                        sub="Budget utilization: 68%" 
                        accent="text-slate-900"
                        icon={<FileText className="w-5 h-5 text-slate-700" />}
                    />
                </div>

                {/* Tab Navigation */}
                <div className="flex p-1 bg-slate-200/50 backdrop-blur-sm rounded-2xl mb-8 w-fit border border-white/50 shadow-inner">
                    {tabs.map((t) => (
                        <button
                            key={t.id}
                            onClick={() => handleTabChange(t.id)}
                            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                                activeTab === t.id 
                                ? "text-primary bg-white shadow-sm" 
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                            }`}
                        >
                            <span className="relative z-10">{t.icon}</span>
                            <span className="relative z-10">{t.label}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        {activeTab === "material" && <MaterialRequestsView />}
                        {activeTab === "purchase-req" && <PurchaseRequestsView />}
                        {activeTab === "purchase-order" && <PurchaseOrdersView />}
                    </motion.div>
                </AnimatePresence>
            </PageTransition>
        </div>
    );
};

const MaterialRequestsView = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-4">
                <h3 className="font-bold text-slate-800">Material Requisitions</h3>
                <div className="flex bg-white border border-slate-200 rounded-lg px-3 py-1.5 items-center gap-2">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input type="text" placeholder="Search requests..." className="bg-transparent border-none outline-none text-xs w-48" />
                </div>
            </div>
            <button className="text-slate-500 hover:text-slate-700">
                <Filter className="w-4 h-4" />
            </button>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50/50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                        <li className="p-4 list-none">Request ID</li>
                        <th className="p-4 font-bold">Material / Category</th>
                        <th className="p-4 font-bold">Site / Project</th>
                        <th className="p-4 font-bold">Quantity</th>
                        <th className="p-4 font-bold">Priority</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {[
                        { id: "MR-8429", name: "OPC Cement 53 Grade", cat: "Civil", site: "Skyline Residency", qty: "500 Bags", priority: "High", status: "Pending", date: "2h ago" },
                        { id: "MR-8430", name: "TMT Steel 12mm", cat: "Structural", site: "Metro Ph-II", qty: "4.5 Tons", priority: "Critical", status: "Under Review", date: "5h ago" },
                        { id: "MR-8431", name: "Electrical Conduits", cat: "MEP", site: "Coastal Bridge", qty: "1200 Mtrs", priority: "Medium", status: "Approved", date: "Yesterday" },
                        { id: "MR-8432", name: "River Sand (Screened)", cat: "Civil", site: "Green Valley", qty: "3 Trucks", priority: "Low", status: "Rejected", date: "2 days ago" },
                    ].map((req, i) => (
                        <tr key={i} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="p-4">
                                <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded-md">{req.id}</span>
                                <div className="text-[10px] text-slate-400 mt-1">{req.date}</div>
                            </td>
                            <td className="p-4">
                                <div className="text-sm font-bold text-slate-800">{req.name}</div>
                                <div className="text-xs text-slate-500">{req.cat}</div>
                            </td>
                            <td className="p-4 text-xs font-semibold text-slate-600">{req.site}</td>
                            <td className="p-4 text-xs font-bold text-slate-800">{req.qty}</td>
                            <td className="p-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    req.priority === "Critical" ? "bg-rose-50 text-rose-600" :
                                    req.priority === "High" ? "bg-amber-50 text-amber-600" :
                                    "bg-blue-50 text-primary"
                                }`}>{req.priority}</span>
                            </td>
                            <td className="p-4">
                                <span className={`flex items-center gap-1.5 text-[11px] font-bold ${
                                    req.status === "Approved" ? "text-emerald-600" :
                                    req.status === "Rejected" ? "text-rose-600" :
                                    req.status === "Under Review" ? "text-blue-600" : "text-amber-500"
                                }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                        req.status === "Approved" ? "bg-emerald-500" :
                                        req.status === "Rejected" ? "bg-rose-500" :
                                        req.status === "Under Review" ? "bg-blue-500" : "bg-amber-400"
                                    }`} />
                                    {req.status}
                                </span>
                            </td>
                            <td className="p-4 text-right">
                                <button className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-400">
                                    <MoreVertical className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const PurchaseRequestsView = () => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
                {[
                    { id: "PR-2024-001", title: "Bulk Steel Procurement - Q3", vendor: "Multiple Quotations", amount: "₹1,240,000", status: "RFQ Sent", items: 3 },
                    { id: "PR-2024-002", title: "Finishing Materials for Block A", vendor: "Home Decor Pvt Ltd", amount: "₹450,000", status: "Pending Approval", items: 12 },
                    { id: "PR-2024-003", title: "Electrical Substation Components", vendor: "Volt-Tech Solutions", amount: "₹2,800,000", status: "Technical Review", items: 5 },
                ].map((pr, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ClipboardList className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-widest">{pr.id}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                            pr.status === "RFQ Sent" ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                                        }`}>{pr.status}</span>
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-800">{pr.title}</h4>
                                    <p className="text-xs text-slate-500">Proposed Vendor: <span className="font-semibold text-slate-700">{pr.vendor}</span></p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-slate-900">{pr.amount}</div>
                                <div className="text-[10px] text-slate-400">{pr.items} items listed</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                            <div className="flex items-center gap-4">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(j => (
                                        <div key={j} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold text-slate-500">U{j}</div>
                                    ))}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium italic">3 stakeholders viewed</div>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200">View Details</button>
                                <button className="px-4 py-1.5 text-[11px] font-bold text-white bg-primary hover:bg-blue-600 rounded-lg transition-all shadow-sm shadow-primary/20">Convert to PO</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-4">Procurement Funnel</h3>
                    <div className="space-y-6">
                        {[
                            { label: "Draft Requests", count: 8, color: "bg-slate-200", percent: 100 },
                            { label: "Market Quotations", count: 5, color: "bg-blue-400", percent: 65 },
                            { label: "Manager Review", count: 3, color: "bg-primary", percent: 40 },
                            { label: "Approved POs", count: 12, color: "bg-emerald-500", percent: 85 },
                        ].map((item, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-[11px] font-bold mb-2">
                                    <span className="text-slate-500">{item.label}</span>
                                    <span className="text-slate-900">{item.count} Orders</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.percent}%` }}
                                        className={`h-full ${item.color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="bg-gradient-to-br from-primary to-blue-700 p-6 rounded-2xl shadow-lg shadow-primary/30 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                        <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="font-bold mb-2">Budget Alert</h4>
                    <p className="text-xs text-white/80 leading-relaxed mb-6">Structural steel costs have risen by 12% in the last 14 days. Consider bulk booking to avoid future variance.</p>
                    <button className="w-full py-2 bg-white text-primary text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors">Analyze Market Trends</button>
                </div>
            </div>
        </div>
    </div>
);

const PurchaseOrdersView = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Master Purchase Orders</h3>
                <p className="text-sm text-slate-500 mt-0.5">Tracking all outgoing orders and fulfillment status.</p>
            </div>
            <div className="flex gap-2">
                <button className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50">
                    <Filter className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 border border-slate-200">
                    <Calendar className="w-4 h-4" />
                    This Quarter
                </div>
            </div>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                    <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        <th className="p-4">Order Details</th>
                        <th className="p-4">Vendor Info</th>
                        <th className="p-4">Delivery Timeline</th>
                        <th className="p-4">Value</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Progress</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {[
                        { id: "PO-9001", title: "Batch 4 Concrete Reinforcement", vendor: "Metro Steel Traders", date: "June 12, 2024", timeline: "June 25", value: "₹845,000", status: "Dispatched", progress: 65 },
                        { id: "PO-9005", title: "Flooring Tiles - Master Wing", vendor: "Ceramics Landmark", date: "June 10, 2024", timeline: "June 18", value: "₹320,000", status: "Delayed", progress: 20 },
                        { id: "PO-8992", title: "Paint & Protective Coatings", vendor: "Asian Paints Depot", date: "June 05, 2024", timeline: "June 14", value: "₹185,000", status: "Fulfilled", progress: 100 },
                        { id: "PO-9012", title: "Sanitary Fixtures Set B", vendor: "Jaguar Fittings", date: "June 15, 2024", timeline: "July 05", value: "₹1,250,000", status: "Processing", progress: 5 },
                    ].map((po, i) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-1 block">{po.id}</span>
                                <div className="text-sm font-bold text-slate-800">{po.title}</div>
                                <div className="text-[10px] text-slate-500 mt-1">Created on {po.date}</div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 uppercase">{po.vendor.charAt(0)}</div>
                                    <div className="text-xs font-bold text-slate-700">{po.vendor}</div>
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                                    Expected: {po.timeline}
                                </div>
                            </td>
                            <td className="p-4 text-sm font-black text-slate-900">{po.value}</td>
                            <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    po.status === "Fulfilled" ? "bg-emerald-100 text-emerald-600" :
                                    po.status === "Delayed" ? "bg-rose-100 text-rose-600" :
                                    po.status === "Dispatched" ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"
                                }`}>{po.status}</span>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-3 justify-end">
                                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${po.status === "Delayed" ? "bg-rose-500" : "bg-primary"}`} style={{ width: `${po.progress}%` }} />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-700 w-8">{po.progress}%</span>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-center">
            <button className="text-xs font-bold text-primary hover:underline">Download Procurement Summary Report</button>
        </div>
    </div>
);

export default ManagerProcurementPage;
