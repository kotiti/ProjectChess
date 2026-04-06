import { describe, it, expect } from "vitest";
import { PIECE_DEFINITIONS, getPieceDefinition } from "@/engine/pieces";
import type { PieceType } from "@/engine/types";

describe("Piece Definitions", () => {
  const allTypes: PieceType[] = ["p", "n", "b", "r", "q", "k"];

  it("defines all 6 standard chess pieces", () => {
    expect(Object.keys(PIECE_DEFINITIONS)).toHaveLength(6);
    for (const type of allTypes) {
      expect(PIECE_DEFINITIONS[type]).toBeDefined();
    }
  });

  it("each piece has correct value", () => {
    expect(PIECE_DEFINITIONS.p.value).toBe(1);
    expect(PIECE_DEFINITIONS.n.value).toBe(3);
    expect(PIECE_DEFINITIONS.b.value).toBe(3);
    expect(PIECE_DEFINITIONS.r.value).toBe(5);
    expect(PIECE_DEFINITIONS.q.value).toBe(9);
    expect(PIECE_DEFINITIONS.k.value).toBe(0);
  });

  it("each piece has Unicode symbols for both colors", () => {
    for (const type of allTypes) {
      const def = PIECE_DEFINITIONS[type];
      expect(def.symbol.w).toBeTruthy();
      expect(def.symbol.b).toBeTruthy();
      expect(def.symbol.w).not.toBe(def.symbol.b);
    }
  });

  it("each piece has at least one move pattern", () => {
    for (const type of allTypes) {
      expect(PIECE_DEFINITIONS[type].movePatterns.length).toBeGreaterThan(0);
    }
  });

  it("getPieceDefinition returns correct definition", () => {
    expect(getPieceDefinition("q").display).toBe("Queen");
  });

  it("knight has exactly 8 L-shaped move patterns", () => {
    const knight = PIECE_DEFINITIONS.n;
    const moves = knight.movePatterns.filter((m) => m.type === "both");
    expect(moves).toHaveLength(8);
  });

  it("rook moves in 4 straight directions with unlimited range", () => {
    const rook = PIECE_DEFINITIONS.r;
    const straightMoves = rook.movePatterns.filter((m) => m.range === 8);
    expect(straightMoves).toHaveLength(4);
  });
});
