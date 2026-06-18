import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { Printer, Download, Phone, Mail, MapPin, Globe, MessageCircle, Layout as LinkIcon } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/logo.png";
import { settingsService } from "../../services/settingsService";
import type { CompanySettings } from "../../types/settings";

interface QuotationPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
}

const QuotationPreviewModal: React.FC<QuotationPreviewModalProps> = ({
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
                    console.error("Failed to fetch branding for quotation", err);
                }
            };
            fetchBranding();
        }
    }, [isOpen]);

    if (!data) return null;

    const currentLogo = companyInfo?.company_logo ? settingsService.resolveUrl(companyInfo.company_logo) : logo;
    const currentSignature = companyInfo?.signature_image ? settingsService.resolveUrl(companyInfo.signature_image) : null;

    const numberToWords = (num: number) => {
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
        if (paisa > 0) res = inWords(amount) + "Rupees and " + inWords(paisa) + "Paise Only";
        return res;
    };

    const buildQuotationPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        const primaryBlue: [number, number, number] = [31, 78, 121]; // #1F4E79
        const lightGrey: [number, number, number] = [238, 238, 238]; // For footer block
        const greenAccent: [number, number, number] = [74, 182, 94]; // #4AB65E

        const drawFooter = (pdfDoc: jsPDF) => {
            const footerY = pageHeight - 35;
            pdfDoc.setFillColor(greenAccent[0], greenAccent[1], greenAccent[2]);
            pdfDoc.rect(10, footerY - 2, pageWidth - 20, 1.5, "F");
            pdfDoc.setFillColor(lightGrey[0], lightGrey[1], lightGrey[2]);
            pdfDoc.rect(10, footerY, pageWidth - 20, 25, "F");

            pdfDoc.setFontSize(7);
            pdfDoc.setTextColor(0, 0, 0);

            pdfDoc.text(companyInfo?.mobile_number || "9876543210", 25, footerY + 8);
            pdfDoc.text(companyInfo?.email || "info@heavenconstruction.com", 25, footerY + 16);

            pdfDoc.text("@infrapilot_project", 85, footerY + 8);
            pdfDoc.text(companyInfo?.mobile_number || "9999999999", 85, footerY + 16);

            pdfDoc.text(companyInfo?.address || "Office No. 101, Skyline Tower, MG Road, Pune", 145, footerY + 8, { maxWidth: 50 });
            pdfDoc.text(companyInfo?.website || "https://www.heavenconstruction.com/", 145, footerY + 18);
        };

        const drawHeader = (pdfDoc: jsPDF, isFirstPage = false) => {
            if (currentLogo) {
                try { pdfDoc.addImage(currentLogo, 'PNG', 15, 10, 25, 20); } catch (e) { }
            }
            pdfDoc.setFontSize(22);
            pdfDoc.setFont("helvetica", "bold");
            pdfDoc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
            pdfDoc.text("PROJECT QUOTATION", pageWidth / 2 + 10, 25, { align: "center" });

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
            ['Quotation No', data.invoiceNo || 'N/A'],
            ['Date', data.date || 'N/A'],
            ['Project', data.projectName || 'N/A'],
            ['Project Type', data.projectType || 'Residential'],
            ['Engineer', data.engineerName || 'Er. Tejas Dhande'],
            ['Work Order', data.workOrderNo || 'N/A']
        ], curY);

        curY = drawTable(doc, "Client Details", [['Field', 'Value']], [
            ['Client Name', data.clientName || 'N/A'],
            ['Billing Address', data.clientAddress || 'N/A'],
            ['Site Address', data.siteAddress || 'N/A'],
            ['Mobile', data.mobile_number || 'N/A'],
            ['GST Number', data.gst_number || 'N/A']
        ], curY);

        curY = drawTable(doc, "Item Details", [['Item', 'Qty', 'Unit', 'Rate', 'Amount']],
            data.items?.map((it: any) => [it.description || it.title, it.quantity, it.unit, it.rate?.toFixed(2), it.amount?.toFixed(2)]) || [],
            curY
        );

        // --- Page 2 ---
        doc.addPage();
        drawHeader(doc);
        curY = 40;
        curY = drawTable(doc, "Labour Details", [['Skill', 'Count', 'Days', 'Daily Wage', 'Amount']],
            data.labourItems?.map((it: any) => [it.skill_type, it.labour_count, it.labour_days || 1, it.daily_wage?.toFixed(2), it.amount?.toFixed(2)]) || [],
            curY
        );

        curY = drawTable(doc, "Material Details", [['Material', 'Qty', 'Unit', 'Rate', 'Amount']],
            data.materialItems?.map((it: any) => [it.material_name, it.estimated_quantity, it.unit, it.estimated_rate?.toFixed(2), it.estimated_amount?.toFixed(2)]) || [],
            curY
        );

        curY = drawTable(doc, "Extra Charges", [['Type', 'Qty', 'Rate', 'Amount']],
            data.extraChargeItems?.map((it: any) => [it.description, it.quantity, it.rate?.toFixed(2), it.amount?.toFixed(2)]) || [],
            curY
        );

        curY = drawTable(doc, "Financial Summary", [['Description', 'Amount']], [
            ['Subtotal', data.subTotal?.toFixed(2)],
            ['CGST', ((data.subTotal * (data.cgstRate || 0)) / 100).toFixed(2)],
            ['SGST', ((data.subTotal * (data.sgstRate || 0)) / 100).toFixed(2)],
            ['Discount', (data.discount || 0).toFixed(2)],
            ['Advance Paid', (data.advancePaid || 0).toFixed(2)],
            ['Grand Total', data.grandTotal?.toFixed(2)],
            ['Balance Due', data.balanceDue?.toFixed(2)]
        ], curY);

        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Amount in Words: ${numberToWords(data.grandTotal)}`, 15, curY);

        // --- Page 3 ---
        doc.addPage();
        drawHeader(doc);
        curY = 40;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Terms & Conditions", 15, curY);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        const splitTerms = doc.splitTextToSize(data.terms || "50% advance payment required.", pageWidth - 30);
        doc.text(splitTerms, 15, curY + 5);

        curY += 30;
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("Scan To Pay", 15, curY);
        doc.rect(15, curY + 5, 25, 25);

        curY += 45;
        try { if (currentSignature) doc.addImage(currentSignature, 'PNG', 15, curY, 30, 10); } catch (e) { }
        doc.line(15, curY + 12, 60, curY + 12);
        doc.setFontSize(9);
        doc.text("Authorized Signature", 15, curY + 17);
        doc.text(companyInfo?.company_name || "Infra Pilot", 15, curY + 22);

        drawFooter(doc);

        return doc;
    };

    const handlePrint = () => {
        const doc = buildQuotationPDF();
        const pdfBlob = doc.output('blob');
        const url = URL.createObjectURL(pdfBlob);
        const win = window.open(url, '_blank');
        if (win) win.onload = () => win.print();
    };

    const handleDownloadPDF = () => {
        const doc = buildQuotationPDF();
        doc.save(`Quotation_${data.invoiceNo}.pdf`);
    };

    const TableSection = ({ title, head, body }: any) => (
        <div className="mb-6">
            {title && <h3 className="text-sm font-bold text-black mb-1">{title}</h3>}
            <table className="w-full border-collapse border border-black text-[10px]">
                <thead><tr className="bg-[#1F4E79] text-white">{head[0].map((h: any, i: number) => (<th key={i} className="border border-black px-2 py-1 text-left uppercase">{h}</th>))}</tr></thead>
                <tbody>{body.map((row: any, ri: number) => (<tr key={ri} className="bg-white hover:bg-slate-50">{row.map((cell: any, ci: number) => (<td key={ci} className="border border-black px-2 py-1 text-black">{cell}</td>))}</tr>))}</tbody>
            </table>
        </div>
    );

    const FooterSection = () => (
        <div className="mt-auto pt-4 relative">
            <div className="h-0.5 bg-[#4AB65E] mb-1"></div>
            <div className="bg-[#EEEEEE] p-4 flex justify-between items-start text-[10px] font-bold text-black">
                <div className="space-y-1">
                    <div className="flex items-center gap-2"><Phone className="w-3 h-3 text-emerald-600" /> {companyInfo?.mobile_number || "9876543210"}</div>
                    <div className="flex items-center gap-2"><Mail className="w-3 h-3 text-emerald-600" /> {companyInfo?.email || "info@heavenconstruction.com"}</div>
                </div>
                <div className="space-y-1">
                    <div className="flex items-center gap-2"><LinkIcon className="w-3 h-3 text-indigo-600" /> @infrapilot_project</div>
                    <div className="flex items-center gap-2"><MessageCircle className="w-3 h-3 text-indigo-600" /> {companyInfo?.mobile_number || "9999999999"}</div>
                </div>
                <div className="max-w-[200px] space-y-1">
                    <div className="flex items-start gap-2"><MapPin className="w-3 h-3 text-rose-600 mt-1" /> <span>{companyInfo?.address || "Office No. 101, Skyline Tower, MG Road, Pune"}</span></div>
                    <div className="flex items-center gap-2"><Globe className="w-3 h-3 text-rose-600" /> {companyInfo?.website || "https://www.heavenconstruction.com/"}</div>
                </div>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Project Quotation Preview" maxWidth="max-w-5xl">
            <div className="bg-slate-800 p-8 h-[90vh] overflow-y-auto no-print">
                <div className="flex justify-end gap-3 mb-6">
                    <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"><Download size={18} /> Download PDF</button>
                    <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all"><Printer size={18} /> Print</button>
                </div>
                <div className="bg-white w-[210mm] min-h-[297mm] mx-auto p-12 mb-8 flex flex-col shadow-2xl">
                    <div className="flex justify-between items-start mb-8"><img src={currentLogo || logo} alt="Logo" className="w-24 h-auto" /><h1 className="text-3xl font-bold text-[#1F4E79] flex-1 text-center">PROJECT QUOTATION</h1></div>
                    <div className="mb-6"><h2 className="font-bold text-black text-xs">{companyInfo?.company_name || "Infra Pilot"}</h2><div className="text-[10px] text-slate-600 space-y-0.5"><p>GST: {companyInfo?.gst_number || "27ABCDE1234F1Z5"}</p><p>Mobile: {companyInfo?.mobile_number || "9876543210"}</p><p>Email: {companyInfo?.email || "info@infrapilot.com"}</p></div></div>
                    <TableSection head={[['Field', 'Value']]} body={[['Quotation No', data.invoiceNo], ['Date', data.date], ['Project', data.projectName], ['Project Type', data.projectType || 'Residential'], ['Engineer', data.engineerName || 'Er. Tejas Dhande'], ['Work Order', data.workOrderNo || 'N/A']]} />
                    <TableSection title="Client Details" head={[['Field', 'Value']]} body={[['Client Name', data.clientName], ['Billing Address', data.clientAddress], ['Site Address', data.siteAddress], ['Mobile', data.mobile_number], ['GST Number', data.gst_number]]} />
                    <TableSection title="Item Details" head={[['Item', 'Qty', 'Unit', 'Rate', 'Amount']]} body={data.items?.map((it: any) => [it.description || it.title, it.quantity, it.unit, it.rate?.toFixed(2), it.amount?.toFixed(2)]) || []} />
                    <FooterSection />
                </div>
                <div className="bg-white w-[210mm] min-h-[297mm] mx-auto p-12 mb-8 flex flex-col shadow-2xl">
                    <div className="flex justify-between items-start mb-12"><img src={currentLogo || logo} alt="Logo" className="w-24 h-auto" /><h1 className="text-3xl font-bold text-[#1F4E79] flex-1 text-center">PROJECT QUOTATION</h1></div>
                    <TableSection title="Labour Details" head={[['Skill', 'Count', 'Days', 'Daily Wage', 'Amount']]} body={data.labourItems?.map((it: any) => [it.skill_type, it.labour_count, it.labour_days || 1, it.daily_wage?.toFixed(2), it.amount?.toFixed(2)]) || []} />
                    <TableSection title="Material Details" head={[['Material', 'Qty', 'Unit', 'Rate', 'Amount']]} body={data.materialItems?.map((it: any) => [it.material_name, it.estimated_quantity, it.unit, it.estimated_rate?.toFixed(2), it.estimated_amount?.toFixed(2)]) || []} />
                    <TableSection title="Extra Charges" head={[['Type', 'Qty', 'Rate', 'Amount']]} body={data.extraChargeItems?.map((it: any) => [it.description, it.quantity, it.rate?.toFixed(2), it.amount?.toFixed(2)]) || []} />
                    <TableSection title="Financial Summary" head={[['Description', 'Amount']]} body={[['Subtotal', data.subTotal?.toFixed(2)], ['CGST', ((data.subTotal * (data.cgstRate || 0)) / 100).toFixed(2)], ['SGST', ((data.subTotal * (data.sgstRate || 0)) / 100).toFixed(2)], ['Discount', (data.discount || 0).toFixed(2)], ['Advance Paid', (data.advancePaid || 0).toFixed(2)], ['Grand Total', data.grandTotal?.toFixed(2)], ['Balance Due', data.balanceDue?.toFixed(2)]]} />
                    <p className="text-xs font-bold text-black mt-4">Amount in Words: {numberToWords(data.grandTotal)}</p>
                    <FooterSection />
                </div>
                <div className="bg-white w-[210mm] min-h-[297mm] mx-auto p-12 flex flex-col shadow-2xl">
                    <div className="flex justify-between items-start mb-12"><img src={currentLogo || logo} alt="Logo" className="w-24 h-auto" /><h1 className="text-3xl font-bold text-[#1F4E79] flex-1 text-center">PROJECT QUOTATION</h1></div>
                    <div className="mb-12"><h3 className="text-sm font-bold text-black mb-1">Terms & Conditions</h3><p className="text-[10px] text-black whitespace-pre-line">{data.terms || "50% advance payment required."}</p></div>
                    <div className="mb-12"><h3 className="text-sm font-bold text-black mb-2">Scan To Pay</h3><div className="w-24 h-24 border border-black flex items-center justify-center p-2"><img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=InfraPilotPayment" alt="QR" className="w-full h-auto" /></div></div>
                    <div className="relative mt-12 pb-24"><div className="w-48 text-center ml-0">{currentSignature && <img src={currentSignature} alt="Sig" className="h-10 mx-auto -mb-2" />}<div className="border-t border-slate-400 mt-2 pt-1 font-bold text-[10px]"><p>Authorized Signature</p><p>{companyInfo?.company_name || "Infra Pilot"}</p></div></div></div>
                    <FooterSection />
                </div>
            </div>
            <style>{`@media print {.no-print { display: none !important; }body { background: white !important; padding: 0 !important; }.shadow-2xl { box-shadow: none !important; border: none !important; }}`}</style>
        </Modal>
    );
};
export default QuotationPreviewModal;
