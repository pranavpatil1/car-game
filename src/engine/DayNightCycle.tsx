import * as THREE from "three"

export class DayNightCycle {
  private time: number = 0 // 0 to 1 representing full cycle
  private cycleDuration: number = 10 // seconds for a full cycle
  private lastUpdate: number = 0
  private scene: THREE.Scene | null = null

  // Sky colors
  private dayColor = new THREE.Color(0x87ceeb) // Sky blue
  private nightColor = new THREE.Color(0x0a1a2a) // Dark blue

  // Lighting
  private sunLight: THREE.DirectionalLight | null = null
  private ambientLight: THREE.AmbientLight | null = null

  constructor(cycleDuration: number = 10) {
    this.cycleDuration = cycleDuration
    this.lastUpdate = performance.now()
  }

  initialize(scene: THREE.Scene) {
    this.scene = scene

    // Create sun/moon directional light
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1)
    this.sunLight.castShadow = true

    // Improve shadow camera settings
    this.sunLight.shadow.mapSize.width = 2048
    this.sunLight.shadow.mapSize.height = 2048
    this.sunLight.shadow.camera.near = 0.5
    this.sunLight.shadow.camera.far = 500
    this.sunLight.shadow.camera.left = -100
    this.sunLight.shadow.camera.right = 100
    this.sunLight.shadow.camera.top = 100
    this.sunLight.shadow.camera.bottom = -100
    this.sunLight.shadow.bias = -0.0005
    this.sunLight.shadow.normalBias = 0.02

    this.scene.add(this.sunLight)

    // Create ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3)
    this.scene.add(this.ambientLight)

    this.updateSkyColor()
    this.updateLighting()
  }

  update() {
    const now = performance.now()
    const deltaTime = (now - this.lastUpdate) / 1000 // Convert to seconds
    this.lastUpdate = now

    // Update time (0 to 1)
    this.time = (this.time + deltaTime / this.cycleDuration) % 1

    this.updateSkyColor()
    this.updateLighting()
  }

  updateSkyColor() {
    if (!this.scene) return

    // Use the same time calculation for both sky and lighting
    // This ensures they stay in sync
    const t = (Math.sin(this.time * Math.PI * 2 - Math.PI / 2) + 1) / 2

    const color = new THREE.Color()
    color.lerpColors(this.nightColor, this.dayColor, t)

    this.scene.background = color
  }

  updateLighting() {
    if (!this.sunLight || !this.ambientLight) return

    // Calculate sun position based on time
    const sunAngle = this.time * Math.PI * 2 - Math.PI / 2
    const radius = 50

    // Position the sun/moon
    this.sunLight.position.x = Math.cos(sunAngle) * radius
    this.sunLight.position.y = Math.sin(sunAngle) * radius
    this.sunLight.position.z = 0

    // Use the same time calculation as sky color for consistency
    const t = (Math.sin(this.time * Math.PI * 2 - Math.PI / 2) + 1) / 2
    const dayIntensity = t

    this.sunLight.intensity = dayIntensity * 1.2

    // Change light color (warmer at sunrise/sunset)
    const isTransition = (this.time < 0.25 && this.time > 0.1) || (this.time > 0.75 && this.time < 0.9)
    if (isTransition) {
      // Golden hour - warmer light
      this.sunLight.color.setHex(0xffcc88)
    } else {
      // Normal daylight
      this.sunLight.color.setHex(0xffffff)
    }

    // Adjust ambient light for night
    this.ambientLight.intensity = 0.1 + dayIntensity * 0.3

    // Night has bluer ambient light
    if (dayIntensity < 0.3) {
      this.ambientLight.color.setHex(0x8888ff)
    } else {
      this.ambientLight.color.setHex(0xffffff)
    }
  }

  // Getters and setters
  getTime(): number {
    return this.time
  }

  setTime(time: number) {
    this.time = Math.max(0, Math.min(1, time))
    this.updateSkyColor()
    this.updateLighting()
  }

  getCycleDuration(): number {
    return this.cycleDuration
  }

  setCycleDuration(duration: number) {
    this.cycleDuration = duration
  }

  // Helper methods to get time of day information
  isDaytime(): boolean {
    return this.time > 0.25 && this.time < 0.75
  }

  getTimeOfDayName(): string {
    if (this.time < 0.25) return "Night"
    if (this.time < 0.5) return "Morning"
    if (this.time < 0.75) return "Day"
    return "Evening"
  }
}
