export interface GridItem {
  id: number;
  value: number;
}

export interface TickMutation {
  id: number;
  newValue: number;
}

export interface TestPlan {
  initialState: GridItem[];
  ticks: TickMutation[][];
}

function mulberry32(seed: number): () => number {
  let s = seed;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class MockEngine {
  generateTestPlan(
    gridSize: number,
    tickCount: number,
    mutationRate: number,
    seed: number = 123,
  ): TestPlan {
    const rand = mulberry32(seed);

    const initialState: GridItem[] = [];
    const currentValues: number[] = new Array(gridSize);

    for (let i = 0; i < gridSize; i++) {
      const value = Math.floor(rand() * 100);
      initialState.push({ id: i, value });
      currentValues[i] = value;
    }

    const mutationCount = Math.ceil(gridSize * mutationRate);
    const ticks: TickMutation[][] = [];

    const indices: number[] = Array.from({ length: gridSize }, (_, i) => i);

    for (let t = 0; t < tickCount; t++) {
      for (let k = 0; k < mutationCount; k++) {
        const j = k + Math.floor(rand() * (gridSize - k));
        const tmp = indices[k] as number;
        indices[k] = indices[j] as number;
        indices[j] = tmp;
      }

      const tickMutations: TickMutation[] = [];

      for (let k = 0; k < mutationCount; k++) {
        const id = indices[k] as number;

        let newValue: number;
        do {
          newValue = Math.floor(rand() * 100);
        } while (newValue === (currentValues[id] as number));

        tickMutations.push({ id, newValue });
        currentValues[id] = newValue;
      }

      ticks.push(tickMutations);
    }

    return { initialState, ticks };
  }
}
