import { Clock, ChevronDown } from "lucide-react";

interface SortDropdownProps {
    value: "latest" | "oldest";
    onChange: (value: "latest" | "oldest") => void;
    className?: string;
}

export default function SortDropdown({ value, onChange, className = "" }: SortDropdownProps) {
    return (
        <div className={`relative inline-block ${className}`}>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value as "latest" | "oldest")}
                className="appearance-none pl-11 pr-11 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer shadow-sm hover:border-slate-300"
            >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
            </select>

            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none border-r border-slate-100 pr-2">
                <Clock className="w-4 h-4" />
            </div>

            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none group-hover:text-slate-400 transition-colors">
                <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
            </div>
        </div>
    );
}
