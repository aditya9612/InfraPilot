import React from 'react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    label?: string;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, pageSize, onPageChange, label = "Items" }) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalItems <= pageSize) return null;

    return (
        <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems} {label}
            </p>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700">{currentPage + 1}</div>
                <button
                    onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                </button>
            </div>
        </div>
    );
};

export default Pagination;
