import {
  evaluateThreshold,
  evaluateBoolean,
  evaluateCompound,
  evaluateCriteriaMet,
} from "./unlock-evaluator";

// ─── 1.6 Threshold strategy ───────────────────────────────────────────────────

describe("evaluateThreshold", () => {
  it("returns true when current equals threshold (met-at)", () => {
    expect(
      evaluateThreshold({ current: 10, threshold: 10 }, { threshold: 10 }),
    ).toBe(true);
  });

  it("returns true when current exceeds threshold (met-above)", () => {
    expect(
      evaluateThreshold({ current: 15, threshold: 10 }, { threshold: 10 }),
    ).toBe(true);
  });

  it("returns false when current is below threshold (not-met-below)", () => {
    expect(
      evaluateThreshold({ current: 7, threshold: 10 }, { threshold: 10 }),
    ).toBe(false);
  });

  it("returns true when threshold is zero and current is zero", () => {
    expect(
      evaluateThreshold({ current: 0, threshold: 0 }, { threshold: 0 }),
    ).toBe(true);
  });

  it("defaults threshold to 0 when absent from criteriaConfig", () => {
    expect(evaluateThreshold({ current: 0, threshold: 0 }, {})).toBe(true);
  });
});

// ─── 1.7 Boolean strategy ─────────────────────────────────────────────────────

describe("evaluateBoolean", () => {
  it("returns true with positive value (truthy)", () => {
    expect(evaluateBoolean({ current: 1, threshold: 0 })).toBe(true);
  });

  it("returns true with large value", () => {
    expect(evaluateBoolean({ current: 5, threshold: 0 })).toBe(true);
  });

  it("returns false with zero (falsy)", () => {
    expect(evaluateBoolean({ current: 0, threshold: 0 })).toBe(false);
  });
});

// ─── 1.8 Compound strategy ────────────────────────────────────────────────────

describe("evaluateCompound", () => {
  it("returns true when top-level met flag is true (AND all met)", () => {
    expect(
      evaluateCompound({
        conditions: [
          {
            criteria_type: "quest_complete",
            current: 7,
            threshold: 5,
            met: true,
          },
          {
            criteria_type: "level_reached",
            current: 4,
            threshold: 3,
            met: true,
          },
        ],
        met: true,
      }),
    ).toBe(true);
  });

  it("returns false when top-level met flag is false (AND partial)", () => {
    expect(
      evaluateCompound({
        conditions: [
          {
            criteria_type: "quest_complete",
            current: 7,
            threshold: 5,
            met: true,
          },
          {
            criteria_type: "level_reached",
            current: 2,
            threshold: 3,
            met: false,
          },
        ],
        met: false,
      }),
    ).toBe(false);
  });

  it("returns true when OR compound has one condition met", () => {
    expect(
      evaluateCompound({
        conditions: [
          {
            criteria_type: "quest_complete",
            current: 2,
            threshold: 10,
            met: false,
          },
          {
            criteria_type: "boss_defeated",
            current: 5,
            threshold: 3,
            met: true,
          },
        ],
        met: true,
      }),
    ).toBe(true);
  });

  it("returns false when OR compound has no conditions met", () => {
    expect(
      evaluateCompound({
        conditions: [
          {
            criteria_type: "quest_complete",
            current: 2,
            threshold: 10,
            met: false,
          },
          {
            criteria_type: "boss_defeated",
            current: 1,
            threshold: 3,
            met: false,
          },
        ],
        met: false,
      }),
    ).toBe(false);
  });

  it("returns true for compound with boolean sub-condition met", () => {
    expect(
      evaluateCompound({
        conditions: [
          {
            criteria_type: "quest_complete",
            current: 7,
            threshold: 5,
            met: true,
          },
          {
            criteria_type: "class_change",
            current: 1,
            threshold: 0,
            met: true,
          },
        ],
        met: true,
      }),
    ).toBe(true);
  });
});

// ─── 1.9 Strategy dispatch ────────────────────────────────────────────────────

describe("evaluateCriteriaMet", () => {
  it("defaults to threshold strategy when evaluation_strategy is absent", () => {
    // current >= threshold → met
    expect(
      evaluateCriteriaMet({ current: 10, threshold: 10 }, { threshold: 10 }),
    ).toBe(true);
    // current < threshold → not met
    expect(
      evaluateCriteriaMet({ current: 5, threshold: 10 }, { threshold: 10 }),
    ).toBe(false);
  });

  it("uses threshold strategy when explicitly set", () => {
    expect(
      evaluateCriteriaMet(
        { current: 10, threshold: 10 },
        { threshold: 10, evaluation_strategy: "threshold" },
      ),
    ).toBe(true);
  });

  it("uses boolean strategy when set", () => {
    expect(
      evaluateCriteriaMet(
        { current: 1, threshold: 0 },
        { evaluation_strategy: "boolean" },
      ),
    ).toBe(true);
    expect(
      evaluateCriteriaMet(
        { current: 0, threshold: 0 },
        { evaluation_strategy: "boolean" },
      ),
    ).toBe(false);
  });

  it("uses compound strategy when set", () => {
    expect(
      evaluateCriteriaMet(
        {
          conditions: [
            {
              criteria_type: "quest_complete",
              current: 7,
              threshold: 5,
              met: true,
            },
          ],
          met: true,
        },
        { evaluation_strategy: "compound" },
      ),
    ).toBe(true);
  });

  it("falls back to threshold and logs warning for unknown strategy", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const result = evaluateCriteriaMet(
      { current: 10, threshold: 5 },
      { threshold: 5, evaluation_strategy: "unknown_strategy" },
    );
    expect(result).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("Unknown evaluation strategy"),
    );
    warnSpy.mockRestore();
  });
});
