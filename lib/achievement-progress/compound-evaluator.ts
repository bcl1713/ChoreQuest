import type {
  CompoundCondition,
  CompoundConditionResult,
  EvaluatorFn,
  EvaluatorResult,
} from "./types";

/**
 * Factory that creates the compound evaluator bound to a lazy registry getter.
 * The getter is called at evaluation time (not import time) to avoid circular
 * module dependencies between compound-evaluator.ts and evaluators.ts.
 */
export function createCompoundEvaluator(
  getRegistry: () => Record<string, EvaluatorFn>,
): EvaluatorFn {
  return async (
    client,
    characterId,
    userId,
    criteriaConfig,
  ): Promise<EvaluatorResult> => {
    const registry = getRegistry();
    const conditions =
      (criteriaConfig?.conditions as CompoundCondition[] | undefined) ?? [];
    const operator = (criteriaConfig?.operator as "AND" | "OR") ?? "AND";

    const results: CompoundConditionResult[] = [];

    for (const condition of conditions) {
      const subEvaluator = registry[condition.criteria_type];
      if (!subEvaluator) {
        console.warn(
          `Unknown sub-condition criteria type: ${condition.criteria_type} — treating as not met`,
        );
        results.push({
          criteria_type: condition.criteria_type,
          current: 0,
          threshold: condition.threshold ?? 0,
          met: false,
        });
        continue;
      }

      const result = await subEvaluator(client, characterId, userId, condition);
      const met = condition.boolean
        ? result.current > 0
        : result.current >= (condition.threshold ?? 0);

      results.push({
        criteria_type: condition.criteria_type,
        current: result.current,
        threshold: condition.threshold ?? 0,
        met,
      });
    }

    if (results.length === 0) {
      return {
        current: 0,
        compoundConditions: [],
        compoundMet: false,
      };
    }

    const overallMet =
      operator === "OR"
        ? results.some((r) => r.met)
        : results.every((r) => r.met);

    return {
      current: results.filter((r) => r.met).length,
      compoundConditions: results,
      compoundMet: overallMet,
    };
  };
}
