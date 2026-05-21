import React from "react";
import Modal from "../common/Modal";

interface ProjectRecordsModalProps {
    isOpen: boolean;
    onClose: () => void;
    records: any[];
}

const ProjectRecordsModal: React.FC<ProjectRecordsModalProps> = ({
    isOpen,
    onClose,
    records,
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="CAD Conversion Records"
            maxWidth="max-w-4xl"
        >
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-1 h-6 bg-primary rounded-full"></div>
                    <h3 className="font-semibold text-gray-700">Digital Archive</h3>
                </div>
                <p className="text-sm text-slate-500 mb-6 font-medium">
                    Detailed historical logs of all CAD to coordinate conversions.
                </p>

                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                <tr>
                                    <th className="px-6 py-4">ID</th>
                                    <th className="px-6 py-4">Project</th>
                                    <th className="px-6 py-4">Area Calculation</th>
                                    <th className="px-6 py-4">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {records.length > 0 ? (
                                    records.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-xs font-bold text-slate-400">#{log.id}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-slate-700">{log.project_name || "N/A"}</p>
                                                <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]" title={log.file_path}>
                                                    {log.file_path}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.area && log.area > 0 ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black text-primary">
                                                            {Number(log.area).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-300 uppercase">Square Units</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 italic text-xs">No area data</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-semibold text-slate-600">
                                                    {new Date(log.created_at).toLocaleDateString("en-IN", {
                                                        day: "2-digit",
                                                        month: "short",
                                                        year: "numeric"
                                                    })}
                                                </p>
                                                <p className="text-[10px] font-medium text-slate-400">
                                                    {new Date(log.created_at).toLocaleTimeString("en-IN", {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                        hour12: true
                                                    })}
                                                </p>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">
                                            No records found in the archive.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-8 py-2.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-200 transition-all active:scale-95"
                >
                    Close Archive
                </button>
            </div>
        </Modal>
    );
};

export default ProjectRecordsModal;
