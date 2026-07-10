import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import type { AttendanceRecord } from "../../types/labour";

interface EditAttendanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: Partial<AttendanceRecord>) => Promise<void>;
    record: AttendanceRecord | null;
}

const EditAttendanceModal = ({ isOpen, onClose, onSubmit, record }: EditAttendanceModalProps) => {
    const [formData, setFormData] = useState<Partial<AttendanceRecord>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (record) {
            setFormData({
                in_time: record.in_time,
                out_time: record.out_time,
                status: record.status,
                working_hours: record.working_hours,
                overtime_hours: record.overtime_hours,
                task_description: record.task_description
            });
        }
    }, [record, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Edit Attendance Record"
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="p-6 space-y-5 font-inter">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">In-Time</label>
                        <input 
                            type="time" 
                            step="1"
                            value={formData.in_time || ""}
                            onChange={(e) => setFormData({...formData, in_time: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Out-Time</label>
                        <input 
                            type="time" 
                            step="1"
                            value={formData.out_time || ""}
                            onChange={(e) => setFormData({...formData, out_time: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Attendance Status</label>
                    <select 
                        value={formData.status || ""}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="on-leave">On-Leave</option>
                        <option value="half-day">Half-Day</option>
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Working Hours</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={formData.working_hours || 0}
                            onChange={(e) => setFormData({...formData, working_hours: Number(e.target.value)})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Overtime Hours</label>
                        <input 
                            type="number" 
                            step="0.01"
                            value={formData.overtime_hours || 0}
                            onChange={(e) => setFormData({...formData, overtime_hours: Number(e.target.value)})}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Task Description</label>
                    <textarea 
                        rows={3}
                        value={formData.task_description || ""}
                        onChange={(e) => setFormData({...formData, task_description: e.target.value})}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                </div>

                <button 
                    disabled={isLoading}
                    type="submit"
                    className="w-full py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isLoading ? "Updating Record..." : "Update Attendance Entry"}
                </button>
            </form>
        </Modal>
    );
};

export default EditAttendanceModal;
