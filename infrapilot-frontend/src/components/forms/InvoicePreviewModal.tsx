import React from "react";
import Modal from "../common/Modal";
import { Printer, QrCode, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/logo.png";

interface InvoicePreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
}

const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
    isOpen,
    onClose,
    data,
}) => {
    if (!data) return null;

    // Shared helper: builds the complete invoice PDF and returns the jsPDF instance
    const buildInvoicePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Styles
        const slate900: [number, number, number] = [15, 23, 42];
        const slate500: [number, number, number] = [100, 116, 139];
        const slate100: [number, number, number] = [241, 245, 249];

        // 1. Header
        try {
            doc.addImage(logo, 'PNG', 15, 12, 20, 20);
        } catch (e) {
            console.warn("Logo not found", e);
        }

        doc.setFontSize(24);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(slate900[0], slate900[1], slate900[2]);
        doc.text("INFRAPILOT", 38, 22);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(slate500[0], slate500[1], slate500[2]);
        doc.text("CONSTRUCTION & INFRASTRUCTURE", 38, 28);

        // Tax Invoice Box
        doc.setDrawColor(slate900[0], slate900[1], slate900[2]);
        doc.setLineWidth(0.6);
        doc.rect(pageWidth - 75, 12, 60, 12);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(slate900[0], slate900[1], slate900[2]);
        doc.text("TAX INVOICE", pageWidth - 45, 20, { align: "center" });

        doc.setFontSize(7);
        doc.setTextColor(slate500[0], slate500[1], slate500[2]);
        doc.text(`GSTIN: 27AAACL6442L1ZA`, pageWidth - 45, 27, { align: "center" });
        doc.text(`CIN: L26940MH2000PLC128420`, pageWidth - 45, 31, { align: "center" });

        // Address info
        doc.setFontSize(7);
        doc.setTextColor(slate500[0], slate500[1], slate500[2]);
        doc.text("Unit Address: 123, Business Hub, MG Road, Indore, MP - 452001", 15, 38);
        doc.text("Registered Office: B-wing, 2nd floor, Ahura Centre, Mahakali Caves Road, Andheri (E), Mumbai - 400093", 15, 42);

        // 2. Metadata Tables (2 columns)
        autoTable(doc, {
            startY: 48,
            head: [['RECIPIENT DETAILS', 'INVOICE INFO']],
            body: [[{
                content: `Name: ${data.clientName || 'N/A'}\nAddress: ${data.clientAddress || 'N/A'}\nGSTIN: ${data.clientGst || 'N/A'}`,
                styles: { fontSize: 8, fontStyle: 'normal' }
            }, {
                content: `Invoice No: ${data.invoiceNo || 'N/A'}\nDate: ${data.date || new Date().toLocaleDateString()}\nProject Code: PRJ-2024-05\nPlace of Supply: MADHYA PRADESH`,
                styles: { fontSize: 8, fontStyle: 'normal' }
            }]],
            theme: 'grid',
            headStyles: { fillColor: slate100, textColor: slate500, fontSize: 8, fontStyle: 'bold' },
            styles: { cellPadding: 4 }
        });

        // 3. Items Table
        const tableRows: any[] = [];
        const addSection = (title: string, items: any[], mapper: (item: any) => any[]) => {
            if (!items || items.length === 0) return;
            tableRows.push([{ content: title, colSpan: 5, styles: { fillColor: slate100, textColor: slate900, fontStyle: 'bold', fontSize: 7 } }]);
            items.forEach((item) => tableRows.push(mapper(item)));
        };

        addSection('CONSTRUCTION WORK', data.items, (item) => [item.description || item.title, item.quantity, item.unit, item.rate?.toLocaleString(), item.amount?.toLocaleString()]);
        addSection('MATERIAL SUPPLY', data.materialItems, (item) => [item.material_name, item.estimated_quantity, item.unit, item.estimated_rate?.toLocaleString(), item.estimated_amount?.toLocaleString()]);
        addSection('LABOUR FORCES', data.labourItems, (item) => [item.skill_type, (item.labour_count * (item.labour_days || 1)), 'Man-days', item.daily_wage?.toLocaleString(), item.amount?.toLocaleString()]);
        addSection('EXTRA CHARGES & EQUIPMENT', data.extraChargeItems, (item) => [item.description, item.quantity, '-', item.rate?.toLocaleString(), item.amount?.toLocaleString()]);

        autoTable(doc, {
            startY: (doc as any).lastAutoTable.finalY + 6,
            head: [['DESCRIPTION', 'QTY', 'UNIT', 'RATE (INR)', 'BASIC VALUE (INR)']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: slate900, fontSize: 8, fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 8, cellPadding: 2.5 },
            columnStyles: {
                0: { cellWidth: 85 },
                1: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right', fontStyle: 'bold' }
            }
        });

        // Total Basic Value row
        let currentY = (doc as any).lastAutoTable.finalY;
        doc.setDrawColor(slate900[0], slate900[1], slate900[2]);
        doc.setLineWidth(0.4);
        doc.line(15, currentY, pageWidth - 15, currentY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("TOTAL BASIC VALUE", pageWidth - 45, currentY + 6, { align: "right" });
        doc.text(`INR ${data.subTotal?.toLocaleString()}`, pageWidth - 15, currentY + 6, { align: "right" });
        currentY += 12;

        // 4. Summary (Words & Remarks vs Tax Breakdown)
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);

        // Left Column: Words & Remark
        doc.setFontSize(7);
        doc.setTextColor(slate500[0], slate500[1], slate500[2]);
        doc.text("TOTAL AMOUNT IN WORDS:", 15, currentY);
        doc.setTextColor(slate900[0], slate900[1], slate900[2]);
        doc.setFont("helvetica", "bold");
        doc.text(`INR ${toWords(data.grandTotal)}`, 15, currentY + 4, { maxWidth: 80 });

        doc.rect(15, currentY + 12, 80, 15);
        doc.setFontSize(7);
        doc.setTextColor(slate900[0], slate900[1], slate900[2]);
        doc.text("REMARK:", 18, currentY + 17);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6);
        doc.text("Material provided as per delivery challan. No breakage responsibility after site delivery.", 18, currentY + 20, { maxWidth: 74 });

        // Right Column: Tax Breakdown
        const taxX = pageWidth - 80;
        const addTaxLine = (label: string, value: any, isTotal = false) => {
            doc.setFontSize(isTotal ? 10 : 8);
            doc.setFont("helvetica", isTotal ? "bold" : "normal");
            doc.setTextColor(slate900[0], slate900[1], slate900[2]);
            doc.text(label, taxX, currentY);
            doc.text(`INR ${value?.toLocaleString()}`, pageWidth - 15, currentY, { align: "right" });
            currentY += 6;
        };

        addTaxLine("Taxable Value", data.subTotal);
        addTaxLine(`CGST (${data.cgstRate}%)`, (data.subTotal * data.cgstRate) / 100);
        addTaxLine(`SGST (${data.sgstRate}%)`, (data.subTotal * data.sgstRate) / 100);
        if (data.discount) addTaxLine("Discount", -data.discount);
        if (data.advancePaid) addTaxLine("Advance Paid", -data.advancePaid);

        currentY += 2;
        doc.setLineWidth(0.5);
        doc.line(taxX, currentY, pageWidth - 15, currentY);
        currentY += 6;
        addTaxLine("BALANCE DUE:", data.balanceDue, true);

        // 5. Footer & QR
        let footerY = doc.internal.pageSize.height - 45;
        doc.setDrawColor(slate900[0], slate900[1], slate900[2]);
        doc.setLineWidth(0.5);
        doc.line(15, footerY, pageWidth - 15, footerY);

        footerY += 10;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(slate900[0], slate900[1], slate900[2]);
        doc.text("For INFRA-PILOT PVT LTD", pageWidth - 15, footerY, { align: "right" });

        doc.setDrawColor(203, 213, 225);
        doc.line(pageWidth - 70, footerY + 15, pageWidth - 15, footerY + 15);
        doc.setFontSize(7);
        doc.text("AUTHORIZED SIGNATORY", pageWidth - 42.5, footerY + 19, { align: "center" });

        // QR Placeholder
        doc.setDrawColor(slate100[0], slate100[1], slate100[2]);
        doc.setLineWidth(0.5);
        doc.rect(15, footerY - 5, 20, 20);
        doc.setFontSize(6);
        doc.text("SCAN FOR\nPAYMENT", 25, footerY + 5, { align: "center" });

        doc.setFontSize(6);
        doc.setTextColor(slate500[0], slate500[1], slate500[2]);
        doc.text("Certified that the particulars given above are true & correct.", 40, footerY + 20);

        // T&C
        doc.setFontSize(6);
        doc.setTextColor(148, 163, 184);
        doc.text("TERMS & CONDITIONS: 1. Subject to Indore Jurisdiction. 2. Payment by RTGS/NEFT/UPI. 3. Interest @18% p.a. 4. TDS as per Form 16A.", 15, doc.internal.pageSize.height - 10);

        return doc;
    };

    const handlePrint = () => {
        const doc = buildInvoicePDF();
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const win = window.open(url, '_blank');
        if (win) {
            win.onload = () => {
                win.print();
            };
        }
    };

    const handleDownloadPDF = () => {
        const doc = buildInvoicePDF();
        doc.save(`Invoice_${data.invoiceNo || 'Draft'}.pdf`);
    };

    // Helper to convert number to Indian currency words
    const toWords = (num: number) => {
        const amount = Math.floor(num);
        return `${amount.toLocaleString()}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Invoice Preview"
            maxWidth="max-w-5xl"
        >
            <div className="bg-slate-50 p-4 -m-6 rounded-b-2xl">
                <div className="flex justify-end gap-3 mb-4 no-print">
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                    >
                        <Download className="w-4 h-4" /> Download PDF
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all"
                    >
                        <Printer className="w-4 h-4" /> Print / Save PDF
                    </button>
                </div>

                {/* PRINTABLE AREA */}
                <div id="printable-invoice" className="bg-white p-8 shadow-2xl border border-slate-200 mx-auto max-w-[210mm] min-h-[297mm]">

                    {/* HEADER SECTION */}
                    <div className="border-b-2 border-slate-900 pb-6 mb-6">
                        <div className="flex justify-between items-start">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-20">
                                        <img src={logo} alt="Logo" className="w-full h-auto" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">InfraPilot</h1>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Construction & Infrastructure</p>
                                    </div>
                                </div>
                                <div className="text-[10px] space-y-1 text-slate-600 font-medium max-w-sm">
                                    <p>Unit Address: 123, Business Hub, MG Road, Indore, MP - 452001</p>
                                    <p>Registered Office: B-wing, 2nd floor, Ahura Centre, Mahakali Caves Road, Andheri (E), Mumbai - 400093</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="border-2 border-slate-900 text-slate-900 px-6 py-2 text-sm font-black uppercase tracking-[0.2em] mb-4">
                                    Tax Invoice
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest space-y-1">
                                    <p>GSTIN: 27AAACL6442L1ZA</p>
                                    <p>CIN: L26940MH2000PLC128420</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RECIPIENT & INVOICE DETAILS */}
                    <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 mb-6 font-mono">
                        <div className="bg-white p-4 space-y-3">
                            <h4 className="text-[10px] font-black bg-slate-100 px-2 py-1 -mx-4 -mt-4 border-b border-slate-200">RECIPIENT DETAILS</h4>
                            <div className="space-y-1">
                                <p className="text-[10px] text-slate-400">Name & Address of Recipient:</p>
                                <p className="text-xs font-black text-slate-900 uppercase">{data.clientName || "Sandeep Sir"}</p>
                                <p className="text-[10px] text-slate-600 line-clamp-3">{data.clientAddress || "Indore, Madhya Pradesh"}</p>
                                <p className="text-[10px] font-bold text-slate-800 pt-2">GSTIN: {data.clientGst || "23ABCDE1234F1Z5"}</p>
                            </div>
                        </div>
                        <div className="bg-white p-4 space-y-3">
                            <h4 className="text-[10px] font-black bg-slate-100 px-2 py-1 -mx-4 -mt-4 border-b border-slate-200 text-right">INVOICE INFO</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-slate-400">Invoice No:</p>
                                    <p className="text-xs font-black text-slate-900">{data.invoiceNo || "IP/24-25/001"}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400">Date:</p>
                                    <p className="text-xs font-black text-slate-900">{data.date || new Date().toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400">Project Code:</p>
                                    <p className="text-xs font-black text-slate-900">PRJ-2024-05</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400">Place of Supply:</p>
                                    <p className="text-xs font-black text-slate-900 uppercase">Madhya Pradesh</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ITEMS TABLE */}
                    <table className="w-full border-collapse border border-slate-900 mb-6">
                        <thead>
                            <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-800 border-b border-slate-900">
                                <th className="border border-slate-900 p-2 text-center w-12">Sr.</th>
                                <th className="border border-slate-900 p-2 text-left">Description of Goods / Services</th>
                                <th className="border border-slate-900 p-2 text-center w-20">Qty</th>
                                <th className="border border-slate-900 p-2 text-right w-24">Rate (₹)</th>
                                <th className="border border-slate-900 p-2 text-center w-16">Unit</th>
                                <th className="border border-slate-900 p-2 text-right w-28">Basic Value (₹)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Construction Work (Items) */}
                            {data.items?.length > 0 && (
                                <tr className="bg-slate-100 text-[9px] font-black uppercase text-slate-600">
                                    <td colSpan={6} className="border border-slate-900 px-2 py-0.5">Construction Work</td>
                                </tr>
                            )}
                            {data.items?.map((item: any, idx: number) => (
                                <tr key={`item-${idx}`} className="text-[11px] font-bold text-slate-700">
                                    <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                                    <td className="border border-slate-900 p-2 whitespace-pre-line">{item.description || item.title}</td>
                                    <td className="border border-slate-900 p-2 text-center">{item.quantity}</td>
                                    <td className="border border-slate-900 p-2 text-right">{item.rate?.toLocaleString()}</td>
                                    <td className="border border-slate-900 p-2 text-center">{item.unit}</td>
                                    <td className="border border-slate-900 p-2 text-right font-black text-slate-900">{item.amount?.toLocaleString()}</td>
                                </tr>
                            ))}

                            {/* Material Items */}
                            {data.materialItems?.length > 0 && (
                                <tr className="bg-slate-100 text-[9px] font-black uppercase text-slate-600">
                                    <td colSpan={6} className="border border-slate-900 px-2 py-0.5">Material Supply</td>
                                </tr>
                            )}
                            {data.materialItems?.map((m: any, idx: number) => (
                                <tr key={`mat-${idx}`} className="text-[11px] font-bold text-slate-700">
                                    <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                                    <td className="border border-slate-900 p-2 whitespace-pre-line">{m.material_name} {m.notes ? `(${m.notes})` : ''}</td>
                                    <td className="border border-slate-900 p-2 text-center">{m.estimated_quantity}</td>
                                    <td className="border border-slate-900 p-2 text-right">{m.estimated_rate?.toLocaleString()}</td>
                                    <td className="border border-slate-900 p-2 text-center">{m.unit}</td>
                                    <td className="border border-slate-900 p-2 text-right font-black text-slate-900">{m.estimated_amount?.toLocaleString()}</td>
                                </tr>
                            ))}

                            {/* Labour Items */}
                            {data.labourItems?.length > 0 && (
                                <tr className="bg-slate-100 text-[9px] font-black uppercase text-slate-600">
                                    <td colSpan={6} className="border border-slate-900 px-2 py-0.5">Labour Forces</td>
                                </tr>
                            )}
                            {data.labourItems?.map((l: any, idx: number) => (
                                <tr key={`lab-${idx}`} className="text-[11px] font-bold text-slate-700">
                                    <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                                    <td className="border border-slate-900 p-2 whitespace-pre-line">{l.skill_type} {l.notes ? `(${l.notes})` : ''} <br /><span className="text-[9px] font-medium opacity-50">Workers: {l.labour_count} × Days: {l.labour_days}</span></td>
                                    <td className="border border-slate-900 p-2 text-center">{l.labour_count * l.labour_days}</td>
                                    <td className="border border-slate-900 p-2 text-right">{l.daily_wage?.toLocaleString()}</td>
                                    <td className="border border-slate-900 p-2 text-center">Man-days</td>
                                    <td className="border border-slate-900 p-2 text-right font-black text-slate-900">{l.amount?.toLocaleString()}</td>
                                </tr>
                            ))}

                            {/* Extra Charges */}
                            {data.extraChargeItems?.length > 0 && (
                                <tr className="bg-slate-100 text-[9px] font-black uppercase text-slate-600">
                                    <td colSpan={6} className="border border-slate-900 px-2 py-0.5">Extra Charges & Equipment</td>
                                </tr>
                            )}
                            {data.extraChargeItems?.map((e: any, idx: number) => (
                                <tr key={`ext-${idx}`} className="text-[11px] font-bold text-slate-700">
                                    <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                                    <td className="border border-slate-900 p-2 whitespace-pre-line text-amber-900">{e.description}</td>
                                    <td className="border border-slate-900 p-2 text-center">{e.quantity}</td>
                                    <td className="border border-slate-900 p-2 text-right">{e.rate?.toLocaleString()}</td>
                                    <td className="border border-slate-900 p-2 text-center">-</td>
                                    <td className="border border-slate-900 p-2 text-right font-black text-slate-900">{e.amount?.toLocaleString()}</td>
                                </tr>
                            ))}

                            {/* Padding rows to maintain height */}
                            {Array.from({ length: Math.max(0, 8 - ((data.items?.length || 0) + (data.materialItems?.length || 0) + (data.labourItems?.length || 0) + (data.extraChargeItems?.length || 0))) }).map((_, i) => (
                                <tr key={`empty-${i}`} className="h-8">
                                    <td className="border border-slate-900 p-2"></td>
                                    <td className="border border-slate-900 p-2"></td>
                                    <td className="border border-slate-900 p-2"></td>
                                    <td className="border border-slate-900 p-2"></td>
                                    <td className="border border-slate-900 p-2"></td>
                                    <td className="border border-slate-900 p-2"></td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-50 text-xs font-black text-slate-900 border-t-2 border-slate-900">
                                <td colSpan={5} className="border border-slate-900 p-2 text-right uppercase tracking-widest">Total Basic Value</td>
                                <td className="border border-slate-900 p-2 text-right">₹{data.subTotal?.toLocaleString()}</td>
                            </tr>
                        </tfoot>
                    </table>

                    {/* TOTAL IN WORDS & TAX SECTION */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="space-y-4">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Amount in Words:</p>
                                <p className="text-[11px] font-black text-slate-800 uppercase leading-tight">
                                    {toWords(data.grandTotal)}
                                </p>
                            </div>
                            <div className="p-3 bg-slate-50 border border-slate-200 text-[10px] space-y-1">
                                <p className="font-black text-slate-800">REMARK:</p>
                                <p className="text-slate-600">Material provided as per delivery challan. No breakage responsibility after site delivery.</p>
                            </div>
                        </div>
                        <div className="space-y-2 border-l border-slate-100 pl-8">
                            <div className="flex justify-between text-xs">
                                <span className="font-bold text-slate-500">Taxable Value</span>
                                <span className="font-black text-slate-800">₹{data.subTotal?.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="font-bold text-slate-500">CGST ({data.cgstRate || 0}%)</span>
                                <span className="font-black text-slate-800">₹{((data.subTotal * (data.cgstRate || 0)) / 100).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="font-bold text-slate-500">SGST ({data.sgstRate || 0}%)</span>
                                <span className="font-black text-slate-800">₹{((data.subTotal * (data.sgstRate || 0)) / 100).toLocaleString()}</span>
                            </div>
                            {data.discount && (
                                <div className="flex justify-between text-xs text-rose-600">
                                    <span className="font-bold">Discount</span>
                                    <span className="font-black">-₹{data.discount.toLocaleString()}</span>
                                </div>
                            )}
                            {data.advancePaid && (
                                <div className="flex justify-between text-xs text-emerald-600">
                                    <span className="font-bold">Advance Paid</span>
                                    <span className="font-black">₹{data.advancePaid.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="pt-4 border-t-2 border-slate-900 flex justify-between">
                                <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">
                                    {data.advancePaid ? "Balance Due" : "Final Net Amount"}
                                </span>
                                <span className="text-xl font-black text-slate-900">
                                    ₹{(data.advancePaid ? (data.balanceDue || data.grandTotal) : data.grandTotal)?.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* FOOTER SECTION: QR & SIGNATORY */}
                    <div className="mt-auto border-t-2 border-slate-900 pt-8">
                        <div className="grid grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                                        <QrCode className="w-12 h-12 text-slate-800" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-slate-900 leading-tight">Scan for<br />UPI Payment</p>
                                    </div>
                                </div>
                            </div>
                            <div className="text-[9px] text-slate-500 flex items-end">
                                Certified that the particulars given above are true & correct.
                            </div>
                            <div className="text-right space-y-12">
                                <p className="text-[10px] font-black text-slate-900 uppercase">For INFRA-PILOT PVT LTD</p>
                                <div className="border-t border-slate-400 pt-1">
                                    <p className="text-[10px] font-black text-slate-900 uppercase">Authorized Signatory</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* T&C */}
                    <div className="mt-12 text-[8px] text-slate-400 leading-tight border-t border-slate-100 pt-4">
                        <p className="font-bold mb-1">TERMS & CONDITIONS:</p>
                        <ol className="list-decimal pl-4 space-y-0.5">
                            <li>Subject to Indore Jurisdiction.</li>
                            <li>Payment should be made by RTGS/NEFT/UPI in favour of "InfraPilot Pvt Ltd".</li>
                            <li>Interest @18% p.a. shall be charged on late payments.</li>
                            <li>TDS deducted by you should be credited to our account via Form 16A.</li>
                        </ol>
                    </div>

                </div>
            </div>

            <style>{`
        @media print {
          /* Hide main app and non-essential UI */
          #root, 
          .no-print,
          button,
          .modal-close-button {
            display: none !important;
          }

          /* Reset body for clean printing */
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Reset the Modal container and Card */
          /* Note: We target the specific layout of our Modal.tsx */
          div.fixed.inset-0 {
            position: static !important;
            display: block !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }

          /* Hide backdrop and shadows */
          .backdrop-blur-sm {
            display: none !important;
          }

          div.max-w-5xl {
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Optimize printable area */
          #printable-invoice {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            border: none !important;
            box-shadow: none !important;
          }

          @page {
            margin: 0;
            size: A4;
          }
        }
      `}</style>
        </Modal>
    );
};

export default InvoicePreviewModal;
