import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import type { CreateDsrRequest } from "../../types/dsr";
import toast from "react-hot-toast";

interface NewDSREntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dsrData: CreateDsrRequest) => Promise<void>;
  projectId: number;
}

const NewDSREntryModal = ({
  isOpen,
  onClose,
  onSubmit,
  projectId,
}: NewDSREntryModalProps) => {
  const [formData, setFormData] = useState<CreateDsrRequest>({
    project_id: projectId,
    report_date: new Date().toISOString().split("T")[0],
    site_location: "",
    contractor_id: 1,
    weather: "Sunny",
    work_done: "",
    work_planned: "",
    machinery_used: "",
    material_received: "",
    material_used: "",
    issues: "",
    safety_observations: "",
    remarks: "",
    latitude: 18.5204,
    longitude: 73.8567,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "capturing" | "captured" | "error"
  >("idle");

  useEffect(() => {
    setFormData((prev) => ({ ...prev, project_id: projectId }));
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      captureGPS();
    }
  }, [isOpen]);

  const captureGPS = () => {
    setGpsStatus("capturing");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setFormData((prev) => ({ ...prev, latitude, longitude }));
          setGpsStatus("captured");
        },
        () => {
          setFormData((prev) => ({ ...prev, latitude: 18.5204, longitude: 73.8567 }));
          setGpsStatus("error");
          toast.error("GPS unavailable. Using default location.");
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      setFormData((prev) => ({ ...prev, latitude: 18.5204, longitude: 73.8567 }));
      setGpsStatus("error");
    }
  };

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
    if (!formData.machinery_used || !formData.machinery_used.trim()) errs.machinery_used = "Required";
    if (!formData.material_received || !formData.material_received.trim()) errs.material_received = "Required";
    if (!formData.material_used || !formData.material_used.trim()) errs.material_used = "Required";
    if (!formData.issues || !formData.issues.trim()) errs.issues = "Required";
    if (!formData.safety_observations || !formData.safety_observations.trim()) errs.safety_observations = "Required";
    if (!formData.remarks || !formData.remarks.trim()) errs.remarks = "Required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("DSR creation error:", error);
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
        form="dsr-form"
        type="submit"
        disabled={isLoading}
        className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}
      >
        {isLoading ? "Creating..." : "Create DSR Entry"}
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
      title="New DSR Entry"
      footer={modalFooter}
      maxWidth="max-w-4xl"
    >
      <form id="dsr-form" onSubmit={handleSubmit} noValidate className="space-y-6">
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
                value={formData.report_date}
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
                value={formData.site_location}
                onChange={handleChange}
                placeholder="e.g. Tower A - Basement"
                className={inputClasses(errors.site_location)}
              />
              {errors.site_location && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.site_location}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>
                Weather Condition <span className="text-rose-500">*</span>
              </label>
              <select
                name="weather"
                value={formData.weather}
                onChange={handleChange}
                className={inputClasses(errors.weather)}
              >
                <option value="">Select Weather</option>
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
            <div className="flex items-end pb-1">
              <div className="flex flex-col gap-1 w-full">
                <div className="flex items-center justify-between px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${gpsStatus === "captured" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : gpsStatus === "capturing" ? "bg-amber-500 animate-pulse" : "bg-rose-500"}`}></span>
                    GPS: {gpsStatus.toUpperCase()}
                  </div>
                  <button type="button" onClick={captureGPS} className="text-primary hover:text-blue-700 transition-colors tracking-normal normal-case font-bold text-xs">
                    Recapture
                  </button>
                </div>
              </div>
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
                value={formData.work_done}
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
                value={formData.work_planned}
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
              <label className={labelClasses}>
                Machinery Used <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="machinery_used"
                value={formData.machinery_used}
                onChange={handleChange}
                placeholder="e.g. 1x JCB, 2x Concrete Mixers"
                className={inputClasses(errors.machinery_used)}
              />
              {errors.machinery_used && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.machinery_used}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>
                Material Received <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="material_received"
                value={formData.material_received}
                onChange={handleChange}
                placeholder="List materials received..."
                rows={2}
                className={`${inputClasses(errors.material_received)} resize-none`}
              />
              {errors.material_received && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.material_received}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>
                Material Consumed <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="material_used"
                value={formData.material_used}
                onChange={handleChange}
                placeholder="List materials consumed..."
                rows={2}
                className={`${inputClasses(errors.material_used)} resize-none`}
              />
              {errors.material_used && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.material_used}</p>
              )}
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
              <label className={labelClasses}>
                Site Issues / Bottlenecks <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="issues"
                value={formData.issues}
                onChange={handleChange}
                placeholder="Describe any issues faced..."
                rows={2}
                className={`${inputClasses(errors.issues)} resize-none`}
              />
              {errors.issues && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.issues}</p>
              )}
            </div>
            <div>
              <label className={labelClasses}>
                Safety Observations <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="safety_observations"
                value={formData.safety_observations}
                onChange={handleChange}
                placeholder="Any safety concerns or audits..."
                rows={2}
                className={`${inputClasses(errors.safety_observations)} resize-none`}
              />
              {errors.safety_observations && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.safety_observations}</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className={labelClasses}>
                General Remarks <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Additional notes..."
                rows={2}
                className={`${inputClasses(errors.remarks)} resize-none`}
              />
              {errors.remarks && (
                <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.remarks}</p>
              )}
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default NewDSREntryModal;
