import { useEffect, useState } from "react";
import { clientPaymentService, type ClientPaymentAnalytics, type InvoiceSummary } from "../../services/clientPaymentService";
import { IndianRupee, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import { formatCompactCurrency } from "../../utils/currencyUtils";
import StatCard from "../common/StatCard";
import { useProject } from "../../context/ProjectContext";
const ClientPaymentAnalyticsUI = () => {
    const { selectedProjectId } = useProject();
    const [analytics, setAnalytics] = useState<ClientPaymentAnalytics | null>(null);
    const [invoiceSummary, setInvoiceSummary] = useState<InvoiceSummary | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [analyticsData, summaryData] = await Promise.all([
                    clientPaymentService.getAnalytics(selectedProjectId ? { project_id: selectedProjectId } : undefined),
                    clientPaymentService.getInvoiceSummary(selectedProjectId ? { project_id: selectedProjectId } : undefined)
                ]);
                setAnalytics(analyticsData);
                setInvoiceSummary(summaryData);
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
