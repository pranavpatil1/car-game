import * as THREE from "three"
import { Entity } from "../engine/Entity"
import { World } from "../engine/World"

// Building configuration interface
interface BuildingConfig {
  width: number
  depth: number
  height: number
  position: THREE.Vector3
  color?: number
  windows?: boolean
}

// Road configuration interface
interface RoadConfig {
  width: number
  length: number
  position: THREE.Vector3
  rotation?: number
  lanes?: number
  markings?: boolean
}

// City block configuration
interface CityBlockConfig {
  position: THREE.Vector3
  size: number
  buildingDensity?: number
  maxHeight?: number
  minHeight?: number
}

export class City extends Entity {
  private buildings: THREE.Group[] = []
  private roads: THREE.Group[] = []

  constructor() {
    super()
  }

  addToWorld(world: World) {
    super.addToWorld(world)
    this.generateCity()
  }

  generateCity() {
    // Create a grid of city blocks
    for (let x = -2; x <= 2; x++) {
      for (let z = -2; z <= 2; z++) {
        this.createCityBlock({
          position: new THREE.Vector3(x * 60, 0, z * 60),
          size: 50,
          buildingDensity: 0.7,
          maxHeight: 6, // Reduced from 30 to 15
          minHeight: 3   // Reduced from 5 to 3
        })
      }
    }

    // Create main roads between blocks
    for (let x = -2; x <= 2; x++) {
      this.addRoad({
        width: 10,
        length: 300,
        position: new THREE.Vector3(x * 60, 0.1, 0),
        rotation: 0,
        lanes: 2,
        markings: true
      })
    }

    for (let z = -2; z <= 2; z++) {
      this.addRoad({
        width: 10,
        length: 300,
        position: new THREE.Vector3(0, 0.1, z * 60),
        rotation: Math.PI / 2,
        lanes: 2,
        markings: true
      })
    }
  }

  createCityBlock(config: CityBlockConfig) {
    const { position, size, buildingDensity = 0.7, maxHeight = 30, minHeight = 5 } = config

    // Create smaller roads within the block
    this.addRoad({
      width: 6,
      length: size,
      position: new THREE.Vector3(position.x, 0.1, position.z),
      rotation: 0,
      lanes: 1
    })

    this.addRoad({
      width: 6,
      length: size,
      position: new THREE.Vector3(position.x, 0.1, position.z),
      rotation: Math.PI / 2,
      lanes: 1
    })

    // Add buildings in a grid pattern
    const gridSize = 4
    const buildingAreaSize = size / gridSize

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        // Skip some buildings based on density
        if (Math.random() > buildingDensity) continue

        const offsetX = (i - gridSize / 2 + 0.5) * buildingAreaSize
        const offsetZ = (j - gridSize / 2 + 0.5) * buildingAreaSize

        // Randomize building properties
        const width = 3 + Math.random() * 5
        const depth = 3 + Math.random() * 5
        const height = minHeight + Math.random() * (maxHeight - minHeight)

        // Ensure buildings don't overlap with roads
        if (Math.abs(offsetX) < 5 || Math.abs(offsetZ) < 5) continue

        this.addBuilding({
          width,
          depth,
          height,
          position: new THREE.Vector3(
            position.x + offsetX,
            0,
            position.z + offsetZ
          ),
          color: Math.random() > 0.5 ? 0x888888 : 0xaaaaaa,
          windows: true
        })
      }
    }
  }

  addBuilding(config: BuildingConfig) {
    const { width, depth, height, position, color = 0x888888, windows = true } = config

    const building = new THREE.Group()

    // Set user data to identify this as a building for collision detection
    building.userData = { type: 'building' }

    // Building base
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = height / 2
    mesh.castShadow = true
    mesh.receiveShadow = true
    building.add(mesh)

    // Add windows if enabled
    if (windows) {
      this.addWindowsToBuilding(building, width, height, depth)
    }

    building.position.copy(position)
    this.buildings.push(building)
    this.mesh.add(building)

    return building
  }

  addWindowsToBuilding(building: THREE.Group, width: number, height: number, depth: number) {
    // Window material with emission for night glow
    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffcc,
      emissive: 0xffffcc,
      emissiveIntensity: 0.4,
      transparent: true,
      opacity: 0.9
    })

    // Calculate number of windows based on building size
    const floorsCount = Math.floor(height / 2)
    const widthCount = Math.floor(width / 1.5)
    const depthCount = Math.floor(depth / 1.5)

    // Window size
    const windowWidth = 0.5
    const windowHeight = 0.8
    const windowDepth = 0.1

    // Add windows to each side of the building
    for (let floor = 0; floor < floorsCount; floor++) {
      const floorHeight = (floor + 0.5) * (height / floorsCount)

      // Front and back windows
      for (let w = 0; w < widthCount; w++) {
        const windowX = (w - (widthCount - 1) / 2) * (width / widthCount)

        // Only add some windows (random pattern)
        if (Math.random() > 0.3) {
          // Front windows
          const frontWindow = new THREE.Mesh(
            new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
            windowMaterial
          )
          frontWindow.position.set(windowX, floorHeight, depth / 2 + 0.01)
          building.add(frontWindow)

          // Back windows
          const backWindow = new THREE.Mesh(
            new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth),
            windowMaterial
          )
          backWindow.position.set(windowX, floorHeight, -depth / 2 - 0.01)
          building.add(backWindow)
        }
      }

      // Side windows
      for (let d = 0; d < depthCount; d++) {
        const windowZ = (d - (depthCount - 1) / 2) * (depth / depthCount)

        // Only add some windows (random pattern)
        if (Math.random() > 0.3) {
          // Left windows
          const leftWindow = new THREE.Mesh(
            new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth),
            windowMaterial
          )
          leftWindow.position.set(-width / 2 - 0.01, floorHeight, windowZ)
          building.add(leftWindow)

          // Right windows
          const rightWindow = new THREE.Mesh(
            new THREE.BoxGeometry(windowDepth, windowHeight, windowWidth),
            windowMaterial
          )
          rightWindow.position.set(width / 2 + 0.01, floorHeight, windowZ)
          building.add(rightWindow)
        }
      }
    }
  }

  addRoad(config: RoadConfig) {
    const { width, length, position, rotation = 0, lanes = 2, markings = false } = config

    const road = new THREE.Group()

    // Road surface
    const roadGeometry = new THREE.PlaneGeometry(width, length)
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.9,
      side: THREE.DoubleSide
    })

    const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial)
    roadMesh.rotation.x = -Math.PI / 2
    roadMesh.receiveShadow = true
    road.add(roadMesh)

    // Add lane markings if enabled
    if (markings && lanes > 0) {
      const laneWidth = width / lanes

      // Center line for multi-lane roads
      if (lanes > 1) {
        const centerLineGeometry = new THREE.PlaneGeometry(0.2, length - 1)
        const centerLineMaterial = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.7,
          side: THREE.DoubleSide
        })

        const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial)
        centerLine.rotation.x = -Math.PI / 2
        centerLine.position.y = 0.01
        road.add(centerLine)
      }

      // Dashed lines for lane markings
      for (let i = 1; i < lanes; i++) {
        const offset = (i * laneWidth) - (width / 2)

        // Create dashed line segments
        for (let j = 0; j < 10; j++) {
          const dashLength = 2
          const gapLength = 2
          const segmentLength = dashLength + gapLength
          const totalSegments = Math.floor(length / segmentLength)

          const startPos = -length / 2 + j * segmentLength

          const dashGeometry = new THREE.PlaneGeometry(0.2, dashLength)
          const dashMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            roughness: 0.7,
            side: THREE.DoubleSide
          })

          const dash = new THREE.Mesh(dashGeometry, dashMaterial)
          dash.rotation.x = -Math.PI / 2
          dash.position.set(offset, 0.01, startPos + dashLength / 2)
          road.add(dash)
        }
      }
    }

    road.position.copy(position)
    road.rotation.y = rotation

    this.roads.push(road)
    this.mesh.add(road)

    return road
  }

  // Override physics methods since city doesn't move
  update() {
    // City doesn't move or update
  }

  applyForce() {
    // City doesn't respond to forces
  }
}
