import React, { useState } from "react";
import Modal from "../common/Modal";

interface ConvertToProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (data: any) => Promise<void>;
  title: string;
}

export default function ConvertToProjectModal({ isOpen, onClose, onSelect, title }: ConvertToProjectModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    owner_id: 1, // Defaulting to 1 for now as asked in plan
    location_type: "URBAN",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    pincode: "411045",
    latitude: 18.5590,
    longitude: 73.7868,
    shift_start_time: "09:00", // Will append :00 later
    shift_end_time: "18:00",
    grace_period_minutes: 15
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ["owner_id", "grace_period_minutes"].includes(name) ? Number(value) :
              ["latitude", "longitude"].includes(name) ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const dataToSubmit = {
        ...formData,
        shift_start_time: formData.shift_start_time + ":00",
        shift_end_time: formData.shift_end_time + ":00"
      };
      await onSelect(dataToSubmit);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Location Type</label>
            <select name="location_type" value={formData.location_type} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-white" required>
              <option value="URBAN">Urban</option>
              <option value="RURAL">Rural</option>
            </select>
          </div>
          
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
            <input name="city" value={formData.city} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-white" required />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">State</label>
            <input name="state" value={formData.state} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-white" required />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Pincode</label>
            <input name="pincode" value={formData.pincode} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-white" required />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Shift Start Time</label>
            <input type="time" name="shift_start_time" value={formData.shift_start_time} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-white" required />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Shift End Time</label>
            <input type="time" name="shift_end_time" value={formData.shift_end_time} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-white" required />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">Grace Period (Mins)</label>
            <input type="number" name="grace_period_minutes" value={formData.grace_period_minutes} onChange={handleChange} className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-primary/20 bg-white" required />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-8">
          <button type="button" onClick={onClose} disabled={loading} className="px-5 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-5 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:bg-primary-hover shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2">
            {loading ? "Converting..." : "Convert to Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
