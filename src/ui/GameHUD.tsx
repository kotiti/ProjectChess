"use client";

import { useGameStore } from "@/store/game-store";
import { PIECE_DEFINITIONS } from "@/engine/pieces";
import type { PieceColor } from "@/engine/types";

function CapturedPieces({
  color,
  pieces,
}: {
  color: PieceColor;
  pieces: string[];
}) {
  const sorted = [...pieces].sort((a, b) => {
    const va =
      PIECE_DEFINITIONS[a as keyof typeof PIECE_DEFINITIONS]?.value ?? 0;
    const vb =
      PIECE_DEFINITIONS[b as keyof typeof PIECE_DEFINITIONS]?.value ?? 0;
    return vb - va;
  });

  return (
    <div className="flex flex-wrap gap-0.5 min-h-[24px]">
      {sorted.map((piece, i) => (
        <span key={i} className="text-lg">
          {
            PIECE_DEFINITIONS[piece as keyof typeof PIECE_DEFINITIONS]?.symbol[
              color === "w" ? "b" : "w"
            ]
          }
        </span>
      ))}
    </div>
  );
}

function PlayerInfo({
  label,
  color,
  isActive,
}: {
  label: string;
  color: PieceColor;
  isActive: boolean;
}) {
  const capturedPieces = useGameStore((s) => s.capturedPieces);

  return (
    <div
      className={`p-3 rounded-lg ${isActive ? "bg-amber-900/30 ring-1 ring-amber-500" : "bg-stone-800/50"}`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-stone-300">{label}</span>
        {isActive && (
          <span className="text-xs text-amber-400 animate-pulse">
            Thinking...
          </span>
        )}
      </div>
      <CapturedPieces color={color} pieces={capturedPieces[color]} />
    </div>
  );
}

export function GameHUD() {
  const status = useGameStore((s) => s.status);
  const turn = useGameStore((s) => s.turn);
  const playerColor = useGameStore((s) => s.playerColor);
  const aiLevel = useGameStore((s) => s.aiLevel);
  const isAiThinking = useGameStore((s) => s.isAiThinking);
  const undoMove = useGameStore((s) => s.undoMove);
  const resetGame = useGameStore((s) => s.resetGame);

  const isPlayerTurn = turn === playerColor;
  const opponentColor: PieceColor = playerColor === "w" ? "b" : "w";

  const statusText: Record<GameStatus, string> = {
    playing: isPlayerTurn ? "Your turn" : "AI is thinking...",
    check: isPlayerTurn ? "You are in check!" : "AI is in check!",
    checkmate: isPlayerTurn ? "Checkmate - You lose" : "Checkmate - You win!",
    stalemate: "Stalemate - Draw",
    draw_repetition: "Draw - Threefold repetition",
    draw_insufficient: "Draw - Insufficient material",
    draw_fifty_move: "Draw - 50-move rule",
  };

  const isGameOver =
    status === "checkmate" ||
    status === "stalemate" ||
    status === "draw_repetition" ||
    status === "draw_insufficient" ||
    status === "draw_fifty_move";

  return (
    <div className="flex flex-col gap-3 p-4 w-72 bg-stone-900 rounded-xl border border-stone-700">
      <PlayerInfo
        label={`AI (Level ${aiLevel})`}
        color={opponentColor}
        isActive={isAiThinking}
      />

      <div
        className={`text-center py-2 px-3 rounded-lg text-sm font-medium ${
          isGameOver
            ? status === "checkmate" && !isPlayerTurn
              ? "bg-green-900/40 text-green-400"
              : "bg-red-900/40 text-red-400"
            : status === "check"
              ? "bg-red-900/30 text-red-300"
              : "bg-stone-800 text-stone-300"
        }`}
      >
        {statusText[status]}
      </div>

      <PlayerInfo
        label="You"
        color={playerColor}
        isActive={isPlayerTurn && !isGameOver}
      />

      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={undoMove}
          disabled={isAiThinking || isGameOver}
          className="px-4 py-2 text-sm bg-stone-700 hover:bg-stone-600 disabled:opacity-40 disabled:cursor-not-allowed text-stone-200 rounded-lg transition-colors"
        >
          Undo Move
        </button>
        <button
          onClick={resetGame}
          className="px-4 py-2 text-sm bg-stone-700 hover:bg-stone-600 text-stone-200 rounded-lg transition-colors"
        >
          {isGameOver ? "New Game" : "Resign & New Game"}
        </button>
      </div>
    </div>
  );
}

type GameStatus = import("@/engine/types").GameStatus;
