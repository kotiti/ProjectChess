import { describe, it, expect } from "vitest";
import { mapDifficulty } from "@/ai/ai-controller";

describe("AI Difficulty Mapping", () => {
  it("level 1 maps to lowest skill and depth", () => {
    const config = mapDifficulty(1);
    expect(config.skillLevel).toBe(0);
    expect(config.depth).toBe(1);
  });

  it("level 10 maps to mid-range", () => {
    const config = mapDifficulty(10);
    expect(config.skillLevel).toBeGreaterThanOrEqual(8);
    expect(config.skillLevel).toBeLessThanOrEqual(11);
    expect(config.depth).toBeGreaterThanOrEqual(8);
    expect(config.depth).toBeLessThanOrEqual(11);
  });

  it("level 20 maps to maximum skill and depth", () => {
    const config = mapDifficulty(20);
    expect(config.skillLevel).toBe(20);
    expect(config.depth).toBe(20);
  });

  it("clamps out-of-range values", () => {
    expect(mapDifficulty(0).skillLevel).toBe(0);
    expect(mapDifficulty(0).depth).toBe(1);
    expect(mapDifficulty(25).skillLevel).toBe(20);
    expect(mapDifficulty(25).depth).toBe(20);
  });

  it("returns integer values for all levels", () => {
    for (let i = 1; i <= 20; i++) {
      const config = mapDifficulty(i);
      expect(Number.isInteger(config.skillLevel)).toBe(true);
      expect(Number.isInteger(config.depth)).toBe(true);
    }
  });

  it("skill level and depth increase monotonically", () => {
    for (let i = 2; i <= 20; i++) {
      const prev = mapDifficulty(i - 1);
      const curr = mapDifficulty(i);
      expect(curr.skillLevel).toBeGreaterThanOrEqual(prev.skillLevel);
      expect(curr.depth).toBeGreaterThanOrEqual(prev.depth);
    }
  });
});
