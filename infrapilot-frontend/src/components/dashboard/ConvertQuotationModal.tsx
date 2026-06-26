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

    const [formData, setFormData] = useState({
        quotation_id: "",
        owner_id: "",
        location_type: "URBAN",
        city: "",
        state: "",
        country: "India",
        pincode: "",
        latitude: 0,
        longitude: 0,
        shift_start_time: "09:00",
        shift_end_time: "18:00",
        grace_period_minutes: 15,
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
        }
    }, [isOpen]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [qData, oData] = await Promise.all([
                quotationService.getQuotations(200, 0),
                ownerService.getOwners(),
            ]);
            setQuotations(qData.filter((q) => q.is_approved || q.status === "approved"));
            setOwners(oData);
        } catch (error) {
            toast.error("Failed to load quotations or owners");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.quotation_id || !formData.owner_id) {
            toast.error("Please select a quotation and an owner");
            return;
        }

        setIsSubmitting(true);
        try {
            const { quotation_id, ...payload } = formData;
            await quotationService.convertToProject(Number(quotation_id), {
                ...payload,
                owner_id: Number(payload.owner_id),
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
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
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Quotation</label>
                            <select
                                required
                                value={formData.quotation_id}
                                onChange={(e) => setFormData({ ...formData, quotation_id: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all appearance-none"
                            >
                                <option value="">Select an approved quotation</option>
                                {quotations.map((q) => (
                                    <option key={q.id} value={q.id}>
                                        Q-{String(q.id).padStart(3, "0")} | {q.client_name} - {q.project_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Project Owner (Client)</label>
                            <select
                                required
                                value={formData.owner_id}
                                onChange={(e) => setFormData({ ...formData, owner_id: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all appearance-none"
                            >
                                <option value="">Select project owner</option>
                                {owners.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.name} ({o.owner_code})
                                    </option>
                                ))}
                            </select>
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
                                    value={formData.location_type}
                                    onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
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
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">City</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    placeholder="e.g. Pune"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">State</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    placeholder="e.g. Maharashtra"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Country</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.country}
                                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Pincode</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    placeholder="e.g. 411001"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
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
                                    step="0.000001"
                                    value={formData.latitude}
                                    onChange={(e) => setFormData({ ...formData, latitude: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={formData.longitude}
                                    onChange={(e) => setFormData({ ...formData, longitude: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-50" />

                    {/* Step 3: Shift Information */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-violet-600 uppercase tracking-widest bg-violet-50 px-3 py-1.5 rounded-lg inline-block">Shift & Operations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift Start</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.shift_start_time}
                                    onChange={(e) => setFormData({ ...formData, shift_start_time: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Shift End</label>
                                <input
                                    type="time"
                                    required
                                    value={formData.shift_end_time}
                                    onChange={(e) => setFormData({ ...formData, shift_end_time: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Grace Period (Mins)</label>
                                <input
                                    type="number"
                                    required
                                    value={formData.grace_period_minutes}
                                    onChange={(e) => setFormData({ ...formData, grace_period_minutes: Number(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all"
                                />
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
