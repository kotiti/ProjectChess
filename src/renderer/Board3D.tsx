"use client";

import { useMemo } from "react";
import { useGameStore } from "@/store/game-store";
import type { ThreeEvent } from "@react-three/fiber";

const LIGHT_COLOR = "#F0D9B5";
const DARK_COLOR = "#B58863";

function Tile({ x, z, isLight }: { x: number; z: number; isLight: boolean }) {
  const selectSquare = useGameStore((s) => s.selectSquare);
  const square = String.fromCharCode(97 + x) + (z + 1);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectSquare(square);
  };

  return (
    <mesh
      position={[x, 0, z]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={handleClick}
    >
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={isLight ? LIGHT_COLOR : DARK_COLOR}
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
}

function BoardFrame() {
  return (
    <mesh position={[3.5, -0.1, 3.5]}>
      <boxGeometry args={[9, 0.2, 9]} />
      <meshStandardMaterial color="#5C3A1E" roughness={0.6} metalness={0.2} />
    </mesh>
  );
}

export function Board3D() {
  const tiles = useMemo(() => {
    const result: React.JSX.Element[] = [];
    for (let x = 0; x < 8; x++) {
      for (let z = 0; z < 8; z++) {
        const isLight = (x + z) % 2 === 0;
        result.push(<Tile key={`${x}-${z}`} x={x} z={z} isLight={isLight} />);
      }
    }
    return result;
  }, []);

  return (
    <group>
      <BoardFrame />
      {tiles}
    </group>
  );
}
