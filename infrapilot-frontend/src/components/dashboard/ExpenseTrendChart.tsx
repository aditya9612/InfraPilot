import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface ExpenseTrendChartProps {
    data?: any[];
}

const defaultData = [
    { month: "Jan", budget: 4000, actual: 2400 },
    { month: "Feb", budget: 3000, actual: 1398 },
    { month: "Mar", budget: 2000, actual: 9800 },
    { month: "Apr", budget: 2780, actual: 3908 },
    { month: "May", budget: 1890, actual: 4800 },
    { month: "Jun", budget: 2390, actual: 3800 },
];

const ExpenseTrendChart = ({ data = defaultData }: ExpenseTrendChartProps) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-slate-800">Expense Trend</h3>
                    <p className="text-xs text-slate-500">Budget vs Actual Costs</p>
                </div>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="month"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: "#94a3b8", fontSize: 12 }}
                        />
                        <Tooltip
                            cursor={{ fill: "#f8fafc" }}
                            contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            }}
                        />
                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: "20px", fontSize: "12px" }}
                        />
                        <Bar name="Budget" dataKey="budget" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                        <Bar name="Actual" dataKey="actual" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ExpenseTrendChart;
