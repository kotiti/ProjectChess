import { create } from "zustand";
import { ChessRuleEngine } from "@/engine/rules";
import type { Square, Move, PieceColor, GameStatus } from "@/engine/types";

interface GameState {
  engine: ChessRuleEngine;
  fen: string;
  turn: PieceColor;
  status: GameStatus;
  moveHistory: Move[];
  capturedPieces: { w: string[]; b: string[] };
  lastMove: { from: Square; to: Square } | null;
  selectedSquare: Square | null;
  validMoves: Move[];
  isAiThinking: boolean;
  needsPromotion: { from: Square; to: Square } | null;
  playerColor: PieceColor;
  aiLevel: number;

  selectSquare: (square: Square) => void;
  makeMove: (from: Square, to: Square, promotion?: string) => Move | null;
  undoMove: () => void;
  resetGame: () => void;
  setAiLevel: (level: number) => void;
  setPlayerColor: (color: PieceColor) => void;
  setAiThinking: (thinking: boolean) => void;
  setNeedsPromotion: (pending: { from: Square; to: Square } | null) => void;
}

function syncFromEngine(engine: ChessRuleEngine) {
  return {
    fen: engine.getFen(),
    turn: engine.getTurn(),
    status: engine.getGameStatus(),
  };
}

export const useGameStore = create<GameState>((set, get) => {
  const engine = new ChessRuleEngine();

  return {
    engine,
    ...syncFromEngine(engine),
    moveHistory: [],
    capturedPieces: { w: [], b: [] },
    lastMove: null,
    selectedSquare: null,
    validMoves: [],
    isAiThinking: false,
    needsPromotion: null,
    playerColor: "w",
    aiLevel: 10,

    selectSquare(square: Square) {
      const state = get();
      const { engine, selectedSquare, validMoves } = state;

      if (selectedSquare === square) {
        set({ selectedSquare: null, validMoves: [] });
        return;
      }

      if (selectedSquare && validMoves.some((m) => m.to === square)) {
        const move = validMoves.find((m) => m.to === square);
        if (
          move &&
          move.piece === "p" &&
          (square[1] === "8" || square[1] === "1")
        ) {
          set({ needsPromotion: { from: selectedSquare, to: square } });
          return;
        }
        state.makeMove(selectedSquare, square);
        return;
      }

      const piece = engine.getPiece(square);
      if (!piece || piece.color !== engine.getTurn()) {
        set({ selectedSquare: null, validMoves: [] });
        return;
      }

      const moves = engine.getValidMoves(square);
      set({ selectedSquare: square, validMoves: moves });
    },

    makeMove(from: Square, to: Square, promotion?: string) {
      const { engine, moveHistory, capturedPieces } = get();
      const move = engine.applyMove(from, to, promotion);

      if (!move) return null;

      const newCaptured = { w: [...capturedPieces.w], b: [...capturedPieces.b] };
      if (move.captured) {
        newCaptured[move.color].push(move.captured);
      }

      set({
        ...syncFromEngine(engine),
        moveHistory: [...moveHistory, move],
        capturedPieces: newCaptured,
        lastMove: { from, to },
        selectedSquare: null,
        validMoves: [],
        needsPromotion: null,
      });

      return move;
    },

    undoMove() {
      const { engine, moveHistory, capturedPieces } = get();
      const undone = engine.undo();
      if (!undone) return;

      const newHistory = moveHistory.slice(0, -1);
      const newCaptured = { w: [...capturedPieces.w], b: [...capturedPieces.b] };
      if (undone.captured) {
        const list = newCaptured[undone.color];
        const idx = list.lastIndexOf(undone.captured);
        if (idx >= 0) list.splice(idx, 1);
      }

      const prevMove =
        newHistory.length > 0 ? newHistory[newHistory.length - 1] : null;

      set({
        ...syncFromEngine(engine),
        moveHistory: newHistory,
        capturedPieces: newCaptured,
        lastMove: prevMove ? { from: prevMove.from, to: prevMove.to } : null,
        selectedSquare: null,
        validMoves: [],
      });
    },

    resetGame() {
      const engine = new ChessRuleEngine();
      set({
        engine,
        ...syncFromEngine(engine),
        moveHistory: [],
        capturedPieces: { w: [], b: [] },
        lastMove: null,
        selectedSquare: null,
        validMoves: [],
        isAiThinking: false,
        needsPromotion: null,
      });
    },

    setAiLevel(level: number) {
      set({ aiLevel: Math.max(1, Math.min(20, level)) });
    },

    setPlayerColor(color: PieceColor) {
      set({ playerColor: color });
    },

    setAiThinking(thinking: boolean) {
      set({ isAiThinking: thinking });
    },

    setNeedsPromotion(pending) {
      set({ needsPromotion: pending });
    },
  };
});
