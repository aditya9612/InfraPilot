import { useState, useMemo } from "react";
import PageTransition from "../../../components/common/PageTransition";
import Navbar from "../../../components/common/Navbar";
import StatCard from "../../../components/common/StatCard";
import Modal from "../../../components/common/Modal";
import ConfirmModal from "../../../components/common/ConfirmModal";
import toast from "react-hot-toast";
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  Filter,
  FileText,
  Package
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface MaterialReceipt {
    id: number;
    materialName: string;
    unit: string;
    openingStock: number;
    receivedQuantity: number;
    usedQuantity: number;
    closingStock: number;
    supplier: string;
    billNumber: string;
    date: string;
    location: string;
    totalAmount: number;
    paymentStatus: "Paid" | "Pending" | "Partial";
    verificationStatus: "Verified" | "Pending QC";
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockReceipts: MaterialReceipt[] = [
    {
        id: 1,
        materialName: "UltraTech Cement",
        unit: "Bag",
        openingStock: 1000,
        receivedQuantity: 500,
        usedQuantity: 120,
        closingStock: 1380,
        supplier: "Global Builders",
        billNumber: "INV-2026-001",
        date: "2026-04-14",
        location: "Main Store",
        totalAmount: 175000,
        paymentStatus: "Paid",
        verificationStatus: "Verified",
    },
    {
        id: 2,
        materialName: "TMT Steel 12mm",
        unit: "Ton",
        openingStock: 15,
        receivedQuantity: 5.5,
        usedQuantity: 2.1,
        closingStock: 18.4,
        supplier: "Tata Steel Ltd",
        billNumber: "BILL-5590",
        date: "2026-04-13",
        location: "Yard B",
        totalAmount: 320000,
        paymentStatus: "Partial",
        verificationStatus: "Pending QC",
    },
];

const initialFormData = {
    materialName: "",
    unit: "Bag",
    receivedQuantity: "",
    supplier: "",
    billNumber: "",
    totalAmount: "",
    location: "Main Store",
};

const MaterialReceiptPage = () => {
    const [receipts, setReceipts] = useState<MaterialReceipt[]>(mockReceipts);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("All Status");

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formMode, setFormMode] = useState<"create" | "edit">("create");
    const [formData, setFormData] = useState(initialFormData);
    const [selectedReceipt, setSelectedReceipt] = useState<MaterialReceipt | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [receiptToDelete, setReceiptToDelete] = useState<number | null>(null);

    const filteredReceipts = useMemo(() => {
        return receipts.filter(r => {
            const matchesSearch = r.materialName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                r.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                r.billNumber.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "All Status" || r.verificationStatus === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [receipts, searchTerm, statusFilter]);

    const stats = {
        totalReceipts: receipts.length,
        verified: receipts.filter(r => r.verificationStatus === "Verified").length,
        pendingQC: receipts.filter(r => r.verificationStatus === "Pending QC").length,
        totalValue: "₹4.95L"
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newReceipt: MaterialReceipt = {
            id: formMode === 'edit' && selectedReceipt ? selectedReceipt.id : Date.now(),
            materialName: formData.materialName,
            unit: formData.unit,
            openingStock: 1000,
            receivedQuantity: Number(formData.receivedQuantity),
            usedQuantity: 0,
            closingStock: 1000 + Number(formData.receivedQuantity),
            supplier: formData.supplier,
            billNumber: formData.billNumber,
            date: new Date().toISOString().split('T')[0],
            location: formData.location,
            totalAmount: Number(formData.totalAmount),
            paymentStatus: "Pending",
            verificationStatus: "Pending QC",
        };

        if (formMode === 'edit') {
            setReceipts(prev => prev.map(r => r.id === selectedReceipt?.id ? newReceipt : r));
            toast.success("Receipt updated");
        } else {
            setReceipts(prev => [newReceipt, ...prev]);
            toast.success("New receipt logged");
        }
        setIsFormOpen(false);
    };

    return (
        <>
            <Navbar title="Material Receipts Registry" breadcrumb={["Engineer", "Material", "Receipt Ledger"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight italic-none">Procurement & Receipt Ledger</h1>
                        <p className="text-slate-500 text-sm italic-none">Monitor inbound material logistics and verify quality compliance upon arrival.</p>
                    </div>
                    <button
                        onClick={() => { setFormMode("create"); setFormData(initialFormData); setIsFormOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Log New Receipt
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Consignment Volume" value={stats.totalReceipts.toString()} sub="Inbound Deliveries" accent="text-slate-800" icon={<Truck className="w-5 h-5" />} />
                    <StatCard title="Quality Verified" value={stats.verified.toString()} sub="Compliance OK" accent="text-emerald-500" icon={<CheckCircle2 className="w-5 h-5" />} />
                    <StatCard title="Pending Audit" value={stats.pendingQC.toString()} sub="QC Quarantine" accent="text-rose-500" icon={<Clock className="w-5 h-5" />} />
                    <StatCard title="Procurement Value" value={stats.totalValue} sub="Fiscal Impact" accent="text-blue-500" icon={<Package className="w-5 h-5" />} />
                </div>

                {/* ── Main Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"><Search className="w-4 h-4" /></span>
                            <input type="text" placeholder="Search by material, supplier or bill #..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter" />
                        </div>
                        <div className="flex items-center gap-2 font-inter">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter">
                                <option>All Status</option>
                                <option>Verified</option>
                                <option>Pending QC</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto font-inter">
                        <table className="w-full text-left font-inter">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Material Consignment</th>
                                    <th className="px-6 py-4 font-inter">Quantity Matrix</th>
                                    <th className="px-6 py-4 font-inter">Inbound Logistics</th>
                                    <th className="px-6 py-4 font-inter">QC Status</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {filteredReceipts.map((receipt) => (
                                    <tr key={receipt.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-sm font-bold text-slate-800 font-inter">{receipt.materialName}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">Bill: {receipt.billNumber} • {receipt.date}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-xs font-black text-slate-700 tabular-nums font-inter">+{receipt.receivedQuantity} {receipt.unit} Received</span>
                                                <span className="text-[10px] text-slate-400 font-bold font-inter italic-none">Closing: {receipt.closingStock} {receipt.unit}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-xs font-bold text-slate-600 font-inter truncate italic-none">{receipt.supplier}</span>
                                                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-inter">
                                                    <FileText className="w-3 h-3" />
                                                    <span className="truncate font-inter italic-none">{receipt.location}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${receipt.verificationStatus === 'Verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600 animate-pulse'}`}>
                                                {receipt.verificationStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                <button onClick={() => { setSelectedReceipt(receipt); setIsDetailOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-inter"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => { setFormMode("edit"); setSelectedReceipt(receipt); setFormData({ materialName: receipt.materialName, unit: receipt.unit, receivedQuantity: receipt.receivedQuantity.toString(), supplier: receipt.supplier, billNumber: receipt.billNumber, totalAmount: receipt.totalAmount.toString(), location: receipt.location }); setIsFormOpen(true); }} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => { setReceiptToDelete(receipt.id); setIsDeleteOpen(true); }} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>

            {/* ── Form Modal ──────────────────────────────────── */}
            <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={formMode === 'create' ? 'Log Material Consignment' : 'Update Receipt Record'} maxWidth="max-w-xl">
                <div className="p-8 font-inter text-inter">
                    <form onSubmit={handleSubmit} className="space-y-6 font-inter">
                        <div className="grid grid-cols-1 gap-6 font-inter">
                            <div className="flex flex-col font-inter">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Material Name</label>
                                <input type="text" value={formData.materialName} onChange={(e) => setFormData({...formData, materialName: e.target.value})} placeholder="e.g. UltraTech Cement" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4 font-inter">
                                <div className="flex flex-col font-inter">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Received Qty</label>
                                    <input type="number" value={formData.receivedQuantity} onChange={(e) => setFormData({...formData, receivedQuantity: e.target.value})} placeholder="500" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter" required />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Measurement Unit</label>
                                    <select value={formData.unit} onChange={(e) => setFormData({...formData, unit: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter">
                                        <option value="Bag">Bag</option>
                                        <option value="Kg">Kg</option>
                                        <option value="Ton">Ton</option>
                                        <option value="Liters">Liters</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-col font-inter">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Supplier Name</label>
                                <input type="text" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} placeholder="Vendor Name" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4 font-inter">
                                <div className="flex flex-col font-inter">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Bill / Invoice #</label>
                                    <input type="text" value={formData.billNumber} onChange={(e) => setFormData({...formData, billNumber: e.target.value})} placeholder="INV-001" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter" required />
                                </div>
                                <div className="flex flex-col font-inter">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-inter italic-none">Total Amount (₹)</label>
                                    <input type="number" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: e.target.value})} placeholder="25000" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter" required />
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 pt-6 font-inter">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-6 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 transition-all font-inter italic-none">Cancel</button>
                            <button type="submit" className="px-10 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 font-inter italic-none">
                                {formMode === 'create' ? 'Authorize & Log' : 'Update Record'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* ── Detail Modal ────────────────────────────────── */}
            <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Consignment Intelligence Insight" maxWidth="max-w-2xl">
                {selectedReceipt && (
                    <div className="p-6 font-inter text-inter italic-none">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                            <div className="relative z-10 font-inter">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-2 font-inter">Inventory Receipt Ledger</p>
                                <h3 className="text-2xl font-black tracking-tight leading-tight mb-6 font-inter">{selectedReceipt.materialName}</h3>
                                <div className="grid grid-cols-3 gap-4 font-inter">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Received</p>
                                        <p className="text-lg font-black font-inter italic-none">{selectedReceipt.receivedQuantity} {selectedReceipt.unit}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Bill Value</p>
                                        <p className="text-lg font-black font-inter italic-none">₹{selectedReceipt.totalAmount.toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 font-inter">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1 font-inter">Payment</p>
                                        <p className="text-lg font-black font-inter italic-none uppercase">{selectedReceipt.paymentStatus}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsDetailOpen(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95 font-inter italic-none">Dismiss Consignment Insight</button>
                    </div>
                )}
            </Modal>

            <ConfirmModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} onConfirm={() => { setReceipts(prev => prev.filter(r => r.id !== receiptToDelete)); setIsDeleteOpen(false); toast.success("Receipt record archived"); }} title="Discard Inbound Consignment" message="Are you sure you want to remove this material receipt record?" confirmText="Archive Record" type="danger" />
        </>
    );
};

export default MaterialReceiptPage;
