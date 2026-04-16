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

<<<<<<< HEAD
const StatCard = ({ title, value, sub, accent = "text-primary", trend }: Props) => (
  <div className="bg-white rounded-[24px] p-6 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:shadow-slate-200/50 group">
    <div className="flex justify-between items-start mb-4">
      {/* <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-xl transition-transform group-hover:scale-110 duration-300`}>
        {icon}
      </div> */}
      {trend && (
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-0.5 tracking-widest uppercase ${trend.isUp ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
=======
const StatCard = ({ title, value, sub, accent = "text-primary", icon, trend }: Props) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 transition-all hover:shadow-md">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg bg-slate-50 ${accent.replace('text-', 'text-opacity-80 ')}`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${trend.isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
>>>>>>> testing
          {trend.isUp ? '↑' : '↓'} {trend.value}
        </span>
      )}
    </div>
    <div>
<<<<<<< HEAD
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-primary transition-colors font-inter">{title}</p>
      <p className={`text-3xl font-black ${accent} tracking-tighter`}>{value}</p>
      {sub && (
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-1 h-1 rounded-full bg-slate-200" />
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{sub}</p>
        </div>
      )}
=======
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
      <p className={`text-2xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{sub}</p>}
>>>>>>> testing
    </div>
  </div>
);

export default StatCard;

