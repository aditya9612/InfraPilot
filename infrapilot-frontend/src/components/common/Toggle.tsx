import React from "react";

interface ToggleProps {
    enabled: boolean;
    onChange: () => void;
    className?: string;
}

const Toggle: React.FC<ToggleProps> = ({ enabled, onChange, className = "" }) => {
    return (
        <button
            type="button"
            onClick={onChange}
            className={`relative w-11 h-6 rounded-full transition-all duration-300 ease-in-out focus:outline-none ${enabled ? "bg-slate-900 shadow-inner" : "bg-slate-200"
                } ${className}`}
        >
            <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 transform ${enabled ? "translate-x-5" : "translate-x-0"
                    }`}
            />
        </button>
    );
};

export default Toggle;
