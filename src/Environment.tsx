/**
 * @module Environment
 * @description Structured low-poly environment with grid roads and aligned trees
 */

import React, { useRef } from 'react';
import { usePlane, useBox, useCylinder } from '@react-three/cannon';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MeshWobbleMaterial } from '@react-three/drei';
import Building from './Building';

// Add Duck component
function Duck({ position = [0, 0, 0] as [number, number, number] }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Group>(null);
  
  useFrame(({ clock }) => {
    // Make duck bob up and down in water
    if (bodyRef.current) {
      bodyRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 1.5) * 0.05;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.8) * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Duck body */}
      <mesh ref={bodyRef} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#f9e076" />
      </mesh>
      
      {/* Duck head */}
      <group ref={headRef} position={[0.25, 0.2, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#f9e076" />
        </mesh>
        
        {/* Duck bill */}
        <mesh position={[0.15, -0.05, 0]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.1, 0.2, 16]} />
          <meshStandardMaterial color="#ff9900" />
        </mesh>
      </group>
    </group>
  );
}

// Add Pond component
function Pond({ position = [0, 0, 0] as [number, number, number], size = [15, 0.2, 10] as [number, number, number] }) {
  // Create a custom shape for the pond
  const shape = new THREE.Shape();
  
  // Start at origin
  shape.moveTo(0, 0);
  
  // Create a curved, non-standard pattern with changing concavity
  shape.bezierCurveTo(size[0] * 0.3, -size[2] * 0.4, size[0] * 0.7, -size[2] * 0.5, size[0], 0);
  shape.bezierCurveTo(size[0] * 1.1, size[2] * 0.5, size[0] * 0.8, size[2], size[0] * 0.5, size[2]);
  shape.bezierCurveTo(size[0] * 0.3, size[2] * 1.1, -size[0] * 0.1, size[2] * 0.7, 0, 0);
  
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 0.5,
    bevelEnabled: true,
    bevelThickness: 0.2,
    bevelSize: 0.3,
    bevelSegments: 3
  });
  
  // Rotate to lay flat
  geometry.rotateX(-Math.PI / 2);
  
  // Duck positions - make them more visible by raising them higher
  const duckPositions: [number, number, number][] = [
    [position[0] + size[0] * 0.3, position[1] + 1, position[2] + size[2] * 0.4],
    [position[0] + size[0] * 0.7, position[1] + 1, position[2] + size[2] * 0.6],
    [position[0] + size[0] * 0.5, position[1] + 1, position[2] + size[2] * 0.2],
  ];

  return (
    <group position={position}>
      {/* Pond base */}
      <mesh receiveShadow>
        <primitive object={geometry} />
        <meshStandardMaterial color="#2d5b7b" roughness={0.2} />
      </mesh>
      
      {/* Add ducks - larger and more visible */}
      {duckPositions.map((pos, i) => (
        <Duck key={`duck-${i}`} position={pos} />
      ))}
    </group>
  );
}

/**
 * Ground component representing the plane with low-poly style
 */
export function Ground() {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0, 0]
  }));

  return (
    <mesh ref={ref} receiveShadow>
      <planeGeometry args={[200, 200, 20, 20]} />
      <meshStandardMaterial 
        color="#8bc34a"
        roughness={0.8}
        metalness={0.2}
        flatShading={true}
      />
    </mesh>
  );
}

/**
 * Road line component for creating center or side lines
 */
function RoadLine({ 
  position = [0, 0.02, 0] as [number, number, number],
  size = [1, 0.02, 0.2] as [number, number, number],
  color = "#ffffff"
}) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} flatShading={true} />
    </mesh>
  );
}

/**
 * Road segment with lines
 */
export function RoadSegment({ 
  position = [0, 0.01, 0] as [number, number, number], 
  rotation = [0, 0, 0] as [number, number, number], 
  size = [80, 0.1, 20] as [number, number, number],
  isVertical = false
}) {
  const [ref] = useBox(() => ({
    type: 'Static',
    position,
    rotation,
    args: size,
  }));

  // Create road lines
  const lines = [];
  const roadLength = isVertical ? size[2] : size[0];
  const lineCount = Math.floor(roadLength / 3);
  
  // Center line (dashed)
  for (let i = 0; i < lineCount; i++) {
    if (i % 2 === 0) { // Skip every other one to create dashed effect
      const linePos = isVertical 
        ? [position[0], position[1] + 0.05, position[2] - roadLength/2 + i * 3 + 1.5]
        : [position[0] - roadLength/2 + i * 3 + 1.5, position[1] + 0.05, position[2]];
      
      const lineSize: [number, number, number] = isVertical ? [0.3, 0.1, 1.5] : [1.5, 0.1, 0.3];
      
      lines.push(
        <RoadLine 
          key={`center-line-${i}`} 
          position={linePos as [number, number, number]} 
          size={lineSize}
          color="#ffdd00" 
        />
      );
    }
  }
  
  // Side lines (solid)
  const sideOffset = isVertical ? size[0] / 2 - 0.5 : size[2] / 2 - 0.5;
  
  // Left/top side
  lines.push(
    <RoadLine 
      key="side-line-1" 
      position={isVertical 
        ? [position[0] - sideOffset, position[1] + 0.05, position[2]] 
        : [position[0], position[1] + 0.05, position[2] - sideOffset]
      } 
      size={isVertical ? [0.3, 0.1, size[2]] : [size[0], 0.1, 0.3]} 
      color="#ffffff"
    />
  );
  
  // Right/bottom side
  lines.push(
    <RoadLine 
      key="side-line-2" 
      position={isVertical 
        ? [position[0] + sideOffset, position[1] + 0.05, position[2]] 
        : [position[0], position[1] + 0.05, position[2] + sideOffset]
      } 
      size={isVertical ? [0.3, 0.1, size[2]] : [size[0], 0.1, 0.3]} 
      color="#ffffff"
    />
  );

  return (
    <group>
      <mesh ref={ref} receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#555555" roughness={0.6} flatShading={true} />
      </mesh>
      {lines}
    </group>
  );
}

/**
 * Road intersection cover to hide overlapping lines
 */
function RoadIntersection({ 
  position = [0, 0.06, 0] as [number, number, number],
  size = [10, 0.11, 10] as [number, number, number]
}) {
  return (
    <mesh position={position} receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color="#333333" roughness={0.7} flatShading={true} />
    </mesh>
  );
}

/**
 * Road grid component that creates a grid of roads
 */
export function RoadGrid({ 
  gridSize = 3, 
  roadWidth = 10, 
  cellSize = 80 
}) {
  const roads = [];
  const intersections = [];
  const offset = (gridSize * cellSize) / 2 - cellSize / 2;

  // Create horizontal roads
  for (let i = 0; i < gridSize; i++) {
    const position: [number, number, number] = [0, 0.01, i * cellSize - offset];
    const size: [number, number, number] = [gridSize * cellSize, 0.1, roadWidth];
    roads.push(
      <RoadSegment 
        key={`h-road-${i}`} 
        position={position} 
        size={size} 
        isVertical={false}
      />
    );
  }

  // Create vertical roads
  for (let i = 0; i < gridSize; i++) {
    const position: [number, number, number] = [i * cellSize - offset, 0.01, 0];
    const size: [number, number, number] = [roadWidth, 0.1, gridSize * cellSize];
    roads.push(
      <RoadSegment 
        key={`v-road-${i}`} 
        position={position} 
        size={size} 
        isVertical={true}
      />
    );
  }

  // Add intersection covers
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const position: [number, number, number] = [
        i * cellSize - offset, 
        0.02, // Slightly above the road
        j * cellSize - offset
      ];
      
      intersections.push(
        <RoadIntersection 
          key={`intersection-${i}-${j}`} 
          position={position} 
          size={[roadWidth * 0.85, 0.185, roadWidth * 0.85]} 
        />
      );
    }
  }

  return <group>{roads}{intersections}</group>;
}

/**
 * Tree component for creating a simple low-poly tree with physics
 */
export function Tree({ 
  position = [0, 0, 0] as [number, number, number], 
  scale = 1 
}) {
  const trunkHeight = 1.5 + Math.random() * 0.5;
  const trunkRadius = 0.2 + Math.random() * 0.05;
  const foliageSize = 1.2 + Math.random() * 0.3;
  const foliageColor = new THREE.Color('#2e7d32').offsetHSL(0, 0, (Math.random() - 0.5) * 0.1);

  const [ref] = useBox(() => ({
    type: 'Static',
    position,
    args: [foliageSize * 1.2, trunkHeight + foliageSize * 1.5, foliageSize * 1.2],
  }));

  return (
    <group position={position} scale={scale} ref={ref}>
      <mesh castShadow position={[0, trunkHeight + foliageSize * 0.75, 0]}>
        <coneGeometry args={[foliageSize, foliageSize * 1.5, 6]} />
        <meshStandardMaterial color={foliageColor.getHex()} roughness={0.8} flatShading={true} />
      </mesh>
      <mesh castShadow position={[0, trunkHeight / 2, 0]}>
        <cylinderGeometry args={[trunkRadius, trunkRadius * 1.2, trunkHeight, 6]} />
        <meshStandardMaterial color="#795548" roughness={0.9} flatShading={true} />
      </mesh>
    </group>
  );
}

/**
 * RoadTrees component that places trees along roads
 */
export function RoadTrees({ gridSize = 3, cellSize = 40, roadWidth = 5 }) {
  const trees = [];
  const offset = (gridSize * cellSize) / 2 - cellSize / 2;
  const treeSpacing = 7; // Increased spacing by ~30% (was 5)
  
  // Place trees along horizontal roads
  for (let i = 0; i < gridSize; i++) {
    const roadZ = i * cellSize - offset;
    
    // Trees along the top side of the road
    for (let x = -offset; x <= offset; x += treeSpacing) {
      // Skip intersections
      if (Math.abs(x % cellSize) < roadWidth + 2) continue;
      
      // Skip 30% of trees randomly
      if (Math.random() < 0.3) continue;
      
      // Add more random offset for natural look (50% more randomness)
      const xOffset = (Math.random() - 0.5) * 2.25; // Was 1.5
      const zOffset = 1 + Math.random() * 2.25; // Was 1.5
      const scale = 0.8 + Math.random() * 0.4;
      
      trees.push(
        <Tree 
          key={`tree-h-top-${i}-${x}`} 
          position={[x + xOffset, 0, roadZ - roadWidth/2 - zOffset]} 
          scale={scale}
        />
      );
    }
    
    // Trees along the bottom side of the road
    for (let x = -offset; x <= offset; x += treeSpacing) {
      // Skip intersections
      if (Math.abs(x % cellSize) < roadWidth + 2) continue;
      
      // Skip 30% of trees randomly
      if (Math.random() < 0.3) continue;
      
      const xOffset = (Math.random() - 0.5) * 2.25;
      const zOffset = 1 + Math.random() * 2.25;
      const scale = 0.8 + Math.random() * 0.4;
      
      trees.push(
        <Tree 
          key={`tree-h-bottom-${i}-${x}`} 
          position={[x + xOffset, 0, roadZ + roadWidth/2 + zOffset]} 
          scale={scale}
        />
      );
    }
  }
  
  // Place trees along vertical roads
  for (let i = 0; i < gridSize; i++) {
    const roadX = i * cellSize - offset;
    
    // Trees along the left side of the road
    for (let z = -offset; z <= offset; z += treeSpacing) {
      // Skip intersections
      if (Math.abs(z % cellSize) < roadWidth + 2) continue;
      
      // Skip 30% of trees randomly
      if (Math.random() < 0.3) continue;
      
      const zOffset = (Math.random() - 0.5) * 2.25;
      const xOffset = 1 + Math.random() * 2.25;
      const scale = 0.8 + Math.random() * 0.4;
      
      trees.push(
        <Tree 
          key={`tree-v-left-${i}-${z}`} 
          position={[roadX - roadWidth/2 - xOffset, 0, z + zOffset]} 
          scale={scale}
        />
      );
    }
    
    // Trees along the right side of the road
    for (let z = -offset; z <= offset; z += treeSpacing) {
      // Skip intersections
      if (Math.abs(z % cellSize) < roadWidth + 2) continue;
      
      // Skip 30% of trees randomly
      if (Math.random() < 0.3) continue;
      
      const zOffset = (Math.random() - 0.5) * 2.25;
      const xOffset = 1 + Math.random() * 2.25;
      const scale = 0.8 + Math.random() * 0.4;
      
      trees.push(
        <Tree 
          key={`tree-v-right-${i}-${z}`} 
          position={[roadX + roadWidth/2 + xOffset, 0, z + zOffset]} 
          scale={scale}
        />
      );
    }
  }
  
  return <group>{trees}</group>;
}

/**
 * Main Environment component that combines all environment elements
 */
export function Environment() {
  // Position buildings along the first horizontal road
  const cellSize = 80;
  const roadWidth = 10;
  const gridSize = 3;
  const offset = (gridSize * cellSize) / 2 - cellSize / 2;
  
  // First horizontal road is at z = -offset
  const roadZ = -offset;
  
  return (
    <group>
      <Ground />
      <RoadGrid gridSize={3} roadWidth={10} cellSize={80} />
      <RoadTrees gridSize={3} roadWidth={10} cellSize={80} />
      
      {/* Regular Buildings instead of Glass Buildings */}
      <Building 
        position={[-offset + cellSize*0.3, 10, roadZ - roadWidth - 15]} 
        size={[12, 20, 12]} 
      />
      <Building 
        position={[0, 15, roadZ - roadWidth - 20]} 
        size={[15, 30, 15]} 
      />
      <Building 
        position={[offset - cellSize*0.3, 12, roadZ - roadWidth - 18]} 
        size={[14, 24, 14]} 
      />
      
      {/* Add a pond in the center cell of the grid - 3x smaller */}
      <Pond 
        position={[-cellSize/2 - 10, 0.1, -cellSize/2 + 10]} 
        size={[30, -0.5, 30]} 
      />
    </group>
  );
}

export default Environment;
