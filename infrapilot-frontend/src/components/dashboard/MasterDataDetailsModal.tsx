import React from "react";
import Modal from "../common/Modal";

interface MasterDataDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any | null;
  unitsMap?: Record<number, string>;
}

const MasterDataDetailsModal: React.FC<MasterDataDetailsModalProps> = ({
  isOpen,
  onClose,
  item,
  unitsMap = {}
}) => {
  if (!item) return null;

  // Resolve unit name from ID if necessary
  const getUnitDisplay = (unitValue: any) => {
    if (!unitValue && item.default_unit_id) unitValue = item.default_unit_id;
    if (typeof unitValue === 'number') {
      return unitsMap[unitValue] || `Unit #${unitValue}`;
    }
    // If it's already a string, check if it's a numeric string
    if (typeof unitValue === 'string' && /^\d+$/.test(unitValue)) {
      const id = parseInt(unitValue, 10);
      return unitsMap[id] || `Unit #${id}`;
    }
    return unitValue || "—";
  };

  const footer = (
    <div className="flex justify-end">
      <button
        onClick={onClose}
        className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg"
      >
        Close details
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Master Entity Details"
      footer={footer}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Basic information</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Entity name" value={item.name} />
            <InfoItem label="Status" value={item.is_active !== false ? "Active" : "Inactive"} />
            <InfoItem label="System tag" value={item.system_tag} />
          </div>
        </div>

        {/* Classification Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Classification</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Unique code" value={item.unique_code} isMono />
            <InfoItem label="Category group" value={item.category} />
            {item.system_tag === "MATERIAL" && (
              <>
                <InfoItem label="Unit" value={getUnitDisplay(item.unit)} />
                <InfoItem label="Brand" value={item.brand} />
                <InfoItem label="HSN Code" value={item.hsn_code} />
              </>
            )}
            {item.system_tag === "ACTIVITY" && (
              <InfoItem label="Default Unit" value={getUnitDisplay(item.unit)} />
            )}
          </div>
        </div>

        {/* Extended Details Section - Always show for Material/Labour */}
        {(item.system_tag === "MATERIAL" || item.system_tag === "LABOR" || item.specification || item.skill_category) && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="font-semibold text-gray-700">Extended details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {item.system_tag === "LABOR" && (
                <>
                  <InfoItem label="Skill category" value={item.skill_category} />
                  <InfoItem label="Daily wage" value={item.default_daily_wage !== undefined && item.default_daily_wage !== null ? `₹${item.default_daily_wage}` : "—"} />
                  <InfoItem label="Working hours" value={item.default_working_hours !== undefined && item.default_working_hours !== null ? `${item.default_working_hours} hrs` : "—"} />
                  <InfoItem label="OT rate / hour" value={item.default_ot_rate_per_hour !== undefined && item.default_ot_rate_per_hour !== null ? `₹${item.default_ot_rate_per_hour}` : "—"} />
                </>
              )}
              {item.system_tag === "MATERIAL" && (
                <>
                  <InfoItem label="Default rate" value={item.default_rate !== undefined && item.default_rate !== null ? `₹${item.default_rate}` : "—"} />
                  <InfoItem label="Min stock level" value={item.minimum_stock_level !== undefined && item.minimum_stock_level !== null ? item.minimum_stock_level.toString() : "—"} />
                </>
              )}
              {item.specification && (
                <div className="md:col-span-2">
                  <InfoItem label="Specification" value={item.specification} />
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">System metadata</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Entity ID" value={`#MD-${item.id.toString().padStart(4, '0')}`} isMono />
          </div>
        </div>
      </div>
    </Modal>
  );
};

const InfoItem: React.FC<{ label: string; value: string; isMono?: boolean }> = ({
  label,
  value,
  isMono
}) => (
  <div>
    <p className="text-xs font-medium text-gray-500 mb-1">
      {label}
    </p>
    <p className={`text-sm font-semibold text-slate-800 ${isMono ? "font-mono" : ""}`}>
      {value || "—"}
    </p>
  </div>
);

export default MasterDataDetailsModal;
