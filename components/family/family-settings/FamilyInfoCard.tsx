"use client";

import { Copy, Globe, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui";
import { COMMON_TIMEZONES } from "./commonTimezones";
import type { FamilyInfo } from "@/lib/family-service";

type FamilyInfoCardProps = {
  familyInfo: FamilyInfo;
  selectedTimezone: string;
  updatingTimezone: boolean;
  regenerating: boolean;
  onCopyCode: () => void;
  onTimezoneChange: (value: string) => void;
  onTimezoneUpdate: () => void;
  onRegenerate: () => void;
};

export function FamilyInfoCard({
  familyInfo,
  selectedTimezone,
  updatingTimezone,
  regenerating,
  onCopyCode,
  onTimezoneChange,
  onTimezoneUpdate,
  onRegenerate,
}: FamilyInfoCardProps) {
  return (
    <div className="fantasy-card p-6">
      <h3 className="text-lg font-fantasy text-gray-100 mb-6 flex items-center gap-2">
        <Copy className="w-5 h-5" />
        Family Information
      </h3>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-medium text-gray-400 mb-2 block">
            Family Name
          </label>
          <p className="text-xl font-fantasy text-gray-100">
            {familyInfo.name}
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-400 mb-2 block">
            Invite Code
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-3">
              <code className="text-xl font-mono font-bold gold-text tracking-wider">
                {familyInfo.code}
              </code>
            </div>
            <Button
              onClick={onCopyCode}
              variant="primary"
              size="sm"
              startIcon={<Copy className="h-4 w-4" />}
              title="Copy to clipboard"
            >
              <span className="hidden sm:inline">Copy</span>
            </Button>
          </div>
        </div>

        <div className="pt-2 border-t border-dark-600">
          <label className="text-sm font-medium text-gray-400 mb-2 block flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Family Timezone
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={selectedTimezone}
              onChange={(e) => onTimezoneChange(e.target.value)}
              className="flex-1 bg-dark-700 border border-dark-600 rounded-lg px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
            <Button
              onClick={onTimezoneUpdate}
              isLoading={updatingTimezone}
              disabled={selectedTimezone === familyInfo.timezone}
              variant="primary"
              size="sm"
            >
              {updatingTimezone ? "Updating..." : "Update Timezone"}
            </Button>
          </div>
          <p className="mt-3 text-sm text-gray-400 bg-dark-700/50 border border-dark-600 rounded-lg p-3 flex items-start gap-2">
            <Info size={16} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <span><span className="text-blue-400 font-medium">Info:</span> Quest
            recurrence (daily/weekly resets) will align to this timezone. This
            ensures quests reset at midnight in your local time, not server
            time.</span>
          </p>
        </div>

        <div className="pt-2 border-t border-dark-600">
          <Button
            onClick={onRegenerate}
            isLoading={regenerating}
            variant="gold"
            size="sm"
            startIcon={<RefreshCw className={"h-4 w-4"} />}
          >
            {regenerating ? "Regenerating..." : "Regenerate Invite Code"}
          </Button>
          <p className="mt-3 text-sm text-gray-400 bg-dark-700/50 border border-dark-600 rounded-lg p-3 flex items-start gap-2">
            <Info size={16} className="text-orange-400 flex-shrink-0 mt-0.5" />
            <span><span className="text-orange-400 font-medium">Warning:</span>{" "}
            Regenerating will invalidate the current invite code. Existing
            members will not be affected.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
