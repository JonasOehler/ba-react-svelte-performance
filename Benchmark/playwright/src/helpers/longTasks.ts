import type { Page } from "@playwright/test";

export type LongTaskResult = {
  count: number;
  totalMs: number;
};

export async function injectLongTaskObserver(page: Page): Promise<void> {
  await page.waitForTimeout(100);
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>)["__longTasks"] = [];
    const obs = new PerformanceObserver((list) => {
      for (const e of list.getEntries())
        (window as unknown as Record<string, number[]>)["__longTasks"].push(
          e.duration
        );
    });
    obs.observe({ type: "longtask", buffered: false });
    (window as unknown as Record<string, unknown>)["__longTaskObserver"] = obs;
  });
}

export async function collectLongTasks(page: Page): Promise<LongTaskResult> {
  return page.evaluate(() => {
    const obs = (window as unknown as Record<string, PerformanceObserver>)[
      "__longTaskObserver"
    ];
    if (obs) {
      for (const e of obs.takeRecords())
        (window as unknown as Record<string, number[]>)["__longTasks"].push(
          e.duration
        );
      obs.disconnect();
    }
    const tasks =
      (window as unknown as Record<string, number[]>)["__longTasks"] ?? [];
    return { count: tasks.length, totalMs: tasks.reduce((s, d) => s + d, 0) };
  });
}
