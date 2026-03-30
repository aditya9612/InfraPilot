interface BOQItem {
  id: string;
  project: string;
  estimated: number;
  actual: number;
}

const items: BOQItem[] = [
  { id: "1", project: "Skyline Residency", estimated: 1200000, actual: 1150000 },
  { id: "2", project: "Metropolis Hub", estimated: 2500000, actual: 2850000 },
  { id: "3", project: "Green Valley", estimated: 4000000, actual: 3950000 },
  { id: "4", project: "Coastal Bridge", estimated: 1800000, actual: 2100000 },
];

const BOQSummary = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-slate-800">BOQ Cost Summary</h3>
        <button className="text-xs text-primary font-semibold hover:underline">View BOQ</button>
      </div>
      <div className="space-y-4">
        {items.map((item) => {
          const diff = item.estimated - item.actual;
          const isOver = diff < 0;
          return (
            <div key={item.id} className="p-3 rounded-lg border border-slate-50 bg-slate-50/30">
              <div className="flex justify-between items-start mb-2">
                <p className="text-xs font-bold text-slate-700">{item.project}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isOver ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"
                }`}>
                  {isOver ? "Overrun" : "Under Control"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Est. Cost</p>
                  <p className="text-sm font-bold text-slate-700">₹{(item.estimated / 100000).toFixed(1)}L</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider">Actual Cost</p>
                  <p className="text-sm font-bold text-slate-700">₹{(item.actual / 100000).toFixed(1)}L</p>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                <span className="text-slate-400 font-medium tracking-tight">Difference:</span>
                <span className={`font-bold ${isOver ? "text-rose-600" : "text-emerald-600"}`}>
                  {isOver ? "+" : "-"}₹{Math.abs(diff / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BOQSummary;
