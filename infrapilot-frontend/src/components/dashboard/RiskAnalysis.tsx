interface Risk {
  id: string;
  project: string;
  issue: string;
  severity: "High" | "Medium" | "Low";
  status: string;
}

const risks: Risk[] = [
  { id: "1", project: "Metropolis Hub", issue: "Material Supply Delay", severity: "High", status: "Critical" },
  { id: "2", project: "Skyline Phase 1", issue: "Labor Shortage", severity: "Medium", status: "Warning" },
  { id: "3", project: "Green Valley", issue: "Permit Approval Pending", severity: "High", status: "Critical" },
  { id: "4", project: "Coastal Bridge", issue: "Weather Disruption", severity: "Low", status: "Monitored" },
];

const RiskAnalysis = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="font-bold text-slate-800">Delay & Risk Analysis</h3>
        <button className="text-xs text-primary font-semibold hover:underline">View All</button>
      </div>
      <div className="space-y-4">
        {risks.map((risk) => (
          <div key={risk.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors">
            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
              risk.severity === "High" ? "bg-rose-500 animate-pulse" : risk.severity === "Medium" ? "bg-amber-500" : "bg-emerald-500"
            }`} />
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className="text-sm font-bold text-slate-700">{risk.project}</p>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  risk.severity === "High" ? "bg-rose-50 text-rose-600" : risk.severity === "Medium" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
                }`}>
                  {risk.severity}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{risk.issue}</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{risk.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskAnalysis;
