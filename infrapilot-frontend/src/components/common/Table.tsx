import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
}

const Table = <T extends { id: string | number }>({ columns, data, className = "" }: TableProps<T>) => {
  return (
    <div className={`overflow-x-auto bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50/80 border-b border-slate-100">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 text-sm text-slate-600 font-medium whitespace-nowrap">
                  {col.render ? col.render(item) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-slate-400">
                <p className="text-2xl mb-2">📥</p>
                <p className="text-xs font-bold uppercase tracking-widest">No data available</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
