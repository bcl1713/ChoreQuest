"use client";

import React, { useMemo } from "react";
import { RewardRedemptionWithUser } from "@/lib/reward-service";
import { Button } from "@/components/ui";

interface RedemptionListProps {
  redemptions: RewardRedemptionWithUser[];
  onApprove: (redemptionId: string) => void;
  onDeny: (redemptionId: string) => void;
  onFulfill: (redemptionId: string) => void;
}

export const RedemptionList = React.memo(function RedemptionList({
  redemptions,
  onApprove,
  onDeny,
  onFulfill,
}: RedemptionListProps) {
  // Memoize filtered redemptions to prevent re-filtering on every render
  const pendingRedemptions = useMemo(
    () => redemptions.filter(r => r.status === 'PENDING'),
    [redemptions]
  );

  const approvedRedemptions = useMemo(
    () => redemptions.filter(r => r.status === 'APPROVED'),
    [redemptions]
  );

  const completedRedemptions = useMemo(
    () => redemptions.filter(r => ['DENIED', 'FULFILLED'].includes(r.status || '')),
    [redemptions]
  );

  return (
    <>
      {/* Pending Redemptions Section */}
      {pendingRedemptions.length > 0 && (
        <div data-testid="pending-redemptions-section" className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-orange-900 mb-3">Pending Redemptions</h3>
          <div className="space-y-2">
            {pendingRedemptions.map((redemption) => (
              <div
                key={redemption.id}
                data-testid="pending-redemption-item"
                className="bg-white border rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="font-semibold">{redemption.user_profiles.name}</div>
                  <div className="text-sm text-gray-600">
                    {redemption.reward_name} ({redemption.cost} gold)
                  </div>
                  {redemption.notes && (
                    <div className="text-sm text-gray-500 italic mt-1">{redemption.notes}</div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => onApprove(redemption.id)}
                    data-testid="approve-redemption-button"
                    variant="success"
                    size="sm"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() => onDeny(redemption.id)}
                    data-testid="deny-redemption-button"
                    variant="destructive"
                    size="sm"
                  >
                    Deny
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved Redemptions (Awaiting Fulfillment) */}
      {approvedRedemptions.length > 0 && (
        <div data-testid="approved-redemptions-section" className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-green-900 mb-3">Approved - Awaiting Fulfillment</h3>
          <div className="space-y-2">
            {approvedRedemptions.map((redemption) => (
              <div
                key={redemption.id}
                data-testid="approved-redemption-item"
                className="bg-white border rounded-lg p-3 flex items-center justify-between"
              >
                <div className="flex-1">
                  <div className="font-semibold">{redemption.user_profiles.name}</div>
                  <div className="text-sm text-gray-600">
                    {redemption.reward_name} ({redemption.cost} gold)
                  </div>
                  <div className="text-xs text-green-600 mt-1">
                    Approved {new Date(redemption.approved_at!).toLocaleString()}
                  </div>
                </div>
                <Button
                  onClick={() => onFulfill(redemption.id)}
                  data-testid="fulfill-redemption-button"
                  variant="primary"
                  size="sm"
                  className="ml-4"
                >
                  Mark Fulfilled
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redemption History */}
      {completedRedemptions.length > 0 && (
        <div data-testid="redemption-history-section" className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-bold text-gray-900 mb-3">Redemption History</h3>
          <div className="space-y-2">
            {completedRedemptions.map((redemption) => (
              <div
                key={redemption.id}
                data-testid="completed-redemption-item"
                className="bg-white border rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="font-semibold">{redemption.user_profiles.name}</div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    redemption.status === 'FULFILLED'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {redemption.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  {redemption.reward_name} ({redemption.cost} gold)
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Requested {redemption.requested_at ? new Date(redemption.requested_at).toLocaleString() : 'Unknown'}
                  {redemption.fulfilled_at && (
                    <> • Fulfilled {new Date(redemption.fulfilled_at).toLocaleString()}</>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
});
