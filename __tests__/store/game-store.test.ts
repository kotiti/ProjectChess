import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "@/store/game-store";

describe("Game Store", () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  describe("initial state", () => {
    it("starts with white to move", () => {
      expect(useGameStore.getState().turn).toBe("w");
    });

    it("starts with playing status", () => {
      expect(useGameStore.getState().status).toBe("playing");
    });

    it("has no selected square", () => {
      expect(useGameStore.getState().selectedSquare).toBeNull();
    });

    it("has empty move history", () => {
      expect(useGameStore.getState().moveHistory).toHaveLength(0);
    });

    it("default AI level is 10", () => {
      expect(useGameStore.getState().aiLevel).toBe(10);
    });

    it("default player color is white", () => {
      expect(useGameStore.getState().playerColor).toBe("w");
    });
  });

  describe("selectSquare", () => {
    it("selects a square with own piece", () => {
      useGameStore.getState().selectSquare("e2");
      const state = useGameStore.getState();
      expect(state.selectedSquare).toBe("e2");
      expect(state.validMoves.length).toBeGreaterThan(0);
    });

    it("deselects when clicking same square", () => {
      useGameStore.getState().selectSquare("e2");
      useGameStore.getState().selectSquare("e2");
      expect(useGameStore.getState().selectedSquare).toBeNull();
      expect(useGameStore.getState().validMoves).toHaveLength(0);
    });

    it("does not select empty square", () => {
      useGameStore.getState().selectSquare("e4");
      expect(useGameStore.getState().selectedSquare).toBeNull();
    });

    it("does not select opponent piece", () => {
      useGameStore.getState().selectSquare("e7");
      expect(useGameStore.getState().selectedSquare).toBeNull();
    });
  });

  describe("makeMove", () => {
    it("makes a valid move", () => {
      const move = useGameStore.getState().makeMove("e2", "e4");
      expect(move).not.toBeNull();
      expect(useGameStore.getState().turn).toBe("b");
      expect(useGameStore.getState().moveHistory).toHaveLength(1);
    });

    it("clears selection after move", () => {
      useGameStore.getState().selectSquare("e2");
      useGameStore.getState().makeMove("e2", "e4");
      expect(useGameStore.getState().selectedSquare).toBeNull();
      expect(useGameStore.getState().validMoves).toHaveLength(0);
    });

    it("records last move", () => {
      useGameStore.getState().makeMove("e2", "e4");
      const state = useGameStore.getState();
      expect(state.lastMove).toEqual({ from: "e2", to: "e4" });
    });

    it("returns null for invalid move", () => {
      const move = useGameStore.getState().makeMove("e2", "e5");
      expect(move).toBeNull();
    });
  });

  describe("undoMove", () => {
    it("undoes the last move", () => {
      useGameStore.getState().makeMove("e2", "e4");
      useGameStore.getState().undoMove();
      expect(useGameStore.getState().turn).toBe("w");
      expect(useGameStore.getState().moveHistory).toHaveLength(0);
    });
  });

  describe("settings", () => {
    it("sets AI level", () => {
      useGameStore.getState().setAiLevel(15);
      expect(useGameStore.getState().aiLevel).toBe(15);
    });

    it("clamps AI level to 1-20", () => {
      useGameStore.getState().setAiLevel(25);
      expect(useGameStore.getState().aiLevel).toBe(20);
      useGameStore.getState().setAiLevel(0);
      expect(useGameStore.getState().aiLevel).toBe(1);
    });

    it("sets player color", () => {
      useGameStore.getState().setPlayerColor("b");
      expect(useGameStore.getState().playerColor).toBe("b");
    });
  });

  describe("resetGame", () => {
    it("resets to initial state", () => {
      useGameStore.getState().makeMove("e2", "e4");
      useGameStore.getState().resetGame();
      expect(useGameStore.getState().turn).toBe("w");
      expect(useGameStore.getState().moveHistory).toHaveLength(0);
      expect(useGameStore.getState().status).toBe("playing");
    });
  });
});
