import { useState, useEffect, useCallback, useMemo } from "react";
import type {
    Equipment, UsageReport, MaintenanceAlert, EquipmentAlert, CostReport, UtilizationReport, AvailabilityReport
} from "../../services/equipmentService";
import { equipmentService } from "../../services/equipmentService";
import { boqService } from "../../services/boqService";
import toast from "react-hot-toast";
import PageTransition from "../../components/common/PageTransition";
import Pagination from "../../components/common/Pagination";
import Navbar from "../../components/common/Navbar";
import ProjectSelector from "../../components/common/ProjectSelector";
import StatCard from "../../components/common/StatCard";

import {
    Search, Plus, Edit2, Eye, AlertTriangle, Activity, TrendingUp, Download, Trash2, ShieldCheck, FileText, ArrowRightLeft
} from "lucide-react";
import EquipmentFormModal from "../engineer/MachineryManagement/EquipmentFormModal";
import EquipmentViewModal from "../engineer/MachineryManagement/EquipmentViewModal";
import TransferEquipmentModal from "../../components/forms/TransferEquipmentModal";
import { useProject } from "../../context/ProjectContext";

const conditionColors: Record<string, string> = {
    'GOOD': 'bg-emerald-500 text-white',
    'REPAIR': 'bg-orange-500 text-white',
    'DAMAGED': 'bg-red-500 text-white',
    'MAINTENANCE': 'bg-blue-500 text-white',
};

const TABS = ["Equipment List", "Usage & Tracking", "Maintenance", "Rental", "Purchases", "Reports & Alerts", "Transfer Equipment"];

const EquipmentPage = () => {
    const { selectedProjectId, assignedProjects } = useProject();

    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 10;

    // Data States
    const [usageReport, setUsageReport] = useState<UsageReport[]>([]);
    const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
    const [rentalList, setRentalList] = useState<any[]>([]);
    const [purchaseList, setPurchaseList] = useState<any[]>([]);
    const [boqMap, setBoqMap] = useState<Record<number, string>>({});
    const [equipmentMap, setEquipmentMap] = useState<Record<number, string>>({});
    const [equipmentAlerts, setEquipmentAlerts] = useState<EquipmentAlert[]>([]);
    const [utilizationReport, setUtilizationReport] = useState<UtilizationReport[]>([]);
    const [availability, setAvailability] = useState<AvailabilityReport[]>([]);
    const [purchaseReport, setPurchaseReport] = useState<any[]>([]);
    const [transferList, setTransferList] = useState<any[]>([]);

    // KPI Data
    const [kpiData, setKpiData] = useState<any>(null);

    const projectMap = useMemo(() => {
        const map: Record<number, string> = {};
        assignedProjects.forEach(p => {
            map[p.id] = p.project_name || (p as any).name || `Project ${p.id}`;
        });
        return map;
    }, [assignedProjects]);

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
            } else if (activeTab === "Rental") {
                const res = await equipmentService.listRental(undefined, pIdObj);
                setRentalList(Array.isArray(res) ? res : (res as any).items || []);
            } else if (activeTab === "Purchases") {
                const res = await equipmentService.listPurchase(pIdObj);
                setPurchaseList(Array.isArray(res) ? res : (res as any).items || []);
            } else if (activeTab === "Reports & Alerts") {
                const [avail, util, eAlerts, purchaseRes] = await Promise.all([
                    equipmentService.getAvailabilityReport(pIdObj),
                    equipmentService.getUtilizationReport(pIdObj),
                    equipmentService.getEquipmentAlerts(pIdObj),
                    equipmentService.getPurchaseReport(pIdObj).catch(() => [])
                ]);
                setAvailability(avail);
                setUtilizationReport(util);
                setEquipmentAlerts(eAlerts);
                setPurchaseReport(purchaseRes || []);
            } else if (activeTab === "Transfer Equipment") {
                const res = await equipmentService.listTransferHistory(pIdObj);
                setTransferList(res);
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

    useEffect(() => {
        let isMounted = true;
        const fetchBoqs = async () => {
            const missingBoqs = new Set<number>();
            purchaseList.forEach(p => {
                if (p.boq_item_id && !boqMap[p.boq_item_id]) missingBoqs.add(p.boq_item_id);
            });
            if (missingBoqs.size === 0) return;

            const fetchedMap: Record<number, string> = {};
            await Promise.all(
                Array.from(missingBoqs).map(async (id) => {
                    try {
                        const boq = await boqService.getBoqById(id);
                        fetchedMap[id] = boq.item_name || boq.description || `BOQ #${id}`;
                    } catch {
                        fetchedMap[id] = `BOQ #${id}`;
                    }
                })
            );
            if (isMounted && Object.keys(fetchedMap).length > 0) {
                setBoqMap(prev => ({ ...prev, ...fetchedMap }));
            }
        };
        fetchBoqs();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [purchaseList]);

    useEffect(() => {
        let isMounted = true;
        const fetchEquipments = async () => {
            const missing = new Set<number>();
            rentalList.forEach(r => {
                const eqId = r.equipment_id;
                if (eqId && !equipmentMap[eqId] && !equipmentList.find(e => e.id === eqId)) {
                    missing.add(eqId);
                }
            });
            if (missing.size === 0) return;
            const fetched: Record<number, string> = {};
            await Promise.all(
                Array.from(missing).map(async (id) => {
                    try {
                        const eq = await equipmentService.getEquipment(id);
                        fetched[id] = eq.equipment_name || eq.equipment_code || `Asset ${id}`;
                    } catch {
                        fetched[id] = `Asset ${id}`;
                    }
                })
            );
            if (isMounted && Object.keys(fetched).length > 0) {
                setEquipmentMap(prev => ({ ...prev, ...fetched }));
            }
        };
        fetchEquipments();
        return () => { isMounted = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [rentalList, equipmentList]);

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
            case "Rental":
                return rentalList.filter(r => (r.equipment_code || r.client_name || "").toLowerCase().includes(term));
            case "Purchases":
                return purchaseList.filter(p => (p.equipment_code || p.asset_code || p.vendor_name || p.vendor || "").toLowerCase().includes(term));
            case "Reports & Alerts":
                return equipmentAlerts.filter(a =>
                    (a.equipment_code || "").toLowerCase().includes(term) ||
                    (a.equipment_name || "").toLowerCase().includes(term)
                );
            case "Transfer Equipment":
                return transferList.filter(t =>
                    String(t.equipment_id).includes(term) ||
                    (t.equipment_name || "").toLowerCase().includes(term) ||
                    (t.from_project_name || "").toLowerCase().includes(term) ||
                    (t.to_project_name || "").toLowerCase().includes(term) ||
                    (t.transferred_by_name || "").toLowerCase().includes(term)
                );
            default:
                return [];
        }
    }, [activeTab, searchTerm, equipmentList, usageReport, maintenanceAlerts, rentalList, purchaseList, equipmentAlerts, transferList]);

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
                    <th className="px-6 py-4">Equipment Name</th>
                    <th className="px-6 py-4">Project Name</th>
                    <th className="px-6 py-4">Serial / Code</th>
                    <th className="px-6 py-4">Condition</th>
                    <th className="px-6 py-4">Operator</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400">Loading equipment registry...</td></tr>
                ) : pagedData.length > 0 ? pagedData.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{item.equipment_name}</td>
                        <td className="px-6 py-4 font-medium text-slate-600">{item.project_id ? projectMap[item.project_id] || `Project ID: ${item.project_id}` : "N/A"}</td>
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
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">No equipment records found</td></tr>
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
                    <th className="px-6 py-4">Equipment Code</th>
                    <th className="px-6 py-4">Maintenance Date</th>
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
        <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-max">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-4">Equipment Name</th>
                        <th className="px-6 py-4">Project</th>
                        <th className="px-6 py-4">Client</th>
                        <th className="px-6 py-4">Start Date</th>
                        <th className="px-6 py-4">End Date</th>
                        <th className="px-6 py-4">Duration</th>
                        <th className="px-6 py-4">Per Day Cost</th>
                        <th className="px-6 py-4">Total Cost</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Notes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                    {isLoading ? (
                        <tr><td colSpan={10} className="p-10 text-center text-slate-400">Loading rentals...</td></tr>
                    ) : pagedData.length > 0 ? pagedData.map((report: any) => {
                        const eqName = equipmentList.find(e => e.id === report.equipment_id)?.equipment_name || equipmentMap[report.equipment_id] || report.equipment_name || report.equipment_code || `Asset ${report.equipment_id || 'N/A'}`;
                        const projName = report.project_id ? projectMap[report.project_id] || `Project ${report.project_id}` : "—";
                        return (
                            <tr key={report.id || Math.random()} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700">{eqName}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">{projName}</td>
                                <td className="px-6 py-4 text-slate-600">{report.client_name || "—"}</td>
                                <td className="px-6 py-4 text-slate-500">{report.start_date || "—"}</td>
                                <td className="px-6 py-4 text-slate-500">{report.end_date || "—"}</td>
                                <td className="px-6 py-4 text-slate-500">{report.duration || "—"} {report.duration ? "days" : ""}</td>
                                <td className="px-6 py-4 text-slate-600">₹{(report.per_day_cost || 0).toLocaleString()}</td>
                                <td className="px-6 py-4 text-emerald-600 font-bold">₹{report.rental_cost?.toLocaleString() || "0"}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                                        {report.status || "—"}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]" title={report.notes || ""}>{report.notes || "—"}</td>
                            </tr>
                        )
                    }) : (
                        <tr><td colSpan={10} className="p-10 text-center text-slate-400 font-medium">No rentals found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderTransfer = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Equipment</th>
                    <th className="px-6 py-4">From Project</th>
                    <th className="px-6 py-4 text-center">Transfer</th>
                    <th className="px-6 py-4">To Project</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Transferred By</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400">Loading transfer history...</td></tr>
                ) : pagedData.length > 0 ? pagedData.map((t: any) => (
                    <tr key={t.id || Math.random()} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                            <p className="font-bold text-slate-800">{t.equipment_name || equipmentMap[t.equipment_id] || equipmentList.find(e => e.id === t.equipment_id)?.equipment_name || `Asset #${t.equipment_id}`}</p>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600">
                            {t.from_project_name || (t.from_project_id ? projectMap[t.from_project_id] || `Project ${t.from_project_id}` : 'Global / Unassigned')}
                        </td>
                        <td className="px-6 py-4 text-center">
                            <ArrowRightLeft className="w-4 h-4 mx-auto text-slate-300" />
                        </td>
                        <td className="px-6 py-4 font-medium text-primary">
                            {t.to_project_name || (t.to_project_id === 0 ? 'Global / Unassigned' : projectMap[t.to_project_id] || `Project ${t.to_project_id}`)}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">
                            {t.transferred_at ? new Date(t.transferred_at).toLocaleDateString() : (t.transfer_date ? new Date(t.transfer_date).toLocaleDateString() : "—")}
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate">
                            <span>{t.transferred_by_name || "—"}</span>
                        </td>
                    </tr>
                )) : (
                    <tr><td colSpan={6} className="p-10 text-center text-slate-400 font-medium">No transfer history found</td></tr>
                )}
            </tbody>
        </table>
    );

    const renderPurchases = () => (
        <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-max">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                    <tr>
                        <th className="px-6 py-4">Asset Name</th>
                        <th className="px-6 py-4">Project</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Vendor</th>
                        <th className="px-6 py-4">Inv #</th>
                        <th className="px-6 py-4">Qty</th>
                        <th className="px-6 py-4">Unit Price</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Warranty End</th>
                        <th className="px-6 py-4">Notes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                    {isLoading ? (
                        <tr><td colSpan={11} className="p-10 text-center text-slate-400">Loading purchases...</td></tr>
                    ) : pagedData.length > 0 ? pagedData.map((report: any) => (
                        <tr key={report.id || Math.random()} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4 font-bold text-slate-700">{report.asset_name || report.equipment_code || report.asset_code || "—"}</td>
                            <td className="px-6 py-4 font-bold text-slate-800">{report.project_id ? projectMap[report.project_id] || `Project ${report.project_id}` : "—"}</td>
                            <td className="px-6 py-4 text-slate-500">
                                <span className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                                    {report.purchase_type || "—"}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-slate-500">{report.purchase_date || report.created_at?.split('T')[0] || "—"}</td>
                            <td className="px-6 py-4 text-slate-600">{report.vendor_name || report.vendor || "—"}</td>
                            <td className="px-6 py-4 text-slate-500 font-mono text-xs">{report.invoice_number || "—"}</td>
                            <td className="px-6 py-4 text-slate-700 font-medium">{report.quantity || 1}</td>
                            <td className="px-6 py-4 text-slate-600">₹{(report.unit_price || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-emerald-600 font-bold">₹{(report.total_amount || report.cost || report.total_cost || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-slate-500">{report.warranty_end_date || "—"}</td>
                            <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]" title={report.notes || report.description || ""}>{report.notes || report.description || "—"}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={11} className="p-10 text-center text-slate-400 font-medium">No purchases found</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );

    const renderReports = () => (
        <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Equipment Alerts */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-500" /> Equipment Alerts
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-auto">
                        {pagedData.length > 0 ? pagedData.map((alert: any, idx: number) => (
                            <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-bold text-sm text-slate-800">{alert.equipment_name} <span className="text-xs text-slate-500">({alert.equipment_code})</span></h4>
                                </div>
                                <ul className="text-xs text-slate-600 list-disc list-inside mb-2">
                                    {alert.issues && alert.issues.map((issue: any, i: number) => (
                                        <li key={i} className={issue.severity === 'HIGH' ? 'text-rose-600 font-medium' : 'text-amber-600'}>
                                            {issue.type}: {issue.current_hours}hrs (Threshold: {issue.limit})
                                        </li>
                                    ))}
                                </ul>
                                <p className="text-xs font-medium text-slate-700 bg-white p-2 rounded border border-slate-200">Recommendation: {alert.recommendation}</p>
                            </div>
                        )) : (
                            <div className="text-center py-10 text-slate-400">
                                <Activity className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">All assets normal.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" /> <h3 className="font-bold text-sm text-slate-800">Utilization Rate</h3>
                        </div>
                        <div className="p-4 space-y-4 max-h-[170px] overflow-auto">
                            {utilizationReport.length > 0 ? utilizationReport.map(r => (
                                <div key={r.equipment_id}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span className="font-bold text-slate-700">{r.equipment_code}</span>
                                        <span className="font-medium text-slate-500">{r.total_hours} hrs ({r.utilization_rate}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className={`h-2 rounded-full ${r.utilization_rate > 75 ? 'bg-rose-500' : r.utilization_rate > 30 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(100, r.utilization_rate)}%` }}></div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-xs text-slate-400 text-center">No utilization data.</p>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> <h3 className="font-bold text-sm text-slate-800">Availability Map</h3>
                        </div>
                        <div className="overflow-auto max-h-[170px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white sticky top-0 font-bold text-slate-400 text-[10px] uppercase">
                                    <tr><th className="p-3">Code</th><th className="p-3">Status</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {availability.length > 0 ? availability.map(a => (
                                        <tr key={a.equipment_id} className="hover:bg-slate-50">
                                            <td className="p-3 font-bold text-slate-700">{a.equipment_code}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${a.is_available ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {a.is_available ? 'Available' : 'Allocated'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan={2} className="p-3 text-center text-xs text-slate-400">No availability data.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-500" /> <h3 className="font-bold text-sm text-slate-800">Purchase Analytics</h3>
                </div>
                <div className="p-6">
                    {purchaseReport.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {purchaseReport.map((p, idx) => (
                                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{p.category || 'General Equipment'}</p>
                                    <p className="text-2xl font-bold text-slate-800 mb-1">₹{p.total_cost?.toLocaleString() || '0'}</p>
                                    <p className="text-xs text-slate-500 font-medium">{p.purchase_count || 0} Assets Purchased</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-6 text-slate-400">
                            <FileText className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium">No purchase data available</p>
                        </div>
                    )}
                </div>
            </div>
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
                        {activeTab === "Transfer Equipment" ? (
                            <button onClick={() => setIsTransferModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 h-10 transition-all active:scale-95 hover:bg-indigo-700">
                                <ArrowRightLeft className="w-4 h-4" /> Transfer
                            </button>
                        ) : (
                            <button onClick={() => { setFormData({}); setIsViewMode(false); setIsEquipmentModalOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 h-10 transition-all active:scale-95 hover:bg-primary/90">
                                <Plus className="w-4 h-4" /> Add Equipment
                            </button>
                        )}
                        <div className="flex gap-2">
                            <button onClick={exportExcel} className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2 font-bold text-sm" title="Export Excel">
                                <Download className="w-4 h-4" /> Excel
                            </button>
                            <button onClick={exportPdf} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors flex items-center gap-2 font-bold text-sm" title="Export PDF">
                                <Download className="w-4 h-4" /> PDF
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
                        value={rentalList.length.toString()}
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
                        {activeTab === "Rental" && renderRental()}
                        {activeTab === "Purchases" && renderPurchases()}
                        {activeTab === "Reports & Alerts" && renderReports()}
                        {activeTab === "Transfer Equipment" && renderTransfer()}
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

            {isViewMode ? (
                <EquipmentViewModal
                    isOpen={isEquipmentModalOpen}
                    onClose={() => setIsEquipmentModalOpen(false)}
                    equipment={formData}
                    projectsMap={projectMap}
                    onEdit={() => setIsViewMode(false)}
                />
            ) : (
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
            )}

            <TransferEquipmentModal
                isOpen={isTransferModalOpen}
                onClose={() => setIsTransferModalOpen(false)}
                equipmentList={equipmentList}
                projects={assignedProjects}
                onSubmit={async (data: any) => {
                    try {
                        await equipmentService.transferEquipment({ ...data, condition_notes: data.reason });
                        toast.success("Equipment successfully transferred!");
                        setIsTransferModalOpen(false);
                        fetchData();
                    } catch (err) {
                        toast.error("Failed to transfer equipment");
                    }
                }}
            />
        </>
    );
};

export default EquipmentPage;
