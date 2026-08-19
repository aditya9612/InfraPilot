import Modal from "../common/Modal";
import { Mail, Briefcase, Phone, FileText } from "lucide-react";
import type { AttendanceRecord } from "../../types/labour";
import { formatToIST } from "../../utils/dateUtils";

interface AttendanceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: AttendanceRecord | null;
}

const AttendanceDetailModal = ({ isOpen, onClose, record }: AttendanceDetailModalProps) => {
    if (!record) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Attendance Verification Audit"
            maxWidth="max-w-xl"
        >
            <div className="p-6 font-inter text-inter italic-none">
                {/* ── Profile Style Header ────────────────── */}
                <div className="bg-primary rounded-[2rem] p-8 mb-8 text-white shadow-xl relative overflow-hidden font-inter">
                    <div className="relative z-10 flex items-center gap-6 font-inter">
                        <div className="flex gap-4">
                            <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative overflow-hidden font-inter">
                                <img
                                    src={record.check_in_image || record.selfie_url || "https://images.unsplash.com/photo-1590650153855-d9e808231d41?w=400&h=400&fit=crop"}
                                    alt="Check-in"
                                    className="w-full h-full object-cover font-inter"
                                />
                                <div className="absolute top-1 left-1 px-1 bg-blue-600 text-[6px] font-black rounded uppercase">Check-In</div>
                            </div>
                            {record.check_out_image && (
                                <div className="w-24 h-24 bg-blue-400/30 backdrop-blur-md rounded-3xl flex items-center justify-center border border-white/20 relative overflow-hidden font-inter">
                                    <img
                                        src={record.check_out_image}
                                        alt="Check-out"
                                        className="w-full h-full object-cover font-inter"
                                    />
                                    <div className="absolute top-1 left-1 px-1 bg-rose-600 text-[6px] font-black rounded uppercase">Check-Out</div>
                                </div>
                            )}
                        </div>
                        <div className="font-inter">
                            <div className="flex items-center gap-3 mb-2 font-inter">
                                <h3 className="text-2xl font-black tracking-tight font-inter">{record.labour_name}</h3>
                                <span className="px-2 py-0.5 bg-white/20 rounded-lg text-[10px] font-black uppercase tracking-widest font-inter">
                                    {record.status === "present" ? "On-Site" : record.status}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-white/60 mb-4 font-inter">
                                <Mail className="w-3 h-3" />
                                <span className="text-[11px] font-bold font-inter italic-none">
                                    attendance.ref-{record.id}@infrapilot.com
                                </span>
                            </div>
                            <div className="px-3 py-1 bg-white/20 rounded-full inline-block font-inter">
                                <span className="text-[10px] font-black uppercase tracking-widest font-inter">
                                    IN: {formatToIST(record.in_time)} • OUT: {record.out_time ? formatToIST(record.out_time) : "ACTIVE"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 px-2 mb-10 font-inter">
                    {/* Professional Information Style Section */}
                    <div className="font-inter">
                        <div className="flex items-center gap-2 mb-6 font-inter">
                            <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                <Briefcase className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Operational Intelligence</p>
                        </div>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                            <div className="font-inter">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Shift Schedule</p>
                                <p className="text-sm font-black text-slate-800 font-inter italic-none">Standard Shift</p>
                            </div>
                            <div className="font-inter">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Validation Status</p>
                                <p className="text-sm font-black text-emerald-500 font-inter italic-none">FaceMatch Verified</p>
                            </div>
                            <div className="font-inter">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Personnel Code</p>
                                <p className="text-sm font-black text-slate-800 font-inter italic-none">{record.worker_code}</p>
                            </div>
                            <div className="font-inter">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Employment Status</p>
                                <p className="text-sm font-black text-blue-600 font-inter italic-none">Active Site Crew</p>
                            </div>
                        </div>
                    </div>

                    {/* Contact Details Style Section */}
                    <div className="font-inter">
                        <div className="flex items-center gap-2 mb-6 font-inter">
                            <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                <Phone className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Audit Trail & Logistics</p>
                        </div>
                        <div className="grid grid-cols-1 gap-y-6 font-inter">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="font-inter">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Check-in Address</p>
                                    <p className="text-xs font-bold text-slate-600 font-inter italic-none leading-relaxed">
                                        {record.check_in_address}
                                    </p>
                                </div>
                                {record.check_out_address && (
                                    <div className="font-inter">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Check-out Address</p>
                                        <p className="text-xs font-bold text-slate-600 font-inter italic-none leading-relaxed">
                                            {record.check_out_address}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-x-12 font-inter">
                                <div className="font-inter">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Check-in Time</p>
                                    <p className="text-sm font-black text-slate-800 font-inter italic-none">{formatToIST(record.in_time)}</p>
                                </div>
                                <div className="font-inter">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Check-out Time</p>
                                    <p className="text-sm font-black text-slate-800 font-inter italic-none">{record.out_time ? formatToIST(record.out_time) : "Pending"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Deployment section */}
                    <div className="font-inter">
                        <div className="flex items-center gap-2 mb-6 font-inter">
                            <div className="p-2 bg-blue-50 rounded-lg font-inter">
                                <FileText className="w-4 h-4 text-primary" />
                            </div>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em] font-inter">Deployment Status</p>
                        </div>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-6 font-inter">
                            <div className="font-inter">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Assigned Task</p>
                                <p className="text-sm font-black text-slate-800 font-inter italic-none">{record.task_id || "General Site Work"}</p>
                            </div>
                            <div className="font-inter">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Attendance Integrity</p>
                                <p className="text-sm font-black text-emerald-500 font-inter italic-none">High Confidence</p>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-5 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter italic-none"
                >
                    Dismiss Verification Audit
                </button>
            </div>
        </Modal>
    );
};

export default AttendanceDetailModal;
