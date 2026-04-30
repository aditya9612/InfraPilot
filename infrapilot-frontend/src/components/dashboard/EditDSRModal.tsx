// import { useState, useEffect } from "react";
// import Modal from "../common/Modal";
// import type { DsrItem, UpdateDsrRequest } from "../../types/dsr";

// interface EditDSRModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   dsr: DsrItem | null;
//   onSubmit: (id: number, dsrData: UpdateDsrRequest) => Promise<void>;
// }

// const EditDSRModal = ({
//   isOpen,
//   onClose,
//   dsr,
//   onSubmit,
// }: EditDSRModalProps) => {
//   const [formData, setFormData] = useState<UpdateDsrRequest>({});
//   const [errors, setErrors] = useState<Record<string, string>>({});
//   const [isLoading, setIsLoading] = useState(false);

//   useEffect(() => {
//     if (dsr) {
//       setFormData({
//         report_date: dsr.report_date,
//         site_location: dsr.site_location,
//         contractor_id: dsr.contractor_id,
//         weather: dsr.weather,
//         work_done: dsr.work_done,
//         work_planned: dsr.work_planned,
//         machinery_used: dsr.machinery_used,
//         material_received: dsr.material_received,
//         material_used: dsr.material_used,
//         issues: dsr.issues,
//         safety_observations: dsr.safety_observations,
//         remarks: dsr.remarks,
//         latitude: dsr.latitude,
//         longitude: dsr.longitude,
//         skilled_labour: dsr.skilled_labour || 0,
//         unskilled_labour: dsr.unskilled_labour || 0,
//         total_labour: dsr.total_labour || 0,
//       });
//     }
//   }, [dsr]);

//   // Update total labour when skilled or unskilled changes
//   useEffect(() => {
//     setFormData(prev => ({
//       ...prev,
//       total_labour: Number(prev.skilled_labour || 0) + Number(prev.unskilled_labour || 0)
//     }));
//   }, [formData.skilled_labour, formData.unskilled_labour]);

//   const handleChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
//   ) => {
//     const { name, value, type } = e.target;
//     const finalValue = type === "number" ? (value === "" ? 0 : Number(value)) : value;

//     setFormData((prev) => ({ ...prev, [name]: finalValue }));

//     if (errors[name]) {
//       setErrors((prev) => {
//         const { [name]: _, ...rest } = prev;
//         return rest;
//       });
//     }
//   };

//   const validate = () => {
//     const errs: Record<string, string> = {};
//     if (!formData.report_date) errs.report_date = "Report Date is required";
//     if (!formData.site_location?.trim()) errs.site_location = "Site Location is required";
//     if (!formData.work_done?.trim()) errs.work_done = "Work Done is required";

//     setErrors(errs);
//     return Object.keys(errs).length === 0;
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!dsr || !validate()) return;

//     setIsLoading(true);
//     try {
//       await onSubmit(dsr.id, formData);
//       onClose();
//     } catch (error) {
//       console.error("DSR update error:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const modalFooter = (
//     <>
//       <button
//         type="button"
//         onClick={onClose}
//         className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
//       >
//         Cancel
//       </button>
//       <button
//         form="edit-dsr-form"
//         type="submit"
//         disabled={isLoading}
//         className="px-5 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
//       >
//         {isLoading ? "Saving..." : "Update DSR Entry"}
//       </button>
//     </>
//   );

//   return (
//     <Modal
//       isOpen={isOpen}
//       onClose={onClose}
//       title="Edit DSR Entry"
//       footer={modalFooter}
//       maxWidth="max-w-4xl"
//     >
//       <form id="edit-dsr-form" onSubmit={handleSubmit} noValidate className="space-y-6">
//         {/* Basic Info */}
//         <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
//           <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
//             Basic Information
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Report Date <span className="text-red-500">*</span>
//               </label>
//               <input
//                 required
//                 type="date"
//                 name="report_date"
//                 value={formData.report_date || ""}
//                 onChange={handleChange}
//                 className={`w-full px-3 py-2 bg-slate-50 border ${errors.report_date ? "border-red-500" : "border-slate-200"} rounded-lg text-sm outline-none transition-all`}
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Site Location <span className="text-red-500">*</span>
//               </label>
//               <input
//                 required
//                 type="text"
//                 name="site_location"
//                 value={formData.site_location || ""}
//                 onChange={handleChange}
//                 placeholder="e.g. Tower A - Basement"
//                 className={`w-full px-3 py-2 bg-slate-50 border ${errors.site_location ? "border-red-500" : "border-slate-200"} rounded-lg text-sm outline-none transition-all`}
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Weather Condition
//               </label>
//               <select
//                 name="weather"
//                 value={formData.weather || "Sunny"}
//                 onChange={handleChange}
//                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all"
//               >
//                 <option value="Sunny">Sunny</option>
//                 <option value="Cloudy">Cloudy</option>
//                 <option value="Rainy">Rainy</option>
//                 <option value="Stormy">Stormy</option>
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Labor Tracking */}
//         <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
//           <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
//             Labor Tracking
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Skilled Labor
//               </label>
//               <input
//                 type="number"
//                 name="skilled_labour"
//                 value={formData.skilled_labour || 0}
//                 onChange={handleChange}
//                 min="0"
//                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all"
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Unskilled Labor
//               </label>
//               <input
//                 type="number"
//                 name="unskilled_labour"
//                 value={formData.unskilled_labour || 0}
//                 onChange={handleChange}
//                 min="0"
//                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all"
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Total Labor (Auto)
//               </label>
//               <input
//                 type="number"
//                 readOnly
//                 value={formData.total_labour || 0}
//                 className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 outline-none"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Work Progress */}
//         <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
//           <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
//             Work Progress
//           </h3>
//           <div className="space-y-4">
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Work Done Today <span className="text-red-500">*</span>
//               </label>
//               <textarea
//                 required
//                 name="work_done"
//                 value={formData.work_done || ""}
//                 onChange={handleChange}
//                 placeholder="Describe work completed today..."
//                 rows={3}
//                 className={`w-full px-3 py-2 bg-slate-50 border ${errors.work_done ? "border-red-500" : "border-slate-200"} rounded-lg text-sm outline-none transition-all resize-none`}
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Work Planned for Tomorrow
//               </label>
//               <textarea
//                 name="work_planned"
//                 value={formData.work_planned || ""}
//                 onChange={handleChange}
//                 placeholder="Describe work planned for next shift..."
//                 rows={2}
//                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all resize-none"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Resource Tracking */}
//         <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
//           <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
//             Resource Tracking
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div className="md:col-span-2">
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Machinery Used
//               </label>
//               <input
//                 type="text"
//                 name="machinery_used"
//                 value={formData.machinery_used || ""}
//                 onChange={handleChange}
//                 placeholder="e.g. 1x JCB, 2x Concrete Mixers"
//                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all"
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Material Received
//               </label>
//               <textarea
//                 name="material_received"
//                 value={formData.material_received || ""}
//                 onChange={handleChange}
//                 placeholder="List materials received..."
//                 rows={2}
//                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all resize-none"
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Material Consumed
//               </label>
//               <textarea
//                 name="material_used"
//                 value={formData.material_used || ""}
//                 onChange={handleChange}
//                 placeholder="List materials consumed..."
//                 rows={2}
//                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all resize-none"
//               />
//             </div>
//           </div>
//         </div>

//         {/* Issues & Observations */}
//         <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
//           <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
//             Issues & Observations
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Site Issues / Bottlenecks
//               </label>
//               <textarea
//                 name="issues"
//                 value={formData.issues || ""}
//                 onChange={handleChange}
//                 placeholder="Describe any issues faced..."
//                 rows={2}
//                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all resize-none"
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 Safety Observations
//               </label>
//               <textarea
//                 name="safety_observations"
//                 value={formData.safety_observations || ""}
//                 onChange={handleChange}
//                 placeholder="Any safety concerns or audits..."
//                 rows={2}
//                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all resize-none"
//               />
//             </div>
//             <div className="md:col-span-2">
//               <label className="block text-xs font-bold text-slate-500 mb-1">
//                 General Remarks
//               </label>
//               <textarea
//                 name="remarks"
//                 value={formData.remarks || ""}
//                 onChange={handleChange}
//                 placeholder="Additional notes..."
//                 rows={2}
//                 className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all resize-none"
//               />
//             </div>
//           </div>
//         </div>
//       </form>
//     </Modal>
//   );
// };

// export default EditDSRModal;


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
    
    // GPS check for edit (might already have coordinates, but just in case)
    if (formData.latitude === 0 && formData.longitude === 0) {
      errs.gps = "GPS location is required.";
    }

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
        className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
      >
        Cancel
      </button>
      <button
        form="edit-dsr-form"
        type="submit"
        disabled={isLoading}
        className="px-5 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 shadow-md shadow-amber-500/20 transition-all disabled:opacity-50"
      >
        {isLoading ? "Saving..." : "Update DSR Entry"}
      </button>
    </>
  );

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
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Report Date <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="date"
                name="report_date"
                value={formData.report_date || ""}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.report_date ? "border-red-500" : "border-slate-200"
                  } rounded-lg text-sm outline-none transition-all`}
              />
              {errors.report_date && (
                <p className="text-red-500 text-[10px] mt-1">
                  {errors.report_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Site Location <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="site_location"
                value={formData.site_location || ""}
                onChange={handleChange}
                placeholder="e.g. Tower A - Basement"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.site_location ? "border-red-500" : "border-slate-200"
                  } rounded-lg text-sm outline-none transition-all`}
              />
              {errors.site_location && (
                <p className="text-red-500 text-[10px] mt-1">
                  {errors.site_location}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Weather Condition
              </label>
              <select
                name="weather"
                value={formData.weather || "Sunny"}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.weather ? "border-red-500" : "border-slate-200"
                  } rounded-lg text-sm outline-none transition-all`}
              >
                <option value="Sunny">Sunny</option>
                <option value="Cloudy">Cloudy</option>
                <option value="Rainy">Rainy</option>
                <option value="Foggy">Foggy</option>
                <option value="Stormy">Stormy</option>
              </select>
              {errors.weather && (
                <p className="text-red-500 text-[10px] mt-1">
                  {errors.weather}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Work Progress */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Work Progress
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Work Done Today <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                name="work_done"
                value={formData.work_done || ""}
                onChange={handleChange}
                placeholder="Describe work completed today..."
                rows={3}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.work_done ? "border-red-500" : "border-slate-200"
                  } rounded-lg text-sm outline-none transition-all resize-none`}
              />
              {errors.work_done && (
                <p className="text-red-500 text-[10px] mt-1">
                  {errors.work_done}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Work Planned for Tomorrow
              </label>
              <textarea
                name="work_planned"
                value={formData.work_planned || ""}
                onChange={handleChange}
                placeholder="Describe work planned for next shift..."
                rows={2}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.work_planned ? "border-red-500" : "border-slate-200"
                  } rounded-lg text-sm outline-none transition-all resize-none`}
              />
              {errors.work_planned && (
                <p className="text-red-500 text-[10px] mt-1">
                  {errors.work_planned}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Resource Tracking */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Resource Tracking
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Machinery Used
              </label>
              <input
                type="text"
                name="machinery_used"
                value={formData.machinery_used || ""}
                onChange={handleChange}
                placeholder="e.g. 1x JCB, 2x Concrete Mixers"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Material Received
              </label>
              <textarea
                name="material_received"
                value={formData.material_received || ""}
                onChange={handleChange}
                placeholder="List materials received..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Material Consumed
              </label>
              <textarea
                name="material_used"
                value={formData.material_used || ""}
                onChange={handleChange}
                placeholder="List materials consumed..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Issues & Observations */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Issues & Observations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Site Issues / Bottlenecks
              </label>
              <textarea
                name="issues"
                value={formData.issues || ""}
                onChange={handleChange}
                placeholder="Describe any issues faced..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Safety Observations
              </label>
              <textarea
                name="safety_observations"
                value={formData.safety_observations || ""}
                onChange={handleChange}
                placeholder="Any safety concerns or audits..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all resize-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                General Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks || ""}
                onChange={handleChange}
                placeholder="Additional notes..."
                rows={2}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditDSRModal;



