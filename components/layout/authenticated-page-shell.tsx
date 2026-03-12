import type { ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import type { Character, Family, UserProfile } from "@/lib/types/database";

type AuthenticatedPageShellProps = {
  children: ReactNode;
  character: Character;
  family: Family | null;
  profile: UserProfile | null;
  actions: ReactNode;
  title?: string;
  titleIcon?: ReactNode;
};

export function AuthenticatedPageShell({
  children,
  character,
  family,
  profile,
  actions,
  title,
  titleIcon,
}: AuthenticatedPageShellProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
      <DashboardHeader
        character={character}
        family={family}
        profile={profile}
        actions={actions}
        title={title}
        titleIcon={titleIcon}
      />
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
