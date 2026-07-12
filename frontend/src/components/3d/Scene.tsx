"use client";

import { Canvas } from "@react-three/fiber";

export default function Scene() {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: 300 }}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} />
        <mesh rotation={[0.4, 0.4, 0]}>
          <boxGeometry args={[2.2, 2.2, 2.2]} />
          <meshStandardMaterial color="#f59e0b" wireframe />
        </mesh>
      </Canvas>
    </div>
  );
}

