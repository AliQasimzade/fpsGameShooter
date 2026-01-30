import { usePlane, useBox } from '@react-three/cannon'
import { useState, useEffect } from 'react'
import { Bot } from './Bot'
import { useStore } from '../store'

export const Level = () => {
  const [ref] = usePlane(() => ({ 
    rotation: [-Math.PI / 2, 0, 0], 
    position: [0, 0, 0],
    material: { friction: 0.1 }
  }))
  
  const addMoney = useStore(state => state.addMoney)
  
  // Manage bots
  const [bots, setBots] = useState<{id: number, pos: [number, number, number]}[]>([])

  const spawnBot = () => {
     const id = Date.now() + Math.random()
     // Random position around map
     const x = (Math.random() - 0.5) * 40
     const z = (Math.random() - 0.5) * 40
     setBots(prev => [...prev, { id, pos: [x, 2, z] }])
  }

  useEffect(() => {
    // Initial spawns
    for(let i=0; i<5; i++) spawnBot()
    
    // Spawner loop
    const interval = setInterval(() => {
       setBots(prev => {
         if (prev.length < 10) {
            const x = (Math.random() - 0.5) * 40
            const z = (Math.random() - 0.5) * 40
            return [...prev, { id: Date.now(), pos: [x, 2, z] }]
         }
         return prev
       })
    }, 5000)
    
    return () => clearInterval(interval)
  }, [])

  const handleBotDeath = (id: number) => {
    setBots(prev => prev.filter(b => b.id !== id))
    addMoney(200)
  }

  return (
    <group>
      {/* Ground - Dust2 style sand color */}
      <mesh ref={ref as any} receiveShadow name="ground">
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#e6cfa1" />
      </mesh>

      {/* Walls/Obstacles */}
      <Wall position={[5, 1, 5]} args={[2, 2, 2]} color="#8b4513" /> {/* Crate */}
      <Wall position={[-5, 1, -5]} args={[2, 2, 2]} color="#8b4513" />
      <Wall position={[5, 1, -5]} args={[2, 2, 2]} color="#8b4513" />
      
      {/* Big Walls */}
      <Wall position={[0, 2.5, -20]} args={[40, 5, 1]} color="#d2b48c" />
      <Wall position={[0, 2.5, 20]} args={[40, 5, 1]} color="#d2b48c" />
      <Wall position={[-20, 2.5, 0]} args={[1, 5, 40]} color="#d2b48c" />
      <Wall position={[20, 2.5, 0]} args={[1, 5, 40]} color="#d2b48c" />
      
      {/* Bots */}
      {bots.map(bot => (
        <Bot key={bot.id} position={bot.pos} onDeath={() => handleBotDeath(bot.id)} />
      ))}
    </group>
  )
}

const Wall = ({ position, args, color }: { position: [number, number, number], args: [number, number, number], color: string }) => {
  const [ref] = useBox(() => ({ mass: 0, type: 'Static', position, args }))
  return (
    <mesh ref={ref as any} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}
