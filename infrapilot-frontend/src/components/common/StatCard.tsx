interface Props {
  title: string;
  value: string;
  sub?: string;
  accent?: string;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isUp: boolean;
  };
}

const StatCard = ({ title, value, sub, accent = "text-primary", icon, trend }: Props) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg bg-slate-50 ${accent.replace('text-', 'text-opacity-80 ')}`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {trend.isUp ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{sub}</p>}
    </div>
  </div>
);

export default StatCard;

