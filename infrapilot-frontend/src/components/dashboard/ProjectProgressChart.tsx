import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
    { name: 'Completed', value: 45 },
    { name: 'In Progress', value: 35 },
    { name: 'Delayed', value: 15 },
    { name: 'Not Started', value: 5 },
];

const COLORS = ['#10b981', '#3b82f6', '#f43f5e', '#cbd5e1'];

const ProjectProgressChart = () => {
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col h-full">
            <h3 className="font-bold text-slate-800 mb-4">Project Progress %</h3>
            <div className="flex-1 min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ProjectProgressChart;
