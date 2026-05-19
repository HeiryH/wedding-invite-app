'use client';
import { Sparkles } from '@react-three/drei';

interface Props {
  count: number;
  reduced: boolean;
}

export default function FirefliesLayer({ count, reduced }: Props) {
  const actualCount = reduced ? Math.floor(count * 0.1) : count;

  return (
    <Sparkles
      count={actualCount}
      scale={[14, 10, 14]}
      size={3}
      speed={reduced ? 0 : 0.25}
      opacity={0.85}
      color="#ffe47a"
      noise={0.6}
    />
  );
}
