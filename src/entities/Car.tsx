import * as THREE from "three"
import { Vehicle, VehicleConfig } from "./Vehicle"
import { World } from "../engine/World"

export class Car extends Vehicle {
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
      emissiveIntensity: 0.5,
    })
    
    const headlightL = new THREE.Mesh(headlightGeometry, headlightMaterial)
    headlightL.position.set(-0.7, 0.5, 2)
    this.mesh.add(headlightL)
    
    const headlightR = new THREE.Mesh(headlightGeometry, headlightMaterial)
    headlightR.position.set(0.7, 0.5, 2)
    this.mesh.add(headlightR)
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
  
  update(delta: number = 1) {
    super.update(delta)
    
    // Update camera to follow car
    if (this.world) {
      const cameraOffset = new THREE.Vector3(
        -Math.sin(this.rotation.y) * 8,
        5 + this.position.y,
        -Math.cos(this.rotation.y) * 8
      )
      this.world.camera.position.copy(this.position).add(cameraOffset)
      this.world.camera.lookAt(this.mesh.position)
    }
  }
}
