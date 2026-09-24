import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

interface Option {
    id: string | number;
    label: string;
    badge?: string;
    searchKey?: string;
}

interface CustomSelectProps {
    label?: string;
    icon?: React.ElementType;
    required?: boolean;
    value?: string | number | null;
    onChange: (val: any) => void;
    options: Option[];
    placeholder?: string;
    searchable?: boolean;
    placement?: 'top' | 'bottom';
    disabled?: boolean;
    error?: string | boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
    label,
    icon: Icon,
    required,
    value,
    onChange,
    options,
    placeholder = "Select...",
    searchable = true,
    placement = "bottom",
    disabled = false,
    error
}) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearchTerm("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selectedOption = options.find(o => o.id === value);
    
    const filteredOptions = useMemo(() => {
        if (!searchable || !searchTerm) return options;
        const lowerTerm = searchTerm.toLowerCase();
        return options.filter(o => 
            o.label.toLowerCase().includes(lowerTerm) || 
            (o.searchKey && o.searchKey.toLowerCase().includes(lowerTerm))
        );
    }, [options, searchTerm, searchable]);

    const dropdownClasses = `absolute z-50 left-0 right-0 ${placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 flex flex-col overflow-hidden`;

    return (
        <div className="relative font-inter" ref={ref}>
            {label && (
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1 flex items-center gap-1.5">
                    {Icon && <Icon className={`w-4 h-4 ${error ? 'text-rose-500' : 'text-primary'}`} />}
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(o => !o)}
                className={`w-full px-4 py-2.5 ${disabled ? 'bg-slate-50 opacity-70 cursor-not-allowed' : 'bg-white cursor-pointer'} border ${error ? 'border-rose-500 ring-2 ring-rose-500/20' : open ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'} rounded-xl text-sm outline-none transition-all flex items-center justify-between ${!selectedOption ? 'text-slate-400' : 'text-slate-800'}`}
            >
                <span className="truncate font-medium">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown className={`w-4 h-4 shrink-0 ml-2 transition-transform ${open ? 'rotate-180' : ''} ${error ? 'text-rose-400' : open ? 'text-primary' : 'text-slate-400'}`} />
            </button>

            {open && (
                <div className={dropdownClasses}>
                    {searchable && (
                        <div className="p-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                    <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin">
                        {filteredOptions.length > 0 ? filteredOptions.map(o => {
                            const isSelected = value === o.id;
                            return (
                                <div
                                    key={o.id}
                                    onClick={() => {
                                        onChange(o.id);
                                        setOpen(false);
                                        setSearchTerm("");
                                    }}
                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-primary/10 text-primary font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <div className="flex flex-col">
                                        <span className="truncate">{o.label}</span>
                                        {o.badge && <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">{o.badge}</span>}
                                    </div>
                                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-3" />}
                                </div>
                            );
                        }) : (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center italic">
                                No options found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

interface CustomMultiSelectProps {
    label?: string;
    icon?: React.ElementType;
    required?: boolean;
    values: (string | number)[];
    onChange: (vals: any[]) => void;
    options: Option[];
    placeholder?: string;
    searchable?: boolean;
    placement?: 'top' | 'bottom';
}

export const CustomMultiSelect: React.FC<CustomMultiSelectProps> = ({
    label,
    icon: Icon,
    required,
    values = [],
    onChange,
    options,
    placeholder = "Select...",
    searchable = true,
    placement = "bottom"
}) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
                setSearchTerm("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const filteredOptions = useMemo(() => {
        if (!searchable || !searchTerm) return options;
        const lowerTerm = searchTerm.toLowerCase();
        return options.filter(o => 
            o.label.toLowerCase().includes(lowerTerm) || 
            (o.searchKey && o.searchKey.toLowerCase().includes(lowerTerm))
        );
    }, [options, searchTerm, searchable]);

    const dropdownClasses = `absolute z-50 left-0 right-0 ${placement === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'} bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 flex flex-col overflow-hidden`;

    const toggleOption = (id: string | number) => {
        if (values.includes(id)) {
            onChange(values.filter(v => v !== id));
        } else {
            onChange([...values, id]);
        }
    };

    const removeOption = (e: React.MouseEvent, id: string | number) => {
        e.stopPropagation();
        onChange(values.filter(v => v !== id));
    };

    const selectedOptions = options.filter(o => values.includes(o.id));

    return (
        <div className="relative font-inter" ref={ref}>
            {label && (
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1 flex items-center gap-1.5">
                    {Icon && <Icon className="w-4 h-4 text-primary" />}
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <div
                onClick={() => setOpen(o => !o)}
                className={`w-full px-3 py-2 bg-white border ${open ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200'} rounded-xl min-h-[46px] cursor-pointer outline-none transition-all flex flex-wrap items-center gap-2`}
            >
                {selectedOptions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 flex-1">
                        {selectedOptions.map(so => (
                            <span key={so.id} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold">
                                {so.label}
                                <span 
                                    onClick={(e) => removeOption(e, so.id)}
                                    className="p-0.5 hover:bg-primary/20 rounded-sm cursor-pointer transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </span>
                            </span>
                        ))}
                    </div>
                ) : (
                    <span className="text-slate-400 text-sm px-1 flex-1 font-medium">{placeholder}</span>
                )}
                <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180 text-primary' : 'text-slate-400'}`} />
            </div>

            {open && (
                <div className={dropdownClasses}>
                    {searchable && (
                        <div className="p-2 border-b border-slate-100 bg-slate-50/50 shrink-0">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>
                    )}
                    <div className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-thin">
                        {filteredOptions.length > 0 ? filteredOptions.map(o => {
                            const isSelected = values.includes(o.id);
                            return (
                                <div
                                    key={o.id}
                                    onClick={() => toggleOption(o.id)}
                                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-primary/5 text-primary' : 'text-slate-700 hover:bg-slate-50'}`}
                                >
                                    <div className="flex flex-col">
                                        <span className={`truncate ${isSelected ? 'font-bold' : ''}`}>{o.label}</span>
                                        {o.badge && <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">{o.badge}</span>}
                                    </div>
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ml-3 transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                                        {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center italic">
                                No options found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
