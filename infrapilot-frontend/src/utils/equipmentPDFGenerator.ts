import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface EquipmentReportData {
    equipmentList: any[];
    projectMap?: Record<number, string>;
    projectName?: string;
    stats?: {
        total?: number;
        available?: number;
        allocated?: number;
        maintenance?: number;
    };
}

export const generateEquipmentReportPDF = ({
    equipmentList,
    projectMap = {},
    projectName = "All Projects",
    stats
}: EquipmentReportData): void => {
    // Landscape A4 orientation (297mm x 210mm)
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const today = new Date().toISOString().split("T")[0];

    // ── Header Section ──
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(0, 0, 297, 24, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text("EQUIPMENT & ASSETS MASTER REPORT", 14, 15);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text(`Generated: ${today}  |  Project: ${projectName}`, 283, 15, { align: "right" });

    // ── Summary Stats Badges ──
    const totalCount = stats?.total ?? equipmentList.length;
    const availableCount = stats?.available ?? equipmentList.filter(e => (e.status || "").toUpperCase() === "AVAILABLE").length;
    const allocatedCount = stats?.allocated ?? equipmentList.filter(e => e.project_id || (e.status || "").toUpperCase().includes("PROJECT")).length;
    const maintCount = stats?.maintenance ?? equipmentList.filter(e => (e.status || "").toUpperCase().includes("MAINTENANCE")).length;

    let y = 32;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text("Summary Overview", 14, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
        `Total Assets: ${totalCount}   |   Available: ${availableCount}   |   Allocated: ${allocatedCount}   |   Under Maintenance: ${maintCount}`,
        14,
        y + 5
    );

    y += 10;

    // ── Data Transformation ──
    const tableBody = equipmentList.map((item, index) => {
        const srNo = String(index + 1);
        const code = item.equipment_code || `EQ-${item.id}`;
        const name = item.equipment_name || "—";
        const proj = item.project_id ? (projectMap[item.project_id] || `Project #${item.project_id}`) : "Global / Central Yard";
        const operator = item.operator_name || "—";
        const condition = (item.condition || "GOOD").toUpperCase();
        
        let status = (item.status || "AVAILABLE").replace(/_/g, " ").toUpperCase();
        if (status === "IN PROJECT") status = "In Project";
        else if (status === "INSPECTION PENDING") status = "Insp. Pending";
        else if (status === "MAINTENANCE") status = "Maintenance";
        else if (status === "AVAILABLE") status = "Available";
        else if (status === "RENTED") status = "Rented";
        else if (status === "DAMAGED") status = "Damaged";

        const hours = item.working_hours !== undefined ? `${Number(item.working_hours).toFixed(1)} hrs` : "0.0 hrs";
        const fuel = item.fuel_used !== undefined ? `${Number(item.fuel_used).toFixed(1)} L` : "0.0 L";

        let costStr = "—";
        if (item.rental_cost !== undefined && item.rental_cost !== null && item.rental_cost !== "") {
            const costVal = Number(item.rental_cost);
            costStr = `Rs. ${costVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        return [
            srNo,
            code,
            name,
            proj,
            operator,
            condition,
            status,
            hours,
            fuel,
            costStr
        ];
    });

    // ── Render AutoTable with Wide, Proportionate Columns ──
    autoTable(doc, {
        startY: y,
        head: [
            [
                "Sr. No.",
                "EQ Code",
                "Equipment Name",
                "Assigned Project",
                "Operator",
                "Condition",
                "Status",
                "Total Hours",
                "Total Fuel",
                "Rental Cost"
            ]
        ],
        body: tableBody,
        theme: "striped",
        headStyles: {
            fillColor: [37, 99, 235], // Primary blue
            textColor: 255,
            fontSize: 9,
            fontStyle: "bold",
            halign: "left",
            valign: "middle",
            cellPadding: 3
        },
        bodyStyles: {
            fontSize: 8.5,
            textColor: 51,
            valign: "middle",
            cellPadding: 2.5
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // slate-50
        },
        columnStyles: {
            0: { cellWidth: 16, halign: "center" },   // Sr. No. — 16mm width ensures two-digit numbers never wrap
            1: { cellWidth: 26, halign: "left" },     // EQ Code
            2: { cellWidth: 46, halign: "left" },     // Equipment Name
            3: { cellWidth: 38, halign: "left" },     // Project Name
            4: { cellWidth: 26, halign: "left" },     // Operator
            5: { cellWidth: 22, halign: "center" },   // Condition
            6: { cellWidth: 32, halign: "center" },   // Status — 32mm width ensures status never wraps mid-word
            7: { cellWidth: 20, halign: "right" },    // Total Hours
            8: { cellWidth: 20, halign: "right" },    // Total Fuel
            9: { cellWidth: 32, halign: "right" }     // Rental Cost — 32mm width ensures currency and amount stay together
        },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
            // Footer with page numbering
            const pageCount = (doc as any).internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184); // slate-400
            doc.text(
                `Page ${data.pageNumber} of ${pageCount}`,
                doc.internal.pageSize.width / 2,
                doc.internal.pageSize.height - 8,
                { align: "center" }
            );
            doc.text(
                "InfraPilot Enterprise Management",
                14,
                doc.internal.pageSize.height - 8
            );
        }
    });

    // Save PDF
    doc.save(`equipment_report_${today}.pdf`);
};

