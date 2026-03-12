"use client";

import React, { type ReactNode, useState, useEffect } from "react";
import { IconWithLabel } from "@/components/ui";
import { Clock, Shield } from "lucide-react";
import type { Character, Family, UserProfile } from "@/lib/types/database";
import { classDisplayMap, roleDisplayMap } from "./display-maps";

type DashboardHeaderProps = {
  character: Character;
  family: Family | null;
  profile: UserProfile | null;
  actions: ReactNode;
  title?: string;
  titleIcon?: ReactNode;
};

export function DashboardHeader({
  character,
  family,
  profile,
  actions,
  title = "ChoreQuest",
  titleIcon,
}: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <header className="border-b border-dark-600 bg-dark-800/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold flex items-center gap-2">
              {titleIcon}
              {title}
            </h1>
            {family && (
              <p className="text-sm text-gray-400">
                Guild: <span className="text-gold-400">{family.name}</span> (
                {family.code})
              </p>
            )}
            <p
              className="text-xs text-gray-500 mt-1 flex items-center gap-1"
              suppressHydrationWarning
            >
              <Clock size={14} />
              {currentTime.toLocaleDateString()} •{" "}
              {currentTime.toLocaleTimeString()}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="text-left sm:text-right">
              <p className="text-gray-300 font-medium">{character.name}</p>
              {character.class ? (
                <p
                  className="text-sm text-gray-400 flex sm:justify-end items-center gap-1"
                  data-testid="character-level"
                >
                  <IconWithLabel
                    icon={classDisplayMap[character.class]?.icon || Shield}
                    label={
                      classDisplayMap[character.class]?.label || character.class
                    }
                    size={16}
                  />
                  • Level {character.level}
                </p>
              ) : (
                <p className="text-sm text-gray-400">
                  Unknown Class • Level {character.level}
                </p>
              )}
              {profile?.role && (
                <p className="text-xs text-gray-500 flex sm:justify-end items-center gap-1">
                  <IconWithLabel
                    icon={roleDisplayMap[profile.role]?.icon || Shield}
                    label={roleDisplayMap[profile.role]?.label || profile.role}
                    size={14}
                  />
                </p>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3">{actions}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
