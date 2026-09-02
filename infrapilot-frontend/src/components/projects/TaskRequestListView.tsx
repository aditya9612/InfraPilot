import { useState } from "react";
import { Edit2, Trash2, Calendar, FileText, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface TaskRequestListViewProps {
    taskRequests: any[];
    isLoading: boolean;
    onEdit: (request: any) => void;
    onDelete: (requestId: number) => void;
    members?: any[];
}

const TaskRequestListView = ({ taskRequests, isLoading, onEdit, onDelete, members = [] }: TaskRequestListViewProps) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Sort requests by newest first based on id (since they are typically sequential) or created_at
    const sortedRequests = [...taskRequests].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        if (dateA !== dateB && dateA !== 0 && dateB !== 0) return dateB - dateA;
        return (b.id || 0) - (a.id || 0);
    });

    const paginatedRequests = sortedRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(taskRequests.length / itemsPerPage);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
        );
    }

    if (taskRequests.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold">No task requests found</p>
                <p className="text-xs mt-1">Create a new task request to see it here.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden font-inter">
            <div className="p-6">
                <div className="space-y-4">
                    {paginatedRequests.map((request) => (
                        <div
                            key={request.id}
                            className="p-5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                            <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-base text-slate-800 mb-1.5 truncate">{request.title}</h5>
                                <p className="text-sm text-slate-500 mb-3 line-clamp-2">{request.description}</p>
                                <div className="flex items-center gap-3 flex-wrap">
                                    {(() => {
                                        const p = String(request.priority || 'MEDIUM').toUpperCase();
                                        const label = p === '1' ? 'HIGH' : p === '2' ? 'MEDIUM' : p === '3' ? 'LOW' : p;
                                        const colorClass = label === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                                            label === 'MEDIUM' ? 'bg-blue-100 text-blue-700' :
                                                'bg-emerald-100 text-emerald-700';
                                        return (
                                            <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${colorClass}`}>
                                                {label}
                                            </span>
                                        );
                                    })()}
                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${request.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                                        request.status === 'ACCEPTED' || request.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                                            'bg-rose-100 text-rose-700'
                                        }`}>
                                        {request.status || 'PENDING'}
                                    </span>
                                    {request.due_date && (
                                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                            {new Date(request.due_date).toLocaleDateString()}
                                        </span>
                                    )}
                                    {request.assigned_to && (
                                        <span className="text-xs font-medium text-slate-500 flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                            <span className="font-bold text-slate-400">Assignee:</span>
                                            {members.find((m: any) => m.user_id === request.assigned_to)?.full_name || `User #${request.assigned_to}`}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 md:ml-4">
                                <button
                                    onClick={() => onEdit(request)}
                                    className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-primary hover:border-primary/30 flex items-center justify-center transition-all shadow-sm"
                                    title="Edit Request"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => onDelete(request.id)}
                                    className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-rose-500 hover:bg-rose-50 hover:border-rose-200 flex items-center justify-center transition-all shadow-sm"
                                    title="Delete Request"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {totalPages > 0 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-500">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, taskRequests.length)} of {taskRequests.length} requests
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm bg-slate-50"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-bold text-slate-600 px-2">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm bg-slate-50"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskRequestListView;
