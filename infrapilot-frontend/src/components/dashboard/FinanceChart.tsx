import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

const data = [
  { project: "Skyline", budget: 50, actual: 42 },
  { project: "Metropolis", budget: 85, actual: 98 },
  { project: "Green Valley", budget: 120, actual: 110 },
  { project: "Coastal Bridge", budget: 45, actual: 60 },
  { project: "NH-48 Ext", budget: 150, actual: 135 },
];

const FinanceChart = () => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="font-bold text-slate-800">Budget vs Actual Analysis</h3>
          <p className="text-[10px] text-slate-400 mt-1">Values in ₹ Lakhs</p>
        </div>
        <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none text-slate-600">
          <option>Filter by Status</option>
          <option>Over Budget</option>
        </select>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
            barSize={12}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
            <YAxis 
              dataKey="project" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: "#64748b", fontSize: 10, fontWeight: 600 }} 
            />
            <Tooltip
              cursor={{ fill: "#f8fafc" }}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                fontSize: "12px",
              }}
            />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: "20px", fontSize: "10px" }} />
            <Bar name="Budget" dataKey="budget" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
            <Bar name="Actual" dataKey="actual" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.actual > entry.budget ? "#ef4444" : "#10b981"} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 flex items-center gap-4 text-[10px] text-slate-400 justify-center">
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Under Budget</div>
        <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Over Budget</div>
      </div>
    </div>
  );
};

export default FinanceChart;
