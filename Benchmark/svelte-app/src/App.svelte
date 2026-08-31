<script module lang="ts">
  import { MockEngine } from '@benchmark/shared-logic';
  import type { TestPlan } from '@benchmark/shared-logic';
  import { GRID_SIZE, TICK_COUNT, MUTATION_RATE, SEED, TICK_INTERVAL_MS } from './config';

  const engine = new MockEngine();
  const plan: TestPlan = engine.generateTestPlan(GRID_SIZE, TICK_COUNT, MUTATION_RATE, SEED);
</script>

<script lang="ts">
  import Grid from './Grid.svelte';
  import { IS_BENCHMARK_MODE } from './config';

  let grid = $state(plan.initialState.map(item => ({ ...item })));
  let phase = $state<'ready' | 'done'>('ready');
  let tickCount = $state(0);
  let tickIndex = 0;

  $effect(() => {
    const worker = new Worker(
      new URL('./ticker.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (e: MessageEvent<{ type: string }>) => {
      if (e.data.type !== 'TICK') return;
      if (tickIndex >= plan.ticks.length) return;

      const mutations = plan.ticks[tickIndex];
      for (const { id, newValue } of mutations) {
        grid[id].value = newValue;
      }

      tickIndex++;
      tickCount = tickIndex;

      if (tickIndex >= plan.ticks.length) {
        worker.terminate();
        phase = 'done';
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
  });
</script>

<div
  style="padding: 16px; font-family: monospace"
  data-testid={phase === 'done' ? 'benchmark-done' : 'benchmark-ready'}
>
  <div style="margin-bottom: 8px; font-size: 12px; color: #555">
    Svelte 5 + Runes — tick {Math.min(tickCount, TICK_COUNT)}/{TICK_COUNT}
    {#if phase === 'done'} — done{/if}
  </div>
  <Grid items={grid} />
</div>
