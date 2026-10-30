import { useEffect, useState, useCallback } from "react";
import { clientPaymentService, type ClientPaymentAnalytics, type ClientPayment } from "../../services/clientPaymentService";
import { IndianRupee, TrendingUp, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import StatCard from "../common/StatCard";
import { useProject } from "../../context/ProjectContext";

interface ClientPaymentAnalyticsUIProps {
    payments?: ClientPayment[];
}

const ClientPaymentAnalyticsUI: React.FC<ClientPaymentAnalyticsUIProps> = ({ payments: propPayments }) => {
    const { selectedProjectId } = useProject();
    const [analytics, setAnalytics] = useState<ClientPaymentAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    const calculateMetricsFromPayments = useCallback((paymentsList: any[]) => {
        let totalCollection = 0;
        let pendingCount = 0;
        let successCount = 0;
        let rejectedCount = 0;

        paymentsList.forEach((p: any) => {
            const status = String(p.status || p.payment_status || '').toLowerCase().trim();
            const amount = Number(p.amount) || 0;

            if (status.includes('completed') || status.includes('verified') || status.includes('success') || status === 'paid' || status === 'approved') {
                successCount++;
                totalCollection += amount;
            } else if (status.includes('fail') || status.includes('reject') || status.includes('decline')) {
                rejectedCount++;
            } else if (status.includes('pending') || status === 'unverified') {
                pendingCount++;
            }
        });

        const average = successCount > 0 ? (totalCollection / successCount) : 0;

        setAnalytics({
            total_collection: totalCollection.toString(),
            pending_verification: pendingCount,
            successful_payments: successCount,
            average_payment: average.toString(),
            rejected_payments: rejectedCount,
            total_invoices: 0,
            overdue_invoices: 0,
            highest_payment: "0",
        });
    }, []);

    const fetchData = useCallback(async () => {
        if (!selectedProjectId) return;
        try {
            // Fetch the actual payments linked to this project to calculate precise local metrics
            const payments = await clientPaymentService.getPaymentHistory({ project_id: selectedProjectId });
            calculateMetricsFromPayments(payments);
        } catch (err) {
            console.error("Failed to fetch client payment analytics", err);
        } finally {
            setLoading(false);
        }
    }, [selectedProjectId, calculateMetricsFromPayments]);

    useEffect(() => {
        if (propPayments && Array.isArray(propPayments)) {
            calculateMetricsFromPayments(propPayments);
            setLoading(false);
        }
    }, [propPayments, calculateMetricsFromPayments]);

    useEffect(() => {
        if (propPayments) return;
        setLoading(true);
        fetchData();
    }, [selectedProjectId, fetchData, propPayments]);

    // Listen to real-time payment status change events across the application
    useEffect(() => {
        const handlePaymentsLoaded = (e: any) => {
            if (e.detail && Array.isArray(e.detail)) {
                calculateMetricsFromPayments(e.detail);
                setLoading(false);
            }
        };

        const handleStatusChanged = () => {
            fetchData();
        };

        window.addEventListener('client-payments-loaded', handlePaymentsLoaded);
        window.addEventListener('client-payment-status-changed', handleStatusChanged);
        window.addEventListener('client-payment-updated', handleStatusChanged);
        window.addEventListener('payment-status-changed', handleStatusChanged);

        return () => {
            window.removeEventListener('client-payments-loaded', handlePaymentsLoaded);
            window.removeEventListener('client-payment-status-changed', handleStatusChanged);
            window.removeEventListener('client-payment-updated', handleStatusChanged);
            window.removeEventListener('payment-status-changed', handleStatusChanged);
        };
    }, [fetchData, calculateMetricsFromPayments]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8 animate-pulse">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-32 bg-slate-200 rounded-2xl w-full"></div>
                ))}
            </div>
        );
    }

    const safeAnalytics = {
        total_collection: analytics?.total_collection || "0.00",
        pending_verification: analytics?.pending_verification || 0,
        successful_payments: analytics?.successful_payments || 0,
        average_payment: analytics?.average_payment || "0.00",
        rejected_payments: analytics?.rejected_payments || 0
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
            <StatCard
                title="Total Collection"
                value={`₹${parseFloat(safeAnalytics.total_collection).toLocaleString()}`}
                sub="Cumulative processed volume"
                accent="text-emerald-500"
                icon={<IndianRupee className="w-5 h-5 text-emerald-500" />}
            />

            <StatCard
                title="Pending Verification"
                value={safeAnalytics.pending_verification.toString()}
                sub="Requires admin review"
                accent="text-amber-500"
                icon={<AlertCircle className="w-5 h-5 text-amber-500" />}
            />

            <StatCard
                title="Successful Payments"
                value={safeAnalytics.successful_payments.toString()}
                sub="Fully cleared transactions"
                accent="text-blue-500"
                icon={<CheckCircle2 className="w-5 h-5 text-blue-500" />}
            />

            <StatCard
                title="Average Payment"
                value={`₹${parseFloat(safeAnalytics.average_payment).toLocaleString()}`}
                sub="Mean payment size"
                accent="text-violet-500"
                icon={<TrendingUp className="w-5 h-5 text-violet-500" />}
            />

            <StatCard
                title="Rejected Payments"
                value={safeAnalytics.rejected_payments.toString()}
                sub="Failed/Rejected transactions"
                accent="text-rose-500"
                icon={<XCircle className="w-5 h-5 text-rose-500" />}
            />
        </div>
    );
};

export default ClientPaymentAnalyticsUI;
