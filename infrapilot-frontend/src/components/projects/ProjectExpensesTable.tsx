import React, { useState, useMemo } from 'react';
import { type ProjectExpense } from '../../types/project';

interface ProjectExpensesTableProps {
  expenses: ProjectExpense[];
}

const ProjectExpensesTable: React.FC<ProjectExpensesTableProps> = ({ expenses }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Labour': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'Material': return 'text-blue-600 bg-blue-50 border-blue-100';
      case 'Permits': return 'text-violet-600 bg-violet-50 border-violet-100';
      case 'Tools': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      default: return 'text-slate-600 bg-slate-50 border-slate-100';
    }
  };

  // Pagination & Sorting Logic (Latest First)
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [expenses]);

  const totalItems = sortedExpenses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const startIndex = page * PAGE_SIZE;
  const endIndex = Math.min((page + 1) * PAGE_SIZE, totalItems);
  const paginatedExpenses = sortedExpenses.slice(startIndex, endIndex);

  // Reset to page 0 if expenses change
  React.useEffect(() => {
    setPage(0);
  }, [expenses]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Expense Description</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedExpenses.length > 0 ? (
              paginatedExpenses.map((expense: ProjectExpense) => (
                <tr key={expense.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-500">
                      {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors">{expense.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${getCategoryColor(expense.category)}`}>
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest ${expense.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                      {expense.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-black text-slate-800">{formatCurrency(expense.amount)}</p>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <p className="text-slate-400 font-bold italic">No granular expense records found for this site.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls (Matching UsersPage style) */}
      {totalItems > PAGE_SIZE && (
        <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalItems)} of {totalItems} Records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-xs font-bold text-slate-700 font-inter bg-white">
              {page + 1}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectExpensesTable;
