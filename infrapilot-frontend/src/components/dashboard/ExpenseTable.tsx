interface Expense {
  id: string;
  type: "Material" | "Labor" | "Equipment" | "Overhead";
  project: string;
  amount: number;
  date: string;
}

const expenses: Expense[] = [
  { id: "EXP-501", type: "Material", project: "Skyline Residency", amount: 120000, date: "Mar 24, 2026" },
  { id: "EXP-502", type: "Labor", project: "Metropolis Hub", amount: 85000, date: "Mar 26, 2026" },
  { id: "EXP-503", type: "Equipment", project: "Coastal Bridge", amount: 240000, date: "Mar 20, 2026" },
  { id: "EXP-504", type: "Material", project: "Green Valley", amount: 65000, date: "Mar 22, 2026" },
];

const ExpenseTable = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h3 className="font-bold text-slate-800">Expense Tracking</h3>
        <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 outline-none text-slate-600">
          <option>All Expense Types</option>
          <option>Material</option>
          <option>Labor</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Project</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      exp.type === "Material" ? "bg-blue-500" :
                      exp.type === "Labor" ? "bg-amber-500" :
                      exp.type === "Equipment" ? "bg-purple-500" : "bg-slate-400"
                    }`} />
                    <span className="text-sm font-medium text-slate-700">{exp.type}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm text-slate-600">{exp.project}</td>
                <td className="px-5 py-3.5 text-sm font-bold text-slate-700">₹{exp.amount.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-xs text-slate-400 text-right">{exp.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-3 bg-slate-50 text-center">
        <button className="text-xs font-bold text-primary hover:underline">Add New Expense</button>
      </div>
    </div>
  );
};

export default ExpenseTable;
