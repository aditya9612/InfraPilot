import { useState, useEffect } from "react";
import type {
    Equipment, UsageReport, MaintenanceAlert, EquipmentAlert, CostReport
} from "../../../services/equipmentService";
import { equipmentService } from "../../../services/equipmentService";
import { projectService } from "../../../services/projectService";
import { useAuth } from "../../../context/AuthContext";
import toast from "react-hot-toast";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";

import {
    Search, Plus, Edit2, Eye, AlertTriangle, Activity
} from "lucide-react";
import EquipmentFormModal from "../../engineer/MachineryManagement/EquipmentFormModal";

const conditionColors: Record<string, string> = {
    'GOOD': 'bg-emerald-500 text-white',
    'REPAIR': 'bg-orange-500 text-white',
    'DAMAGED': 'bg-red-500 text-white',
    'MAINTENANCE': 'bg-blue-500 text-white',
};

import { useProject } from "../../../context/ProjectContext";

const TABS = ["Registry", "Usage", "Maintenance", "Rental", "Alerts"];

const EquipmentRegistryPage = () => {
    const { selectedProjectId: globalProjectId } = useProject();
    const { user } = useAuth();

    // Effective project ID for data fetching
    const effectiveProjectId = globalProjectId || (user as any)?.project_id || 0;

    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [formData, setFormData] = useState<any>({});

    // Data States for Other Tabs
    const [usageReport, setUsageReport] = useState<UsageReport[]>([]);
    const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
    const [rentalCostReport, setRentalCostReport] = useState<CostReport[]>([]);
    const [equipmentAlerts, setEquipmentAlerts] = useState<EquipmentAlert[]>([]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const params = { limit: 100, project_id: effectiveProjectId };
            const pIdObj = { project_id: effectiveProjectId };

            if (activeTab === "Registry") {
                const res = await equipmentService.listEquipment(params);
                setEquipmentList(res.items || []);
            } else if (activeTab === "Usage") {
                const res = await equipmentService.getUsageReport(pIdObj);
                setUsageReport(res);
            } else if (activeTab === "Maintenance") {
                const res = await equipmentService.getMaintenanceAlerts(pIdObj);
                setMaintenanceAlerts(res);
            } else if (activeTab === "Rental") {
                const res = await equipmentService.getCostReport(pIdObj);
                setRentalCostReport(res);
            } else if (activeTab === "Alerts") {
                const res = await equipmentService.getEquipmentAlerts(pIdObj);
                setEquipmentAlerts(res);
            }
        } catch (err) {
            toast.error("Failed to load machinery data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, effectiveProjectId]);

    const filteredEquipment = equipmentList.filter(item => {
        const term = searchTerm.toLowerCase();
        return item.equipment_name.toLowerCase().includes(term) || item.equipment_code.toLowerCase().includes(term);
    });

    const renderRegistry = () => (
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
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading registry...</td></tr>
                ) : filteredEquipment.map(item => (
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
                                <button className="p-2 text-slate-400 hover:text-primary"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => { setFormData(item); setIsEquipmentModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary"><Edit2 className="w-4 h-4" /></button>
                            </div>
                        </td>
                    </tr>
                ))}
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
                    <tr><td colSpan={5} className="p-10 text-center text-slate-400">Loading usage report...</td></tr>
                ) : usageReport.map(report => (
                    <tr key={report.equipment_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-primary">{report.equipment_code}</td>
                        <td className="px-6 py-4 font-medium text-slate-700">{report.total_hours}</td>
                        <td className="px-6 py-4 text-slate-600">{report.avg_hours.toFixed(1)}</td>
                        <td className="px-6 py-4 text-orange-600 font-bold">{report.total_fuel}</td>
                        <td className="px-6 py-4 text-slate-500">{report.usage_count}</td>
                    </tr>
                ))}
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
                    <tr><td colSpan={4} className="p-10 text-center text-slate-400">Loading maintenance alerts...</td></tr>
                ) : maintenanceAlerts.map((alert, idx) => (
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
                ))}
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
                ) : rentalCostReport.map(report => (report.total_cost > 0 &&
                    <tr key={report.equipment_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{report.equipment_code}</td>
                        <td className="px-6 py-4 text-emerald-600 font-bold">₹{report.total_cost.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-500">{report.total_days} days</td>
                        <td className="px-6 py-4 text-slate-600 italic">Rental Asset</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );

    const renderAlerts = () => (
        <div className="p-6 space-y-4">
            {isLoading ? (
                <p className="text-center text-slate-400 py-10">Syncing telemetry alerts...</p>
            ) : equipmentAlerts.length > 0 ? equipmentAlerts.map((alert, idx) => (
                <div key={idx} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-4">
                    <div className="p-2 bg-rose-100 text-rose-600 rounded-xl">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="font-bold text-rose-900">{alert.equipment_name} ({alert.equipment_code})</h4>
                        <ul className="mt-2 space-y-1">
                            {alert.issues.map((issue, i) => (
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

    return (
        <>
            <Navbar title="Asset Command" breadcrumb={["Manager", "Resources", "Equipment Registry"]} />
            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter flex flex-col">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Equipment & Asset Registry</h1>
                        <p className="text-slate-500 text-sm">Comprehensive registry and maintenance tracking for heavy machinery.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => { setFormData({}); setIsEquipmentModalOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 h-10 transition-all active:scale-95">
                            <Plus className="w-4 h-4" /> Add Asset
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm w-fit mb-6 overflow-x-auto max-w-full">
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? "bg-slate-100 text-slate-800 shadow-inner" : "text-slate-500 hover:bg-slate-50"}`}>
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col min-h-0">
                    <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4">
                        <div className="relative max-w-md flex-1">
                            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" placeholder={`Search in ${activeTab}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                        </div>
                        {activeTab === "Registry" && (
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Total: {filteredEquipment.length}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 overflow-auto">
                        {activeTab === "Registry" && renderRegistry()}
                        {activeTab === "Usage" && renderUsage()}
                        {activeTab === "Maintenance" && renderMaintenance()}
                        {activeTab === "Rental" && renderRental()}
                        {activeTab === "Alerts" && renderAlerts()}
                    </div>
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
            />
        </>
    );
};

export default EquipmentRegistryPage;
