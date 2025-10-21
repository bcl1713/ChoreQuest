'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { userService } from '@/lib/user-service';
import { useFamilyMembers } from '@/hooks/useFamilyMembers';
import type { Tables } from '@/lib/types/database';
import { Button } from '@/components/ui';

type UserProfile = Tables<'user_profiles'>;

export function FamilyManagement() {
  const { user } = useAuth();

  // Use custom hook for family members
  const { familyMembers, loading, error: hookError } = useFamilyMembers();

  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isDemoteModalOpen, setIsDemoteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const openPromoteModal = (member: UserProfile) => {
    setSelectedUser(member);
    setIsPromoteModalOpen(true);
  };

  const openDemoteModal = (member: UserProfile) => {
    setSelectedUser(member);
    setIsDemoteModalOpen(true);
  };

  const handlePromote = async () => {
    if (!selectedUser) return;

    setActionLoading(selectedUser.id);
    setError(null);

    try {
      await userService.promoteToGuildMaster(selectedUser.id);
      setIsPromoteModalOpen(false);
      setSelectedUser(null);
      // Realtime update will refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to promote user');
      console.error('Error promoting user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDemote = async () => {
    if (!selectedUser) return;

    setActionLoading(selectedUser.id);
    setError(null);

    try {
      await userService.demoteToHero(selectedUser.id);
      setIsDemoteModalOpen(false);
      setSelectedUser(null);
      // Realtime update will refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to demote user');
      console.error('Error demoting user:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleBadge = (role: UserProfile['role']) => {
    switch (role) {
      case 'GUILD_MASTER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-sm font-medium">
            <span title="Guild Master">👑</span>
            Guild Master
          </span>
        );
      case 'HERO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-sm font-medium">
            <span title="Hero">🛡️</span>
            Hero
          </span>
        );
      case 'YOUNG_HERO':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 text-green-300 rounded text-sm font-medium">
            <span title="Young Hero">⭐</span>
            Young Hero
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-400">Loading family members...</div>
      </div>
    );
  }

  // Combine errors from hook and local state
  const displayError = hookError || error;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-yellow-400">Family Management</h2>
      </div>

      {displayError && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded">
          {displayError}
        </div>
      )}

      <div className="fantasy-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-yellow-400">Name</th>
              <th className="text-left py-3 px-4 text-yellow-400">Email</th>
              <th className="text-left py-3 px-4 text-yellow-400">Role</th>
              <th className="text-right py-3 px-4 text-yellow-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {familyMembers.map((member) => {
              const isCurrentUser = member.id === user?.id;
              const isGuildMaster = member.role === 'GUILD_MASTER';
              const canBePromoted = member.role === 'HERO' || member.role === 'YOUNG_HERO';

              return (
                <tr key={member.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-3 px-4 text-gray-200">{member.name}</td>
                  <td className="py-3 px-4 text-gray-400">{member.email}</td>
                  <td className="py-3 px-4">{getRoleBadge(member.role)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Show Promote button for Heroes and Young Heroes */}
                      {canBePromoted && (
                        <Button
                          onClick={() => openPromoteModal(member)}
                          disabled={actionLoading === member.id}
                          variant="success"
                          size="sm"
                        >
                          {actionLoading === member.id ? 'Processing...' : 'Promote to GM'}
                        </Button>
                      )}

                      {/* Show Demote button for other GMs (not current user) */}
                      {isGuildMaster && !isCurrentUser && (
                        <Button
                          onClick={() => openDemoteModal(member)}
                          disabled={actionLoading === member.id}
                          variant="gold"
                          size="sm"
                        >
                          {actionLoading === member.id ? 'Processing...' : 'Demote to Hero'}
                        </Button>
                      )}

                      {/* No action buttons for current user */}
                      {isCurrentUser && (
                        <span className="text-gray-600 text-sm">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {familyMembers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No family members found
          </div>
        )}
      </div>

      {/* Promote Confirmation Modal */}
      {isPromoteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">
              Promote to Guild Master
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to promote <strong>{selectedUser.name}</strong> to Guild Master?
              They will gain full administrative privileges including the ability to:
            </p>
            <ul className="list-disc list-inside text-gray-400 mb-6 space-y-1">
              <li>Create and manage quest templates</li>
              <li>Approve quest completions</li>
              <li>Manage rewards and redemptions</li>
              <li>Promote and demote other users</li>
            </ul>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setIsPromoteModalOpen(false);
                  setSelectedUser(null);
                }}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePromote}
                disabled={!!actionLoading}
                variant="success"
                size="sm"
              >
                {actionLoading ? 'Promoting...' : 'Confirm Promotion'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Demote Confirmation Modal */}
      {isDemoteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-yellow-500/30 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-yellow-400 mb-4">
              Demote to Hero
            </h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to demote <strong>{selectedUser.name}</strong> to Hero?
              They will lose all administrative privileges including:
            </p>
            <ul className="list-disc list-inside text-gray-400 mb-6 space-y-1">
              <li>Quest template management</li>
              <li>Quest approval authority</li>
              <li>Reward and redemption management</li>
              <li>User role management</li>
            </ul>
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setIsDemoteModalOpen(false);
                  setSelectedUser(null);
                }}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDemote}
                disabled={!!actionLoading}
                variant="gold"
                size="sm"
              >
                {actionLoading ? 'Demoting...' : 'Confirm Demotion'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
