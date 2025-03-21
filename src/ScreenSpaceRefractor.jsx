import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'
import * as THREE from 'three'

// Vertex shader for refraction
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

// Fragment shader for refraction
const fragmentShader = `
  uniform sampler2D uTexture;
  uniform vec2 winResolution;
  uniform float ior;
  uniform float chromaticAberration;
  
  varying vec3 worldNormal;
  varying vec3 eyeVector;

  void main() {
    // Get screen-space coordinates
    vec2 uv = gl_FragCoord.xy / winResolution.xy;
    vec3 normal = normalize(worldNormal);
    
    // Calculate refraction vector with proper direction
    float iorRatio = 1.0 / ior;
    vec3 refractVec = refract(normalize(eyeVector), normal, iorRatio);
    
    // Scale the refraction effect
    float refractScale = 0.1;
    
    // Apply chromatic aberration if enabled
    if (chromaticAberration > 0.0) {
      float iorR = 1.0 / (ior * (1.0 - chromaticAberration * 0.01));
      float iorG = 1.0 / ior;
      float iorB = 1.0 / (ior * (1.0 + chromaticAberration * 0.01));
      
      vec3 refractVecR = refract(normalize(eyeVector), normal, iorR);
      vec3 refractVecG = refract(normalize(eyeVector), normal, iorG);
      vec3 refractVecB = refract(normalize(eyeVector), normal, iorB);
      
      // Apply scaled refraction to UV coordinates
      vec2 uvR = uv + refractVecR.xy * refractScale;
      vec2 uvG = uv + refractVecG.xy * refractScale;
      vec2 uvB = uv + refractVecB.xy * refractScale;
      
      // Sample texture with refracted coordinates
      float r = texture2D(uTexture, uvR).r;
      float g = texture2D(uTexture, uvG).g;
      float b = texture2D(uTexture, uvB).b;
      
      gl_FragColor = vec4(r, g, b, 1.0);
    } else {
      // Apply scaled refraction to UV coordinates
      vec2 refractedUV = uv + refractVec.xy * refractScale;
      vec4 color = texture2D(uTexture, refractedUV);
      gl_FragColor = color;
    }
  }
`

export const ScreenSpaceRefraction = ({ 
  children, 
  geometry, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = [1, 1, 1], 
  ior = 1.31, 
  chromaticAberration = 0.5,
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
    ior: { value: ior },
    chromaticAberration: { value: chromaticAberration }
  }), [size, ior, chromaticAberration])
  
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
        {geometry || <sphereGeometry args={[1, 64, 64]} />}
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
        />
      </mesh>
    </>
  )
}

// Example usage:
// <ScreenSpaceRefraction position={[0, 0, 0]} ior={1.5} chromaticAberration={0.8}>
//   <ambientLight intensity={0.5} />
//   <directionalLight position={[10, 10, 5]} />
//   <Box position={[-2, 0, 0]} />
//   <Sphere position={[2, 0, 0]} />
// </ScreenSpaceRefraction>

export default ScreenSpaceRefraction
