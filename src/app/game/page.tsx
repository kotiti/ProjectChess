"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useCallback } from "react";
import { GameHUD } from "@/ui/GameHUD";
import { MoveHistory } from "@/ui/MoveHistory";
import { PromotionDialog } from "@/ui/PromotionDialog";
import { useGameStore } from "@/store/game-store";
import { AIController } from "@/ai/ai-controller";

const Scene = dynamic(
  () => import("@/renderer/Scene").then((m) => ({ default: m.Scene })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-stone-950">
        <p className="text-stone-400">Loading 3D engine...</p>
      </div>
    ),
  }
);

export default function GamePage() {
  const aiRef = useRef<AIController | null>(null);
  const turn = useGameStore((s) => s.turn);
  const status = useGameStore((s) => s.status);
  const playerColor = useGameStore((s) => s.playerColor);
  const isAiThinking = useGameStore((s) => s.isAiThinking);

  useEffect(() => {
    const controller = new AIController();
    controller
      .init()
      .then(() => {
        aiRef.current = controller;
      })
      .catch((err) => {
        console.error("Failed to initialize Stockfish:", err);
      });

    return () => {
      controller.destroy();
      aiRef.current = null;
    };
  }, []);

  const makeAiMove = useCallback(async () => {
    const ai = aiRef.current;
    if (!ai || !ai.isReady()) return;

    const store = useGameStore.getState();
    store.setAiThinking(true);

    try {
      const bestMoveUci = await ai.getBestMove(store.fen, store.aiLevel);
      const from = bestMoveUci.slice(0, 2);
      const to = bestMoveUci.slice(2, 4);
      const promotion =
        bestMoveUci.length > 4 ? bestMoveUci[4] : undefined;

      useGameStore.getState().makeMove(from, to, promotion);
    } catch (err) {
      console.error("AI move failed:", err);
    } finally {
      useGameStore.getState().setAiThinking(false);
    }
  }, []);

  useEffect(() => {
    const isGameOver =
      status === "checkmate" ||
      status === "stalemate" ||
      status.startsWith("draw");
    if (turn !== playerColor && !isAiThinking && !isGameOver) {
      makeAiMove();
    }
  }, [turn, playerColor, isAiThinking, status, makeAiMove]);

  return (
    <div className="flex h-screen bg-stone-950 text-white">
      <div className="flex-1 relative">
        <Scene />
      </div>
      <div className="flex flex-col gap-3 p-4 overflow-y-auto">
        <GameHUD />
        <MoveHistory />
      </div>
      <PromotionDialog />
    </div>
  );
}
