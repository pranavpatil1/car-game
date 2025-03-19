import * as THREE from "three"
import { World } from "./World"
import { PhysicsObject } from "./Physics"

export abstract class Entity implements PhysicsObject {
  mesh: THREE.Group
  position: THREE.Vector3
  rotation: THREE.Euler
  velocity: THREE.Vector3
  world: World | null = null

  constructor() {
    this.mesh = new THREE.Group()
    this.position = new THREE.Vector3()
    this.rotation = new THREE.Euler()
    this.velocity = new THREE.Vector3()
  }

  addToWorld(world: World) {
    this.world = world
    world.scene.add(this.mesh)

    // Enable shadows for all meshes in the entity
    this.mesh.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })

    world.physics.addObject(this)
  }

  removeFromWorld() {
    if (this.world) {
      this.world.scene.remove(this.mesh)
      this.world.physics.removeObject(this)
      this.world = null
    }
  }

  update(delta: number = 1) {
    // Update position based on velocity
    this.position.add(this.velocity.clone().multiplyScalar(delta))

    // Update mesh position and rotation
    this.mesh.position.copy(this.position)
    this.mesh.rotation.copy(this.rotation)
  }

  applyForce(force: THREE.Vector3) {
    this.velocity.add(force)
  }

  getWorldMatrix() {
    return this.mesh.matrixWorld
  }

  getRaycaster() {
    const raycaster = new THREE.Raycaster()
    raycaster.set(
      new THREE.Vector3(this.position.x, this.position.y + 10, this.position.z),
      new THREE.Vector3(0, -1, 0)
    )
    return raycaster
  }
}
