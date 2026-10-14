import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check, Search, X } from "lucide-react";

interface TransferMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  inventory: any[];
  projects: any[];
}

export default function TransferMaterialModal({
  isOpen,
  onClose,
  onSubmit,
  inventory,
  projects,
}: TransferMaterialModalProps) {
  const initialFormData = {
    materialId: "",
    fromProjectId: "",
    toProjectId: "",
    quantity: 0,
  };
  const [formData, setFormData] = useState(initialFormData);

  // Dropdown states
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const [materialSearch, setMaterialSearch] = useState("");
  const materialDropdownRef = useRef<HTMLDivElement>(null);

  const [isDestinationDropdownOpen, setIsDestinationDropdownOpen] = useState(false);
  const [destinationSearch, setDestinationSearch] = useState("");
  const destinationDropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setFormData(initialFormData);
    setIsMaterialDropdownOpen(false);
    setIsDestinationDropdownOpen(false);
    setMaterialSearch("");
    setDestinationSearch("");
    onClose();
  };

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setIsMaterialDropdownOpen(false);
      setIsDestinationDropdownOpen(false);
      setMaterialSearch("");
      setDestinationSearch("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (materialDropdownRef.current && !materialDropdownRef.current.contains(e.target as Node)) {
        setIsMaterialDropdownOpen(false);
      }
      if (destinationDropdownRef.current && !destinationDropdownRef.current.contains(e.target as Node)) {
        setIsDestinationDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const selectedMaterial = inventory.find(
    (m) => m.id === Number(formData.materialId),
  );
  const availableStock = selectedMaterial ? selectedMaterial.stock : 0;
  const sourceProject = projects.find((p) => String(p.id) === String(formData.fromProjectId));

  const destinationProjects = projects.filter(
    (p) => String(p.id) !== String(formData.fromProjectId)
  );
  const selectedDestinationProject = projects.find(
    (p) => String(p.id) === String(formData.toProjectId)
  );

  const filteredMaterials = inventory.filter((item) => {
    if (!materialSearch.trim()) return true;
    return item.name?.toLowerCase().includes(materialSearch.toLowerCase());
  });

  const filteredDestinationProjects = destinationProjects.filter((p) => {
    if (!destinationSearch.trim()) return true;
    const name = p.name || p.project_name || "";
    return name.toLowerCase().includes(destinationSearch.toLowerCase());
  });

  const handleSelectMaterial = (item: any) => {
    setFormData((prev) => ({
      ...prev,
      materialId: String(item.id),
      fromProjectId: item.project_id ? String(item.project_id) : "",
      toProjectId: "",
    }));
    setIsMaterialDropdownOpen(false);
    setMaterialSearch("");
  };

  const handleSelectDestination = (projId: string | number) => {
    setFormData((prev) => ({
      ...prev,
      toProjectId: String(projId),
    }));
    setIsDestinationDropdownOpen(false);
    setDestinationSearch("");
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-opacity font-inter">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-visible animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-amber-50/50 rounded-t-[32px]">
          <div>
            <h2 className="text-xl font-black text-amber-900 tracking-tight">
              Transfer Inventory
            </h2>
            <p className="text-[10px] text-amber-600 font-bold uppercase tracking-widest mt-1">
              Internal Stock Redistribution
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-amber-900/50 hover:text-amber-900 hover:bg-amber-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="space-y-6">
            {/* Select Material Custom Dropdown */}
            <div className="space-y-1.5 relative" ref={materialDropdownRef}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Select Material <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsMaterialDropdownOpen((prev) => !prev);
                  setIsDestinationDropdownOpen(false);
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-bold flex items-center justify-between text-left outline-none cursor-pointer"
              >
                <span className={`truncate ${formData.materialId ? "text-slate-800" : "text-slate-400"}`}>
                  {selectedMaterial
                    ? `${selectedMaterial.name} (${selectedMaterial.stock} ${selectedMaterial.unit} available)`
                    : "-- Select Material in Inventory --"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                    isMaterialDropdownOpen ? "rotate-180 text-amber-500" : ""
                  }`}
                />
              </button>

              {isMaterialDropdownOpen && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  {inventory.length > 5 && (
                    <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={materialSearch}
                          onChange={(e) => setMaterialSearch(e.target.value)}
                          placeholder="Search material..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                          autoFocus
                        />
                      </div>
                    </div>
                  )}
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                    {filteredMaterials.length === 0 ? (
                      <div className="p-3 text-xs text-slate-400 text-center font-medium">No materials found</div>
                    ) : (
                      filteredMaterials.map((item) => {
                        const isSelected = String(item.id) === String(formData.materialId);
                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectMaterial(item)}
                            className={`px-4 py-2.5 text-xs cursor-pointer flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-amber-50 text-amber-900 font-bold"
                                : "text-slate-700 hover:bg-slate-50"
                            }`}
                          >
                            <span className="truncate">
                              {item.name} ({item.stock} {item.unit} available)
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-2" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-[28px] border border-slate-100 relative">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Source Site
                </label>
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-500 shadow-sm truncate h-[42px] flex items-center">
                  {sourceProject ? (sourceProject.name || sourceProject.project_name) : "Select a material first"}
                </div>
              </div>

              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:block">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-slate-50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              </div>

              {/* Destination Site Custom Dropdown */}
              <div className="space-y-1 relative" ref={destinationDropdownRef}>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                  Destination Site <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  disabled={!formData.fromProjectId}
                  onClick={() => {
                    if (formData.fromProjectId) {
                      setIsDestinationDropdownOpen((prev) => !prev);
                      setIsMaterialDropdownOpen(false);
                    }
                  }}
                  className={`w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-[11px] font-bold outline-none shadow-sm flex items-center justify-between text-left h-[42px] ${
                    !formData.fromProjectId ? "bg-slate-50 text-slate-400 cursor-not-allowed" : "cursor-pointer"
                  }`}
                >
                  <span className={`truncate ${formData.toProjectId ? "text-slate-800" : "text-slate-400"}`}>
                    {selectedDestinationProject
                      ? (selectedDestinationProject.name || selectedDestinationProject.project_name)
                      : "Select Destination Site"}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-2 transition-transform duration-200 ${
                      isDestinationDropdownOpen ? "rotate-180 text-amber-500" : ""
                    }`}
                  />
                </button>

                {isDestinationDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                    {destinationProjects.length > 5 && (
                      <div className="p-2 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="text"
                            value={destinationSearch}
                            onChange={(e) => setDestinationSearch(e.target.value)}
                            placeholder="Search site..."
                            className="w-full pl-8 pr-3 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                            autoFocus
                          />
                        </div>
                      </div>
                    )}
                    <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
                      {filteredDestinationProjects.length === 0 ? (
                        <div className="p-3 text-[11px] text-slate-400 text-center font-medium">No sites available</div>
                      ) : (
                        filteredDestinationProjects.map((p) => {
                          const isSelected = String(p.id) === String(formData.toProjectId);
                          return (
                            <div
                              key={p.id}
                              onClick={() => handleSelectDestination(p.id)}
                              className={`px-3.5 py-2.5 text-[11px] cursor-pointer flex items-center justify-between transition-colors ${
                                isSelected
                                  ? "bg-amber-50 text-amber-900 font-bold"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span className="truncate">{p.name || p.project_name}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 ml-2" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                Transfer Quantity <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  required
                  type="number"
                  name="quantity"
                  max={availableStock}
                  value={formData.quantity || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 pr-16 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-bold outline-none"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">
                  {selectedMaterial?.unit || "units"}
                </span>
              </div>
              {formData.quantity > availableStock && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-tight mt-1 ml-1">
                  Exceeds available inventory ({availableStock})
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !formData.materialId ||
                !formData.toProjectId ||
                !formData.fromProjectId ||
                formData.quantity <= 0 ||
                formData.quantity > availableStock
              }
              className="flex-1 px-8 py-2.5 text-sm font-bold text-white bg-primary hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95"
            >
              Initiate Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
