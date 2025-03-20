import React from 'react';
import { useBox } from '@react-three/cannon';

function Building({ position = [0, 5, 0] as [number, number, number], 
                    size = [10, 10, 10] as [number, number, number] }) {
  // Main building body
  const [buildingRef] = useBox(() => ({
    type: 'Static',
    position,
    args: size,
  }));

  // Roof
  const roofPosition: [number, number, number] = [position[0], position[1] + size[1]/2 + 0.5, position[2]];
  const [roofRef] = useBox(() => ({
    type: 'Static',
    position: roofPosition,
    args: [size[0] + 1, 1, size[2] + 1] as [number, number, number],
  }));

  return (
    <group>
      {/* Building body */}
      <mesh ref={buildingRef} receiveShadow castShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#555555" />
      </mesh>
      
      {/* Windows */}
      {[...Array(3)].map((_, i) => (
        <mesh 
          key={`window-front-${i}`} 
          position={[position[0] - 2 + i * 2, position[1], position[2] + size[2]/2 + 0.01] as [number, number, number]} 
          receiveShadow 
          castShadow
        >
          <planeGeometry args={[1.5, 1.5]} />
          <meshStandardMaterial color="#88ccff" emissive="#88ccff" emissiveIntensity={0.5} />
        </mesh>
      ))}
      
      {/* Roof */}
      <mesh ref={roofRef} receiveShadow castShadow>
        <boxGeometry args={[size[0] + 1, 1, size[2] + 1] as [number, number, number]} />
        <meshStandardMaterial color="#333333" />
      </mesh>
    </group>
  );
}

export default Building;
