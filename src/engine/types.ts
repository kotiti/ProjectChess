/** Chess square in algebraic notation: 'a1' through 'h8' */
export type Square = string;

/** Board coordinates: file (0-7 = a-h), rank (0-7 = 1-8) */
export interface Position {
  file: number;
  rank: number;
}

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type PieceColor = "w" | "b";

export interface Piece {
  type: PieceType;
  color: PieceColor;
}

export interface MovePattern {
  direction: [number, number];
  range: number;
  type: "move" | "capture" | "both";
  conditions?: ("first_move" | "en_passant")[];
}

export interface PieceDefinition {
  id: PieceType;
  display: string;
  symbol: { w: string; b: string };
  value: number;
  movePatterns: MovePattern[];
}

export interface Move {
  from: Square;
  to: Square;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  san: string;
  flags: string;
}

export type GameStatus =
  | "playing"
  | "check"
  | "checkmate"
  | "stalemate"
  | "draw_repetition"
  | "draw_insufficient"
  | "draw_fifty_move";

export interface GamePlugin {
  id: string;
  name: string;
  onBeforeMove?(fen: string, move: Move): Move | null;
  onAfterMove?(fen: string, move: Move): string;
  modifyValidMoves?(moves: Move[], fen: string): Move[];
}

export function squareToPosition(square: Square): Position {
  return {
    file: square.charCodeAt(0) - 97,
    rank: parseInt(square[1]) - 1,
  };
}

export function positionToSquare(pos: Position): Square {
  return String.fromCharCode(97 + pos.file) + (pos.rank + 1);
}
