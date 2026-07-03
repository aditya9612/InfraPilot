import React, { useEffect, useState } from "react";
import Modal from "../common/Modal";
import { masterService } from "../../services/masterService";

interface BOQDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  boqItem: any | null;
  projectName: string;
}

const BOQDetailsModal: React.FC<BOQDetailsModalProps> = ({
  isOpen,
  onClose,
  boqItem,
  projectName,
}) => {
  const [activityTypeName, setActivityTypeName] = useState<string>("");

  useEffect(() => {
    const fetchActivityTypeName = async () => {
      if (!boqItem?.activity_type_id) {
        setActivityTypeName("");
        return;
      }
      
      try {
        const types = await masterService.getEntities("activity-types");
        const matchedType = types.find(t => Number(t.id) === Number(boqItem.activity_type_id));
        setActivityTypeName(matchedType?.name || String(boqItem.activity_type_id));
      } catch (error) {
        console.error("Failed to fetch activity types:", error);
        setActivityTypeName(String(boqItem.activity_type_id));
      }
    };

    if (isOpen && boqItem) {
      fetchActivityTypeName();
    }
  }, [isOpen, boqItem]);

  if (!boqItem) return null;

  const footer = (
    <button
      onClick={onClose}
      className="px-8 py-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg text-white"
    >
      Close Details
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="BOQ Item Details"
      footer={footer}
      maxWidth="max-w-3xl"
    >
      <div className="space-y-8 pb-4">
        {/* Premium Header */}
        <div className="relative overflow-hidden bg-primary rounded-2xl p-8 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />

          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <div className="w-24 h-24 rounded-3xl bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-3xl shadow-xl overflow-hidden shrink-0 text-white">
              <span className="bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent italic">
                {boqItem.item_name.substring(0, 2).toUpperCase()}
              </span>
            </div>

            <div className="text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center gap-3">
                <h3 className="text-2xl font-black tracking-tight">
                  {boqItem.item_name}
                </h3>
                <span
                  className={`px-3 py-1 bg-white/20 backdrop-blur-md border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    boqItem.status === "Active"
                      ? "text-emerald-300"
                      : "text-slate-200"
                  }`}
                >
                  {boqItem.status}
                </span>
                {boqItem.approval_status && (
                  <span
                    className={`px-3 py-1 backdrop-blur-md border rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      boqItem.approval_status === "Approved"
                        ? "bg-emerald-500/30 border-emerald-400/30 text-emerald-200"
                        : boqItem.approval_status === "Rejected"
                        ? "bg-rose-500/30 border-rose-400/30 text-rose-200"
                        : "bg-amber-500/30 border-amber-400/30 text-amber-200"
                    }`}
                  >
                    {boqItem.approval_status}
                  </span>
                )}
              </div>
              <p className="text-white font-bold flex items-center justify-center md:justify-start gap-2">
                Project: {projectName}
              </p>
              <div className="text-white/70 text-sm font-medium">
                Category:{" "}
                <span className="text-white font-bold">{boqItem.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-2">
          {/* Item Specification */}
          <Section
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            }
            title="Specification"
          >
            <InfoItem label="Item Name" value={boqItem.item_name} />
            <InfoItem label="Description" value={boqItem.description} />
            <InfoItem label="Version Number" value={`v${boqItem.version_no}`} />
            <InfoItem
              label="BOQ Group ID"
              value={boqItem.boq_group_id ? String(boqItem.boq_group_id) : "—"}
            />
            <InfoItem
              label="Activity Type"
              value={activityTypeName || "—"}
            />
            <InfoItem
              label="Completed"
              value={boqItem.is_completed === true ? "Yes" : boqItem.is_completed === false ? "No" : "—"}
              valueClass={
                boqItem.is_completed === true
                  ? "text-emerald-600"
                  : "text-rose-500"
              }
            />
            <InfoItem
              label="Approval Status"
              value={boqItem.approval_status || "—"}
              valueClass={
                boqItem.approval_status === "Approved"
                  ? "text-emerald-600"
                  : boqItem.approval_status === "Rejected"
                  ? "text-rose-600"
                  : "text-amber-600"
              }
            />
          </Section>

          {/* Quantity & Unit */}
          <Section
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            }
            title="Quantity Details"
          >
            <InfoItem
              label="Estimated Quantity"
              value={`${parseFloat(boqItem.quantity).toLocaleString()} ${boqItem.unit}`}
            />
            <InfoItem
              label="Actual Quantity"
              value={`${parseFloat(boqItem.actual_quantity).toLocaleString()} ${boqItem.unit}`}
            />
            <InfoItem label="Unit of Measure" value={boqItem.unit} />
          </Section>

          {/* Pricing & Valuation */}
          <Section
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            }
            title="Pricing & Valuation"
            fullWidth
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-slate-800">
              <InfoItem
                label="Unit Cost"
                value={`₹${parseFloat(boqItem.unit_cost).toLocaleString()}`}
              />
              <InfoItem
                label="Estimated Total"
                value={`₹${parseFloat(boqItem.total_cost).toLocaleString()}`}
                valueClass="text-primary"
              />
              <InfoItem
                label="Actual Cost"
                value={`₹${parseFloat(boqItem.actual_cost).toLocaleString()}`}
              />
              <InfoItem
                label="Variance"
                value={`₹${parseFloat(boqItem.variance_cost).toLocaleString()}`}
                valueClass={
                  parseFloat(boqItem.variance_cost) > 0
                    ? "text-rose-500"
                    : "text-emerald-500"
                }
              />
            </div>
          </Section>
        </div>
      </div>
    </Modal>
  );
};

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  fullWidth?: boolean;
}> = ({ icon, title, children, fullWidth }) => (
  <div className={`space-y-4 ${fullWidth ? "md:col-span-2" : ""}`}>
    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
      <div className="text-primary">{icon}</div>
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">
        {title}
      </h4>
    </div>
    <div className="space-y-4 pt-1">{children}</div>
  </div>
);

const InfoItem: React.FC<{
  label: string;
  value: string;
  valueClass?: string;
}> = ({ label, value, valueClass }) => (
  <div className="group">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter mb-0.5 group-hover:text-primary transition-colors">
      {label}
    </p>
    <p className={`text-sm font-bold text-slate-800 ${valueClass}`}>
      {value || "—"}
    </p>
  </div>
);

export default BOQDetailsModal;
