"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useGameStore } from "@/store/game-store";
import { squareToPosition } from "@/engine/types";
import type { PieceType, PieceColor } from "@/engine/types";

const WHITE_COLOR = "#E8E0D0";
const BLACK_COLOR = "#2A1A0A";
const WHITE_METAL = { metalness: 0.3, roughness: 0.4 };
const BLACK_METAL = { metalness: 0.4, roughness: 0.3 };

function PieceMaterial({ color }: { color: PieceColor }) {
  const c = color === "w" ? WHITE_COLOR : BLACK_COLOR;
  const metal = color === "w" ? WHITE_METAL : BLACK_METAL;
  return <meshStandardMaterial color={c} {...metal} />;
}

function PawnMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.2, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.1, 0.2, 0.4, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

function RookMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.4, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.28, 0.25, 0.2, 4]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

function KnightMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.5, 0.05]}>
        <cylinderGeometry args={[0.15, 0.2, 0.4, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.8, 0.1]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.2, 0.35, 0.3]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

function BishopMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 0.5, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <coneGeometry args={[0.12, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

function QueenMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.32, 0.38, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 0.5, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <coneGeometry args={[0.08, 0.2, 8]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

function KingMesh({ color }: { color: PieceColor }) {
  return (
    <group>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.32, 0.38, 0.3, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 0.5, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.06, 0.3, 0.06]} />
        <PieceMaterial color={color} />
      </mesh>
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.2, 0.06, 0.06]} />
        <PieceMaterial color={color} />
      </mesh>
    </group>
  );
}

const PIECE_MESHES: Record<PieceType, React.FC<{ color: PieceColor }>> = {
  p: PawnMesh,
  r: RookMesh,
  n: KnightMesh,
  b: BishopMesh,
  q: QueenMesh,
  k: KingMesh,
};

function ChessPiece({
  type,
  color,
  square,
  isSelected,
}: {
  type: PieceType;
  color: PieceColor;
  square: string;
  isSelected: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const pos = squareToPosition(square);
  const selectSquare = useGameStore((s) => s.selectSquare);
  const MeshComponent = PIECE_MESHES[type];

  useFrame((state) => {
    if (!groupRef.current) return;
    if (isSelected) {
      groupRef.current.position.y =
        0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    } else {
      groupRef.current.position.y = 0;
    }
  });

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    selectSquare(square);
  };

  return (
    <group
      ref={groupRef}
      position={[pos.file, 0, pos.rank]}
      onClick={handleClick}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "auto";
      }}
    >
      <MeshComponent color={color} />
    </group>
  );
}

export function Pieces3D() {
  const engine = useGameStore((s) => s.engine);
  const fen = useGameStore((s) => s.fen);
  const selectedSquare = useGameStore((s) => s.selectedSquare);

  const pieces = useMemo(() => {
    const result: { type: PieceType; color: PieceColor; square: string }[] = [];
    const board = engine.getBoard();
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board[rank][file];
        if (piece) {
          const square = String.fromCharCode(97 + file) + (8 - rank);
          result.push({
            type: piece.type as PieceType,
            color: piece.color as PieceColor,
            square,
          });
        }
      }
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen]);

  return (
    <group>
      {pieces.map(({ type, color, square }) => (
        <ChessPiece
          key={square}
          type={type}
          color={color}
          square={square}
          isSelected={selectedSquare === square}
        />
      ))}
    </group>
  );
}
