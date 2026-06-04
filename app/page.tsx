"use client";

import Link from "next/link";
import {
  Castle,
  Swords,
  Zap,
  Trophy,
  Coins,
  Gem,
  Award,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

const featureCards = [
  {
    icon: Swords,
    iconClassName: "text-gold-400",
    title: "Quest Board",
    description:
      "Run a family quest board for recurring chores, approvals, and co-op play without losing the RPG feel.",
  },
  {
    icon: Zap,
    iconClassName: "text-yellow-400",
    title: "Progression & Rewards",
    description:
      "Track character classes, personal achievements, family achievements, and reward redemptions in one loop.",
  },
  {
    icon: Trophy,
    iconClassName: "text-gold-400",
    title: "Guild Operations",
    description:
      "Run boss battles, guild administration, and season resets with live family updates through Supabase Realtime.",
  },
] as const;

const stackFacts = [
  {
    icon: Coins,
    accentClassName: "gold-text",
    value: "Next.js 15 + React 19",
    label: "App runtime",
  },
  {
    icon: Zap,
    accentClassName: "xp-text",
    value: "TypeScript + Tailwind CSS 4",
    label: "UI foundation",
  },
  {
    icon: Gem,
    accentClassName: "gem-text",
    value: "Supabase Auth, Postgres, and Realtime",
    label: "Data and live sync",
  },
  {
    icon: Award,
    accentClassName: "text-primary-400",
    value: "Jest unit/integration coverage + Playwright E2E",
    label: "Verification tooling",
  },
] as const;

const developmentHighlights = [
  "Recurring quest templates generate daily and weekly quest instances.",
  "Reward-store and redemption approval flows are already wired into the family loop.",
  "Character achievements and family achievements both ship as active gameplay systems.",
  "Guild-master admin tooling covers roster management, content setup, and season reset operations.",
] as const;

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <header className="p-6 text-center border-b border-dark-600">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold">
          ChoreQuest
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-gray-300 mt-2 font-game">
          Family quests, achievements, rewards, and boss battles
        </p>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-fantasy text-gray-100 mb-6">
            Welcome to Your Family&apos;s Quest Board
          </h2>
          <p className="text-lg text-gray-400 max-w-3xl mx-auto mb-8">
            ChoreQuest is a cooperative family RPG built around recurring quest
            boards, character progression, approvals, achievements, rewards,
            and shared boss-fight goals.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {user ? (
              <Link
                href="/dashboard"
                className="fantasy-button text-lg px-8 py-3 flex items-center gap-2"
                data-testid="enter-realm-button"
              >
                <Castle size={20} />
                Enter Your Realm
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/create-family"
                  className="fantasy-button text-lg px-8 py-3 flex items-center gap-2"
                  data-testid="create-family-button"
                >
                  <Castle size={20} />
                  Create Family Guild
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-gradient-to-r from-gem-600 to-gem-700 hover:from-gem-700 hover:to-gem-800 text-white font-semibold py-3 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                  data-testid="join-guild-button"
                >
                  <Swords size={20} />
                  Join Existing Guild
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {featureCards.map(({ icon: Icon, iconClassName, title, description }) => (
            <div key={title} className="fantasy-card p-6 text-center">
              <div className="text-4xl mb-4 flex justify-center">
                <Icon size={48} className={iconClassName} />
              </div>
              <h3 className="text-xl font-fantasy text-gray-100 mb-3">{title}</h3>
              <p className="text-gray-400">{description}</p>
            </div>
          ))}
        </div>

        <div className="fantasy-card p-8 mb-16">
          <h3 className="text-2xl font-fantasy text-gray-100 mb-6 text-center">
            Current Stack
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stackFacts.map(({ icon: Icon, accentClassName, value, label }) => (
              <div
                key={value}
                className="rounded-xl border border-dark-600 bg-dark-800/70 p-5 text-center"
              >
                <div
                  className={`text-xl sm:text-2xl mb-2 flex items-center justify-center gap-2 ${accentClassName}`}
                >
                  <Icon size={22} />
                  <span>{value}</span>
                </div>
                <div className="text-sm text-gray-400">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="fantasy-card p-6">
          <h3 className="text-xl font-fantasy text-gray-100 mb-4 flex items-center justify-center gap-2 text-center">
            <AlertCircle size={24} />
            Current Development Snapshot
            <AlertCircle size={24} />
          </h3>
          <p className="text-gray-400 mb-4 text-center max-w-3xl mx-auto">
            The landing page now reflects the working systems already present in
            the repository rather than an old MVP placeholder.
          </p>
          <ul className="max-w-3xl mx-auto space-y-3 text-gray-300 list-disc list-inside">
            {developmentHighlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </main>

      {!user && (
        <div className="text-center px-6 pb-10">
          <p className="text-sm text-gray-400">
            <Link
              href="/auth/login"
              className="text-primary-400 hover:text-primary-300"
              data-testid="login-link"
            >
              Already have an account? Login here
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
