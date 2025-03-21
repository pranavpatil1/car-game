import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import * as THREE from 'three'

// Vertex shader for reflection
const vertexShader = `
  varying vec3 worldNormal;
  varying vec3 eyeVector;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    worldNormal = normalize(normalMatrix * normal);
    eyeVector = normalize(worldPos.xyz - cameraPosition);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Fragment shader for reflection
const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2 winResolution;
  uniform float reflectivity;
  
  varying vec3 worldNormal;
  varying vec3 eyeVector;

  void main() {
    // Get screen-space coordinates
    vec2 uv = gl_FragCoord.xy / winResolution.xy;
    vec3 normal = normalize(worldNormal);
    
    // Calculate reflection vector
    vec3 reflectVec = reflect(normalize(eyeVector), normal);
    
    // Scale the reflection effect
    float reflectScale = 0.1;
    
    // Apply reflection to UV coordinates
    vec2 reflectedUV = uv + reflectVec.xy * reflectScale;
    
    // Sample texture with reflected coordinates
    vec4 color = texture2D(uTexture, reflectedUV);
    
    // Apply reflectivity
    gl_FragColor = color * reflectivity;
  }
`

export const ScreenSpaceReflector = ({ 
  children, 
  geometry, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = [1, 1, 1], 
  reflectivity = 0.8,
  ...props 
}) => {
  const mesh = useRef()
  const { gl, scene, camera, size } = useThree()
  
  // Create a render target (FBO)
  const renderTarget = useFBO()
  
  // Create shader uniforms
  const uniforms = useMemo(() => ({
    uTexture: { value: null },
    winResolution: { 
      value: new THREE.Vector2(size.width, size.height)
        .multiplyScalar(Math.min(window.devicePixelRatio, 2)) 
    },
    reflectivity: { value: reflectivity }
  }), [size, reflectivity])
  
  // Update resolution when window size changes
  useEffect(() => {
    uniforms.winResolution.value.set(
      size.width, 
      size.height
    ).multiplyScalar(Math.min(window.devicePixelRatio, 2))
  }, [size, uniforms])
  
  // Render loop
  useFrame(() => {
    if (!mesh.current) return
    
    // Hide the mesh
    mesh.current.visible = false
    
    // Render the scene to the FBO
    gl.setRenderTarget(renderTarget)
    gl.render(scene, camera)
    
    // Update the texture uniform with the rendered scene
    mesh.current.material.uniforms.uTexture.value = renderTarget.texture
    
    // Reset render target and show the mesh
    gl.setRenderTarget(null)
    mesh.current.visible = true
  })
  
  return (
    <>
      {children}
      <mesh
        ref={mesh}
        position={position}
        rotation={rotation}
        scale={scale}
        {...props}
      >
        {geometry || <boxGeometry args={[1, 1, 1]} />}
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </>
  )
}

export default ScreenSpaceReflector