import { createCompoundEvaluator } from "./achievement-progress/compound-evaluator";
import type { EvaluatorFn } from "./achievement-progress/types";

const CHARACTER_ID = "char-001";
const USER_ID = "user-001";

function makeMockClient() {
  return {} as never;
}

// 2.5 Compound evaluator tests
describe("createCompoundEvaluator", () => {
  it("delegates to sub-evaluators for each condition", async () => {
    const questEvaluator = jest
      .fn<ReturnType<EvaluatorFn>, Parameters<EvaluatorFn>>()
      .mockResolvedValue({ current: 7 });
    const levelEvaluator = jest
      .fn<ReturnType<EvaluatorFn>, Parameters<EvaluatorFn>>()
      .mockResolvedValue({ current: 4 });

    const registry: Record<string, EvaluatorFn> = {
      quest_complete: questEvaluator,
      level_reached: levelEvaluator,
    };

    const evaluator = createCompoundEvaluator(() => registry);
    const result = await evaluator(makeMockClient(), CHARACTER_ID, USER_ID, {
      operator: "AND",
      conditions: [
        { criteria_type: "quest_complete", threshold: 5 },
        { criteria_type: "level_reached", threshold: 3 },
      ],
    });

    expect(questEvaluator).toHaveBeenCalledTimes(1);
    expect(levelEvaluator).toHaveBeenCalledTimes(1);
    expect(result.compoundConditions).toHaveLength(2);
    expect(result.compoundMet).toBe(true);
  });

  it("returns compoundMet false when AND has one unmet condition", async () => {
    const registry: Record<string, EvaluatorFn> = {
      quest_complete: jest.fn().mockResolvedValue({ current: 7 }),
      level_reached: jest.fn().mockResolvedValue({ current: 2 }),
    };

    const evaluator = createCompoundEvaluator(() => registry);
    const result = await evaluator(makeMockClient(), CHARACTER_ID, USER_ID, {
      operator: "AND",
      conditions: [
        { criteria_type: "quest_complete", threshold: 5 },
        { criteria_type: "level_reached", threshold: 3 },
      ],
    });

    expect(result.compoundMet).toBe(false);
    expect(result.compoundConditions![0].met).toBe(true);
    expect(result.compoundConditions![1].met).toBe(false);
  });

  it("defaults operator to AND when absent", async () => {
    const registry: Record<string, EvaluatorFn> = {
      quest_complete: jest.fn().mockResolvedValue({ current: 3 }),
      level_reached: jest.fn().mockResolvedValue({ current: 1 }),
    };

    const evaluator = createCompoundEvaluator(() => registry);
    const result = await evaluator(makeMockClient(), CHARACTER_ID, USER_ID, {
      conditions: [
        { criteria_type: "quest_complete", threshold: 5 },
        { criteria_type: "level_reached", threshold: 3 },
      ],
    });

    // AND with both unmet → false
    expect(result.compoundMet).toBe(false);
  });

  it("handles OR: returns compoundMet true when one condition is met", async () => {
    const registry: Record<string, EvaluatorFn> = {
      quest_complete: jest.fn().mockResolvedValue({ current: 2 }),
      boss_defeated: jest.fn().mockResolvedValue({ current: 5 }),
    };

    const evaluator = createCompoundEvaluator(() => registry);
    const result = await evaluator(makeMockClient(), CHARACTER_ID, USER_ID, {
      operator: "OR",
      conditions: [
        { criteria_type: "quest_complete", threshold: 10 },
        { criteria_type: "boss_defeated", threshold: 3 },
      ],
    });

    expect(result.compoundMet).toBe(true);
  });

  it("handles boolean sub-condition", async () => {
    const registry: Record<string, EvaluatorFn> = {
      quest_complete: jest.fn().mockResolvedValue({ current: 7 }),
      class_change: jest.fn().mockResolvedValue({ current: 1 }),
    };

    const evaluator = createCompoundEvaluator(() => registry);
    const result = await evaluator(makeMockClient(), CHARACTER_ID, USER_ID, {
      operator: "AND",
      conditions: [
        { criteria_type: "quest_complete", threshold: 5 },
        { criteria_type: "class_change", boolean: true },
      ],
    });

    expect(result.compoundMet).toBe(true);
    expect(result.compoundConditions![1].met).toBe(true);
  });

  it("handles unknown sub-condition: logs warning and treats as not met", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const registry: Record<string, EvaluatorFn> = {
      quest_complete: jest.fn().mockResolvedValue({ current: 7 }),
    };

    const evaluator = createCompoundEvaluator(() => registry);
    const result = await evaluator(makeMockClient(), CHARACTER_ID, USER_ID, {
      operator: "AND",
      conditions: [
        { criteria_type: "quest_complete", threshold: 5 },
        { criteria_type: "nonexistent_type", threshold: 1 },
      ],
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        "Unknown sub-condition criteria type: nonexistent_type",
      ),
    );
    expect(result.compoundMet).toBe(false);
    expect(result.compoundConditions![1].met).toBe(false);

    warnSpy.mockRestore();
  });

  it("returns compoundMet false for empty conditions array", async () => {
    const evaluator = createCompoundEvaluator(() => ({}));
    const result = await evaluator(makeMockClient(), CHARACTER_ID, USER_ID, {
      operator: "AND",
      conditions: [],
    });

    expect(result.compoundMet).toBe(false);
    expect(result.current).toBe(0);
    expect(result.compoundConditions).toEqual([]);
  });

  it("returns compoundMet false for missing conditions (defaults to [])", async () => {
    const evaluator = createCompoundEvaluator(() => ({}));
    const result = await evaluator(makeMockClient(), CHARACTER_ID, USER_ID, {
      operator: "AND",
    });

    expect(result.compoundMet).toBe(false);
    expect(result.current).toBe(0);
    expect(result.compoundConditions).toEqual([]);
  });

  it("returns current as count of met conditions", async () => {
    const registry: Record<string, EvaluatorFn> = {
      quest_complete: jest.fn().mockResolvedValue({ current: 7 }),
      level_reached: jest.fn().mockResolvedValue({ current: 4 }),
      boss_defeated: jest.fn().mockResolvedValue({ current: 1 }),
    };

    const evaluator = createCompoundEvaluator(() => registry);
    const result = await evaluator(makeMockClient(), CHARACTER_ID, USER_ID, {
      operator: "AND",
      conditions: [
        { criteria_type: "quest_complete", threshold: 5 },
        { criteria_type: "level_reached", threshold: 3 },
        { criteria_type: "boss_defeated", threshold: 3 }, // not met: 1 < 3
      ],
    });

    expect(result.current).toBe(2); // two conditions met
  });
});
