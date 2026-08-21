import { useEffect, useState } from "react";
import { clientPaymentService, type ClientPaymentAnalytics, type InvoiceSummary } from "../../services/clientPaymentService";
import { IndianRupee, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCompactCurrency } from "../../utils/currencyUtils";
import StatCard from "../common/StatCard";
import { useProject } from "../../context/ProjectContext";
const ClientPaymentAnalyticsUI = () => {
    const { selectedProjectId } = useProject();
    const [analytics, setAnalytics] = useState<ClientPaymentAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedProjectId) return;
            setLoading(true);
            try {
                // Fetch the actual payments linked to this project to calculate precise local metrics
                const payments = await clientPaymentService.getPaymentHistory({ project_id: selectedProjectId });

                let totalCollection = 0;
                let pendingCount = 0;
                let successCount = 0;

                payments.forEach((p: any) => {
                    const status = (p.status || p.payment_status || '').toLowerCase();
                    const amount = Number(p.amount) || 0;

                    if (status.includes('completed') || status.includes('verified') || status.includes('success')) {
                        successCount++;
                        totalCollection += amount;
                    } else if (status.includes('pending')) {
                        pendingCount++;
                    }
                });

                const average = successCount > 0 ? (totalCollection / successCount) : 0;

                setAnalytics({
                    total_collection: totalCollection.toString(),
                    pending_verification: pendingCount,
                    successful_payments: successCount,
                    average_payment: average.toString(),
                    rejected_payments: 0,
                    total_invoices: 0,
                    overdue_invoices: 0,
                    highest_payment: "0",
                });
            } catch (err) {
                console.error("Failed to fetch client payment analytics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedProjectId]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-pulse">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-slate-200 rounded-2xl w-full"></div>
                ))}
            </div>
        );
    }

    const safeAnalytics = {
        total_collection: analytics?.total_collection || "0.00",
        pending_verification: analytics?.pending_verification || 0,
        successful_payments: analytics?.successful_payments || 0,
        average_payment: analytics?.average_payment || "0.00"
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
        </div>
    );
};

export default ClientPaymentAnalyticsUI;
