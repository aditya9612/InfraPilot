import React from "react";
import Modal from "../common/Modal";
import { Printer, X, QrCode } from "lucide-react";
import logo from "../../assets/logo.png";

interface ViewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

const ViewInvoiceModal: React.FC<ViewInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
}) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  // Helper to convert number to Indian currency words
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invoice Analysis"
      maxWidth="max-w-5xl"
    >
      <div className="bg-slate-50 p-4 -m-6 rounded-b-2xl">
        <div className="flex justify-end gap-3 mb-4 no-print">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all"
          >
            <Printer className="w-4 h-4" /> Print Record
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-slate-600 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE AREA */}
        <div id="view-invoice-printable" className="bg-white p-8 shadow-2xl border border-slate-100 mx-auto max-w-[210mm] min-h-[297mm] relative overflow-hidden">

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
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Construction Engineering</p>
                  </div>
                </div>
                <div className="text-[10px] space-y-1 text-slate-600 font-medium max-w-sm">
                  <p>123, InfraPark, Industrial Area, Indore, MP - 452001</p>
                  <p>Contact: +91 98765 43210 | info@infrapilot.com</p>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-slate-900 text-white px-6 py-2 text-sm font-black uppercase tracking-[0.2em] mb-4">
                  Tax Invoice
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest space-y-1 font-mono">
                  <p>GSTIN: 27AAACL6442L1ZA</p>
                  <p>CIN: L26940MH2000PLC128420</p>
                  <p>PAN: ABCDE1234F</p>
                </div>
              </div>
            </div>
          </div>

          {/* RECIPIENT & INVOICE DETAILS */}
          <div className="grid grid-cols-2 gap-px bg-slate-200 border border-slate-200 mb-6 font-mono">
            <div className="bg-white p-4 space-y-3">
              <h4 className="text-[10px] font-black bg-slate-100 px-2 py-1 -mx-4 -mt-4 border-b border-slate-200 uppercase tracking-widest">Client Particulars</h4>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400">Bill To:</p>
                <p className="text-xs font-black text-slate-900 uppercase">{invoice.client_name || "Valued Client"}</p>
                <p className="text-[10px] text-slate-600 leading-relaxed capitalize">{invoice.description?.split(',')[0] || "Project Site Address"}</p>
                <p className="text-[10px] font-bold text-slate-800 pt-2">GSTIN: {invoice.gst_number || "NOT SPECIFIED"}</p>
              </div>
            </div>
            <div className="bg-white p-4 space-y-3">
              <h4 className="text-[10px] font-black bg-slate-100 px-2 py-1 -mx-4 -mt-4 border-b border-slate-200 text-right uppercase tracking-widest">Document Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Invoice No:</p>
                  <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{invoice.invoice_number || `IP/24/${invoice.id}`}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase">Date:</p>
                  <p className="text-xs font-black text-slate-900">{new Date(invoice.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase">Status:</p>
                  <p className={`text-[10px] font-black uppercase ${invoice.status === 'paid' ? 'text-emerald-600' : 'text-amber-500'}`}>{invoice.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase">Place of Supply:</p>
                  <p className="text-xs font-black text-slate-900 uppercase">MP (23)</p>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE */}
          <table className="w-full border-collapse border border-slate-900 mb-6 font-mono">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-800 border-b border-slate-900">
                <th className="border border-slate-900 p-2 text-center w-12">Sr.</th>
                <th className="border border-slate-900 p-2 text-left">Description of Goods / Services</th>
                <th className="border border-slate-900 p-2 text-center w-16">Unit</th>
                <th className="border border-slate-900 p-2 text-right w-24">Basic Value (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="text-[11px] font-bold text-slate-700 h-24 align-top">
                <td className="border border-slate-900 p-2 text-center">01</td>
                <td className="border border-slate-900 p-2 whitespace-pre-line leading-relaxed italic">{invoice.description}</td>
                <td className="border border-slate-900 p-2 text-center">LUMPSUM</td>
                <td className="border border-slate-900 p-2 text-right font-black text-slate-900">₹{invoice.amount?.toLocaleString()}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 text-xs font-black text-slate-900 border-t-2 border-slate-900">
                <td colSpan={3} className="border border-slate-900 p-2 text-right uppercase tracking-widest text-[10px]">Taxable Amount</td>
                <td className="border border-slate-900 p-2 text-right">₹{invoice.amount?.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          {/* TAX & TOTAL */}
          <div className="grid grid-cols-2 gap-8 mb-8 font-mono">
            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Invoice Value in Words:</p>
                <p className="text-[10px] font-black text-slate-800 uppercase italic leading-tight border-b border-dotted border-slate-300 pb-1">
                  {toWords(invoice.total_amount)}
                </p>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded text-[9px] space-y-1">
                <p className="font-black text-slate-800 uppercase">Declaration:</p>
                <p className="text-slate-500 leading-relaxed italic">The materials/services described above have been provided in accordance with the project requirements. Any discrepancies should be reported within 48 hours of invoice generation.</p>
              </div>
            </div>
            <div className="space-y-2 border-l border-slate-100 pl-8">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-500">Sub-Total</span>
                <span className="font-black text-slate-800">₹{invoice.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-500">CGST (0%)</span>
                <span className="font-black text-slate-800">₹0.00</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-500">SGST (0%)</span>
                <span className="font-black text-slate-800">₹0.00</span>
              </div>
              <div className="pt-4 border-t-2 border-slate-900 flex justify-between items-center bg-slate-50 p-2 -mx-2 rounded">
                <span className="text-xs font-black text-slate-900 uppercase">Final Total</span>
                <span className="text-xl font-black text-slate-900">₹{invoice.total_amount?.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* SIGNATORY */}
          <div className="mt-auto pt-12">
            <div className="grid grid-cols-3 gap-8">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl group hover:border-indigo-100 transition-all cursor-pointer">
                  <QrCode className="w-16 h-16 text-slate-800 group-hover:text-indigo-600 transition-colors" />
                </div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Scan to Verify</p>
              </div>
              <div className="flex items-end text-[9px] text-slate-400 font-medium italic">
                <p>Computer generated invoice, no manual signature required.</p>
              </div>
              <div className="text-right space-y-16">
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-tighter">For InfraPilot (Admin Panel)</p>
                <div className="border-t-2 border-slate-900 pt-2">
                  <p className="text-[10px] font-black text-slate-900 uppercase">Authorized Signatory</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .modal-container { box-shadow: none !important; border: none !important; padding: 0 !important; max-width: 100% !important; margin: 0 !important; }
          #view-invoice-printable { border: none !important; box-shadow: none !important; width: 100% !important; margin: 0 !important; padding: 0 !important; min-height: auto !important; }
          body { visibility: hidden; }
          #view-invoice-printable, #view-invoice-printable * { visibility: visible; }
          #view-invoice-printable { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </Modal>
  );
};

export default ViewInvoiceModal;
