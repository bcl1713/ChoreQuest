"use client";

import { Calendar, Shield, User, Users } from "lucide-react";
import type { FamilyInfo } from "@/lib/family-service";

type FamilyMembersCardProps = {
  members: FamilyInfo["members"];
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return "unknown date";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getRoleBadge = (role: string | null) => {
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

export function FamilyMembersCard({ members }: FamilyMembersCardProps) {
  return (
    <div className="fantasy-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Users className="w-5 h-5 text-gold-400" />
        <h3 className="text-lg font-fantasy text-gray-100">
          Family Members ({members.length})
        </h3>
      </div>

      <div className="space-y-3">
        {members.map((member) => (
          <div
            key={member.userId}
            className="fantasy-card p-4 hover:border-gold-500/30 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <p className="font-fantasy text-gray-100">
                  {member.displayName}
                </p>
                {getRoleBadge(member.role)}
              </div>
              {member.characterName && (
                <p className="text-sm text-gray-400">
                  Character:{" "}
                  <span className="font-medium text-gray-300">
                    {member.characterName}
                  </span>
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
  );
}
