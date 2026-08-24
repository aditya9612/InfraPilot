/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { useState, useEffect, useCallback, useMemo } from "react";
import type {
    Equipment, UsageReport, MaintenanceAlert, EquipmentAlert, UtilizationReport, AvailabilityReport
} from "../../services/equipmentService";
import { equipmentService } from "../../services/equipmentService";
import { boqService } from "../../services/boqService";
import toast from "react-hot-toast";
import PageTransition from "../../components/common/PageTransition";
import Pagination from "../../components/common/Pagination";
import Navbar from "../../components/common/Navbar";
import ProjectSelector from "../../components/common/ProjectSelector";
import StatCard from "../../components/common/StatCard";
import Modal from "../../components/common/Modal";

import {
    Search, Plus, Edit2, Eye, AlertTriangle, Activity, TrendingUp, Download, Trash2, ShieldCheck, FileText, ArrowRightLeft, Link2, Wrench, History, QrCode
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
    const projects = assignedProjects;

    const [activeTab, setActiveTab] = useState(TABS[0]);
    const [isLoading, setIsLoading] = useState(false);
    const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
    const [globalEquipment, setGlobalEquipment] = useState<any[]>([]);
    const [globalRentals, setGlobalRentals] = useState<any[]>([]);
    const [globalMaintenance, setGlobalMaintenance] = useState<any[]>([]);
    const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

    // Extracted states for advanced actions
    const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
    const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [qrEquipmentCode, setQrEquipmentCode] = useState('');
    const [allocationStatus, setAllocationStatus] = useState({ allocated: false, project_id: null as number | null });

    const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
    const [boqsList, setBoqsList] = useState<any[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const modalEquipmentList = equipmentList;
    const [isViewMode, setIsViewMode] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [currentPage, setCurrentPage] = useState(0);
    const PAGE_SIZE = 10;

    // Data States
    const [usageReport, setUsageReport] = useState<UsageReport[]>([]);
    const [maintenanceAlerts, setMaintenanceAlerts] = useState<MaintenanceAlert[]>([]);
    const [allMaintenance, setAllMaintenance] = useState<any[]>([]);
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
        let isMounted = true;

        // Fetch fresh globals whenever a modal needing them opens
        if (isRentalModalOpen) {
            const loadGlobals = async () => {
                try {
                    const [eqRes, rRes, mRes] = await Promise.all([
                        equipmentService.listEquipment({ limit: 100 }).catch(() => ({ items: [] })),
                        equipmentService.listRental().catch(() => []),
                        equipmentService.getAllMaintenance({}).catch(() => [])
                    ]);
                    if (!isMounted) return;
                    setGlobalEquipment(eqRes.items || []);
                    setGlobalRentals(Array.isArray(rRes) ? rRes : (rRes as any).items || []);
                    setGlobalMaintenance(mRes || []);
                } catch (err) {
                    console.error("Failed to load globals");
                }
            };
            loadGlobals();
        }

        return () => { isMounted = false; };
    }, [isRentalModalOpen]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        let isMounted = true;
        if (selectedProjectId) {
            boqService.getBoqsByProject(selectedProjectId)
                .then(res => {
                    if (isMounted) setBoqsList(res);
                })
                .catch(err => {
                    console.error("Failed to fetch project BOQs", err);
                    if (isMounted) setBoqsList([]);
                });
        } else {
            setBoqsList([]);
        }
        return () => { isMounted = false; };
    }, [selectedProjectId]);

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

    const openAllocateModal = async (eq: any) => {
        setSelectedEquipment(eq);
        setIsAllocateModalOpen(true);
        try {
            const alloc = await equipmentService.getAllocation(eq.id);
            setAllocationStatus(alloc);
            setFormData({ project_id: alloc.project_id || selectedProjectId });
        } catch (e) {
            setAllocationStatus({ allocated: false, project_id: null });
            setFormData({ project_id: selectedProjectId });
        }
    };

    const handleAllocate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedEquipment) return;
        try {
            await equipmentService.allocateEquipment(selectedEquipment.id, formData.project_id || selectedProjectId);
            toast.success("Equipment allocated successfully!");
            setIsAllocateModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to allocate equipment");
        }
    };

    const handleDeallocate = async () => {
        if (!selectedEquipment) return;
        try {
            await equipmentService.deallocateEquipment(selectedEquipment.id, allocationStatus?.project_id || selectedEquipment?.project_id || 0);
            toast.success("Equipment deallocated!");
            setIsAllocateModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to deallocate equipment");
        }
    };

    const handleSaveUsage = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (formData.usage_id) {
                await equipmentService.updateUsage(formData.usage_id, {
                    equipment_id: formData.equipment_id,
                    working_hours: Number(formData.working_hours),
                    fuel_used: Number(formData.fuel_used),
                    usage_date: formData.usage_date || new Date().toISOString().split('T')[0],
                    notes: formData.notes,
                    boq_item_id: formData.boq_item_id ? Number(formData.boq_item_id) : null
                });
            } else {
                await equipmentService.createUsage(formData.equipment_id, {
                    ...formData,
                    usage_date: formData.usage_date || new Date().toISOString().split('T')[0],
                    boq_item_id: formData.boq_item_id ? Number(formData.boq_item_id) : null
                } as any);
            }
            toast.success(formData.usage_id ? "Usage updated successfully!" : "Usage logged successfully!");
            setIsUsageModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error(formData.usage_id ? "Failed to update usage" : "Failed to log usage");
        }
    };

    const handleSaveMaintenance = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const eqFromList = equipmentList.find(eq => eq.id === formData.equipment_id);
            const derivedProjectId = allocationStatus?.project_id || selectedEquipment?.project_id || eqFromList?.project_id || undefined;

            if (formData.maintenance_id) {
                await equipmentService.updateMaintenance(formData.maintenance_id, {
                    description: formData.description,
                    maintenance_date: formData.maintenance_date || new Date().toISOString().split('T')[0],
                    cost: Number(formData.cost),
                    next_maintenance_date: formData.next_maintenance_date,
                    project_id: derivedProjectId
                });
            } else {
                await equipmentService.createMaintenance(formData.equipment_id, {
                    description: formData.description,
                    maintenance_date: formData.maintenance_date || new Date().toISOString().split('T')[0],
                    cost: Number(formData.cost),
                    next_maintenance_date: formData.next_maintenance_date,
                    project_id: derivedProjectId
                });
            }
            setIsMaintenanceModalOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to save maintenance");
        }
    };

    const handleSaveRental = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const eqFromList = equipmentList.find(eq => eq.id === formData.equipment_id);
            const derivedProjectId = allocationStatus?.project_id || selectedEquipment?.project_id || eqFromList?.project_id || undefined;

            const payload = {
                equipment_id: formData.equipment_id,
                start_date: formData.start_date || new Date().toISOString().split('T')[0],
                end_date: formData.end_date || new Date().toISOString().split('T')[0],
                rental_cost: Number(formData.rental_cost),
                client_name: formData.client_name,
                notes: formData.notes,
                project_id: derivedProjectId
            };
            if (formData.rental_id) {
                await equipmentService.updateRental(formData.rental_id, payload);
                toast.success("Rental updated successfully!");
            } else {
                await equipmentService.createRental(formData.equipment_id, payload);
                toast.success("Rental added successfully!");
            }
            setIsRentalModalOpen(false);
            fetchData();
        } catch (error: any) {
            const errorMsg = error.response?.data?.detail || "Failed to add rental";
            toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        }
    };

    const handleGenerateQR = async (equipment_id: number, code: string) => {
        try {
            const toastId = toast.loading("Generating QR Code...");
            const res = await equipmentService.generateQR(equipment_id);
            toast.dismiss(toastId);

            let url = "";
            if (typeof res === "string" && res.startsWith("data:image")) {
                url = res;
            } else if (res && res.qr_code_url) {
                url = res.qr_code_url;
            } else if (res && res.qr_code) {
                url = res.qr_code.startsWith("data:image") ? res.qr_code : `data:image/png;base64,${res.qr_code}`;
            } else if (res instanceof Blob) {
                url = window.URL.createObjectURL(res);
            }

            if (url) {
                setQrCodeUrl(url);
                setQrEquipmentCode(code);
                setIsQrModalOpen(true);
                toast.success("QR Code generated successfully!");
            } else {
                toast.error("Invalid QR Code response");
            }
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to generate QR Code");
        }
    };

    useEffect(() => {
        if (selectedEquipment && isLogsModalOpen) {
            const fetchLogs = async () => {
                try {
                    const response = await equipmentService.getAuditLogs(selectedEquipment.id);
                    setAuditLogs(response.items || []);
                } catch (e: any) {
                    if (e.response && e.response.status === 404) {
                        setAuditLogs([]);
                        console.warn("Audit logs not available for this equipment.");
                    } else {
                        toast.error("Failed to load audit logs");
                        setAuditLogs([]);
                    }
                }
            };
            fetchLogs();
        }
    }, [selectedEquipment, isLogsModalOpen]);

    // Renders
    const renderList = () => (
        <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4">Equipment Name</th>
                    <th className="px-6 py-4">Project Name</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Maintenance Date</th>
                    <th className="px-6 py-4">Condition</th>
                    <th className="px-6 py-4">Operator</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-sm">
                {isLoading ? (
                    <tr><td colSpan={7} className="p-10 text-center text-slate-400">Loading equipment registry...</td></tr>
                ) : pagedData.length > 0 ? pagedData.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800">{item.equipment_name}</td>
                        <td className="px-6 py-4 font-medium text-slate-600">{item.project_id ? projectMap[item.project_id] || `Project ID: ${item.project_id}` : "N/A"}</td>
                        <td className="px-6 py-4 text-slate-600">
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">{item.status ? item.status.replace(/_/g, ' ') : "—"}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-medium">{item.maintenance_date || "—"}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${conditionColors[item.condition] || 'bg-slate-100 text-slate-600'}`}>
                                {item.condition}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{item.operator_name || "—"}</td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-1">
                                <button onClick={() => { setFormData(item); setIsViewMode(true); setIsEquipmentModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded" title="View"><Eye className="w-4 h-4" /></button>
                                <button onClick={() => { setFormData(item); setIsViewMode(false); setIsEquipmentModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="Edit"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={() => openAllocateModal(item)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Allocate"><Link2 className="w-4 h-4" /></button>
                                <button onClick={() => { setSelectedEquipment(item); setFormData({ equipment_id: item.id }); setIsUsageModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded" title="Log Usage"><Activity className="w-4 h-4" /></button>
                                <button onClick={() => { setSelectedEquipment(item); setFormData({ equipment_id: item.id }); setIsMaintenanceModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded" title="Maintenance"><Wrench className="w-4 h-4" /></button>
                                <button onClick={() => { setSelectedEquipment(item); setFormData({ equipment_id: item.id }); setIsRentalModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-purple-500 hover:bg-purple-50 rounded" title="Rental"><FileText className="w-4 h-4" /></button>
                                <button onClick={() => { setSelectedEquipment(item); setIsLogsModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded" title="Audit Logs"><History className="w-4 h-4" /></button>
                                <button onClick={() => handleGenerateQR(item.id, item.equipment_code)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Download QR"><QrCode className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded" title="Delete"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </td>
                    </tr>
                )) : (
                    <tr><td colSpan={7} className="p-10 text-center text-slate-400 font-medium">No equipment records found</td></tr>
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
                        <th className="px-6 py-4">Qty</th>
                        <th className="px-6 py-4">Unit Price</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Warranty End</th>
                        <th className="px-6 py-4">Notes</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                    {isLoading ? (
                        <tr><td colSpan={10} className="p-10 text-center text-slate-400">Loading purchases...</td></tr>
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
                            <td className="px-6 py-4 text-slate-700 font-medium">{report.quantity || 1}</td>
                            <td className="px-6 py-4 text-slate-600">₹{(report.unit_price || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-emerald-600 font-bold">₹{(report.total_amount || report.cost || report.total_cost || 0).toLocaleString()}</td>
                            <td className="px-6 py-4 text-slate-500">{report.warranty_end_date || "—"}</td>
                            <td className="px-6 py-4 text-slate-500 truncate max-w-[150px]" title={report.notes || report.description || ""}>{report.notes || report.description || "—"}</td>
                        </tr>
                    )) : (
                        <tr><td colSpan={10} className="p-10 text-center text-slate-400 font-medium">No purchases found</td></tr>
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
                        ) : activeTab === "Rental" ? (
                            <button onClick={() => { setFormData({ start_date: new Date().toISOString().split('T')[0], end_date: new Date().toISOString().split('T')[0] }); setIsRentalModalOpen(true); }} className="px-4 py-2 bg-purple-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-500/20 h-10 transition-all active:scale-95 hover:bg-purple-600">
                                <Plus className="w-4 h-4" /> Add Rental
                            </button>
                        ) : activeTab === "Usage & Tracking" ? (
                            <button onClick={() => { setFormData({ usage_date: new Date().toISOString().split('T')[0] }); setIsUsageModalOpen(true); }} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 h-10 transition-all active:scale-95 hover:bg-emerald-600">
                                <Plus className="w-4 h-4" /> Log Usage
                            </button>
                        ) : activeTab === "Maintenance" ? (
                            <button onClick={() => { setSelectedEquipment(null); setFormData({}); setIsMaintenanceModalOpen(true); }} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 h-10 transition-all active:scale-95 hover:bg-amber-600">
                                <Plus className="w-4 h-4" /> Add Maintenance
                            </button>
                        ) : activeTab === "Equipment List" ? (
                            <button onClick={() => { setFormData({}); setIsViewMode(false); setIsEquipmentModalOpen(true); }} className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-primary/20 h-10 transition-all active:scale-95 hover:bg-primary/90">
                                <Plus className="w-4 h-4" /> Add Equipment
                            </button>
                        ) : null}
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
                        await equipmentService.transferEquipment({
                            equipment_id: Number(data.equipment_id),
                            to_project_id: Number(data.to_project_id),
                            transfer_date: data.transfer_date,
                            condition_notes: data.reason
                        });
                        toast.success("Equipment successfully transferred!");
                        setIsTransferModalOpen(false);
                        fetchData();
                    } catch (err) {
                        toast.error("Failed to transfer equipment");
                    }
                }}
            />

            {/* Add New Modals From Engineer Module */}
            {/* 4. Allocate Equipment */}
            <Modal isOpen={isAllocateModalOpen} onClose={() => setIsAllocateModalOpen(false)} title="Allocate Equipment" maxWidth="max-w-md">
                <div className="p-6 font-inter">
                    <form onSubmit={handleAllocate} className="space-y-5">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">EQUIPMENT NAME *</label>
                            <input type="text" readOnly value={selectedEquipment?.equipment_name || ''} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-slate-500 font-medium cursor-not-allowed" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">TARGET PROJECT *</label>
                            <select
                                required
                                value={formData.project_id || ''}
                                onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? Number(e.target.value) : undefined })}
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                            >
                                <option value="">-- Select project to allocate --</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.project_name || (p as any).name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">ALLOCATION STATUS *</label>
                            <div className="flex items-center px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                                <input type="checkbox" checked={true} readOnly className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500 cursor-not-allowed" />
                                <span className="ml-3 text-sm font-bold text-emerald-700">Set as Allocated</span>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button
                                type="button"
                                onClick={handleDeallocate}
                                disabled={!(allocationStatus.allocated || Boolean(selectedEquipment?.project_id))}
                                className={`px-6 py-2.5 text-sm font-bold rounded-xl transition-colors ${(allocationStatus.allocated || Boolean(selectedEquipment?.project_id)) ? 'text-rose-500 hover:bg-rose-50 border border-transparent' : 'text-slate-300 bg-slate-50 border border-slate-200 cursor-not-allowed'}`}
                            >
                                Deallocate
                            </button>
                            <button type="button" onClick={() => setIsAllocateModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                            <button type="submit" className="px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 active:scale-95">Allocate</button>
                        </div>
                    </form>
                </div>
            </Modal>

            {/* 5. Log Usage */}
            <Modal isOpen={isUsageModalOpen} onClose={() => setIsUsageModalOpen(false)} title={formData.usage_id ? "Edit Equipment Usage" : "Log Equipment Usage"} maxWidth="max-w-md">
                <form onSubmit={handleSaveUsage} className="p-6 font-inter space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EQUIPMENT *</label>
                        <select required value={formData.equipment_id || ''} onChange={(e) => setFormData({ ...formData, equipment_id: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose equipment --</option>
                            {modalEquipmentList.map(eq => <option key={eq.id} value={eq.id}>{eq.equipment_name} ({eq.equipment_code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">LINK TO BOQ ITEM (OPTIONAL)</label>
                        <select
                            value={formData.boq_item_id || ''}
                            onChange={(e) => setFormData({ ...formData, boq_item_id: e.target.value ? Number(e.target.value) : null })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300"
                        >
                            <option value="">-- No BOQ item linked --</option>
                            {boqsList.map(boq => (
                                <option key={boq.id} value={boq.id}>{boq.item_name || `BOQ Item #${boq.id}`}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Working Hours *</label>
                            <input type="number" min="0" required value={formData.working_hours || ''} onChange={(e) => setFormData({ ...formData, working_hours: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Fuel Used (L) *</label>
                            <input type="number" min="0" required value={formData.fuel_used || ''} onChange={(e) => setFormData({ ...formData, fuel_used: Number(e.target.value) })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Usage Date *</label>
                        <input type="date" required value={formData.usage_date || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, usage_date: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Notes</label>
                        <textarea rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-primary" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsUsageModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20">Save Usage</button>
                    </div>
                </form>
            </Modal>

            {/* 6. Schedule Maintenance */}
            <Modal isOpen={isMaintenanceModalOpen} onClose={() => setIsMaintenanceModalOpen(false)} title="Schedule Maintenance" maxWidth="max-w-md">
                <form onSubmit={handleSaveMaintenance} className="p-6 font-inter space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EQUIPMENT *</label>
                        <select required value={formData.equipment_id || ''} onChange={(e) => setFormData({ ...formData, equipment_id: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose equipment --</option>
                            {modalEquipmentList.map(eq => <option key={eq.id} value={eq.id}>{eq.equipment_name} ({eq.equipment_code})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">DESCRIPTION *</label>
                        <input type="text" required value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MAINTENANCE DATE *</label>
                            <input type="date" required value={formData.maintenance_date || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">COST (₹) *</label>
                            <input type="number" min="0" required value={formData.cost || ''} onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NEXT MAINTENANCE DATE</label>
                        <input type="date" value={formData.next_maintenance_date || ''} onChange={(e) => setFormData({ ...formData, next_maintenance_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20">Schedule</button>
                    </div>
                </form>
            </Modal>

            {/* 7. Add Rental */}
            <Modal isOpen={isRentalModalOpen} onClose={() => setIsRentalModalOpen(false)} title="Add Rental Record" maxWidth="max-w-md">
                <form onSubmit={handleSaveRental} className="p-6 font-inter space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">EQUIPMENT *</label>
                        <select required value={formData.equipment_id || ''} onChange={(e) => setFormData({ ...formData, equipment_id: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose equipment --</option>
                            {globalEquipment.filter(eq => {
                                if (Number(eq.id) === Number(formData.equipment_id)) return true;
                                const isRented = globalRentals.some((r: any) => Number(r.equipment_id) === Number(eq.id) && r.status !== 'CANCELLED' && r.status !== 'COMPLETED');
                                const isInMaintenance = globalMaintenance.some((m: any) => Number(m.equipment_id) === Number(eq.id) && m.status !== 'COMPLETED');
                                return !isRented && !isInMaintenance && (!eq.project_id);
                            }).map(eq => <option key={eq.id} value={eq.id}>{eq.equipment_name} ({eq.equipment_code})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">START DATE *</label>
                            <input type="date" required value={formData.start_date || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">END DATE *</label>
                            <input type="date" required value={formData.end_date || new Date().toISOString().split('T')[0]} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RENTAL COST (₹) *</label>
                        <input type="number" min="0" required value={formData.rental_cost || ''} onChange={(e) => setFormData({ ...formData, rental_cost: Number(e.target.value) })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">CLIENT NAME *</label>
                        <input type="text" required value={formData.client_name || ''} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PROJECT (OPTIONAL)</label>
                        <select value={formData.project_id || ''} onChange={(e) => setFormData({ ...formData, project_id: e.target.value ? Number(e.target.value) : '', boq_item_id: '' })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Select Project --</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.project_name || (p as any).name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">BOQ ITEM (OPTIONAL)</label>
                        <select value={formData.boq_item_id || ''} onChange={(e) => setFormData({ ...formData, boq_item_id: e.target.value ? Number(e.target.value) : '' })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300">
                            <option value="">-- Choose BOQ Item --</option>
                            {boqsList
                                .filter(boq => !formData.project_id || Number(boq.project_id) === Number(formData.project_id))
                                .map(boq => (
                                    <option key={boq.id} value={boq.id}>{boq.item_name || `BOQ Item #${boq.id}`}</option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">NOTES</label>
                        <textarea rows={2} value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:ring-primary/20 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-slate-300" />
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={() => setIsRentalModalOpen(false)} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold">Cancel</button>
                        <button type="submit" className="px-6 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-500/20">Add Rental</button>
                    </div>
                </form>
            </Modal>

            {/* 8. Audit Logs Modal */}
            <Modal isOpen={isLogsModalOpen} onClose={() => setIsLogsModalOpen(false)} title="Audit Logs" maxWidth="max-w-2xl">
                {selectedEquipment && (
                    <div className="p-6 font-inter">
                        <div className={`rounded-2xl p-6 mb-6 text-white shadow-lg relative overflow-hidden bg-slate-800`}>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-2xl font-bold tracking-tight">{selectedEquipment.equipment_name}</h3>
                                    <span className="px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-widest">{selectedEquipment.equipment_code}</span>
                                </div>
                                <span className="inline-block px-2.5 py-1 bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-widest mt-2">
                                    Operator: {selectedEquipment.operator_name}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 mb-6">
                            {auditLogs.length > 0 ? auditLogs.map(log => {
                                const actionColors: Record<string, string> = {
                                    ALLOCATE: 'bg-blue-100 text-blue-700',
                                    DEALLOCATE: 'bg-amber-100 text-amber-700',
                                    CREATE: 'bg-emerald-100 text-emerald-700',
                                    UPDATE: 'bg-purple-100 text-purple-700',
                                    DELETE: 'bg-rose-100 text-rose-700',
                                    RENTAL_CREATE: 'bg-violet-100 text-violet-700',
                                    MAINTENANCE_CREATE: 'bg-orange-100 text-orange-700',
                                    USAGE_CREATE: 'bg-cyan-100 text-cyan-700',
                                };
                                const colorClass = actionColors[log.action] || 'bg-slate-100 text-slate-600';

                                // Helper: get project name from projects list by id
                                const getProjectName = (id: any) => {
                                    if (!id) return 'Not Allocated';
                                    const p = projects.find(p => Number(p.id) === Number(id));
                                    return p ? (p.project_name || (p as any).name) : `Project #${id}`;
                                };

                                const renderDetails = () => {
                                    const ov = log.old_values;
                                    const nv = log.new_values;

                                    if (log.action === 'ALLOCATE') {
                                        return (
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">From</span>
                                                    <span className="text-sm font-semibold text-slate-600">{getProjectName(ov?.project_id)}</span>
                                                </div>
                                                <span className="text-slate-400 text-lg">→</span>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">To</span>
                                                    <span className="text-sm font-bold text-blue-700">{getProjectName(nv?.project_id)}</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (log.action === 'DEALLOCATE') {
                                        return (
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Released From</span>
                                                    <span className="text-sm font-semibold text-slate-600">{getProjectName(ov?.project_id)}</span>
                                                </div>
                                                <span className="text-slate-400 text-lg">→</span>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] text-slate-400 uppercase font-bold">Status</span>
                                                    <span className="text-sm font-bold text-amber-600">Not Allocated</span>
                                                </div>
                                            </div>
                                        );
                                    }

                                    if (log.action === 'CREATE') {
                                        const vals = nv || {};
                                        return (
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                                {vals.equipment_name && <div><span className="text-slate-400 text-xs">Name: </span><span className="font-semibold text-slate-700">{vals.equipment_name}</span></div>}
                                                {vals.equipment_code && <div><span className="text-slate-400 text-xs">Code: </span><span className="font-semibold text-slate-700">{vals.equipment_code}</span></div>}
                                                {vals.operator_name && <div><span className="text-slate-400 text-xs">Operator: </span><span className="font-semibold text-slate-700">{vals.operator_name}</span></div>}
                                                {vals.condition && <div><span className="text-slate-400 text-xs">Condition: </span><span className="font-semibold text-slate-700">{vals.condition}</span></div>}
                                            </div>
                                        );
                                    }

                                    if (log.action === 'RENTAL_CREATE') {
                                        const vals = nv || {};
                                        return (
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                                {vals.client_name && <div><span className="text-slate-400 text-xs">Client: </span><span className="font-semibold text-slate-700">{vals.client_name}</span></div>}
                                                {vals.rental_cost !== undefined && <div><span className="text-slate-400 text-xs">Cost: </span><span className="font-semibold text-slate-700">₹{vals.rental_cost}</span></div>}
                                                {vals.start_date && <div><span className="text-slate-400 text-xs">Start: </span><span className="font-semibold text-slate-700">{vals.start_date}</span></div>}
                                                {vals.end_date && <div><span className="text-slate-400 text-xs">End: </span><span className="font-semibold text-slate-700">{vals.end_date}</span></div>}
                                            </div>
                                        );
                                    }

                                    if (log.action === 'MAINTENANCE_CREATE') {
                                        const vals = nv || {};
                                        return (
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                                {vals.description && <div className="col-span-2"><span className="text-slate-400 text-xs">Description: </span><span className="font-semibold text-slate-700">{vals.description}</span></div>}
                                                {vals.maintenance_date && <div><span className="text-slate-400 text-xs">Date: </span><span className="font-semibold text-slate-700">{vals.maintenance_date}</span></div>}
                                                {vals.cost !== undefined && <div><span className="text-slate-400 text-xs">Cost: </span><span className="font-semibold text-slate-700">₹{vals.cost}</span></div>}
                                            </div>
                                        );
                                    }

                                    if (log.action === 'USAGE_CREATE') {
                                        const vals = nv || {};
                                        return (
                                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                                                {vals.working_hours !== undefined && <div><span className="text-slate-400 text-xs">Working Hours: </span><span className="font-semibold text-slate-700">{vals.working_hours} hrs</span></div>}
                                                {vals.fuel_used !== undefined && <div><span className="text-slate-400 text-xs">Fuel Used: </span><span className="font-semibold text-slate-700">{vals.fuel_used} L</span></div>}
                                                {vals.usage_date && <div><span className="text-slate-400 text-xs">Date: </span><span className="font-semibold text-slate-700">{vals.usage_date}</span></div>}
                                                {vals.notes && <div className="col-span-2"><span className="text-slate-400 text-xs">Notes: </span><span className="font-semibold text-slate-700">{vals.notes}</span></div>}
                                            </div>
                                        );
                                    }

                                    if (log.action === 'UPDATE') {
                                        const allKeys = Array.from(new Set([...Object.keys(ov || {}), ...Object.keys(nv || {})]));
                                        const changedKeys = allKeys.filter(k => JSON.stringify((ov || {})[k]) !== JSON.stringify((nv || {})[k]));
                                        if (changedKeys.length === 0) return <span className="text-xs text-slate-400">No meaningful changes</span>;
                                        return (
                                            <div className="space-y-1">
                                                {changedKeys.map(k => (
                                                    <div key={k} className="flex items-center gap-2 text-sm flex-wrap">
                                                        <span className="text-slate-500 text-xs capitalize">{k.replace(/_/g, ' ')}:</span>
                                                        <span className="text-slate-500 line-through text-xs">{k === 'project_id' ? getProjectName((ov || {})[k]) : String((ov || {})[k] ?? '—')}</span>
                                                        <span className="text-slate-400">→</span>
                                                        <span className="font-semibold text-slate-700 text-xs">{k === 'project_id' ? getProjectName((nv || {})[k]) : String((nv || {})[k] ?? '—')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    }

                                    return <span className="text-xs text-slate-400">Action recorded</span>;
                                };

                                return (
                                    <div key={log.id} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                                        <div className="shrink-0">
                                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg ${colorClass}`}>{log.action.replace(/_/g, ' ')}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {renderDetails()}
                                        </div>
                                        <div className="shrink-0 text-right">
                                            <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleDateString()}</p>
                                            <p className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                                    <p className="text-sm font-medium">No audit logs found</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setIsLogsModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors">Close</button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* QR Code Modal */}
            <Modal isOpen={isQrModalOpen} onClose={() => setIsQrModalOpen(false)} title="Equipment QR Code" maxWidth="max-w-xs">
                <div className="p-6 font-inter bg-slate-50 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col items-center">
                        <img src={qrCodeUrl} alt={`QR for ${qrEquipmentCode}`} className="w-48 h-48 object-contain mb-3" />
                        <span className="text-sm font-bold text-slate-800 tracking-widest">{qrEquipmentCode}</span>
                    </div>
                    <div className="flex gap-3 w-full">
                        <button onClick={() => setIsQrModalOpen(false)} className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors">Close</button>
                        <a href={qrCodeUrl} download={`QR_${qrEquipmentCode}.png`} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-colors flex items-center justify-center text-center">
                            Download
                        </a>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default EquipmentPage;
