"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { AnimatePresence } from "framer-motion";
import { Crown, Info } from "lucide-react";
import { useGuildMembers, type FamilyMemberWithCharacter } from "./guild-master-manager/useGuildMembers";
import { GuildMemberRow } from "./guild-master-manager/GuildMemberRow";
import { ConfirmRoleModal } from "./guild-master-manager/ConfirmRoleModal";

export default function GuildMasterManager() {
  const { user } = useAuth();
  const { members, loading, error, reload } = useGuildMembers();
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "promote" | "demote";
    userId: string;
    userName: string;
  } | null>(null);

  const guildMasterCount = useMemo(
    () => members.filter((m) => m.role === "GUILD_MASTER").length,
    [members]
  );

  const handleConfirmAction = (type: "promote" | "demote", userId: string, userName: string) => {
    setConfirmAction({ type, userId, userName });
    setShowConfirmModal(true);
  };

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

      await reload();
    } catch (err) {
      console.error("Failed to update role:", err);
      setActionError(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          <Crown size={20} className="mr-2" />
          Guild Master Management
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

  const displayedError = error || actionError;

  if (displayedError) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          <Crown size={20} className="mr-2" />
          Guild Master Management
        </h3>
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-red-200">
          {displayedError}
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
          <Crown size={20} className="mr-2" />
          Guild Master Management
        </h3>
        <p className="text-sm text-gray-400">Family Members</p>
        <p className="text-sm text-gray-400">
          Manage administrative roles for your family. Guild Masters can create
          quests, approve rewards, and promote other members.
        </p>
        <div className="mt-2 inline-flex items-center gap-2 text-xs bg-blue-500/10 text-blue-400 px-3 py-1 rounded border border-blue-500/30">
          <Info size={16} />
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
            const isCurrentUser = member.id === user?.id;
            return (
              <GuildMemberRow
                key={member.id}
                member={member as FamilyMemberWithCharacter}
                isCurrentUser={isCurrentUser}
                isLastGuildMaster={member.role === "GUILD_MASTER" && guildMasterCount === 1}
                actionLoadingId={actionLoading}
                index={index}
                onPromote={(target) => handleConfirmAction("promote", target.id, target.name)}
                onDemote={(target) => handleConfirmAction("demote", target.id, target.name)}
              />
            );
          })}
        </AnimatePresence>
      </div>

      <ConfirmRoleModal
        isOpen={showConfirmModal && Boolean(confirmAction)}
        type={confirmAction?.type ?? "promote"}
        userName={confirmAction?.userName ?? ""}
        testId={
          confirmAction?.type === "promote"
            ? "promote-confirm-modal"
            : "demote-confirm-modal"
        }
        onConfirm={executeAction}
        onCancel={() => {
          setShowConfirmModal(false);
          setConfirmAction(null);
        }}
      />
    </div>
  );
}
