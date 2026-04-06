import type { PieceType, PieceDefinition } from "./types";

export const PIECE_DEFINITIONS: Record<PieceType, PieceDefinition> = {
  p: {
    id: "p",
    display: "Pawn",
    symbol: { w: "\u2659", b: "\u265F" },
    value: 1,
    movePatterns: [
      { direction: [0, 1], range: 1, type: "move" },
      { direction: [0, 2], range: 1, type: "move", conditions: ["first_move"] },
      { direction: [-1, 1], range: 1, type: "capture" },
      { direction: [1, 1], range: 1, type: "capture" },
      { direction: [-1, 1], range: 1, type: "capture", conditions: ["en_passant"] },
      { direction: [1, 1], range: 1, type: "capture", conditions: ["en_passant"] },
    ],
  },
  n: {
    id: "n",
    display: "Knight",
    symbol: { w: "\u2658", b: "\u265E" },
    value: 3,
    movePatterns: [
      { direction: [1, 2], range: 1, type: "both" },
      { direction: [2, 1], range: 1, type: "both" },
      { direction: [2, -1], range: 1, type: "both" },
      { direction: [1, -2], range: 1, type: "both" },
      { direction: [-1, -2], range: 1, type: "both" },
      { direction: [-2, -1], range: 1, type: "both" },
      { direction: [-2, 1], range: 1, type: "both" },
      { direction: [-1, 2], range: 1, type: "both" },
    ],
  },
  b: {
    id: "b",
    display: "Bishop",
    symbol: { w: "\u2657", b: "\u265D" },
    value: 3,
    movePatterns: [
      { direction: [1, 1], range: 8, type: "both" },
      { direction: [1, -1], range: 8, type: "both" },
      { direction: [-1, -1], range: 8, type: "both" },
      { direction: [-1, 1], range: 8, type: "both" },
    ],
  },
  r: {
    id: "r",
    display: "Rook",
    symbol: { w: "\u2656", b: "\u265C" },
    value: 5,
    movePatterns: [
      { direction: [0, 1], range: 8, type: "both" },
      { direction: [0, -1], range: 8, type: "both" },
      { direction: [1, 0], range: 8, type: "both" },
      { direction: [-1, 0], range: 8, type: "both" },
    ],
  },
  q: {
    id: "q",
    display: "Queen",
    symbol: { w: "\u2655", b: "\u265B" },
    value: 9,
    movePatterns: [
      { direction: [0, 1], range: 8, type: "both" },
      { direction: [0, -1], range: 8, type: "both" },
      { direction: [1, 0], range: 8, type: "both" },
      { direction: [-1, 0], range: 8, type: "both" },
      { direction: [1, 1], range: 8, type: "both" },
      { direction: [1, -1], range: 8, type: "both" },
      { direction: [-1, -1], range: 8, type: "both" },
      { direction: [-1, 1], range: 8, type: "both" },
    ],
  },
  k: {
    id: "k",
    display: "King",
    symbol: { w: "\u2654", b: "\u265A" },
    value: 0,
    movePatterns: [
      { direction: [0, 1], range: 1, type: "both" },
      { direction: [0, -1], range: 1, type: "both" },
      { direction: [1, 0], range: 1, type: "both" },
      { direction: [-1, 0], range: 1, type: "both" },
      { direction: [1, 1], range: 1, type: "both" },
      { direction: [1, -1], range: 1, type: "both" },
      { direction: [-1, -1], range: 1, type: "both" },
      { direction: [-1, 1], range: 1, type: "both" },
    ],
  },
};

export function getPieceDefinition(type: PieceType): PieceDefinition {
  return PIECE_DEFINITIONS[type];
}
