export const GRID_SIZES = [
  100, 400, 900, 1600, 4000, 6000, 8000, 10000,
] as const;

export const FREQUENCIES = [
  { intervalMs: 100, tickCount: 100 },
  { intervalMs: 50, tickCount: 200 },
  { intervalMs: 33, tickCount: 300 },
  { intervalMs: 16, tickCount: 500 },
] as const;

export const FRAMEWORKS = {
  react: "http://localhost:4173",
  svelte: "http://localhost:4174",
} as const;

export const REPETITIONS = 10;

export type Framework = keyof typeof FRAMEWORKS;

export type Scenario = {
  framework: Framework;
  gridSize: number;
  intervalMs: number;
  tickCount: number;
};

export function allScenarios(): Scenario[] {
  const result: Scenario[] = [];
  for (const gridSize of GRID_SIZES) {
    for (const { intervalMs, tickCount } of FREQUENCIES) {
      for (const framework of Object.keys(FRAMEWORKS) as Framework[]) {
        result.push({ framework, gridSize, intervalMs, tickCount });
      }
    }
  }
  return result;
}

export function scenarioLabel(s: Scenario): string {
  return `${s.framework} n=${s.gridSize} f=${s.intervalMs}ms`;
}

export function scenarioKey(s: Scenario): string {
  return `${s.framework}_n${s.gridSize}_f${s.intervalMs}`;
}
