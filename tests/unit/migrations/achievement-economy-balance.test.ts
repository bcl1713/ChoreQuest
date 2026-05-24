/**
 * Regression tests for the default achievement economy balance.
 *
 * Economic anchors from #165:
 * - 100 gold = $10.
 * - Common daily chores are roughly 10 gold.
 * - Hard weekly chores can be roughly 85-100 gold.
 *
 * The balance migration should make early achievements feel attainable without
 * letting seeded milestone bonuses overwhelm ordinary allowance economics.
 */

import { describe, expect, it, beforeAll } from "@jest/globals";
import * as fs from "fs";
import * as path from "path";

const migrationPath = path.join(
  __dirname,
  "../../../supabase/migrations/20260327000001_rebalance_default_achievement_economy.sql",
);

let sql: string;

beforeAll(() => {
  sql = fs.readFileSync(migrationPath, "utf-8");
});

const expectAchievementBalance = (
  name: string,
  criteriaType: string,
  xpReward: number,
  goldReward: number,
) => {
  const pattern = new RegExp(
    `\\('\\s*${name}\\s*'\\s*,\\s*'${criteriaType}'\\s*,\\s*${xpReward}\\s*,\\s*${goldReward}\\s*\\)`,
    "i",
  );
  expect(sql).toMatch(pattern);
};

const expectFamilyBalance = (
  name: string,
  xpReward: number,
  goldReward: number,
) => {
  const pattern = new RegExp(
    `\\('\\s*${name}\\s*'\\s*,\\s*${xpReward}\\s*,\\s*${goldReward}\\s*\\)`,
    "i",
  );
  expect(sql).toMatch(pattern);
};

describe("Default achievement economy balance migration (20260327000001)", () => {
  it("documents the allowance anchors used for balancing", () => {
    expect(sql).toMatch(/100 gold = \$10/i);
    expect(sql).toMatch(/typical daily chores.*10 gold/i);
    expect(sql).toMatch(/hard weekly chores.*85/i);
  });

  it("caps individual achievement gold so a milestone bonus never exceeds one hard chore", () => {
    expect(sql).toMatch(/CHECK \(gold_reward <= 85\)/i);
  });

  it("keeps early individual achievements at or below about one daily chore bonus", () => {
    expectAchievementBalance("First Quest", "quest_complete", 50, 5);
    expectAchievementBalance("Volunteer Spirit", "quest_volunteer", 50, 5);
    expectAchievementBalance("Rising Star", "level_reached", 50, 5);
    expectAchievementBalance("Three Day Streak", "streak_reached", 50, 5);
  });

  it("scales sustained individual milestones without large allowance spikes", () => {
    expectAchievementBalance("Seasoned Adventurer", "quest_complete", 150, 15);
    expectAchievementBalance("Veteran Hero", "quest_complete", 300, 40);
    expectAchievementBalance("Legendary Quester", "quest_complete", 600, 75);
    expectAchievementBalance("Boss Slayer", "boss_defeated", 500, 75);
    expectAchievementBalance("Legend", "level_reached", 500, 75);
    expectAchievementBalance("Monthly Master", "streak_reached", 500, 60);
  });

  it("does not pay extra gold for achievements whose criterion is already earning gold", () => {
    expectAchievementBalance("First Gold", "gold_earned", 25, 0);
    expectAchievementBalance("Treasure Hunter", "gold_earned", 75, 0);
    expectAchievementBalance("Gold Hoarder", "gold_earned", 250, 0);
  });

  it("balances compound achievements and removes the duplicate Seasoned Adventurer name", () => {
    expect(sql).toMatch(/Well-Rounded Adventurer/i);
    expectAchievementBalance("Well-Rounded Adventurer", "compound", 120, 15);
    expectAchievementBalance("Path of Glory", "compound", 150, 20);
  });

  it("rewards family achievements without creating outsized gold windfalls", () => {
    expect(sql).toMatch(/CHECK \(gold_reward <= 60\)/i);
    expectFamilyBalance("Family First Steps", 100, 20);
    expectFamilyBalance("Family Quest Masters", 300, 50);
    expectFamilyBalance("Family Fortune", 200, 0);
    expectFamilyBalance("Family Dragon Slayers", 400, 60);
    expectFamilyBalance("Family XP Champions", 300, 25);
    expectFamilyBalance("Family of Heroes", 250, 40);
    expectFamilyBalance("Family Dedication", 200, 30);
  });

  it("updates the new-family trigger so future families get the balanced defaults", () => {
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION seed_default_family_achievements/i);
    expect(sql).toMatch(/INSERT INTO family_achievements \([\s\S]*xp_reward[\s\S]*gold_reward/i);
    expect(sql).toMatch(/Family First Steps[\s\S]*100[\s\S]*20/i);
  });
});
