import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';
import { HelpCircle, AlertCircle } from 'lucide-react';
import { projectService } from '../../services/projectService';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    labour: any;
    onSuccess: () => void;
}

const AdvancePaymentModal: React.FC<Props> = ({ isOpen, onClose, labour, onSuccess }) => {
    const [formData, setFormData] = useState({
        labour_id: 0,
        project_id: 1, // Will be overridden on mount
        amount: 0,
        description: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await projectService.getProjects(100, 0);
                setProjects(Array.isArray(res) ? res : (res.items || []));
            } catch (err) {
                console.error("Failed to fetch projects for advance modal");
            }
        };
        fetchProjects();
    }, []);

    // SRS: Max 50% of monthly salary (26 working days)
    const dailyWage = parseFloat(labour?.daily_wage_rate || '0');
    const monthlySalary = dailyWage * 26;
    const maxAllowed = monthlySalary * 0.5;

    useEffect(() => {
        if (isOpen && labour) {
            setFormData({
                labour_id: labour.id,
                project_id: labour.project_id || 1, // Fallback if project_id is not on labour
                amount: 0,
                description: ''
            });
        }
    }, [isOpen, labour]);

    const handleSubmit = async () => {
        if (formData.amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (formData.amount > maxAllowed) {
            toast.error(`Advance cannot exceed 50% of salary (Max ₹${maxAllowed.toLocaleString()})`);
            return;
        }
        if (!formData.description.trim()) {
            toast.error('Reason is mandatory');
            return;
        }

        setIsSubmitting(true);
        try {
            await paymentService.requestAdvance(formData);
            toast.success(`Advance request submitted for ${labour.labour_name}`);
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Failed to submit request');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Advance Request: ${labour?.labour_name}`}
            maxWidth="max-w-lg"
            footer={
                <div className="flex gap-4">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                    <button 
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-2 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                {/* Policy Alert */}
                <div className="bg-blue-50/50 p-4 rounded-2xl flex gap-3 border border-blue-100">
                    <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Advance Policy (SRS v3.0)</p>
                        <p className="text-xs font-bold text-blue-500 leading-tight">
                            Maximum advance limit is 50% of the monthly base salary. Requests are submitted by Site Engineers and require Admin approval.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Labour Name</label>
                        <input
                            type="text"
                            value={labour?.labour_name || ''}
                            disabled
                            className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm outline-none text-slate-500 font-bold cursor-not-allowed"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Project</label>
                        <select
                            value={formData.project_id}
                            onChange={(e) => setFormData({ ...formData, project_id: Number(e.target.value) })}
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all font-bold"
                        >
                            {projects.map((p: any) => (
                                <option key={p.id} value={p.id}>{p.name || `Project ${p.id}`}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Daily Basic Amount</p>
                        <p className="text-lg font-black text-slate-800 italic-none">₹{dailyWage.toLocaleString()}</p>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Max Allowed</p>
                        <p className="text-lg font-black text-emerald-600 italic-none">₹{maxAllowed.toLocaleString()}</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Requested Amount *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                            <input 
                                type="number" 
                                value={formData.amount || ''}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00"
                                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-primary transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Reason / Emergency Note *</label>
                        <div className="relative">
                            <HelpCircle className="absolute left-4 top-4 w-4 h-4 text-slate-400" />
                            <textarea 
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="State the reason for advance (Medical, Personal, etc.)"
                                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:border-primary transition-all min-h-[100px] resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default AdvancePaymentModal;
