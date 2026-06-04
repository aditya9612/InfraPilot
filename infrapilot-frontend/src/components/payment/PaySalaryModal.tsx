import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';
import { Info } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    labour: any;
    onSuccess: () => void;
}

const PaySalaryModal: React.FC<Props> = ({ isOpen, onClose, labour, onSuccess }) => {
    const [formData, setFormData] = useState({
        labour_id: 0,
        project_id: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        amount: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && labour) {
            const pId = labour.project_id || 92;

            setFormData({
                labour_id: labour.id,
                project_id: pId,
                month: new Date().getMonth() + 1,
                year: new Date().getFullYear(),
                amount: 0
            });
        }
    }, [isOpen, labour]);

    const handlePay = async () => {
        setIsSubmitting(true);
        try {
            const finalPayload = {
                labour_id: labour.id,
                project_id: formData.project_id || 92,
                month: formData.month,
                year: formData.year,
                amount: formData.amount
            };

            console.log("POST /api/v1/labour/payroll/pay Payload:", finalPayload);
            await paymentService.paySalary(finalPayload);

            toast.success(`Disbursement for ${labour.labour_name} confirmed successfully!`);

            // Trigger immediate background refetch to update UI
            await onSuccess();
            onClose();
        } catch (error) {
            console.error("Payment Execution Failed:", error);
            toast.error('Payment sync failed. Check connection.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Pay Salary: ${labour?.labour_name}`}
            maxWidth="max-w-xl"
            footer={
                <div className="flex gap-4">
                    <button onClick={onClose} className="px-6 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                    <button
                        onClick={handlePay}
                        disabled={isSubmitting}
                        className="px-8 py-2 bg-emerald-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Processing...' : 'Confirm Payment'}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Payment Month</label>
                            <select
                                value={formData.month}
                                onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all font-bold"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Payment Year</label>
                            <input
                                type="number"
                                min="2020"
                                max="2100"
                                value={formData.year}
                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all font-bold"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Disbursement Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                            <input
                                type="number"
                                min="0"
                                value={formData.amount || ''}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 transition-all font-bold text-emerald-700"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl flex gap-3 border border-amber-100">
                    <Info className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-600 leading-relaxed italic-none uppercase tracking-tight">
                        Confirming this payment will mark the cycle as CLOSED for this worker. System prevents duplicate payments for the same cycle.
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default PaySalaryModal;
