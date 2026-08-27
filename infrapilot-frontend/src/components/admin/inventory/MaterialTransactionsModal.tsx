import { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import { formatCurrency } from "../../../utils/currencyUtils";
import { materialService } from "../../../services/materialService";
import { workProgressService } from "../../../services/workProgressService";
import { boqService } from "../../../services/boqService";
import type { InventoryLog } from "../../../types/material";

interface MaterialTransactionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    material: any | null;
    projectsList: any[];
}

export default function MaterialTransactionsModal({ isOpen, onClose, material, projectsList = [] }: MaterialTransactionsModalProps) {
    const [transactions, setTransactions] = useState<InventoryLog[]>([]);
    const [tasks, setTasks] = useState<any[]>([]);
    const [boqItems, setBoqItems] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [limit] = useState(50);
    const [offset] = useState(0);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !material) return;

        async function fetchContext() {
            setIsLoading(true);
            setError(null);
            try {
                const [txData, actData, boqData] = await Promise.all([
                    materialService.getMaterialTransactions(material!.id, limit, offset),
                    workProgressService.listActivities(material!.project_id).catch(() => []),
                    boqService.getBoqItems(material!.project_id).catch(() => [])
                ]);
                setTransactions(txData);
                setTasks(actData);
                setBoqItems(boqData);
            } catch (err: any) {
                console.error("Failed to fetch context:", err);
                setError(err.response?.data?.detail || "Failed to load transactions.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchContext();
    }, [isOpen, material, limit, offset]);

    if (!isOpen || !material) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Material Transactions" maxWidth="max-w-[95vw]">
            <div className="p-6">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{material.material_name}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase">{material.category} • {material.unit}</p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-semibold mb-4">
                        {error}
                    </div>
                )}

                <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-[60vh] scrollbar-thin scrollbar-thumb-slate-200">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type (Issue)</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Project / Task</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">BOQ Reference</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Qty</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Financials (Rate/Avg)</th>
                                <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paid / Pending</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoading ? (
                                <tr><td colSpan={7} className="p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan={7} className="p-12 text-center text-slate-500 font-medium">No transactions found for this material.</td></tr>
                            ) : (
                                transactions.map((log) => {
                                    const projName = projectsList?.find((p) => p.id === log.project_id)?.name || `ID #${log.project_id}`;
                                    const taskName = tasks?.find((t) => t.id === log.task_id)?.name || (log.task_id ? `ID #${log.task_id}` : "N/A");
                                    const boqName = boqItems?.find((b) => b.id === log.boq_item_id)?.item_description || (log.boq_item_id ? `ID #${log.boq_item_id}` : "Unlinked");

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50 transition-colors text-sm">
                                            <td className="px-4 py-3 text-slate-600">
                                                <p className="font-bold text-slate-800">{new Date(log.created_at).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase border ${log.type?.includes('IN') ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                                    {log.type}
                                                </span>
                                                <p className="text-[10px] font-bold text-slate-400 mt-1 pl-1 truncate max-w-[150px]">{log.issue_type}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-700 truncate max-w-[200px]">{projName}</p>
                                                <p className="text-[10px] mt-0.5 text-slate-500 font-medium truncate max-w-[200px]">{taskName}</p>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600 font-medium text-[11px] truncate max-w-[200px]" title={boqName}>{boqName}</td>
                                            <td className="px-4 py-3 font-black text-slate-800 text-base">{log.quantity}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-slate-700 mb-0.5">{formatCurrency(log.rate)}</p>
                                                <div className="text-[10px] flex gap-2 font-medium">
                                                    <span className="text-slate-400" title="Average Rate">Avg: {formatCurrency(log.avg_rate)}</span>
                                                    <span className="text-slate-400 border-l border-slate-200 pl-2">Total: {formatCurrency(log.total_amount)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-emerald-600 text-xs mb-0.5">Paid: {formatCurrency(log.amount_paid)}</p>
                                                <p className={`font-bold text-xs ${log.payment_pending > 0 ? 'text-rose-500' : 'text-slate-400'}`}>Pending: {formatCurrency(log.payment_pending)}</p>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Modal>
    );
}
