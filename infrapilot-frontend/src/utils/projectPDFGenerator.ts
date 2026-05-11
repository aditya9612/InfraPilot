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
            ['Current Status', engineer.status, 'Active Supervision'],
            ['Labor Force Depth', `${engineer.laborCount} Personnel`, `${Math.round(engineer.laborCount * 0.6)} Skilled / ${Math.round(engineer.laborCount * 0.4)} Unskilled`],
            ['Active Site Task', engineer.activeTask, 'Real-time Pulse Active'],
            ['Site Temperature', engineer.weather.split(',')[1].trim(), 'Synchronized with Global Weather'],
            ['Site Humidity', engineer.humidity, 'Environmental Monitoring Active'],
            ['Wind Speed', engineer.windSpeed, 'Favorable for Site Activity']
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
