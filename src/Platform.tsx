import React, { useRef } from 'react';
import { useBox } from '@react-three/cannon';
import { useFrame } from '@react-three/fiber';

function Platform({ position = [0, 0, 0] as [number, number, number], 
                    size = [5, 0.5, 5] as [number, number, number], 
                    range = 10, 
                    speed = 0.5 }) {
  const [ref, api] = useBox(() => ({
    type: 'Kinematic',
    position,
    args: size,
  }));
  
  const positionRef = useRef<[number, number, number]>(position);
  const directionRef = useRef(1);
  const startY = position[1];
  
  useFrame(() => {
    // Update position
    const newY = positionRef.current[1] + speed * directionRef.current * 0.01;
    
    // Check if we need to change direction
    if (newY > startY + range) {
      directionRef.current = -1;
    } else if (newY < startY) {
      directionRef.current = 1;
    }
    
    // Update position
    positionRef.current = [positionRef.current[0], newY, positionRef.current[2]];
    api.position.set(positionRef.current[0], newY, positionRef.current[2]);
  });

  return (
    <mesh ref={ref} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#4682b4" />
    </mesh>
  );
}

export default Platform;
