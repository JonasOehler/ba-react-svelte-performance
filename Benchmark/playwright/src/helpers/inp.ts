import type { Page } from '@playwright/test';

export type EventEntry = {
  duration: number;
  inputDelay: number;
  processingTime: number;
  presentationDelay: number;
};

export type INPResult = {
  inp: number;
  inputDelay: number;
  processingTime: number;
  presentationDelay: number;
  pooledEntries: number;
};

// Inject a PerformanceObserver that captures all 'event' performance entries.
// Must be called after page.goto() since it injects into the live JS context.
export async function injectINPObserver(page: Page): Promise<void> {
  await page.evaluate(() => {
    (window as unknown as Record<string, unknown>)['__inpEntries'] = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEventTiming;
        (window as unknown as Record<string, EventEntry[]>)['__inpEntries'].push({
          duration:          e.duration,
          inputDelay:        e.processingStart - e.startTime,
          processingTime:    e.processingEnd   - e.processingStart,
          presentationDelay: e.duration - (e.processingEnd - e.startTime),
        });
      }
    }).observe({ type: 'event', buffered: true, durationThreshold: 0 } as PerformanceObserverInit);
  });
}

// Collect the raw EventEntry array accumulated by the observer for this repetition.
// Call once after benchmark-done is detected for each rep.
export async function collectINPEntries(page: Page): Promise<EventEntry[]> {
  return page.evaluate(() =>
    (window as unknown as Record<string, EventEntry[]>)['__inpEntries'] ?? []
  );
}

// Calculate INP from a pool of entries collected across all repetitions.
// INP spec: highest duration, but ignore 1 outlier per 50 interactions.
// With 10 reps x ~20 clicks = ~200 entries: 4 ignored -> 5th worst = robust INP.
export function calcINP(allEntries: EventEntry[]): INPResult {
  if (allEntries.length === 0) {
    return { inp: 0, inputDelay: 0, processingTime: 0, presentationDelay: 0, pooledEntries: 0 };
  }
  const sorted = [...allEntries].sort((a, b) => b.duration - a.duration);
  const ignoreCount = Math.floor(allEntries.length / 50);
  const worst = sorted[ignoreCount] ?? sorted[0]!;
  return {
    inp:               worst.duration,
    inputDelay:        worst.inputDelay,
    processingTime:    worst.processingTime,
    presentationDelay: worst.presentationDelay,
    pooledEntries:     allEntries.length,
  };
}
