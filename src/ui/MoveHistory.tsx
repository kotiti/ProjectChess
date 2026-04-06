"use client";

import { useRef, useEffect } from "react";
import { useGameStore } from "@/store/game-store";

export function MoveHistory() {
  const moveHistory = useGameStore((s) => s.moveHistory);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moveHistory.length]);

  const movePairs: { number: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    movePairs.push({
      number: Math.floor(i / 2) + 1,
      white: moveHistory[i].san,
      black: moveHistory[i + 1]?.san,
    });
  }

  return (
    <div className="bg-stone-900 rounded-xl border border-stone-700 overflow-hidden">
      <div className="px-4 py-2 border-b border-stone-700">
        <span className="text-sm font-medium text-stone-300">Moves</span>
      </div>
      <div ref={scrollRef} className="max-h-60 overflow-y-auto p-2">
        {movePairs.length === 0 ? (
          <p className="text-xs text-stone-500 text-center py-4">
            No moves yet
          </p>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {movePairs.map((pair) => (
                <tr key={pair.number} className="hover:bg-stone-800/50">
                  <td className="text-stone-500 w-8 text-right pr-2 py-0.5">
                    {pair.number}.
                  </td>
                  <td className="text-stone-200 w-20 py-0.5">{pair.white}</td>
                  <td className="text-stone-200 w-20 py-0.5">
                    {pair.black ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
