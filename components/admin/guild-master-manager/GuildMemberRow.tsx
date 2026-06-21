"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Sword } from "lucide-react";
import { Button } from "@/components/ui";
import type { UserProfile } from "@/lib/types/database";

interface FamilyMemberWithCharacter extends UserProfile {
  characters: {
    name: string;
    level: number;
  } | null;
}

type GuildMemberRowProps = {
  member: FamilyMemberWithCharacter;
  isCurrentUser: boolean;
  isLastGuildMaster: boolean;
  actionLoadingId: string | null;
  onPromote: (member: FamilyMemberWithCharacter) => void;
  onDemote: (member: FamilyMemberWithCharacter) => void;
  index: number;
};

export function GuildMemberRow({
  member,
  isCurrentUser,
  isLastGuildMaster,
  actionLoadingId,
  onPromote,
  onDemote,
  index,
}: GuildMemberRowProps) {
  const isGuildMaster = member.role === "GUILD_MASTER";

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
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            isGuildMaster ? "bg-gold-500/20" : "bg-gray-600/50"
          }`}
        >
          {isGuildMaster ? (
            <Crown size={24} className="text-gold-400" />
          ) : (
            <Sword size={24} className="text-gray-400" />
          )}
        </div>

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

      <div className="flex-shrink-0 flex items-center gap-2">
        <Link
          href={`/admin/users/${member.id}`}
          className="text-sm text-blue-300 hover:text-blue-200 px-3 py-2 rounded-lg border border-blue-500/30 hover:bg-blue-500/10 transition-colors"
        >
          View profile
        </Link>
        {isCurrentUser ? (
          <span className="text-xs text-gray-500 px-4 py-2">
            (You)
          </span>
        ) : isGuildMaster ? (
          <Button
            data-testid="demote-button"
            onClick={() => onDemote(member)}
            isLoading={actionLoadingId === member.id}
            disabled={isLastGuildMaster}
            variant="destructive"
            size="sm"
            title={
              isLastGuildMaster
                ? "Cannot demote the last Guild Master"
                : "Demote to Hero"
            }
          >
            {actionLoadingId === member.id ? "Demoting..." : "Demote"}
          </Button>
        ) : (
          <Button
            data-testid="promote-button"
            onClick={() => onPromote(member)}
            isLoading={actionLoadingId === member.id}
            variant="gold"
            size="sm"
          >
            {actionLoadingId === member.id ? "Promoting..." : "Promote"}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
