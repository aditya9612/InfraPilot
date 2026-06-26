import { useState, useEffect } from "react";
import api from "../../services/api";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

export default function InvoiceEditModal({ invoiceId, onClose, onSuccess }: { invoiceId: number | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<any>({
    amount: "",
    gst_percent: "",
    tax_percent: "",
    source_type: "quotation",
    description: ""
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/invoices/${invoiceId}`);
        if (res.data) {
          setFormData({
            amount: res.data.amount || 0,
            gst_percent: res.data.gst_percent || 0,
            tax_percent: res.data.tax_percent || 0,
            source_type: res.data.source_type || "quotation",
            description: res.data.description || ""
          });
        }
      } catch (err) {
        console.error("Failed to load invoice details:", err);
      } finally {
        setLoading(false);
      }
    };
    if (invoiceId) {
      load();
    }
  }, [invoiceId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      
      const payload = {
        amount: Number(formData.amount) || 0,
        gst_percent: Number(formData.gst_percent) || 0,
        tax_percent: Number(formData.tax_percent) || 0,
        source_type: formData.source_type,
        description: formData.description
      };

      await api.put(`/invoices/${invoiceId}`, payload);
      toast.success("Invoice updated successfully!");
      onSuccess();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={!!invoiceId} onClose={onClose} title="Edit Invoice" maxWidth="max-w-xl">
      {loading ? (
        <div className="p-20 text-center text-slate-400 font-inter">
          <div className="inline-block w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-[10px] font-bold uppercase tracking-widest">Loading Details...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 font-inter h-full overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">amount</label>
              <input name="amount" type="number" value={formData.amount} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">gst_percent</label>
              <input name="gst_percent" type="number" step="0.01" value={formData.gst_percent} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">tax_percent</label>
              <input name="tax_percent" type="number" step="0.01" value={formData.tax_percent} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">source_type</label>
              <input name="source_type" value={formData.source_type} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-slate-50" readOnly />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-8">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary/90 rounded-xl transition-colors flex items-center gap-2">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
