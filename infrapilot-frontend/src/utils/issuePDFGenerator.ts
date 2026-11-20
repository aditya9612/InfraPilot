import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { IssueItem } from "../types/issue";
import logo from "../assets/logo.png";

export interface IssuePDFOptions {
    issues: IssueItem[];
    projectName?: string;
    filters?: {
        status?: string | null;
        priority?: string | null;
        start_date?: string | null;
        end_date?: string | null;
    };
    members?: any[];
}

export const generateIssueReportPDF = ({
    issues,
    projectName = "All Projects",
    filters,
    members = []
}: IssuePDFOptions): jsPDF => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const today = new Date().toISOString().split("T")[0];

    // Filter issues as per supplied filter parameters
    let filtered = [...issues];
    if (filters?.start_date) {
        filtered = filtered.filter(i => (i.reported_date || "") >= filters.start_date!);
    }
    if (filters?.end_date) {
        filtered = filtered.filter(i => (i.reported_date || "") <= filters.end_date!);
    }
    if (filters?.status) {
        const s = filters.status.toLowerCase();
        filtered = filtered.filter(i => (i.status || "").toLowerCase().includes(s));
    }
    if (filters?.priority) {
        const p = filters.priority.toLowerCase();
        filtered = filtered.filter(i => (i.priority || "").toLowerCase() === p);
    }

    // Accurate calculation of metrics
    const totalCount = filtered.length;
    const openCount = filtered.filter(i => {
        const s = (i.status || "").toLowerCase();
        return s === "open" || s === "in progress" || s.includes("open") || s.includes("progress");
    }).length;
    const closedCount = filtered.filter(i => {
        const s = (i.status || "").toLowerCase();
        return s === "closed" || s === "resolved" || s.includes("close") || s.includes("resolv");
    }).length;
    const highPriorityCount = filtered.filter(i => {
        const p = (i.priority || "").toLowerCase();
        return p === "high";
    }).length;

    const primaryColor: [number, number, number] = [20, 50, 95]; // Deep corporate navy
    const slateColor: [number, number, number] = [71, 85, 105];

    // ── Logo & Title Header ──
    try {
        if (logo) {
            doc.addImage(logo, "PNG", 14, 10, 24, 24);
        }
    } catch {
        // Continue if logo fails
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("Executive Site Issues Report", 44, 24);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
    doc.text("Detailed Analysis of Site Constraints, Delays & Resolution Status", 44, 30);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 36, 196, 36);

    let y = 43;

    // ── 1. REPORT INFORMATION ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("1. REPORT INFORMATION", 14, y);
    y += 5;

    autoTable(doc, {
        startY: y,
        head: [],
        body: [
            ["Generated", today],
            ["Project", projectName],
            ...(filters?.start_date && filters?.end_date ? [["Date Range", `${filters.start_date} to ${filters.end_date}`]] : [])
        ],
        theme: "plain",
        styles: { fontSize: 9, cellPadding: 2 },
        columnStyles: {
            0: { fontStyle: "bold", textColor: primaryColor, cellWidth: 35 },
            1: { textColor: slateColor, cellWidth: 140 }
        },
        margin: { left: 14, right: 14 }
    });

    y = (doc as any).lastAutoTable.finalY + 8;

    // ── 2. SUMMARY ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("2. SUMMARY", 14, y);
    y += 4;

    const boxStartY = y;
    const boxWidth = 182;
    const boxHeight = 28;

    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.6);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, boxStartY, boxWidth, boxHeight, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);

    doc.text(`Total Issues: ${totalCount}`, 18, boxStartY + 7);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Open/In-Progress: ${openCount}`, 18, boxStartY + 13);
    doc.text(`Resolved/Closed: ${closedCount}`, 18, boxStartY + 19);
    doc.text(`High Priority: ${highPriorityCount}`, 18, boxStartY + 25);

    y = boxStartY + boxHeight + 8;

    // ── 3. ISSUE DETAILS ──
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("3. ISSUE DETAILS", 14, y);
    y += 4;

    const tableData = filtered.map((issue) => {
        const idStr = issue.business_id || `ISS${String(issue.id).padStart(3, "0")}`;
        const dateStr = issue.reported_date || "-";
        const catStr = issue.category || "-";
        const titleStr = issue.title || "-";
        const prioStr = (issue.priority || "MEDIUM").toUpperCase();
        const statusStr = (issue.status || "OPEN").toUpperCase();
        let assignedStr = "Unassigned";
        if (issue.assigned_to) {
            const member = members.find((m: any) => Number(m.user_id || m.id) === Number(issue.assigned_to));
            assignedStr = member?.full_name || member?.name || `User #${issue.assigned_to}`;
        }
        return [idStr, dateStr, projectName, catStr, titleStr, prioStr, statusStr, assignedStr];
    });

    autoTable(doc, {
        startY: y,
        head: [["ID", "Date", "Project", "Category", "Title", "Priority", "Status", "Assigned To"]],
        body: tableData.length > 0 ? tableData : [["-", "-", projectName, "-", "No issues matching filter criteria", "-", "-", "-"]],
        theme: "striped",
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 8,
            fontStyle: "bold",
            halign: "left"
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59]
        },
        columnStyles: {
            0: { fontStyle: "bold", cellWidth: 16 },
            1: { cellWidth: 20 },
            2: { cellWidth: 25 },
            3: { cellWidth: 18 },
            4: { cellWidth: 42 },
            5: { halign: "center", cellWidth: 18, fontStyle: "bold" },
            6: { halign: "center", cellWidth: 20, fontStyle: "bold" },
            7: { cellWidth: 23 }
        },
        didParseCell: (data) => {
            if (data.section === "body" && data.column.index === 5) {
                const val = String(data.cell.raw).toUpperCase();
                if (val === "HIGH" || val === "CRITICAL") {
                    data.cell.styles.textColor = [225, 29, 72]; // Rose-600
                } else if (val === "MEDIUM") {
                    data.cell.styles.textColor = [217, 119, 6]; // Amber-600
                } else if (val === "LOW") {
                    data.cell.styles.textColor = [16, 185, 129]; // Emerald-600
                }
            }
            if (data.section === "body" && data.column.index === 6) {
                const val = String(data.cell.raw).toUpperCase();
                if (val === "CLOSED" || val === "RESOLVED") {
                    data.cell.styles.textColor = [16, 185, 129]; // Emerald-600
                } else {
                    data.cell.styles.textColor = [225, 29, 72]; // Rose-600
                }
            }
        },
        margin: { left: 14, right: 14 }
    });

    // ── Footer / Page Numbers ──
    const pageCount = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(148, 163, 184);
        doc.text(
            `Executive Site Issues Report  |  Page ${i} of ${pageCount}`,
            14,
            290
        );
        doc.text(
            "Confidential  |  InfraPilot Construction Management",
            196,
            290,
            { align: "right" }
        );
    }

    return doc;
};
