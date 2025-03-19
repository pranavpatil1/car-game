import * as THREE from "three"

export class Renderer {
  renderer: THREE.WebGLRenderer
  domElement: HTMLCanvasElement
  
  constructor(container: HTMLDivElement, width: number, height: number) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(width, height)
    this.renderer.shadowMap.enabled = true
    container.appendChild(this.renderer.domElement)
    
    this.domElement = this.renderer.domElement
  }
  
  setSize(width: number, height: number) {
    this.renderer.setSize(width, height)
  }
  
  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.renderer.render(scene, camera)
  }
}
