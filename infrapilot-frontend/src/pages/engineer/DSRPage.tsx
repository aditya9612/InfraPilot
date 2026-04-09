import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar";
import PageTransition from "../../components/common/PageTransition";
import toast from "react-hot-toast";

const DSRPage = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "error">("idle");

    const [formData, setFormData] = useState({
        report_date: new Date().toISOString().split("T")[0],
        projectName: "Skyline Tower A",
        site_location: "Sector 45, Gurgaon",
        weather: "Clear",
        work_done: "",
        work_planned: "",
        labour_count_skilled: "",
        labour_count_unskilled: "",
        contractor_name: "",
        machinery_used: "",
        material_received: "",
        material_consumed: "",
        issues: "",
        safety_observations: "",
        remarks: "",
        gps_location: "Fetching...",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [photos, setPhotos] = useState<File[]>([]);

    useEffect(() => {
        captureGPS();
    }, []);

    const captureGPS = () => {
        setGpsStatus("capturing");
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude.toFixed(6);
                    const lng = position.coords.longitude.toFixed(6);
                    setFormData(prev => ({ ...prev, gps_location: `${lat}° N, ${lng}° E` }));
                    setGpsStatus("captured");
                },
                (error) => {
                    console.error("GPS Error:", error);
                    setGpsStatus("error");
                    setFormData(prev => ({ ...prev, gps_location: "Access Denied" }));
                    toast.error("Location access denied. Please enable GPS for auto-capture.");
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setGpsStatus("error");
            setFormData(prev => ({ ...prev, gps_location: "Not Supported" }));
            toast.error("Geolocation is not supported by your browser.");
        }
    };

    const validateStep = (step: number) => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {
            if (!formData.report_date) newErrors.report_date = "Date is required";
            if (!formData.projectName) newErrors.projectName = "Project Name is required";
            if (!formData.site_location) newErrors.site_location = "Site Location is required";
            if (!formData.weather) newErrors.weather = "Weather description is required";
        }

        if (step === 2) {
            if (!formData.work_done) newErrors.work_done = "Work done summary is required";
            if (!formData.work_planned) newErrors.work_planned = "Future plan is required";
        }

        if (step === 3) {
            if (!formData.labour_count_skilled) newErrors.labour_count_skilled = "Skilled count is required";
            if (!formData.labour_count_unskilled) newErrors.labour_count_unskilled = "Unskilled count is required";
            if (!formData.contractor_name) newErrors.contractor_name = "Contractor name is required";
            if (!formData.machinery_used) newErrors.machinery_used = "Machinery details required";
            if (!formData.material_received) newErrors.material_received = "Receipt info required";
            if (!formData.material_consumed) newErrors.material_consumed = "Consumption info required";
        }

        if (step === 4) {
            if (!formData.issues) newErrors.issues = "State today's issues or write 'None'";
            if (!formData.safety_observations) newErrors.safety_observations = "Safety observation is required";
            if (!formData.remarks) newErrors.remarks = "Engineer remarks required";
            if (photos.length === 0) newErrors.photos = "At least one site photo is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            toast.error("Please fill all mandatory fields to proceed.");
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors((prev) => {
                const updated = { ...prev };
                delete updated[name];
                return updated;
            });
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setPhotos([...photos, ...Array.from(e.target.files)]);
            if (errors.photos) {
                setErrors(prev => {
                    const upd = { ...prev };
                    delete upd.photos;
                    return upd;
                });
            }
        }
    };

    const handleSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validateStep(4)) {
            toast.error("Please complete all sections before submitting.");
            return;
        }

        toast.loading("Submitting Daily Progress Report...", { id: "dsr-sub" });

        // Simulate API call
        setTimeout(() => {
            toast.success("Daily Site Report submitted successfully!", { id: "dsr-sub" });
            console.log("Final DSR Data:", { ...formData, photos: photos.map(p => p.name) });
            // Redirect or reset could happen here
        }, 1500);
    };

    const steps = [
        { id: 1, label: "General Info" },
        { id: 2, label: "Work Summary" },
        { id: 3, label: "Resources" },
        { id: 4, label: "Safety & Issues" },
    ];

    return (
        <>
            <Navbar title="Daily Site Report (DSR)" breadcrumb={["Engineer", "DSR"]} />

            <PageTransition className="p-6 bg-slate-50 min-h-screen font-inter pb-24">
                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">New Daily Report</h1>
                            <p className="text-slate-500 text-sm">Comprehensive field report for site operations.</p>
                        </div>
                        <div className={`px-4 py-2 border rounded-xl flex items-center justify-center gap-2 self-start sm:self-auto transition-all ${gpsStatus === 'captured' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                            <span className={`w-2 h-2 rounded-full ${gpsStatus === 'capturing' ? 'bg-blue-500 animate-pulse' : gpsStatus === 'captured' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                            <span className="text-xs font-black uppercase tracking-widest">
                                {gpsStatus === 'capturing' ? 'Capturing GPS...' : gpsStatus === 'captured' ? 'GPS Captured' : 'Location Required'}
                            </span>
                        </div>
                    </div>

                    {/* Progress Indicator */}
                    <div className="mb-10 px-4">
                        <div className="flex justify-between items-center relative">
                            {/* Connector Line */}
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1.5 bg-slate-200 rounded-full z-0">
                                <div
                                    className="h-full bg-primary transition-all duration-500 rounded-full"
                                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                                />
                            </div>

                            {steps.map((step) => (
                                <div key={step.id} className="relative z-10 flex flex-col items-center">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all duration-300 border-4 ${currentStep === step.id
                                                ? 'bg-white border-primary text-primary scale-125'
                                                : currentStep > step.id
                                                    ? 'bg-primary border-primary text-white'
                                                    : 'bg-white border-slate-200 text-slate-400'
                                            }`}
                                    >
                                        {currentStep > step.id ? '✓' : step.id}
                                    </div>
                                    <span className={`absolute top-12 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors ${currentStep >= step.id ? 'text-slate-800' : 'text-slate-400'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-8 md:p-10">
                            {/* Step 1: General Info */}
                            {currentStep === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg text-primary text-xl">📋</div>
                                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">General Information</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.projectName ? 'text-rose-500' : 'text-slate-400'}`}>Project Name</label>
                                            <input
                                                type="text"
                                                name="projectName"
                                                value={formData.projectName}
                                                onChange={handleChange}
                                                placeholder="Enter the project name"
                                                className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none font-bold text-slate-700 transition-all ${errors.projectName ? 'border-rose-300' : 'border-slate-200'}`}
                                            />
                                            {errors.projectName && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">{errors.projectName}</p>}
                                        </div>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.report_date ? 'text-rose-500' : 'text-slate-400'}`}>Date of Report</label>
                                            <input
                                                type="date"
                                                name="report_date"
                                                value={formData.report_date}
                                                onChange={handleChange}
                                                className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none font-bold text-slate-700 transition-all ${errors.report_date ? 'border-rose-300' : 'border-slate-200'}`}
                                            />
                                            {errors.report_date && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">{errors.report_date}</p>}
                                        </div>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.site_location ? 'text-rose-500' : 'text-slate-400'}`}>Site Location / Yard</label>
                                            <input
                                                type="text"
                                                name="site_location"
                                                value={formData.site_location}
                                                onChange={handleChange}
                                                placeholder="e.g. Block A, Sector 4"
                                                className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none font-bold text-slate-700 transition-all ${errors.site_location ? 'border-rose-300' : 'border-slate-200'}`}
                                            />
                                            {errors.site_location && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">{errors.site_location}</p>}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.weather ? 'text-rose-500' : 'text-slate-400'}`}>Weather Condition</label>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                                {["Clear", "Rainy", "Cloudy", "Hot / Windy"].map(w => (
                                                    <button
                                                        key={w}
                                                        type="button"
                                                        onClick={() => handleChange({ target: { name: 'weather', value: w } } as any)}
                                                        className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.weather === w ? 'bg-primary border-primary text-white shadow-lg' : 'bg-white border-slate-200 text-slate-400 hover:border-primary/50'}`}
                                                    >
                                                        {w}
                                                    </button>
                                                ))}
                                            </div>
                                            {errors.weather && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">{errors.weather}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Work Summary */}
                            {currentStep === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 text-xl">🏗️</div>
                                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Work Progress Summary</h2>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.work_done ? 'text-rose-500' : 'text-slate-400'}`}>Work Done Today (Complete Activities)</label>
                                            <textarea
                                                name="work_done"
                                                rows={5}
                                                value={formData.work_done}
                                                onChange={handleChange}
                                                placeholder="Explain exactly what was completed today..."
                                                className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none font-medium text-slate-700 transition-all resize-none ${errors.work_done ? 'border-rose-300' : 'border-slate-200'}`}
                                            />
                                            {errors.work_done && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">{errors.work_done}</p>}
                                        </div>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.work_planned ? 'text-rose-500' : 'text-slate-400'}`}>Work Planned for Tomorrow</label>
                                            <textarea
                                                name="work_planned"
                                                rows={4}
                                                value={formData.work_planned}
                                                onChange={handleChange}
                                                placeholder="List planned activities for the next shift..."
                                                className={`w-full px-5 py-4 bg-slate-50 border rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none font-medium text-slate-700 transition-all resize-none ${errors.work_planned ? 'border-rose-300' : 'border-slate-200'}`}
                                            />
                                            {errors.work_planned && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">{errors.work_planned}</p>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Resources */}
                            {currentStep === 3 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600 text-xl">👷</div>
                                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Site Resources & Logistics</h2>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* Labor Stats */}
                                        <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Labour Count</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className={`block text-[10px] font-bold mb-1 ${errors.labour_count_skilled ? 'text-rose-500' : 'text-slate-600'}`}>Skilled</label>
                                                    <input
                                                        type="number"
                                                        name="labour_count_skilled"
                                                        value={formData.labour_count_skilled}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none font-black"
                                                    />
                                                </div>
                                                <div>
                                                    <label className={`block text-[10px] font-bold mb-1 ${errors.labour_count_unskilled ? 'text-rose-500' : 'text-slate-600'}`}>Unskilled</label>
                                                    <input
                                                        type="number"
                                                        name="labour_count_unskilled"
                                                        value={formData.labour_count_unskilled}
                                                        onChange={handleChange}
                                                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none font-black"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.contractor_name ? 'text-rose-500' : 'text-slate-400'}`}>Contractor Name</label>
                                                <input
                                                    type="text"
                                                    name="contractor_name"
                                                    value={formData.contractor_name}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold transition-all outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-1.5 ${errors.machinery_used ? 'text-rose-500' : 'text-slate-400'}`}>Machinery Used</label>
                                                <input
                                                    type="text"
                                                    name="machinery_used"
                                                    value={formData.machinery_used}
                                                    onChange={handleChange}
                                                    placeholder="e.g. Crane X1, Truck X2"
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold transition-all outline-none focus:border-primary"
                                                />
                                            </div>
                                        </div>

                                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.material_received ? 'text-rose-500' : 'text-slate-400'}`}>Material Received (Inbound)</label>
                                                <textarea
                                                    name="material_received"
                                                    rows={3}
                                                    value={formData.material_received}
                                                    onChange={handleChange}
                                                    placeholder="List materials arrived today..."
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none resize-none focus:border-primary"
                                                />
                                            </div>
                                            <div>
                                                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.material_consumed ? 'text-rose-500' : 'text-slate-400'}`}>Material Consumed (Actuals)</label>
                                                <textarea
                                                    name="material_consumed"
                                                    rows={3}
                                                    value={formData.material_consumed}
                                                    onChange={handleChange}
                                                    placeholder="List materials consumed on works..."
                                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none resize-none focus:border-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Safety & Issues */}
                            {currentStep === 4 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600 text-xl">⚠️</div>
                                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Compliance & Risks</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.issues ? 'text-rose-500' : 'text-slate-400'}`}>Issues / Delays</label>
                                            <textarea
                                                name="issues"
                                                rows={3}
                                                value={formData.issues}
                                                onChange={handleChange}
                                                placeholder="Any bottlenecks or stoppages..."
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none resize-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.safety_observations ? 'text-rose-500' : 'text-slate-400'}`}>Safety Observations</label>
                                            <textarea
                                                name="safety_observations"
                                                rows={3}
                                                value={formData.safety_observations}
                                                onChange={handleChange}
                                                placeholder="Site safety audit points..."
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none resize-none focus:border-primary"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 ${errors.remarks ? 'text-rose-500' : 'text-slate-400'}`}>Engineer Remarks</label>
                                            <textarea
                                                name="remarks"
                                                rows={2}
                                                value={formData.remarks}
                                                onChange={handleChange}
                                                placeholder="Final verification notes..."
                                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none resize-none focus:border-primary"
                                            />
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${errors.photos ? 'text-rose-500' : 'text-slate-400'}`}>Site Progress Photos</label>
                                            <div className="flex flex-wrap gap-4">
                                                {photos.map((p, i) => (
                                                    <div key={i} className="w-24 h-24 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative group shadow-sm transition-all hover:scale-105">
                                                        <img src={URL.createObjectURL(p)} alt="Progress" className="w-full h-full object-cover" />
                                                        <button
                                                            type="button"
                                                            onClick={() => setPhotos(photos.filter((_, index) => index !== i))}
                                                            className="absolute inset-0 bg-rose-500/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-black text-xl transition-all"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                                <label className={`w-24 h-24 rounded-2xl border-4 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${errors.photos ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-primary hover:text-primary active:scale-95'}`}>
                                                    <span className="text-2xl font-black">+</span>
                                                    <span className="text-[10px] font-black uppercase">Add Photo</span>
                                                    <input type="file" multiple onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                                                </label>
                                            </div>
                                            {errors.photos && <p className="text-[10px] text-rose-500 font-bold mt-2 ml-1">{errors.photos}</p>}
                                        </div>

                                        {/* GPS Final Check */}
                                        <div className="md:col-span-2 bg-blue-50 border border-blue-100 p-6 rounded-[24px]">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-xs font-black text-blue-700 uppercase tracking-widest">Final Location Check</h3>
                                                <button
                                                    type="button"
                                                    onClick={captureGPS}
                                                    className="px-4 py-1.5 bg-white text-blue-600 rounded-lg text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all active:scale-95"
                                                >
                                                    Recapture
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-sm text-blue-600">📍</div>
                                                <div>
                                                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-tighter">Current Coordinates</p>
                                                    <p className="text-lg font-black text-blue-900 tracking-tight">{formData.gps_location}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Footer */}
                        <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="order-2 sm:order-1 w-full sm:w-auto">
                                {currentStep > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-slate-500 hover:bg-slate-100 rounded-2xl transition-all flex items-center justify-center gap-2"
                                    >
                                        ← Previous Step
                                    </button>
                                )}
                            </div>

                            <div className="order-1 sm:order-2 w-full sm:w-auto">
                                {currentStep < steps.length ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="w-full sm:w-[180px] py-4 bg-primary text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-primary/20 hover:bg-blue-600 hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        Next Component
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleSubmit()}
                                        className="w-full sm:w-[240px] py-4 bg-emerald-500 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 hover:-translate-y-1 transition-all active:scale-95"
                                    >
                                        Submit Final Report
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </PageTransition>
        </>
    );
};

export default DSRPage;
