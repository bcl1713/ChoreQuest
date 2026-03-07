"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { Character, CharacterClass } from "@/lib/types/database";
import { CHARACTER_CLASSES } from "@/lib/constants/character-classes";
import { FantasyButton } from "@/components/ui";
import { ClassCard } from "./ClassCard";

interface CharacterCreationProps {
  onCharacterCreated: (character: Character) => void;
  initialCharacterName?: string;
}

export default function CharacterCreation({
  onCharacterCreated,
  initialCharacterName = "",
}: CharacterCreationProps) {
  const [name, setName] = useState(initialCharacterName);
  const [selectedClass, setSelectedClass] = useState<CharacterClass | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const { user, profile, family } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !selectedClass) {
      setError("Please enter a character name and select a class");
      return;
    }

    if (!user) {
      setError("Authentication required. Please log in again.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      console.log("Attempting to create character for user:", user.id);

      // First, verify the user profile exists with retry logic for timing issues
      console.log("Checking for user profile...");
      let profileData = profile ?? null;
      let profileError = null;
      let retryCount = 0;
      const maxRetries = 3;

      // Retry loop to handle Supabase timing issues
      while (retryCount < maxRetries && !profileData) {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        profileData = data;
        profileError = error;

        console.log(`Profile query attempt ${retryCount + 1}:`, {
          profileData,
          profileError,
        });

        if (!profileData && retryCount < maxRetries - 1) {
          console.log(
            `Retrying profile lookup in 2 seconds (attempt ${retryCount + 1}/${maxRetries})...`,
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          retryCount++;
        } else {
          break;
        }
      }

      if (profileError || !profileData) {
        console.error("User profile not found after retries:", profileError);
        console.error("Profile error details:", {
          message: profileError?.message,
          details: profileError?.details,
          hint: profileError?.hint,
          code: profileError?.code,
        });

        // Let's also check what profiles exist
        const { data: allProfiles, error: allProfilesError } = await supabase
          .from("user_profiles")
          .select("id, name, role")
          .limit(5);

        console.log("All user profiles (first 5):", allProfiles);
        console.log("All profiles query error:", allProfilesError);

        // If the profile is missing but we know the family, attempt to self-heal by creating it
        if (family) {
          console.warn(
            "Profile missing; attempting to create profile using current session and family context.",
          );
          const fallbackName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Adventurer";

          const { data: createdProfile, error: createProfileError } =
            await supabase
              .from("user_profiles")
              .insert({
                id: user.id,
                email: user.email ?? "",
                name: fallbackName,
                role: "GUILD_MASTER" as const,
                family_id: family.id,
              })
              .select("*")
              .single();

          if (createProfileError || !createdProfile) {
            console.error("Failed to create fallback profile:", {
              createProfileError,
              createdProfile,
            });
            throw new Error(
              createProfileError?.message ||
                "User profile not found and automatic recovery failed. Please refresh and try again.",
            );
          }

          profileData = createdProfile;
        } else {
          throw new Error(
            "User profile not found. This may be a timing issue - please wait a moment and try refreshing the page.",
          );
        }
      }

      console.log("User profile verified, creating character...");

      const { data, error: dbError } = await supabase
        .from("characters")
        .insert({
          user_id: user.id,
          name: name.trim(),
          class: selectedClass,
        })
        .select()
        .single();

      if (dbError) {
        console.error("Character creation failed:", dbError);
        throw new Error(dbError.message || "Failed to create character");
      }

      console.log("Character created successfully:", data);
      onCharacterCreated(data);
    } catch (err) {
      console.error("Character creation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create character",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex items-center justify-center p-6">
      <div className="fantasy-card p-8 max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-fantasy text-transparent bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text font-bold mb-4">
            Create Your Hero
          </h1>
          <p className="text-lg text-gray-300">
            Choose your path and begin your legendary journey
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Character Name */}
          <div>
            <label
              htmlFor="characterName"
              className="block text-sm font-medium text-gray-300 mb-3"
            >
              Hero Name
            </label>
            <input
              type="text"
              id="characterName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="fantasy-input w-full px-4 py-3 bg-dark-800/50 border border-gold-700/30 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500 text-white placeholder-gray-400"
              placeholder="Enter your hero's name..."
              maxLength={50}
              required
            />
          </div>

          {/* Character Classes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              Choose Your Class
            </label>
            {/* Mobile: Horizontal scrollable cards, Desktop: Grid */}
            <div className="md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 flex md:flex-none overflow-x-auto md:overflow-x-visible snap-x snap-mandatory gap-4 pb-4 md:pb-0 -mx-2 px-2 md:mx-0 md:px-0">
              {CHARACTER_CLASSES.map((characterClass) => (
                <ClassCard
                  key={characterClass.id}
                  characterClass={characterClass}
                  isSelected={selectedClass === characterClass.id}
                  onSelect={setSelectedClass}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="bg-red-900/50 border border-red-500/50 rounded-lg p-4"
              data-testid="character-creation-error"
            >
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center">
            <FantasyButton
              type="submit"
              disabled={isLoading || !name.trim() || !selectedClass}
              isLoading={isLoading}
              size="lg"
              className="min-w-48 justify-center"
            >
              {isLoading ? "Creating Hero..." : "Begin Your Quest"}
            </FantasyButton>
          </div>
        </form>
      </div>
    </div>
  );
}
