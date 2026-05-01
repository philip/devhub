import { test, expect, type Page } from "@playwright/test";

const SPINNER_DELAY_MS = 400;
const SPINNER_MIN_VISIBLE_MS = 800;

function setupClipboardMock(page: Page) {
  return page.addInitScript(() => {
    Object.defineProperty(window.navigator, "clipboard", {
      value: {
        writeText: async (value: string) => {
          (window as { __copiedText?: string }).__copiedText = value;
        },
      },
      configurable: true,
    });
  });
}

/**
 * Intercept the bootstrap-prompt API and inject `delayMs` before responding so
 * the test can drive both the fast (< 400ms) and slow (>= 400ms) branches of
 * the debounced spinner state machine.
 */
async function stubBootstrapPrompt(page: Page, delayMs: number) {
  await page.route("**/api/bootstrap-prompt", async (route) => {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
    await route.fulfill({
      status: 200,
      contentType: "text/markdown",
      body: "# About DevHub\n\nstub bootstrap prompt",
    });
  });
}

/**
 * Sample which label is currently visible in the BootstrapCopyButton's CSS
 * Grid. The active label is the only child that is not `.invisible`.
 */
async function recordButtonStateSamples(
  page: Page,
  durationMs: number,
  intervalMs = 25,
) {
  return page.evaluate(
    ({ duration, interval }) => {
      return new Promise<Array<{ t: number; label: string | null }>>(
        (resolve) => {
          const btn = document.querySelector<HTMLButtonElement>(
            'button[title*="Copies instructions"]',
          );
          if (!btn) {
            resolve([]);
            return;
          }
          const span = btn.querySelector<HTMLSpanElement>("span.grid");
          const visibleText = (): string | null => {
            if (!span) return null;
            const labels = Array.from(span.children) as HTMLElement[];
            const active = labels.find(
              (l) => !l.classList.contains("invisible"),
            );
            return active ? (active.textContent || "").trim() : null;
          };
          const samples: Array<{ t: number; label: string | null }> = [];
          const start = performance.now();
          const id = window.setInterval(() => {
            samples.push({
              t: Math.round(performance.now() - start),
              label: visibleText(),
            });
          }, interval);
          btn.click();
          window.setTimeout(() => {
            window.clearInterval(id);
            resolve(samples);
          }, duration);
        },
      );
    },
    { duration: durationMs, interval: intervalMs },
  );
}

test.describe("hero bootstrap copy button — debounced spinner", () => {
  test("fast path: spinner is suppressed when copy completes quickly", async ({
    page,
  }) => {
    await setupClipboardMock(page);
    await stubBootstrapPrompt(page, 0);
    await page.goto("/");

    const samples = await recordButtonStateSamples(page, 1000);

    expect(samples.length).toBeGreaterThan(10);
    const labels = new Set(samples.map((s) => s.label));
    expect(labels.has("Copying…")).toBe(false);
    expect(samples.at(-1)?.label).toBe("Copied — now paste into your agent");
  });

  test("slow path: spinner appears after threshold and holds for the minimum visible window", async ({
    page,
  }) => {
    await setupClipboardMock(page);
    // Just barely past the spinner threshold so the min-visible hold is the
    // dominant factor rather than the fetch latency itself.
    await stubBootstrapPrompt(page, 500);
    await page.goto("/");

    const samples = await recordButtonStateSamples(page, 2200);

    const firstSpinner = samples.find((s) => s.label === "Copying…");
    const firstCopied = samples.find(
      (s) => s.label === "Copied — now paste into your agent",
    );

    expect(
      firstSpinner,
      "spinner should appear once fetch crosses threshold",
    ).toBeDefined();
    expect(
      firstCopied,
      "copy state should eventually transition to copied",
    ).toBeDefined();

    // 50ms tolerance for sampling jitter.
    expect(firstSpinner!.t).toBeGreaterThanOrEqual(SPINNER_DELAY_MS - 50);
    expect(firstCopied!.t - firstSpinner!.t).toBeGreaterThanOrEqual(
      SPINNER_MIN_VISIBLE_MS - 50,
    );
  });
});
