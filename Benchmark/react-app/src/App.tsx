import { useState, useRef, useEffect } from "react";
import { MockEngine } from "@benchmark/shared-logic";
import type { GridItem, TestPlan } from "@benchmark/shared-logic";
import { Grid } from "./Grid";
import {
  GRID_SIZE, TICK_COUNT, MUTATION_RATE, SEED,
  TICK_INTERVAL_MS, IS_BENCHMARK_MODE,
} from "./config";

const engine = new MockEngine();
const plan: TestPlan = engine.generateTestPlan(GRID_SIZE, TICK_COUNT, MUTATION_RATE, SEED);

export function App() {
  const tickIndexRef = useRef<number>(0);
  const [grid, setGrid] = useState<GridItem[]>(plan.initialState);
  const [phase, setPhase] = useState<'ready' | 'done'>('ready');
  const [tickCount, setTickCount] = useState(0);

  const isDone = phase === 'done';

  useEffect(() => {
    const worker = new Worker(
      new URL('./ticker.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e: MessageEvent<{ type: string }>) => {
      if (e.data.type !== 'TICK') return;
      const ticks = plan.ticks;
      if (tickIndexRef.current >= ticks.length) return;
      const mutations = ticks[tickIndexRef.current];
      setGrid((prev) => {
        const next = [...prev];
        for (const { id, newValue } of mutations) {
          next[id] = { id, value: newValue };
        }
        return next;
      });
      tickIndexRef.current++;
      setTickCount(tickIndexRef.current);
      if (tickIndexRef.current >= ticks.length) {
        worker.terminate();
        setPhase('done');
      }
    };

    const startWorker = () => {
      worker.postMessage({ command: 'start', intervalMs: TICK_INTERVAL_MS });
    };

    window.addEventListener('benchmark-start', startWorker, { once: true });

    if (!IS_BENCHMARK_MODE) {
      window.dispatchEvent(new CustomEvent('benchmark-start'));
    }

    return () => {
      worker.terminate();
      window.removeEventListener('benchmark-start', startWorker);
    };
  }, []);

  return (
    <div
      style={{ padding: 16, fontFamily: "monospace" }}
      data-testid={isDone ? 'benchmark-done' : 'benchmark-ready'}
    >
      <div style={{ marginBottom: 8, fontSize: 12, color: "#555" }}>
        React 19 + Compiler — tick {Math.min(tickCount, TICK_COUNT)}/{TICK_COUNT}
        {isDone && " — done"}
      </div>
      <Grid items={grid} />
    </div>
  );
}

export default App;
