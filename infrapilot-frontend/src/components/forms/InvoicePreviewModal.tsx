import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { Printer, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/logo.png";
import { settingsService } from "../../services/settingsService";
import { quotationService } from "../../services/quotationService";
import type { CompanySettings } from "../../types/settings";
import toast from "react-hot-toast";

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
    const [companyInfo, setCompanyInfo] = useState<CompanySettings | null>(null);

    useEffect(() => {
        if (isOpen) {
            const fetchBranding = async () => {
                try {
                    const settings = await settingsService.getCompanySettings();
                    setCompanyInfo(settings);
                } catch (err) {
                    console.error("Failed to fetch branding for invoice", err);
                }
            };
            fetchBranding();
        }
    }, [isOpen]);

    if (!data) return null;

    const currentLogo = companyInfo?.company_logo ? settingsService.resolveUrl(companyInfo.company_logo) : logo;
    const currentSignature = companyInfo?.signature_image ? settingsService.resolveUrl(companyInfo.signature_image) : null;

    const toWords = (num: number) => {
        const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

        const inWords = (n: any): string => {
            if ((n = n.toString()).length > 9) return 'overflow';
            let n_arr: any = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!n_arr) return '';
            let str = '';
            str += (n_arr[1] != 0) ? (a[Number(n_arr[1])] || b[n_arr[1][0]] + ' ' + a[n_arr[1][1]]) + 'Crore ' : '';
            str += (n_arr[2] != 0) ? (a[Number(n_arr[2])] || b[n_arr[2][0]] + ' ' + a[n_arr[2][1]]) + 'Lakh ' : '';
            str += (n_arr[3] != 0) ? (a[Number(n_arr[3])] || b[n_arr[3][0]] + ' ' + a[n_arr[3][1]]) + 'Thousand ' : '';
            str += (n_arr[4] != 0) ? (a[Number(n_arr[4])] || b[n_arr[4][0]] + ' ' + a[n_arr[4][1]]) + 'Hundred ' : '';
            str += (n_arr[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_arr[5])] || b[n_arr[5][0]] + ' ' + a[n_arr[5][1]]) : '';
            return str;
        };

        const amount = Math.floor(num);
        const paisa = Math.round((num - amount) * 100);
        let res = inWords(amount) + "Rupees Only";
        if (paisa > 0) {
            res = inWords(amount) + "Rupees and " + inWords(paisa) + "Paise Only";
        }
        return res;
    };

    const buildInvoicePDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        const primaryBlue: [number, number, number] = [31, 78, 121]; // #1F4E79
        const greenAccent: [number, number, number] = [74, 182, 94]; // #4AB65E

        const drawFooter = (pdfDoc: jsPDF) => {
            const footerY = pageHeight - 35;
            pdfDoc.setFillColor(greenAccent[0], greenAccent[1], greenAccent[2]);
            pdfDoc.rect(10, footerY - 2, pageWidth - 20, 1.5, "F");
            pdfDoc.setFillColor(238, 238, 238);
            pdfDoc.rect(10, footerY, pageWidth - 20, 25, "F");

            pdfDoc.setFontSize(7);
            pdfDoc.setTextColor(0, 0, 0);
            pdfDoc.text(companyInfo?.mobile_number || "9876543210", 25, footerY + 8);
            pdfDoc.text(companyInfo?.email || "info@infrapilot.com", 25, footerY + 16);
            pdfDoc.text("@infrapilot_project", 85, footerY + 8);
            pdfDoc.text(companyInfo?.mobile_number || "9999999999", 85, footerY + 16);
            pdfDoc.text(companyInfo?.address || "Office No. 101, Skyline Tower, MG Road, Pune", 145, footerY + 8, { maxWidth: 50 });
            pdfDoc.text(companyInfo?.website || "https://www.infrapilot.com/", 145, footerY + 18);
        };

        const drawHeader = (pdfDoc: jsPDF, isFirstPage = false) => {
            if (currentLogo) {
                try { pdfDoc.addImage(currentLogo, 'PNG', 15, 10, 25, 20); } catch (e) { }
            }
            pdfDoc.setFontSize(22);
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
            pdfDoc.text("TAX INVOICE", pageWidth / 2 + 10, 25, { align: "center" });

            if (isFirstPage) {
                pdfDoc.setFontSize(10);
                pdfDoc.setTextColor(0, 0, 0);
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.text(companyInfo?.company_name || "Infra Pilot", 15, 45);
                pdfDoc.setFontSize(8);
                pdfDoc.setFont("helvetica", "normal");
                pdfDoc.text(`GST: ${companyInfo?.gst_number || "27ABCDE1234F1Z5"}`, 15, 50);
                pdfDoc.text(`Mobile: ${companyInfo?.mobile_number || "9876543210"}`, 15, 54);
                pdfDoc.text(`Email: ${companyInfo?.email || "info@infrapilot.com"}`, 15, 58);
            }
        };

        const drawTable = (pdfDoc: jsPDF, title: string, head: string[][], body: any[][], startY: number) => {
            if (title) {
                pdfDoc.setFontSize(11);
                pdfDoc.setFont("helvetica", "bold");
                pdfDoc.setTextColor(0, 0, 0);
                pdfDoc.text(title, 15, startY);
                startY += 4;
            }
            autoTable(pdfDoc, {
                startY: startY,
                head: head,
                body: body,
                theme: 'grid',
                headStyles: { fillColor: primaryBlue, textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
                bodyStyles: { fontSize: 8, textColor: [0, 0, 0] },
                styles: { cellPadding: 2, lineWidth: 0.1, lineColor: [0, 0, 0] },
                margin: { left: 15, right: 15 },
                didDrawPage: () => { drawFooter(pdfDoc); }
            });
            return (pdfDoc as any).lastAutoTable.finalY + 8;
        };

        // --- Page 1 ---
        drawHeader(doc, true);
        let curY = 65;
        curY = drawTable(doc, "", [['Field', 'Value']], [
            ['Invoice No', data.invoiceNo || 'N/A'],
            ['Date', data.date || 'N/A'],
            ['Project', data.projectName || 'N/A'],
            ['Project Type', data.projectType || 'Residential'],
            ['Engineer', data.engineerName || 'Er. Tejas Dhande'],
            ['Work Order', data.workOrderNo || 'N/A']
        ], curY);

        curY = drawTable(doc, "Client Details", [['Field', 'Value']], [
            ['Client Name', data.clientName || 'N/A'],
            ['Billing Address', data.clientAddress || 'N/A'],
            ['Site Address', data.siteAddress || data.clientAddress || 'N/A'],
            ['Mobile', data.clientMobile || data.clientMobileNo || 'N/A'],
            ['GST Number', data.clientGst || data.clientGstNo || 'N/A']
        ], curY);

        curY = drawTable(doc, "Item Details", [['Item', 'Qty', 'Unit', 'Rate', 'Amount']],
            data.items?.map((it: any) => [it.description || it.title, it.quantity, it.unit, it.rate?.toFixed(2), it.amount?.toFixed(2)]) || [],
            curY
        );

        // Financial Summary on same page if possible, else autoTable handles it
        curY = drawTable(doc, "Financial Summary", [['Description', 'Amount']], [
            ['Subtotal', `INR ${data.subTotal?.toFixed(2)}`],
            ['CGST', `INR ${((data.subTotal * (data.cgstRate || 0)) / 100).toFixed(2)}`],
            ['SGST', `INR ${((data.subTotal * (data.sgstRate || 0)) / 100).toFixed(2)}`],
            ['Grand Total', `INR ${data.grandTotal?.toFixed(2)}`],
            ['Advance Paid', `INR ${data.advancePaid?.toFixed(2)}`],
            ['Balance Due', `INR ${data.balanceDue?.toFixed(2)}`]
        ], curY);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Amount in Words: ${toWords(data.grandTotal)}`, 15, curY);

        // --- Page 2 (Terms & Signature if needed) ---
        if (curY > pageHeight - 60) doc.addPage();
        curY = Math.max(curY + 10, 40);

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Terms & Conditions", 15, curY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const splitTerms = doc.splitTextToSize(data.terms || "Material provided as per delivery challan. No breakage responsibility after delivery.", pageWidth - 30);
        doc.text(splitTerms, 15, curY + 5);

        curY += 40;
        if (currentSignature) {
            try { doc.addImage(currentSignature, 'PNG', 15, curY, 30, 10); } catch (e) { }
        }
        doc.line(15, curY + 12, 60, curY + 12);
        doc.setFontSize(9);
        doc.text("Authorized Signature", 15, curY + 17);
        doc.text(companyInfo?.company_name || "Infra Pilot", 15, curY + 22);

        drawFooter(doc);

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

    const handleDownloadPDF = async () => {
        if (!data.id && !data.invoiceNo?.includes('QTN')) {
            const doc = buildInvoicePDF();
            doc.save(`Invoice_${data.invoiceNo || 'Draft'}.pdf`);
            return;
        }

        const toastId = toast.loading("Downloading PDF from backend...");
        try {
            const qId = data.id || (typeof data.invoiceNo === 'string' ? data.invoiceNo.replace('QTN-', '') : null);

            if (!qId || isNaN(Number(qId))) {
                const doc = buildInvoicePDF();
                doc.save(`Invoice_${data.invoiceNo || 'Draft'}.pdf`);
                toast.dismiss(toastId);
                return;
            }

            const blob = await quotationService.downloadQuotationPDF(Number(qId));
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${data.invoiceNo}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("Downloaded from Server", { id: toastId });
        } catch (error) {
            console.error("Backend Download Error:", error);
            toast.error("Falling back to local generation", { id: toastId });
            const doc = buildInvoicePDF();
            doc.save(`Invoice_${data.invoiceNo || 'Draft'}.pdf`);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Invoice Preview" maxWidth="max-w-5xl">
            <div className="bg-slate-800 p-8 h-[90vh] overflow-y-auto no-print">
                <div className="flex justify-end gap-3 mb-6">
                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg">
                        <Download size={18} /> Download PDF
                    </button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg">
                        <Printer size={18} /> Print
                    </button>
                </div>

                <div className="bg-white max-w-[210mm] mx-auto p-12 mb-8 shadow-2xl min-h-[297mm]">
                    <div className="flex justify-between items-center mb-8">
                        <img src={currentLogo || logo} alt="Logo" className="w-24 h-24 object-contain" />
                        <h1 className="text-3xl font-bold text-[#1F4E79] tracking-tight">TAX INVOICE</h1>
                    </div>

                    <div className="mb-8">
                        <h2 className="text-lg font-bold text-slate-900">{companyInfo?.company_name || "Infra Pilot"}</h2>
                        <p className="text-xs text-slate-600">GST: {companyInfo?.gst_number || "27ABCDE1234F1Z5"}</p>
                        <p className="text-xs text-slate-600">Mobile: {companyInfo?.mobile_number || "9876543210"}</p>
                        <p className="text-xs text-slate-600">Email: {companyInfo?.email || "info@infrapilot.com"}</p>
                    </div>

                    <div className="mb-6">
                        <div className="bg-[#1F4E79] text-white flex p-2 rounded-t-sm font-bold text-sm">
                            <div className="w-1/2">Field</div>
                            <div className="w-1/2 text-left">Value</div>
                        </div>
                        <div className="border border-slate-300 divide-y divide-slate-300 text-xs text-slate-700">
                            <div className="flex p-2"><div className="w-1/2 font-bold">Invoice No</div><div className="w-1/2">{data.invoiceNo}</div></div>
                            <div className="flex p-2 bg-slate-50"><div className="w-1/2 font-bold">Date</div><div className="w-1/2">{data.date}</div></div>
                            <div className="flex p-2"><div className="w-1/2 font-bold">Project</div><div className="w-1/2">{data.projectName || "N/A"}</div></div>
                            <div className="flex p-2 bg-slate-50"><div className="w-1/2 font-bold">Project Type</div><div className="w-1/2">Residential</div></div>
                            <div className="flex p-2"><div className="w-1/2 font-bold">Engineer</div><div className="w-1/2">Er. Tejas Dhande</div></div>
                            <div className="flex p-2 bg-slate-50"><div className="w-1/2 font-bold">Work Order</div><div className="w-1/2">N/A</div></div>
                        </div>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 mb-2 uppercase">Client Details</h3>
                    <div className="mb-6">
                        <div className="bg-[#1F4E79] text-white flex p-2 rounded-t-sm font-bold text-sm">
                            <div className="w-1/2">Field</div>
                            <div className="w-1/2 text-left">Value</div>
                        </div>
                        <div className="border border-slate-300 divide-y divide-slate-300 text-xs text-slate-700">
                            <div className="flex p-2"><div className="w-1/2 font-bold">Client Name</div><div className="w-1/2 uppercase text-slate-900 font-black">{data.clientName || "N/A"}</div></div>
                            <div className="flex p-2 bg-slate-50"><div className="w-1/2 font-bold">Billing Address</div><div className="w-1/2">{data.clientAddress || "N/A"}</div></div>
                            <div className="flex p-2"><div className="w-1/2 font-bold">Site Address</div><div className="w-1/2">N/A</div></div>
                            <div className="flex p-2 bg-slate-50"><div className="w-1/2 font-bold">Mobile</div><div className="w-1/2">{data.clientMobile || "N/A"}</div></div>
                            <div className="flex p-2"><div className="w-1/2 font-bold">GST Number</div><div className="w-1/2">{data.clientGst || "N/A"}</div></div>
                        </div>
                    </div>

                    <h3 className="text-sm font-black text-slate-900 mb-2 uppercase">Item Details</h3>
                    <table className="w-full border-collapse border border-slate-300 text-xs mb-8">
                        <thead>
                            <tr className="bg-[#1F4E79] text-white font-bold">
                                <th className="border border-slate-300 p-2 text-left">Item</th>
                                <th className="border border-slate-300 p-2 text-center w-16">Qty</th>
                                <th className="border border-slate-300 p-2 text-center w-20">Unit</th>
                                <th className="border border-slate-300 p-2 text-right w-24">Rate</th>
                                <th className="border border-slate-300 p-2 text-right w-28">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-300 text-slate-700">
                            {data.items?.map((item: any, idx: number) => (
                                <tr key={idx} className={idx % 2 === 1 ? "bg-slate-50" : ""}>
                                    <td className="border border-slate-300 p-2 font-bold">{item.description || item.title}</td>
                                    <td className="border border-slate-300 p-2 text-center">{item.quantity}</td>
                                    <td className="border border-slate-300 p-2 text-center">{item.unit}</td>
                                    <td className="border border-slate-300 p-2 text-right">{item.rate?.toFixed(2)}</td>
                                    <td className="border border-slate-300 p-2 text-right font-black text-slate-900">{item.amount?.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex justify-end mb-8">
                        <div className="w-1/2 space-y-1 text-sm border border-slate-300 p-4">
                            <div className="flex justify-between"><span className="text-slate-500">Subtotal:</span><span className="font-bold">INR {data.subTotal?.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-slate-500">Grand Total:</span><span className="font-black text-slate-900 text-lg">INR {data.grandTotal?.toLocaleString()}</span></div>
                            <div className="pt-2 border-t border-slate-200">
                                <p className="text-[10px] font-bold text-slate-400 italic leading-tight">Amount in Words: {toWords(data.grandTotal)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .shadow-2xl { box-shadow: none !important; border: none !important; }
                }
            `}</style>
        </Modal>
    );
};

export default InvoicePreviewModal;
