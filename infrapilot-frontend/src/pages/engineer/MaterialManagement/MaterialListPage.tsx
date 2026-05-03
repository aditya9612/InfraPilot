import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../../../components/common/Navbar';
import PageTransition from '../../../components/common/PageTransition';
import StatCard from '../../../components/common/StatCard';
import {
    Package,
    Search,
    Filter,
    Plus,
    ArrowUpRight,
    ArrowDownRight,
    Edit3,
    Trash2,
    Box,
    CheckCircle2,
    AlertTriangle,
    Activity,
    Eye
} from "lucide-react";
import type { Material } from '../../../types/material';
import { materialService } from '../../../services/materialService';
import CreateMaterialModal from '../../../components/material/CreateMaterialModal';
import EditMaterialModal from '../../../components/material/EditMaterialModal';
import UsageModal from '../../../components/material/UsageModal';
import PurchaseModal from '../../../components/material/PurchaseModal';
import DeleteConfirmModal from '../../../components/material/DeleteConfirmModal';
import MaterialDetailModal from '../../../components/material/MaterialDetailModal';
import toast from 'react-hot-toast';

const MaterialListPage: React.FC = () => {
    const [materials, setMaterials] = useState<Material[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [alertFilter, setAlertFilter] = useState('All');

    // Modal States
    const [showCreate, setShowCreate] = useState(false);
    const [editTarget, setEditTarget] = useState<Material | null>(null);
    const [usageTarget, setUsageTarget] = useState<Material | null>(null);
    const [purchaseTarget, setPurchaseTarget] = useState<Material | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Material | null>(null);
    const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);

    const fetchMaterials = async () => {
        setIsLoading(true);
        try {
            const data = await materialService.listMaterials(1); // Default project 1
            setMaterials(data);
        } catch (error) {
            toast.error('Failed to load inventory');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchMaterials();
    }, []);

    const filteredMaterials = useMemo(() => {
        return materials.filter(m => {
            const matchesSearch = m.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.material_code.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAlert = alertFilter === 'All' || m.alert_type === alertFilter;
            return matchesSearch && matchesAlert;
        });
    }, [materials, searchTerm, alertFilter]);

    const stats = useMemo(() => {
        const total = materials.length;
        const lowStock = materials.filter(m => m.alert_type === 'LOW_STOCK').length;
        const totalValue = materials.reduce((acc, curr) => acc + curr.total_amount, 0);
        const totalPending = materials.reduce((acc, curr) => acc + curr.payment_pending, 0);
        return { total, lowStock, totalValue, totalPending };
    }, [materials]);

    const handleUpdateRow = (updated: Material) => {
        setMaterials(prev => prev.map(m => m.id === updated.id ? updated : m));
    };

    return (
        <>
            <Navbar title="Material Registry" breadcrumb={["Engineer", "Procurement", "Inventory Ledger"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Material Command Center</h1>
                        <p className="text-slate-500 text-sm italic-none">Centralized inventory control for structural and finishing assets.</p>
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        Register Material
                    </button>
                </div>

                {/* ── Summary Stats ───────────────────────────── */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total SKU"
                        value={stats.total.toString()}
                        sub="Registered Assets"
                        accent="text-slate-800"
                        icon={<Package className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Compliance"
                        value={`${Math.round(((stats.total - stats.lowStock) / (stats.total || 1)) * 100)}%`}
                        sub="Inventory Health"
                        accent="text-emerald-500"
                        icon={<CheckCircle2 className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Low Stock"
                        value={stats.lowStock.toString()}
                        sub="Action Required"
                        accent="text-rose-500"
                        icon={<AlertTriangle className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Stock Value"
                        value={`₹${(stats.totalValue / 100000).toFixed(1)}L`}
                        sub="Asset Momentum"
                        accent="text-blue-500"
                        icon={<Activity className="w-5 h-5" />}
                    />
                </div>

                {/* ── Main Container ───────────────────────────────────────────── */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden mb-12 font-inter">
                    {/* Integrated Filter Bar */}
                    <div className="p-6 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-slate-50/30 font-inter">
                        <div className="relative flex-1 max-w-md font-inter">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <Search className="w-4 h-4" />
                            </span>
                            <input
                                type="text"
                                placeholder="Search material name or code..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter"
                            />
                        </div>
                        <div className="flex items-center gap-2 font-inter">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={alertFilter}
                                onChange={(e) => setAlertFilter(e.target.value)}
                                className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 outline-none cursor-pointer font-inter"
                            >
                                <option value="All">All Status</option>
                                <option value="LOW_STOCK">Low Stock</option>
                                <option value="IN_STOCK">In Stock</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 font-inter">
                        <table className="w-full text-left font-inter min-w-[1200px]">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                                    <th className="px-6 py-4 font-inter">Material Identity</th>
                                    <th className="px-6 py-4 font-inter">Category & Origin</th>
                                    <th className="px-6 py-4 font-inter text-center">Procured</th>
                                    <th className="px-6 py-4 font-inter text-center">Consumed</th>
                                    <th className="px-6 py-4 font-inter text-center">Available</th>
                                    <th className="px-6 py-4 font-inter text-center">Dues</th>
                                    <th className="px-6 py-4 text-right font-inter">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 font-inter">
                                {filteredMaterials.map((material) => (
                                    <tr key={material.id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4 font-inter">
                                                <div className={`p-2 rounded-xl ${material.alert_type === 'LOW_STOCK' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-primary'}`}>
                                                    <Box className="w-5 h-5" />
                                                </div>
                                                <button
                                                    onClick={() => setSelectedMaterialId(material.id)}
                                                    className="flex flex-col font-inter text-left hover:opacity-70 transition-opacity"
                                                >
                                                    <span className="text-sm font-bold text-slate-800 font-inter uppercase">{material.material_name}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{material.material_code}</span>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col font-inter">
                                                <span className="text-xs font-bold text-slate-600 font-inter">{material.category}</span>
                                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-inter">{material.supplier_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-slate-700 tabular-nums font-inter">{material.quantity_purchased} <span className="text-[10px] text-slate-400 uppercase font-bold">{material.unit}</span></span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-sm font-bold text-slate-700 tabular-nums font-inter">{material.quantity_used} <span className="text-[10px] text-slate-400 uppercase font-bold">{material.unit}</span></span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center font-inter">
                                                <span className={`text-sm font-bold tabular-nums font-inter ${material.alert_type === 'LOW_STOCK' ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                    {material.remaining_stock} {material.unit}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${material.alert_type === 'LOW_STOCK' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {material.alert_type.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs font-black tabular-nums font-inter ${material.payment_pending > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                ₹{material.payment_pending.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 font-inter">
                                                <button
                                                    onClick={() => setSelectedMaterialId(material.id)}
                                                    className={`p-2 text-white rounded-xl shadow-lg transition-all active:scale-95 font-inter ${material.alert_type === 'LOW_STOCK' ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}
                                                    title="View Intelligence"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setUsageTarget(material)}
                                                    className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all font-inter"
                                                    title="Log Consumption"
                                                >
                                                    <ArrowDownRight className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setPurchaseTarget(material)}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all font-inter"
                                                    title="Replenish Stock"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setEditTarget(material)}
                                                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all font-inter"
                                                    title="Edit Profile"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeleteTarget(material)}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-inter"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredMaterials.length === 0 && !isLoading && (
                        <div className="py-24 flex flex-col items-center justify-center text-center font-inter">
                            <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center mb-6">
                                <Package className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Registry is Empty</h3>
                            <p className="text-sm text-slate-400 font-bold max-w-xs mx-auto italic-none">No materials found matching your criteria. Start by registering a new asset.</p>
                        </div>
                    )}
                </div>

                {/* ── Modals ─────────────────────────────────────── */}
                <CreateMaterialModal
                    isOpen={showCreate}
                    onClose={() => setShowCreate(false)}
                    onSuccess={fetchMaterials}
                />
                <EditMaterialModal
                    isOpen={!!editTarget}
                    onClose={() => setEditTarget(null)}
                    material={editTarget}
                    onSuccess={fetchMaterials}
                />
                <UsageModal
                    isOpen={!!usageTarget}
                    onClose={() => setUsageTarget(null)}
                    material={usageTarget}
                    onSuccess={handleUpdateRow}
                />
                <PurchaseModal
                    isOpen={!!purchaseTarget}
                    onClose={() => setPurchaseTarget(null)}
                    material={purchaseTarget}
                    onSuccess={handleUpdateRow}
                />
                <DeleteConfirmModal
                    isOpen={!!deleteTarget}
                    onClose={() => setDeleteTarget(null)}
                    material={deleteTarget}
                    onSuccess={fetchMaterials}
                />
                <MaterialDetailModal
                    isOpen={selectedMaterialId !== null}
                    onClose={() => setSelectedMaterialId(null)}
                    materialId={selectedMaterialId}
                />
            </PageTransition>
        </>
    );
};

export default MaterialListPage;
