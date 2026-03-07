"use client";

import { useState, useEffect } from "react";
import { FamilyInfoCard } from "./family-settings/FamilyInfoCard";
import { FamilyMembersCard } from "./family-settings/FamilyMembersCard";
import { NotificationToast } from "./family-settings/NotificationToast";
import { RegenerateInviteModal } from "./family-settings/RegenerateInviteModal";
import { useFamilyInfo } from "./family-settings/useFamilyInfo";

export default function FamilySettings() {
  const {
    familyInfo,
    loading,
    error,
    regenerating,
    updatingTimezone,
    loadFamilyInfo,
    regenerateInviteCode,
    updateTimezone,
  } = useFamilyInfo();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    void loadFamilyInfo();
  }, [loadFamilyInfo]);

  useEffect(() => {
    if (familyInfo) {
      setSelectedTimezone(familyInfo.timezone);
    }
  }, [familyInfo]);

  const handleCopyCode = async () => {
    if (!familyInfo?.code) return;

    try {
      await navigator.clipboard.writeText(familyInfo.code);
      showNotification("success", "Invite code copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      showNotification("error", "Failed to copy invite code");
    }
  };

  const handleRegenerateCode = async () => {
    try {
      await regenerateInviteCode();
      showNotification("success", "Invite code regenerated successfully!");
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Failed to regenerate code:", err);
      showNotification("error", "Failed to regenerate invite code");
    }
  };

  const handleTimezoneUpdate = async () => {
    if (!selectedTimezone || selectedTimezone === familyInfo?.timezone) {
      showNotification("success", "Timezone is already up to date");
      return;
    }

    try {
      await updateTimezone(selectedTimezone);
      showNotification("success", "Timezone updated successfully!");
    } catch (err) {
      console.error("Failed to update timezone:", err);
      showNotification("error", "Failed to update timezone");
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error || !familyInfo) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">
          {error || "Failed to load family settings"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="family-settings">
      {/* Notifications */}
      {notification && (
        <NotificationToast message={notification.message} type={notification.type} />
      )}

      <FamilyInfoCard
        familyInfo={familyInfo}
        selectedTimezone={selectedTimezone}
        updatingTimezone={updatingTimezone}
        regenerating={regenerating}
        onCopyCode={handleCopyCode}
        onTimezoneChange={setSelectedTimezone}
        onTimezoneUpdate={handleTimezoneUpdate}
        onRegenerate={() => setShowConfirmModal(true)}
      />

      <FamilyMembersCard members={familyInfo.members} />

      {/* Confirmation Modal */}
      <RegenerateInviteModal
        isOpen={showConfirmModal}
        regenerating={regenerating}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleRegenerateCode}
      />
    </div>
  );
}
