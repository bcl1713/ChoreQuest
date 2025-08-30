export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      {/* Header */}
      <header className="p-6 text-center border-b border-dark-600">
        <h1 className="text-6xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold">
          ChoreQuest
        </h1>
        <p className="text-xl text-gray-300 mt-2 font-game">
          Transform Chores into Epic Adventures
        </p>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-fantasy text-gray-100 mb-6">
            Welcome to Your Family&apos;s Quest Board
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8">
            Join the legendary guild where household tasks become heroic quests, 
            family members become mighty heroes, and every chore completed brings 
            honor to your family name.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button className="fantasy-button text-lg px-8 py-3">
              🏰 Create Family Guild
            </button>
            <button className="bg-gradient-to-r from-gem-600 to-gem-700 hover:from-gem-700 hover:to-gem-800 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              ⚔️ Join Existing Guild
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="fantasy-card p-6 text-center">
            <div className="text-4xl mb-4">🗡️</div>
            <h3 className="text-xl font-fantasy text-gray-100 mb-3">Epic Quests</h3>
            <p className="text-gray-400">
              Transform daily chores into heroic adventures. Earn XP and gold for every task completed.
            </p>
          </div>
          <div className="fantasy-card p-6 text-center">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-fantasy text-gray-100 mb-3">Character Classes</h3>
            <p className="text-gray-400">
              Choose your path: Knight, Mage, Ranger, Rogue, or Healer. Each class offers unique bonuses.
            </p>
          </div>
          <div className="fantasy-card p-6 text-center">
            <div className="text-4xl mb-4">🏆</div>
            <h3 className="text-xl font-fantasy text-gray-100 mb-3">Boss Battles</h3>
            <p className="text-gray-400">
              Unite your family against epic boss challenges. Teamwork brings the greatest rewards.
            </p>
          </div>
        </div>

        {/* Stats Display */}
        <div className="fantasy-card p-8 mb-16">
          <h3 className="text-2xl font-fantasy text-gray-100 mb-6 text-center">
            Heroes&apos; Treasury
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl gold-text mb-2">💰 1,250</div>
              <div className="text-sm text-gray-400">Gold Earned</div>
            </div>
            <div>
              <div className="text-3xl xp-text mb-2">⚡ 3,450</div>
              <div className="text-sm text-gray-400">Experience Points</div>
            </div>
            <div>
              <div className="text-3xl gem-text mb-2">💎 45</div>
              <div className="text-sm text-gray-400">Gems Collected</div>
            </div>
            <div>
              <div className="text-3xl text-primary-400 mb-2">🏅 128</div>
              <div className="text-sm text-gray-400">Honor Points</div>
            </div>
          </div>
        </div>

        {/* Development Status */}
        <div className="fantasy-card p-6 text-center">
          <h3 className="text-xl font-fantasy text-gray-100 mb-3">🚧 Under Construction 🚧</h3>
          <p className="text-gray-400 mb-4">
            The great ChoreQuest is being forged by skilled developers. Current progress:
          </p>
          <div className="max-w-md mx-auto">
            <div className="bg-dark-700 rounded-full h-4 mb-2">
              <div className="bg-gradient-to-r from-xp-500 to-xp-600 h-4 rounded-full" style={{width: '15%'}}></div>
            </div>
            <p className="text-sm text-gray-500">Foundation Complete • Phase 1 MVP: In Development</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-600 p-6 text-center text-gray-500">
        <p className="font-game">
          Built with Next.js • TypeScript • Tailwind CSS • Prisma ORM
        </p>
        <p className="text-sm mt-2">
          Ready for your family&apos;s epic adventure? The quest begins soon...
        </p>
      </footer>
    </div>
  );
}
