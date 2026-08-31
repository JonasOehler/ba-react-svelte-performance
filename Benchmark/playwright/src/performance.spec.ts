import { test } from "@playwright/test";
import {
  allScenarios,
  scenarioLabel,
  scenarioKey,
  FRAMEWORKS,
  REPETITIONS,
} from "./helpers/scenarios";
import { startTrace, stopTrace, parseTrace } from "./helpers/cdp";
import { calcMedian, calcIQR, saveResult } from "./helpers/results";
import type { RepPerfResult } from "./helpers/results";
import { injectLongTaskObserver, collectLongTasks } from "./helpers/longTasks";

const DATE_STR = new Date().toISOString().slice(0, 10);

for (const scenario of allScenarios()) {
  const { framework, gridSize, intervalMs, tickCount } = scenario;
  const url = `${FRAMEWORKS[framework]}?gridSize=${gridSize}&tickInterval=${intervalMs}&tickCount=${tickCount}`;

  test(scenarioLabel(scenario), async ({ page }) => {
    test.setTimeout((REPETITIONS + 1) * 290_000);

    await page.goto(url);
    await page.waitForSelector('[data-testid="benchmark-ready"]');
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent("benchmark-start"))
    );
    await page.waitForSelector('[data-testid="benchmark-done"]', {
      timeout: 280_000,
    });

    const repResults: RepPerfResult[] = [];

    for (let rep = 0; rep < REPETITIONS; rep++) {
      await page.goto(url);
      const cdp = await page.context().newCDPSession(page);
      await page.waitForSelector('[data-testid="benchmark-ready"]');
      await injectLongTaskObserver(page);
      const traceEvents = await startTrace(cdp);
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent("benchmark-start"))
      );
      await page.waitForSelector('[data-testid="benchmark-done"]', {
        timeout: 280_000,
      });

      await stopTrace(cdp);

      const { scriptingMsPerTick, renderingMsPerTick } = parseTrace(
        traceEvents,
        tickCount
      );
      const { count: longTaskCount, totalMs: longTaskMs } =
        await collectLongTasks(page);
      repResults.push({
        scriptingMsPerTick,
        renderingMsPerTick,
        longTaskCount,
        longTaskMs,
      });
    }

    const scriptingValues = repResults.map((r) => r.scriptingMsPerTick);
    const renderingValues = repResults.map((r) => r.renderingMsPerTick);
    const longTaskCounts = repResults.map((r) => r.longTaskCount);
    const longTaskMsValues = repResults.map((r) => r.longTaskMs);

    saveResult(
      {
        ...scenario,
        metric: "performance",
        repetitions: repResults,
        n: REPETITIONS,
        median: {
          scriptingMsPerTick: calcMedian(scriptingValues),
          renderingMsPerTick: calcMedian(renderingValues),
          longTaskCount: calcMedian(longTaskCounts),
          longTaskMs: calcMedian(longTaskMsValues),
        },
        iqr: {
          scriptingMsPerTick: calcIQR(scriptingValues),
          renderingMsPerTick: calcIQR(renderingValues),
          longTaskCount: calcIQR(longTaskCounts),
          longTaskMs: calcIQR(longTaskMsValues),
        },
      },
      DATE_STR
    );

    console.log(
      `[${scenarioKey(scenario)}] scripting/tick median=${calcMedian(
        scriptingValues
      ).toFixed(2)}ms` + ` longTasks(median)=${calcMedian(longTaskCounts)}`
    );
  });
}
