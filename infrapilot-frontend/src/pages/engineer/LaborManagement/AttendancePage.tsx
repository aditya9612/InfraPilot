import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import toast from "react-hot-toast";

const laborData = [
    { id: 1, name: "Ram Singh", aadhaar: "4532 9821 1234", contractor: "ABC Constructions", type: "Skilled", wageRate: 650 },
    { id: 2, name: "Shyam Lal", aadhaar: "8821 3342 5678", contractor: "ABC Constructions", type: "Unskilled", wageRate: 450 },
    { id: 3, name: "Mohit Kumar", aadhaar: "1234 5678 9012", contractor: "Global Infra", type: "Skilled", wageRate: 600 },
    { id: 4, name: "Suresh Mani", aadhaar: "9876 5432 3456", contractor: "Global Infra", type: "Unskilled", wageRate: 400 },
];

const AttendancePage = () => {
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);
    const [attendance, setAttendance] = useState<Record<number, any>>(
        laborData.reduce((acc, l) => ({
            ...acc,
            [l.id]: { present: true, inTime: "09:00", outTime: "18:00", hours: 9, overtime: 0 }
        }), {})
    );

    const handleAttendanceChange = (id: number, field: string, value: any) => {
        setAttendance(prev => ({
            ...prev,
            [id]: { ...prev[id], [field]: value }
        }));
    };

    const handleSave = () => {
        toast.success(`Attendance for ${attendanceDate} saved!`);
    };

    return (
        <>
            <Navbar title="Labor Attendance" breadcrumb={["Engineer", "Labor", "Attendance"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Labor Management</h1>
                        <p className="text-slate-500 text-sm">Mark daily presence and working hours for all site labor.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary/20 outline-none w-full sm:w-auto"
                        />
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 w-full sm:w-auto"
                        >
                            Save
                        </button>
                    </div>
                </div>

                {/* Submenu Tabs */}
                <div className="flex border-b border-slate-200 mb-8 overflow-x-auto">
                    <button className="px-6 py-3 text-sm font-black uppercase tracking-widest border-b-2 border-primary text-primary whitespace-nowrap">
                        Attendance
                    </button>
                    <Link to="/engineer/labor/details" className="px-6 py-3 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors whitespace-nowrap">
                        Labor Details
                    </Link>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50">
                                    <th className="px-6 py-4">Worker Info & Aadhaar</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4">In / Out Time</th>
                                    <th className="px-6 py-4">Working Hours</th>
                                    <th className="px-6 py-4 text-center">OT (Hrs)</th>
                                    <th className="px-6 py-4 text-right">Wage Rate</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {laborData.map((l) => (
                                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-700 group-hover:text-primary transition-colors">{l.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                                    {l.aadhaar} | {l.type} | {l.contractor}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleAttendanceChange(l.id, 'present', true)}
                                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${attendance[l.id].present ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'bg-slate-100 text-slate-400'}`}
                                                >
                                                    P
                                                </button>
                                                <button
                                                    onClick={() => handleAttendanceChange(l.id, 'present', false)}
                                                    className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${!attendance[l.id].present ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'bg-slate-100 text-slate-400'}`}
                                                >
                                                    A
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="time"
                                                    disabled={!attendance[l.id].present}
                                                    value={attendance[l.id].inTime}
                                                    onChange={(e) => handleAttendanceChange(l.id, 'inTime', e.target.value)}
                                                    className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none disabled:opacity-50"
                                                />
                                                <span className="text-slate-300">-</span>
                                                <input
                                                    type="time"
                                                    disabled={!attendance[l.id].present}
                                                    value={attendance[l.id].outTime}
                                                    onChange={(e) => handleAttendanceChange(l.id, 'outTime', e.target.value)}
                                                    className="text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none disabled:opacity-50"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-slate-600">
                                            <span className={`px-2 py-1 rounded-md ${attendance[l.id].present ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'}`}>
                                                {attendance[l.id].present ? 9 : 0} Hrs
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="number"
                                                disabled={!attendance[l.id].present}
                                                value={attendance[l.id].overtime}
                                                onChange={(e) => handleAttendanceChange(l.id, 'overtime', e.target.value)}
                                                className="w-12 text-center text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 outline-none disabled:opacity-50"
                                            />
                                        </td>
                                        <td className="px-6 py-4 text-right text-xs font-black text-emerald-600">
                                            ₹{l.wageRate}/day
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default AttendancePage;
