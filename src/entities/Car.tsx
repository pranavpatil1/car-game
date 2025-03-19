import * as THREE from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Vehicle, VehicleConfig } from "./Vehicle"
import { World } from "../engine/World"

export class Car extends Vehicle {
  private gunModel: THREE.Group | null = null
  private healthBar: THREE.Group
  private maxHealth: number = 100
  private currentHealth: number = 100

  constructor(config?: Partial<VehicleConfig>) {
    super({
      maxSpeed: 0.25,
      turnSpeed: 0.03,
      friction: 0.97,
      braking: 0.9,
      acceleration: 0.01,
      ...config
    })

    this.createCarMesh()
    this.loadGunModel()
    this.createHealthBar()
  }

  private loadGunModel() {
    const loader = new GLTFLoader()
    loader.load('./assets/gun.glb', (gltf) => {
      this.gunModel = gltf.scene
      // Scale the gun model down if needed
      // this.gunModel!.scale.set(0.01, 0.01, 0.01)
      
      // Position the gun on top of the car cabin
      this.gunModel!.position.set(0, 1.4, -0.5)
      
      // Rotate the gun to point sideways (90 degrees to the right)
      this.gunModel!.rotation.set(0, - Math.PI / 2, 0)
      // Add the gun to the car mesh
      this.mesh.add(this.gunModel!)
    })
  }

  createCarMesh() {
    // Car body
    const carBodyGeometry = new THREE.BoxGeometry(2, 0.5, 4)
    const carBodyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 })
    const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial)
    carBody.position.y = 0.5
    carBody.castShadow = true
    this.mesh.add(carBody)

    // Car cabin
    const cabinGeometry = new THREE.BoxGeometry(1.5, 0.6, 2)
    const cabinMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial)
    cabin.position.y = 1.1
    cabin.position.z = -0.5
    cabin.castShadow = true
    this.mesh.add(cabin)

    // Wheels
    this.addWheels()

    // Headlights
    this.addHeadlights()
  }

  addWheels() {
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32)
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 })

    // Front left wheel
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial)
    wheelFL.rotation.z = Math.PI / 2
    wheelFL.position.set(-1.1, 0.4, 1.2)
    wheelFL.castShadow = true
    this.mesh.add(wheelFL)

    // Front right wheel
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial)
    wheelFR.rotation.z = Math.PI / 2
    wheelFR.position.set(1.1, 0.4, 1.2)
    wheelFR.castShadow = true
    this.mesh.add(wheelFR)

    // Rear left wheel
    const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial)
    wheelRL.rotation.z = Math.PI / 2
    wheelRL.position.set(-1.1, 0.4, -1.2)
    wheelRL.castShadow = true
    this.mesh.add(wheelRL)

    // Rear right wheel
    const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial)
    wheelRR.rotation.z = Math.PI / 2
    wheelRR.position.set(1.1, 0.4, -1.2)
    wheelRR.castShadow = true
    this.mesh.add(wheelRR)
  }

  addHeadlights() {
    const headlightGeometry = new THREE.SphereGeometry(0.2, 16, 16)
    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 4.0,
    })

    const headlightL = new THREE.Mesh(headlightGeometry, headlightMaterial)
    headlightL.position.set(-0.7, 0.5, 2)
    this.mesh.add(headlightL)

    const headlightR = new THREE.Mesh(headlightGeometry, headlightMaterial)
    headlightR.position.set(0.7, 0.5, 2)
    this.mesh.add(headlightR)

    // Strengthen the actual light sources
    const leftLight = new THREE.SpotLight(0xffffcc, 5)
    leftLight.position.set(-0.7, 0.5, 2)
    leftLight.angle = Math.PI / 5
    leftLight.penumbra = 0.15
    leftLight.distance = 50
    leftLight.decay = 1.5
    leftLight.castShadow = true
    leftLight.shadow.mapSize.width = 1024
    leftLight.shadow.mapSize.height = 1024
    leftLight.target.position.set(-0.7, 0, 15)
    this.mesh.add(leftLight)
    this.mesh.add(leftLight.target)

    const rightLight = new THREE.SpotLight(0xffffcc, 5)
    rightLight.position.set(0.7, 0.5, 2)
    rightLight.angle = Math.PI / 5
    rightLight.penumbra = 0.15
    rightLight.distance = 50
    rightLight.decay = 1.5
    rightLight.castShadow = true
    rightLight.shadow.mapSize.width = 1024
    rightLight.shadow.mapSize.height = 1024
    rightLight.target.position.set(0.7, 0, 15)
    this.mesh.add(rightLight)
    this.mesh.add(rightLight.target)
  }

  addToWorld(world: World) {
    super.addToWorld(world)

    // Set up camera to follow car
    world.camera.position.set(
      this.position.x - Math.sin(this.rotation.y) * 8,
      this.position.y + 5,
      this.position.z - Math.cos(this.rotation.y) * 8
    )
    world.camera.lookAt(this.position)
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
