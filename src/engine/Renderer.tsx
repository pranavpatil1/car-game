import * as THREE from "three"

export class Renderer {
  domElement: HTMLCanvasElement
  webGLRenderer: THREE.WebGLRenderer

  constructor(container: HTMLDivElement, width: number, height: number) {
    this.webGLRenderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    })
    this.webGLRenderer.setSize(width, height)
    this.webGLRenderer.setPixelRatio(window.devicePixelRatio)
    this.webGLRenderer.shadowMap.enabled = true
    this.webGLRenderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.domElement = this.webGLRenderer.domElement
    container.appendChild(this.domElement)
  }

  render(scene: THREE.Scene, camera: THREE.Camera) {
    this.webGLRenderer.render(scene, camera)
  }

  setSize(width: number, height: number) {
    this.webGLRenderer.setSize(width, height)
  }
}
