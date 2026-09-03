import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Quotation } from "../types/quotation";
import type { CompanySettings } from "../types/settings";
import logo from "../assets/logo.png";
import { settingsService } from "../services/settingsService";

/**
 * Builds a jsPDF document for a Quotation / Estimate.
 */
export const buildQuotationPDFDoc = (quotation: Quotation | any, companySettings?: CompanySettings | null): jsPDF => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Colors & Styles
    const primaryColor: [number, number, number] = [37, 99, 235]; // #2563eb
    const secondaryColor: [number, number, number] = [71, 85, 105]; // #475569

    // --- Header Section ---
    try {
        const currentLogo = companySettings?.company_logo ? settingsService.resolveUrl(companySettings.company_logo) : logo;
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
    const statusLower = String(quotation?.status || "").toLowerCase();
    const isInvoice = statusLower === 'approved' || statusLower === 'converted';
    doc.text(isInvoice ? "INVOICE / QUOTATION" : "ESTIMATE / QUOTATION", pageWidth - 15, 25, { align: "right" });

    doc.setFontSize(12);
    const docNo = quotation?.quotation_no || quotation?.quotation_number || quotation?.entity_id_display || (quotation?.id ? `QT/2026/${String(quotation.id).padStart(4, '0')}` : 'QTN-001');
    doc.text(docNo, pageWidth - 15, 32, { align: "right" });

    // Divider
    doc.setDrawColor(240, 240, 240);
    doc.line(15, 45, pageWidth - 15, 45);

    // --- Details Grid ---
    // Left: Bill To
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("BILL TO / CLIENT:", 15, 55);

    doc.setFontSize(12);
    doc.setTextColor(20, 30, 45);
    const clientName = quotation?.client_name || quotation?.client?.name || quotation?.requested_by_name || "Valued Client";
    doc.text(clientName, 15, 62);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    const compName = quotation?.company_name || quotation?.company || "";
    const projName = quotation?.project_name || quotation?.project?.name || quotation?.remarks_details || "";
    if (compName) doc.text(compName, 15, 68);
    if (projName) doc.text(`Project: ${projName}`, 15, compName ? 74 : 68);

    // Right: Info
    const rightX = pageWidth - 70;
    doc.setFont("helvetica", "bold");
    doc.text("DATE:", rightX, 55);
    doc.setFont("helvetica", "normal");
    const dateVal = quotation?.created_at || quotation?.date || quotation?.quotation_date;
    doc.text(dateVal ? new Date(dateVal).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'), rightX + 25, 55);

    doc.setFont("helvetica", "bold");
    doc.text("STATUS:", rightX, 62);
    doc.setFont("helvetica", "normal");
    doc.text((quotation?.status || "Draft").toUpperCase(), rightX + 25, 62);

    // --- Items Table ---
    const tableData: any[] = [];

    // Combine all items
    const processItems = (items: any[], type: string, amountKey: string, rateKey = 'rate', qtyKey = 'quantity') => {
        if (!items || !Array.isArray(items) || items.length === 0) return;
        tableData.push([{ content: type.toUpperCase(), colSpan: 5, styles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' } }]);
        items.forEach(item => {
            let qty = item[qtyKey] || 1;
            if (type === 'Labour Forces') qty = (item.labour_count || 1) * (item.labour_days || 1);

            const amt = Number(item[amountKey] != null ? item[amountKey] : (Number(item[rateKey] || 0) * Number(qty || 1))) || 0;

            tableData.push([
                item.description || item.title || item.material_name || item.skill_type || item.expense_type || 'Item',
                qty,
                item.unit || '-',
                `INR ${Number(item[rateKey] || 0).toLocaleString('en-IN')}`,
                `INR ${amt.toLocaleString('en-IN')}`
            ]);
        });
    };

    const workItems = quotation?.items || quotation?.work_items || quotation?.quotation_items || [];
    const matItems = quotation?.material_items || quotation?.materials || [];
    const labItems = quotation?.labour_items || quotation?.labour || [];
    const extraItems = quotation?.extra_charge_items || quotation?.extra_charges || [];

    processItems(workItems, 'Construction Work', 'amount');
    processItems(matItems, 'Material Supply', 'estimated_amount', 'estimated_rate', 'estimated_quantity');
    processItems(labItems, 'Labour Forces', 'amount', 'daily_wage', 'labour_count');
    processItems(extraItems, 'Extra Charges', 'amount');

    if (tableData.length === 0) {
        const totalFallback = Number(quotation?.grand_total || quotation?.total_amount || quotation?.amount || 0);
        if (totalFallback > 0) {
            tableData.push([
                quotation?.remarks_details || quotation?.description || 'Quoted Scope of Work & Services',
                '1',
                'LS',
                `INR ${totalFallback.toLocaleString('en-IN')}`,
                `INR ${totalFallback.toLocaleString('en-IN')}`
            ]);
        } else {
            tableData.push(['Scope details as agreed', '1', 'LS', '—', '—']);
        }
    }

    autoTable(doc, {
        startY: 85,
        head: [['Description', 'Qty', 'Unit', 'Rate', 'Amount']],
        body: tableData,
        headStyles: {
            fillColor: primaryColor,
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold',
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [20, 30, 45],
        },
        columnStyles: {
            0: { cellWidth: 80 },
            1: { halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'right' },
            4: { halign: 'right' }
        }
    });

    // --- Summary Section ---
    const finalY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 10 : 160;
    const summaryX = pageWidth - 80;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

    let currentY = finalY;

    const addTotalLine = (label: string, value: number) => {
        if (!value) return;
        doc.text(label, summaryX, currentY);
        doc.setFont("helvetica", "normal");
        doc.text(`INR ${value.toLocaleString('en-IN')}`, pageWidth - 15, currentY, { align: "right" });
        doc.setFont("helvetica", "bold");
        currentY += 7;
    };

    const subtotal = Number(quotation?.subtotal || 0);
    const grandTotal = Number(quotation?.grand_total || quotation?.total_amount || quotation?.amount || subtotal || 0);

    if (subtotal > 0 && subtotal !== grandTotal) {
        addTotalLine("Subtotal:", subtotal);
    }
    if (quotation?.discount_amount && quotation.discount_amount > 0) {
        addTotalLine("Discount:", -quotation.discount_amount);
    }
    if (quotation?.cgst_amount && quotation.cgst_amount > 0) {
        addTotalLine(`CGST (${quotation.cgst_percent || 9}%):`, quotation.cgst_amount);
    }
    if (quotation?.sgst_amount && quotation.sgst_amount > 0) {
        addTotalLine(`SGST (${quotation.sgst_percent || 9}%):`, quotation.sgst_amount);
    }
    if (quotation?.gst_amount && quotation.gst_amount > 0 && !quotation.cgst_amount) {
        addTotalLine(`GST (${quotation.gst_percent || 18}%):`, quotation.gst_amount);
    }

    // Total Box
    currentY += 5;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(summaryX - 5, currentY - 8, 75, 12, "F");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("TOTAL :", summaryX, currentY);
    doc.text(`INR ${grandTotal.toLocaleString('en-IN')}`, pageWidth - 15, currentY, { align: "right" });

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
    doc.text(`This is a system-generated document from ${companySettings?.company_name || "InfraPilot Construction Management Suite"}.`, pageWidth / 2, bottomY + 10, { align: "center" });

    return doc;
};

/**
 * Returns a Blob of the generated PDF.
 */
export const generateQuotationPDFBlob = (quotation: Quotation | any, companySettings?: CompanySettings | null): Blob => {
    const doc = buildQuotationPDFDoc(quotation, companySettings);
    return doc.output('blob');
};

/**
 * Generates and triggers download of a Quotation PDF on the client side.
 */
export const generateQuotationPDF = (quotation: Quotation | any, companySettings?: CompanySettings | null) => {
    const doc = buildQuotationPDFDoc(quotation, companySettings);
    const docNo = quotation?.quotation_no || quotation?.quotation_number || quotation?.entity_id_display || (quotation?.id ? `QT/2026/${String(quotation.id).padStart(4, '0')}` : 'QTN-001');
    doc.save(`${String(docNo).replace(/[\/\s\\]+/g, '_')}.pdf`);
};
