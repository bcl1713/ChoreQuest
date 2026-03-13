"use client";

import { useState, useEffect } from "react";
import { useNotification } from "@/hooks/useNotification";
import { NotificationContainer } from "@/components/ui/NotificationContainer";
import { FamilyInfoCard } from "./family-settings/FamilyInfoCard";
import { FamilyMembersCard } from "./family-settings/FamilyMembersCard";
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
  const {
    notifications,
    dismiss,
    error: showError,
    success: showSuccess,
  } = useNotification();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");

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
      showSuccess("Invite code copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy:", err);
      showError("Failed to copy invite code");
    }
  };

  const handleRegenerateCode = async () => {
    try {
      await regenerateInviteCode();
      showSuccess("Invite code regenerated successfully!");
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Failed to regenerate code:", err);
      showError("Failed to regenerate invite code");
    }
  };

  const handleTimezoneUpdate = async () => {
    if (!selectedTimezone || selectedTimezone === familyInfo?.timezone) {
      showSuccess("Timezone is already up to date");
      return;
    }

    try {
      await updateTimezone(selectedTimezone);
      showSuccess("Timezone updated successfully!");
    } catch (err) {
      console.error("Failed to update timezone:", err);
      showError("Failed to update timezone");
    }
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
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismiss}
      />

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
