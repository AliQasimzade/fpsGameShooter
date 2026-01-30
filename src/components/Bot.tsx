import { useSphere, useCylinder } from '@react-three/cannon'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useStore } from '../store'

interface BotProps {
  position: [number, number, number]
  onDeath: () => void
}

const BOT_SPEED = 3
const BOT_DAMAGE = 5
const SHOOT_INTERVAL = 2000 // ms

export const Bot = ({ position, onDeath }: BotProps) => {
  const { scene } = useThree()
  const [health, setHealth] = useState(100)
  
  // Physics body (Cylinder for body)
  const [ref, api] = useCylinder(() => ({
    mass: 1,
    position,
    args: [0.5, 0.5, 2, 8],
    fixedRotation: true,
    type: 'Dynamic'
  }))

  // Head physics (Sphere) attached to body? 
  // Cannon doesn't support compound bodies easily with declarative API like this for moving parts,
  // but we can just use the mesh for hit detection and one physics body for movement.
  // We'll attach userData to the meshes for hit detection.

  const velocity = useRef([0, 0, 0])
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity])
  
  const botPos = useRef(new THREE.Vector3(...position))
  useEffect(() => api.position.subscribe((p) => botPos.current.set(...p)), [api.position])

  const lastShootTime = useRef(0)
  const damagePlayer = useStore(state => state.damagePlayer)
  const isPlayerDead = useStore(state => state.isDead)

  // AI Logic
  useFrame((state) => {
    if (!ref.current || health <= 0) return

    // Find player (Camera position is player position roughly)
    const playerPos = state.camera.position
    const direction = new THREE.Vector3().subVectors(playerPos, botPos.current)
    const distance = direction.length()
    
    // Normalize direction (ignore Y for movement)
    direction.y = 0
    direction.normalize()

    // Move towards player if far, stop if close
    if (distance > 5 && distance < 30) {
      api.velocity.set(direction.x * BOT_SPEED, velocity.current[1], direction.z * BOT_SPEED)
      // Look at player
      ref.current.lookAt(playerPos.x, botPos.current.y, playerPos.z)
    } else {
      api.velocity.set(0, velocity.current[1], 0)
      ref.current.lookAt(playerPos.x, botPos.current.y, playerPos.z)
    }

    // Shoot logic
    const now = state.clock.elapsedTime * 1000
    if (distance < 20 && !isPlayerDead && now - lastShootTime.current > SHOOT_INTERVAL) {
      // Raycast to check visibility
      const raycaster = new THREE.Raycaster(botPos.current, new THREE.Vector3().subVectors(playerPos, botPos.current).normalize())
      const intersects = raycaster.intersectObjects(scene.children, true)
      
      // Simple check: if first hit is close to player distance or we just shoot blindly for "Easy" mode
      // Let's just deal damage if line of sight is clear-ish
      // "Easy" bots miss a lot or shoot slowly. 
      // We'll simulate a hit chance.
      if (Math.random() > 0.3) { // 70% accuracy
         damagePlayer(BOT_DAMAGE)
         
         // Visual tracer from bot to player
         const tracerGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(botPos.current.x, botPos.current.y + 0.5, botPos.current.z),
            new THREE.Vector3(playerPos.x, playerPos.y - 0.5, playerPos.z) // Aim at body
         ])
         const line = new THREE.Line(tracerGeom, new THREE.LineBasicMaterial({ color: 'red' }))
         scene.add(line)
         setTimeout(() => {
            scene.remove(line)
            tracerGeom.dispose()
         }, 100)
      }

      lastShootTime.current = now
    }
  })

  // Hit handler
  const handleHit = (damage: number, isHeadshot: boolean) => {
    const finalDamage = isHeadshot ? 100 : damage
    setHealth(prev => {
      const newHealth = prev - finalDamage
      if (newHealth <= 0) {
        onDeath()
      }
      return newHealth
    })
  }

  // Attach data to mesh for raycaster
  useEffect(() => {
    if (ref.current) {
      // Body
      ref.current.userData = {
        hittable: true,
        onHit: (damage: number) => handleHit(damage, false)
      }
      // Head (we'll find the child mesh)
      ref.current.traverse((child) => {
        if (child.name === 'head') {
          child.userData = {
            hittable: true,
            onHit: (damage: number) => handleHit(damage, true) // Headshot
          }
        }
      })
    }
  }, [])

  if (health <= 0) return null

  return (
    <group ref={ref as any}>
      {/* Body */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.5, 0.5, 2, 8]} />
        <meshStandardMaterial color="red" />
      </mesh>
      
      {/* Head */}
      <mesh position={[0, 1.4, 0]} name="head" castShadow>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial color="pink" />
      </mesh>
      
      {/* Gun held */}
      <mesh position={[0.3, 0.5, 0.5]} rotation={[Math.PI/2, 0, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.6]} />
        <meshStandardMaterial color="black" />
      </mesh>
    </group>
  )
}
