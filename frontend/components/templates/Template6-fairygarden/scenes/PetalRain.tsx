'use client';
import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  count: number;
  color: string;
  reduced: boolean;
}

const AREA = 12;
const HEIGHT = 14;

export default function PetalRain({ count, color, reduced }: Props) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const petals = useMemo(() =>
    Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * AREA * 2,
      y: Math.random() * HEIGHT - 2,
      z: (Math.random() - 0.5) * AREA,
      speed: 0.006 + Math.random() * 0.012,
      rotX: Math.random() * Math.PI * 2,
      rotZ: Math.random() * Math.PI * 2,
      wobble: Math.random() * Math.PI * 2,
      driftAmp: 0.002 + Math.random() * 0.003,
    })),
    [count]
  );

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8,
        roughness: 0.8,
        metalness: 0.0,
      }),
    [color]
  );

  useEffect(() => () => material.dispose(), [material]);

  useFrame(() => {
    if (!meshRef.current || reduced) return;

    petals.forEach((p, i) => {
      p.y -= p.speed;
      p.rotX += 0.012;
      p.rotZ += 0.009;
      p.wobble += 0.018;
      p.x += Math.sin(p.wobble) * p.driftAmp;

      if (p.y < -3) {
        p.y = HEIGHT;
        p.x = (Math.random() - 0.5) * AREA * 2;
      }

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(p.rotX, 0, p.rotZ);
      dummy.scale.setScalar(0.9 + Math.random() * 0.2);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (count === 0) return null;

  return (
    <instancedMesh ref={meshRef} args={[undefined, material, count]}>
      <planeGeometry args={[0.18, 0.24]} />
    </instancedMesh>
  );
}
