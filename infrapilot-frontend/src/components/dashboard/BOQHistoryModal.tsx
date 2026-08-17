import React, { useState, useEffect } from "react";
import { boqService } from "../../services/boqService";
import { userService } from "../../services/userService";
import type { BoqLog } from "../../types/boq";

interface BOQHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  boqId: number;
  itemName: string;
}

const BOQHistoryModal: React.FC<BOQHistoryModalProps> = ({
  isOpen,
  onClose,
  boqId,
  itemName,
}) => {
  const [logs, setLogs] = useState<BoqLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userNames, setUserNames] = useState<Record<number, string>>({});

  const handleExportCsv = async () => {
    try {
      const response = await boqService.exportBoqLogsCsv(boqId);
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${itemName}_Audit_Logs.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export logs CSV", error);
    }
  };

  useEffect(() => {
    if (isOpen && boqId) {
      const fetchLogs = async () => {
        setIsLoading(true);
        try {
          const res = await boqService.getBoqLogs(boqId);
          setLogs(res);

          // Fetch user details for all unique user_ids
          const uniqueUserIds = Array.from(new Set(res.map((log: any) => log.user_id).filter(Boolean))) as number[];
          const namesMap: Record<number, string> = { ...userNames };

          await Promise.all(
            uniqueUserIds.map(async (uid) => {
              if (namesMap[uid]) return;
              try {
                const u = await userService.getUserById(uid);
                if (u && u.full_name) {
                  namesMap[uid] = u.full_name;
                } else {
                  namesMap[uid] = `User #${uid}`;
                }
              } catch (err) {
                console.error(`Failed to fetch user details for ${uid}`, err);
                namesMap[uid] = `User #${uid}`;
              }
            })
          );
          setUserNames(namesMap);
        } catch (error) {
          console.error("Failed to fetch logs", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLogs();
    }
  }, [isOpen, boqId]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-50 flex items-center justify-between bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Audit Log</h3>
            <p className="text-xs text-slate-500 font-medium">History of changes for: <span className="text-primary font-bold">{itemName}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-slate-500 font-medium animate-pulse">Retrieving history...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-500 font-bold">No history found</p>
              <p className="text-sm text-slate-400 max-w-xs">There are no logged actions recorded for this BOQ item yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {logs.map((log, index) => (
                <div key={index} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-200 last:before:hidden">
                  <div className={`absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-sm ${log.action === 'CREATE' ? 'bg-emerald-500' :
                    log.action === 'UPDATE' ? 'bg-amber-500' : 'bg-primary'
                    }`} />

                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-600' :
                          log.action === 'UPDATE' ? 'bg-amber-50 text-amber-600' : 'bg-primary/10 text-primary'
                          }`}>
                          {log.action}
                        </span>
                        <h4 className="mt-1 font-bold text-slate-700">{log.message}</h4>
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">
                        {log.timestamp ? log.timestamp.replace("T", " ") : ""}
                      </span>
                    </div>

                    {log.changes && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-slate-50 bg-slate-50/30">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="bg-slate-100/50 text-slate-400 font-bold uppercase tracking-widest border-b border-slate-100">
                              <th className="px-3 py-2">Field</th>
                              <th className="px-3 py-2">Previous</th>
                              <th className="px-3 py-2">New</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {Object.entries(log.changes).map(([field, delta]) => (
                              <tr key={field} className="text-slate-600">
                                <td className="px-3 py-2 font-bold bg-white/50">{field.replace('_', ' ')}</td>
                                <td className="px-3 py-2 text-rose-500 bg-rose-50/30 italic">
                                  {typeof delta.old === 'object' ? '...' : String(delta.old ?? 'None')}
                                </td>
                                <td className="px-3 py-2 text-emerald-600 bg-emerald-50/30 font-bold">
                                  {typeof delta.new === 'object' ? '...' : String(delta.new)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-1.5 opacity-60">
                      <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {userNames[log.user_id] || `User ID: ${log.user_id}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-50 text-center bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default BOQHistoryModal;
