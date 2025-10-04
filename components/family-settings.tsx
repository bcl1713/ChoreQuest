"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { FamilyService, FamilyInfo } from "@/lib/family-service";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, RefreshCw, Users, Calendar, Shield, User } from "lucide-react";

export default function FamilySettings() {
  const { profile } = useAuth();
  const [familyInfo, setFamilyInfo] = useState<FamilyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
          <Shield className="w-3 h-3" />
          Guild Master
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Family Information</h3>

        <div className="space-y-4">
          {/* Family Name */}
          <div>
            <label className="text-sm font-medium text-gray-700">Family Name</label>
            <p className="mt-1 text-lg text-gray-900">{familyInfo.name}</p>
          </div>

          {/* Invite Code */}
          <div>
            <label className="text-sm font-medium text-gray-700">Invite Code</label>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex-1 bg-gray-50 rounded-lg px-4 py-3 border border-gray-300">
                <code className="text-xl font-mono font-bold text-gray-900 tracking-wider">
                  {familyInfo.code}
                </code>
              </div>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
            </div>
          </div>

          {/* Regenerate Button */}
          <div>
            <button
              onClick={() => setShowConfirmModal(true)}
              disabled={regenerating}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${regenerating ? "animate-spin" : ""}`} />
              {regenerating ? "Regenerating..." : "Regenerate Invite Code"}
            </button>
            <p className="mt-2 text-sm text-gray-600">
              ⚠️ Regenerating will invalidate the current invite code. Existing members will not be affected.
            </p>
          </div>
        </div>
      </div>

      {/* Family Members Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-semibold text-gray-900">
            Family Members ({familyInfo.members.length})
          </h3>
        </div>

        <div className="space-y-3">
          {familyInfo.members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <p className="font-medium text-gray-900">{member.displayName}</p>
                  {getRoleBadge(member.role)}
                </div>
                {member.characterName && (
                  <p className="text-sm text-gray-600">
                    Character: <span className="font-medium">{member.characterName}</span>
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
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
              className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Regenerate Invite Code?
              </h3>
              <p className="text-gray-600 mb-6">
                This will create a new invite code and invalidate the current one.
                Anyone with the old code will no longer be able to join your family.
                Existing members will not be affected.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                >
                  {regenerating ? "Regenerating..." : "Regenerate"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
