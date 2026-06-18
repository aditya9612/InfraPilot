import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
    { month: 'Jan', planned: 10, actual: 12 },
    { month: 'Feb', planned: 25, actual: 22 },
    { month: 'Mar', planned: 40, actual: 35 },
    { month: 'Apr', planned: 55, actual: 50 },
    { month: 'May', planned: 70, actual: 68 },
    { month: 'Jun', planned: 85, actual: 80 },
];

const MonthlyTrendChart = () => {
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col h-full">
            <h3 className="font-bold text-slate-800 mb-4">Monthly Progress Trend</h3>
            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value}%`} />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                        <Line type="monotone" dataKey="planned" name="Planned %" stroke="#cbd5e1" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="actual" name="Actual %" stroke="#3b82f6" strokeWidth={3} dot={{ strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default MonthlyTrendChart;
