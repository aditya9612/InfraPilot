import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from "../../../components/common/Navbar";
import PageTransition from "../../../components/common/PageTransition";
import StatCard from "../../../components/common/StatCard";
import toast from "react-hot-toast";
import {
  Search,
  Package,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Clock,
  ChevronDown
} from "lucide-react";
import { materialService } from "../../../services/materialService";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";




const MaterialStockPage = () => {
  const formatINR = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) return "₹0";
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const [report, setReport] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [projectId, setProjectId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortOrder, setSortOrder] = useState<"latest" | "oldest">("latest");

  // Interactive StatCard Filter
  const [activeStatFilter, setActiveStatFilter] = useState<"All" | "Critical" | "HighValue" | "InStock">("All");
  const fetchData = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    try {
      let data = await materialService.getInventory(projectId);

      setReport(data);

    } catch (error) {
      console.error("Failed to load stock data", error);
      toast.error("Failed to sync inventory intelligence");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    const userStr = localStorage.getItem("infrapilot_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        const pId = user?.project_id || user?.user?.project_id;
        if (pId) {
          setProjectId(Number(pId));
        } else {
          setProjectId(92);
        }
      } catch (e) {
        console.error("Failed to resolve project ID", e);
        setProjectId(92);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    const projectReport = report.filter(i => i.project_id === undefined || i.project_id === projectId);
    return {
      totalItems: projectReport.length,
      totalValue: projectReport.reduce((acc, curr) => acc + (curr.total_value || curr.total_cost || 0), 0),
      criticalCount: projectReport.filter(i => i.remaining_stock < 10).length, // Mock logic for critical
      highValueCount: projectReport.filter(i => (i.total_value || i.total_cost || 0) > 10000).length
    };
  }, [report, projectId]);

  const filteredReport = useMemo(() => {
    // Only include items that belong to the currently selected project (or if the API doesn't return project_id, include them as fallback)
    let data = report.filter(i => i.project_id === undefined || i.project_id === projectId);

    if (activeStatFilter === "Critical") {
      data = data.filter(i => i.remaining_stock < 10);
    } else if (activeStatFilter === "HighValue") {
      data = data.filter(i => (i.total_value || i.total_cost || 0) > 10000);
    } else if (activeStatFilter === "InStock") {
      data = data.filter(i => i.remaining_stock > 0);
    }

    data = data.filter(i =>
      searchTerm === "" ||
      i.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(i.material_id).includes(searchTerm)
    );

    data.sort((a, b) => {
      if (sortOrder === "latest") {
        return Number(b.material_id) - Number(a.material_id);
      } else {
        return Number(a.material_id) - Number(b.material_id);
      }
    });

    return data;
  }, [report, searchTerm, activeStatFilter, sortOrder]);

  const paginatedReport = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReport.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReport, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeStatFilter, sortOrder]);



  const handleExportPdf = () => {
    setIsExporting(true);
    const loadToast = toast.loading("Generating Strategic PDF report...");

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      const pdfFormatNum = (amount: number) => amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      // --- HEADER ---
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138); // Dark blue text
      doc.setFont("helvetica", "bold");
      const title = "Material Inventory Report";
      doc.text(title, pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "normal");
      const dateStr = new Date().toLocaleDateString("en-GB", { day: '2-digit', month: 'short', year: 'numeric' });
      doc.text(`Pune, Maharashtra | ${dateStr}`, pageWidth / 2, 26, { align: "center" });

      // Orange Divider
      doc.setDrawColor(249, 115, 22); // Orange
      doc.setLineWidth(0.5);
      doc.line(14, 30, pageWidth - 14, 30);

      // --- INFO BLOCK ---
      autoTable(doc, {
        startY: 35,
        head: [["Company / Project", "Contact", "Email", "Website"]],
        body: [["Pune, Maharashtra", "+91 9999999999", "info@infrapilot.com", "www.infrapilot.com"]],
        theme: "grid",
        headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold", halign: "center", fontSize: 9 },
        bodyStyles: { halign: "center", fontSize: 9, textColor: [30, 58, 138], fontStyle: "bold" },
        margin: { left: 14, right: 14 }
      });

      // --- SUMMARY SECTION ---
      let finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.setFont("helvetica", "bold");
      doc.text("SUMMARY", 14, finalY);

      // We calculate mock values for the 1st image's requested columns
      const totalMaterials = stats.totalItems;
      const totalPurchased = filteredReport.reduce((acc: number, curr: any) => acc + (curr.total_purchased || curr.remaining_stock || 0), 0);
      const totalUsed = filteredReport.reduce((acc: number, curr: any) => acc + (curr.total_used || 0), 0);
      const stockValue = stats.totalValue;
      const pending = filteredReport.reduce((acc: number, curr: any) => acc + (curr.payment_pending || 0), 0);

      // Summary Table
      autoTable(doc, {
        startY: finalY + 4,
        head: [["Total Materials", "Total Purchased", "Total Used", "Stock Value", "Pending"]],
        body: [[
          totalMaterials.toString(),
          totalPurchased.toLocaleString('en-IN'),
          totalUsed.toLocaleString('en-IN'),
          `Rs. ${stockValue.toLocaleString('en-IN')}`,
          `Rs. ${pending.toLocaleString('en-IN')}`
        ]],
        theme: "grid",
        headStyles: {
          fillColor: [255, 255, 255],
          textColor: [148, 163, 184],
          fontStyle: "normal",
          fontSize: 9,
          lineWidth: 0,
          lineColor: [249, 115, 22] // We'll manually draw the orange top border
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [30, 58, 138],
          fontStyle: "bold",
          fontSize: 14,
          halign: "left"
        },
        styles: { lineColor: [226, 232, 240], lineWidth: 0.1 },
        didDrawPage: (data) => {
          // Draw orange top border for summary table
          doc.setDrawColor(249, 115, 22);
          doc.setLineWidth(1);
          doc.line(data.settings.margin.left, finalY + 4, pageWidth - 14, finalY + 4);
        }
      });

      // --- MATERIAL DETAILS SECTION ---
      finalY = (doc as any).lastAutoTable.finalY + 15;
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.setFont("helvetica", "bold");
      doc.text("MATERIAL DETAILS", 14, finalY);

      const tableData = filteredReport.map((m: any, index: number) => [
        (index + 1).toString(),
        m.material_name || "-",
        m.remaining_stock?.toLocaleString('en-IN') || "0",
        m.unit || "-",
        pdfFormatNum(m.avg_rate || 0),
        pdfFormatNum(m.total_value || m.total_cost || 0)
      ]);

      // Calculate totals
      const totalRemaining = filteredReport.reduce((acc: number, curr: any) => acc + (curr.remaining_stock || 0), 0);
      const totalValue = filteredReport.reduce((acc: number, curr: any) => acc + (curr.total_value || curr.total_cost || 0), 0);

      tableData.push([
        "",
        "TOTAL",
        totalRemaining.toLocaleString('en-IN'),
        "",
        "",
        pdfFormatNum(totalValue)
      ]);

      autoTable(doc, {
        startY: finalY + 4,
        head: [["#", "Material Name", "Remaining Stock", "Unit", "Avg Rate", "Total Value"]],
        body: tableData,
        theme: "grid",
        headStyles: {
          fillColor: [21, 51, 95], // Darker Blue matching 2nd image
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
          halign: "left"
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85],
          halign: "left"
        },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { lineColor: [203, 213, 225], lineWidth: 0.1 },
        columnStyles: {
          0: { halign: "center", cellWidth: 10 },
          2: { halign: "right" },
          4: { halign: "right" },
          5: { halign: "right", fontStyle: "bold", textColor: [21, 51, 95] }
        },
        didParseCell: (data) => {
          // Style the TOTAL row
          if (data.row.index === tableData.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [21, 51, 95];
            data.cell.styles.fillColor = [241, 245, 249];
          }
        },
        didDrawPage: (data) => {
          const pageHeight = doc.internal.pageSize.getHeight();
          const pageWidth = doc.internal.pageSize.getWidth();

          // Page numbers above the footer
          const str = "Page " + (doc as any).internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(148, 163, 184);
          doc.setFont("helvetica", "normal");
          doc.text("Generated by Infra Pilot System • Confidential", 14, pageHeight - 34);
          doc.text(str, pageWidth - 14, pageHeight - 34, { align: "right" });

          // --- BOTTOM FOOTER (2nd Image Style) ---
          // Orange Top Border for footer
          doc.setDrawColor(249, 115, 22);
          doc.setLineWidth(1.5);
          doc.line(0, pageHeight - 30, pageWidth, pageHeight - 30);

          // Dark blue background
          doc.setFillColor(21, 51, 95);
          doc.rect(0, pageHeight - 30, pageWidth, 30, 'F');

          // Logo text
          doc.setFontSize(16);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 255, 255);
          doc.text("INFRA", 14, pageHeight - 16);
          const infraWidth = doc.getTextWidth("INFRA");
          doc.setTextColor(249, 115, 22); // Orange
          doc.text("PILOT", 14 + infraWidth, pageHeight - 16);

          // Subtitle
          doc.setFontSize(8);
          doc.setTextColor(200, 200, 200);
          doc.setFont("helvetica", "normal");
          doc.text("Construction Billing Software", 14, pageHeight - 10);

          // REPORT Badge
          doc.setFillColor(249, 115, 22);
          doc.roundedRect(pageWidth - 46, pageHeight - 22, 32, 8, 1, 1, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont("helvetica", "bold");
          doc.text("REPORT", pageWidth - 30, pageHeight - 16, { align: "center" });

          // Generated Date
          doc.setFontSize(7);
          doc.setTextColor(200, 200, 200);
          doc.setFont("helvetica", "normal");
          const dateStr = new Date().toLocaleString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + " UTC";
          doc.text(`Generated: ${dateStr}`, pageWidth - 30, pageHeight - 10, { align: "center" });
        }
      });

      doc.save(`Material_Stock_Summary_${new Date().toLocaleDateString("en-IN").replace(/\//g, '-')}.pdf`);
      toast.success("PDF Exported Successfully!", { id: loadToast });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Generation Failed", { id: loadToast });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    setIsExporting(true);
    const loadToast = toast.loading("Processing Strategic Excel ledger...");

    try {
      const exportData = filteredReport.map((m: any) => ({
        "Material Name": m.material_name || "-",
        "Remaining Stock": m.remaining_stock || 0,
        "Unit": m.unit || "-",
        "Avg Rate": m.avg_rate || 0,
        "Total Value": m.total_value || m.total_cost || 0
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);

      const wscols = [
        { wch: 25 }, // Material Name
        { wch: 15 }, // Remaining Stock
        { wch: 10 }, // Unit
        { wch: 15 }, // Avg Rate
        { wch: 20 }, // Total Value
      ];
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Stock_Summary");
      XLSX.writeFile(workbook, `Material_Stock_Summary_${new Date().toLocaleDateString("en-IN").replace(/\//g, '-')}.xlsx`);

      toast.success("Excel Exported Successfully!", { id: loadToast });
    } catch (error) {
      console.error("Export Failed:", error);
      toast.error("Export Failed", { id: loadToast });
    } finally {
      setIsExporting(false);
    }
  };



  return (
    <>
      <Navbar title="Inventory Intelligence" breadcrumb={["Engineer", "Logistics", "Strategic Stock"]} />
      <PageTransition className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] overflow-y-auto font-inter flex flex-col pb-8">
        {/* â”€â”€ Header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 font-inter">
          <div className="font-inter">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight font-inter">Strategic Stock</h1>
            <p className="text-slate-500 text-sm font-inter">Real-time inventory valuation and procurement momentum audit.</p>
          </div>
          <div className="flex items-center gap-3 font-inter">
            <button
              onClick={fetchData}
              className="p-2.5 text-slate-400 hover:text-primary hover:bg-white rounded-xl transition-all border border-slate-100 bg-white/50 shadow-sm active:scale-95"
              title="Sync Intelligence"
            >
              <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-rose-600 hover:bg-rose-50 disabled:opacity-50 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-slate-200 shadow-sm"
            >
              PDF Report
            </button>
            <button
              onClick={handleExportExcel}
              disabled={isExporting}
              className="flex items-center justify-center px-8 py-3 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border border-emerald-100 shadow-sm hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
            >
              {isExporting ? 'Generating...' : 'EXCEL SHEET'}
            </button>
          </div>
        </div>

        {/* â”€â”€ Interactive Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 font-inter">
          <div onClick={() => setActiveStatFilter("All")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "All" ? "ring-2 ring-primary/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Inventory Scope"
              value={stats.totalItems.toString()}
              sub="Resource Types"
              accent="text-slate-800" />
          </div>
          <div className="cursor-default group transition-all rounded-xl hover:scale-[1.01]">
            <StatCard
              title="Valuation"
              value={formatINR(stats.totalValue)}
              sub="Gross Stock Value"
              accent="text-emerald-500" />
          </div>
          <div onClick={() => setActiveStatFilter("Critical")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "Critical" ? "ring-2 ring-rose-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Critical Stock"
              value={stats.criticalCount.toString()}
              sub="Refill Required"
              accent="text-rose-500" />
          </div>
          <div onClick={() => setActiveStatFilter("HighValue")} className={`cursor-pointer group transition-all rounded-xl ${activeStatFilter === "HighValue" ? "ring-2 ring-amber-500/20 bg-white shadow-sm scale-[1.02]" : "hover:scale-[1.01]"}`}>
            <StatCard
              title="Strategic Asset"
              value={stats.highValueCount.toString()}
              sub="High-Value Items"
              accent="text-amber-500" />
          </div>
        </div>

        {/* â”€â”€ Filter Bar & Card Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6 font-inter">
          <div className="p-4 border-b border-slate-50 flex flex-col lg:flex-row lg:items-center gap-4 bg-white font-inter">
            <div className="relative flex-1 max-w-md font-inter">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-inter">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by material name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 font-inter shadow-sm"
              />
            </div>
            {(activeStatFilter !== "All" || searchTerm !== "") && (
              <button
                onClick={() => { setSearchTerm(""); setActiveStatFilter("All"); }}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-rose-500 transition-all flex items-center justify-center shadow-sm active:scale-95"
                title="Reset Filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <div className="relative flex items-center font-inter">
              <div className="absolute left-3 text-slate-400 pointer-events-none">
                <Clock className="w-4 h-4" />
              </div>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "latest" | "oldest")}
                className="appearance-none bg-white border border-primary rounded-full text-sm font-bold text-primary shadow-sm pl-9 pr-8 py-1.5 outline-none cursor-pointer"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <div className="absolute right-3 text-slate-400 pointer-events-none">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div className="overflow-auto max-h-[400px] scrollbar-thin scrollbar-thumb-slate-200 font-inter">
            <table className="w-full text-left font-inter min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-50 font-inter">
                  <th className="px-6 py-4 font-inter">material_name</th>
                  <th className="px-6 py-4 font-inter text-right text-emerald-600">remaining_stock</th>
                  <th className="px-6 py-4 font-inter text-center">unit</th>
                  <th className="px-6 py-4 font-inter text-right">avg_rate</th>
                  <th className="px-6 py-4 font-inter text-right">total_value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-inter">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center font-inter">
                      <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin font-inter mb-4" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 font-inter">Syncing inventory...</p>
                    </td>
                  </tr>
                ) : paginatedReport.length > 0 ? (
                  paginatedReport.map((rep) => (
                    <tr key={rep.material_id} className="hover:bg-slate-50/50 transition-colors group font-inter">
                      <td className="px-6 py-4 font-inter">
                        <span className="text-sm font-bold text-slate-800 font-inter">{rep.material_name}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className={`text-sm font-bold font-inter ${rep.remaining_stock > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                          {rep.remaining_stock?.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-inter">
                        <span className="text-sm font-bold text-slate-500 font-inter">{rep.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-bold text-slate-800 font-inter">{formatINR(rep.avg_rate)}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-inter">
                        <span className="text-sm font-bold text-slate-800 font-inter">{formatINR(rep.total_value || rep.total_cost)}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-32 text-center bg-slate-50/50 font-inter">
                      <div className="py-12 border-2 border-dashed border-slate-200 rounded-[3rem] max-w-lg mx-auto font-inter">
                        <Package className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-slate-400 tracking-tight uppercase font-inter">Registry Exhausted</h3>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2 font-inter">No matching resources found in the current intelligence scope.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {filteredReport.length > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 sticky left-0 font-inter rounded-b-2xl">
              {/* Left: Items per page */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-slate-500">Records per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 px-2 py-1 outline-none focus:border-primary bg-white shadow-sm"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Center: Showing info */}
              <div className="text-[11px] font-medium text-slate-500 hidden md:block">
                Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredReport.length)} of {filteredReport.length} records
              </div>

              {/* Right: Pagination */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {(() => {
                  const totalItems = filteredReport.length;
                  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
                  const pages = [];
                  if (totalPages <= 5) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    if (currentPage <= 3) {
                      pages.push(1, 2, 3, 4, '...', totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                    } else {
                      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                    }
                  }

                  return pages.map((page, index) => {
                    if (page === '...') {
                      return <span key={`ellipsis-${index}`} className="text-slate-400 mx-1 text-[11px] font-medium tracking-widest">...</span>;
                    }
                    const pageNum = page as number;
                    const isActive = currentPage === pageNum;
                    return (
                      <button
                        key={`page-${pageNum}`}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`min-w-[28px] h-[28px] flex items-center justify-center rounded-lg text-[11px] font-bold transition-colors ${isActive
                            ? 'bg-primary text-white shadow-sm shadow-primary/20 border border-primary'
                            : 'bg-white text-slate-500 border border-slate-200 hover:text-primary shadow-sm'
                          }`}
                      >
                        {pageNum}
                      </button>
                    );
                  });
                })()}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(filteredReport.length / itemsPerPage), prev + 1))}
                  disabled={currentPage === Math.max(1, Math.ceil(filteredReport.length / itemsPerPage)) || filteredReport.length === 0}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors bg-white shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>


      </PageTransition>
    </>
  );
};

export default MaterialStockPage;
