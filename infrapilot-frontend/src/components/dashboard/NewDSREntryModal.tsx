import { useState, useEffect, useRef } from "react";
import Modal from "../common/Modal";
import type { CreateDsrRequest } from "../../types/dsr";
import { dsrService } from "../../services/dsrService";
import { projectService } from "../../services/projectService";
import toast from "react-hot-toast";
import { X as XIcon, Upload, RotateCcw } from "lucide-react";

interface NewDSREntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: number;
}

const NewDSREntryModal = ({
  isOpen,
  onClose,
  onSuccess,
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
    resolved_address: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<
    "idle" | "capturing" | "captured" | "error"
  >("idle");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projects, setProjects] = useState<any[]>([]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, project_id: projectId }));
  }, [projectId]);

  useEffect(() => {
    if (isOpen) {
      captureGPS();
      setPhotoFile(null);
      setPhotoPreview(null);
      setFormData(prev => ({
        ...prev,
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
      }));

      const fetchDropdowns = async () => {
        try {
          const pData = await projectService.getProjects(100, 0);
          setProjects(Array.isArray(pData) ? pData : (pData?.items || []));
        } catch (e) {
          console.error("Failed to load projects/contractors", e);
        }
      };
      fetchDropdowns();
    }
  }, [isOpen]);

  const captureGPS = () => {
    setGpsStatus("capturing");
    setFormData((prev) => ({ ...prev, resolved_address: undefined }));
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const address = data.display_name || "";

            setFormData((prev) => ({
              ...prev,
              latitude,
              longitude,
              resolved_address: address,
              site_location: address,
            }));
            setGpsStatus("captured");
          } catch (err) {
            setFormData((prev) => ({ ...prev, latitude, longitude }));
            setGpsStatus("captured");
          }
        },
        () => {
          setGpsStatus("error");
        },
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 0 }
      );
    } else {
      setGpsStatus("error");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: (name === "contractor_id" || name === "project_id") ? Number(value) : value }));
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
    if (!formData.site_location || !formData.site_location.trim()) errs.site_location = "Site Location is required";
    if (!formData.work_done || !formData.work_done.trim()) errs.work_done = "Work Done is required";
    if (!formData.work_planned || !formData.work_planned.trim()) errs.work_planned = "Work Planned is required";
    if (!formData.weather) errs.weather = "Weather condition is required";
    if (!formData.contractor_id) errs.contractor_id = "Contractor ID is required";
    if (!formData.machinery_used || !formData.machinery_used.trim()) errs.machinery_used = "Machinery Used is required";
    if (!formData.material_received || !formData.material_received.trim()) errs.material_received = "Material Received is required";
    if (!formData.material_used || !formData.material_used.trim()) errs.material_used = "Material Consumed is required";
    if (!formData.issues || !formData.issues.trim()) errs.issues = "Issues / Delays is required";
    if (!formData.safety_observations || !formData.safety_observations.trim()) errs.safety_observations = "Safety Observations is required";
    if (!formData.remarks || !formData.remarks.trim()) errs.remarks = "Engineer Remarks is required";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required fields correctly.");
      return;
    }
    setIsLoading(true);
    const tid = toast.loading("Creating DSR...");
    try {
      // Create the DSR entry (JSON body)
      const newDsr = await dsrService.createDsr(formData);
      
      // Upload photo if selected
      if (photoFile) {
        toast.loading("Uploading photo...", { id: tid });
        await dsrService.uploadDsrPhoto(newDsr.id, photoFile);
      }

      toast.success("DSR entry created successfully!", { id: tid });
      onSuccess();
    } catch (error) {
      console.error("DSR creation error:", error);
      toast.error("Failed to create DSR", { id: tid });
    } finally {
      setIsLoading(false);
    }
  };

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
      maxWidth="max-w-4xl"
      footer={
        <>
          <button type="button" onClick={onClose} disabled={isLoading} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button form="dsr-form" type="submit" disabled={isLoading} className={`px-8 py-2.5 bg-primary text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'}`}>
            {isLoading ? "Creating..." : "Create DSR Entry"}
          </button>
        </>
      }
    >
      <form id="dsr-form" onSubmit={handleSubmit} noValidate className="space-y-6">
        
        {/* Basic Info */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClasses}>Project <span className="text-rose-500">*</span></label>
              <select name="project_id" value={formData.project_id} onChange={handleChange} className={inputClasses(errors.project_id)}>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.project_name || p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClasses}>Report Date <span className="text-rose-500">*</span></label>
              <input required type="date" name="report_date" value={formData.report_date} onChange={handleChange} className={inputClasses(errors.report_date)} />
              {errors.report_date && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.report_date}</p>}
            </div>
            <div>
              <label className={labelClasses}>Contractor ID <span className="text-rose-500">*</span></label>
              <input required type="number" name="contractor_id" value={formData.contractor_id} onChange={handleChange} className={inputClasses(errors.contractor_id)} />
              {errors.contractor_id && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.contractor_id}</p>}
            </div>
            <div>
              <label className={labelClasses}>Site Location <span className="text-rose-500">*</span></label>
              <input required type="text" name="site_location" value={formData.site_location} onChange={handleChange} placeholder="e.g. Pune Site A - Phase 1" className={inputClasses(errors.site_location)} />
              {errors.site_location && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.site_location}</p>}
            </div>
            <div>
              <label className={labelClasses}>Weather Condition <span className="text-rose-500">*</span></label>
              <select name="weather" value={formData.weather} onChange={handleChange} className={inputClasses(errors.weather)}>
                <option value="Sunny">Sunny</option>
                <option value="Rainy">Rainy</option>
                <option value="Cloudy">Cloudy</option>
                <option value="Windy">Windy</option>
                <option value="Foggy">Foggy</option>
                <option value="Stormy">Stormy</option>
              </select>
            </div>
          </div>
          
          <div className="mt-4 flex flex-col gap-2 px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${gpsStatus === "captured" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : gpsStatus === "capturing" ? "bg-amber-500 animate-pulse" : "bg-rose-500"}`}></span>
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-[0.1em]">GPS: {gpsStatus.toUpperCase()}</span>
              </div>
              <button type="button" onClick={captureGPS} className="text-primary hover:text-blue-700 transition-colors font-black text-[10px] uppercase tracking-widest bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-sm flex items-center gap-1.5 active:scale-95 transition-all">
                <RotateCcw className="w-2.5 h-2.5" /> RECAPTURE
              </button>
            </div>
            {(formData.latitude || formData.longitude) && (
              <div className="flex flex-col gap-2 mt-1 border-t border-slate-100 pt-2">
                {(formData.resolved_address || gpsStatus === "capturing" || gpsStatus === "captured") && (
                  <div className="bg-emerald-50/50 px-3 py-2.5 rounded-xl border border-emerald-100/50">
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">LIVE CAPTURED ADDRESS</p>
                    <p className="text-[11px] font-bold text-slate-700 leading-relaxed min-h-[1.5em]">
                      {gpsStatus === "capturing" && !formData.resolved_address
                        ? "Resolving location address..."
                        : formData.resolved_address || (gpsStatus === "captured" ? "Site location identified (Address details pending...)" : "Awaiting GPS signal...")}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Work Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Work Progress</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Work Done Today <span className="text-rose-500">*</span></label>
              <textarea required name="work_done" value={formData.work_done} onChange={handleChange} placeholder="Describe work completed today..." rows={3} className={`${inputClasses(errors.work_done)} resize-none`} />
            </div>
            <div>
              <label className={labelClasses}>Work Planned for Tomorrow <span className="text-rose-500">*</span></label>
              <textarea required name="work_planned" value={formData.work_planned} onChange={handleChange} placeholder="Describe work planned for tomorrow..." rows={2} className={`${inputClasses(errors.work_planned)} resize-none`} />
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Resources Used</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>Machinery Used <span className="text-rose-500">*</span></label>
              <input type="text" name="machinery_used" value={formData.machinery_used} onChange={handleChange} placeholder="e.g. 2 Excavators, 1 Crane" className={inputClasses(errors.machinery_used)} />
              {errors.machinery_used && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.machinery_used}</p>}
            </div>
            <div className="hidden md:block"></div>
            <div>
              <label className={labelClasses}>Material Received <span className="text-rose-500">*</span></label>
              <textarea name="material_received" value={formData.material_received} onChange={handleChange} placeholder="Details of materials received today" rows={2} className={`${inputClasses(errors.material_received)} resize-none`} />
              {errors.material_received && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.material_received}</p>}
            </div>
            <div>
              <label className={labelClasses}>Material Consumed <span className="text-rose-500">*</span></label>
              <textarea name="material_used" value={formData.material_used} onChange={handleChange} placeholder="Details of materials consumed today" rows={2} className={`${inputClasses(errors.material_used)} resize-none`} />
              {errors.material_used && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.material_used}</p>}
            </div>
          </div>
        </div>

        {/* Issues & Safety */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">Issues & Safety</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClasses}>Issues / Delays <span className="text-rose-500">*</span></label>
              <textarea name="issues" value={formData.issues} onChange={handleChange} placeholder="Report any issues or delays..." rows={2} className={`${inputClasses(errors.issues)} resize-none`} />
              {errors.issues && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.issues}</p>}
            </div>
            <div>
              <label className={labelClasses}>Safety Observations <span className="text-rose-500">*</span></label>
              <textarea name="safety_observations" value={formData.safety_observations} onChange={handleChange} placeholder="Any safety concerns or observations..." rows={2} className={`${inputClasses(errors.safety_observations)} resize-none`} />
              {errors.safety_observations && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.safety_observations}</p>}
            </div>
            <div>
              <label className={labelClasses}>Engineer Remarks <span className="text-rose-500">*</span></label>
              <textarea name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Additional notes..." rows={2} className={`${inputClasses(errors.remarks)} resize-none`} />
              {errors.remarks && <p className="mt-1 text-[10px] text-rose-500 font-bold ml-1">{errors.remarks}</p>}
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2 flex items-center justify-between">
            Site Photo
            {photoPreview && (
              <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="text-rose-500 hover:text-rose-600 transition-colors">
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </h3>
          <div className="flex flex-col items-center justify-center">
            {photoPreview ? (
              <div className="relative w-full md:w-1/2 aspect-video rounded-xl overflow-hidden border border-slate-100 shadow-sm group">
                <img src={photoPreview} alt="Site" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-white text-slate-800 rounded-xl text-xs font-bold shadow-xl active:scale-95 transition-all">
                    Change Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-6">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setPhotoFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => setPhotoPreview(reader.result as string);
                    reader.readAsDataURL(file);
                  }
                }} />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-4 bg-slate-50/50 hover:bg-slate-50 hover:border-primary/50 transition-all group">
                  <div className="p-4 bg-white rounded-full shadow-sm text-slate-400 group-hover:text-primary group-hover:scale-110 transition-all">
                    <Upload className="w-8 h-8" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-600">Upload Site Progress Photo</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default NewDSREntryModal;
