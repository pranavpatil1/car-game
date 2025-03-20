/**
 * @module App
 * @description Simple Three.js scene with a low-poly car on a plane
 * @license MIT
 */

import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, KeyboardControls, PerspectiveCamera } from '@react-three/drei';
import { Physics, usePlane } from '@react-three/cannon';
import { Vector3, PerspectiveCamera as ThreePerspectiveCamera } from 'three';
import Car from './Car';
import Ramp from './Ramp';
import Building from './Building';
import Platform from './Platform';

// Define interface for CameraController props
interface CameraControllerProps {
  target: React.RefObject<any>;
}

/**
 * Ground component representing the plane
 */
function Ground() {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0]
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#8bc34a" />
    </mesh>
  );
}

/**
 * Camera controller that follows the car
 */
function CameraController({ target }: CameraControllerProps) {
  const cameraRef = useRef<ThreePerspectiveCamera>(null);
  // 45-degree angle offset with distance behind the car
  const offset = new Vector3(-10, 10, -10); 
  
  useFrame(() => {
    if (cameraRef.current && target.current) {
      // Get car position
      const targetPosition = target.current.position;
      
      // Set camera position to follow car with offset
      const newPosition = new Vector3().copy(targetPosition).add(offset);
      cameraRef.current.position.copy(newPosition);
      
      // Look at car
      cameraRef.current.lookAt(targetPosition);
    }
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[0, 10, -10]} // Initial position
      fov={90}
      near={0.1}
      far={1000}
    />
  );
}

/**
 * Main App component
 */
function App() {
  const carRef = useRef(null);
  
  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['ArrowUp', 'w', 'W'] },
        { name: 'backward', keys: ['ArrowDown', 's', 'S'] },
        { name: 'left', keys: ['ArrowLeft', 'a', 'A'] },
        { name: 'right', keys: ['ArrowRight', 'd', 'D'] },
        { name: 'jump', keys: ['Space'] },
      ]}
    >
      <Canvas shadows>
        <color attach="background" args={['#111122']} />
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[10, 10, 10]}
          intensity={0.5}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={50}
          shadow-camera-left={-20}
          shadow-camera-right={20}
          shadow-camera-top={20}
          shadow-camera-bottom={-20}
        />
        
        <CameraController target={carRef} />
        
        <Physics
          gravity={[0, -9.81, 0]}
          defaultContactMaterial={{
            friction: 0.7,
            restitution: 0.3,
          }}
        >
          <Ground />
          <Car position={[0, 2, 0]} ref={carRef} />
          
          {/* Ramp */}
          <Ramp 
            position={[10, 1, 0]} 
            rotation={[Math.PI/8, 0, 0]} 
            size={[8, 1, 15]} 
          />
          
          {/* Building */}
          <Building 
            position={[20, 5, -15]} 
            size={[10, 10, 10]} 
          />
          
          {/* Moving Platform */}
          <Platform 
            position={[20, 1, -5]} 
            size={[5, 0.5, 5]} 
            range={9} 
            speed={0.5} 
          />
        </Physics>
      </Canvas>
    </KeyboardControls>
  );
}

export default App;
