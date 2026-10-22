import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { masterService } from "../../services/masterService";

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
  const [detailedItem, setDetailedItem] = useState<any>(null);

  useEffect(() => {
    let isCancelled = false;

    if (!isOpen || !item) {
      setDetailedItem(null);
      return;
    }

    setDetailedItem(item);

    // If material or labour is missing extended fields (e.g. from /master/all)
    if (item.system_tag === "MATERIAL" && (item.brand === undefined || item.default_rate === undefined)) {
      masterService.getEntities("materials")
        .then((list) => {
          const found = list.find((m) => m.id === item.id);
          if (found && !isCancelled) {
            setDetailedItem((prev: any) => ({ ...prev, ...found }));
          }
        })
        .catch(console.error);
    } else if (item.system_tag === "LABOR" && (item.default_daily_wage === undefined || item.skill_category === undefined)) {
      masterService.getEntities("labour-types")
        .then((list) => {
          const found = list.find((l) => l.id === item.id);
          if (found && !isCancelled) {
            setDetailedItem((prev: any) => ({ ...prev, ...found }));
          }
        })
        .catch(console.error);
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen, item]);

  const activeItem = detailedItem || item;
  if (!activeItem) return null;

  // Resolve unit name from ID if necessary
  const getUnitDisplay = (unitValue: any) => {
    let resolvedUnit = unitValue || activeItem.unit_id || activeItem.default_unit_id || activeItem.unitId || activeItem.unit_name || activeItem.unit;

    // Check if the backend returned the joined Unit entity object
    if (typeof resolvedUnit === 'object' && resolvedUnit !== null) {
      if (resolvedUnit.name) return resolvedUnit.name;
      if (resolvedUnit.id) resolvedUnit = resolvedUnit.id;
    }

    if (typeof resolvedUnit === 'number') {
      return unitsMap[resolvedUnit] || `Unit #${resolvedUnit}`;
    }
    // If it's already a string, check if it's a numeric string
    if (typeof resolvedUnit === 'string' && /^\d+$/.test(resolvedUnit)) {
      const id = parseInt(resolvedUnit, 10);
      return unitsMap[id] || `Unit #${id}`;
    }
    return resolvedUnit || "NA";
  };

  const footer = (
    <div className="flex justify-end">
      <button
        onClick={onClose}
        className="px-8 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all"
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
            <InfoItem label="Entity name" value={activeItem.name} />
            <InfoItem label="Status" value={activeItem.is_active !== false ? "Active" : "Inactive"} />
            <InfoItem label="System tag" value={activeItem.system_tag} />
          </div>
        </div>

        {/* Classification Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-primary rounded-full"></div>
            <h3 className="font-semibold text-gray-700">Classification</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InfoItem label="Unique code" value={activeItem.unique_code} isMono />
            <InfoItem label="Category group" value={activeItem.category} />
            {activeItem.system_tag === "MATERIAL" && (
              <>
                <InfoItem label="Unit" value={getUnitDisplay(activeItem.unit)} />
                <InfoItem label="Brand" value={activeItem.brand} />
                <InfoItem label="HSN Code" value={activeItem.hsn_code} />
              </>
            )}
            {activeItem.system_tag === "ACTIVITY" && (
              <InfoItem label="Default Unit" value={getUnitDisplay(activeItem.unit)} />
            )}
          </div>
        </div>

        {/* Extended Details Section - Always show for Material/Labour */}
        {(activeItem.system_tag === "MATERIAL" || activeItem.system_tag === "LABOR" || activeItem.specification || activeItem.skill_category) && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full"></div>
              <h3 className="font-semibold text-gray-700">Extended details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeItem.system_tag === "LABOR" && (
                <>
                  <InfoItem label="Skill category" value={activeItem.skill_category} />
                  <InfoItem label="Daily wage" value={activeItem.default_daily_wage !== undefined && activeItem.default_daily_wage !== null ? `₹${activeItem.default_daily_wage}` : "NA"} />
                  <InfoItem label="Working hours" value={activeItem.default_working_hours !== undefined && activeItem.default_working_hours !== null ? `${activeItem.default_working_hours} hrs` : "NA"} />
                  <InfoItem label="OT rate / hour" value={activeItem.default_ot_rate_per_hour !== undefined && activeItem.default_ot_rate_per_hour !== null ? `₹${activeItem.default_ot_rate_per_hour}` : "NA"} />
                </>
              )}
              {activeItem.system_tag === "MATERIAL" && (
                <>
                  <InfoItem label="Default rate" value={activeItem.default_rate !== undefined && activeItem.default_rate !== null ? `₹${activeItem.default_rate}` : "NA"} />
                  <InfoItem label="Min stock level" value={activeItem.minimum_stock_level !== undefined && activeItem.minimum_stock_level !== null ? activeItem.minimum_stock_level.toString() : "NA"} />
                </>
              )}
              {activeItem.specification && (
                <div className="md:col-span-2">
                  <InfoItem label="Specification" value={activeItem.specification} />
                </div>
              )}
            </div>
          </div>
        )}


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
      {value || "NA"}
    </p>
  </div>
);

export default MasterDataDetailsModal;
