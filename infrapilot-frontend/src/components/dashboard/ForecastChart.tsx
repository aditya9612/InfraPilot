import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

interface ForecastChartProps {
    data?: any[];
}

const defaultData = [
    { month: "Jan", actual: 10, forecast: 10 },
    { month: "Feb", actual: 25, forecast: 25 },
    { month: "Mar", actual: 40, forecast: 40 },
    { month: "Apr", actual: 55, forecast: 55 },
    { month: "May", actual: 70, forecast: 72 },
    { month: "Jun", forecast: 85 },
    { month: "Jul", forecast: 100 },
];

const ForecastChart = ({ data = defaultData }: ForecastChartProps) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-slate-800">Project Completion Forecast</h3>
                    <p className="text-xs text-slate-500">Actual vs Scheduled Progress</p>
                </div>
            </div>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
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
                            unit="%"
                        />
                        <Tooltip
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
                        <Line
                            name="Scheduled"
                            type="monotone"
                            dataKey="forecast"
                            stroke="#94a3b8"
                            strokeDasharray="5 5"
                            dot={{ r: 4 }}
                        />
                        <Line
                            name="Actual Progress"
                            type="monotone"
                            dataKey="actual"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ r: 6, fill: "#10b981" }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ForecastChart;
