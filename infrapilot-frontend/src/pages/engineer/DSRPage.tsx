import React, { useState, useEffect } from "react";
import PageTransition from "../../components/common/PageTransition";
import Modal from "../../components/common/Modal";
import Navbar from "../../components/common/Navbar";
import toast from "react-hot-toast";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DSRReport {
    id: number | string;
    project_id?: number | string;
    report_date: string;
    report_type: 'Daily' | 'Weekly' | 'Monthly';
    site_location: string;
    contractor_name: string;
    weather: string;
    work_done: string;
    work_planned: string;
    labour_count: number;
    machinery_used: string;
    material_received: string;
    material_used: string;
    issues: string;
    safety_observations: string;
    remarks: string;
    latitude: number;
    longitude: number;
    created_at?: string;
    updated_at?: string;
    created_by_user_id?: number;
    created_by_name?: string;
    status: string;
}

// ─── Mock History Data ─────────────────────────────────────────────────────────

const dsrHistoryData: DSRReport[] = [
    {
        id: 1,
        report_date: "2026-04-13",
        report_type: "Daily",
        site_location: "Tower A - Basement",
        contractor_name: "Sai Infra",
        weather: "Sunny",
        work_done: "Completed footing and started column reinforcement",
        work_planned: "Complete column casting",
        labour_count: 25,
        machinery_used: "Excavator, Concrete Mixer",
        material_received: "Cement - 50 bags, Steel - 3 tons",
        material_used: "Cement - 30 bags, Steel - 1.5 tons",
        issues: "Delay due to late material delivery",
        safety_observations: "Workers not wearing helmets properly",
        remarks: "Work progress is satisfactory",
        latitude: 19.9975,
        longitude: 73.7898,
        created_at: "2026-04-14T12:40:02",
        updated_at: "2026-04-14T12:40:02",
        created_by_user_id: 1,
        created_by_name: "Admin User",
        status: "Verified"
    },
    {
        id: 2,
        report_date: "2026-04-12",
        report_type: "Daily",
        site_location: "Block B - Ground Floor",
        contractor_name: "Prime Builders",
        weather: "Cloudy",
        work_done: "Brick laying completed on east wing",
        work_planned: "Start plastering on north wall",
        labour_count: 18,
        machinery_used: "Concrete Mixer, Crane",
        material_received: "Bricks - 500 units, Sand - 2 tons",
        material_used: "Bricks - 450 units, Sand - 1.8 tons",
        issues: "Minor scaffolding issue resolved",
        safety_observations: "All safety protocols followed",
        remarks: "Good progress today",
        latitude: 19.9978,
        longitude: 73.7901,
        created_at: "2026-04-12T18:20:00",
        updated_at: "2026-04-12T18:20:00",
        created_by_user_id: 2,
        created_by_name: "Site Engineer",
        status: "Submitted"
    },
    {
        id: 3,
        report_date: "2026-04-06",
        report_type: "Weekly",
        site_location: "Tower C - Floors 1-5",
        contractor_name: "BuildTech Co.",
        weather: "Sunny",
        work_done: "Completed slab casting for floors 1 through 3, started floor 4 reinforcement",
        work_planned: "Complete floors 4 and 5 slab casting next week",
        labour_count: 60,
        machinery_used: "Tower Crane, 2x Concrete Mixer, Excavator",
        material_received: "Cement - 300 bags, Steel - 15 tons, Aggregates - 50 tons",
        material_used: "Cement - 280 bags, Steel - 13 tons, Aggregates - 45 tons",
        issues: "Weather delay on Wednesday - rain halted work for 4 hours",
        safety_observations: "Weekly safety drill conducted. All PPE compliance checked.",
        remarks: "Overall weekly progress at 78%. On track for milestone.",
        latitude: 19.9980,
        longitude: 73.7910,
        created_at: "2026-04-06T17:00:00",
        updated_at: "2026-04-06T17:00:00",
        created_by_user_id: 1,
        created_by_name: "Admin User",
        status: "Verified"
    },
    {
        id: 4,
        report_date: "2026-03-31",
        report_type: "Monthly",
        site_location: "Full Site - March Summary",
        contractor_name: "All Contractors",
        weather: "Varied",
        work_done: "March: Foundation complete for Tower A & B. Superstructure started for Tower A up to 3rd floor.",
        work_planned: "April target: Complete Tower A up to 8th floor, begin Tower B superstructure.",
        labour_count: 120,
        machinery_used: "2x Tower Crane, 4x Concrete Mixer, 2x Excavator, JCB",
        material_received: "Cement - 1200 bags, Steel - 60 tons, Sand - 200 tons",
        material_used: "Cement - 1100 bags, Steel - 55 tons, Sand - 190 tons",
        issues: "Material price escalation noted. HSE audit pending for March.",
        safety_observations: "Monthly safety inspection completed. 2 minor observations addressed.",
        remarks: "Project is 8% ahead of schedule for Q1 targets.",
        latitude: 19.9975,
        longitude: 73.7898,
        created_at: "2026-03-31T20:00:00",
        updated_at: "2026-03-31T20:00:00",
        created_by_user_id: 1,
        created_by_name: "Admin User",
        status: "Verified"
    },
    {
        id: 5,
        report_date: "2026-04-14",
        report_type: "Daily",
        site_location: "Tower A - Column Grid",
        contractor_name: "Sai Infra",
        weather: "Windy",
        work_done: "Column shuttering completed for Grid C",
        work_planned: "Concrete pour for Grid C columns",
        labour_count: 20,
        machinery_used: "Concrete Pump, Vibrator",
        material_received: "Cement - 40 bags",
        material_used: "Cement - 35 bags",
        issues: "Windy conditions slowed shuttering work",
        safety_observations: "Fall protection equipment inspected and OK",
        remarks: "Concrete pour scheduled for tomorrow morning",
        latitude: 19.9975,
        longitude: 73.7898,
        created_at: "2026-04-14T19:00:00",
        updated_at: "2026-04-14T19:00:00",
        created_by_user_id: 2,
        created_by_name: "Site Engineer",
        status: "Draft"
    },
    {
        id: 6,
        report_date: "2026-04-10",
        report_type: "Weekly",
        site_location: "Tower B - Foundation",
        contractor_name: "Sai Infra",
        weather: "Cloudy",
        work_done: "Completed excavation for Tower B, started PCC work",
        work_planned: "Complete raft reinforcement",
        labour_count: 45,
        machinery_used: "2x Excavator, JCB",
        material_received: "Cement - 100 bags",
        material_used: "Cement - 80 bags",
        issues: "Groundwater seepage noted",
        safety_observations: "Shoring inspected and stable",
        remarks: "On track for foundation completion",
        latitude: 19.9975,
        longitude: 73.7898,
        status: "Submitted"
    },
    {
        id: 7,
        report_date: "2026-02-28",
        report_type: "Monthly",
        site_location: "Full Site - Feb Summary",
        contractor_name: "All Contractors",
        weather: "Sunny",
        work_done: "Feb: Site mobilization and excavation for Tower A complete.",
        work_planned: "March target: Foundation for Tower A & B",
        labour_count: 100,
        machinery_used: "JCB, Excavator",
        material_received: "Cement - 800 bags",
        material_used: "Cement - 700 bags",
        issues: "None",
        safety_observations: "Safety training for new contractors completed",
        remarks: "Mobilization ahead of schedule",
        latitude: 19.9975,
        longitude: 73.7898,
        status: "Verified"
    }
];

// ─── Initial Form State ────────────────────────────────────────────────────────


// ─── Main Component ────────────────────────────────────────────────────────────

// ─── Main Component ────────────────────────────────────────────────────────────

const DSRPage = () => {
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<DSRReport | null>(null);
    const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "error">("idle");
    const [filterStatus, setFilterStatus] = useState("All Status");
    const [reportTypeFilter, setReportTypeFilter] = useState("All Reports");
    const [searchQuery, setSearchQuery] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [dsrData, setDsrData] = useState<DSRReport[]>(dsrHistoryData);

    const [formData, setFormData] = useState({
        id: "" as string | number,
        project_id: 1 as string | number,
        report_date: new Date().toISOString().split("T")[0],
        report_type: "Daily" as "Daily" | "Weekly" | "Monthly",
        site_location: "Tower A - Basement",
        status: "Submitted",
        weather: "Sunny",
        work_done: "",
        work_planned: "",
        labour_count: 0,
        contractor_name: "",
        machinery_used: "",
        material_received: "",
        material_used: "",
        issues: "",
        safety_observations: "",
        remarks: "",
        latitude: 0,
        longitude: 0,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [photos, setPhotos] = useState<File[]>([]);

    // ── GPS auto-capture ──────────────────────────────────────────────────────

    useEffect(() => {
        if (isFormModalOpen && !isEditMode) captureGPS();
    }, [isFormModalOpen, isEditMode]);

    const captureGPS = () => {
        setGpsStatus("capturing");
        setFormData(prev => ({ ...prev, gps: "Acquiring…" }));
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude
                    }));
                    setGpsStatus("captured");
                },
                () => {
                    setGpsStatus("error");
                },
                { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
            );
        } else {
            setGpsStatus("error");
            setFormData(prev => ({ ...prev, gps: "Not Supported" }));
        }
    };

    // ── Form handlers ─────────────────────────────────────────────────────────

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => { const u = { ...prev }; delete u[name]; return u; });
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) setPhotos(prev => [...prev, ...Array.from(e.target.files!)]);
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const errs: Record<string, string> = {};
        if (!formData.report_date) errs.report_date = "report_date is required";
        if (!formData.site_location.trim()) errs.site_location = "site_location is required";
        if (!formData.contractor_name.trim()) errs.contractor_name = "contractor_name is required";
        if (!formData.weather) errs.weather = "weather is required";
        if (!formData.work_done.trim()) errs.work_done = "work_done is required";
        if (!formData.work_planned.trim()) errs.work_planned = "work_planned is required";
        if (formData.labour_count === undefined || formData.labour_count === null) errs.labour_count = "labour_count is required";
        if (!formData.machinery_used.trim()) errs.machinery_used = "machinery_used is required";
        if (!formData.material_received.trim()) errs.material_received = "material_received is required";
        if (!formData.material_used.trim()) errs.material_used = "material_used is required";
        if (!formData.issues.trim()) errs.issues = "issues is required";
        if (!formData.safety_observations.trim()) errs.safety_observations = "safety_observations is required";
        if (!formData.remarks.trim()) errs.remarks = "remarks is required";
        if (!formData.latitude) errs.latitude = "latitude is required";
        if (!formData.longitude) errs.longitude = "longitude is required";

        setErrors(errs);
        if (Object.keys(errs).length > 0) {
            toast.error("Please fill all 15 required fields");
        }
        return Object.keys(errs).length === 0;
    };

    const handleOpenAdd = () => {
        setIsEditMode(false);
        setFormData({
            id: "",
            project_id: 1,
            report_date: new Date().toISOString().split("T")[0],
            report_type: "Daily",
            site_location: "Tower A - Basement",
            status: "Submitted",
            weather: "Sunny",
            work_done: "",
            work_planned: "",
            labour_count: 0,
            contractor_name: "",
            machinery_used: "",
            material_received: "",
            material_used: "",
            issues: "",
            safety_observations: "",
            remarks: "",
            latitude: 0,
            longitude: 0,
        });
        setPhotos([]);
        setIsFormModalOpen(true);
    };

    const handleOpenEdit = (record: DSRReport) => {
        setIsEditMode(true);
        setFormData({
            id: record.id,
            project_id: record.project_id || 1,
            report_date: record.report_date,
            report_type: record.report_type,
            site_location: record.site_location,
            status: record.status,
            weather: record.weather,
            work_done: record.work_done,
            work_planned: record.work_planned,
            labour_count: record.labour_count,
            contractor_name: record.contractor_name,
            machinery_used: record.machinery_used,
            material_received: record.material_received,
            material_used: record.material_used,
            issues: record.issues,
            safety_observations: record.safety_observations,
            remarks: record.remarks,
            latitude: record.latitude,
            longitude: record.longitude,
        });
        setPhotos([]);
        setIsFormModalOpen(true);
    };

    const handleDelete = async (id: string | number) => {
        if (window.confirm("Are you sure you want to delete this DSR entry?")) {
            // Simulated Delete API Hit
            // Request Body: { id: id }

            // Simulated Response: { "success": true, "message": "DSR deleted successfully" }
            const mockResponse = {
                success: true,
                message: "DSR deleted successfully"
            };

            if (mockResponse.success) {
                setDsrData(prev => prev.filter(t => t.id !== id));
                toast.success(mockResponse.message);
            } else {
                toast.error("Deletion failed");
            }
        }
    };

    const handleSaveEdit = () => {
        if (!validateForm()) return;
        setDsrData(prev => prev.map(item => item.id === formData.id ? { ...item, ...formData } as DSRReport : item));
        setIsFormModalOpen(false);
        setIsEditMode(false);
        toast.success("DSR Registry Updated");
    };

    const handleConfirmAdd = () => {
        if (!validateForm()) return;
        const newEntry: DSRReport = {
            ...formData,
            id: dsrData.length + 1,
            status: "Submitted",
            latitude: formData.latitude || 0,
            longitude: formData.longitude || 0
        } as DSRReport;
        setDsrData(prev => [newEntry, ...prev]);
        setIsFormModalOpen(false);
        toast.success("DSR Consolidated Successfully");
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (isEditMode) handleSaveEdit();
        else handleConfirmAdd();
    };

    // ── Filtered records ──────────────────────────────────────────────────────
    const filteredHistory = dsrData.filter(report => {
        const matchesStatus = filterStatus === "All Status" || report.status === filterStatus;
        const matchesType = reportTypeFilter === "All Reports" || report.report_type === reportTypeFilter;
        const matchesSearch = report.site_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            report.id.toString().includes(searchQuery);
        return matchesStatus && matchesType && matchesSearch;
    });

    const handleExportCSV = () => {
        const headers = [
            "ID", "Date", "Report Type", "Site Location", "Contractor",
            "Weather", "Work Done", "Work Planned", "Labour Count",
            "Machinery Used", "Material Received", "Material Used",
            "Issues", "Safety Observations", "Remarks", "Status"
        ];

        const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;

        const rows = filteredHistory.map(r => [
            escape(r.id), escape(r.report_date), escape(r.report_type),
            escape(r.site_location), escape(r.contractor_name), escape(r.weather),
            escape(r.work_done), escape(r.work_planned), escape(r.labour_count),
            escape(r.machinery_used), escape(r.material_received), escape(r.material_used),
            escape(r.issues), escape(r.safety_observations), escape(r.remarks), escape(r.status)
        ].join(","));

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `DSR_Export_${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Excel export: ${filteredHistory.length} records downloaded`);
    };

    const handleExportPDF = () => {
        const rows = filteredHistory.map(r => `
            <tr>
                <td>${r.id}</td>
                <td>${r.report_date}</td>
                <td>${r.report_type}</td>
                <td>${r.site_location}</td>
                <td>${r.contractor_name}</td>
                <td>${r.weather}</td>
                <td>${r.labour_count}</td>
                <td>${r.work_done}</td>
                <td>${r.material_used}</td>
                <td>${r.issues}</td>
                <td>${r.status}</td>
            </tr>
        `).join("");

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>DSR Report – InfraPilot</title>
                <style>
                    body { font-family: Inter, Arial, sans-serif; padding: 30px; color: #1e293b; }
                    h1 { color: #2563eb; font-size: 22px; margin-bottom: 4px; }
                    p.sub { color: #64748b; font-size: 12px; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; font-size: 11px; }
                    th { background: #2563eb; color: white; padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
                    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
                    tr:nth-child(even) td { background: #f8fafc; }
                    .badge { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 9px; font-weight: 700; text-transform: uppercase; }
                    .verified { background: #d1fae5; color: #065f46; }
                    .submitted { background: #dbeafe; color: #1e40af; }
                    .draft { background: #f1f5f9; color: #475569; }
                    @media print { body { padding: 10px; } }
                </style>
            </head>
            <body>
                <h1>Daily Site Report — InfraPilot</h1>
                <p class="sub">Export Date: ${new Date().toLocaleDateString()} | Filter: ${reportTypeFilter} | Status: ${filterStatus} | Total Records: ${filteredHistory.length}</p>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Site Location</th>
                            <th>Contractor</th>
                            <th>Weather</th>
                            <th>Labour</th>
                            <th>Work Done</th>
                            <th>Material Used</th>
                            <th>Issues</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </body>
            </html>
        `;

        const win = window.open("", "_blank");
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
            setTimeout(() => win.print(), 400);
        }
        toast.success(`PDF export initiated for ${filteredHistory.length} records`);
    };

    // ── Stat summary ──────────────────────────────────────────────────────────
    const totalLabor = dsrData.reduce((s, r) => s + (r.labour_count || 0), 0);

    return (
        <>
            <Navbar
                title="Daily Site Report"
                breadcrumb={["InfraPilot", "Engineer", "DSR"]}
            />

            <PageTransition className="p-4 md:p-8 bg-slate-50 min-h-screen font-inter italic-none">
                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 text-inter">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.25em] mb-1 font-inter">
                            Field Documentation Registry
                        </p>
                        <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">
                            Daily Site Report
                        </h1>
                        <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-xl font-inter">
                            End-of-day field documentation, labor analytics, material tracking, and safety audit logs.
                        </p>
                    </div>
                    <div className="flex items-center gap-3 font-inter">
                        <button
                            onClick={handleOpenAdd}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all font-inter"
                        >
                            <span className="text-lg leading-none font-inter">+</span>
                            New DSR Entry
                        </button>
                    </div>
                </div>

                {/* ── Summary Stat Cards (Activity Style) ────────────────────── */}
                <div className="mb-8 font-inter">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 font-inter">
                        DSR Overview
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Logged</p>
                            <p className="text-2xl font-bold text-slate-900 font-inter">{dsrData.length}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Field Reports Filed</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Total Labor</p>
                            <p className="text-2xl font-bold text-blue-600 font-inter">{totalLabor}</p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Assigned Today</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">Verified</p>
                            <p className="text-2xl font-bold text-emerald-500 font-inter">
                                {dsrData.filter(r => r.status === "Verified").length}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Compliance Check Complete</p>
                        </div>
                        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 font-inter">DSR Status</p>
                            <p className="text-2xl font-bold text-amber-500 font-inter">
                                {dsrData.filter(r => r.status === "Submitted").length}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter">Pending Verification</p>
                        </div>
                    </div>
                </div>

                {/* ── Filter Bar ───────────────────────────────────────────── */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-5 py-4 mb-8 flex flex-wrap items-center gap-4 font-inter">

                    {/* Left: Purple Icon + Title */}
                    <div className="flex items-center gap-3 shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <span className="text-base font-bold text-slate-800 whitespace-nowrap">All Tasks Filters</span>
                    </div>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-8 bg-slate-100 shrink-0" />

                    {/* Search */}
                    <div className="flex flex-col gap-0.5 min-w-[180px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Search</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400"
                            />
                        </div>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex flex-col gap-0.5 min-w-[130px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</label>
                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer pr-8"
                            >
                                <option value="All Status">All Status</option>
                                <option value="Verified">Verified</option>
                                <option value="Submitted">Submitted</option>
                                <option value="Draft">Draft</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* Report Type (Filter) Dropdown */}
                    <div className="flex flex-col gap-0.5 min-w-[150px]">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Filter</label>
                        <div className="relative">
                            <select
                                value={reportTypeFilter}
                                onChange={(e) => {
                                    setReportTypeFilter(e.target.value);
                                    setFilterStatus("All Status"); // Reset status filter to show all matching reports of this type
                                }}
                                className="w-full appearance-none px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer pr-8"
                            >
                                <option value="All Reports">All Reports</option>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>

                    {/* Export Button — pushed to the right */}
                    <div className="ml-auto flex items-end pb-0.5 gap-2">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow-md shadow-primary/20 hover:bg-blue-600 transition-all"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            PDF
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export
                        </button>
                    </div>
                </div>


                {/* ── Registry Grid (DSR Overview Card Style) ───────────────── */}
                <div className="mb-20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-inter">
                        {filteredHistory.map((report) => (
                            <div
                                key={report.id}
                                className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all font-inter flex flex-col"
                            >
                                {/* Header: ID & Status */}
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">DSR #{report.id}</span>
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg ${report.status === "Verified" ? "bg-emerald-50 text-emerald-600" :
                                        report.status === "Submitted" ? "bg-blue-50 text-blue-600" :
                                            "bg-slate-100 text-slate-500"
                                        }`}>
                                        {report.status}
                                    </span>
                                </div>

                                {/* Report Type & Date */}
                                <p className="text-[10px] text-slate-400 mt-1.5 font-medium font-inter mb-2">
                                    {report.report_type} · {report.report_date}
                                </p>

                                {/* Site Name - primary bold value */}
                                <p className="text-2xl font-bold text-slate-900 font-inter leading-tight mb-1">{report.site_location}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed line-clamp-2 mb-4">{report.work_done}</p>

                                {/* Labour & Weather */}
                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Workforce</p>
                                        <p className="text-2xl font-bold text-blue-600 font-inter tabular-nums">{report.labour_count}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Personnel</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Weather</p>
                                        <p className="text-lg font-bold text-slate-800 font-inter">{report.weather}</p>
                                        <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Condition</p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setSelectedReport(report)}
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                            title="View"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleOpenEdit(report)}
                                            className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(report.id.toString())}
                                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        title="Delete"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredHistory.length === 0 && (
                        <div className="bg-white rounded-xl p-20 text-center border border-slate-100 shadow-sm font-inter">
                            <svg className="w-16 h-16 text-slate-200 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs font-inter">No DSR entries found</p>
                        </div>
                    )}
                </div>
            </PageTransition >

            {/* ═══════════════════════════════════════════════════════════════
                NEW DSR FORM MODAL
            ═══════════════════════════════════════════════════════════════ */}
            < Modal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setErrors({}); }}
                title={isEditMode ? "Modify DSR Entry" : "New Daily Site Report"}
                maxWidth="max-w-5xl"
            >
                <div className="bg-white p-8 italic-none font-inter text-inter">
                    <form id="dsr-form" onSubmit={handleSubmit} className="space-y-10 text-inter">

                        {/* Section 1: General Info */}
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter">General Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter text-slate-800">

                                {/* 1. Project ID */}
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Project Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="project_id"
                                        value={formData.project_id}
                                        onChange={handleChange}
                                        placeholder="1"
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter"
                                    />
                                </div>

                                {/* 2. Date */}
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Date <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        name="report_date"
                                        value={formData.report_date}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.report_date ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.report_date && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.report_date}</p>}
                                </div>

                                {/* 3. Site Location */}
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Site Location <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="site_location"
                                        value={formData.site_location}
                                        onChange={handleChange}
                                        placeholder="e.g. Tower A - Basement"
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.site_location ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.site_location && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.site_location}</p>}
                                </div>

                                {/* 4. Contractor Name */}
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Contractor Name <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="contractor_name"
                                        value={formData.contractor_name}
                                        onChange={handleChange}
                                        placeholder="e.g. Sai Infra"
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.contractor_name ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.contractor_name && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.contractor_name}</p>}
                                </div>

                                {/* 5. Weather Condition */}
                                <div className="flex flex-col font-inter md:col-span-2">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Weather Condition <span className="text-rose-500">*</span>
                                    </label>
                                    <select
                                        name="weather"
                                        value={formData.weather}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter appearance-none cursor-pointer ${errors.weather ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    >
                                        <option value="">Select Weather</option>
                                        <option value="Sunny">☀️ Sunny</option>
                                        <option value="Cloudy">☁️ Cloudy</option>
                                        <option value="Rainy">🌧️ Rainy</option>
                                        <option value="Extreme Heat">🌡️ Extreme Heat</option>
                                        <option value="Windy">💨 Windy</option>
                                    </select>
                                    {errors.weather && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.weather}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Execution */}
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter">Execution Analytics</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter text-slate-800">

                                {/* 6. Work Done Today */}
                                <div className="flex flex-col font-inter md:col-span-2">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Work Done Today <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        name="work_done"
                                        rows={3}
                                        value={formData.work_done}
                                        onChange={handleChange}
                                        placeholder="Completed footing and started column reinforcement..."
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none font-inter ${errors.work_done ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.work_done && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.work_done}</p>}
                                </div>

                                {/* 7. Work Planned Tomorrow */}
                                <div className="flex flex-col font-inter md:col-span-2">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Work Planned Tomorrow <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        name="work_planned"
                                        rows={3}
                                        value={formData.work_planned}
                                        onChange={handleChange}
                                        placeholder="Complete column casting..."
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none font-inter ${errors.work_planned ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.work_planned && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.work_planned}</p>}
                                </div>

                                {/* 8. Labor Count (Skilled / Unskilled) */}
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Labor Count (Skilled / Unskilled) <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="labour_count"
                                        value={formData.labour_count}
                                        onChange={handleChange}
                                        placeholder="25"
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] font-bold text-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.labour_count ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.labour_count && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.labour_count}</p>}
                                </div>

                                {/* 9. Machinery Used */}
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Machinery Used <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="machinery_used"
                                        value={formData.machinery_used}
                                        onChange={handleChange}
                                        placeholder="Excavator, Concrete Mixer..."
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all font-inter ${errors.machinery_used ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.machinery_used && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.machinery_used}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Material */}
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter">Materials</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter text-slate-800">

                                {/* 10. Material Received */}
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Material Received <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        name="material_received"
                                        rows={3}
                                        value={formData.material_received}
                                        onChange={handleChange}
                                        placeholder="Cement - 50 bags, Steel - 2 tons..."
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none font-inter ${errors.material_received ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.material_received && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.material_received}</p>}
                                </div>

                                {/* 11. Material Consumed */}
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Material Consumed <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        name="material_used"
                                        rows={3}
                                        value={formData.material_used}
                                        onChange={handleChange}
                                        placeholder="Cement - 30 bags, Steel - 1.5 tons..."
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none font-inter ${errors.material_used ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.material_used && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.material_used}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Safety & Remarks */}
                        <div className="border border-slate-200 rounded-xl p-6">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter">Compliance Insights</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-inter text-slate-800">

                                {/* 12. Issues / Delays */}
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Issues / Delays <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        name="issues"
                                        rows={3}
                                        value={formData.issues}
                                        onChange={handleChange}
                                        placeholder="Delay due to late material delivery..."
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all resize-none font-inter ${errors.issues ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.issues && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.issues}</p>}
                                </div>

                                {/* 13. Safety Observations */}
                                <div className="flex flex-col font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Safety Observations <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        name="safety_observations"
                                        rows={3}
                                        value={formData.safety_observations}
                                        onChange={handleChange}
                                        placeholder="Workers not wearing helmets properly..."
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none font-inter ${errors.safety_observations ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.safety_observations && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.safety_observations}</p>}
                                </div>

                                {/* 14. Engineer Remarks */}
                                <div className="flex flex-col md:col-span-2 font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-1.5 font-inter">
                                        Engineer Remarks <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        name="remarks"
                                        rows={3}
                                        value={formData.remarks}
                                        onChange={handleChange}
                                        placeholder="Work progress is satisfactory..."
                                        className={`w-full px-4 py-3 bg-white border rounded-lg text-[13px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none font-inter ${errors.remarks ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                    />
                                    {errors.remarks && <p className="text-[10px] font-bold text-rose-500 mt-1 font-inter">{errors.remarks}</p>}
                                </div>

                                {/* 16. GPS Location (Auto Capture) */}
                                <div className="flex flex-col md:col-span-2 font-inter">
                                    <label className="text-[13px] font-bold text-slate-700 mb-3 flex items-center gap-2 font-inter">
                                        GPS Location (Auto Capture) <span className="text-rose-500">*</span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest font-inter ${gpsStatus === "captured" ? "bg-emerald-100 text-emerald-600" : gpsStatus === "error" ? "bg-red-100 text-red-500" : "bg-amber-100 text-amber-600"}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${gpsStatus === "captured" ? "bg-emerald-500" : gpsStatus === "error" ? "bg-red-500" : "bg-amber-500 animate-pulse"}`} />
                                            {gpsStatus === "captured" ? "Locked" : gpsStatus === "error" ? "Failed" : "Syncing…"}
                                        </span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-6 font-inter">
                                        <div className="flex flex-col font-inter">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-inter">latitude</label>
                                            <input
                                                type="number"
                                                name="latitude"
                                                value={formData.latitude}
                                                readOnly
                                                placeholder="latitude"
                                                className={`w-full px-4 py-3 bg-slate-50 border rounded-lg text-[13px] font-semibold text-slate-500 font-mono font-inter ${errors.latitude ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                            />
                                        </div>
                                        <div className="flex flex-col font-inter">
                                            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-inter">longitude</label>
                                            <input
                                                type="number"
                                                name="longitude"
                                                value={formData.longitude}
                                                readOnly
                                                placeholder="longitude"
                                                className={`w-full px-4 py-3 bg-slate-50 border rounded-lg text-[13px] font-semibold text-slate-500 font-mono font-inter ${errors.longitude ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 15. Photo Upload */}
                        <div className="border border-slate-200 rounded-xl p-6 font-inter">
                            <h3 className="text-[15px] font-bold text-slate-800 mb-6 font-inter">Evidence Tracking</h3>
                            <div className="flex flex-wrap gap-4 font-inter">
                                {photos.map((file, i) => (
                                    <div key={i} className="relative w-24 h-24 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center overflow-hidden group font-inter">
                                        <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="text-[8px] text-slate-400 font-black px-1 truncate w-full text-center mt-1 uppercase font-inter">{file.name}</p>
                                        <button type="button" onClick={() => removePhoto(i)} className="absolute inset-0 bg-rose-600/90 text-white text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest font-inter">Remove</button>
                                    </div>
                                ))}
                                <label className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 flex flex-col items-center justify-center cursor-pointer transition-all group font-inter text-inter">
                                    <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                                    <span className="text-2xl font-black text-slate-200 group-hover:text-blue-500 transition-all font-inter">+</span>
                                    <span className="text-[8px] font-black text-slate-400 group-hover:text-blue-500 mt-1 uppercase tracking-widest transition-all font-inter">Upload</span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="bg-white px-8 py-6 border-t border-slate-100 flex items-center justify-end gap-3 font-inter">
                    <button
                        type="button"
                        onClick={() => { setIsFormModalOpen(false); setErrors({}); }}
                        className="px-6 py-2.5 bg-white border border-slate-200 text-[13px] font-bold text-slate-600 rounded-lg hover:bg-slate-50 transition-all font-inter shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="dsr-form"
                        className="px-8 py-2.5 bg-blue-600 text-white text-[13px] font-bold rounded-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95 font-inter"
                    >
                        {isEditMode ? "Update DSR Registry" : "Consolidate DSR Entry"}
                    </button>
                </div>
            </Modal>

            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            {/* ── DETAIL MODAL (Insight View) ────────────────────────────────── */}
            <Modal
                isOpen={!!selectedReport}
                onClose={() => setSelectedReport(null)}
                title="Activity Insight"
                maxWidth="max-w-2xl"
            >
                {selectedReport && (
                    <div className="bg-white p-6 italic-none text-inter">
                        {/* ── Blue Hero Card ────────────────────────────────── */}
                        <div className="bg-blue-600 rounded-[2rem] p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />

                            <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2 font-inter">Operation Blueprint</p>
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-2xl font-black tracking-tight leading-tight font-inter">{selectedReport.site_location}</h3>
                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                                        <svg className="w-6 h-6 opacity-40 text-white" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6H13a1 1 0 000 2h3.3l-1.6 1.6a1 1 0 001.4 1.4l3.3-3.3a1 1 0 000-1.4l-3.3-3.3a1 1 0 00-1.4 0zM19 19a1 1 0 01-1 1H4a1 1 0 01-1-1v-2h16v2zm1-5a1 1 0 00-1-1H4a1 1 0 00-1 1v2h16v-2zM4 11h7a1 1 0 000-2H4a1 1 0 000 2zM4 7h7a1 1 0 000-2H4a1 1 0 000 2z" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 font-inter">
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 font-inter">Workforce</p>
                                        <p className="text-xl font-black font-inter">{selectedReport.labour_count} Assigned</p>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mb-1 font-inter">Status</p>
                                        <p className="text-xl font-black font-inter">{selectedReport.status.toUpperCase()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Diagnostic Floor ──────────────────────────────── */}
                        <div className="space-y-8 mb-10 px-1 font-inter">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">General Information</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12 font-inter border-l-2 border-blue-500 pl-6">
                                    {/* 1. Date */}
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Date</p>
                                        <p className="text-sm font-black text-slate-800 tabular-nums font-inter">{selectedReport.report_date}</p>
                                    </div>
                                    {/* 2. Project Name */}
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Project Name</p>
                                        <p className="text-sm font-black text-slate-800 font-inter">{selectedReport.project_id || 1}</p>
                                    </div>
                                    {/* 3. Site Location */}
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Site Location</p>
                                        <p className="text-sm font-black text-slate-800 font-inter">{selectedReport.site_location}</p>
                                    </div>
                                    {/* 4. Weather Condition */}
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Weather Condition</p>
                                        <p className="text-sm font-black text-slate-800 font-inter">{selectedReport.weather}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Execution Analytics</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12 font-inter border-l-2 border-emerald-500 pl-6">
                                    {/* 5. Work Done Today */}
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Work Done Today</p>
                                        <p className="text-sm font-bold text-blue-600 leading-relaxed font-inter">{selectedReport.work_done || "-"}</p>
                                    </div>
                                    {/* 6. Work Planned Tomorrow */}
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Work Planned Tomorrow</p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed font-inter">{selectedReport.work_planned || "-"}</p>
                                    </div>
                                    {/* 7. Labor Count (Skilled / Unskilled) */}
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Labor Count (Skilled / Unskilled)</p>
                                        <p className="text-sm font-black text-slate-800 font-inter">{selectedReport.labour_count}</p>
                                    </div>
                                    {/* 8. Contractor Name */}
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Contractor Name</p>
                                        <p className="text-sm font-black text-slate-800 font-inter">{selectedReport.contractor_name}</p>
                                    </div>
                                    {/* 9. Machinery Used */}
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Machinery Used</p>
                                        <p className="text-sm font-medium text-slate-600 font-inter">{selectedReport.machinery_used}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Materials</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12 font-inter border-l-2 border-slate-900 pl-6">
                                    {/* 10. Material Received */}
                                    <div className="col-span-2 md:col-span-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Material Received</p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed font-inter">{selectedReport.material_received}</p>
                                    </div>
                                    {/* 11. Material Consumed */}
                                    <div className="col-span-2 md:col-span-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Material Consumed</p>
                                        <p className="text-sm font-bold text-emerald-600 leading-relaxed font-inter">{selectedReport.material_used}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 font-inter">Compliance Insights</p>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-12 font-inter border-l-2 border-rose-500 pl-6">
                                    {/* 12. Issues / Delays */}
                                    <div className="col-span-2 md:col-span-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Issues / Delays</p>
                                        <p className="text-sm font-medium text-rose-500 leading-relaxed font-inter">{selectedReport.issues || "None"}</p>
                                    </div>
                                    {/* 13. Safety Observations */}
                                    <div className="col-span-2 md:col-span-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Safety Observations</p>
                                        <p className="text-sm font-medium text-amber-600 leading-relaxed font-inter">{selectedReport.safety_observations}</p>
                                    </div>
                                    {/* 14. Engineer Remarks */}
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">Engineer Remarks</p>
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed font-inter">{selectedReport.remarks}</p>
                                    </div>
                                    {/* 16. GPS Location (Auto Capture) */}
                                    <div className="col-span-2">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-inter">GPS Location (Auto Capture)</p>
                                        <p className="text-sm font-mono font-medium text-slate-500 font-inter">{selectedReport.latitude || 0}, {selectedReport.longitude || 0}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── Action Footer ─────────────────────────────────── */}
                        <div className="flex items-center gap-4 pt-6 border-t border-slate-50 font-inter">
                            <button
                                onClick={() => setSelectedReport(null)}
                                className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-500 text-[10px] font-black rounded-2xl transition-all uppercase tracking-widest font-inter"
                            >
                                Close Insight
                            </button>
                            <button
                                onClick={() => {
                                    handleOpenEdit(selectedReport);
                                    setSelectedReport(null);
                                }}
                                className="flex-[1.5] px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 justify-center active:scale-95"
                            >
                                Modify Registry
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default DSRPage;
