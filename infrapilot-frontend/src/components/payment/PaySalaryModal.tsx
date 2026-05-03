import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';
import { CreditCard, Wallet, Landmark, Info } from 'lucide-react';
import type { PaymentMethod } from '../../types/payment';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    labour: any;
    onSuccess: () => void;
}

const PaySalaryModal: React.FC<Props> = ({ isOpen, onClose, labour, onSuccess }) => {
    const [formData, setFormData] = useState({
        labour_id: 0,
        payment_amount: 0,
        payment_method: 'UPI' as PaymentMethod
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock calculations as per SRS: (Daily Wage × Days) + Overtime − Advance
    const daysPresent = 24;
    const dailyWage = parseFloat(labour?.daily_wage_rate || '0');
    const baseSalary = daysPresent * dailyWage;
    const overtimeAmount = 1500;
    const advanceDeduction = 2000;
    const finalSalary = baseSalary + overtimeAmount - advanceDeduction;

    useEffect(() => {
        if (isOpen && labour) {
            setFormData({
                labour_id: labour.id,
                payment_amount: finalSalary,
                payment_method: 'UPI'
            });
        }
    }, [isOpen, labour, finalSalary]);

    const handlePay = async () => {
        setIsSubmitting(true);
        try {
            await paymentService.paySalary(formData);
            toast.success(`Salary of ₹${formData.payment_amount.toLocaleString()} paid to ${labour.labour_name}`);
            onSuccess();
            onClose();
        } catch (error) {
            toast.error('Payment failed');
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
                {/* Breakdown Card */}
                <div className="bg-slate-900 rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <p className="text-xs font-black text-white/50 uppercase tracking-[0.2em]">Salary Breakdown</p>
                            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                                Cycle: April 2026
                            </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-y-3">
                            <p className="text-sm font-bold text-white/60">Base ({daysPresent} Days)</p>
                            <p className="text-sm font-black text-right">₹{baseSalary.toLocaleString()}</p>
                            
                            <p className="text-sm font-bold text-white/60">Overtime Bonus</p>
                            <p className="text-sm font-black text-right text-emerald-400">+ ₹{overtimeAmount.toLocaleString()}</p>
                            
                            <p className="text-sm font-bold text-white/60">Advance Recovery</p>
                            <p className="text-sm font-black text-right text-rose-400">- ₹{advanceDeduction.toLocaleString()}</p>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                            <div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Net Payable Amount</p>
                                <p className="text-3xl font-black italic-none tracking-tighter text-emerald-400">₹{finalSalary.toLocaleString()}</p>
                            </div>
                            <Wallet className="w-10 h-10 text-white/10" />
                        </div>
                    </div>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Payment Method</label>
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { id: 'UPI', label: 'UPI / Digital', icon: <CreditCard className="w-5 h-5" /> },
                            { id: 'Cash', label: 'Cash Entry', icon: <Wallet className="w-5 h-5" /> },
                            { id: 'Bank', label: 'Bank Trans.', icon: <Landmark className="w-5 h-5" /> }
                        ].map((method) => (
                            <button
                                key={method.id}
                                onClick={() => setFormData({ ...formData, payment_method: method.id as PaymentMethod })}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.payment_method === method.id ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                            >
                                {method.icon}
                                <span className="text-[10px] font-black uppercase tracking-tight">{method.label}</span>
                            </button>
                        ))}
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
