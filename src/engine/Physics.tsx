import * as THREE from "three"

export interface PhysicsObject {
  position: THREE.Vector3
  rotation: THREE.Euler | number
  velocity: THREE.Vector3
  update: (delta: number) => void
  applyForce: (force: THREE.Vector3) => void
  getWorldMatrix: () => THREE.Matrix4
  getRaycaster: () => THREE.Raycaster
}

export class Physics {
  objects: PhysicsObject[] = []
  gravity: THREE.Vector3 = new THREE.Vector3(0, -0.01, 0)
  lastTime: number = 0
  
  constructor() {
    this.lastTime = performance.now()
  }
  
  addObject(object: PhysicsObject) {
    this.objects.push(object)
  }
  
  removeObject(object: PhysicsObject) {
    const index = this.objects.indexOf(object)
    if (index !== -1) {
      this.objects.splice(index, 1)
    }
  }
  
  update() {
    const currentTime = performance.now()
    const deltaTime = (currentTime - this.lastTime) / 16.67 // Normalize to ~60fps
    this.lastTime = currentTime
    
    // Update all physics objects
    this.objects.forEach(object => {
      // Apply gravity
      object.applyForce(this.gravity.clone())
      
      // Update object physics
      object.update(deltaTime)
    })
  }
  
  raycast(raycaster: THREE.Raycaster, objects: THREE.Object3D[]) {
    return raycaster.intersectObjects(objects, true)
  }
}
