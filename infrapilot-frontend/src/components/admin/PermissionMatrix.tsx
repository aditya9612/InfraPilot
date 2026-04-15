import React, { useState } from "react";

interface Permission {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

interface PermissionCategory {
  id: string;
  name: string;
  permissions: Permission[];
}

interface PermissionMatrixProps {
  categories: PermissionCategory[];
  onToggle: (id: string) => void;
  roleName: string;
}

const PermissionMatrix: React.FC<PermissionMatrixProps> = ({
  categories,
  onToggle,
  roleName,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = categories.map(cat => ({
    ...cat,
    permissions: cat.permissions.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(cat => cat.permissions.length > 0);

  return (
    <div className="w-full">
      {/* Search Header */}
      <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30">
        <div>
          <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">Permissions for {roleName}</h2>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest mt-1">
            Configure access levels for this role
          </p>
        </div>
        <div className="relative">
          <input
            type="text"
            placeholder="Search permissions..."
            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-full md:w-64 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="p-8">
        <div className="space-y-12">
          {filteredCategories.map((category) => (
            <div key={category.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="flex items-center gap-2 mb-6 border-b border-slate-50 pb-3">
                <div className="w-1.5 h-6 bg-primary rounded-full" />
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                  {category.name}
                </h3>
                <span className="ml-auto text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {category.permissions.length} PERMISSIONS
                </span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-6">
                {category.permissions.map((permission) => (
                  <div key={permission.id} className="flex items-start justify-between group">
                    <div className="max-w-[80%]">
                      <p className="text-xs font-bold text-slate-700 group-hover:text-primary transition-colors mb-1">
                        {permission.name}
                      </p>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                        {permission.description}
                      </p>
                    </div>
                    <button
                      onClick={() => onToggle(permission.id)}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        permission.enabled ? "bg-primary shadow-lg shadow-primary/20" : "bg-slate-200"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          permission.enabled ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PermissionMatrix;
