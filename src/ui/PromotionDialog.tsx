"use client";

import { useGameStore } from "@/store/game-store";
import { PIECE_DEFINITIONS } from "@/engine/pieces";
import type { PieceType } from "@/engine/types";

const PROMOTION_PIECES: PieceType[] = ["q", "r", "b", "n"];

export function PromotionDialog() {
  const needsPromotion = useGameStore((s) => s.needsPromotion);
  const playerColor = useGameStore((s) => s.playerColor);
  const makeMove = useGameStore((s) => s.makeMove);
  const setNeedsPromotion = useGameStore((s) => s.setNeedsPromotion);

  if (!needsPromotion) return null;

  const handleSelect = (piece: PieceType) => {
    makeMove(needsPromotion.from, needsPromotion.to, piece);
  };

  const handleCancel = () => {
    setNeedsPromotion(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={handleCancel}
    >
      <div
        className="bg-stone-800 rounded-xl p-4 border border-stone-600 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-stone-300 mb-3 text-center">
          Promote pawn to:
        </p>
        <div className="flex gap-2">
          {PROMOTION_PIECES.map((piece) => (
            <button
              key={piece}
              onClick={() => handleSelect(piece)}
              className="w-14 h-14 flex items-center justify-center text-3xl bg-stone-700 hover:bg-stone-600 rounded-lg transition-colors"
            >
              {PIECE_DEFINITIONS[piece].symbol[playerColor]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
