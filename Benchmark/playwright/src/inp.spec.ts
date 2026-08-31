import { test } from "@playwright/test";
import {
  allScenarios,
  scenarioLabel,
  scenarioKey,
  FRAMEWORKS,
  REPETITIONS,
} from "./helpers/scenarios";
import { injectINPObserver, collectINPEntries, calcINP } from "./helpers/inp";
import { saveResult } from "./helpers/results";
import type { EventEntry } from "./helpers/inp";
import type { INPOnlyResult } from "./helpers/results";

const DATE_STR = new Date().toISOString().slice(0, 10);

for (const scenario of allScenarios()) {
  const { framework, gridSize, intervalMs, tickCount } = scenario;
  const url = `${FRAMEWORKS[framework]}?gridSize=${gridSize}&tickInterval=${intervalMs}&tickCount=${tickCount}`;

  test(scenarioLabel(scenario), async ({ page }) => {
    test.setTimeout((REPETITIONS + 1) * 290_000);

    await page.goto(url);
    await page.waitForSelector('[data-testid="benchmark-ready"]');
    await page.evaluate(() =>
      window.dispatchEvent(new CustomEvent("benchmark-start")),
    );
    await page.waitForSelector('[data-testid="benchmark-done"]', {
      timeout: 280_000,
    });

    const allINPEntries: EventEntry[] = [];

    for (let rep = 0; rep < REPETITIONS; rep++) {
      await page.goto(url);
      await injectINPObserver(page);
      await page.waitForSelector('[data-testid="benchmark-ready"]');

      const box = await page.locator(".cell:nth-child(21)").boundingBox();
      if (!box)
        throw new Error(
          "Cell .cell:nth-child(21) not found — is the grid rendered?",
        );
      const cx = box.x + box.width / 2;
      const cy = box.y + box.height / 2;
      let isRunning = true;
      const clickLoop = (async () => {
        while (isRunning) {
          await page.mouse.click(cx, cy).catch(() => {});
          await new Promise<void>((r) => setTimeout(r, 100));
        }
      })();

      try {
        await page.evaluate(() =>
          window.dispatchEvent(new CustomEvent("benchmark-start")),
        );
        await page.waitForSelector('[data-testid="benchmark-done"]', {
          timeout: 280_000,
        });
      } finally {
        isRunning = false;
        await clickLoop;
      }

      const repEntries = await collectINPEntries(page);
      allINPEntries.push(...repEntries);
    }

    const inp = calcINP(allINPEntries);
    const result: INPOnlyResult = {
      ...scenario,
      metric: "inp",
      n: REPETITIONS,
      inp,
    };

    saveResult(result, DATE_STR);

    console.log(
      `[${scenarioKey(scenario)}] INP=${inp.inp}ms pooledEntries=${inp.pooledEntries}`,
    );
  });
}
