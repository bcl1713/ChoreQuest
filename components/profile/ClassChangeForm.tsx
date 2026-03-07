"use client";

import { useEffect, useState } from "react";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";
import { FantasyButton } from "@/components/ui";
import { getCharacterClassInfo } from "@/lib/constants/character-classes";
import { ProfileService } from "@/lib/profile-service";
import { Character, CharacterClass } from "@/lib/types/database";
import { ClassSelectionGrid } from "./class-change/ClassSelectionGrid";
import { CooldownNotice } from "./class-change/CooldownNotice";
import { CostInfo } from "./class-change/CostInfo";
import { CurrentClassCard } from "./class-change/CurrentClassCard";
import { ErrorAlert } from "./shared/ErrorAlert";

interface ClassChangeFormProps {
  character: Character;
  onSuccess: (message: string) => void;
}

export default function ClassChangeForm({
  character,
  onSuccess,
}: ClassChangeFormProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canChange, setCanChange] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number | null>(
    null,
  );
  const [showConfirmation, setShowConfirmation] = useState(false);

  const cost = character.level
    ? ProfileService.getClassChangeCost(character.level)
    : 0;
  const currentClassInfo = character.class
    ? getCharacterClassInfo(character.class)
    : null;
  const selectedClassInfo = selectedClass
    ? getCharacterClassInfo(selectedClass as CharacterClass)
    : null;

  // Check if class change is possible
  useEffect(() => {
    const checkCanChange = async () => {
      try {
        const canChangeClass = await ProfileService.canChangeClass();
        setCanChange(canChangeClass);

        if (!canChangeClass) {
          const remaining =
            await ProfileService.getClassChangeCooldownRemaining();
          setCooldownRemaining(remaining);
        } else {
          setCooldownRemaining(null);
        }
      } catch (err) {
        console.error("Failed to check class change availability:", err);
      }
    };

    checkCanChange();
    const interval = setInterval(checkCanChange, 1000);
    return () => clearInterval(interval);
  }, [character.id]);

  const handleClassSelect = (classId: string) => {
    setError(null);
    setSelectedClass(classId);
  };

  const handleConfirmChange = async () => {
    if (!selectedClass) return;

    setShowConfirmation(false);
    setError(null);
    setIsLoading(true);

    try {
      // Check gold
      const currentGold = character.gold ?? 0;
      if (currentGold < cost) {
        setError(
          `Insufficient gold. You need ${cost} gold but only have ${currentGold}.`,
        );
        setIsLoading(false);
        return;
      }

      // Check cooldown again
      const canChangeClass = await ProfileService.canChangeClass();
      if (!canChangeClass) {
        setError(
          "You are still on cooldown. Please wait before changing classes again.",
        );
        setIsLoading(false);
        return;
      }

      await ProfileService.changeCharacterClass(character.id, selectedClass);
      onSuccess(`Successfully changed class to ${selectedClassInfo?.name}!`);
      setSelectedClass(null);

      // Refresh cooldown status
      const newCanChange = await ProfileService.canChangeClass();
      setCanChange(newCanChange);
      if (!newCanChange) {
        const remaining =
          await ProfileService.getClassChangeCooldownRemaining();
        setCooldownRemaining(remaining);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to change class";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <CurrentClassCard classInfo={currentClassInfo} />

      {!canChange && cooldownRemaining !== null && (
        <CooldownNotice cooldownRemaining={cooldownRemaining} />
      )}

      <CostInfo cost={cost} currentGold={character.gold ?? 0} />

      {canChange ? (
        <ClassSelectionGrid
          selectedClass={selectedClass}
          currentClass={character.class as CharacterClass | null}
          cost={cost}
          currentGold={character.gold ?? 0}
          isLoading={isLoading}
          onSelect={handleClassSelect}
        />
      ) : (
        <div className="p-4 bg-dark-800/50 border border-gold-700/20 rounded-lg text-center text-gray-300">
          Class changes are currently unavailable due to cooldown. Please try
          again later.
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {canChange && selectedClass && selectedClass !== character.class && (
        <FantasyButton
          onClick={() => setShowConfirmation(true)}
          disabled={isLoading || (character.gold ?? 0) < cost}
          isLoading={isLoading}
          className="w-full justify-center"
        >
          {isLoading ? "Changing Class..." : "Confirm Class Change"}
        </FantasyButton>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title="Confirm Class Change"
        message={`Change your class from ${currentClassInfo?.name} to ${selectedClassInfo?.name} for ${cost} gold?`}
        confirmText="Change Class"
        cancelText="Cancel"
        onConfirm={handleConfirmChange}
        onCancel={() => setShowConfirmation(false)}
        isLoading={isLoading}
        isDangerous={true}
      />
    </div>
  );
}
