import * as THREE from "three"
import { Vehicle, VehicleConfig } from "./Vehicle"
import { World } from "../engine/World"
import { CarMesh, CarMeshConfig } from "./CarMesh"

export interface CarConfig extends Partial<VehicleConfig> {
  meshConfig?: CarMeshConfig;
}

export class Car extends Vehicle {
  private healthBar: THREE.Group
  private maxHealth: number = 100
  private currentHealth: number = 100

  constructor(config?: CarConfig) {
    super({
      maxSpeed: 0.25,
      turnSpeed: 0.03,
      friction: 0.97,
      braking: 0.9,
      acceleration: 0.01,
      ...config
    })

    // Create car mesh
    const carMesh = new CarMesh(config?.meshConfig)
    this.mesh.add(carMesh)
    
    this.createHealthBar()
  }

  private createHealthBar() {
    this.healthBar = new THREE.Group()

    // Background bar (black)
    const bgGeometry = new THREE.PlaneGeometry(2, 0.2)
    const bgMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x000000,
      side: THREE.DoubleSide,
      depthTest: false,
      transparent: true,
      opacity: 0.8,
      renderOrder: 999 // High render order to ensure it renders last
    })
    const background = new THREE.Mesh(bgGeometry, bgMaterial)
    
    // Health bar (green)
    const barGeometry = new THREE.PlaneGeometry(2, 0.2)
    const barMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      side: THREE.DoubleSide,
      depthTest: false,
      transparent: true,
      renderOrder: 1000 // Even higher render order
    })
    const healthBarMesh = new THREE.Mesh(barGeometry, barMaterial)
    // Position slightly in front of background to prevent z-fighting
    healthBarMesh.position.z = 0.01

    this.healthBar.add(background)
    this.healthBar.add(healthBarMesh)

    // Position the health bar above the car and slightly forward
    this.healthBar.position.y = 3
    this.mesh.add(this.healthBar)

    // Set render order for the entire group
    this.healthBar.renderOrder = 1000
  }

  // Method to update health
  setHealth(health: number) {
    this.currentHealth = Math.max(0, Math.min(health, this.maxHealth))
    // Update health bar scale
    const healthPercent = this.currentHealth / this.maxHealth
    const healthBarMesh = this.healthBar.children[1] as THREE.Mesh
    healthBarMesh.scale.x = healthPercent
    healthBarMesh.position.x = -1 * (1 - healthPercent)
  }

  update(delta: number = 1) {
    super.update(delta)

    if (this.world) {
      const offsetDistance = 15;
      const heightOffset = 20;

      const cameraOffset = new THREE.Vector3(
        offsetDistance,
        heightOffset,
        offsetDistance
      );

      const targetPosition = this.position.clone();
      this.world.camera.position.copy(targetPosition).add(cameraOffset);
      this.world.camera.lookAt(targetPosition);
      this.world.camera.updateProjectionMatrix();
    }
  }
}
