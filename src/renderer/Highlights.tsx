"use client";

import { useMemo } from "react";
import { useGameStore } from "@/store/game-store";
import { squareToPosition } from "@/engine/types";

const SELECTED_COLOR = "#FFFF00";
const VALID_MOVE_COLOR = "#00FF00";
const LAST_MOVE_COLOR = "#AAD4FF";
const CHECK_COLOR = "#FF0000";

function HighlightTile({
  square,
  color,
  opacity = 0.4,
}: {
  square: string;
  color: string;
  opacity?: number;
}) {
  const pos = squareToPosition(square);
  return (
    <mesh
      position={[pos.file, 0.02, pos.rank]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

function ValidMoveMarker({
  square,
  isCapture,
}: {
  square: string;
  isCapture: boolean;
}) {
  const pos = squareToPosition(square);
  return (
    <mesh
      position={[pos.file, 0.03, pos.rank]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      {isCapture ? (
        <ringGeometry args={[0.35, 0.45, 32]} />
      ) : (
        <circleGeometry args={[0.15, 32]} />
      )}
      <meshBasicMaterial
        color={VALID_MOVE_COLOR}
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </mesh>
  );
}

export function Highlights() {
  const selectedSquare = useGameStore((s) => s.selectedSquare);
  const validMoves = useGameStore((s) => s.validMoves);
  const lastMove = useGameStore((s) => s.lastMove);
  const status = useGameStore((s) => s.status);
  const engine = useGameStore((s) => s.engine);

  const kingInCheck = useMemo(() => {
    if (status !== "check" && status !== "checkmate") return null;
    const turn = engine.getTurn();
    const board = engine.getBoard();
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece && piece.type === "k" && piece.color === turn) {
          return String.fromCharCode(97 + file) + (8 - rank);
        }
      }
    }
    return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <group>
      {lastMove && (
        <>
          <HighlightTile
            square={lastMove.from}
            color={LAST_MOVE_COLOR}
            opacity={0.3}
          />
          <HighlightTile
            square={lastMove.to}
            color={LAST_MOVE_COLOR}
            opacity={0.3}
          />
        </>
      )}

      {selectedSquare && (
        <HighlightTile
          square={selectedSquare}
          color={SELECTED_COLOR}
          opacity={0.5}
        />
      )}

      {validMoves.map((move) => (
        <ValidMoveMarker
          key={move.to}
          square={move.to}
          isCapture={!!move.captured}
        />
      ))}

      {kingInCheck && (
        <HighlightTile square={kingInCheck} color={CHECK_COLOR} opacity={0.6} />
      )}
    </group>
  );
}
