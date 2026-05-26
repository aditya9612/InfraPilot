import { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "../../utils/currencyUtils";

interface MaterialCostReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  inventory: any[];
  projects: Record<number, string>;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const MaterialCostReportModal = ({
  isOpen,
  onClose,
  inventory,
  projects,
}: MaterialCostReportModalProps) => {
  if (!isOpen) return null;

  // Process data for Category-wise Cost calculation
  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    inventory.forEach((item) => {
      const cat = item.category || "Uncategorized";
      categoryMap[cat] = (categoryMap[cat] || 0) + item.total_amount;
    });

    return Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [inventory]);

  // Process data for Project-wise Cost calculation
  const projectData = useMemo(() => {
    const projectMap: Record<string, number> = {};
    inventory.forEach((item) => {
      const projName = projects[item.project_id] || "Global / Unknown Site";
      projectMap[projName] = (projectMap[projName] || 0) + item.total_amount;
    });

    return Object.entries(projectMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [inventory, projects]);

  const totalExpense = useMemo(() => {
    return inventory.reduce((sum, item) => sum + item.total_amount, 0);
  }, [inventory]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/90 backdrop-blur-md text-white shadow-2xl rounded-2xl p-4 border border-white/10">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].name}</p>
          <p className="text-xl font-black text-white">
            ₹{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200 font-inter">
      <div className="bg-white rounded-[40px] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] w-full max-w-6xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-8 border-b border-slate-100 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] -mr-48 -mt-48" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black tracking-tight">
              Inventory Financial Analysis
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
              Real-time Asset Valuation & Cost Distribution
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all relative z-10"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-10 overflow-y-auto bg-slate-50 flex-1 scrollbar-hide">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
            <div className="bg-slate-900 p-8 rounded-[32px] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 relative z-10">Total Inventory Value</p>
              <div className="flex items-baseline gap-1 relative z-10">
                <span className="text-3xl font-black text-white">{formatCurrency(totalExpense)}</span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Material Categories</p>
              <p className="text-3xl font-black text-slate-900 relative z-10">{categoryData.length}</p>
            </div>

            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">Strategic Sites</p>
              <p className="text-3xl font-black text-slate-900 relative z-10">{projectData.length}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            {/* Category Pie Chart */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                  Asset Distribution
                </h3>
              </div>
              <div className="flex-1 w-full">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={8}
                        dataKey="value"
                        stroke="none"
                      >
                        {categoryData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        formatter={(value) => <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{value}</span>}
                        wrapperStyle={{ paddingTop: "20px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Insufficient Data
                  </div>
                )}
              </div>
            </div>

            {/* Project Bar Chart */}
            <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 flex flex-col min-h-[450px]">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Project Valuations
                </h3>
              </div>
              <div className="flex-1 w-full">
                {projectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                      data={projectData}
                      layout="vertical"
                      margin={{ left: 20, right: 20 }}
                    >
                      <CartesianGrid
                        strokeDasharray="4 4"
                        horizontal={false}
                        vertical={true}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => `₹${value / 1000}k`}
                        tick={{ fill: "#94a3b8", fontSize: 9, fontWeight: 900 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{ fill: "#64748b", fontSize: 9, fontWeight: "black" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
                      <Bar
                        dataKey="value"
                        fill="#10b981"
                        radius={[0, 12, 12, 0]}
                        maxBarSize={32}
                      >
                        {projectData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[(index + 1) % COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                    Insufficient Data
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialCostReportModal;
