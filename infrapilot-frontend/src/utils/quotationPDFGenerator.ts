import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Quotation } from "../types/quotation";
import logo from "../assets/logo.png";

/**
 * Generates and downloads a professional Quotation/Invoice PDF on the client side.
 */
export const generateQuotationPDF = (quotation: Quotation) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Colors & Styles
    const primaryColor: [number, number, number] = [37, 99, 235]; // #2563eb
    const secondaryColor: [number, number, number] = [71, 85, 105]; // #475569

    // --- Header Section ---
    try {
        doc.addImage(logo, 'PNG', 15, 12, 18, 18);
    } catch (e) {
        console.warn("Could not load logo image for PDF", e);
    }

    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("InfraPilot", 38, 22);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    doc.text("Advanced Construction Management", 38, 28);

    // Invoice Title & ID
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(20, 30, 45); // Dark text
    const isInvoice = quotation.status === 'approved' || quotation.status === 'converted';
    doc.text(isInvoice ? "INVOICE" : "ESTIMATE", pageWidth - 15, 25, { align: "right" });

    doc.setFontSize(12);
    const docNo = quotation.quotation_no || `QTN-${String(quotation.id).padStart(3, '0')}`;
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
    doc.text(quotation.client_name || "Unknown", 15, 62);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    if (quotation.company_name) doc.text(quotation.company_name, 15, 68);
    if (quotation.project_name) doc.text(`Project: ${quotation.project_name}`, 15, quotation.company_name ? 74 : 68);

    // Right: Info
    const rightX = pageWidth - 70;
    doc.setFont("helvetica", "bold");
    doc.text("DATE:", rightX, 55);
    doc.setFont("helvetica", "normal");
    doc.text(quotation.created_at ? new Date(quotation.created_at).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB'), rightX + 25, 55);

    doc.setFont("helvetica", "bold");
    doc.text("STATUS:", rightX, 62);
    doc.setFont("helvetica", "normal");
    doc.text((quotation.status || "Draft").toUpperCase(), rightX + 25, 62);

    // --- Items Table ---
    const tableData: any[] = [];

    // Combine all items
    const processItems = (items: any[], type: string, amountKey: string, rateKey = 'rate', qtyKey = 'quantity') => {
        if (!items || items.length === 0) return;
        tableData.push([{ content: type.toUpperCase(), colSpan: 5, styles: { fillColor: [248, 250, 252], textColor: [15, 23, 42], fontStyle: 'bold' } }]);
        items.forEach(item => {
            let qty = item[qtyKey] || 1;
            if (type === 'Labour Forces') qty = (item.labour_count || 1) * (item.labour_days || 1);

            tableData.push([
                item.description || item.title || item.material_name || item.skill_type || item.expense_type,
                qty,
                item.unit || '-',
                `INR ${Number(item[rateKey] || 0).toLocaleString('en-IN')}`,
                `INR ${Number(item[amountKey] || 0).toLocaleString('en-IN')}`
            ]);
        });
    };

    processItems(quotation.items, 'Construction Work', 'amount');
    processItems(quotation.material_items, 'Material Supply', 'estimated_amount', 'estimated_rate', 'estimated_quantity');
    processItems(quotation.labour_items, 'Labour Forces', 'amount', 'daily_wage', 'labour_count');
    processItems(quotation.extra_charge_items, 'Extra Charges', 'amount');

    if (tableData.length === 0) {
        tableData.push(['No items added', '-', '-', '-', '-']);
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
    const finalY = (doc as any).lastAutoTable.finalY + 10;
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

    addTotalLine("Subtotal:", quotation.subtotal || 0);
    if (quotation.discount_amount && quotation.discount_amount > 0) {
        addTotalLine("Discount:", -quotation.discount_amount);
    }
    if (quotation.cgst_amount && quotation.cgst_amount > 0) {
        addTotalLine(`CGST (${quotation.cgst_percent}%):`, quotation.cgst_amount);
    }
    if (quotation.sgst_amount && quotation.sgst_amount > 0) {
        addTotalLine(`SGST (${quotation.sgst_percent}%):`, quotation.sgst_amount);
    }

    // Total Box
    currentY += 5;
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(summaryX - 5, currentY - 8, 75, 12, "F");

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("TOTAL :", summaryX, currentY);
    doc.text(`INR ${(quotation.grand_total || 0).toLocaleString('en-IN')}`, pageWidth - 15, currentY, { align: "right" });

    // --- Footer ---
    const bottomY = doc.internal.pageSize.height - 20;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text("This is a system-generated document from the InfraPilot Construction Management Suite.", pageWidth / 2, bottomY, { align: "center" });

    // Download
    doc.save(`${docNo.replace(/\s+/g, '_')}.pdf`);
};
