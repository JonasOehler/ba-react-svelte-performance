import type { CDPSession, Page } from "@playwright/test";

export type TraceEvent = {
  ph: string;
  cat?: string;
  name: string;
  dur?: number;
  ts?: number;
};

export type TraceResult = {
  scriptingMs: number;
  renderingMs: number;
  scriptingMsPerTick: number;
  renderingMsPerTick: number;
};

const SCRIPTING_NAMES = new Set([
  "EvaluateScript",
  "FunctionCall",
  "EventDispatch",
  "v8.execute",
  "RunMicrotasks",
]);

const RENDERING_NAMES = new Set([
  "RecalculateStyles",
  "Layout",
  "UpdateLayerTree",
  "ParseAuthorStyleSheet",
]);

export async function forceGC(
  cdp: CDPSession,
  page: Page,
  times = 3,
  pauseMs = 100
): Promise<void> {
  for (let i = 0; i < times; i++) {
    await cdp.send("HeapProfiler.collectGarbage");
    await page.waitForTimeout(pauseMs);
  }
}

export async function getHeapUsed(cdp: CDPSession): Promise<number> {
  const { metrics } = (await cdp.send("Performance.getMetrics")) as {
    metrics: Array<{ name: string; value: number }>;
  };
  return metrics.find((m) => m.name === "JSHeapUsedSize")?.value ?? 0;
}

export async function startTrace(cdp: CDPSession): Promise<TraceEvent[]> {
  const events: TraceEvent[] = [];
  cdp.on("Tracing.dataCollected", (data: { value: unknown[] }) => {
    events.push(...(data.value as TraceEvent[]));
  });
  await cdp.send("Tracing.start", {
    categories: "devtools.timeline,disabled-by-default-devtools.timeline",
    transferMode: "ReportEvents",
  });
  return events;
}

export async function stopTrace(cdp: CDPSession): Promise<void> {
  await cdp.send("Tracing.end");
  await new Promise<void>((resolve) =>
    cdp.once("Tracing.tracingComplete", () => resolve())
  );
}

export function parseTrace(
  events: TraceEvent[],
  tickCount: number
): TraceResult {
  let scriptingMs = 0;
  let renderingMs = 0;
  for (const e of events) {
    if (e.ph === "X" && e.cat?.includes("devtools.timeline") && e.dur) {
      if (SCRIPTING_NAMES.has(e.name)) scriptingMs += e.dur / 1000;
      if (RENDERING_NAMES.has(e.name)) renderingMs += e.dur / 1000;
    }
  }
  return {
    scriptingMs,
    renderingMs,
    scriptingMsPerTick: scriptingMs / tickCount,
    renderingMsPerTick: renderingMs / tickCount,
  };
}
