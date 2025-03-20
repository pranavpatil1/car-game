"use client"

import { useEffect, useRef, useState } from "react"
import { useWorld } from "../engine/World"
import { Terrain } from "../entities/Terrain"
import { Car } from "../entities/Car"
import { 
  MobileControls, 
  MobileShootButton, 
  MobileInstructions, 
  isMobileDevice 
} from "../controls/MobileControls"

interface GameWorldProps {
  onLoaded?: () => void
}

export default function GameWorld({ onLoaded }: GameWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { world, isLoaded } = useWorld(containerRef)
  const [instructions, setInstructions] = useState(true)
  const [isMobile, setIsMobile] = useState(false)
  const mobileControlsRef = useRef<MobileControls | null>(null)
  
  useEffect(() => {
    setIsMobile(isMobileDevice())
  }, [])

  useEffect(() => {
    if (!world) return
    
    const terrain = new Terrain()
    world.addEntity(terrain)
    
    const carModels = [
      './assets/cars/lamborghini.glb',
    ]

    const randomCarModel = carModels[Math.floor(Math.random() * carModels.length)]

    const playerCar = new Car({
      meshConfig: { 
        modelPath: randomCarModel,
        bodyColor: 0xff0000
      }
    })
    world.addEntity(playerCar)
    
    const handleKeyDown = () => {
      setInstructions(false)
    }
    
    window.addEventListener("keydown", handleKeyDown)
    
    // Initialize mobile controls if on mobile device
    if (isMobile) {
      mobileControlsRef.current = new MobileControls(playerCar, containerRef, {
        onDismissInstructions: () => setInstructions(false)
      })
    }
    
    if (onLoaded) {
      onLoaded()
    }
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      if (mobileControlsRef.current) {
        mobileControlsRef.current.cleanup()
      }
    }
  }, [world, onLoaded, isMobile])
  
  return (
    <div className="relative w-full h-[100dvh]">
      <div ref={containerRef} className="w-full h-full" />
      {instructions && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-70 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Controls</h2>
          {isMobile ? (
            <MobileInstructions />
          ) : (
            <>
              <p>W - Move forward | S - Move backward | A/D - Turn</p>
              <p>SPACE - Shoot | B - Brake</p>
              <p className="text-sm mt-2">Movement is relative to camera view</p>
            </>
          )}
          <p className="text-sm mt-1">
            {isMobile ? '(Touch anywhere to dismiss)' : '(Press any key to dismiss)'}
          </p>
        </div>
      )}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          <p className="text-xl">Loading...</p>
        </div>
      )}
      {isMobile && mobileControlsRef.current && (
        <MobileShootButton 
          onShoot={mobileControlsRef.current.handleShootTouch}
        />
      )}
    </div>
  )
}
