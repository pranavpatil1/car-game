import * as THREE from "three"

export interface PhysicsObject {
  position: THREE.Vector3
  rotation: THREE.Euler | number
  velocity: THREE.Vector3
  update: (delta: number) => void
  applyForce: (force: THREE.Vector3) => void
  getWorldMatrix: () => THREE.Matrix4
  getRaycaster: () => THREE.Raycaster
  getBoundingBox?: () => THREE.Box3
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
      // Store original position
      const originalPosition = object.position.clone()
      
      // Apply gravity
      object.applyForce(this.gravity.clone())
      
      // Update object physics
      object.update(deltaTime)
      
      // Check for collisions
      if (object.getBoundingBox) {
        const objectBox = object.getBoundingBox()
        let collision = false
        
        // Check collision with other objects
        this.objects.forEach(other => {
          if (other !== object && other.getBoundingBox) {
            const otherBox = other.getBoundingBox()
            if (objectBox.intersectsBox(otherBox)) {
              collision = true
            }
          }
        })
        
        // If collision detected, revert to original position
        if (collision) {
          object.position.copy(originalPosition)
          object.velocity.set(0, 0, 0)
        }
      }
    })
  }
  
  raycast(raycaster: THREE.Raycaster, objects: THREE.Object3D[]) {
    return raycaster.intersectObjects(objects, true)
  }
}
