"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRealtime } from "@/lib/realtime-context";
import { supabase } from "@/lib/supabase";
import { UserProfile } from "@/lib/types/database";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui";

interface FamilyMemberWithCharacter extends UserProfile {
  characters: {
    name: string;
    level: number;
  } | null;
}

export default function GuildMasterManager() {
  const { profile, user } = useAuth();
  const { onFamilyMemberUpdate } = useRealtime();
  const [members, setMembers] = useState<FamilyMemberWithCharacter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "promote" | "demote";
    userId: string;
    userName: string;
  } | null>(null);

  // Load family members
  const loadMembers = useCallback(async () => {
    if (!profile?.family_id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("user_profiles")
        .select(
          `
          *,
          characters (
            name,
            level
          )
        `,
        )
        .eq("family_id", profile.family_id)
        .order("role", { ascending: false }) // Guild Masters first
        .order("name", { ascending: true });

      if (fetchError) {
        throw new Error(fetchError.message);
      }

      // Transform data to handle characters array/object
      const transformedData =
        data?.map((member) => ({
          ...member,
          characters: Array.isArray(member.characters)
            ? member.characters[0] || null
            : member.characters,
        })) || [];

      setMembers(transformedData);
    } catch (err) {
      console.error("Failed to load family members:", err);
      setError("Failed to load family members");
    } finally {
      setLoading(false);
    }
  }, [profile?.family_id]);

  // Initial load
  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  // Subscribe to realtime user updates
  useEffect(() => {
    const unsubscribe = onFamilyMemberUpdate(() => {
      // Reload members when any user profile changes
      loadMembers();
    });

    return unsubscribe;
  }, [onFamilyMemberUpdate, loadMembers]);

  // Handle promote/demote confirmation
  const handleConfirmAction = (
    type: "promote" | "demote",
    userId: string,
    userName: string,
  ) => {
    setConfirmAction({ type, userId, userName });
    setShowConfirmModal(true);
  };

  // Execute promote/demote action
  const executeAction = async () => {
    if (!confirmAction) return;

    const { type, userId } = confirmAction;
    setActionLoading(userId);
    setShowConfirmModal(false);

    try {
      const token = (await supabase.auth.getSession()).data.session
        ?.access_token;
      if (!token) {
        throw new Error("Not authenticated");
      }

      const endpoint =
        type === "promote"
          ? `/api/users/${userId}/promote`
          : `/api/users/${userId}/demote`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update role");
      }

      const result = await response.json();

      // Show success (members will update via realtime subscription)
      console.log(result.message);
    } catch (err) {
      console.error("Failed to update role:", err);
      setError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const guildMasterCount = members.filter(
    (m) => m.role === "GUILD_MASTER",
  ).length;

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          👑 Guild Master Management
        </h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex items-center justify-between p-4 bg-gray-700/30 rounded-lg"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gray-600 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-600 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-600 rounded w-1/4"></div>
                </div>
              </div>
              <div className="w-20 h-8 bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          👑 Guild Master Management
        </h3>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-gray-800/50 border border-gray-700 rounded-lg p-6"
      data-testid="guild-master-manager"
    >
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">
          👑 Guild Master Management
        </h3>
        <p className="text-sm text-gray-400">Family Members</p>
        <p className="text-sm text-gray-400">
          Manage administrative roles for your family. Guild Masters can create
          quests, approve rewards, and promote other members.
        </p>
        <div className="mt-2 inline-flex items-center gap-2 text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded border border-blue-500/30">
          <span>ℹ️</span>
          <span>
            {guildMasterCount} Guild Master{guildMasterCount !== 1 ? "s" : ""}{" "}
            in family
          </span>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-2">
        <AnimatePresence>
          {members.map((member, index) => {
            const isGuildMaster = member.role === "GUILD_MASTER";
            const isCurrentUser = member.id === user?.id;
            const isLastGM = isGuildMaster && guildMasterCount === 1;

            return (
              <motion.div
                key={member.id}
                data-testid={`member-row-${member.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                  isGuildMaster
                    ? "bg-gradient-to-r from-gold-900/20 to-gold-800/10 border-gold-500/30"
                    : "bg-gray-700/30 border-gray-600/50"
                }`}
              >
                {/* Member Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Avatar/Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                      isGuildMaster ? "bg-gold-500/20" : "bg-gray-600/50"
                    }`}
                  >
                    {isGuildMaster ? "👑" : "🗡️"}
                  </div>

                  {/* Names and Role */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-medium truncate">
                        {member.name}
                        {isCurrentUser && (
                          <span className="text-xs text-gray-400 ml-2">
                            (You)
                          </span>
                        )}
                      </p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          isGuildMaster
                            ? "bg-gold-500/20 text-gold-400"
                            : "bg-gray-600/50 text-gray-300"
                        }`}
                      >
                        {isGuildMaster ? "Guild Master" : "Hero"}
                      </span>
                    </div>
                    {member.characters && (
                      <p className="text-sm text-gray-400 truncate">
                        {member.characters.name} • Level{" "}
                        {member.characters.level}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="flex-shrink-0">
                  {isCurrentUser ? (
                    <span className="text-xs text-gray-500 px-4 py-2">
                      (You)
                    </span>
                  ) : isGuildMaster ? (
                    <Button
                      data-testid="demote-button"
                      onClick={() =>
                        handleConfirmAction("demote", member.id, member.name)
                      }
                      isLoading={actionLoading === member.id}
                      disabled={isLastGM}
                      variant="destructive"
                      size="sm"
                      title={
                        isLastGM
                          ? "Cannot demote the last Guild Master"
                          : "Demote to Hero"
                      }
                    >
                      {actionLoading === member.id ? "Demoting..." : "Demote"}
                    </Button>
                  ) : (
                    <Button
                      data-testid="promote-button"
                      onClick={() =>
                        handleConfirmAction("promote", member.id, member.name)
                      }
                      isLoading={actionLoading === member.id}
                      variant="gold"
                      size="sm"
                    >
                      {actionLoading === member.id
                        ? "⟳ Promoting..."
                        : "Promote"}
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            data-testid={
              confirmAction.type === "promote"
                ? "promote-confirm-modal"
                : "demote-confirm-modal"
            }
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-semibold text-white mb-4">
              {confirmAction.type === "promote"
                ? "Promote to Guild Master?"
                : "Demote to Hero?"}
            </h3>
            <p className="text-gray-300 mb-6">
              {confirmAction.type === "promote" ? (
                <>
                  Are you sure you want to promote{" "}
                  <span className="font-semibold text-gold-400">
                    {confirmAction.userName}
                  </span>{" "}
                  to Guild Master? They will gain full administrative access to
                  manage quests, rewards, and family settings.
                </>
              ) : (
                <>
                  Are you sure you want to demote{" "}
                  <span className="font-semibold text-gold-400">
                    {confirmAction.userName}
                  </span>{" "}
                  to Hero? They will lose administrative privileges but remain a
                  family member.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <Button
                data-testid="cancel-confirm-button"
                onClick={() => {
                  setShowConfirmModal(false);
                  setConfirmAction(null);
                }}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                data-testid={
                  confirmAction.type === "promote"
                    ? "confirm-promote-button"
                    : "confirm-demote-button"
                }
                onClick={executeAction}
                variant={
                  confirmAction.type === "promote" ? "gold" : "destructive"
                }
                size="sm"
              >
                {confirmAction.type === "promote" ? "Promote" : "Demote"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
