import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';
import { HelpCircle, AlertCircle } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    labour: any;
    onSuccess: () => void;
}

const AdvancePaymentModal: React.FC<Props> = ({ isOpen, onClose, labour, onSuccess }) => {
    const [formData, setFormData] = useState({
        labour_id: 0,
        advance_amount: 0,
        reason: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // SRS: Max 50% of monthly salary
    const monthlySalary = (parseFloat(labour?.daily_wage_rate || '0') * 26);
    const maxAllowed = monthlySalary * 0.5;

    useEffect(() => {
        if (isOpen && labour) {
            setFormData({
                labour_id: labour.id,
                advance_amount: 0,
                reason: ''
            });
        }
    }, [isOpen, labour]);

    const handleSubmit = async () => {
        if (formData.advance_amount <= 0) {
            toast.error('Please enter a valid amount');
            return;
        }
        if (formData.advance_amount > maxAllowed) {
            toast.error(`Advance cannot exceed 50% of salary (Max ₹${maxAllowed.toLocaleString()})`);
            return;
        }
        if (!formData.reason.trim()) {
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
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monthly Salary</p>
                        <p className="text-lg font-black text-slate-800 italic-none">₹{monthlySalary.toLocaleString()}</p>
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
                                value={formData.advance_amount || ''}
                                onChange={(e) => setFormData({ ...formData, advance_amount: parseFloat(e.target.value) || 0 })}
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
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
