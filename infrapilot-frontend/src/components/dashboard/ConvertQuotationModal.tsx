import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { quotationService } from "../../services/quotationService";
import { ownerService } from "../../services/ownerService";
import type { Quotation } from "../../types/quotation";
import type { Owner } from "../../types/owner";
import toast from "react-hot-toast";

interface ConvertQuotationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ConvertQuotationModal = ({ isOpen, onClose, onSuccess }: ConvertQuotationModalProps) => {
    const [quotations, setQuotations] = useState<Quotation[]>([]);
    const [owners, setOwners] = useState<Owner[]>([]);
    const [loading, setLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        quotation_id: "",
        owner_id: "",
        location_type: "URBAN",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        latitude: 0 as number | string,
        longitude: 0 as number | string,
        start_date: "",
        end_date: "",
        shift_start_time: "09:00",
        shift_end_time: "18:00",
        grace_period_minutes: 15 as number | string,
    });

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.");
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setFormData((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                }));

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                        { headers: { "Accept-Language": "en" } }
                    );
                    const data = await response.json();

                    if (data && data.address) {
                        const addr = data.address;
                        setFormData((prev) => ({
                            ...prev,
                            city: addr.city || addr.town || addr.village || addr.suburb || prev.city,
                            state: addr.state || prev.state,
                            pincode: addr.postcode || prev.pincode,
                        }));
                        toast.success("Location resolved!");
                    }
                } catch (error) {
                    console.error("Reverse geocoding failed:", error);
                } finally {
                    setLoading(false);
                }
            },
            () => {
                toast.error("Failed to fetch location. Please grant permissions.");
                setLoading(false);
            }
        );
    };

    useEffect(() => {
        if (isOpen) {
            fetchInitialData();
            // Reset state
            setErrors({});
            setFormData({
                quotation_id: "",
                owner_id: "",
                location_type: "URBAN",
                city: "",
                state: "",
                country: "India",
                pincode: "",
                latitude: 0,
                longitude: 0,
                start_date: "",
                end_date: "",
                shift_start_time: "09:00",
                shift_end_time: "18:00",
                grace_period_minutes: 15,
            });
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [qData, oData] = await Promise.all([
                quotationService.getQuotations(200, 0),
                ownerService.getOwners(),
            ]);
            setQuotations(qData.filter((q) => q.is_approved || q.status === "approved" || String(q.status).toUpperCase() === "APPROVED"));
            setOwners(oData);
        } catch (error) {
            toast.error("Failed to load quotations or owners");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => {
                const { [name]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value === "" ? "" : Number(value) }));
        if (errors[name]) {
            setErrors(prev => {
                const { [name]: _, ...rest } = prev;
                return rest;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.quotation_id) newErrors.quotation_id = "Quotation is required";
        if (!formData.owner_id) newErrors.owner_id = "Owner is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state.trim()) newErrors.state = "State is required";
        if (!formData.country.trim()) newErrors.country = "Country is required";
        if (!formData.pincode.trim()) newErrors.pincode = "Pincode is required";

        if (!formData.start_date) newErrors.start_date = "Start date is required";
        if (!formData.end_date) newErrors.end_date = "End date is required";
        else if (formData.start_date && formData.end_date < formData.start_date) {
            newErrors.end_date = "End date cannot be before start date";
        }

        if (!formData.shift_start_time) newErrors.shift_start_time = "Shift start is required";
        if (!formData.shift_end_time) newErrors.shift_end_time = "Shift end is required";
        if (formData.grace_period_minutes === "" || formData.grace_period_minutes === undefined) {
            newErrors.grace_period_minutes = "Grace period is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            toast.error("Please fill all required fields correctly");
            return;
        }

        setIsSubmitting(true);
        try {
            const { quotation_id, ...payload } = formData;
            await quotationService.convertToProject(Number(quotation_id), {
                ...payload,
                owner_id: Number(payload.owner_id),
                grace_period_minutes: Number(payload.grace_period_minutes),
                latitude: payload.latitude === "" ? 0 : Number(payload.latitude),
                longitude: payload.longitude === "" ? 0 : Number(payload.longitude),
            });
            toast.success("Quotation converted to project successfully!");
            onSuccess();
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to convert quotation");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Convert Quotation to Project</h2>
                        <p className="text-xs text-slate-500 font-medium">Transform an approved quotation into an active site project.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-100 group">
                        <X className="w-5 h-5 text-slate-400 group-hover:text-rose-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* Step 1: Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Quotation <span className="text-red-500">*</span></label>
                            <select
                                name="quotation_id"
                                required
                                value={formData.quotation_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 bg-slate-50 border ${errors.quotation_id ? "border-red-500 focus:ring-red-200" : "border-slate-100 focus:ring-primary/10"} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:bg-white transition-all appearance-none`}
                            >
                                <option value="">Select an approved quotation</option>
                                {quotations.map((q) => (
                                    <option key={q.id} value={q.id}>
                                        Q-{String(q.id).padStart(3, "0")} | {q.client_name} - {q.project_name}
                                    </option>
                                ))}
                            </select>
                            {errors.quotation_id && <p className="text-[10px] text-red-500 mt-1">{errors.quotation_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Project Owner (Client) <span className="text-red-500">*</span></label>
                            <select
                                name="owner_id"
                                required
                                value={formData.owner_id}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 bg-slate-50 border ${errors.owner_id ? "border-red-500 focus:ring-red-200" : "border-slate-100 focus:ring-primary/10"} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:bg-white transition-all appearance-none`}
                            >
                                <option value="">Select project owner</option>
                                {owners.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.name} ({o.owner_code})
                                    </option>
                                ))}
                            </select>
                            {errors.owner_id && <p className="text-[10px] text-red-500 mt-1">{errors.owner_id}</p>}
                        </div>
                    </div>

                    <hr className="border-slate-50" />

                    {/* Step 2: Location Information */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-lg inline-block">Site Location & Identity</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Location Type</label>
                                <select
                                    name="location_type"
                                    value={formData.location_type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all appearance-none"
                                >
                                    <option value="URBAN">Urban</option>
                                    <option value="RURAL">Rural</option>
                                    <option value="SEMI_URBAN">Semi-Urban</option>
                                    <option value="HIGHWAY">Highway</option>
                                    <option value="REMOTE">Remote</option>
                                    <option value="INDUSTRIAL_ZONE">Industrial Zone</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">City <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="city"
                                    required
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="e.g. Pune"
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.city ? "border-red-500 focus:ring-red-200" : "border-slate-100 focus:ring-primary/10"} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                                />
                                {errors.city && <p className="text-[10px] text-red-500 mt-1">{errors.city}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">State <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="e.g. Maharashtra"
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.state ? "border-red-500 focus:ring-red-200" : "border-slate-100 focus:ring-primary/10"} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                                />
                                {errors.state && <p className="text-[10px] text-red-500 mt-1">{errors.state}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Country <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.country ? "border-red-500 focus:ring-red-200" : "border-slate-100 focus:ring-primary/10"} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                                />
                                {errors.country && <p className="text-[10px] text-red-500 mt-1">{errors.country}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Pincode <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="pincode"
                                    required
                                    value={formData.pincode}
                                    onChange={handleChange}
                                    placeholder="e.g. 411001"
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.pincode ? "border-red-500 focus:ring-red-200" : "border-slate-100 focus:ring-primary/10"} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                                />
                                {errors.pincode && <p className="text-[10px] text-red-500 mt-1">{errors.pincode}</p>}
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">GPS Coordinates</h4>
                                <p className="text-[10px] text-slate-400 font-medium leading-none">Auto-detect or enter manually</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleGetLocation}
                                disabled={loading}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white text-primary border border-slate-200 rounded-xl text-[10px] font-bold hover:bg-primary hover:text-white hover:border-primary transition-all active:scale-95 disabled:opacity-50 shadow-sm"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M13 2a9 9 0 0 0-9 9m9 11a9 9 0 0 0 9-9" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="M2 12h2" /><path d="M20 12h2" /></svg>
                                {loading ? "Locating..." : "Get Live Location"}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
                                <input
                                    type="number"
                                    name="latitude"
                                    step="0.000001"
                                    value={formData.latitude}
                                    onChange={handleNumberChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                                <input
                                    type="number"
                                    name="longitude"
                                    step="0.000001"
                                    value={formData.longitude}
                                    onChange={handleNumberChange}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-50" />

                    {/* Step 3: Shift Information */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1.5 rounded-lg inline-block">Schedule & Operations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    name="start_date"
                                    value={formData.start_date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.start_date ? "border-red-500 focus:ring-red-200" : "border-slate-100 focus:ring-primary/10"} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:bg-white transition-all text-slate-700`}
                                />
                                {errors.start_date && <p className="text-[10px] text-red-500 mt-1">{errors.start_date}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date <span className="text-red-500">*</span></label>
                                <input
                                    type="date"
                                    required
                                    name="end_date"
                                    value={formData.end_date}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.end_date ? "border-red-500 focus:ring-red-200" : "border-slate-100 focus:ring-primary/10"} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:bg-white transition-all text-slate-700`}
                                />
                                {errors.end_date && <p className="text-[10px] text-red-500 mt-1">{errors.end_date}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift Start <span className="text-red-500">*</span></label>
                                <input
                                    type="time"
                                    required
                                    name="shift_start_time"
                                    value={formData.shift_start_time}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.shift_start_time ? "border-red-500 focus:ring-red-200" : "border-slate-100 focus:ring-primary/10"} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                                />
                                {errors.shift_start_time && <p className="text-[10px] text-red-500 mt-1">{errors.shift_start_time}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift End <span className="text-red-500">*</span></label>
                                <input
                                    type="time"
                                    name="shift_end_time"
                                    required
                                    value={formData.shift_end_time}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.shift_end_time ? "border-red-500 focus:ring-red-200" : "border-slate-100 focus:ring-primary/10"} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                                />
                                {errors.shift_end_time && <p className="text-[10px] text-red-500 mt-1">{errors.shift_end_time}</p>}
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Grace Period (Mins) <span className="text-red-500">*</span></label>
                                <input
                                    type="number"
                                    name="grace_period_minutes"
                                    required
                                    value={formData.grace_period_minutes}
                                    onChange={handleNumberChange}
                                    className={`w-full px-4 py-3 bg-slate-50 border ${errors.grace_period_minutes ? "border-red-500 focus:ring-red-200" : "border-slate-100 focus:ring-primary/10"} rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:bg-white transition-all`}
                                />
                                {errors.grace_period_minutes && <p className="text-[10px] text-red-500 mt-1">{errors.grace_period_minutes}</p>}
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-6 border-t border-slate-50 bg-slate-50/30 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-700 transition-all active:scale-95"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || loading}
                        className="px-8 py-2.5 bg-emerald-500 text-white text-sm font-black rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                        {isSubmitting ? "Converting..." : "Confirm Conversion"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConvertQuotationModal;
