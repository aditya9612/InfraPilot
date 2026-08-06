import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number; // 0-indexed
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    label?: string;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalItems, pageSize, onPageChange, onPageSizeChange, label = "records" }) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    if (totalItems === 0) return null;

    // 1-indexed for display
    const current = currentPage + 1;

    const renderPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (current <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (current >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
            }
        }

        return pages.map((page, index) => {
            if (page === '...') {
                return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
            }
            const pageNum = page as number;
            const isActive = current === pageNum;
            return (
                <button
                    key={`page-${pageNum}`}
                    onClick={() => onPageChange(pageNum - 1)}
                    className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                        ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                        : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                        }`}
                >
                    {pageNum}
                </button>
            );
        });
    };

    return (
        <div className="w-full px-6 py-4 border-t border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50 rounded-b-2xl font-inter">
            {/* Left: Items per page */}
            <div className="flex items-center gap-2">
                {onPageSizeChange ? (
                    <>
                        <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                        <select
                            value={pageSize}
                            onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(0); }}
                            className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                        >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </>
                ) : (
                    <span className="text-[11px] font-medium text-slate-500">
                        {pageSize} {label} per page
                    </span>
                )}
            </div>

            {/* Center: Showing info */}
            <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalItems)} of {totalItems} {label}
            </div>

            {/* Right: Pagination */}
            <div className="flex items-center gap-1.5">
                <button
                    onClick={() => onPageChange(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                {renderPageNumbers()}

                <button
                    onClick={() => onPageChange(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= totalPages - 1}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;
