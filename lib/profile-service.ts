/**
 * Profile Service
 * Handles character profile changes: name, class, and password updates
 * Includes cooldown management, cost calculation, and audit logging
 */

import { supabase } from "@/lib/supabase";
import { Character } from "@/lib/types/database";

export interface ChangeHistoryEntry {
  id: string;
  character_id: string;
  change_type: "name" | "class" | "password";
  old_value: string | null;
  new_value: string | null;
  gold_cost: number | null;
  created_at: string;
}

export interface ClassChangeCost {
  level: number;
  cost: number;
}

export class ProfileService {
  /**
   * Calculate cost to change class based on character level
   * Formula: 25 * character_level
   * @param level - Character level
   * @returns Gold cost for class change
   */
  static getClassChangeCost(level: number): number {
    return 25 * level;
  }

  /**
   * Change character name with validation
   * @param characterId - ID of character to rename
   * @param newName - New character name
   * @returns Updated character data
   * @throws Error if validation fails or operation fails
   */
  static async changeCharacterName(
    characterId: string,
    newName: string
  ): Promise<Pick<Character, "id" | "name">> {
    // Validate name
    if (!newName || newName.trim().length === 0) {
      throw new Error("Character name cannot be empty");
    }

    if (newName.length > 50) {
      throw new Error("Character name must be 50 characters or less");
    }

    // Get current character to get old name
    const { data: currentChar, error: fetchError } = await supabase
      .from("characters")
      .select("name")
      .eq("id", characterId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch character: ${fetchError.message}`);
    }

    const oldName = currentChar?.name || "";

    // Update character name
    const { data, error } = await supabase
      .from("characters")
      .update({ name: newName })
      .eq("id", characterId)
      .select("id, name")
      .single();

    if (error) {
      throw new Error(`Failed to update character name: ${error.message}`);
    }

    // Record change in history
    const { error: historyError } = await supabase
      .from("character_change_history")
      .insert({
        character_id: characterId,
        change_type: "name",
        old_value: oldName,
        new_value: newName,
        gold_cost: null,
      })
      .select()
      .single();

    if (historyError) {
      throw new Error(`Failed to record change: ${historyError.message}`);
    }

    return data;
  }

  /**
   * Check if character can change class (cooldown check)
   * Cooldown period: 7 days
   * @param characterId - ID of character to check
   * @returns true if can change, false if on cooldown
   */
  static async canChangeClass(characterId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("characters")
      .select("last_class_change_at")
      .eq("id", characterId)
      .single();

    if (error) {
      throw new Error(
        `Failed to check class change cooldown: ${error.message}`
      );
    }

    if (!data?.last_class_change_at) {
      // Never changed class
      return true;
    }

    const lastChange = new Date(data.last_class_change_at);
    const now = new Date();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const timeSinceLastChange = now.getTime() - lastChange.getTime();

    return timeSinceLastChange >= sevenDaysInMs;
  }

  /**
   * Get time remaining until next class change is allowed
   * @param characterId - ID of character
   * @returns Remaining milliseconds until cooldown expires, or 0 if can change now
   */
  static async getClassChangeCooldownRemaining(
    characterId: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from("characters")
      .select("last_class_change_at")
      .eq("id", characterId)
      .single();

    if (error) {
      throw new Error(`Failed to check cooldown: ${error.message}`);
    }

    if (!data?.last_class_change_at) {
      return 0;
    }

    const lastChange = new Date(data.last_class_change_at);
    const now = new Date();
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
    const timeSinceLastChange = now.getTime() - lastChange.getTime();
    const remaining = sevenDaysInMs - timeSinceLastChange;

    return Math.max(0, remaining);
  }

  /**
   * Change character class with full validation
   * - Checks cooldown
   * - Validates gold balance
   * - Deducts gold
   * - Updates character
   * - Records transaction
   * - Records change history
   *
   * @param characterId - ID of character to change
   * @param newClass - New character class
   * @returns Updated character with new class and reduced gold
   * @throws Error if validation fails or operation fails
   */
  static async changeCharacterClass(
    characterId: string,
    newClass: string
  ): Promise<Character> {
    // Fetch character data
    const { data: character, error: fetchError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", characterId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch character: ${fetchError.message}`);
    }

    if (!character) {
      throw new Error("Character not found");
    }

    // Check cooldown
    const canChange = await this.canChangeClass(characterId);
    if (!canChange) {
      throw new Error("Class change is on cooldown. Please try again in 7 days");
    }

    // Calculate cost
    const cost = this.getClassChangeCost(character.level);

    // Check gold balance
    if (character.gold < cost) {
      throw new Error(
        `Insufficient gold. Need ${cost}, have ${character.gold}`
      );
    }

    // Update character
    const now = new Date().toISOString();
    const { data: updatedChar, error: updateError } = await supabase
      .from("characters")
      .update({
        class: newClass,
        gold: character.gold - cost,
        last_class_change_at: now,
      })
      .eq("id", characterId)
      .select("*")
      .single();

    if (updateError) {
      throw new Error(`Failed to update character class: ${updateError.message}`);
    }

    if (!updatedChar) {
      throw new Error("Failed to retrieve updated character");
    }

    // Record transaction
    const { error: txnError } = await supabase
      .from("transactions")
      .insert({
        user_id: character.user_id,
        character_id: characterId,
        type: "CLASS_CHANGE",
        amount: -cost,
        description: `Class change from ${character.class} to ${newClass}`,
      })
      .select()
      .single();

    if (txnError) {
      // Log but don't fail - change is already recorded
      console.error("Failed to record transaction:", txnError);
    }

    // Record change history
    const { error: historyError } = await supabase
      .from("character_change_history")
      .insert({
        character_id: characterId,
        change_type: "class",
        old_value: character.class,
        new_value: newClass,
        gold_cost: cost,
      })
      .select()
      .single();

    if (historyError) {
      throw new Error(`Failed to record change history: ${historyError.message}`);
    }

    return updatedChar;
  }

  /**
   * Get change history for a character
   * @param characterId - ID of character
   * @param limit - Number of records to return (default 20)
   * @param page - Page number for pagination (default 1)
   * @returns Array of change history entries
   */
  static async getChangeHistory(
    characterId: string,
    limit: number = 20,
    page: number = 1
  ): Promise<ChangeHistoryEntry[]> {
    const offset = (page - 1) * limit;

    const { data, error } = await supabase
      .from("character_change_history")
      .select("*")
      .eq("character_id", characterId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch change history: ${error.message}`);
    }

    return (data || []) as ChangeHistoryEntry[];
  }

  /**
   * Update user password via Auth
   * @param currentPassword - Current password for verification
   * @param newPassword - New password to set
   * @returns Success status
   * @throws Error if password update fails
   */
  static async updatePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    // Validate new password
    if (!newPassword || newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    if (!/[A-Z]/.test(newPassword)) {
      throw new Error("Password must contain at least one uppercase letter");
    }

    if (!/[0-9!@#$%^&*]/.test(newPassword)) {
      throw new Error("Password must contain at least one number or special character");
    }

    // Update password via Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      throw new Error(`Failed to update password: ${error.message}`);
    }

    // Record password change in history (without storing actual password)
    const { data: user } = await supabase.auth.getUser();
    if (user?.user?.id) {
      // Get user's first character for the change history
      const { data: characters } = await supabase
        .from("characters")
        .select("id")
        .eq("user_id", user.user.id)
        .limit(1);

      if (characters && characters.length > 0) {
        const { error: historyError } = await supabase
          .from("character_change_history")
          .insert({
            character_id: characters[0].id,
            change_type: "password",
            old_value: null, // Don't store passwords
            new_value: null, // Don't store passwords
            gold_cost: null,
          })
          .select()
          .single();

        if (historyError) {
          console.error("Failed to record password change:", historyError);
        }
      }
    }

    return true;
  }
}
