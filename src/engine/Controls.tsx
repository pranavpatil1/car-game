export interface ControlState {
    [key: string]: boolean
  }
  
  export class Controls {
    keys: ControlState = {}
    
    constructor() {
      window.addEventListener("keydown", this.handleKeyDown)
      window.addEventListener("keyup", this.handleKeyUp)
    }
    
    handleKeyDown = (event: KeyboardEvent) => {
      this.keys[event.key.toLowerCase()] = true
    }
    
    handleKeyUp = (event: KeyboardEvent) => {
      this.keys[event.key.toLowerCase()] = false
    }
    
    isPressed(key: string): boolean {
      return !!this.keys[key.toLowerCase()]
    }
    
    cleanup() {
      window.removeEventListener("keydown", this.handleKeyDown)
      window.removeEventListener("keyup", this.handleKeyUp)
    }
  }
  