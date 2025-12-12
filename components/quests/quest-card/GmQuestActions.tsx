"use client";

import { Crown } from "lucide-react";
import { Button } from "@/components/ui";
import type { QuestInstance } from "@/lib/types/database";

type FamilyMember = { id: string; name: string };

type GmQuestActionsProps = {
  quest: QuestInstance;
  buttonVis: ReturnType<typeof import("./quest-card-helpers").getButtonVisibility>;
  familyMembers: FamilyMember[];
  hideAssignment?: boolean;
  selectedAssignee?: string;
  onAssigneeChange?: (questId: string, assigneeId: string) => void;
  onAssign?: (questId: string, assigneeId: string) => void;
  onApprove?: (questId: string) => void;
  onDeny?: (questId: string) => void;
  onCancel?: (questId: string) => void;
  onRelease?: (questId: string) => void;
};

export function GmQuestActions({
  quest,
  buttonVis,
  familyMembers,
  hideAssignment = false,
  selectedAssignee = "",
  onAssigneeChange,
  onAssign,
  onApprove,
  onDeny,
  onCancel,
  onRelease,
}: GmQuestActionsProps) {
  const showAssignment = buttonVis.showAssignment && !hideAssignment && familyMembers.length > 0;

  return (
    <div className="space-y-3">
      {showAssignment && (
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <label className="block text-xs font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Crown size={16} /> Assign to Hero
          </label>
          <div className="flex gap-2">
            <select
              value={selectedAssignee}
              onChange={(e) => onAssigneeChange?.(quest.id, e.target.value)}
              className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-gold-500"
              data-testid="gm-assign-dropdown"
            >
              <option value="">Choose hero...</option>
              {familyMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!selectedAssignee}
              onClick={() => onAssign?.(quest.id, selectedAssignee)}
              data-testid="gm-assign-button"
            >
              Assign
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {buttonVis.canApprove && onApprove && (
          <Button
            type="button"
            variant="success"
            size="sm"
            onClick={() => onApprove(quest.id)}
            data-testid="gm-approve-quest"
          >
            Approve Quest
          </Button>
        )}

        {buttonVis.canDeny && onDeny && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onDeny(quest.id)}
            data-testid="gm-deny-quest"
          >
            Deny Quest
          </Button>
        )}

        {buttonVis.canCancel && onCancel && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onCancel(quest.id)}
            data-testid="gm-cancel-quest"
          >
            Cancel Quest
          </Button>
        )}

        {onRelease && quest.assigned_to_id && quest.status !== "COMPLETED" && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onRelease(quest.id)}
            data-testid="gm-release-quest"
          >
            Unassign Quest
          </Button>
        )}
      </div>
    </div>
  );
}
