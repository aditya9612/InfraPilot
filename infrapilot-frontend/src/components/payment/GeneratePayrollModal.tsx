import { useState } from 'react';
import Modal from '../common/Modal';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';
import { Calendar, FileText } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    projectId: number;
}

export default function GeneratePayrollModal({ isOpen, onClose, onSuccess, projectId }: Props) {
    const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
    const [year, setYear] = useState<number>(new Date().getFullYear());
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleGenerate = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                project_id: projectId,
                month: month,
                year: year
            };
            
            console.log("POST /api/v1/labour/payroll/generate Payload:", payload);
            await paymentService.generatePayroll(payload);
            
            toast.success(`Payroll generated successfully for ${month}/${year}!`);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to generate payroll');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Generate Monthly Payroll"
            footer={
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={isSubmitting}
                        className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-all shadow-lg shadow-primary/30 flex items-center gap-2"
                    >
                        {isSubmitting ? (
                            'Generating...'
                        ) : (
                            <>
                                <FileText className="w-4 h-4" />
                                Generate Payroll
                            </>
                        )}
                    </button>
                </div>
            }
        >
            <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
                    <div className="flex items-center gap-3 text-sm text-slate-500 font-medium pb-2 border-b border-slate-200">
                        <Calendar className="w-4 h-4 text-primary" />
                        Select Period for Payroll Generation
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Target Month</label>
                            <select 
                                value={month}
                                onChange={(e) => setMonth(parseInt(e.target.value))}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all font-bold"
                            >
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                    <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Target Year</label>
                            <input 
                                type="number" 
                                min="2020"
                                max="2100"
                                value={year}
                                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-primary transition-all font-bold"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
                    <p className="text-xs text-amber-700 font-medium">
                        <strong>Note:</strong> Generating payroll will calculate the total working hours, overtime, and wages for all workers in the selected month based on their attendance records.
                    </p>
                </div>
            </div>
        </Modal>
    );
}
