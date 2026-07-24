'use client';
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import FirefliesLayer from './FirefliesLayer';
import PetalRain from './PetalRain';
import FloatingFlowers from './FloatingFlowers';
import { FairyConfig } from '../hooks/useFairyConfig';

interface Props {
  config: FairyConfig;
  reduced: boolean;
}

export default function FairyGardenScene({ config, reduced }: Props) {
  return (
    <Canvas
      frameloop="always"
      camera={{ position: [0, 1, 6], fov: 65 }}
      gl={{ antialias: false, powerPreference: 'low-power', alpha: true }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      dpr={[1, 1.5]}
    >
      <Suspense fallback={null}>
        <fog attach="fog" args={[config.fogColor, 8, 30]} />
        <ambientLight intensity={0.4} color="#4a7a4a" />
        <pointLight position={[0, 5, 0]} intensity={0.8} color="#ffe47a" distance={20} decay={2} />
        <pointLight position={[-4, 2, -2]} intensity={0.4} color="#a0c8ff" distance={15} decay={2} />

        <FirefliesLayer count={config.fireflyCount} reduced={reduced} />
        <PetalRain count={config.petalCount} color={config.petalColor} reduced={reduced} />
        <FloatingFlowers reduced={reduced} />

        <Environment preset={config.environment} />

        {config.bloom && !reduced && (
          <EffectComposer>
            <Bloom
              intensity={1.8}
              luminanceThreshold={0.65}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}
