"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Board3D } from "./Board3D";
import { Highlights } from "./Highlights";
import { Pieces3D } from "./Piece3D";

export function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 8, 8], fov: 45, near: 0.5, far: 100 }}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: "default",
        logarithmicDepthBuffer: true,
      }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.0} />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2.2}
        target={[3.5, 0, 3.5]}
      />
      <Board3D />
      <Highlights />
      <Pieces3D />
    </Canvas>
  );
}
