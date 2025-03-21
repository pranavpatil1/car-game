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
import Environment from './Environment';
import GlassBuilding from './GlassBuilding';

// Define interface for CameraController props
interface CameraControllerProps {
  target: React.RefObject<any>;
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
        
        <Physics
          gravity={[0, -9.81, 0]}
          defaultContactMaterial={{
            friction: 0.7,
            restitution: 0.3,
          }}
        >
          <Environment />
          <Car position={[1, 1, 1]} ref={carRef} />
          
          {/* Ramp */}
          <Ramp 
            position={[10, 1, 0]} 
            rotation={[Math.PI/8, 0, 0]} 
            size={[8, 1, 15]} 
          />
          
          {/* Glass Building with correct height positioning */}
          <GlassBuilding 
            position={[15, 5, -15]} 
            size={[10, 10, 10]} 
            color="#66aadd"
          />
          
          {/* Moving Platform */}
          <Platform 
            position={[18, -3, -5]} 
            size={[5, 0.5, 5]} 
            range={6} 
            speed={2} 
          />
        </Physics>
      </Canvas>
    </KeyboardControls>
  );
}

export default App;
