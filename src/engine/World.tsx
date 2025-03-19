"use client"

import { useEffect, useRef, useState } from "react"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import { Physics } from "./Physics"
import { Entity } from "./Entity"
import { Renderer } from "./Renderer"
import { DayNightCycle } from "./DayNightCycle"

export class World {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: Renderer
  physics: Physics
  entities: Entity[] = []
  controls: OrbitControls | null = null
  animationFrameId: number | null = null
  dayNightCycle: DayNightCycle

  constructor(container: HTMLDivElement) {
    // Scene setup
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x87ceeb) // Sky blue background

    // Camera setup with more height and distance
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    this.camera.position.set(15, 20, 30) // Increased height and distance
    this.camera.lookAt(0, 5, 0) // Looking slightly above ground level

    // Renderer setup
    this.renderer = new Renderer(container, window.innerWidth, window.innerHeight)

    // Physics setup
    this.physics = new Physics()

    // Controls
    this.setupControls()

    // Handle window resize
    window.addEventListener("resize", this.handleResize)

    // Initialize day-night cycle
    this.dayNightCycle = new DayNightCycle()
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
    // Initialize day-night cycle with the scene
    // This will create and manage all the lighting
    this.dayNightCycle.initialize(this.scene)
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

    // Update day-night cycle
    this.dayNightCycle.update()

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
