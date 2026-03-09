"use client";

import { useState } from "react";
import { Character } from "@/lib/types/database";
import CharacterNameForm from "./CharacterNameForm";
import ClassChangeForm from "./ClassChangeForm";
import PasswordChangeForm from "./PasswordChangeForm";
import ChangeHistoryList from "./ChangeHistoryList";
import { NotificationContainer } from "@/components/ui/NotificationContainer";
import { useNotification } from "@/hooks/useNotification";
import { TabBar, type TabItem } from "@/components/ui";
import { User, Wand2, Lock, History } from "lucide-react";

interface ProfileSettingsProps {
  character: Character;
  onRefreshNeeded?: () => Promise<void>;
}

type TabType = "name" | "class" | "password" | "history";

export default function ProfileSettings({
  character,
  onRefreshNeeded,
}: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("name");
  const { notifications, success, dismiss } = useNotification();

  const handleSuccess = async (message: string) => {
    success(message);
    // Refresh character data after successful change
    if (onRefreshNeeded) {
      await onRefreshNeeded();
    }
  };

  const tabs: TabItem<TabType>[] = [
    { id: "name", label: "Character Name", icon: User },
    { id: "class", label: "Character Class", icon: Wand2 },
    { id: "password", label: "Password", icon: Lock },
    { id: "history", label: "Change History", icon: History },
  ];

  return (
    <div className="space-y-6">
      <NotificationContainer
        notifications={notifications}
        onDismiss={dismiss}
      />

      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-300">
          Manage your character&apos;s profile and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="fantasy-card p-0 overflow-hidden">
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "name" && (
            <CharacterNameForm
              character={character}
              onSuccess={handleSuccess}
            />
          )}
          {activeTab === "class" && (
            <ClassChangeForm character={character} onSuccess={handleSuccess} />
          )}
          {activeTab === "password" && (
            <PasswordChangeForm onSuccess={handleSuccess} />
          )}
          {activeTab === "history" && (
            <ChangeHistoryList character={character} />
          )}
        </div>
      </div>
    </div>
  );
}
