import * as THREE from "three"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

export interface CarMeshConfig {
  bodyColor?: number;
  cabinColor?: number;
  wheelColor?: number;
  modelPath?: string;
}

export class CarMesh extends THREE.Group {
  private model: THREE.Group | null = null
  private gunModel: THREE.Group | null = null
  private config: CarMeshConfig

  constructor(config: CarMeshConfig) {
    super()
    this.config = config
    
    const {
      bodyColor = 0xff0000,
      cabinColor = 0x333333,
      wheelColor = 0x333333
    } = config

    this.createBody(bodyColor)
    this.createCabin(cabinColor)
    this.addWheels(wheelColor)
    this.addHeadlights()
    this.loadCarModel()
    this.loadGunModel()
  }

  private createBody(color: number) {
    const carBodyGeometry = new THREE.BoxGeometry(2, 0.5, 4)
    const carBodyMaterial = new THREE.MeshStandardMaterial({ color })
    const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial)
    carBody.position.y = 0.5
    carBody.castShadow = true
    this.add(carBody)
  }

  private createCabin(color: number) {
    const cabinGeometry = new THREE.BoxGeometry(1.5, 0.6, 2)
    const cabinMaterial = new THREE.MeshStandardMaterial({ color })
    const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial)
    cabin.position.y = 1.1
    cabin.position.z = -0.5
    cabin.castShadow = true
    this.add(cabin)
  }

  private addWheels(color: number) {
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 32)
    const wheelMaterial = new THREE.MeshStandardMaterial({ color })

    const wheelPositions = [
      { x: -1.1, z: 1.2 },  // Front left
      { x: 1.1, z: 1.2 },   // Front right
      { x: -1.1, z: -1.2 }, // Rear left
      { x: 1.1, z: -1.2 }   // Rear right
    ]

    wheelPositions.forEach(pos => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheel.rotation.z = Math.PI / 2
      wheel.position.set(pos.x, 0.4, pos.z)
      wheel.castShadow = true
      this.add(wheel)
    })
  }

  private addHeadlights() {
    const headlightGeometry = new THREE.SphereGeometry(0.2, 16, 16)
    const headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 4.0,
    })

    const positions = [
      { x: -0.7, z: 2 },
      { x: 0.7, z: 2 }
    ]

    positions.forEach(pos => {
      const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial)
      headlight.position.set(pos.x, 0.5, pos.z)
      this.add(headlight)

      const light = new THREE.SpotLight(0xffffcc, 5)
      light.position.set(pos.x, 0.5, pos.z)
      light.angle = Math.PI / 5
      light.penumbra = 0.15
      light.distance = 50
      light.decay = 1.5
      light.castShadow = true
      light.shadow.mapSize.width = 1024
      light.shadow.mapSize.height = 1024
      light.target.position.set(pos.x, 0, 15)
      this.add(light)
      this.add(light.target)
    })
  }

  private loadCarModel() {
    const { modelPath } = this.config || {}

    if (!modelPath) {
      return
    }
const loader = new GLTFLoader()
  loader.load(
    modelPath,
    (gltf) => {
      // Remove the default car mesh components
      while (this.children.length > 0) {
        this.remove(this.children[0])
      }

      this.model = gltf.scene
      
      // Adjust the model's position and scale if needed
      this.model.position.set(0, 0, 0)
      this.model.scale.set(0.01, 0.01, 0.01) // Adjust scale based on your model size
      
      // Enable shadows for all meshes in the model
      this.model.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          node.castShadow = true
          node.receiveShadow = true
        }
      })

      this.add(this.model)
      
      // Re-add headlights since we removed them
      this.addHeadlights()
      
      // Re-add gun model if it was loaded
      if (this.gunModel) {
        this.add(this.gunModel)
      }
    },
    undefined,
    (error) => {
      console.error('Error loading car model:', error)
      // Keep the default mesh if model loading fails
    }
  )
}

  private loadGunModel() {
    const loader = new GLTFLoader()
    loader.load('./assets/gun.glb', (gltf) => {
      this.gunModel = gltf.scene
      this.gunModel.position.set(0, 1.4, -0.5)
      this.gunModel.rotation.set(0, -Math.PI / 2, 0)
      this.add(this.gunModel)
    })
  }
}
