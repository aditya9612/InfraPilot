import { useState, useEffect } from "react";
import { FileText, Package, Users, Truck } from "lucide-react";
import { quotationService } from "../../services/quotationService";
import Modal from "../../components/common/Modal";

export default function QuotationViewModal({ quotationId, onClose }: { quotationId: number | null; onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await quotationService.getQuotationPreview(quotationId!);
        setData(res);
      } catch (err) {
        console.error("Failed to load quotation details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (quotationId) {
      load();
    } else {
      setData(null);
    }
  }, [quotationId]);

  return (
    <Modal isOpen={!!quotationId} onClose={onClose} title="Invoice / Quotation Profile" maxWidth="max-w-4xl">
      {loading ? (
        <div className="p-20 text-center text-slate-400 font-inter">
          <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Parsing Details...</p>
        </div>
      ) : data ? (
        <div className="p-6 font-inter h-full overflow-y-auto">
          {/* Header card */}
          <div className="bg-primary rounded-2xl p-6 mb-6 text-white shadow-xl relative overflow-hidden">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 bg-blue-400/30 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 relative flex-shrink-0">
                <FileText className="w-10 h-10 text-white" />
                <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${data.is_approved ? 'bg-emerald-500' : 'bg-rose-500'} border-4 border-primary rounded-full`} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold tracking-tight">{data.client_name || 'Client Name'}</h3>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${data.is_approved ? 'bg-emerald-500/30 text-emerald-100' : 'bg-amber-500/30 text-amber-100'}`}>{data.status}</span>
                </div>
                <p className="text-white/70 text-xs font-bold mb-2">{data.quotation_no || data.invoice_number ? `Quotation / Invoice #${data.quotation_no || data.invoice_number}` : 'No Identifier'}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">{data.project_name || '—'}</span>
                  <span className="px-2.5 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-widest">Grand Total: ₹{data.grand_total?.toLocaleString("en-IN") || 0}</span>
                </div>
              </div>
            </div>
          </div>

          {/* All fields */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {([
              { label: 'Quotation No', value: data.quotation_no || data.invoice_number || '—' },
              { label: 'Client Name', value: data.client_name || '—' },
              { label: 'Company', value: data.company_name || '—' },
              { label: 'Mobile', value: data.mobile_number || '—' },
              { label: 'Email', value: data.email || '—' },
              { label: 'Project Name', value: data.project_name || '—' },
              { label: 'Project Type', value: data.project_type || '—' },
              { label: 'Status', value: data.status || '—' },
              { label: 'Created At', value: data.created_at ? data.created_at.substring(0, 10) : '—' },
              { label: 'Subtotal (₹)', value: data.subtotal != null ? `₹${data.subtotal.toLocaleString("en-IN")}` : '—' },
              { label: `GST (${data.gst_percent || 0}%)`, value: data.gst_amount != null ? `₹${data.gst_amount.toLocaleString("en-IN")}` : '—' },
              { label: 'Discount (₹)', value: data.discount_amount != null ? `-₹${data.discount_amount.toLocaleString("en-IN")}` : '—' },
              { label: `TDS (${data.tds_percent || 0}%)`, value: data.tds_amount != null ? `₹${data.tds_amount.toLocaleString("en-IN")}` : '—' },
              { label: 'Advance Paid (₹)', value: data.advance_paid != null ? `₹${data.advance_paid.toLocaleString("en-IN")}` : '—' },
              { label: 'Grand Total (₹)', value: data.grand_total != null ? `₹${data.grand_total.toLocaleString("en-IN")}` : '—', highlight: true },
              { label: 'Balance Due (₹)', value: data.balance_due != null ? `₹${data.balance_due.toLocaleString("en-IN")}` : '—', highlight: true },
              { label: 'Payment Mode', value: data.payment_mode || '—' },
              { label: 'Due Date', value: data.due_date || '—' },
              ...(data.payment_mode === "UPI" ? [{ label: 'UPI ID', value: data.upi_id || '—' }] : []),
              ...(data.payment_mode === "Bank Transfer" || data.bank_name ? [
                { label: 'Bank Name', value: data.bank_name || '—' },
                { label: 'Account Number', value: data.account_number || '—' },
                { label: 'IFSC Code', value: data.ifsc_code || '—' },
              ] : []),
            ] as { label: string; value: any; highlight?: boolean }[]).map(({ label, value, highlight }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                <p className={`text-sm font-bold truncate ${highlight ? 'text-emerald-600' : 'text-slate-800'}`}>{String(value)}</p>
              </div>
            ))}

            <div className="col-span-full bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing Address</p>
              <p className="text-sm font-bold text-slate-800">{data.billing_address || '—'}</p>
            </div>

            <div className="col-span-full bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Site Address</p>
              <p className="text-sm font-bold text-slate-800">{data.site_address || '—'}</p>
            </div>
          </div>

          {/* BOQ Items */}
          {data.items && data.items.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-6">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-slate-800 text-sm">Measurement / BOQ Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-100">
                    <tr>
                      {["Type", "Title", "Description", "Unit", "Qty", "Rate", "Amount"].map(h => (
                        <th key={h} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.items.map((it: any) => (
                      <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase">{it.item_type}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{it.title}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[200px] truncate" title={it.description}>{it.description || "—"}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600">{it.unit}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right">{it.quantity}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">₹{it.rate?.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹{it.amount?.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Labour Items */}
          {data.labour_items && data.labour_items.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-6">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-slate-800 text-sm">Labour Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-100">
                    <tr>
                      {["Skill Type", "Count", "Days", "Daily Wage", "Overtime (Hrs)", "Notes", "Amount"].map(h => (
                        <th key={h} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.labour_items.map((it: any) => (
                      <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{it.skill_type}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">{it.labour_count}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">{it.labour_days}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">₹{it.daily_wage?.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-[11px] font-medium text-slate-500 text-right">{it.overtime_hours} <span className="opacity-70">(@ ₹{it.overtime_rate})</span></td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate" title={it.notes}>{it.notes || "—"}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹{it.amount?.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Material Items */}
          {data.material_items && data.material_items.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-6">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                <h3 className="font-bold text-slate-800 text-sm">Material Details</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-100">
                    <tr>
                      {["Material", "Category", "Unit", "Qty", "Rate", "Notes", "Amount"].map(h => (
                        <th key={h} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.material_items.map((it: any) => (
                      <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{it.material_name}</td>
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase">{it.category}</td>
                        <td className="px-4 py-3 text-xs font-medium text-slate-600">{it.unit}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right">{it.estimated_quantity}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">₹{it.estimated_rate?.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate" title={it.notes}>{it.notes || "—"}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹{it.estimated_amount?.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Extra Charges */}
          {data.extra_charge_items && data.extra_charge_items.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mb-6">
              <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-slate-800 text-sm">Extra Charges</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white border-b border-slate-100">
                    <tr>
                      {["Type", "Description", "Qty", "Rate", "Notes", "Amount"].map(h => (
                        <th key={h} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.extra_charge_items.map((it: any) => (
                      <tr key={it.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-bold text-slate-600 uppercase">{it.expense_type}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800">{it.description}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right">{it.quantity}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-600 text-right">₹{it.rate?.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 max-w-[150px] truncate" title={it.notes}>{it.notes || "—"}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-800 text-right">₹{it.amount?.toLocaleString("en-IN")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-5 bg-primary text-white rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-primary/20 active:scale-95 font-inter mb-2 mt-4"
          >
            Dismiss Insight
          </button>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500 font-semibold font-inter">No data found</div>
      )}
    </Modal>
  );
}
