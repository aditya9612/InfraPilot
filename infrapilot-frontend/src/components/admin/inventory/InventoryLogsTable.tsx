import React from "react";
import type { InventoryLog } from "../../../types/material";

interface InventoryLogsTableProps {
  logs: InventoryLog[];
  projectMap: Record<number, string>;
}

const InventoryLogsTable: React.FC<InventoryLogsTableProps> = ({ logs, projectMap }) => {
  const getTypeStyle = (type: string) => {
    switch (type) {
      case "PURCHASE": return "text-emerald-600 bg-emerald-50";
      case "USAGE": return "text-primary bg-blue-50";
      case "TRANSFER_IN": return "text-amber-600 bg-amber-50";
      case "TRANSFER_OUT": return "text-rose-600 bg-rose-50";
      case "ADJUSTMENT": return "text-purple-600 bg-purple-50";
      default: return "text-slate-600 bg-slate-50";
    }
  };

  return (
    <div className="overflow-x-auto min-h-[300px]">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
            <th className="px-6 py-4">Transaction ID & Date</th>
            <th className="px-6 py-4">Action Type</th>
            <th className="px-6 py-4">Project Site</th>
            <th className="px-6 py-4">Quantity & Rate</th>
            <th className="px-6 py-4">Total Amount</th>
            <th className="px-6 py-4">Issue Type</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
              <td className="px-6 py-4">
                <p className="font-bold text-slate-800">TXN-{log.id.toString().padStart(6, '0')}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  {new Date(log.created_at).toLocaleString()}
                </p>
              </td>
              <td className="px-6 py-4">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${getTypeStyle(log.type)}`}>
                  {log.type}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm font-bold text-slate-700">
                  {projectMap[log.project_id] || `ID: ${log.project_id}`}
                </p>
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-slate-600">
                {log.quantity} units @ ₹{log.rate.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-sm font-bold text-slate-800">
                ₹{log.total_amount.toLocaleString()}
              </td>
              <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                {log.issue_type}
              </td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} className="py-12 text-center text-slate-400">
                No activity logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InventoryLogsTable;
