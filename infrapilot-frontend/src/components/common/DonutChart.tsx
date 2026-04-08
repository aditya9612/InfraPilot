interface Props {
  value: number;
  size?: number;
  stroke?: string;
  label: string;
  spent: string;
  budget: string;
}

const DonutChart = ({ value, size = 80, stroke = "#14b8a6", label, spent, budget }: Props) => {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center leading-tight">{label}</p>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="7" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={stroke} strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 32 32)" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-slate-700">{spent}</span>
        </div>
      </div>
      <div className="flex gap-3 text-xs text-slate-400">
        <span>{spent} <span className="text-slate-300">Spent</span></span>
        <span>{budget} <span className="text-slate-300">Budget</span></span>
      </div>
    </div>
  );
};

export default DonutChart;
