import React, { useRef } from 'react';
import { useBox } from '@react-three/cannon';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial, useGLTF, Environment } from '@react-three/drei';

function GlassBuilding({ 
  position = [0, 0, 0] as [number, number, number],
  size = [12, 20, 12] as [number, number, number],
  color = "#88ccff"
}) {
  // Main building body
  const [buildingRef] = useBox(() => ({
    type: 'Static',
    position,
    args: size,
  }));

  // Roof
  const roofPosition: [number, number, number] = [
    position[0], 
    position[1] + size[1]/2 + 0.5, 
    position[2]
  ];
  
  const [roofRef] = useBox(() => ({
    type: 'Static',
    position: roofPosition,
    args: [size[0] + 1, 1, size[2] + 1] as [number, number, number],
  }));

  return (
    <group>
      {/* Glass building body with extreme reflection */}
      <mesh ref={buildingRef} receiveShadow castShadow position={position}>
        <boxGeometry args={size} />
        <MeshReflectorMaterial
          blur={[0, 0]}
          resolution={2048}
          mixBlur={0}
          mixStrength={1}
          roughness={0}
          depthScale={1}
          minDepthThreshold={0.1}
          maxDepthThreshold={1}
          color={color}
          metalness={1}
          mirror={1}
        />
      </mesh>
      
      {/* Roof */}
      <mesh ref={roofRef} receiveShadow castShadow>
        <boxGeometry args={[size[0] + 1, 1, size[2] + 1]} />
        <meshStandardMaterial color="#333333" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Add environment for reflections */}
      <Environment preset="city" background={false} />
    </group>
  );
}

export default GlassBuilding;
