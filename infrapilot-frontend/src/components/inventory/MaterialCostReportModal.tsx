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
        <div className="bg-slate-800 text-white shadow-xl rounded-lg p-3 border border-slate-700/50">
          <p className="font-bold text-sm mb-1">{payload[0].name}</p>
          <p className="text-emerald-400 font-bold text-base">
            ₹{payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Material Cost & Expense Report
            </h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Aggregated breakdown across all active inventory items.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5"
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
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 border-l-4 border-l-emerald-500 flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center font-black text-xl">
                ₹
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Total Valuation
                </p>
                <p className="text-2xl font-black text-slate-800">
                  ₹{(totalExpense / 100000).toFixed(2)}
                  <span className="text-sm font-bold text-slate-500">L</span>
                </p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100 border-l-4 border-l-blue-500 flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center font-black text-xl">
                📦
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Categories
                </p>
                <p className="text-2xl font-black text-slate-800">
                  {categoryData.length}
                </p>
              </div>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100 border-l-4 border-l-amber-500 flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center font-black text-xl">
                🏗️
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Active Sites
                </p>
                <p className="text-2xl font-black text-slate-800">
                  {projectData.length}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Pie Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>{" "}
                Category-wise Distribution
              </h3>
              <div className="h-[300px] w-full flex-1">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={5}
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
                        wrapperStyle={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          color: "#64748b",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                    No category data available
                  </div>
                )}
              </div>
            </div>

            {/* Project Bar Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>{" "}
                Project-wise Allocation
              </h3>
              <div className="h-[300px] w-full flex-1">
                {projectData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={100}>
                    <BarChart
                      data={projectData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={true}
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(value) => `₹${value / 1000}k`}
                        tick={{
                          fill: "#94a3b8",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={100}
                        tick={{
                          fill: "#64748b",
                          fontSize: 10,
                          fontWeight: "bold",
                        }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: "#f8fafc" }}
                      />
                      <Bar
                        dataKey="value"
                        fill="#10b981"
                        radius={[0, 4, 4, 0]}
                        maxBarSize={40}
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
                  <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
                    No project data available
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
