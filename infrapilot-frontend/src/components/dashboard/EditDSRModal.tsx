import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import type { DsrItem, UpdateDsrRequest } from "../../types/dsr";

interface EditDSRModalProps {
  isOpen: boolean;
  onClose: () => void;
  dsr: DsrItem | null;
  onSubmit: (id: number, dsrData: UpdateDsrRequest) => Promise<void>;
}

const EditDSRModal = ({ isOpen, onClose, dsr, onSubmit }: EditDSRModalProps) => {
  const [formData, setFormData] = useState<UpdateDsrRequest>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (dsr) {
      setFormData({
        report_date: dsr.report_date,
        site_location: dsr.site_location,
        contractor_id: dsr.contractor_id,
        weather: dsr.weather,
        work_done: dsr.work_done,
        work_planned: dsr.work_planned,
        machinery_used: dsr.machinery_used,
        material_received: dsr.material_received,
        material_used: dsr.material_used,
        issues: dsr.issues,
        safety_observations: dsr.safety_observations,
        remarks: dsr.remarks,
        latitude: dsr.latitude,
        longitude: dsr.longitude,
      });
    }
  }, [dsr]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.report_date) errs.report_date = "Report Date is required";
    if (!formData.site_location || !formData.site_location.trim())
      errs.site_location = "Site Location is required";
    if (!formData.work_done || !formData.work_done.trim())
      errs.work_done = "Work Done is required";
    if (!formData.work_planned || !formData.work_planned.trim())
      errs.work_planned = "Work Planned is required";
    if (!formData.weather) errs.weather = "Weather condition is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dsr || !validate()) return;
    setIsLoading(true);
    try {
      await onSubmit(dsr.id, formData);
    } catch (error) {
      console.error("DSR update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const modalFooter = (
    <>
      <button
        type="button"
        onClick={onClose}
        disabled={isLoading}
        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        form="edit-dsr-form"
        type="submit"
        disabled={isLoading}
        className={`px-8 py-2.5 bg-amber-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
      >
        {isLoading ? "Saving..." : "Update DSR Entry"}
      </button>
    </>
  );

  const labelClasses = "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1";
  const inputClasses = (error?: string) => `
    w-full px-4 py-2.5 bg-white border 
    ${error ? 'border-rose-300 focus:ring-rose-200' : 'border-slate-200 focus:ring-primary/20 focus:border-primary'} 
    rounded-xl text-sm outline-none transition-all placeholder:text-slate-300
  `;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit DSR Entry"
      footer={modalFooter}
      maxWidth="max-w-4xl"
    >
      <form
        id="edit-dsr-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        {/* Basic Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>
                Report Date <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="date"
                name="report_date"
                value={formData.report_date || ""}
                onChange={handleChange}
                className={inputClasses(errors.report_date)}
              />
              {errors.report_date && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.report_date}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>
                Site Location <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                name="site_location"
                value={formData.site_location || ""}
                onChange={handleChange}
                placeholder="e.g. Tower A - Basement"
                className={inputClasses(errors.site_location)}
              />
              {errors.site_location && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.site_location}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>Weather Condition</label>
              <select
                name="weather"
                value={formData.weather || "Sunny"}
                onChange={handleChange}
                className={inputClasses(errors.weather)}
              >
                <option value="Sunny">Sunny</option>
                <option value="Cloudy">Cloudy</option>
                <option value="Rainy">Rainy</option>
                <option value="Foggy">Foggy</option>
                <option value="Stormy">Stormy</option>
              </select>
              {errors.weather && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.weather}</p>
              )}
            </div>
          </div>
        </div>

        {/* Work Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Work Progress
          </h3>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>
                Work Done Today <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                name="work_done"
                value={formData.work_done || ""}
                onChange={handleChange}
                placeholder="Describe work completed today..."
                rows={3}
                className={`${inputClasses(errors.work_done)} resize-none`}
              />
              {errors.work_done && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.work_done}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>
                Work Planned for Tomorrow <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                name="work_planned"
                value={formData.work_planned || ""}
                onChange={handleChange}
                placeholder="Describe work planned for next shift..."
                rows={2}
                className={`${inputClasses(errors.work_planned)} resize-none`}
              />
              {errors.work_planned && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.work_planned}</p>
              )}
            </div>
          </div>
        </div>

        {/* Resource Tracking */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Resource Tracking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClasses}>Machinery Used</label>
              <input
                type="text"
                name="machinery_used"
                value={formData.machinery_used || ""}
                onChange={handleChange}
                placeholder="e.g. 1x JCB, 2x Concrete Mixers"
                className={inputClasses()}
              />
            </div>
            <div>
              <label className={labelClasses}>Material Received</label>
              <textarea
                name="material_received"
                value={formData.material_received || ""}
                onChange={handleChange}
                placeholder="List materials received..."
                rows={2}
                className={`${inputClasses()} resize-none`}
              />
            </div>
            <div>
              <label className={labelClasses}>Material Consumed</label>
              <textarea
                name="material_used"
                value={formData.material_used || ""}
                onChange={handleChange}
                placeholder="List materials consumed..."
                rows={2}
                className={`${inputClasses()} resize-none`}
              />
            </div>
          </div>
        </div>

        {/* Issues & Observations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Issues & Observations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Site Issues / Bottlenecks</label>
              <textarea
                name="issues"
                value={formData.issues || ""}
                onChange={handleChange}
                placeholder="Describe any issues faced..."
                rows={2}
                className={`${inputClasses()} resize-none`}
              />
            </div>
            <div>
              <label className={labelClasses}>Safety Observations</label>
              <textarea
                name="safety_observations"
                value={formData.safety_observations || ""}
                onChange={handleChange}
                placeholder="Any safety concerns or audits..."
                rows={2}
                className={`${inputClasses()} resize-none`}
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>General Remarks</label>
              <textarea
                name="remarks"
                value={formData.remarks || ""}
                onChange={handleChange}
                placeholder="Additional notes..."
                rows={2}
                className={`${inputClasses()} resize-none`}
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditDSRModal;
