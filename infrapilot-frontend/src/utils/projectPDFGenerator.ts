import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Project } from "../types/project";

/**
 * Generates and downloads a Master Projects Overview PDF.
 */
export const generateProjectListPDF = (projects: Project[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Colors & Styles
    const primaryColor: [number, number, number] = [37, 99, 235]; // #2563eb
    const secondaryColor: [number, number, number] = [71, 85, 105]; // #475569

    // --- Header ---
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 30, 45);
    doc.text("Master Projects Overview", 15, 20);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 28);
    doc.text(`Total Projects: ${projects.length}`, 15, 34);

    // --- Projects Table ---
    const tableData = projects.map(p => [
        p.project_name,
        `${p.start_date} - ${p.end_date}`,
        `${p.completion_percentage}%`,
        "92.4", // Static efficiency score as in UI
        p.status
    ]);

    autoTable(doc, {
        startY: 45,
        head: [['Site / Project', 'Dates', 'Progress', 'Efficiency', 'Health']],
        body: tableData,
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'left'
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [20, 30, 45]
        },
        columnStyles: {
            0: { fontStyle: 'bold' },
            2: { halign: 'center' },
            3: { halign: 'center' }
        }
    });

    // --- Footer ---
    const bottomY = doc.internal.pageSize.height - 15;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text("InfraPilot Construction Management Suite - Confidential Site Report", pageWidth / 2, bottomY, { align: "center" });

    // Download
    doc.save(`Master_Projects_Overview_${new Date().toISOString().split('T')[0]}.pdf`);
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
