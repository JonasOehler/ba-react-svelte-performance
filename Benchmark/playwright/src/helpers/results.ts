import * as fs from "node:fs";
import * as path from "node:path";
import type { INPResult } from "./inp";
import type { TraceResult } from "./cdp";
import type { Scenario } from "./scenarios";

export type RepPerfResult = {
  scriptingMsPerTick: number;
  renderingMsPerTick: number;
  longTaskCount: number;
  longTaskMs: number;
};

export type MemoryScenarioResult = Scenario & {
  metric: "memory";
  repetitions: number[];
  n: number;
  median: number;
  iqr: number;
};

export type PerformanceScenarioResult = Scenario & {
  metric: "performance";
  repetitions: RepPerfResult[];
  n: number;
  median: {
    scriptingMsPerTick: number;
    renderingMsPerTick: number;
    longTaskCount: number;
    longTaskMs: number;
  };
  iqr: {
    scriptingMsPerTick: number;
    renderingMsPerTick: number;
    longTaskCount: number;
    longTaskMs: number;
  };
};

export type INPOnlyResult = Scenario & {
  metric: "inp";
  n: number;
  inp: INPResult;
};

function sorted(values: number[]): number[] {
  return [...values].sort((a, b) => a - b);
}

export function calcMedian(values: number[]): number {
  const s = sorted(values);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1]! + s[mid]!) / 2 : s[mid]!;
}

export function calcIQR(values: number[]): number {
  const s = sorted(values);
  const half = Math.floor(s.length / 2);
  const q1 = calcMedian(s.slice(0, half));
  const q3 = calcMedian(s.slice(Math.ceil(s.length / 2)));
  return q3 - q1;
}

function resultsDir(dateStr: string): string {
  return path.join(__dirname, "..", "..", "results", dateStr);
}

export function saveResult(
  data: MemoryScenarioResult | PerformanceScenarioResult | INPOnlyResult,
  dateStr: string
): void {
  const dir = resultsDir(dateStr);
  fs.mkdirSync(dir, { recursive: true });
  const prefix =
    data.metric === "memory"
      ? "memory"
      : data.metric === "inp"
      ? "inp"
      : "perf";
  const name = `${prefix}_${data.framework}_n${data.gridSize}_f${data.intervalMs}.json`;
  fs.writeFileSync(path.join(dir, name), JSON.stringify(data, null, 2));
}

export function writeSummaryCSV(dateStr: string): void {
  const dir = resultsDir(dateStr);
  if (!fs.existsSync(dir))
    throw new Error(`Results directory not found: ${dir}`);

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const memMap = new Map<string, MemoryScenarioResult>();
  const perfMap = new Map<string, PerformanceScenarioResult>();
  const inpMap = new Map<string, INPOnlyResult>();

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8")) as
      | MemoryScenarioResult
      | PerformanceScenarioResult
      | INPOnlyResult;
    const key = `${data.framework}_n${data.gridSize}_f${data.intervalMs}`;
    if (data.metric === "memory") memMap.set(key, data as MemoryScenarioResult);
    else if (data.metric === "inp") inpMap.set(key, data as INPOnlyResult);
    else perfMap.set(key, data as PerformanceScenarioResult);
  }

  const header = [
    "framework",
    "gridSize",
    "tickInterval",
    "tickCount",
    "inp",
    "inputDelay",
    "processingTime",
    "presentationDelay",
    "pooledEntries",
    "scriptingMsPerTick_median",
    "scriptingMsPerTick_iqr",
    "renderingMsPerTick_median",
    "renderingMsPerTick_iqr",
    "longTaskCount_median",
    "longTaskCount_iqr",
    "longTaskMs_median",
    "longTaskMs_iqr",
    "heapDelta_median_bytes",
  ].join(",");

  const rows: string[] = [];
  for (const [key, perf] of perfMap) {
    const mem = memMap.get(key);
    const inp = inpMap.get(key);
    rows.push(
      [
        perf.framework,
        perf.gridSize,
        perf.intervalMs,
        perf.tickCount,
        inp?.inp.inp ?? "",
        inp?.inp.inputDelay ?? "",
        inp?.inp.processingTime ?? "",
        inp?.inp.presentationDelay ?? "",
        inp?.inp.pooledEntries ?? "",
        perf.median.scriptingMsPerTick,
        perf.iqr.scriptingMsPerTick,
        perf.median.renderingMsPerTick,
        perf.iqr.renderingMsPerTick,
        perf.median.longTaskCount,
        perf.iqr.longTaskCount,
        perf.median.longTaskMs,
        perf.iqr.longTaskMs,
        mem?.median ?? "",
      ].join(",")
    );
  }

  const csv = header + "\n" + rows.join("\n") + "\n";
  fs.writeFileSync(path.join(dir, "summary.csv"), csv);
  console.log(
    `Written: ${path.join(dir, "summary.csv")} (${rows.length} rows)`
  );
}
