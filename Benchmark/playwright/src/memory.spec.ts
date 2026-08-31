import { test } from "@playwright/test";
import {
  allScenarios,
  scenarioLabel,
  scenarioKey,
  FRAMEWORKS,
  REPETITIONS,
} from "./helpers/scenarios";
import { forceGC, getHeapUsed } from "./helpers/cdp";
import { calcMedian, calcIQR, saveResult } from "./helpers/results";

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

    const heapDeltas: number[] = [];

    for (let rep = 0; rep < REPETITIONS; rep++) {
      await page.goto(url);
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("HeapProfiler.enable");
      await cdp.send("Performance.enable");
      await page.waitForSelector('[data-testid="benchmark-ready"]');
      await forceGC(cdp, page);
      const baseline = await getHeapUsed(cdp);
      await page.evaluate(() =>
        window.dispatchEvent(new CustomEvent("benchmark-start"))
      );
      await page.waitForSelector('[data-testid="benchmark-done"]', {
        timeout: 280_000,
      });
      await forceGC(cdp, page);
      const final = await getHeapUsed(cdp);

      heapDeltas.push(final - baseline);
    }

    const median = calcMedian(heapDeltas);
    const iqr = calcIQR(heapDeltas);

    saveResult(
      {
        ...scenario,
        metric: "memory",
        repetitions: heapDeltas,
        n: REPETITIONS,
        median,
        iqr,
      },
      DATE_STR
    );

    console.log(
      `[${scenarioKey(scenario)}] heapDelta median=${(median / 1024).toFixed(
        1
      )}KB iqr=${(iqr / 1024).toFixed(1)}KB`
    );
  });
}
