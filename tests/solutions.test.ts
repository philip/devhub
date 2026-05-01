import { describe, expect, test } from "vitest";
import {
  isLinkedSolution,
  isNativeSolution,
  linkedSolutions,
  nativeSolutions,
  solutions,
  type LinkedSolution,
} from "../src/lib/solutions/solutions";

describe("solutions registry", () => {
  test("every solution is exactly native or linked", () => {
    for (const solution of solutions) {
      const native = isNativeSolution(solution);
      const linked = isLinkedSolution(solution);
      expect(native || linked).toBe(true);
      expect(native && linked).toBe(false);
    }
  });

  test("partitions match the discriminator", () => {
    expect(nativeSolutions.length + linkedSolutions.length).toBe(
      solutions.length,
    );
    for (const s of nativeSolutions) expect(s.type).toBe("native");
    for (const s of linkedSolutions) expect(s.type).toBe("linked");
  });

  test("ids are unique across native and linked solutions", () => {
    const ids = solutions.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("linked solutions point to absolute https urls and have rich metadata", () => {
    expect(linkedSolutions.length).toBeGreaterThan(0);
    for (const solution of linkedSolutions) {
      expect(solution.url).toMatch(/^https:\/\//);
      expect(solution.title.length).toBeGreaterThan(0);
      expect(solution.description.length).toBeGreaterThan(0);
      expect(solution.tags.length).toBeGreaterThan(0);
      expect(solution.source.length).toBeGreaterThan(0);
      expect(solution.previewImage).toMatch(
        /^\/img\/solutions\/.+\.(png|jpe?g|webp)$/,
      );
      expect(solution.previewImageAlt.length).toBeGreaterThan(0);
      expect(solution.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("native solutions never carry linked-only metadata", () => {
    for (const solution of nativeSolutions) {
      const linkedOnlyKeys: Array<keyof LinkedSolution> = [
        "url",
        "source",
        "previewImage",
        "previewImageAlt",
      ];
      for (const key of linkedOnlyKeys) {
        expect(key in solution).toBe(false);
      }
    }
  });

  test("native solutions carry author and date metadata", () => {
    for (const solution of nativeSolutions) {
      expect(solution.authors.length).toBeGreaterThan(0);
      expect(solution.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test("solutions are ordered newest-first when sorted by publishedAt", () => {
    const dates = solutions.map((s) => s.publishedAt);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(sorted).toEqual(sorted);
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i - 1] >= sorted[i]).toBe(true);
    }
  });

  test("type guards narrow correctly at compile and runtime", () => {
    const sample = solutions[0];
    if (isLinkedSolution(sample)) {
      expect(typeof sample.url).toBe("string");
    } else if (isNativeSolution(sample)) {
      expect(sample.type).toBe("native");
    } else {
      throw new Error("Solution did not satisfy either guard");
    }
  });
});
