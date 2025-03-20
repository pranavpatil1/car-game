"use client"

import { useEffect, useRef, useState } from "react"
import { useWorld } from "../engine/World"
import { Terrain } from "../entities/Terrain"
import { Car } from "../entities/Car"

interface GameWorldProps {
  onLoaded?: () => void
}

export default function GameWorld({ onLoaded }: GameWorldProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { world, isLoaded } = useWorld(containerRef)
  const [instructions, setInstructions] = useState(true)
  
  useEffect(() => {
    if (!world) return
    
    // Add terrain
    const terrain = new Terrain()
    world.addEntity(terrain)
    
    // Available car models
    const carModels = [
      './assets/cars/lamborghini.glb',
      // Add all your car model paths here
    ]

    // Randomly select a car model
    const randomCarModel = carModels[Math.floor(Math.random() * carModels.length)]

    // Player car with random model
    const playerCar = new Car({
      meshConfig: { 
        modelPath: randomCarModel,
        bodyColor: 0xff0000 // Fallback color if model fails to load
      }
    })
    world.addEntity(playerCar)
    
    // Add event listener to hide instructions
    const handleKeyDown = () => {
      setInstructions(false)
    }
    
    window.addEventListener("keydown", handleKeyDown)
    
    if (onLoaded) {
      onLoaded()
    }
    
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [world, onLoaded])
  
  return (
    <div className="relative w-full h-screen">
      <div ref={containerRef} className="w-full h-full" />
      {instructions && (
        <div className="absolute top-0 left-0 right-0 p-4 bg-black bg-opacity-70 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Car Controls</h2>
          <p>W - Move in camera direction | S - Move opposite to camera | A/D - Turn car</p>
          <p className="text-sm mt-2">Movement is relative to camera view</p>
          <p className="text-sm mt-1">(Press any key to dismiss)</p>
        </div>
      )}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
          <p className="text-xl">Loading...</p>
        </div>
      )}
    </div>
  )
}
