import React from "react";
import Modal from "../../common/Modal";
import { formatCurrency as formatINR } from "../../../utils/currencyUtils";

interface ViewMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    material: any | null;
    projectsList: any[];
}

export default function ViewMaterialModal({ isOpen, onClose, material, projectsList }: ViewMaterialModalProps) {
    if (!material) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Material Details" maxWidth="max-w-3xl">
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">{material.material_master_name || material.material_name}</h3>
                        <p className="text-sm font-bold text-slate-500">{material.material_code || "No Code"} • {material.category}</p>
                    </div>
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase border ${material.alert_type === 'IN_STOCK' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : material.alert_type === 'LOW_STOCK' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        {(material.alert_type || (material.remaining_stock <= 0 ? 'OUT_OF_STOCK' : material.remaining_stock < material.minimum_stock_level ? 'LOW_STOCK' : 'IN_STOCK')).replace(/_/g, ' ')}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">General Info</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Project</p><p className="font-bold text-slate-700">{projectsList.find(p => p.id === material.project_id)?.project_name || projectsList.find(p => p.id === material.project_id)?.name || `Site #${material.project_id}`}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Supplier</p><p className="font-bold text-slate-700">{material.supplier_name || `ID: ${material.supplier_id}`}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Unit</p><p className="font-bold text-slate-700">{material.unit_name || material.unit}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Min. Stock</p><p className="font-bold text-slate-700">{material.minimum_stock_level}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Master Name</p><p className="font-bold text-slate-700">{material.material_master_name || 'N/A'}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Brand</p><p className="font-bold text-slate-700">{material.material_master_brand || 'General'}</p></div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Stock Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Purchased</p><p className="font-bold text-slate-700">{material.quantity_purchased}</p></div>
                            <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Used</p><p className="font-bold text-slate-700">{material.quantity_used || 0}</p></div>
                            <div className="col-span-2 bg-blue-50 p-3 rounded-xl border border-blue-100 flex justify-between items-center"><p className="text-xs font-bold text-blue-800 uppercase tracking-widest">Remaining</p><p className="font-black text-lg text-blue-700">{material.remaining_stock} {material.unit}</p></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Financials</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Rate ({material.rate_type || "Unit"})</p><p className="font-bold text-slate-700">{formatINR(material.purchase_rate)}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Amount</p><p className="font-bold text-slate-700">{formatINR(material.total_amount || (material.remaining_stock * material.purchase_rate))}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Payment Given</p><p className="font-bold text-emerald-600">{formatINR(material.payment_given)}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending / Extra</p><p className={`font-bold ${(material.payment_pending ?? 0) > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{(material.payment_pending ?? 0) > 0 ? `Pending: ${formatINR(material.payment_pending)}` : `Extra: ${formatINR(material.extra_paid || 0)}`}</p></div>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
