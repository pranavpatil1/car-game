"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Physics } from "./Physics"
import { Entity } from "./Entity"
import { Renderer } from "./Renderer"

export class World {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: Renderer
  physics: Physics
  entities: Entity[] = []
  controls: OrbitControls | null = null
  animationFrameId: number | null = null
  
  constructor(container: HTMLDivElement) {
    // Scene setup
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // Sky blue background
    
    // Camera setup
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(10, 10, 20)
    this.camera.lookAt(0, 0, 0)
    
    // Renderer setup
    this.renderer = new Renderer(container, window.innerWidth, window.innerHeight)
    
    // Physics setup
    this.physics = new Physics()
    
    // Controls
    this.setupControls()
    
    // Handle window resize
    window.addEventListener("resize", this.handleResize)
  }
  
  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05 // Prevent going below ground
  }
  
  addEntity(entity: Entity) {
    this.entities.push(entity)
    entity.addToWorld(this)
  }
  
  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    this.scene.add(ambientLight)
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
    directionalLight.position.set(5, 10, 7.5)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    this.scene.add(directionalLight)
  }
  
  start() {
    this.animate()
  }
  
  stop() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    
    window.removeEventListener("resize", this.handleResize)
  }
  
  animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate)
    
    // Update physics
    this.physics.update()
    
    // Update all entities
    this.entities.forEach(entity => entity.update())
    
    // Render scene
    this.renderer.render(this.scene, this.camera)
  }
  
  handleResize = () => {
    const width = window.innerWidth
    const height = window.innerHeight
    
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    
    this.renderer.setSize(width, height)
  }
}

export function useWorld(containerRef: React.RefObject<HTMLDivElement>) {
  const [world, setWorld] = useState<World | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    const newWorld = new World(containerRef.current)
    setWorld(newWorld)
    
    newWorld.setupLighting()
    newWorld.start()
    setIsLoaded(true)
    
    return () => {
      newWorld.stop()
    }
  }, [containerRef])
  
  return { world, isLoaded }
}
