import { afterEach, describe, expect, test, vi } from "vitest";

describe("server feature flags", () => {
  afterEach(() => {
    delete process.env.SHOW_DRAFTS;
    vi.resetModules();
  });

  test("showDrafts returns false when env var is unset", async () => {
    const { showDrafts } = await import("../src/lib/feature-flags-server");
    expect(showDrafts()).toBe(false);
  });

  test('showDrafts returns true only when env var is exactly "true"', async () => {
    process.env.SHOW_DRAFTS = "true";
    const { showDrafts } = await import("../src/lib/feature-flags-server");
    expect(showDrafts()).toBe(true);
  });

  test("showDrafts returns false for any other value", async () => {
    const { showDrafts } = await import("../src/lib/feature-flags-server");
    for (const value of ["1", "yes", "True", "TRUE", ""]) {
      process.env.SHOW_DRAFTS = value;
      expect(showDrafts()).toBe(false);
    }
  });
});
