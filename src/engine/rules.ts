import { Chess, type Square as ChessSquare } from "chess.js";
import type { Square, Move, PieceColor, GameStatus, Piece } from "./types";

export class ChessRuleEngine {
  private chess: Chess;

  constructor(fen?: string) {
    this.chess = fen ? new Chess(fen) : new Chess();
  }

  getFen(): string {
    return this.chess.fen();
  }

  getTurn(): PieceColor {
    return this.chess.turn() as PieceColor;
  }

  getValidMoves(square: Square): Move[] {
    const moves = this.chess.moves({ square: square as ChessSquare, verbose: true });
    return moves.map((m) => ({
      from: m.from,
      to: m.to,
      piece: m.piece as Move["piece"],
      color: m.color as Move["color"],
      captured: m.captured as Move["captured"],
      promotion: m.promotion as Move["promotion"],
      san: m.san,
      flags: m.flags,
    }));
  }

  applyMove(from: Square, to: Square, promotion?: string): Move | null {
    try {
      const result = this.chess.move({ from: from as ChessSquare, to: to as ChessSquare, promotion });
      return {
        from: result.from,
        to: result.to,
        piece: result.piece as Move["piece"],
        color: result.color as Move["color"],
        captured: result.captured as Move["captured"],
        promotion: result.promotion as Move["promotion"],
        san: result.san,
        flags: result.flags,
      };
    } catch {
      return null;
    }
  }

  undo(): Move | null {
    const result = this.chess.undo();
    if (!result) return null;
    return {
      from: result.from,
      to: result.to,
      piece: result.piece as Move["piece"],
      color: result.color as Move["color"],
      captured: result.captured as Move["captured"],
      promotion: result.promotion as Move["promotion"],
      san: result.san,
      flags: result.flags,
    };
  }

  getGameStatus(): GameStatus {
    if (this.chess.isCheckmate()) return "checkmate";
    if (this.chess.isStalemate()) return "stalemate";
    if (this.chess.isThreefoldRepetition()) return "draw_repetition";
    if (this.chess.isDraw()) return "draw_fifty_move";
    if (this.chess.isCheck()) return "check";
    return "playing";
  }

  getBoard(): (Piece | null)[][] {
    return this.chess.board() as (Piece | null)[][];
  }

  getPiece(square: Square): Piece | null {
    const piece = this.chess.get(square as ChessSquare);
    return piece ? ({ type: piece.type, color: piece.color } as Piece) : null;
  }

  load(fen: string): void {
    this.chess.load(fen);
  }

  reset(): void {
    this.chess.reset();
  }
}
