const _params = new URLSearchParams(window.location.search);

function getParam(name: string, fallback: number): number {
  const v = _params.get(name);
  return v !== null && v !== "" && !isNaN(Number(v)) ? Number(v) : fallback;
}

export const GRID_SIZE = getParam("gridSize", 900);
export const TICK_INTERVAL_MS = getParam("tickInterval", 16);
export const TICK_COUNT = getParam("tickCount", 500);
export const MUTATION_RATE = 0.05;
export const SEED = 123;
export const IS_BENCHMARK_MODE = _params.has("gridSize");
