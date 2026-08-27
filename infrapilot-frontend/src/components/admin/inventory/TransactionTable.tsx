import React from "react";
import { ArrowDownLeft, ArrowUpRight, ShoppingCart, Activity } from "lucide-react";
import type { MaterialLog } from "../../../types/material";

interface TransactionTableProps {
    transactions: MaterialLog[];
    projectMap?: Record<number, string>;
}

const TransactionTable: React.FC<TransactionTableProps> = ({
    transactions,
    projectMap = {}
}) => {
    const getTypeConfig = (type: string) => {
        switch (type) {
            case "PURCHASE": return { label: "Purchase", icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-50" };
            case "USAGE": return { label: "Usage", icon: Activity, color: "text-amber-600", bg: "bg-amber-50" };
            case "TRANSFER_IN": return { label: "Transfer In", icon: ArrowDownLeft, color: "text-emerald-600", bg: "bg-emerald-50" };
            case "TRANSFER_OUT": return { label: "Transfer Out", icon: ArrowUpRight, color: "text-rose-600", bg: "bg-rose-50" };
            default: return { label: type, icon: Activity, color: "text-slate-600", bg: "bg-slate-50" };
        }
    };

    return (
        <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Project</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Material</th>
                        <th className="px-6 py-4">Supplier</th>
                        <th className="px-6 py-4">Quantity</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Date</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {transactions.map((t) => {
                        const config = getTypeConfig(t.type);
                        return (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-800">TXN-{t.id.toString().padStart(4, '0')}</p>
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                    {t.project_id ? (projectMap[t.project_id] || "Unknown") : "Global"}
                                </td>
                                <td className="px-6 py-4">
                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.color}`}>
                                        <config.icon size={12} strokeWidth={3} />
                                        {config.label}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                                    {t.material_name}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {(t as any).supplier_name || "—"}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-sm font-bold ${t.quantity < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {t.quantity > 0 ? '+' : ''}{t.quantity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-slate-700">
                                    {t.total_amount ? `₹${t.total_amount.toLocaleString()}` : "—"}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                                    {new Date(t.created_at).toLocaleString(undefined, {
                                        year: 'numeric', month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </td>
                            </tr>
                        );
                    })}
                    {transactions.length === 0 && (
                        <tr>
                            <td colSpan={8} className="py-12 text-center text-slate-400">
                                No transactions found for this project.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default TransactionTable;
