import * as THREE from "three"
import { Entity } from "../engine/Entity"
import { Controls } from "../engine/Controls"
import { World } from "../engine/World"

export interface VehicleConfig {
  maxSpeed: number
  turnSpeed: number
  friction: number
  braking: number
  acceleration: number
}

export class Vehicle extends Entity {
  config: VehicleConfig
  controls: Controls
  speed: number = 0
  groundNormal: THREE.Vector3 = new THREE.Vector3(0, 1, 0)
  isOnRamp: boolean = false
  private lastShotTime: number = 0
  private shootingCooldown: number = 250
  private shootSound: THREE.Audio | null = null
  private engineSound: THREE.Audio | null = null
  private audioLoader: THREE.AudioLoader
  private audioListener: THREE.AudioListener

  constructor(config: VehicleConfig) {
    super()
    
    this.config = {
      maxSpeed: 0.25,
      turnSpeed: 0.03,
      friction: 0.98,  // Slightly less friction
      braking: 0.9,
      acceleration: 0.003, // Much smaller acceleration for gradual speed increase
      ...config
    }
    
    this.controls = new Controls()
    
    // Initialize audio
    this.audioListener = new THREE.AudioListener()
    this.audioLoader = new THREE.AudioLoader()
    
    // Create and load the shooting sound
    this.shootSound = new THREE.Audio(this.audioListener)
    this.audioLoader.load('/sounds/gunshot.m4a', (buffer) => {
      if (this.shootSound) {
        this.shootSound.setBuffer(buffer)
        this.shootSound.setVolume(0.5) // Adjust volume as needed
      }
    })

    // Create and load the engine sound
    this.engineSound = new THREE.Audio(this.audioListener)
    this.audioLoader.load('/sounds/engine.m4a', (buffer) => {
      if (this.engineSound) {
        this.engineSound.setBuffer(buffer)
        this.engineSound.setVolume(0.3)  // Set a base volume
        this.engineSound.setLoop(true)   // Make it loop continuously
        // Start playing immediately
        this.engineSound.play()
      }
    })
  }

  addToWorld(world: World) {
    super.addToWorld(world)
    // Add audio listener to the camera
    world.camera.add(this.audioListener)
  }

  private handleEngineSound() {
    if (this.engineSound) {
      this.engineSound.setVolume(0.1 + (this.speed / this.config.maxSpeed) * 0.4)
    }
  }
  
  update(delta: number = 1) {
    this.updateMovement(delta)
    this.updateGroundContact()
    this.updateRotation()
    this.handleShooting()
    this.handleEngineSound()
    
    // Update mesh position and rotation
    this.mesh.position.copy(this.position)
    this.mesh.rotation.y = this.rotation.y
    
    // Apply tilt based on ground normal if on ramp
    if (this.isOnRamp) {
      this.applyTilt()
    } else {
      // Reset rotation to be flat on flat ground
      this.mesh.rotation.x = 0
      this.mesh.rotation.z = 0
    }
  }

  private handleShooting() {
    if (!this.world) return

    const currentTime = performance.now()
    if (this.controls.isPressed(" ") && currentTime - this.lastShotTime > this.shootingCooldown) {
      this.shoot()
      this.lastShotTime = currentTime
    }
  }

  private shoot() {
    if (!this.world) return

    // Play shooting sound
    if (this.shootSound && this.shootSound.isPlaying) {
      this.shootSound.stop() // Stop current sound if playing
    }
    if (this.shootSound) {
      this.shootSound.play() // Play the sound
    }

    // Create projectile
    const projectileGeometry = new THREE.SphereGeometry(0.2, 8, 8)
    const projectileMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      emissive: 0xff0000,
      emissiveIntensity: 0.5
    })
    const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial)

    // Position projectile at the front of the car, slightly elevated
    const spawnOffset = new THREE.Vector3(0, 1, 2)
    spawnOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y)
    projectile.position.copy(this.position).add(spawnOffset)

    // Add to scene
    this.world.scene.add(projectile)

    // Calculate velocity direction based on car's rotation
    const velocity = new THREE.Vector3(0, 0, 1)
    velocity.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y)
    // Add the car's speed to the projectile's base speed
    velocity.multiplyScalar(0.5 + this.speed) // Combines base projectile speed with car's current speed

    // Create cleanup timeout
    setTimeout(() => {
      this.world?.scene.remove(projectile)
    }, 2000) // Remove after 2 seconds

    // Animate projectile
    const animate = () => {
      if (!this.world?.scene.children.includes(projectile)) return
      
      projectile.position.add(velocity)
      requestAnimationFrame(animate)
    }
    animate()
  }
  
  updateMovement(delta: number) {
    // Reset velocity if we're not moving
    if (!this.controls.isPressed("w") && !this.controls.isPressed("s")) {
      this.speed *= this.config.friction // Apply friction to slow down
    } else {
      // Accelerate or decelerate based on input
      if (this.controls.isPressed("s")) {
        this.speed -= this.config.acceleration * delta
        // Limit reverse speed to half of max speed
        this.speed = Math.max(this.speed, -this.config.maxSpeed * 0.5)
      } else if (this.controls.isPressed("w")) {
        this.speed += this.config.acceleration * delta
        // Limit forward speed to max speed
        this.speed = Math.min(this.speed, this.config.maxSpeed)
      }
    }

    // Create velocity vector based on current speed
    this.velocity.set(0, 0, this.speed)
    
    // Rotate velocity based on vehicle rotation
    const rotatedVelocity = this.velocity.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y)
    
    // Apply braking
    if (this.controls.isPressed(" ")) {
      rotatedVelocity.multiplyScalar(this.config.braking)
      this.speed *= this.config.braking
    }
    
    // Apply turning - rotate the vehicle based on A/D keys
    if (Math.abs(this.speed) > 0.01) {
      if (this.controls.isPressed("a")) {
        this.rotation.y += this.config.turnSpeed * delta
      }
      if (this.controls.isPressed("d")) {
        this.rotation.y -= this.config.turnSpeed * delta
      }
    }
    
    // Update position based on velocity
    this.position.add(rotatedVelocity)
  }
  
  updateGroundContact() {
    if (!this.world) return
    
    // Create raycaster from the center of the car's base
    const raycaster = new THREE.Raycaster()
    const rayStart = this.position.clone()
    rayStart.y += 1 // Start slightly above the car to ensure we catch the ground
    raycaster.set(rayStart, new THREE.Vector3(0, -1, 0))
    
    // Get all objects that might be under the vehicle
    const intersects = this.world.physics.raycast(raycaster, this.world.scene.children)
    
    // Find the closest intersection that's not the vehicle itself or its children
    let groundY = 0
    this.isOnRamp = false
    this.groundNormal = new THREE.Vector3(0, 1, 0)
    
    for (let i = 0; i < intersects.length; i++) {
      const obj = intersects[i].object
      // Skip if it's part of the vehicle or its children
      if (this.mesh.children.includes(obj) || obj === this.mesh) continue
      
      // Found ground or ramp
      groundY = intersects[i].point.y
      
      // Get the face normal to determine if we're on a ramp
      if (intersects[i].face) {
        this.groundNormal = intersects[i].face.normal.clone()
        this.groundNormal.transformDirection(intersects[i].object.matrixWorld)
        
        // Check if we're on a ramp by seeing if the normal deviates significantly from vertical
        this.isOnRamp = this.groundNormal.y < 0.99
      }
      
      break
    }
    
    // Set vehicle height based on ground/ramp + small offset
    this.position.y = groundY + 0.1
  }
  
  updateRotation() {
    // This method can be extended in subclasses for specific rotation behavior
  }
  
  applyTilt() {
    // Apply pitch (forward/backward tilt)
    const forwardVector = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y)
    const pitch = Math.acos(this.groundNormal.dot(new THREE.Vector3(0, 1, 0))) - Math.PI / 2
    const pitchAxis = new THREE.Vector3().crossVectors(forwardVector, new THREE.Vector3(0, 1, 0)).normalize()
    
    // Apply roll (side-to-side tilt)
    const rightVector = new THREE.Vector3(1, 0, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y)
    const roll = Math.acos(this.groundNormal.dot(new THREE.Vector3(0, 1, 0))) - Math.PI / 2
    const rollAxis = new THREE.Vector3().crossVectors(rightVector, new THREE.Vector3(0, 1, 0)).normalize()
    
    // Apply the tilts
    this.mesh.rotation.x = pitch * forwardVector.dot(this.groundNormal)
    this.mesh.rotation.z = roll * rightVector.dot(this.groundNormal)
  }
  
  cleanup() {
    this.controls.cleanup()
    // Clean up audio
    if (this.shootSound) {
      this.shootSound.stop()
    }
    if (this.audioListener) {
      this.world?.camera.remove(this.audioListener)
    }
  }
}
