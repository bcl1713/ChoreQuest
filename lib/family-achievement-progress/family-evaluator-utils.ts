function sumValues(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0);
}

function minValue(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.min(...values);
}

export function aggregate(values: number[], mode: "sum" | "all"): number {
  return mode === "all" ? minValue(values) : sumValues(values);
}
