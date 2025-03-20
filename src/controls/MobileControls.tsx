import { Controls } from "../engine/Controls"
import { Car } from "../entities/Car"

interface MobileControlsProps {
  onDismissInstructions: () => void
}

export class MobileControls {
  private car: Car
  private controls: Controls
  private containerRef: React.RefObject<HTMLDivElement>
  private onDismissInstructions: () => void

  constructor(car: Car, containerRef: React.RefObject<HTMLDivElement>, props: MobileControlsProps) {
    this.car = car
    this.controls = car.controls
    this.containerRef = containerRef
    this.onDismissInstructions = props.onDismissInstructions

    this.initialize()
  }

  private initialize() {
    if (!this.containerRef.current) return

    this.containerRef.current.addEventListener('touchstart', this.handleTouchStart)
    this.containerRef.current.addEventListener('touchend', this.handleTouchEnd)
  }

  private handleTouchStart = (e: TouchEvent) => {
    this.onDismissInstructions()
    const touch = e.touches[0]
    const screenWidth = window.innerWidth
    
    // Prevent default to stop scrolling/zooming
    e.preventDefault()
    
    if (!this.controls) return
    
    // Automatically move forward on mobile
    this.controls.keys['w'] = true
    
    // Determine touch position
    if (touch.clientX < screenWidth / 3) {
      // Left third of screen - turn left
      this.controls.keys['a'] = true
    } else if (touch.clientX > (screenWidth * 2) / 3) {
      // Right third of screen - turn right
      this.controls.keys['d'] = true
    }
  }

  private handleTouchEnd = (e: TouchEvent) => {
    if (!this.controls) return
    
    // Reset all controls
    this.controls.keys['w'] = false
    this.controls.keys['a'] = false
    this.controls.keys['d'] = false
  }

  public handleShootTouch = (e: TouchEvent) => {
    e.preventDefault()
    if (!this.controls) return
    this.controls.keys[' '] = true
    setTimeout(() => {
      if (this.controls) {
        this.controls.keys[' '] = false
      }
    }, 100)
  }

  public cleanup() {
    if (this.containerRef.current) {
      this.containerRef.current.removeEventListener('touchstart', this.handleTouchStart)
      this.containerRef.current.removeEventListener('touchend', this.handleTouchEnd)
    }
  }
}

export const isMobileDevice = () => {
  return 'ontouchstart' in window
}

export const MobileShootButton = ({ onShoot }: { onShoot: (e: TouchEvent) => void }) => {
  return (
    <button 
      className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-red-500 rounded-full w-16 h-16 flex items-center justify-center text-white text-2xl shadow-lg active:bg-red-600"
      onTouchStart={onShoot}
    >
      Fire
    </button>
  )
}

export const MobileInstructions = () => {
  return (
    <>
      <p>Touch left side to turn left</p>
      <p>Touch right side to turn right</p>
      <p>Car moves forward automatically</p>
    </>
  )
}