import { describe, it, expect, beforeEach } from "vitest";
import { ChessRuleEngine } from "@/engine/rules";

describe("ChessRuleEngine", () => {
  let engine: ChessRuleEngine;

  beforeEach(() => {
    engine = new ChessRuleEngine();
  });

  describe("initial state", () => {
    it("returns starting FEN", () => {
      expect(engine.getFen()).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      );
    });

    it("white moves first", () => {
      expect(engine.getTurn()).toBe("w");
    });

    it("game status is playing", () => {
      expect(engine.getGameStatus()).toBe("playing");
    });
  });

  describe("getValidMoves", () => {
    it("returns valid moves for e2 pawn at start", () => {
      const moves = engine.getValidMoves("e2");
      const destinations = moves.map((m) => m.to);
      expect(destinations).toContain("e3");
      expect(destinations).toContain("e4");
      expect(destinations).toHaveLength(2);
    });

    it("returns empty array for empty square", () => {
      expect(engine.getValidMoves("e4")).toHaveLength(0);
    });

    it("returns empty array for opponent piece", () => {
      expect(engine.getValidMoves("e7")).toHaveLength(0);
    });
  });

  describe("applyMove", () => {
    it("applies a valid move and switches turn", () => {
      const move = engine.applyMove("e2", "e4");
      expect(move).not.toBeNull();
      expect(move!.san).toBe("e4");
      expect(engine.getTurn()).toBe("b");
    });

    it("returns null for invalid move", () => {
      const move = engine.applyMove("e2", "e5");
      expect(move).toBeNull();
    });
  });

  describe("undo", () => {
    it("undoes the last move", () => {
      engine.applyMove("e2", "e4");
      const undone = engine.undo();
      expect(undone).not.toBeNull();
      expect(engine.getTurn()).toBe("w");
      expect(engine.getFen()).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      );
    });

    it("returns null when no moves to undo", () => {
      expect(engine.undo()).toBeNull();
    });
  });

  describe("game status detection", () => {
    it("detects checkmate (fool's mate)", () => {
      const mated = new ChessRuleEngine(
        "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3"
      );
      expect(mated.getGameStatus()).toBe("checkmate");
    });
  });

  describe("getBoard", () => {
    it("returns 8x8 board array", () => {
      const board = engine.getBoard();
      expect(board).toHaveLength(8);
      expect(board[0]).toHaveLength(8);
    });

    it("has white rook at a1", () => {
      const board = engine.getBoard();
      const a1 = board[7][0];
      expect(a1).toMatchObject({ type: "r", color: "w" });
    });
  });

  describe("load", () => {
    it("loads a FEN position", () => {
      engine.load(
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
      );
      expect(engine.getTurn()).toBe("b");
    });
  });
});
