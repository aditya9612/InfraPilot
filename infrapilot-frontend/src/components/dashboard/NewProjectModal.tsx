import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Modal from "../common/Modal";
import { ownerService } from "../../services/ownerService";
import type { Owner } from "../../types/owner";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (projectData: any) => void;
}

const NewProjectModal = ({
  isOpen,
  onClose,
  onSubmit,
}: NewProjectModalProps) => {
  const [formData, setFormData] = useState({
    project_name: "",
    owner_id: "",
    description: "",
    type: "RESIDENTIAL",
    location_type: "URBAN",
    site_address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    latitude: "",
    longitude: "",
    start_date: "",
    end_date: "",
    status: "PLANNED",
    shift_start_time: "09:00",
    shift_end_time: "18:00",
    grace_period_minutes: 15,
    budget_amount: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const ownersList = await ownerService.getOwners();
        setOwners(ownersList);
      } catch (error) {
        console.error("Failed to fetch owners:", error);
      }
    };
    fetchOwners();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => {
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.project_name.trim())
      newErrors.project_name = "Project name is required.";
    if (!String(formData.owner_id).trim())
      newErrors.owner_id = "Owner ID is required.";
    if (!formData.description.trim())
      newErrors.description = "Description is required.";
    if (!formData.site_address.trim())
      newErrors.site_address = "Site address is required.";
    if (!formData.city.trim())
      newErrors.city = "City is required.";
    if (!formData.pincode.trim())
      newErrors.pincode = "Pincode is required.";

    if (!formData.start_date) newErrors.start_date = "Start date is required.";
    if (!formData.end_date) newErrors.end_date = "End date is required.";
    else if (formData.start_date && formData.end_date < formData.start_date) {
      newErrors.end_date = "End date cannot be before start date.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Update coordinates state
        setFormData((prev) => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        }));

        // Perform Reverse Geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
                // nominatim requires a user-agent, although browsers send it automatically,
                // we'll explicitly mention it if we were in a node environment, 
                // but in browser fetch we rely on the host's default.
              },
            }
          );
          const data = await response.json();

          if (data && data.address) {
            const addr = data.address;
            setFormData((prev) => ({
              ...prev,
              site_address: data.display_name || prev.site_address,
              city: addr.city || addr.town || addr.village || addr.suburb || prev.city,
              state: addr.state || prev.state,
              country: addr.country || "India",
              pincode: addr.postcode || prev.pincode,
            }));
            toast.success("Location resolved to address!");
          }
        } catch (error) {
          console.error("Reverse geocoding failed:", error);
          // Coordinates are still set, just address failed
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Error fetching location:", error);
        alert("Failed to fetch location. Please ensure location permissions are granted.");
        setIsLoading(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const requestBody = {
        ...formData,
        owner_id: Number(formData.owner_id),
        latitude: formData.latitude ? Number(formData.latitude) : undefined,
        longitude: formData.longitude ? Number(formData.longitude) : undefined,
        grace_period_minutes: Number(formData.grace_period_minutes),
        budget_amount: formData.budget_amount ? Number(formData.budget_amount) : 0,
      };
      if (onSubmit) await onSubmit(requestBody);
      onClose();
    } catch (error) {
      console.error("Project creation error:", error);
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
        form="project-form"
        type="submit"
        disabled={isLoading}
        className="px-5 py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-600 shadow-md shadow-primary/20 transition-all disabled:opacity-50"
      >
        {isLoading ? "Creating..." : "Create Project"}
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      footer={modalFooter}
    >
      <form
        id="project-form"
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6"
      >
        {/* Basic Info */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Project Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="project_name"
                value={formData.project_name}
                onChange={handleChange}
                placeholder="e.g. SARA CITY"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.project_name ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.project_name && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.project_name}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Project Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="ROAD">Road</option>
                <option value="BRIDGE">Bridge</option>
                <option value="INTERIOR">Interior</option>
                <option value="VILLA">Villa</option>
                <option value="APARTMENT">Apartment</option>
                <option value="TOWNSHIP">Township</option>
                <option value="RENOVATION">Renovation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Project Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="PLANNED">PLANNED</option>
                <option value="ONGOING">ONGOING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="ON_HOLD">ON HOLD</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Owner Name <span className="text-red-500">*</span>
              </label>
              <select
                required
                name="owner_id"
                value={formData.owner_id}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.owner_id ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all`}
              >
                <option value="">Select Owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </select>
              {errors.owner_id && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.owner_id}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Project Details"
                rows={2}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.description ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300 resize-none`}
              />
              {errors.description && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.description}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Budget Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
                <input
                  type="number"
                  name="budget_amount"
                  value={formData.budget_amount}
                  onChange={handleChange}
                  placeholder="e.g. 5000000"
                  min="0"
                  step="any"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-300"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location Details */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Location Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Site Address <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="site_address"
                value={formData.site_address}
                onChange={handleChange}
                placeholder="Full site address"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.site_address ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all placeholder:text-slate-300`}
              />
              {errors.site_address && (
                <p className="text-[10px] text-red-500 mt-1">{errors.site_address}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Pune"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.city ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all`}
              />
              {errors.city && <p className="text-[10px] text-red-500 mt-1">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Maharashtra"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Pincode <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="e.g. 411033"
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.pincode ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all`}
              />
              {errors.pincode && <p className="text-[10px] text-red-500 mt-1">{errors.pincode}</p>}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Location Type
              </label>
              <select
                name="location_type"
                value={formData.location_type}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              >
                <option value="URBAN">Urban</option>
                <option value="RURAL">Rural</option>
                <option value="SEMI_URBAN">Semi-Urban</option>
                <option value="HIGHWAY">Highway</option>
                <option value="REMOTE">Remote</option>
                <option value="INDUSTRIAL_ZONE">Industrial Zone</option>
              </select>
            </div>
            <div className="md:col-span-2 border-t border-slate-50 pt-4 mt-2">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight">
                  GPS Coordinates
                </label>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-primary bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M13 2a9 9 0 0 0-9 9m9 11a9 9 0 0 0 9-9" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M2 12h2" /><path d="M20 12h2" /></svg>
                  {isLoading ? "Locating..." : "Get Live Location"}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g. 18.5204"
                    step="any"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g. 73.8567"
                    step="any"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-50 pb-2">
            Schedule
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.start_date ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all text-slate-700`}
              />
              {errors.start_date && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.start_date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                className={`w-full px-3 py-2 bg-slate-50 border ${errors.end_date ? "border-red-500 focus:ring-red-200" : "border-slate-200 focus:ring-primary focus:border-primary"} rounded-lg text-sm outline-none transition-all text-slate-700`}
              />
              {errors.end_date && (
                <p className="text-[10px] text-red-500 mt-1">
                  {errors.end_date}
                </p>
              )}
            </div>
            <div className="md:col-span-2 border-t border-slate-50 pt-4 mt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-tight mb-3">
                Shift & Attendance Settings
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Shift Start Time
                  </label>
                  <input
                    type="time"
                    name="shift_start_time"
                    value={formData.shift_start_time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Shift End Time
                  </label>
                  <input
                    type="time"
                    name="shift_end_time"
                    value={formData.shift_end_time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 mb-1">
                    Grace Period (Mins)
                  </label>
                  <input
                    type="number"
                    name="grace_period_minutes"
                    value={formData.grace_period_minutes}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g. 15"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default NewProjectModal;
