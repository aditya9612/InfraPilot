import type { ProfitLoss } from "../../types/project";

interface ProfitLossCardProps {
  data: ProfitLoss;
}

const ProfitLossCard = ({ data }: ProfitLossCardProps) => {
  const isProfit = data.status === "profit";

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md h-full">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-slate-800">Financial Overview</h3>
        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${isProfit ? 'bg-green-100 text-success' : 'bg-red-100 text-red-600'}`}>
          {data.status}
        </span>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-bold text-slate-400 border-b border-slate-100 pb-2 uppercase tracking-wider">Revenue & Expenses</p>

        {/* 4 metrics in 2x2 grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Invoiced</p>
            <p className="text-base font-bold text-slate-700">{formatCurrency(data.total_invoice)}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Expenses</p>
            <p className="text-base font-bold text-slate-700">{formatCurrency(data.total_expense)}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-500 uppercase mb-1">Paid Invoice</p>
            <p className="text-base font-bold text-emerald-700">{formatCurrency((data as any).paid_invoice ?? 0)}</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="text-[10px] font-bold text-amber-500 uppercase mb-1">Pending Invoice</p>
            <p className="text-base font-bold text-amber-700">{formatCurrency((data as any).pending_invoice ?? 0)}</p>
          </div>
        </div>

        {/* Net Profit/Loss */}
        <div className={`rounded-xl p-4 border flex items-center justify-between ${isProfit ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
          <div>
            <p className={`text-[10px] font-bold uppercase mb-1 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>Net {isProfit ? 'Profit' : 'Loss'}</p>
            <p className={`text-xl font-bold ${isProfit ? 'text-success' : 'text-red-600'}`}>
              {isProfit ? '+' : '-'}{formatCurrency(data.profit)}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isProfit ? 'bg-green-100 text-success' : 'bg-red-100 text-red-600'}`}>
            {isProfit ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLossCard;
