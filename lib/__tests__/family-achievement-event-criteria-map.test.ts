import {
  FAMILY_EVENT_CRITERIA_MAP,
  ALL_FAMILY_CRITERIA_TYPES,
  FAMILY_EVALUATOR_REGISTRY,
} from "../family-achievement-progress/family-evaluators";

describe("FAMILY_EVENT_CRITERIA_MAP", () => {
  it("includes honor_earned in BOSS_COMPLETED so boss rewards update honor achievements", () => {
    expect(FAMILY_EVENT_CRITERIA_MAP.BOSS_COMPLETED).toContain("honor_earned");
  });

  it("includes honor_earned in ALL_FAMILY_CRITERIA_TYPES", () => {
    expect(ALL_FAMILY_CRITERIA_TYPES).toContain("honor_earned");
  });

  it("has a registered evaluator for every criteria type in ALL_FAMILY_CRITERIA_TYPES", () => {
    for (const criteriaType of ALL_FAMILY_CRITERIA_TYPES) {
      expect(FAMILY_EVALUATOR_REGISTRY).toHaveProperty(criteriaType);
    }
  });

  it("covers all registry criteria types in at least one event mapping", () => {
    const mappedTypes = new Set(
      Object.values(FAMILY_EVENT_CRITERIA_MAP).flat(),
    );
    for (const criteriaType of Object.keys(FAMILY_EVALUATOR_REGISTRY)) {
      expect(mappedTypes).toContain(criteriaType);
    }
  });
});
