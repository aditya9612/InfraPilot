import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import type { Material, InventoryLog, PriceHistory } from '../../types/material';
import { materialService } from '../../services/materialService';
import { 
    Box, 
    TrendingUp, 
    ArrowUpRight, 
    ArrowDownRight, 
    Activity,
    ShieldCheck
} from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    materialId: number | null;
}

const MaterialDetailModal: React.FC<Props> = ({ isOpen, onClose, materialId }) => {
    const [material, setMaterial] = useState<Material | null>(null);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && materialId) {
            fetchDetails();
        }
    }, [isOpen, materialId]);

    const fetchDetails = async () => {
        if (!materialId) return;
        setIsLoading(true);
        try {
            const [matData, logData, priceData] = await Promise.all([
                materialService.getMaterial(materialId),
                materialService.getLogs({ material_id: materialId, limit: 10 }),
                materialService.getPriceHistory(materialId)
            ]);
            setMaterial(matData);
            setLogs(logData);
            setPriceHistory(priceData);
        } catch (error) {
            console.error('Failed to fetch material details');
        } finally {
            setIsLoading(false);
        }
    };

    if (!material && !isLoading) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Material Intelligence Insight" 
            maxWidth="max-w-4xl"
        >
            {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analyzing Assets...</p>
                </div>
            ) : material && (
                <div className="p-6 font-inter space-y-8">
                    {/* Header Card */}
                    <div className="bg-primary rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-inner">
                                    <Box className="w-10 h-10" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-2xl font-black tracking-tight uppercase">{material.material_name}</h3>
                                        <span className="px-3 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest">{material.material_code}</span>
                                    </div>
                                    <p className="text-white/70 text-sm font-bold uppercase tracking-wide italic-none">{material.category} • {material.supplier_name}</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 text-center">
                                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Current Stock</p>
                                    <p className="text-xl font-black tabular-nums">{material.remaining_stock} <span className="text-xs opacity-60 uppercase">{material.unit}</span></p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stock & Fiscal Equilibrium */}
                    <div className="bg-slate-50 rounded-[2.5rem] p-8 grid grid-cols-2 md:grid-cols-4 gap-8 border border-slate-100 shadow-inner">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Purchased</p>
                            <p className="text-lg font-black text-slate-800 tabular-nums">{material.quantity_purchased} <span className="text-xs text-slate-400 font-bold uppercase">{material.unit}</span></p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Consumed</p>
                            <p className="text-lg font-black text-rose-500 tabular-nums">{material.quantity_used} <span className="text-xs text-slate-400 font-bold uppercase">{material.unit}</span></p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Payment Given</p>
                            <p className="text-lg font-black text-emerald-600 tabular-nums">₹{material.payment_given.toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dues Pending</p>
                            <p className={`text-lg font-black tabular-nums ${material.payment_pending > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                ₹{material.payment_pending.toLocaleString()}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Audit Trail */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-blue-50 text-primary rounded-xl border border-blue-100">
                                    <Activity className="w-4 h-4" />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Inventory Audit Trail</h3>
                            </div>
                            <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
                                <div className="divide-y divide-slate-50">
                                    {logs.length > 0 ? logs.map((log) => (
                                        <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-lg ${log.type === 'PURCHASE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                    {log.type === 'PURCHASE' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{log.type}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 italic-none">Qty: {log.quantity} {material.unit}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tabular-nums">{log.created_at.split('T')[0]}</p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="p-12 text-center text-slate-300 font-bold text-xs italic-none">No audit logs found</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Financial Intelligence */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pricing Intelligence</h3>
                            </div>
                            <div className="bg-white rounded-[2rem] border border-slate-100 p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Base Rate</p>
                                        <p className="text-xl font-black text-slate-800">₹{material.purchase_rate}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Valuation</p>
                                        <p className="text-xl font-black text-emerald-600">₹{material.total_amount.toLocaleString()}</p>
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-slate-50">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Price Volatility History</p>
                                    <div className="space-y-3">
                                        {priceHistory.map((ph, idx) => (
                                            <div key={idx} className="flex items-center justify-between text-xs">
                                                <span className="font-bold text-slate-500 tabular-nums uppercase">{ph.date}</span>
                                                <span className="font-black text-slate-800 tabular-nums">₹{ph.rate}</span>
                                            </div>
                                        ))}
                                        {priceHistory.length === 0 && (
                                            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 p-3 rounded-xl border border-rose-100">
                                                <ShieldCheck className="w-4 h-4" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Price is Currently Stable</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-2xl active:scale-95"
                    >
                        Dismiss Asset Insight
                    </button>
                </div>
            )}
        </Modal>
    );
};

export default MaterialDetailModal;
