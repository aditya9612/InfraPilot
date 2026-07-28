import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { projectService } from '../../services/projectService';
import { labourService } from '../../services/labourService';
import toast from 'react-hot-toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialSelectedUserIds?: number[];
    initialProjectId?: number;
    eligibleForCheckOutIds?: number[];
    selectedLaboursContext?: any[];
}

const BulkCheckOutModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialSelectedUserIds = [], initialProjectId = 0, eligibleForCheckOutIds = [], selectedLaboursContext = [] }) => {
    const [projectId, setProjectId] = useState<number>(initialProjectId);
    const [attendanceIds, setAttendanceIds] = useState<number[]>([]);
    const [remarks, setRemarks] = useState('');
    const [projects, setProjects] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Fetch projects
            projectService.getProjects(100, 0).then((data: any) => {
                setProjects(Array.isArray(data) ? data : (data.items || data.data || []));
            }).catch(() => { });

            // In this modal, since we don't have the full merged attendances list mapped to labour_ids internally initially,
            // we will wait for the fetch in the next useEffect to map them if needed. 
            // Or we just rely on the new fetch.
            if (initialProjectId) {
                setProjectId(initialProjectId);
            }
        }
    }, [isOpen, initialProjectId]);

    useEffect(() => {
        if (isOpen && projectId) {
            // Fetch today's attendance + project members — merge so all assigned users appear
            const today = new Date().toISOString().split('T')[0];

            const fetchAttendance = labourService.getAttendanceList(projectId, today, today).then((res: any) => {
                if (Array.isArray(res)) return res;
                if (res && Array.isArray(res.items)) return res.items;
                if (res && Array.isArray(res.data)) return res.data;
                return [];
            }).catch(() => []);

            const fetchMembers = projectService.getProjectMembers(projectId).then((res: any) => {
                const list = Array.isArray(res) ? res : (res?.items || res?.data || res?.members || []);
                return list.map((m: any) => ({
                    id: undefined, // no attendance_id yet
                    labour_id: m.id || m.user_id,
                    user_id: m.id || m.user_id,
                    labour_name: m.labour_name || m.name || m.full_name || m.username || `User #${m.id || m.user_id}`,
                    skill_type: m.skill_type || m.role || m.designation || "Member",
                    status: "not_checked_in",
                    in_time: "--:--",
                    out_time: null,
                }));
            }).catch(() => []);

            Promise.all([fetchAttendance, fetchMembers]).then(([attendances, members]) => {
                // Merge: attendance records take priority; fill gaps with members
                const seen = new Set<number>();
                const merged: any[] = [];
                attendances.forEach((a: any) => {
                    const uid = Number(a.user_id || a.labour_id);
                    if (uid) seen.add(uid);
                    merged.push(a);
                });
                members.forEach((m: any) => {
                    const uid = Number(m.labour_id || m.user_id);
                    if (uid && !seen.has(uid)) {
                        seen.add(uid);
                        merged.push(m);
                    }
                });

                // Only show users that were initially selected (if any selection was made)
                const usersToShow = initialSelectedUserIds.length > 0
                    ? merged.filter((att: any) => initialSelectedUserIds.map(Number).includes(Number(att.user_id || att.labour_id)))
                    : merged;

                setUsers(usersToShow);

                // Map initialSelectedUserIds to attendance_ids (only those with a real attendance id)
                const validSelection = attendances
                    .filter((att: any) => {
                        const targetId = Number(att.user_id || att.labour_id);
                        return initialSelectedUserIds.map(Number).includes(targetId) && eligibleForCheckOutIds.map(Number).includes(targetId);
                    })
                    .map((att: any) => Number(att.id));
                setAttendanceIds(validSelection);
            });
        } else {
            setUsers([]);
        }
    }, [isOpen, projectId, initialSelectedUserIds, eligibleForCheckOutIds]);



    const handleSubmit = async () => {
        if (!projectId) {
            toast.error("Please select a project.");
            return;
        }
        if (attendanceIds.length === 0) {
            toast.error("Please select at least one user.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: any = {
                attendance_ids: attendanceIds
            };
            if (remarks) {
                payload.remarks = remarks;
            } else {
                payload.remarks = "check-out";
            }

            await labourService.bulkCheckOut(payload);
            toast.success("Successfully Checked Out!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Bulk Check-Out error:", error);
            toast.error("Failed to check out. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputCls = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 font-inter";
    const labelCls = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 font-inter";

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Bulk Check-Out"
            maxWidth="max-w-xl"
            footer={
                <div className="flex items-center justify-end gap-3 px-6 pb-6 font-inter">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all font-inter"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting || attendanceIds.length === 0}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed font-inter flex items-center justify-center min-w-[100px]"
                    >
                        {isSubmitting && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Submit
                    </button>
                </div>
            }
        >
            <div className="space-y-6 font-inter">
                <div>
                    <label className={labelCls}>Select Project <span className="text-rose-500">*</span></label>
                    <select
                        value={projectId}
                        onChange={(e) => setProjectId(Number(e.target.value))}
                        className={inputCls}
                    >
                        <option value={0}>-- Select a project --</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={labelCls}>Select Users <span className="text-rose-500">*</span></label>
                    <div className="border border-slate-200 rounded-xl overflow-y-auto h-48 bg-white shadow-inner">
                        {users.length > 0 ? (
                            users.map(u => {
                                const id = u.id; // attendance.id
                                const labourId = u.user_id || u.labour_id;
                                const isSelected = attendanceIds.includes(Number(id));
                                const isEligible = eligibleForCheckOutIds.includes(Number(labourId));
                                return (
                                    <label key={id} className={`flex items-center gap-3 p-3 transition-colors border-b border-slate-100 last:border-0 ${!isEligible ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:bg-slate-50 cursor-pointer'}`}>
                                        <input
                                            type="checkbox"
                                            checked={!isEligible ? false : isSelected}
                                            disabled={!isEligible}
                                            onChange={(e) => {
                                                if (!isEligible) return;
                                                if (e.target.checked) {
                                                    setAttendanceIds(prev => [...prev, Number(id)]);
                                                } else {
                                                    setAttendanceIds(prev => prev.filter(aId => aId !== Number(id)));
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500/20 cursor-pointer"
                                        />
                                        <span className="text-sm font-medium text-slate-700 flex-1">
                                            {(() => {
                                                const ctx = selectedLaboursContext.find(l => Number(l.labour_id) === Number(labourId) || Number(l.id) === Number(labourId));
                                                return ctx?.labour_name || ctx?.name || u.labour_name || u.name || `User #${labourId}`;
                                            })()}
                                        </span>
                                        {!isEligible && (
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-200/50 px-2 py-1 rounded-full">Not Eligible</span>
                                        )}
                                    </label>
                                );
                            })
                        ) : (
                            <div className="p-6 text-center text-sm text-slate-400 font-medium">
                                {projectId ? "No users found for this project." : "Please select a project first."}
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Selected Users Summary ── */}
                {attendanceIds.length > 0 && (
                    <div>
                        <label className={labelCls}>
                            Selected Users
                            <span className="ml-2 px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full text-[10px] font-black">
                                {attendanceIds.length}
                            </span>
                        </label>
                        <div className="flex flex-wrap gap-2 p-3 bg-rose-50 border border-rose-100 rounded-xl min-h-[44px]">
                            {attendanceIds.map(attId => {
                                const u = users.find(u => Number(u.id) === attId);
                                const labourId = u?.user_id || u?.labour_id;
                                const ctx = selectedLaboursContext.find(l => Number(l.labour_id) === Number(labourId) || Number(l.id) === Number(labourId));
                                const name = ctx?.labour_name || ctx?.name || u?.labour_name || u?.name || `User #${labourId}`;
                                return (
                                    <span key={attId} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-xs font-bold shadow-sm">
                                        {name}
                                        <button
                                            type="button"
                                            onClick={() => setAttendanceIds(prev => prev.filter(id => id !== attId))}
                                            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-colors"
                                        >
                                            ×
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div>
                    <label className={labelCls}>Remarks</label>
                    <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Enter remarks..."
                        className={inputCls}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default BulkCheckOutModal;
