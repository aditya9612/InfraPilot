import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, ChevronDown, User, Users, Package, Hammer } from "lucide-react";

interface CreateInvoiceDropdownProps {
    onSelectType?: (type: "owner" | "labour" | "material" | "measurement" | "expense") => void;
    className?: string;
}

const CreateInvoiceDropdown: React.FC<CreateInvoiceDropdownProps> = ({ onSelectType, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const options = [
        {
            id: "owner",
            label: "Quotation Invoice",
            icon: <User className="w-4 h-4" />,
            description: "Client billing & quotations",
            action: () => {
                if (onSelectType) onSelectType("owner");
                else navigate("/admin/invoices/create");
            }
        },
        {
            id: "labour",
            label: "Labour Invoice",
            icon: <Users className="w-4 h-4" />,
            description: "Contractor & worker payments",
            action: () => {
                if (onSelectType) onSelectType("labour");
                // Handled by modal in FinancePage usually
            }
        },
        {
            id: "material",
            label: "Material Invoice",
            icon: <Package className="w-4 h-4" />,
            description: "Supplier & inventory billing",
            action: () => {
                if (onSelectType) onSelectType("material");
            }
        },
        {
            id: "measurement",
            label: "Measurement Invoice",
            icon: <Hammer className="w-4 h-4" />,
            description: "Site measurement based billing",
            action: () => {
                if (onSelectType) onSelectType("measurement");
                else navigate("/admin/invoices/create?tab=measurements");
            }
        },
    ];

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                <span>Add Invoice</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Invoice Category</p>
                    </div>
                    {options.map((option) => (
                        <button
                            key={option.id}
                            onClick={() => {
                                option.action();
                                setIsOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-start gap-3 group"
                        >
                            <div className="mt-0.5 p-1.5 bg-slate-100 text-slate-500 rounded-lg group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                {option.icon}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{option.label}</p>
                                <p className="text-[10px] text-slate-400 font-medium group-hover:text-slate-500 transition-colors">{option.description}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CreateInvoiceDropdown;
