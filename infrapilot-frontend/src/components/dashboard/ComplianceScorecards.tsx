import { Shield, CheckCircle2, TrendingDown, TrendingUp } from "lucide-react";

interface ScoreCardProps {
    label: string;
    score: number;
    trend: number;
    status: "Optimized" | "At Risk" | "Critical";
    incidents: number;
}

const ScoreCard = ({ label, score, trend, status, incidents }: ScoreCardProps) => (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm group hover:shadow-md transition-all">
        <div className="flex justify-between items-start mb-3">
            <div className={`p-2 rounded-lg ${label === "Quality (QC)" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
                {label === "Quality (QC)" ? <CheckCircle2 className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label} Score</p>
                <h4 className="text-2xl font-bold text-slate-800">{score}%</h4>
            </div>
        </div>

        <div className="space-y-3">
            <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                <div
                    className={`h-full ${label === "Quality (QC)" ? "bg-emerald-500" : "bg-rose-500"} rounded-full transition-all duration-1000`}
                    style={{ width: `${score}%` }}
                />
            </div>

            <div className="flex justify-between items-center text-[10px] font-bold">
                <span className={`px-2 py-0.5 rounded-full ${status === "Optimized" ? "bg-emerald-50 text-emerald-600" : status === "At Risk" ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                    }`}>
                    {status}
                </span>
                <div className="flex items-center gap-1">
                    {trend > 0 ? <TrendingUp className="w-3 h-3 text-emerald-500" /> : <TrendingDown className="w-3 h-3 text-rose-500" />}
                    <span className={trend > 0 ? "text-emerald-500" : "text-rose-500"}>{Math.abs(trend)}% vs last month</span>
                </div>
            </div>

            <div className="pt-2 border-t border-slate-50 flex items-center justify-between text-[10px]">
                <span className="text-slate-400">Total {label === "Quality (QC)" ? "Tests" : "Incidents"}</span>
                <span className={`font-bold ${incidents > 0 ? "text-rose-500" : "text-emerald-500"}`}>{incidents} {label === "Quality (QC)" ? "Failures" : "Violations"}</span>
            </div>
        </div>
    </div>
);

interface ComplianceScorecardsProps {
    qc: { total: number; failures: number };
    safety: { total: number; incidents: number };
}

const ComplianceScorecards = ({ qc, safety }: ComplianceScorecardsProps) => {
    const qcScore = 100 - (qc.total > 0 ? Math.round((qc.failures / qc.total) * 100) : 0);
    const safetyScore = 100 - (safety.incidents * 5); // Example deduction logic

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScoreCard
                label="Quality (QC)"
                score={qcScore || 92}
                trend={2.4}
                status={qcScore > 90 ? "Optimized" : "At Risk"}
                incidents={qc.failures}
            />
            <ScoreCard
                label="Safety (HSE)"
                score={safetyScore > 0 ? safetyScore : 65}
                trend={-3.1}
                status={safetyScore > 85 ? "Optimized" : "At Risk"}
                incidents={safety.incidents}
            />
        </div>
    );
};

export default ComplianceScorecards;
