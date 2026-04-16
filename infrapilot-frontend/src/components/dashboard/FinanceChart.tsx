import {
<<<<<<< HEAD
  BarChart,
  Bar,
=======
  AreaChart,
  Area,
>>>>>>> testing
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
<<<<<<< HEAD
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
=======
  ResponsiveContainer,
} from "recharts";

const data = [
  { month: "Jan", expense: 12.5, budget: 15 },
  { month: "Feb", expense: 18.2, budget: 15 },
  { month: "Mar", expense: 14.8, budget: 15 },
  { month: "Apr", expense: 22.4, budget: 20 },
  { month: "May", expense: 19.5, budget: 20 },
  { month: "Jun", expense: 26.8, budget: 20 },
>>>>>>> testing
];

const FinanceChart = () => {
  return (
<<<<<<< HEAD
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
=======
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94a3b8", fontSize: 10 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "#94a3b8", fontSize: 10 }}
            tickFormatter={(value) => `₹${value}L`}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
              fontSize: "12px",
            }}
            formatter={(value) => [`₹${value} Lakhs`, "Expense"]}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#6366f1"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorExpense)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
>>>>>>> testing
    </div>
  );
};

export default FinanceChart;
