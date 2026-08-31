/// <reference lib="webworker" />

const ctx = self as unknown as DedicatedWorkerGlobalScope;

ctx.onmessage = (e: MessageEvent<{ command: string; intervalMs: number }>) => {
  if (e.data.command !== 'start') return;

  const intervalMs = e.data.intervalMs;
  let expectedTime = performance.now() + intervalMs;

  function scheduleNextTick() {
    const now = performance.now();
    const drift = now - expectedTime;
    const nextDelay = Math.max(0, intervalMs - drift);
    expectedTime += intervalMs;

    setTimeout(() => {
      ctx.postMessage({ type: 'TICK' });
      scheduleNextTick();
    }, nextDelay);
  }

  scheduleNextTick();
};
