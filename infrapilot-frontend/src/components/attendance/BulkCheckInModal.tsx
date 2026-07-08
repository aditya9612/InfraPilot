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
    alreadyCheckedInIds?: number[];
}

const BulkCheckInModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, initialSelectedUserIds = [], initialProjectId = 0, alreadyCheckedInIds = [] }) => {
    const [projectId, setProjectId] = useState<number>(initialProjectId);
    const [userIds, setUserIds] = useState<number[]>(initialSelectedUserIds);
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

            // Filter out already checked in users from initial selection
            const validInitialSelection = initialSelectedUserIds.map(Number).filter(id => !alreadyCheckedInIds.map(Number).includes(id));
            setUserIds(validInitialSelection);
            if (initialProjectId) {
                setProjectId(initialProjectId);
            }
        }
    }, [isOpen, initialSelectedUserIds, initialProjectId, alreadyCheckedInIds]);

    useEffect(() => {
        if (isOpen && projectId) {
            // Fetch users (labourers) - for the dropdown based on selected project
            // Using limit 100 to prevent 422 Unprocessable Entity from backend
            labourService.getLabours(projectId, { limit: 100 }).then((res: any) => {
                const fetchedUsers = res.items || (res as any).data || [];
                setUsers(fetchedUsers);
            }).catch(() => { });
        } else {
            setUsers([]);
        }
    }, [isOpen, projectId]);



    const handleSubmit = async () => {
        if (!projectId) {
            toast.error("Please select a project.");
            return;
        }
        if (userIds.length === 0) {
            toast.error("Please select at least one user.");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: any = {
                project_id: projectId,
                user_ids: userIds
            };
            if (remarks) {
                payload.remarks = remarks;
            } else {
                payload.remarks = "check-in";
            }

            await labourService.bulkCheckIn(payload);
            toast.success("Successfully Checked In!");
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Bulk Check-In error:", error);
            toast.error("Failed to check in. Please try again.");
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
            title="Bulk Check-In"
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
                        disabled={isSubmitting}
                        className="px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 font-inter"
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
                                const id = u.id || u.labour_id;
                                const isSelected = userIds.includes(Number(id));
                                const isAlreadyCheckedIn = alreadyCheckedInIds.includes(Number(id));
                                return (
                                    <label key={id} className={`flex items-center gap-3 p-3 transition-colors border-b border-slate-100 last:border-0 ${isAlreadyCheckedIn ? 'bg-slate-50 cursor-not-allowed opacity-60' : 'hover:bg-slate-50 cursor-pointer'}`}>
                                        <input
                                            type="checkbox"
                                            checked={isAlreadyCheckedIn ? true : isSelected}
                                            disabled={isAlreadyCheckedIn}
                                            onChange={(e) => {
                                                if (isAlreadyCheckedIn) return;
                                                if (e.target.checked) {
                                                    setUserIds(prev => [...prev, Number(id)]);
                                                } else {
                                                    setUserIds(prev => prev.filter(uId => uId !== Number(id)));
                                                }
                                            }}
                                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20 cursor-pointer"
                                        />
                                        <span className="text-sm font-medium text-slate-700 flex-1">
                                            {u.labour_name || u.name || `User #${id}`}
                                        </span>
                                        {isAlreadyCheckedIn && (
                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-full">Checked In</span>
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

export default BulkCheckInModal;
