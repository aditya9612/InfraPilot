import { useState, useEffect, useCallback, useMemo } from "react";
import type {
    Equipment, UsageReport, MaintenanceAlert, EquipmentAlert, CostReport
} from "../../services/equipmentService";
import { equipmentService } from "../../services/equipmentService";
import toast from "react-hot-toast";
import PageTransition from "../../components/common/PageTransition";
import Pagination from "../../components/common/Pagination";
import Navbar from "../../components/common/Navbar";
import ProjectSelector from "../../components/common/ProjectSelector";
import StatCard from "../../components/common/StatCard";

import {
    Search, Plus, Edit2, Eye, AlertTriangle, Activity, TrendingUp, Download, Trash2
} from "lucide-react";
import EquipmentFormModal from "../engineer/MachineryManagement/EquipmentFormModal";
import { useProject } from "../../context/ProjectContext";

const conditionColors: Record<string, string> = {
    'GOOD': 'bg-emerald-500 text-white',
    'REPAIR': 'bg-orange-500 text-white',
    'DAMAGED': 'bg-red-500 text-white',
    'MAINTENANCE': 'bg-blue-500 text-white',
};

const TABS = ["Equipment List", "Usage & Tracking", "Maintenance", "Rental & Purchases", "Reports & Alerts"];

const EquipmentPage = () => {
    const { selectedProjectId } = useProject();

    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 10;

    // Data States
    const [usageReport, setUsageReport] = useState<UsageReport[]>([]);
    const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
    const [rentalCostReport, setRentalCostReport] = useState<CostReport[]>([]);
    const [equipmentAlerts, setEquipmentAlerts] = useState<EquipmentAlert[]>([]);

    // KPI Data
    const [kpiData, setKpiData] = useState<any>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const pIdObj = selectedProjectId ? { project_id: selectedProjectId } : {};
            const params = { limit: 100, ...pIdObj };

            if (activeTab === "Equipment List") {
                const res = await equipmentService.listEquipment(params);
                setEquipmentList(res.items || []);
            } else if (activeTab === "Usage & Tracking") {
                const res = await equipmentService.getUsageReport(pIdObj);
                setUsageReport(res);
            } else if (activeTab === "Maintenance") {
                const res = await equipmentService.getMaintenanceAlerts(pIdObj);
                setMaintenanceAlerts(res);
            } else if (activeTab === "Rental & Purchases") {
                const res = await equipmentService.getCostReport(pIdObj);
                setRentalCostReport(res);
            } else if (activeTab === "Reports & Alerts") {
                const res = await equipmentService.getEquipmentAlerts(pIdObj);
                setEquipmentAlerts(res);
                // We'll also fetch KPIs here if added to service later
            }
        } catch (err) {
            toast.error("Failed to load equipment data");
        } finally {
            setIsLoading(false);
        }
    }, [activeTab, selectedProjectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const currentListData = useMemo(() => {
        const term = searchTerm.toLowerCase();
        switch (activeTab) {
            case "Equipment List":
                return equipmentList.filter(item =>
                    (item.equipment_name || "").toLowerCase().includes(term) ||
                    (item.equipment_code || "").toLowerCase().includes(term)
                );
            case "Usage & Tracking":
                return usageReport.filter(u => (u.equipment_code || "").toLowerCase().includes(term));
            case "Maintenance":
                return maintenanceAlerts.filter(m => (m.equipment_code || "").toLowerCase().includes(term));
            case "Rental & Purchases":
                return rentalCostReport.filter(r => (r.equipment_code || "").toLowerCase().includes(term));
            case "Reports & Alerts":
                return equipmentAlerts.filter(a =>
                    (a.equipment_code || "").toLowerCase().includes(term) ||
                    (a.equipment_name || "").toLowerCase().includes(term)
                );
            default:
                return [];
        }
    }, [activeTab, searchTerm, equipmentList, usageReport, maintenanceAlerts, rentalCostReport, equipmentAlerts]);

    const pagedData = currentListData.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

    // Reset page
    useEffect(() => { setCurrentPage(0); }, [activeTab, searchTerm, selectedProjectId]);

    const handleDelete = async (id: number) => {
        if (!confirm("Are you sure you want to delete this equipment?")) return;
        try {
            await equipmentService.deleteEquipment(id);
            toast.success("Equipment deleted successfully");
            fetchData();
        } catch (err) {
            toast.error("Failed to delete equipment");
        }
    };

    // Renders
    const renderList = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Asset Name</th>
                    <th className="px-6 py-4">Serial / Code</th>
                    <th className="px-6 py-4">Condition</th>
                    <th className="px-6 py-4">Operator</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading equipment registry...</td></tr>
                ) : pagedData.length > 0 ? pagedData.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{item.equipment_name}</td>
                        <td className="px-6 py-4 font-mono text-slate-500">{item.equipment_code}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${conditionColors[item.condition] || 'bg-slate-100 text-slate-600'}`}>
                                {item.condition}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{item.operator_name || "—"}</td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => { setFormData(item); setIsViewMode(true); setIsEquipmentModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => { setFormData(item); setIsViewMode(false); setIsEquipmentModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </td>
                    </tr>
                )) : (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium">No equipment records found</td></tr>
                )}
            </tbody>
        </table>
    );

    const renderUsage = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Equipment Code</th>
                    <th className="px-6 py-4">Total Hours</th>
                    <th className="px-6 py-4">Avg Hours/Day</th>
                    <th className="px-6 py-4">Total Fuel (L)</th>
                    <th className="px-6 py-4">Entries</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading usage logs...</td></tr>
                ) : pagedData.length > 0 ? pagedData.map((report: any) => (
                    <tr key={report.equipment_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-primary">{report.equipment_code}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{report.total_hours}</td>
                        <td className="px-6 py-4 text-slate-600">{report.avg_hours?.toFixed(1) || "0.0"}</td>
                        <td className="px-6 py-4 text-orange-600 font-bold">{report.total_fuel}</td>
                        <td className="px-6 py-4 text-slate-500">{report.usage_count}</td>
                    </tr>
                )) : (
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium">No usage reports found</td></tr>
                )}
            </tbody>
        </table>
    );

    const renderMaintenance = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Asset Code</th>
                    <th className="px-6 py-4">Next Service Date</th>
                    <th className="px-6 py-4">Days remaining</th>
                    <th className="px-6 py-4">Status</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">Loading maintenance schedule...</td></tr>
                ) : pagedData.length > 0 ? pagedData.map((alert: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{alert.equipment_code}</td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{alert.maintenance_date}</td>
                        <td className="px-6 py-4 text-slate-500">{alert.days_until} days</td>
                        <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${alert.status === 'OVERDUE' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                                {alert.status}
                            </span>
                        </td>
                    </tr>
                )) : (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium">No maintenance alerts</td></tr>
                )}
            </tbody>
        </table>
    );

    const renderRental = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Asset Code</th>
                    <th className="px-6 py-4">Total Cost</th>
                    <th className="px-6 py-4">Active Tenure</th>
                    <th className="px-6 py-4">Vendor Info</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">Loading cost reports...</td></tr>
                ) : pagedData.length > 0 ? pagedData.map((report: any) => (
                    <tr key={report.equipment_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{report.equipment_code}</td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">₹{report.total_cost?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-500">{report.total_days} days</td>
                        <td className="px-6 py-4 text-slate-600 italic">Rental Asset</td>
                    </tr>
                )) : (
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-medium">No rental costs found</td></tr>
                )}
            </tbody>
        </table>
    );

    const renderAlerts = () => (
        <div className="p-6 space-y-4">
            {isLoading ? (
                <p className="text-center text-slate-400 py-10">Syncing telemetry alerts...</p>
            ) : pagedData.length > 0 ? pagedData.map((alert: any, idx: number) => (
                <div key={idx} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-rose-900">{alert.equipment_name} ({alert.equipment_code})</h4>
                        <ul className="mt-2 space-y-1">
                            {alert.issues && alert.issues.map((issue: any, i: number) => (
                                <li key={i} className="text-sm text-rose-700 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                                    {issue.type}: {issue.current_hours}hrs (Threshold: {issue.limit})
                                </li>
                            ))}
                        </ul>
                        <div className="mt-3 p-2 bg-white/50 rounded-lg text-xs font-semibold text-rose-800">
                            Action: {alert.recommendation}
                        </div>
                    </div>
                </div>
            )) : (
                <div className="text-center py-20 text-slate-400">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>All assets operating within normal telemetry thresholds.</p>
                </div>
            )}
        </div>
    );

    const exportExcel = async () => {
        try {
            await equipmentService.exportExcel();
            toast.success("Excel exported successfully");
        } catch {
            toast.error("Failed to export Excel");
        }
    };

    const exportPdf = async () => {
        try {
            await equipmentService.exportPdf();
            toast.success("PDF exported successfully");
        } catch {
            toast.error("Failed to export PDF");
        }
    };

    return (
        <>
            <Navbar title="Equipment Command Center" breadcrumb={["Admin", "Material & Inventory", "Equipment Management"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                {/* Header section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Equipment & Machinery</h1>
                        <p className="text-slate-500 text-sm">Full lifecycle tracking of all assets, usage, maintenance, and rentals.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <ProjectSelector variant="page" />
                        <div className="h-8 w-[1px] bg-slate-200 mx-2 hidden md:block"></div>
                        <button onClick={() => { setFormData({}); setIsViewMode(false); setIsEquipmentModalOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 h-10 transition-all active:scale-95 hover:bg-primary/90">
                            <Plus className="w-4 h-4" /> Add Asset
                        </button>
                        <div className="flex gap-2">
                            <button onClick={exportExcel} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors" title="Export Excel">
                                <Download className="w-5 h-5" />
                            </button>
                            <button onClick={exportPdf} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors" title="Export PDF">
                                <Download className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Dynamic STAT Cards based on active tab */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Assets"
                        value={equipmentList.length.toString()}
                        sub="Registered in fleet"
                        accent="text-primary"
                        icon={<TrendingUp className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Maintenance Alerts"
                        value={maintenanceAlerts.filter(a => a.status === 'OVERDUE').length.toString()}
                        sub="Overdue for service"
                        accent="text-rose-500"
                        icon={<AlertTriangle className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Active Rentals"
                        value={rentalCostReport.length.toString()}
                        sub="Current leased items"
                        accent="text-emerald-500"
                        icon={<TrendingUp className="w-5 h-5" />}
                    />
                    <StatCard
                        title="Telemetry Warnings"
                        value={equipmentAlerts.length.toString()}
                        sub="Assets exceeding thresholds"
                        accent="text-amber-500"
                        icon={<Activity className="w-5 h-5" />}
                    />
                </div>

                {/* Tab Selection */}
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 overflow-x-auto max-w-full">
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-slate-100 text-slate-800 shadow-inner" : "text-slate-500 hover:bg-slate-50"}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Main Content Pane */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4">
                        <div className="relative max-w-md flex-1">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder={`Search in ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Total: {currentListData.length}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        {activeTab === "Equipment List" && renderList()}
                        {activeTab === "Usage & Tracking" && renderUsage()}
                        {activeTab === "Maintenance" && renderMaintenance()}
                        {activeTab === "Rental & Purchases" && renderRental()}
                        {activeTab === "Reports & Alerts" && renderAlerts()}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        totalItems={currentListData.length}
                        pageSize={PAGE_SIZE}
                        onPageChange={setCurrentPage}
                        label={activeTab === "Equipment List" ? "Assets" : "Records"}
                    />
                </div>
            </PageTransition>

            <EquipmentFormModal
                isOpen={isEquipmentModalOpen}
                onClose={() => setIsEquipmentModalOpen(false)}
                onSave={async (data) => {
                    try {
                        if (data.id) await equipmentService.updateEquipment(data.id, data);
                        else await equipmentService.createEquipment(data);
                        toast.success("Registry updated");
                        setIsEquipmentModalOpen(false);
                        fetchData();
                    } catch (err) { toast.error("Failed to save asset"); }
                }}
                initialData={formData}
                isViewOnly={isViewMode}
            />
        </>
    );
};

export default EquipmentPage;
