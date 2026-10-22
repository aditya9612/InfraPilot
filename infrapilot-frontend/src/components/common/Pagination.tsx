import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number; // 0-indexed
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    label?: string;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, pageSize, onPageChange, label = "records" }) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

    React.useEffect(() => {
        if (currentPage > 0 && currentPage >= totalPages) {
            onPageChange(totalPages - 1);
        }
    }, [currentPage, totalPages, onPageChange]);

    if (totalItems === 0) return null;

    return (
        <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">
                Showing {Math.min(currentPage * pageSize + 1, totalItems)}–{Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems} {label}
            </p>
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onPageChange(0)}
                    disabled={currentPage === 0}
                    title="First page"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    title="Previous page"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="min-w-[32px] h-8 px-2 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter bg-white shadow-xs">
                    {currentPage + 1}
                </div>
                <button
                    onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    title="Next page"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onPageChange(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                    title="Last page"
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronsRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
