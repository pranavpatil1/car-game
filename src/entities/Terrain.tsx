import * as THREE from "three"
import { Entity } from "../engine/Entity"
import { World } from "../engine/World"

export class Terrain extends Entity {
  constructor() {
    super()

    // Create larger ground to prevent seeing edges
    const groundGeometry = new THREE.PlaneGeometry(300, 300)
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a5e1a, // Keep the green color (0x1a5e1a is a dark green)
      side: THREE.DoubleSide,
      roughness: 0.8,
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    ground.scale.set(3, 3, 3)
    this.mesh.add(ground)
  }

  addToWorld(world: World) {
    super.addToWorld(world)
    this.addRamps(world)
    this.addTrees(world)
    this.addMountains(world)
  }

  addRamps(world: World) {
    // Add ramps to the scene
    const ramp1 = this.createRamp(15, 15, Math.PI / 4)
    world.scene.add(ramp1)

    const ramp2 = this.createRamp(-15, -15, -Math.PI / 3)
    world.scene.add(ramp2)
  }

  createRamp(x: number, z: number, rotation: number) {
    const rampGroup = new THREE.Group()

    // Create the ramp
    const rampGeometry = new THREE.BoxGeometry(6, 0.5, 10)
    const rampMaterial = new THREE.MeshStandardMaterial({ color: 0xe67e22 }) // Orange color
    const ramp = new THREE.Mesh(rampGeometry, rampMaterial)

    // Position and rotate the ramp
    ramp.position.y = 0.25
    ramp.rotation.x = Math.PI / 12 // Angle the ramp upward
    ramp.castShadow = true
    ramp.receiveShadow = true

    // Add base to the ramp
    const baseGeometry = new THREE.BoxGeometry(6, 2.5, 2)
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xe67e22 })
    const base = new THREE.Mesh(baseGeometry, baseMaterial)
    base.position.z = 4
    base.position.y = 0.25
    base.castShadow = true
    base.receiveShadow = true

    rampGroup.add(ramp)
    rampGroup.add(base)

    // Position and rotate the entire ramp group
    rampGroup.position.set(x, 0, z)
    rampGroup.rotation.y = rotation

    return rampGroup
  }

  addTrees(world: World) {
    // Add trees to the scene (avoiding the driving path)
    const treePositions = [
      { x: 10, z: 30 },
      { x: -15, z: 25 },
      { x: 25, z: -10 },
      { x: -25, z: -20 },
      { x: 30, z: 10 },
      { x: -30, z: 5 },
      { x: 20, z: 20 },
      { x: -20, z: 30 },
      { x: 35, z: -30 },
      { x: -35, z: -25 },
      { x: 15, z: -35 },
      { x: -10, z: -30 },
    ]

    treePositions.forEach((pos) => {
      const tree = this.createTree(pos.x, pos.z)
      world.scene.add(tree)
    })
  }

  createTree(x: number, z: number) {
    const treeGroup = new THREE.Group()

    // Tree trunk
    const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 2, 8)
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial)
    trunk.position.y = 1
    trunk.castShadow = true
    treeGroup.add(trunk)

    // Tree foliage (multiple layers for fuller look)
    const foliageGeometry1 = new THREE.ConeGeometry(2, 3, 8)
    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x2ecc71 })
    const foliage1 = new THREE.Mesh(foliageGeometry1, foliageMaterial)
    foliage1.position.y = 3
    foliage1.castShadow = true
    treeGroup.add(foliage1)

    const foliageGeometry2 = new THREE.ConeGeometry(1.5, 2, 8)
    const foliage2 = new THREE.Mesh(foliageGeometry2, foliageMaterial)
    foliage2.position.y = 4.5
    foliage2.castShadow = true
    treeGroup.add(foliage2)

    // Position the tree
    treeGroup.position.set(x, 0, z)

    return treeGroup
  }

  addMountains(world: World) {
    // Create mountain backdrop
    const mountain = this.createMountain()
    world.scene.add(mountain)

    // Create smaller mountains for variety
    const mountain2 = this.createMountain()
    mountain2.scale.set(0.7, 0.8, 0.7)
    mountain2.position.set(-40, 0, -70)
    world.scene.add(mountain2)

    const mountain3 = this.createMountain()
    mountain3.scale.set(0.6, 0.5, 0.6)
    mountain3.position.set(50, 0, -60)
    world.scene.add(mountain3)
  }

  createMountain() {
    const mountainGeometry = new THREE.ConeGeometry(50, 40, 5)
    const mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x6a6a6a,
      roughness: 0.9,
      flatShading: true,
    })

    const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial)
    mountain.position.set(0, 0, -80)
    mountain.castShadow = true

    return mountain
  }

  // Override physics methods since terrain doesn't move
  update() {
    // Terrain doesn't move or update
  }

  applyForce() {
    // Terrain doesn't respond to forces
  }
}
