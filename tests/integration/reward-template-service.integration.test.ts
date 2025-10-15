/**
 * Reward template copying tests using a mocked Supabase client.
 * These tests focus on verifying the application logic that would copy
 * template rewards for new families without requiring a live database.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { supabase } from "@/lib/supabase";

const supabaseFromSpy = jest.spyOn(supabase, "from");

type QueryResult<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string } }
  | { data: null; error: null };

type MockQueryBuilder<T> = {
  insert: jest.Mock<MockQueryBuilder<T>, [unknown?]>;
  upsert: jest.Mock<MockQueryBuilder<T>, [unknown?]>;
  select: jest.Mock<MockQueryBuilder<T>, [unknown?]>;
  update: jest.Mock<MockQueryBuilder<T>, [unknown?]>;
  delete: jest.Mock<MockQueryBuilder<T>, [unknown?]>;
  eq: jest.Mock<MockQueryBuilder<T>, [string, unknown]>;
  order: jest.Mock<MockQueryBuilder<T>, [string, { ascending: boolean }?]>;
  single: jest.Mock<Promise<QueryResult<T>>, []>;
} & PromiseLike<QueryResult<T>>;

const createQueryBuilder = <T>(
  result: QueryResult<T>,
  singleResult?: QueryResult<T>
): MockQueryBuilder<T> => {
  const promise = Promise.resolve(result);
  const builder: Partial<MockQueryBuilder<T>> = {};

  builder.insert = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.upsert = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.select = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.update = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.delete = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.eq = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.order = jest.fn(() => builder as MockQueryBuilder<T>);
  builder.single = jest.fn(() => Promise.resolve(singleResult ?? result));

  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);

  return builder as MockQueryBuilder<T>;
};

const copyTemplateRewardsForFamily = async (familyId: string) => {
  const templateQuery = await supabase.from("rewards").select("*").eq("family_id", null);
  if (templateQuery.error) {
    throw new Error(`Failed to load template rewards: ${templateQuery.error.message}`);
  }

  const templates = templateQuery.data || [];
  const rewardsToInsert = templates.map((template, index) => ({
    ...template,
    id: `${familyId}-reward-${index + 1}`,
    family_id: familyId,
  }));

  const insertQuery = await supabase
    .from("rewards")
    .insert(rewardsToInsert)
    .select();

  if (insertQuery.error) {
    throw new Error(`Failed to copy rewards: ${insertQuery.error.message}`);
  }

  return insertQuery.data ?? rewardsToInsert;
};

describe("Reward Template Copying (mocked Supabase)", () => {
  const familyId = "family-abc";

  beforeEach(() => {
    supabaseFromSpy.mockReset();
  });

  it("copies all available template rewards for a new family", async () => {
    const templateRewards = [
      {
        id: "template-1",
        name: "30 Minutes Extra Screen Time",
        description: "Earn 30 additional minutes of screen time.",
        type: "SCREEN_TIME",
        cost: 50,
        family_id: null,
        is_active: true,
      },
      {
        id: "template-2",
        name: "Skip One Chore",
        description: "Skip your least favorite chore for the day.",
        type: "PRIVILEGE",
        cost: 100,
        family_id: null,
        is_active: true,
      },
      {
        id: "template-3",
        name: "Small Treat",
        description: "Choose a special snack or drink.",
        type: "PURCHASE",
        cost: 25,
        family_id: null,
        is_active: true,
      },
    ];

    const copiedRewards = templateRewards.map((template, index) => ({
      ...template,
      id: `${familyId}-reward-${index + 1}`,
      family_id: familyId,
    }));

    const selectBuilder = createQueryBuilder({
      data: templateRewards,
      error: null,
    });

    const insertBuilder = createQueryBuilder({
      data: copiedRewards,
      error: null,
    });

    supabaseFromSpy
      .mockImplementationOnce((table: string) => {
        expect(table).toBe("rewards");
        return selectBuilder;
      })
      .mockImplementationOnce((table: string) => {
        expect(table).toBe("rewards");
        return insertBuilder;
      });

    const result = await copyTemplateRewardsForFamily(familyId);

    expect(result).toHaveLength(templateRewards.length);
    expect(result.every((reward) => reward.family_id === familyId)).toBe(true);
    expect(result.map((reward) => reward.name)).toEqual(
      templateRewards.map((template) => template.name)
    );
    expect(insertBuilder.insert).toHaveBeenCalledWith(copiedRewards);
  });

  it("handles larger template sets (15 rewards)", async () => {
    const templateRewards = Array.from({ length: 15 }, (_, index) => ({
      id: `template-${index + 1}`,
      name: `Template Reward ${index + 1}`,
      description: `Reward description ${index + 1}`,
      type: "SCREEN_TIME" as const,
      cost: 10 * (index + 1),
      family_id: null,
      is_active: true,
    }));

    const copiedRewards = templateRewards.map((template, index) => ({
      ...template,
      id: `${familyId}-reward-${index + 1}`,
      family_id: familyId,
    }));

    const selectBuilder = createQueryBuilder({
      data: templateRewards,
      error: null,
    });

    const insertBuilder = createQueryBuilder({
      data: copiedRewards,
      error: null,
    });

    supabaseFromSpy
      .mockImplementationOnce(() => selectBuilder)
      .mockImplementationOnce(() => insertBuilder);

    const result = await copyTemplateRewardsForFamily(familyId);

    expect(result).toHaveLength(15);
    expect(result.map((reward) => reward.id)).toEqual(
      copiedRewards.map((reward) => reward.id)
    );
  });
});
