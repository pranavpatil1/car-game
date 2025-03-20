import React from 'react';
import { useBox } from '@react-three/cannon';

function Ramp({ position = [0, 0, 0] as [number, number, number], 
                rotation = [0, 0, 0] as [number, number, number], 
                size = [5, 1, 10] as [number, number, number] }) {
  const [ref] = useBox(() => ({
    type: 'Static',
    position,
    rotation,
    args: size,
  }));

  return (
    <mesh ref={ref} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#8b4513" />
    </mesh>
  );
}

export default Ramp;
