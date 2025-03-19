import * as THREE from "three"

export class DayNightCycle {
  private time: number = 0 // 0 to 1 representing full cycle
  private cycleDuration: number = 10 // seconds for a full cycle
  private lastUpdate: number = 0
  private scene: THREE.Scene | null = null

  // Sky colors
  private dayColor = new THREE.Color(0x87ceeb) // Sky blue
  private nightColor = new THREE.Color(0x0a1a2a) // Dark blue

  constructor(cycleDuration: number = 10) {
    this.cycleDuration = cycleDuration
    this.lastUpdate = performance.now()
  }

  initialize(scene: THREE.Scene) {
    this.scene = scene
    this.updateSkyColor()
  }

  update() {
    const now = performance.now()
    const deltaTime = (now - this.lastUpdate) / 1000 // Convert to seconds
    this.lastUpdate = now

    // Update time (0 to 1)
    this.time = (this.time + deltaTime / this.cycleDuration) % 1

    this.updateSkyColor()
  }

  updateSkyColor() {
    if (!this.scene) return

    // Interpolate between day and night colors
    const color = new THREE.Color()

    // Use a sine wave to make transitions smoother
    const t = (Math.sin(this.time * Math.PI * 2 - Math.PI / 2) + 1) / 2
    color.lerpColors(this.nightColor, this.dayColor, t)

    this.scene.background = color
  }

  // Getters and setters
  getTime(): number {
    return this.time
  }

  setTime(time: number) {
    this.time = Math.max(0, Math.min(1, time))
    this.updateSkyColor()
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