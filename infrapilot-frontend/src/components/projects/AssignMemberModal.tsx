import React, { useState, useEffect, useCallback } from "react";
import Modal from "../common/Modal";
import { userService } from "../../services/userService";
import type { ProjectMember } from "../../types/project";
import toast from "react-hot-toast";

interface AssignMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (members: ProjectMember[]) => void;
  existingMemberIds: number[];
}

const AssignMemberModal: React.FC<AssignMemberModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  existingMemberIds,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await userService.getAllUsers(100, 0);
      const items = Array.isArray(data) ? data : (data.items || data.data || []);
      setAllUsers(items);
    } catch (error) {
      console.error("Failed to fetch available users:", error);
      toast.error("Failed to load user list");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, fetchUsers]);

  const availableUsers = allUsers.filter(
    (user) =>
      !existingMemberIds.includes(user.user_id) &&
      ((user.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.role || "").toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const toggleUserSelection = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId],
    );
  };

  const handleAssignClick = () => {
    const membersToAssign: ProjectMember[] = allUsers.filter((u) =>
      selectedUserIds.includes(u.user_id),
    ).map((u) => ({
      user_id: u.user_id,
      full_name: u.full_name,
      email: u.email,
      role: u.role,
    }));

    onAssign(membersToAssign);
    onClose();
    setSelectedUserIds([]);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.length === availableUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(availableUsers.map((u) => u.user_id));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Team Members"
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by name or role..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-inter"
            />
          </div>
          <button
            onClick={toggleSelectAll}
            className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-blue-700 transition-colors whitespace-nowrap"
          >
            {selectedUserIds.length === availableUsers.length && availableUsers.length > 0
              ? "Deselect All"
              : "Select All"}
          </button>
        </div>

        <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-10 gap-3">
               <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loading Users...</p>
             </div>
          ) : availableUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">👤</p>
              <p className="text-sm font-medium text-slate-400 font-inter">
                No available users found
              </p>
            </div>
          ) : (
            availableUsers.map((user) => {
              const isSelected = selectedUserIds.includes(user.user_id);
              return (
                <div
                  key={user.user_id}
                  onClick={() => toggleUserSelection(user.user_id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group ${
                    isSelected
                      ? "bg-primary/5 border-primary/30"
                      : "bg-slate-50 border-slate-100 hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                      isSelected ? "bg-primary border-primary" : "bg-white border-slate-200"
                    }`}>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-700 font-inter">
                        {user.full_name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider font-inter">
                        {user.role}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {selectedUserIds.length} Selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors font-inter"
            >
              Cancel
            </button>
            <button
              onClick={handleAssignClick}
              disabled={selectedUserIds.length === 0}
              className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Assign Selected
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AssignMemberModal;
