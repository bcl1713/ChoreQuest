'use client';

import Link from 'next/link';

interface UserMigrationNoticeProps {
  onDismiss?: () => void;
}

export default function UserMigrationNotice({ onDismiss }: UserMigrationNoticeProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="fantasy-card p-6 w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🏰</div>
          <h2 className="text-2xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold mb-2">
            Guild System Upgrade Complete
          </h2>
          <p className="text-gray-400 text-sm">
            ChoreQuest has been upgraded with improved security and real-time features
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <h3 className="text-blue-400 font-semibold mb-2">🔒 Enhanced Security</h3>
            <p className="text-gray-300 text-sm">
              For your security, all users need to create new accounts with our upgraded authentication system.
            </p>
          </div>

          <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
            <h3 className="text-green-400 font-semibold mb-2">⚡ Real-time Updates</h3>
            <p className="text-gray-300 text-sm">
              Experience instant updates when family members complete quests, earn rewards, and level up!
            </p>
          </div>

          <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <h3 className="text-purple-400 font-semibold mb-2">📊 Better Performance</h3>
            <p className="text-gray-300 text-sm">
              Enjoy faster loading times and improved reliability across all devices.
            </p>
          </div>
        </div>

        <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <h3 className="text-yellow-400 font-semibold mb-2">📝 What You Need to Do</h3>
          <ol className="text-gray-300 text-sm space-y-1 list-decimal list-inside">
            <li>If you&apos;re the Guild Master: Create a new family with the same name</li>
            <li>Share the new guild code with your family members</li>
            <li>Each family member registers with the new guild code</li>
            <li>Recreate your characters (takes just a minute!)</li>
          </ol>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/create-family"
            className="w-full fantasy-button block text-center py-3 text-lg font-semibold"
          >
            👑 Create New Guild (Guild Masters)
          </Link>

          <Link
            href="/auth/register"
            className="w-full bg-gradient-to-r from-gem-600 to-gem-700 hover:from-gem-500 hover:to-gem-600 text-white px-6 py-3 rounded-lg font-semibold shadow-lg border border-gem-500/50 transition-all block text-center"
          >
            ⚔️ Join Existing Guild
          </Link>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="w-full text-gray-400 hover:text-gray-300 text-sm underline py-2 transition-colors"
            >
              I&apos;ll do this later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}