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

  constructor(config: VehicleConfig) {
    super()

    this.config = {
      maxSpeed: 0.25,
      turnSpeed: 0.03,
      friction: 0.97,
      braking: 0.9,
      acceleration: 0.01,
      ...config
    }

    this.controls = new Controls()
  }

  update(delta: number = 1) {
    this.updateMovement(delta)
    this.updateGroundContact()
    this.updateRotation()

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

  updateMovement(delta: number) {
    // Store previous position for collision detection
    const previousPosition = this.position.clone()

    // Reset velocity
    this.velocity.set(0, 0, 0)

    // Apply movement based on keys pressed
    if (this.controls.isPressed("s")) {
      this.velocity.z = -this.config.maxSpeed * delta
    } else if (this.controls.isPressed("w")) {
      this.velocity.z = this.config.maxSpeed * delta
    }

    // Rotate velocity based on vehicle rotation
    const rotatedVelocity = this.velocity.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), this.rotation.y)

    // Apply friction
    rotatedVelocity.multiplyScalar(this.config.friction)

    // Apply braking
    if (this.controls.isPressed(" ")) {
      rotatedVelocity.multiplyScalar(this.config.braking)
    }

    // Calculate speed (magnitude of velocity)
    this.speed = rotatedVelocity.length()

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

    // Check for collisions with buildings
    if (this.world && this.checkBuildingCollision()) {
      // If collision detected, revert to previous position
      this.position.copy(previousPosition)
    }
  }

  updateGroundContact() {
    if (!this.world) return

    // Raycasting to detect ground height
    const raycaster = this.getRaycaster()

    // Get all objects that might be under the vehicle
    const intersects = this.world.physics.raycast(raycaster, this.world.scene.children)

    // Find the closest intersection that's not the vehicle itself
    let groundY = 0
    this.isOnRamp = false
    this.groundNormal = new THREE.Vector3(0, 1, 0)

    for (let i = 0; i < intersects.length; i++) {
      const obj = intersects[i].object
      // Skip if it's part of the vehicle
      if (this.mesh.children.includes(obj)) continue

      // Found ground or ramp
      groundY = intersects[i].point.y

      // Get the face normal to determine if we're on a ramp
      if (intersects[i].face) {
        this.groundNormal = intersects[i].face.normal.clone()
        this.groundNormal.transformDirection(intersects[i].object.matrixWorld)

        // Check if we're on a ramp by seeing if the normal deviates significantly from vertical
        // A flat surface will have a normal of (0,1,0)
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
  }

  checkBuildingCollision() {
    if (!this.world) return false

    // Create a bounding box for the vehicle
    const vehicleBoundingBox = new THREE.Box3().setFromObject(this.mesh)

    // Get all buildings in the scene
    const buildings = this.world.scene.children.filter(child => {
      // Check if the object is a building (part of a City entity)
      return child.userData && child.userData.type === 'building'
    })

    // Check for collisions with each building
    for (const building of buildings) {
      const buildingBoundingBox = new THREE.Box3().setFromObject(building)

      if (vehicleBoundingBox.intersectsBox(buildingBoundingBox)) {
        return true // Collision detected
      }
    }

    return false // No collision
  }
}
