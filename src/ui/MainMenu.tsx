"use client";

import { useRouter } from "next/navigation";
import { useGameStore } from "@/store/game-store";

export function MainMenu() {
  const router = useRouter();
  const aiLevel = useGameStore((s) => s.aiLevel);
  const playerColor = useGameStore((s) => s.playerColor);
  const setAiLevel = useGameStore((s) => s.setAiLevel);
  const setPlayerColor = useGameStore((s) => s.setPlayerColor);
  const resetGame = useGameStore((s) => s.resetGame);

  const handleStart = () => {
    resetGame();
    router.push("/game");
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl p-8 w-96 shadow-2xl">
        <h1 className="text-4xl font-bold text-center text-stone-100 mb-2">
          ProjectChess
        </h1>
        <p className="text-sm text-stone-500 text-center mb-8">
          3D Chess with AI
        </p>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm text-stone-300">AI Difficulty</label>
            <span className="text-sm font-mono text-amber-400">
              {aiLevel}/20
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={20}
            value={aiLevel}
            onChange={(e) => setAiLevel(Number(e.target.value))}
            className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-xs text-stone-500 mt-1">
            <span>Beginner</span>
            <span>Master</span>
          </div>
        </div>

        <div className="mb-8">
          <label className="text-sm text-stone-300 block mb-2">Play as</label>
          <div className="flex gap-3">
            <button
              onClick={() => setPlayerColor("w")}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                playerColor === "w"
                  ? "bg-stone-100 text-stone-900"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              }`}
            >
              White
            </button>
            <button
              onClick={() => setPlayerColor("b")}
              className={`flex-1 py-3 rounded-lg text-sm font-medium transition-colors ${
                playerColor === "b"
                  ? "bg-stone-800 text-stone-100 ring-1 ring-stone-500"
                  : "bg-stone-800 text-stone-400 hover:bg-stone-700"
              }`}
            >
              Black
            </button>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors text-lg"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
