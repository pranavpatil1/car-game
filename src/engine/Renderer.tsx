import * as THREE from "three"

export class Renderer {
  renderer: THREE.WebGLRenderer
  domElement: HTMLCanvasElement

  constructor(container: HTMLDivElement, width: number, height: number) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setSize(width, height)

    // Improved shadow settings
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.shadowMap.autoUpdate = true
    this.renderer.shadowMap.needsUpdate = true

    // Set pixel ratio for better quality
    this.renderer.setPixelRatio(window.devicePixelRatio)

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
