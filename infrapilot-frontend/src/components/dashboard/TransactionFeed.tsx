interface Transaction {
  id: string;
  type: "Income" | "Expense" | "Warning";
  description: string;
  time: string;
  icon: string;
}

const transactions: Transaction[] = [
  { id: "1", type: "Income", description: "Invoice #1024 paid for Skyline Phase 1", time: "20 mins ago", icon: "💰" },
  { id: "2", type: "Expense", description: "Material expense added: Metropolis Commercial Hub", time: "1 hour ago", icon: "📄" },
  { id: "3", type: "Warning", description: "Overdue payment from Client: Green Valley Smart City", time: "2 hours ago", icon: "⚠️" },
  { id: "4", type: "Income", description: "Payment received for NH-48 Expansion Phase 1", time: "3 hours ago", icon: "💰" },
];

const TransactionFeed = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800">Recent Transactions</h3>
        <button className="text-[11px] text-primary font-bold hover:underline">View History</button>
      </div>
      <div className="space-y-5">
        {transactions.map((t) => (
          <div key={t.id} className="flex gap-4 items-start group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-sm border ${
              t.type === "Income" ? "bg-emerald-50 border-emerald-100" :
              t.type === "Warning" ? "bg-rose-50 border-rose-100" : "bg-slate-50 border-slate-200"
            }`}>
              {t.icon}
            </div>
            <div className="flex-1 border-b border-slate-50 pb-3 last:border-0 group-hover:bg-slate-50/50 transition-colors rounded-r-lg">
              <p className="text-xs font-bold text-slate-700 leading-snug">{t.description}</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">{t.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionFeed;
