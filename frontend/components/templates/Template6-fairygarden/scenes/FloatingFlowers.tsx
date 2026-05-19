'use client';
import { useRef } from 'react';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

const FLOWERS = [
  { pos: [-3.5, -1, -4] as [number, number, number], scale: 0.7, hue: '#e8a0b4' },
  { pos: [3.8, -1.5, -5] as [number, number, number], scale: 0.9, hue: '#c97dae' },
  { pos: [-1, -2, -6] as [number, number, number], scale: 1.1, hue: '#f0c4d4' },
  { pos: [1.5, -1.8, -3] as [number, number, number], scale: 0.6, hue: '#d4a0c8' },
];

function FlowerMesh({ color }: { color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[0.18, 0.06, 8, 24]} />
      <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} transparent opacity={0.9} />
    </mesh>
  );
}

export default function FloatingFlowers({ reduced }: { reduced: boolean }) {
  return (
    <>
      {FLOWERS.map((f, i) => (
        <Float
          key={i}
          speed={reduced ? 0 : 1.2}
          rotationIntensity={reduced ? 0 : 0.4}
          floatIntensity={reduced ? 0 : 0.6}
          position={f.pos}
        >
          <group scale={f.scale}>
            <FlowerMesh color={f.hue} />
            <mesh position={[0, 0, 0]}>
              <sphereGeometry args={[0.06, 8, 8]} />
              <meshStandardMaterial color="#ffe47a" emissive="#ffe47a" emissiveIntensity={0.6} />
            </mesh>
          </group>
        </Float>
      ))}
    </>
  );
}
