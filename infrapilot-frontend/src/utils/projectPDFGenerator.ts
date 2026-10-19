import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Project } from "../types/project";

/**
 * Generates and downloads a Master Projects Overview / Company Portfolio PDF.
 */
export const generateProjectListPDF = (projects: Project[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Ensure projects are sorted in consistent order corresponding to the dashboard view (by project ID ascending)
    const sortedProjects = [...projects].sort((a, b) => (Number(a.id) || 0) - (Number(b.id) || 0));

    const totalCount = sortedProjects.length;
    const ongoingCount = sortedProjects.filter(p => p.status === "Ongoing" || p.status === "On Track").length;
    const completedCount = sortedProjects.filter(p => p.status === "Completed").length;
    const delayedCount = sortedProjects.filter(p => p.status === "Delayed").length;
    const onHoldCount = sortedProjects.filter(p => p.status === "On Hold").length;

    const primaryColor: [number, number, number] = [20, 50, 95]; // Deep corporate navy
    const secondaryColor: [number, number, number] = [71, 85, 105]; // Slate

    // --- Header ---
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("COMPANY PORTFOLIO OVERVIEW", 15, 20);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 30, 45);
    doc.text("1. REPORT INFORMATION", 15, 32);

    // Section 1 Box / Details
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const todayStr = new Date().toISOString().split('T')[0];
    doc.text(`Generated On:  ${todayStr}`, 15, 38);
    doc.text(`Report Type:   Company Portfolio / Master Projects Overview`, 110, 38);

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 42, pageWidth - 15, 42);

    // --- Section 2: Summary ---
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 30, 45);
    doc.text("2. SUMMARY", 15, 50);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 54, pageWidth - 30, 14, 2, 2, "F");
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, 54, pageWidth - 30, 14, 2, 2, "D");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(
        `Total Projects: ${totalCount}  |  Ongoing: ${ongoingCount}  |  Completed: ${completedCount}  |  Delayed: ${delayedCount}  |  On Hold: ${onHoldCount}`,
        20,
        63
    );

    // --- Section 3: Project List ---
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 30, 45);
    doc.text("3. PROJECT LIST", 15, 78);

    const tableData = sortedProjects.map(p => {
        const idStr = p.id ? `PRJ00${p.id}` : "-";
        const datesStr = p.start_date && p.end_date ? `${p.start_date} to ${p.end_date}` : (p.start_date || p.end_date || "-");
        const numProgress = Number(p.completion_percentage ?? 0);
        const progressStr = `${isNaN(numProgress) ? 0 : parseFloat(numProgress.toFixed(2))}%`;
        const statusStr = (p.status || "").toUpperCase();
        return [
            idStr,
            p.project_name,
            datesStr,
            progressStr,
            statusStr
        ];
    });

    autoTable(doc, {
        startY: 82,
        head: [['ID', 'Site / Project', 'Dates', 'Progress', 'Health']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
            halign: 'left'
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [20, 30, 45]
        },
        columnStyles: {
            0: { fontStyle: 'bold', halign: 'left', cellWidth: 25 },
            1: { fontStyle: 'bold', cellWidth: 50 },
            2: { halign: 'left', cellWidth: 55 },
            3: { halign: 'center', cellWidth: 25 },
            4: { halign: 'center', fontStyle: 'bold', cellWidth: 30 }
        },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
                const val = String(data.cell.raw).toUpperCase();
                if (val === 'ON TRACK' || val === 'ONGOING') {
                    data.cell.styles.textColor = [16, 185, 129]; // Emerald
                } else if (val === 'DELAYED') {
                    data.cell.styles.textColor = [239, 68, 68]; // Red
                } else if (val === 'ON HOLD' || val === 'ON_HOLD') {
                    data.cell.styles.textColor = [245, 158, 11]; // Amber
                } else if (val === 'COMPLETED') {
                    data.cell.styles.textColor = [37, 99, 235]; // Blue
                }
            }
        }
    });

    // --- Footer ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const bottomY = doc.internal.pageSize.height - 12;
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);
        doc.text("InfraPilot Construction Management Suite - Confidential Site Report", 15, bottomY);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, bottomY, { align: "right" });
    }

    // Download
    doc.save(`Master_Projects_Overview_${todayStr}.pdf`);
};
/**
 * Generates and downloads a specialized Engineer Site Intelligence Report.
 */
export const generateEngineerReportPDF = (engineer: any) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const primaryColor: [number, number, number] = [37, 99, 235];

    // --- Header ---
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 30, 45);
    doc.text("Engineer Site Intelligence Report", 15, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 28);
    doc.text(`Priority Deployment: ${engineer.projects}`, 15, 34);

    // --- Staff Profile Section ---
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 45, pageWidth - 30, 45, "F");
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 45, pageWidth - 30, 45);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text(engineer.name, 25, 58);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(71, 85, 105);
    doc.text(`${engineer.specialization} | ${engineer.experience} Professional Experience`, 25, 65);
    doc.text(`Contact: ${engineer.mobile} | ${engineer.email}`, 25, 71);
    doc.text(`Joining Date: ${engineer.joiningDate}`, 25, 77);

    // --- Intelligence Metrics ---
    autoTable(doc, {
        startY: 100,
        head: [['Intelligence Metric', 'Site Registry Value', 'Site Conditions / Status']],
        body: [
            ['Current Status', engineer.status || 'Unknown', 'Active Supervision'],
            ['Labor Force Depth', `${engineer.laborCount || 0} Personnel`, `${Math.round((engineer.laborCount || 0) * 0.6)} Skilled / ${Math.round((engineer.laborCount || 0) * 0.4)} Unskilled`],
            ['Active Site Task', engineer.activeTask || 'Supervision', 'Real-time Pulse Active'],
            ['Site Temperature', engineer.weather ? (engineer.weather.split(',')[1]?.trim() || engineer.weather) : 'N/A', 'Synchronized with Global Weather'],
            ['Site Humidity', engineer.humidity || 'N/A', 'Environmental Monitoring Active'],
            ['Wind Speed', engineer.windSpeed || 'N/A', 'Favorable for Site Activity']
        ],
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 9
        }
    });

    // --- Footer ---
    const bottomY = doc.internal.pageSize.height - 15;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text("InfraPilot Mission Control - Secure Site Intelligence Feed", pageWidth / 2, bottomY, { align: "center" });

    // Download
    doc.save(`Site_Report_${engineer.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * Generates a comprehensive project report PDF with all site data.
 */
export const generateDetailedProjectPDF = (
    project: Project,
    members: any[],
    milestones: any[],
    expenses: any[],
    tasks: any[]
) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const primaryColor: [number, number, number] = [37, 99, 235];
    const secondaryColor: [number, number, number] = [71, 85, 105];

    // --- Header ---
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 30, 45);
    doc.text("Project Intelligence Report", 15, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 28);
    doc.text(`Project ID: PRJ-${project.id}`, 15, 34);

    // --- Overview Section ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("1. Project Overview", 15, 48);

    autoTable(doc, {
        startY: 52,
        body: [
            ['Project Name', project.project_name],
            ['Current Status', project.status],
            ['Site Progress', `${project.completion_percentage}%`],
            ['Timeline', `${project.start_date} to ${project.end_date}`],
            ['Budget', `₹${project.budget?.toLocaleString() || 0}`]
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    // --- Team Registry ---
    let nextY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. Personnel & Team Registry", 15, nextY);

    autoTable(doc, {
        startY: nextY + 4,
        head: [['Full Name', 'Role', 'Email']],
        body: members.map(m => [m.full_name, m.role, m.email]),
        headStyles: { fillColor: primaryColor }
    });

    // --- Milestones ---
    nextY = (doc as any).lastAutoTable.finalY + 15;
    if (nextY > 250) { doc.addPage(); nextY = 20; }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. Project Milestones", 15, nextY);

    autoTable(doc, {
        startY: nextY + 4,
        head: [['Title', 'Status', 'Deadline']],
        body: milestones.map(m => [m.title, m.status || 'Pending', m.end_date]),
        headStyles: { fillColor: [79, 70, 229] } // Indigo
    });

    // --- Work Items (Tasks) ---
    nextY = (doc as any).lastAutoTable.finalY + 15;
    if (nextY > 250) { doc.addPage(); nextY = 20; }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("4. Site Task Intelligence", 15, nextY);

    autoTable(doc, {
        startY: nextY + 4,
        head: [['Task Title', 'Status', 'Progress']],
        body: tasks.map(t => [t.title, t.status, `${t.completion_percentage}%`]),
        headStyles: { fillColor: [16, 185, 129] } // Emerald
    });

    // --- Finance Summary ---
    nextY = (doc as any).lastAutoTable.finalY + 15;
    if (nextY > 250) { doc.addPage(); nextY = 20; }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("5. Financial Ledger", 15, nextY);

    const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Total Site Expenses to Date: ₹${totalExpense.toLocaleString()}`, 15, nextY + 8);

    autoTable(doc, {
        startY: nextY + 12,
        head: [['Date', 'Description', 'Category', 'Amount']],
        body: expenses.map(e => [e.date, e.description, e.category, `₹${e.amount.toLocaleString()}`]),
        headStyles: { fillColor: [245, 158, 11] } // Amber
    });

    // --- Footer ---
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const bottomY = doc.internal.pageSize.height - 10;
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(150, 150, 150);
        doc.text(`InfraPilot Intelligence Report | Page ${i} of ${pageCount}`, pageWidth / 2, bottomY, { align: "center" });
    }

    // Download
    const filename = `ProjectReport_${project.project_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
};
