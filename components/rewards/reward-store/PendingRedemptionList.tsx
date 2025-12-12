"use client";

import { Bell, CheckCircle, Coins, XCircle } from "lucide-react";
import { Button } from "@/components/ui";
import type { RewardRedemptionWithUser } from "@/lib/reward-service";

type PendingRedemptionListProps = {
  pendingRedemptions: RewardRedemptionWithUser[];
  onUpdate: (redemption: RewardRedemptionWithUser, status: "APPROVED" | "DENIED") => void;
  updatingId: string | null;
};

export function PendingRedemptionList({ pendingRedemptions, onUpdate, updatingId }: PendingRedemptionListProps) {
  if (pendingRedemptions.length === 0) return null;

  return (
    <div className="border-2 border-orange-200 bg-orange-50 rounded-lg p-6">
      <h3 className="text-xl font-bold text-orange-800 mb-4 flex items-center gap-2">
        <Bell size={20} className="text-orange-800" />
        Pending Approval Requests
      </h3>
      <div className="space-y-4">
        {pendingRedemptions.map((redemption) => (
          <div
            key={redemption.id}
            className="bg-white border border-orange-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-bold text-gray-900">
                    {redemption.reward_name}
                  </span>
                  <div className="flex items-center space-x-1">
                    <Coins size={14} className="text-yellow-600" />
                    <span className="text-sm font-bold text-yellow-600">
                      {redemption.cost}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  <strong>Requested by:</strong>{" "}
                  {redemption.user_profiles?.name}
                </div>
                <div className="text-sm text-gray-500 mb-2">
                  <strong>Request Date:</strong>{" "}
                  {redemption.requested_at
                    ? new Date(redemption.requested_at).toLocaleDateString()
                    : "N/A"}
                </div>
                {redemption.notes && (
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Notes:</strong> {redemption.notes}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => onUpdate(redemption, "APPROVED")}
                variant="success"
                size="sm"
                disabled={updatingId === redemption.id}
              >
                <CheckCircle size={16} className="mr-1" />
                Approve
              </Button>
              <Button
                onClick={() => onUpdate(redemption, "DENIED")}
                variant="destructive"
                size="sm"
                disabled={updatingId === redemption.id}
              >
                <XCircle size={16} className="mr-1" />
                Deny
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
