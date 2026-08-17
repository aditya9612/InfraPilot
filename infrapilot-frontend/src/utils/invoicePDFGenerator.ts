import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Invoice } from "../types/invoice";
import type { Project } from "../types/project";
import type { CompanySettings } from "../types/settings";
import logo from "../assets/logo.png";
import { settingsService } from "../services/settingsService";

/**
 * Generates and downloads a professional Invoice PDF on the client side.
 */
export const generateInvoicePDF = (invoice: Invoice, project?: Project, companySettings?: CompanySettings | null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Colors & Styles
  const primaryColor: [number, number, number] = [37, 99, 235]; // #2563eb
  const secondaryColor: [number, number, number] = [71, 85, 105]; // #475569

  // --- Header Section ---
  // Logo Image
  const currentLogo = companySettings?.company_logo ? settingsService.resolveUrl(companySettings.company_logo) : logo;
  try {
    if (currentLogo) {
      doc.addImage(currentLogo, 'PNG', 15, 12, 18, 18);
    }
  } catch (e) {
    console.warn("Could not load logo image for PDF", e);
  }

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(companySettings?.company_name || "InfraPilot", 38, 22);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("Advanced Construction Management", 38, 28);

  if (companySettings?.address) {
    doc.setFontSize(7);
    const splitAddr = doc.splitTextToSize(companySettings.address, 80);
    doc.text(splitAddr, 15, 38);
  }

  // Invoice Title & ID
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(20, 30, 45); // Dark text
  doc.text("INVOICE", pageWidth - 15, 25, { align: "right" });

  doc.setFontSize(12);
  doc.text(`INV-${String(invoice.id).padStart(3, '0')}`, pageWidth - 15, 32, { align: "right" });

  // Divider
  doc.setDrawColor(240, 240, 240);
  doc.line(15, 45, pageWidth - 15, 45);

  // --- Details Grid ---
  // Left: Bill To
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text("BILL TO / PROJECT:", 15, 55);

  doc.setFontSize(12);
  doc.setTextColor(20, 30, 45);
  doc.text(project?.project_name || "N/A", 15, 62);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
  doc.text(`ID: PRJ-${invoice.project_id}`, 15, 68);
  if (invoice.description) {
    const splitDescription = doc.splitTextToSize(invoice.description, 80);
    doc.text(splitDescription, 15, 75);
  }

  // Right: Invoice Info
  const rightX = pageWidth - 60;
  doc.setFont("helvetica", "bold");
  doc.text("ISSUE DATE:", rightX, 55);
  doc.setFont("helvetica", "normal");
  doc.text(new Date(invoice.created_at).toLocaleDateString('en-GB'), rightX + 30, 55);

  doc.setFont("helvetica", "bold");
  doc.text("STATUS:", rightX, 62);
  doc.setFont("helvetica", "normal");
  doc.text(invoice.status.toUpperCase(), rightX + 30, 62);

  doc.setFont("helvetica", "bold");
  doc.text("REL. ID:", rightX, 69);
  doc.setFont("helvetica", "normal");
  doc.text(`#REF-${invoice.reference_id}`, rightX + 30, 69);

  // --- Financial Table ---
  autoTable(doc, {
    startY: 95,
    head: [['Description', 'Base Amount', 'GST (%)', 'Tax (%)', 'Total']],
    body: [
      [
        `${invoice.type.toUpperCase()} - ${invoice.description || 'Service Rendered'}`,
        `INR ${invoice.amount.toLocaleString('en-IN')}`,
        `${invoice.gst_percent}%`,
        `${invoice.tax_percent}%`,
        `INR ${invoice.total_amount.toLocaleString('en-IN')}`
      ]
    ],
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [20, 30, 45],
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 80 }
    }
  });

  // --- Summary Section ---
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const summaryX = pageWidth - 80;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

  doc.text("Subtotal:", summaryX, finalY);
  doc.setFont("helvetica", "normal");
  doc.text(`INR ${invoice.amount.toLocaleString('en-IN')}`, pageWidth - 15, finalY, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text(`GST (${invoice.gst_percent}%):`, summaryX, finalY + 7);
  doc.setFont("helvetica", "normal");
  doc.text(`INR ${invoice.gst_amount.toLocaleString('en-IN')}`, pageWidth - 15, finalY + 7, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.text(`TDS (${invoice.tax_percent}%):`, summaryX, finalY + 14);
  doc.setFont("helvetica", "normal");
  doc.text(`INR ${invoice.tax_amount.toLocaleString('en-IN')}`, pageWidth - 15, finalY + 14, { align: "right" });

  // Total Box
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(summaryX - 5, finalY + 20, 75, 12, "F");

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("TOTAL :", summaryX, finalY + 28);
  doc.text(`INR ${invoice.total_amount.toLocaleString('en-IN')}`, pageWidth - 15, finalY + 28, { align: "right" });

  // --- Footer ---
  const bottomY = doc.internal.pageSize.height - 30;

  if (companySettings?.signature_image) {
    try {
      const sigUrl = settingsService.resolveUrl(companySettings.signature_image);
      if (sigUrl) {
        doc.addImage(sigUrl, 'PNG', pageWidth - 50, bottomY - 15, 35, 12);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        doc.text("Authorized Signatory", pageWidth - 32.5, bottomY - 2, { align: "center" });
      }
    } catch (e) {
      console.warn("Could not add signature to PDF", e);
    }
  }

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(150, 150, 150);
  doc.text(`This is a system-generated invoice from ${companySettings?.company_name || "InfraPilot Construction Management Suite"}.`, pageWidth / 2, bottomY + 10, { align: "center" });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, bottomY + 15, { align: "center" });

  // Download
  doc.save(`Invoice_INV-${String(invoice.id).padStart(3, '0')}.pdf`);
};

/**
 * Generates and downloads a consolidated Client Invoices Statement & Report PDF.
 */
export const generateInvoicesReportPDF = (
  invoices: Invoice[],
  projects: Project[],
  stats?: { totalCount: number; totalBilled: number; totalPaid: number; totalPending: number },
  companySettings?: CompanySettings | null
) => {
  const doc = new jsPDF({ orientation: "landscape" });
  const pageWidth = doc.internal.pageSize.width;
  const dateStr = new Date().toISOString().split("T")[0];

  const primaryColor: [number, number, number] = [37, 99, 235]; // #2563eb
  const darkColor: [number, number, number] = [15, 23, 42]; // #0f172a
  const slateColor: [number, number, number] = [100, 116, 139]; // #64748b

  // Header Section
  const currentLogo = companySettings?.company_logo ? settingsService.resolveUrl(companySettings.company_logo) : logo;
  try {
    if (currentLogo) {
      doc.addImage(currentLogo, 'PNG', 14, 10, 14, 14);
    }
  } catch (e) {
    console.warn("Could not load logo image for PDF", e);
  }

  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(companySettings?.company_name || "InfraPilot", 32, 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.text("Client Invoices Statement & Billing Summary", 32, 24);

  // Date on right
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text(`Statement Date: ${dateStr}`, pageWidth - 14, 18, { align: "right" });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 28, pageWidth - 14, 28);

  let y = 34;

  // Summary Metrics Bar
  if (stats) {
    autoTable(doc, {
      startY: y,
      head: [["Total Invoices", "Total Billed", "Paid Amount", "Pending Amount"]],
      body: [[
        String(stats.totalCount),
        `INR ${stats.totalBilled.toLocaleString("en-IN")}`,
        `INR ${stats.totalPaid.toLocaleString("en-IN")}`,
        `INR ${stats.totalPending.toLocaleString("en-IN")}`,
      ]],
      headStyles: { fillColor: primaryColor, fontSize: 8, fontStyle: "bold", halign: "center" },
      bodyStyles: { fontSize: 9, halign: "center", fontStyle: "bold", textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Invoice Table
  const tableData = invoices.map((inv) => {
    const proj = projects.find((p) => p.id === inv.project_id);
    return [
      `INV-${String(inv.id).padStart(3, "0")}`,
      proj?.name || `Project #${inv.project_id}`,
      inv.created_at ? inv.created_at.split("T")[0] : "—",
      inv.due_date || "—",
      inv.description || `${inv.type?.toUpperCase() || "Service"} billing`,
      `INR ${Number(inv.total_amount || 0).toLocaleString("en-IN")}`,
      (inv.status || "PENDING").toUpperCase(),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [["Invoice No", "Project", "Issue Date", "Due Date", "Description", "Amount", "Status"]],
    body: tableData,
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 28 },
      1: { cellWidth: 45 },
      2: { cellWidth: 25 },
      3: { cellWidth: 25 },
      4: { cellWidth: 70 },
      5: { halign: "right", fontStyle: "bold", cellWidth: 35 },
      6: { halign: "center", cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Page ${i} of ${pageCount}  •  Client Invoices Report  •  InfraPilot`,
      pageWidth / 2,
      doc.internal.pageSize.height - 8,
      { align: "center" }
    );
  }

  doc.save(`Client_Invoices_${dateStr}.pdf`);
};

