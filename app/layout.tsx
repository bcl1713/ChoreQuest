import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel, Orbitron } from "next/font/google";
import { NetworkReadyProvider } from "@/lib/network-ready-context";
import { AuthProvider } from "@/lib/auth-context";
import { CharacterProvider } from "@/lib/character-context";
import { RealtimeProvider } from "@/lib/realtime-context";
import SiteFooter from "@/components/layout/site-footer";
import { getGitReferenceMetadata } from "@/lib/git-metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-fantasy",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const orbitron = Orbitron({
  variable: "--font-game", 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
});

export const metadata: Metadata = {
  title: "ChoreQuest - Transform Chores into Epic Adventures",
  description: "A fantasy RPG-themed family chore management system that transforms household tasks into heroic quests, where family members become mighty heroes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gitReference = getGitReferenceMetadata();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} ${orbitron.variable} antialiased`}
      >
        <NetworkReadyProvider>
          <AuthProvider>
            <RealtimeProvider>
              <CharacterProvider>
                <div className="flex min-h-screen flex-col">
                  <main className="flex-1">{children}</main>
                  <SiteFooter gitReference={gitReference} />
                </div>
              </CharacterProvider>
            </RealtimeProvider>
          </AuthProvider>
        </NetworkReadyProvider>
      </body>
    </html>
  );
}
