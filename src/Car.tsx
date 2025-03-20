import React, { useRef, forwardRef, useImperativeHandle, ForwardedRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCompoundBody, useRaycastVehicle, useBox } from '@react-three/cannon';
import { useKeyboardControls } from '@react-three/drei';
import { Object3D, SpotLight } from 'three';

// Define the props interface for the Car component
interface CarProps {
  position?: [number, number, number];
}

/**
 * Low-poly car component with basic physics and controls
 */
const Car = forwardRef<any, CarProps>(({ position = [0, 1, 0] }, ref) => {
  const [, getKeys] = useKeyboardControls();
  
  // Refs for headlights
  const leftHeadlightRef = useRef<SpotLight>(null);
  const rightHeadlightRef = useRef<SpotLight>(null);
  const leftTargetRef = useRef<Object3D>(null);
  const rightTargetRef = useRef<Object3D>(null);
  
  // Ref for the chassis to expose to parent
  const chassisRef = useRef(null);

  // Car body using compound physics body for better collision
  const [, chassisApi] = useCompoundBody(() => ({
    mass: 150,
    position,
    shapes: [
      { type: 'Box', position: [0, 0, 0] as [number, number, number], args: [1.7, 0.5, 4] as [number, number, number] },
      { type: 'Box', position: [0, 0.5, 0] as [number, number, number], args: [1.5, 0.5, 2] as [number, number, number] },
    ],
    allowSleep: false,
    angularDamping: 0.9,
    linearDamping: 0.5,
  }), chassisRef);

  // Expose the chassis ref to parent components
  useImperativeHandle(ref, () => chassisRef.current);

  // Wheels
  const wheelRadius = 0.4;
  const wheelWidth = 0.4;
  const wheelOffset = {
    width: 0.8,
    height: -0.3,
    front: 1.3,
    back: -1.3,
  };

  // Wheel physics bodies - use 'Dynamic' type with collisionFilterGroup
  const [flWheelRef] = useBox(() => ({
    mass: 1,
    type: 'Dynamic',
    collisionFilterGroup: 0, // Disable collision with other objects
    position: [wheelOffset.width, wheelOffset.height, wheelOffset.front],
    args: [wheelWidth, wheelRadius, wheelRadius],
  }));
  
  const [frWheelRef] = useBox(() => ({
    mass: 1,
    type: 'Dynamic',
    collisionFilterGroup: 0,
    position: [-wheelOffset.width, wheelOffset.height, wheelOffset.front],
    args: [wheelWidth, wheelRadius, wheelRadius],
  }));
  
  const [blWheelRef] = useBox(() => ({
    mass: 1,
    type: 'Dynamic',
    collisionFilterGroup: 0,
    position: [wheelOffset.width, wheelOffset.height, wheelOffset.back],
    args: [wheelWidth, wheelRadius, wheelRadius],
  }));
  
  const [brWheelRef] = useBox(() => ({
    mass: 1,
    type: 'Dynamic',
    collisionFilterGroup: 0,
    position: [-wheelOffset.width, wheelOffset.height, wheelOffset.back],
    args: [wheelWidth, wheelRadius, wheelRadius],
  }));
  
  const wheelInfo = {
    radius: wheelRadius,
    directionLocal: [0, -1, 0] as [number, number, number],
    suspensionStiffness: 30,
    suspensionRestLength: 0.3,
    maxSuspensionForce: 100000,
    maxSuspensionTravel: 0.3,
    dampingRelaxation: 10,
    dampingCompression: 4.4,
    frictionSlip: 2,
    rollInfluence: 0.01,
    axleLocal: [1, 0, 0] as [number, number, number],
    chassisConnectionPointLocal: [0, 0, 0] as [number, number, number],
    useCustomSlidingRotationalSpeed: true,
    customSlidingRotationalSpeed: -30,
  };

  const wheelInfos = [
    {
      ...wheelInfo,
      chassisConnectionPointLocal: [
        wheelOffset.width, 
        wheelOffset.height, 
        wheelOffset.front
      ] as [number, number, number],
      isFrontWheel: true,
    },
    {
      ...wheelInfo,
      chassisConnectionPointLocal: [
        -wheelOffset.width, 
        wheelOffset.height, 
        wheelOffset.front
      ] as [number, number, number],
      isFrontWheel: true,
    },
    {
      ...wheelInfo,
      chassisConnectionPointLocal: [
        wheelOffset.width, 
        wheelOffset.height, 
        wheelOffset.back
      ] as [number, number, number],
      isFrontWheel: false,
    },
    {
      ...wheelInfo,
      chassisConnectionPointLocal: [
        -wheelOffset.width, 
        wheelOffset.height, 
        wheelOffset.back
      ] as [number, number, number],
      isFrontWheel: false,
    },
  ];

  const [vehicle, vehicleApi] = useRaycastVehicle(() => ({
    chassisBody: chassisRef,
    wheels: [blWheelRef, brWheelRef, flWheelRef, frWheelRef], // Swapped: back wheels first, then front wheels
    wheelInfos,
    indexForwardAxis: 2,
    indexRightAxis: 0,
    indexUpAxis: 1,
  }));

  // Car controls
  useFrame(() => {
    const { forward, backward, left, right } = getKeys();
    
    // Apply forces based on key presses
    const engineForce = 500;
    const brakeForce = 15;
    const maxSteer = 0.5;
    
    // Reset forces
    for (let i = 0; i < 4; i++) {
      vehicleApi.applyEngineForce(0, i);
      vehicleApi.setBrake(0, i);
    }
    
    if (forward) {
      for (let i = 0; i < 4; i++) {
        vehicleApi.applyEngineForce(engineForce, i); // Positive for forward
      }
    }
    
    if (backward) {
      for (let i = 0; i < 4; i++) {
        vehicleApi.applyEngineForce(-engineForce, i); // Negative for backward
      }
    }
    
    if (!forward && !backward) {
      for (let i = 0; i < 4; i++) {
        vehicleApi.setBrake(brakeForce, i);
      }
    }
    
    // Steering (only front wheels - now indices 2 and 3)
    if (left) {
      vehicleApi.setSteeringValue(maxSteer, 2);
      vehicleApi.setSteeringValue(maxSteer, 3);
    } else if (right) {
      vehicleApi.setSteeringValue(-maxSteer, 2);
      vehicleApi.setSteeringValue(-maxSteer, 3);
    } else {
      vehicleApi.setSteeringValue(0, 2);
      vehicleApi.setSteeringValue(0, 3);
    }

    // Update headlight targets to follow car direction
    if (leftHeadlightRef.current && rightHeadlightRef.current && 
        leftTargetRef.current && rightTargetRef.current) {
      leftHeadlightRef.current.target = leftTargetRef.current;
      rightHeadlightRef.current.target = rightTargetRef.current;
    }
  });

  return (
    <group ref={vehicle}>
      {/* Chassis */}
      <group ref={chassisRef}>
        {/* Main body - lower part */}
        <mesh position={[0, 0, 0]} castShadow>
          <boxGeometry args={[1.7, 0.3, 4]} />
          <meshStandardMaterial color="#ff9800" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Sloped hood */}
        <mesh position={[0, 0.25, -1.2]} rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[1.6, 0.1, 1.5]} />
          <meshStandardMaterial color="#ff9800" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Cabin - sloped windshield */}
        <mesh position={[0, 0.4, -0.2]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[1.5, 0.3, 1.2]} />
          <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.1} />
        </mesh>
        
        {/* Cabin - roof */}
        <mesh position={[0, 0.55, 0.6]} castShadow>
          <boxGeometry args={[1.4, 0.2, 1]} />
          <meshStandardMaterial color="#ff9800" metalness={0.8} roughness={0.2} />
        </mesh>
        
        {/* Rear sloped window */}
        <mesh position={[0, 0.4, 1.3]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[1.4, 0.3, 0.8]} />
          <meshStandardMaterial color="#111111" metalness={0.5} roughness={0.1} />
        </mesh>
        
        {/* Headlights with cone glow */}
        <mesh position={[0.6, 0.2, -1.95]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.1]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffff99" emissiveIntensity={2} />
        </mesh>
        <spotLight 
          ref={rightHeadlightRef}
          position={[0.6, 0.2, -1.95]} 
          angle={0.5} 
          penumbra={0.5} 
          intensity={7.5} 
          color="#ffffcc" 
          distance={20} 
          castShadow={false} 
        />
        <object3D ref={rightTargetRef} position={[0.6, 0.2, -10]} />

        <mesh position={[-0.6, 0.2, -1.95]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.1]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffff99" emissiveIntensity={2} />
        </mesh>
        <spotLight 
          ref={leftHeadlightRef}
          position={[-0.6, 0.2, -1.95]} 
          angle={0.5} 
          penumbra={0.5} 
          intensity={7.5} 
          color="#ffffcc" 
          distance={20} 
          castShadow={false} 
        />
        <object3D ref={leftTargetRef} position={[-0.6, 0.2, -10]} />
        
        {/* Taillights */}
        <mesh position={[0.6, 0.2, 1.95]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.1]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
        </mesh>
        
        <mesh position={[-0.6, 0.2, 1.95]} castShadow>
          <boxGeometry args={[0.3, 0.2, 0.1]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1} />
        </mesh>
      </group>
      
      {/* Wheels - with sporty rims */}
      <group ref={flWheelRef}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[wheelRadius * 0.7, wheelRadius * 0.7, wheelWidth + 0.01, 5]} />
          <meshStandardMaterial color="#333333" metalness={0.8} />
        </mesh>
      </group>
      
      <group ref={frWheelRef}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[wheelRadius * 0.7, wheelRadius * 0.7, wheelWidth + 0.01, 5]} />
          <meshStandardMaterial color="#333333" metalness={0.8} />
        </mesh>
      </group>
      
      <group ref={blWheelRef}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[wheelRadius * 0.7, wheelRadius * 0.7, wheelWidth + 0.01, 5]} />
          <meshStandardMaterial color="#333333" metalness={0.8} />
        </mesh>
      </group>
      
      <group ref={brWheelRef}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[wheelRadius, wheelRadius, wheelWidth, 8]} />
          <meshStandardMaterial color="#111111" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[wheelRadius * 0.7, wheelRadius * 0.7, wheelWidth + 0.01, 5]} />
          <meshStandardMaterial color="#333333" metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
});

export default Car;
