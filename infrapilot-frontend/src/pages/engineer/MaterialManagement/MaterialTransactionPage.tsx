import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import { materialService } from "../../../services/materialService";
import type { InventoryLog, Material } from "../../../types/material";
import toast from "react-hot-toast";
import {
    Truck,
    Clock,
    Search,
    Plus,
    Eye,
    Package,
    Activity,
    TrendingUp,
    AlertCircle,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";

const MaterialTransactionPage = () => {
    const location = useLocation();
    const isReceiptTab = location.pathname.includes('receipt');
    const [activeTab, setActiveTab] = useState<'RECEIPT' | 'CONSUMPTION'>(isReceiptTab ? 'RECEIPT' : 'CONSUMPTION');

    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modal States
    const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<InventoryLog | null>(null);

    // Form Data for Purchase
    const [purchaseForm, setPurchaseForm] = useState({
        material_id: '',
        quantity: '',
        amount_paid: '',
        project_id: '1',
        issue_type: 'SITE'
    });

    // Form Data for Usage
    const [usageForm, setUsageForm] = useState({
        material_id: '',
        quantity: '',
        project_id: '1',
        issue_type: 'SITE'
    });

    useEffect(() => {
        setActiveTab(isReceiptTab ? 'RECEIPT' : 'CONSUMPTION');
    }, [location.pathname]);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const userStr = localStorage.getItem("infrapilot_user");
            const user = userStr ? JSON.parse(userStr) : {};
            const pId = user?.project_id || user?.user?.project_id || 1;

            const [logsData, materialsData] = await Promise.all([
                materialService.getLogs({ 
                    type: activeTab === 'RECEIPT' ? 'PURCHASE' : 'USAGE',
                    project_id: Number(pId)
                }),
                materialService.listMaterials(Number(pId))
            ]);
            setLogs(logsData);
            setMaterials(materialsData);
        } catch (error) {
            toast.error("Failed to fetch ledger data");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePurchaseSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await materialService.addPurchase(Number(purchaseForm.material_id), {
                quantity: Number(purchaseForm.quantity),
                amount_paid: Number(purchaseForm.amount_paid),
                project_id: Number(purchaseForm.project_id),
                issue_type: purchaseForm.issue_type
            });
            toast.success("Purchase logged successfully");
            setIsPurchaseModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to log purchase");
        }
    };

    const handleUsageSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await materialService.addUsage(Number(usageForm.material_id), {
                quantity: Number(usageForm.quantity),
                project_id: Number(usageForm.project_id),
                issue_type: usageForm.issue_type
            });
            toast.success("Consumption logged successfully");
            setIsUsageModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to log usage");
        }
    };

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const material = materials.find(m => m.id === log.material_id);
            const matName = material?.material_name || "";
            return matName.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [logs, searchTerm, materials]);

    const stats = useMemo(() => {
        if (activeTab === 'RECEIPT') {
            return {
                title1: "Total Consignments",
                value1: logs.length.toString(),
                sub1: "Inbound Deliveries",
                icon1: <Truck className="w-5 h-5" />,
                accent1: "text-slate-800",
                
                title2: "Verified Inflow",
                value2: "₹" + logs.reduce((acc, curr) => acc + curr.total_amount, 0).toLocaleString(),
                sub2: "Fiscal Valuation",
                icon2: <Package className="w-5 h-5" />,
                accent2: "text-blue-500"
            };
        } else {
            return {
                title1: "Usage Intensity",
                value1: logs.length.toString(),
                sub1: "Total Outflow Logs",
                icon1: <TrendingUp className="w-5 h-5" />,
                accent1: "text-slate-800",
                
                title2: "Consumption Value",
                value2: "₹" + logs.reduce((acc, curr) => acc + curr.total_amount, 0).toLocaleString(),
                sub2: "Asset Expenditure",
                icon2: <Activity className="w-5 h-5" />,
                accent2: "text-rose-500"
            };
        }
    }, [logs, activeTab]);

    return (
        <>
            <Navbar 
                title={activeTab === 'RECEIPT' ? "Material Receipts Ledger" : "Material Consumption Tracker"} 
                breadcrumb={["Engineer", "Material", activeTab === 'RECEIPT' ? "Receipts" : "Consumption"]} 
            />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* --- Header & Action Buttons --- */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                            {activeTab === 'RECEIPT' ? "Procurement & Receipt Ledger" : "Inventory Outflow & Usage Registry"}
                        </h1>
                        <p className="text-slate-500 text-sm italic-none">
                            {activeTab === 'RECEIPT' 
                                ? "Monitor inbound material logistics and verify quality compliance upon arrival."
                                : "Monitor daily material expenditure across site activities with real-time stock impact."}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsPurchaseModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            Log Purchase
                        </button>
                        <button
                            onClick={() => setIsUsageModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
                        >
                            <Activity className="w-4 h-4" />
                            Log Usage
                        </button>
                    </div>
                </div>

                {/* --- Summary Stats --- */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title={stats.title1} value={stats.value1} sub={stats.sub1} accent={stats.accent1} icon={stats.icon1} />
                    <StatCard title={stats.title2} value={stats.value2} sub={stats.sub2} accent={stats.accent2} icon={stats.icon2} />
                    <StatCard title="Ledger Accuracy" value="99.4%" sub="System Health" accent="text-emerald-500" icon={<Clock className="w-5 h-5" />} />
                    <StatCard title="Alerts" value="02" sub="Immediate Attention" accent="text-rose-500" icon={<AlertCircle className="w-5 h-5" />} />
                </div>

                {/* --- Main Container --- */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    {/* Tab Switcher */}
                    <div className="flex border-b border-slate-100 px-6 bg-slate-50/30">
                        <button 
                            onClick={() => setActiveTab('RECEIPT')}
                            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'RECEIPT' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Material Receipts
                        </button>
                        <button 
                            onClick={() => setActiveTab('CONSUMPTION')}
                            className={`px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all border-b-2 ${activeTab === 'CONSUMPTION' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Material Consumption
                        </button>
                    </div>

                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                            <input 
                                type="text" 
                                placeholder="Search by material name..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter" 
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto font-inter">
                        <table className="w-full text-left font-inter">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Reference Log</th>
                                    <th className="px-6 py-4 font-inter">Material Entity</th>
                                    <th className="px-6 py-4 font-inter text-center">Transaction Delta</th>
                                    <th className="px-6 py-4 font-inter text-center">Financial Impact</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">Loading ledger entries...</td>
                                    </tr>
                                ) : filteredLogs.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm font-medium">No transaction records found.</td>
                                    </tr>
                                ) : filteredLogs.map((log) => {
                                    const material = materials.find(m => m.id === log.material_id);
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col font-inter">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-inter italic-none">Ref: LOG#{log.id}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{new Date(log.created_at).toLocaleDateString()} • {log.issue_type}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3 font-inter">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTab === 'RECEIPT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                                        {activeTab === 'RECEIPT' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                    </div>
                                                    <div className="flex flex-col font-inter">
                                                        <span className="text-sm font-bold text-slate-800 font-inter uppercase">{material?.material_name || "Unknown Asset"}</span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase font-inter">{material?.category || "N/A"}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-xs font-bold tabular-nums font-inter ${activeTab === 'RECEIPT' ? 'text-emerald-600' : 'text-rose-500'}`}>
                                                    {activeTab === 'RECEIPT' ? '+' : '-'}{log.quantity} {material?.unit}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-bold text-slate-700 tabular-nums font-inter">
                                                    ₹{log.total_amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    onClick={() => setSelectedLog(log)} 
                                                    className={`p-2 text-white rounded-xl shadow-lg transition-all active:scale-95 font-inter ${activeTab === 'RECEIPT' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`} 
                                                    title="View Intelligence"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            {/* --- Purchase Modal --- */}
            <Modal isOpen={isPurchaseModalOpen} onClose={() => setIsPurchaseModalOpen(false)} title="Log New Purchase Consignment" maxWidth="max-w-2xl">
                <form onSubmit={handlePurchaseSubmit} className="p-8 space-y-8 font-inter">
                    {/* Logistical Section */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            Procurement Details
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Select Material Asset *</label>
                                <select 
                                    value={purchaseForm.material_id} 
                                    onChange={(e) => setPurchaseForm({...purchaseForm, material_id: e.target.value})} 
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-inter"
                                    required
                                >
                                    <option value="">Choose material...</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>{m.material_name} ({m.material_code})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Quantity *</label>
                                    <input 
                                        type="number" 
                                        value={purchaseForm.quantity} 
                                        onChange={(e) => setPurchaseForm({...purchaseForm, quantity: e.target.value})} 
                                        placeholder="0.00" 
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-inter" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Amount Paid *</label>
                                    <input 
                                        type="number" 
                                        value={purchaseForm.amount_paid} 
                                        onChange={(e) => setPurchaseForm({...purchaseForm, amount_paid: e.target.value})} 
                                        placeholder="25000" 
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-inter" 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Administrative Section */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            Administrative Context
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Project ID *</label>
                                <input 
                                    type="number" 
                                    value={purchaseForm.project_id} 
                                    onChange={(e) => setPurchaseForm({...purchaseForm, project_id: e.target.value})} 
                                    placeholder="1" 
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-inter" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Issue Type *</label>
                                <select 
                                    value={purchaseForm.issue_type} 
                                    onChange={(e) => setPurchaseForm({...purchaseForm, issue_type: e.target.value})} 
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-inter"
                                    required
                                >
                                    <option value="SITE">SITE</option>
                                    <option value="SYSTEM">SYSTEM</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                        <button type="submit" className="px-10 py-4 bg-emerald-600 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all active:scale-95">
                            Authorize Purchase
                        </button>
                    </div>
                </form>
            </Modal>

            {/* --- Usage Modal --- */}
            <Modal isOpen={isUsageModalOpen} onClose={() => setIsUsageModalOpen(false)} title="Record Inventory Outflow" maxWidth="max-w-2xl">
                <form onSubmit={handleUsageSubmit} className="p-8 space-y-8 font-inter">
                    {/* Execution Section */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                            Consumption Details
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Select Material Asset *</label>
                                <select 
                                    value={usageForm.material_id} 
                                    onChange={(e) => setUsageForm({...usageForm, material_id: e.target.value})} 
                                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-inter"
                                    required
                                >
                                    <option value="">Choose material...</option>
                                    {materials.map(m => (
                                        <option key={m.id} value={m.id}>{m.material_name} ({m.material_code})</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Quantity *</label>
                                    <input 
                                        type="number" 
                                        value={usageForm.quantity} 
                                        onChange={(e) => setUsageForm({...usageForm, quantity: e.target.value})} 
                                        placeholder="0.00" 
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-inter" 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Project ID *</label>
                                    <input 
                                        type="number" 
                                        value={usageForm.project_id} 
                                        onChange={(e) => setUsageForm({...usageForm, project_id: e.target.value})} 
                                        placeholder="1" 
                                        className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-inter" 
                                        required 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Operational Context */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                        <h3 className="text-[13px] font-black text-slate-800 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                            Operational Context
                        </h3>
                        
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Issue Type *</label>
                            <select 
                                value={usageForm.issue_type} 
                                onChange={(e) => setUsageForm({...usageForm, issue_type: e.target.value})} 
                                className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-inter"
                                required
                            >
                                <option value="SITE">SITE</option>
                                <option value="SYSTEM">SYSTEM</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                        <button type="button" onClick={() => setIsUsageModalOpen(false)} className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">Cancel</button>
                        <button type="submit" className="px-10 py-4 bg-rose-500 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95">
                            Authorize Usage
                        </button>
                    </div>
                </form>
            </Modal>

            {/* --- Log Insight Modal --- */}
            <Modal isOpen={!!selectedLog} onClose={() => setSelectedLog(null)} title="Transaction Intelligence Insight" maxWidth="max-w-2xl">
                {selectedLog && (
                    <div className="p-6 font-inter text-inter italic-none">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 font-inter">Inventory Transaction Ledger</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6 font-inter">
                                    {materials.find(m => m.id === selectedLog.material_id)?.material_name}
                                </h3>
                                <div className="grid grid-cols-2 gap-4 font-inter">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Quantity Delta</p>
                                        <p className={`text-lg font-black font-inter italic-none ${selectedLog.type === 'PURCHASE' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {selectedLog.type === 'PURCHASE' ? '+' : '-'}{selectedLog.quantity}
                                        </p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Financial Impact</p>
                                        <p className="text-lg font-black font-inter italic-none">₹{selectedLog.total_amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8 px-2 mb-10 font-inter">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 font-inter">Audit Traceability</p>
                                <div className="grid grid-cols-2 gap-6 font-inter">
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Logged Date</p>
                                        <p className="text-sm font-black text-slate-800 font-inter">{new Date(selectedLog.created_at).toLocaleString()}</p>
                                    </div>
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 font-inter">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 font-inter">Issue Context</p>
                                        <p className="text-sm font-black text-slate-800 font-inter uppercase">{selectedLog.issue_type}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onClick={() => setSelectedLog(null)} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all font-inter">Dismiss Insight</button>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default MaterialTransactionPage;
