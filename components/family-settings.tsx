"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { FamilyService, FamilyInfo } from "@/lib/family-service";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, RefreshCw, Users, Calendar, Shield, User, Globe } from "lucide-react";

// Common timezones organized by region
const COMMON_TIMEZONES = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada)" },
  { value: "America/Chicago", label: "Central Time (US & Canada)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada)" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Toronto", label: "Toronto" },
  { value: "America/Vancouver", label: "Vancouver" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris / Central European Time" },
  { value: "Europe/Berlin", label: "Berlin" },
  { value: "Europe/Rome", label: "Rome" },
  { value: "Europe/Madrid", label: "Madrid" },
  { value: "Europe/Moscow", label: "Moscow" },
  { value: "Asia/Dubai", label: "Dubai" },
  { value: "Asia/Kolkata", label: "India" },
  { value: "Asia/Shanghai", label: "China" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Seoul", label: "Seoul" },
  { value: "Asia/Singapore", label: "Singapore" },
  { value: "Australia/Sydney", label: "Sydney" },
  { value: "Australia/Melbourne", label: "Melbourne" },
  { value: "Pacific/Auckland", label: "Auckland" },
];

export default function FamilySettings() {
  const { profile } = useAuth();
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState<string>("");
  const [updatingTimezone, setUpdatingTimezone] = useState(false);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const familyService = useMemo(() => new FamilyService(), []);

  // Load family information
  const loadFamilyInfo = useCallback(async () => {
    if (!profile?.family_id) return;

    try {
      setLoading(true);
      setError(null);
      const info = await familyService.getFamilyInfo(profile.family_id);
      setFamilyInfo(info);
    } catch (err) {
      console.error("Failed to load family info:", err);
      setError("Failed to load family information");
    } finally {
      setLoading(false);
    }
  }, [profile?.family_id, familyService]);

  // Initial load
  useEffect(() => {
    loadFamilyInfo();
  }, [loadFamilyInfo]);

  // Set selected timezone when family info loads
  useEffect(() => {
    if (familyInfo) {
      setSelectedTimezone(familyInfo.timezone);
    }
  }, [familyInfo]);

  // Copy invite code to clipboard
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

  // Regenerate invite code
  const handleRegenerateCode = async () => {
    if (!profile?.family_id) return;

    try {
      setRegenerating(true);
      const newCode = await familyService.regenerateInviteCode(profile.family_id);

      // Update local state
      if (familyInfo) {
        setFamilyInfo({ ...familyInfo, code: newCode });
      }

      showNotification("success", "Invite code regenerated successfully!");
      setShowConfirmModal(false);
    } catch (err) {
      console.error("Failed to regenerate code:", err);
      showNotification("error", "Failed to regenerate invite code");
    } finally {
      setRegenerating(false);
    }
  };

  // Update timezone
  const handleTimezoneUpdate = async () => {
    if (!profile?.family_id || !selectedTimezone) return;

    // Don't update if timezone hasn't changed
    if (selectedTimezone === familyInfo?.timezone) {
      showNotification("success", "Timezone is already up to date");
      return;
    }

    try {
      setUpdatingTimezone(true);
      await familyService.updateTimezone(profile.family_id, selectedTimezone);

      // Update local state
      if (familyInfo) {
        setFamilyInfo({ ...familyInfo, timezone: selectedTimezone });
      }

      showNotification("success", "Timezone updated successfully!");
    } catch (err) {
      console.error("Failed to update timezone:", err);
      showNotification("error", "Failed to update timezone");
    } finally {
      setUpdatingTimezone(false);
    }
  };

  // Show notification with auto-dismiss
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get role badge styling
  const getRoleBadge = (role: string) => {
    if (role === "GUILD_MASTER") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full">
          <Shield className="w-3 h-3" />
          Guild Master
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full">
        <User className="w-3 h-3" />
        Hero
      </span>
    );
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
        <p className="text-red-800">{error || "Failed to load family settings"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="family-settings">
      {/* Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-red-100 text-red-800 border border-red-300"
            }`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Family Info Card */}
      <div className="fantasy-card p-6">
        <h3 className="text-lg font-fantasy text-gray-100 mb-6">👥 Family Information</h3>

        <div className="space-y-6">
          {/* Family Name */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Family Name</label>
            <p className="text-xl font-fantasy text-gray-100">{familyInfo.name}</p>
          </div>

          {/* Invite Code */}
          <div>
            <label className="text-sm font-medium text-gray-400 mb-2 block">Invite Code</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-3">
                <code className="text-xl font-mono font-bold gold-text tracking-wider">
                  {familyInfo.code}
                </code>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md font-medium"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy</span>
              </button>
            </div>
          </div>

          {/* Timezone Setting */}
          <div className="pt-2 border-t border-dark-600">
            <label className="text-sm font-medium text-gray-400 mb-2 block flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Family Timezone
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
              >
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleTimezoneUpdate}
                disabled={updatingTimezone || selectedTimezone === familyInfo?.timezone}
                className="px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {updatingTimezone ? "Updating..." : "Update Timezone"}
              </button>
            </div>
            <p className="mt-3 text-sm text-gray-400 bg-dark-700/50 border border-dark-600 rounded-lg p-3">
              <span className="text-blue-400 font-medium">ℹ️ Info:</span> Quest recurrence (daily/weekly resets) will align to this timezone. This ensures quests reset at midnight in your local time, not server time.
            </p>
          </div>

          {/* Regenerate Button */}
          <div className="pt-2 border-t border-dark-600">
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={regenerating}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg transition-all shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating..." : "Regenerate Invite Code"}
            </button>
            <p className="mt-3 text-sm text-gray-400 bg-dark-700/50 border border-dark-600 rounded-lg p-3">
              <span className="text-orange-400 font-medium">⚠️ Warning:</span> Regenerating will invalidate the current invite code. Existing members will not be affected.
            </p>
          </div>
        </div>
      </div>

      {/* Family Members Card */}
      <div className="fantasy-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-gold-400" />
          <h3 className="text-lg font-fantasy text-gray-100">
            Family Members ({familyInfo.members.length})
          </h3>
        </div>

        <div className="space-y-3">
          {familyInfo.members.map((member) => (
            <div
              key={member.userId}
              className="fantasy-card p-4 hover:border-gold-500/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <p className="font-fantasy text-gray-100">{member.displayName}</p>
                  {getRoleBadge(member.role)}
                </div>
                {member.characterName && (
                  <p className="text-sm text-gray-400">
                    Character: <span className="font-medium text-gray-300">{member.characterName}</span>
                  </p>
                )}
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  Joined {formatDate(member.joinedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowConfirmModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="fantasy-card max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-fantasy text-orange-400 mb-3">
                ⚠️ Regenerate Invite Code?
              </h3>
              <p className="text-gray-300 mb-6">
                This will create a new invite code and invalidate the current one.
                Anyone with the old code will no longer be able to join your family.
                Existing members will not be affected.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-dark-600 text-gray-300 border border-dark-500 rounded-lg hover:bg-dark-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white rounded-lg font-medium transition-all shadow-md disabled:opacity-50"
                >
                  {regenerating ? "⏳ Regenerating..." : "🔄 Regenerate"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
