import type {
  CriteriaConfig,
  AchievementProgressValue,
  StandardProgress,
  CompoundProgress,
} from "./types";

export type EvaluationStrategy = "threshold" | "boolean" | "compound";

// ─── Strategy functions (pure logic) ──────────────────────────────────────────

export function evaluateThreshold(
  progress: StandardProgress,
  criteriaConfig: CriteriaConfig,
): boolean {
  const threshold = criteriaConfig?.threshold ?? 0;
  return progress.current >= threshold;
}

export function evaluateBoolean(progress: StandardProgress): boolean {
  return progress.current > 0;
}

export function evaluateCompound(progress: CompoundProgress): boolean {
  return progress.met === true;
}

// ─── Strategy dispatch ────────────────────────────────────────────────────────

export function evaluateCriteriaMet(
  progress: AchievementProgressValue,
  criteriaConfig: CriteriaConfig,
): boolean {
  const strategy =
    (criteriaConfig?.evaluation_strategy as EvaluationStrategy | undefined) ??
    "threshold";

  switch (strategy) {
    case "threshold":
      return evaluateThreshold(progress as StandardProgress, criteriaConfig);
    case "boolean":
      return evaluateBoolean(progress as StandardProgress);
    case "compound":
      return evaluateCompound(progress as CompoundProgress);
    default:
      console.warn(
        `Unknown evaluation strategy: "${strategy}" — falling back to threshold`,
      );
      return evaluateThreshold(progress as StandardProgress, criteriaConfig);
  }
}
