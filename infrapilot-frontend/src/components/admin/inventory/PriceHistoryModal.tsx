import { useState, useEffect } from "react";
import Modal from "../../common/Modal";
import { formatCurrency } from "../../../utils/currencyUtils";
import { materialService } from "../../../services/materialService";
import type { PriceHistory } from "../../../types/material";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PriceHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    material: any | null;
}

export default function PriceHistoryModal({ isOpen, onClose, material }: PriceHistoryModalProps) {
    const [history, setHistory] = useState<PriceHistory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !material) return;

        async function fetchHistory() {
            setIsLoading(true);
            setError(null);
            try {
                const data = await materialService.getPriceHistory(material!.id);
                // The backend might already sort it, but let's ensure it's sorted by date descending for the list
                const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setHistory(sorted);
            } catch (err: any) {
                console.error("Failed to fetch price history:", err);
                setError(err.response?.data?.detail || "Failed to load price history.");
            } finally {
                setIsLoading(false);
            }
        }

        fetchHistory();
    }, [isOpen, material]);

    if (!isOpen || !material) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Price History" maxWidth="max-w-2xl">
            <div className="p-6 h-full flex flex-col">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{material.material_name}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase">{material.category} • {material.unit}</p>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-semibold mb-4 flex-shrink-0">
                        {error}
                    </div>
                )}

                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="overflow-y-auto border border-slate-100 rounded-xl scrollbar-thin scrollbar-thumb-slate-200 bg-slate-50">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead className="bg-slate-100/50 sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200/50 w-1/3">Timestamp</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest border-r border-slate-200/50">Purchase Rate</th>
                                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Trend</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {isLoading ? (
                                    <tr><td colSpan={3} className="p-12 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div></td></tr>
                                ) : history.length === 0 ? (
                                    <tr><td colSpan={3} className="p-12 text-center text-slate-500 font-medium">No price fluctuation records found.</td></tr>
                                ) : (
                                    history.map((record, idx) => {
                                        // Calculate trend relative to the previous record chronologically (which is the NEXT record in this desc array)
                                        const previousRecord = history[idx + 1];
                                        let trendIcon = <Minus className="w-4 h-4 text-slate-300" />;
                                        let trendColor = "text-slate-400 bg-slate-50 border-slate-100";
                                        let trendText = "Stable";

                                        if (previousRecord) {
                                            if (record.rate > previousRecord.rate) {
                                                trendIcon = <TrendingUp className="w-4 h-4 text-rose-500" />;
                                                trendColor = "text-rose-600 bg-rose-50 border-rose-100";
                                                trendText = "Increased";
                                            } else if (record.rate < previousRecord.rate) {
                                                trendIcon = <TrendingDown className="w-4 h-4 text-emerald-500" />;
                                                trendColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
                                                trendText = "Decreased";
                                            }
                                        }

                                        return (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-6 py-4 border-r border-slate-50">
                                                    <p className="text-sm font-bold text-slate-700">{new Date(record.date).toLocaleDateString()}</p>
                                                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(record.date).toLocaleTimeString()}</p>
                                                </td>
                                                <td className="px-6 py-4 border-r border-slate-50">
                                                    <span className="text-base font-black text-slate-800 tracking-tight">{formatCurrency(record.rate)}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold ml-1">/ {material.unit}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {previousRecord ? (
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${trendColor}`}>
                                                            {trendIcon}
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{trendText}</span>
                                                        </div>
                                                    ) : (
                                                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${trendColor}`}>
                                                            {trendIcon}
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Base Rate</span>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
