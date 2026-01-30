import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useStore, WEAPONS } from '../store'

export const Weapon = () => {
  const { camera } = useThree()
  const ref = useRef<THREE.Group>(null)
  const [recoil, setRecoil] = useState(false)
  
  const currentWeapon = useStore(state => state.currentWeapon)
  const isReloading = useStore(state => state.isReloading)
  const isScoped = useStore(state => state.isScoped)
  
  const stats = WEAPONS[currentWeapon]

  // Handle FOV for scoping
  useEffect(() => {
    if (isScoped && stats.scope) {
      camera.fov = 30
    } else {
      camera.fov = 75
    }
    camera.updateProjectionMatrix()
  }, [isScoped, currentWeapon, stats.scope, camera])

  useEffect(() => {
    if (ref.current) {
      camera.add(ref.current)
    }
    return () => {
      if (ref.current) {
        camera.remove(ref.current)
      }
    }
  }, [camera])

  // Recoil effect trigger (can be called from store or player)
  // For now, let's just listen to a custom event or props, 
  // but since we are refactoring, let's move the shoot logic entirely to Player and just animate here.
  // We can subscribe to the store transiently or just use a simple event emitter pattern.
  // Simpler: Player calls shoot(), store updates ammo. We detect ammo change? No.
  // Let's attach a listener for 'mousedown' again just for visual recoil, 
  // checking store state to ensure we actually fired.
  useEffect(() => {
    const handleMouseDown = () => {
      const state = useStore.getState()
      if (!state.isReloading && state.ammo[state.currentWeapon] > 0) {
        setRecoil(true)
        setTimeout(() => setRecoil(false), stats.fireRate / 2)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [currentWeapon, stats.fireRate])

  // Animate recoil
  useFrame((state) => {
    if (!ref.current) return
    
    // Base position
    const targetPos = new THREE.Vector3(0.3, -0.25, -0.5)
    
    // Recoil kick
    if (recoil) {
      targetPos.z += 0.1
      targetPos.y += 0.05
      targetPos.x += 0.02
    }
    
    // Reload animation (dip down)
    if (isReloading) {
      targetPos.y -= 0.5
      targetPos.x -= 0.2
    }

    // Sway (movement)
    // We can get velocity from somewhere or just use time
    const time = state.clock.getElapsedTime()
    targetPos.y += Math.sin(time * 2) * 0.005
    targetPos.x += Math.cos(time * 2) * 0.005

    // Smooth lerp
    ref.current.position.lerp(targetPos, 0.1)
    
    // Smooth rotation lerp for kickback
    const targetRot = new THREE.Euler(recoil ? 0.1 : 0, recoil ? 0.1 : 0, 0)
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, targetRot.x, 0.1)
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, targetRot.y, 0.1)
  })

  // Don't render weapon model if scoped (sniper view usually hides gun or moves it)
  // But for simple primitives, let's keep it or hide it.
  if (isScoped && stats.scope) return null

  return (
    <group ref={ref}>
       {/* Right Arm (Trigger Hand) */}
       <mesh position={[0.2, -0.25, 0.3]} rotation={[0.4, 0, -0.2]}>
         <capsuleGeometry args={[0.06, 0.8]} />
         <meshStandardMaterial color="#d2b48c" /> {/* Skin color */}
       </mesh>
       
       {/* Left Arm (Support Hand) */}
       <mesh position={[-0.2, -0.25, 0.3]} rotation={[0.4, 0.5, 0.2]}>
         <capsuleGeometry args={[0.06, 0.8]} />
         <meshStandardMaterial color="#d2b48c" />
       </mesh>

       {/* Weapon Model */}
       <group position={[0, 0, 0]}>
          {/* Main Body */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.1, 0.15, 0.6]} />
            <meshStandardMaterial color={stats.color} />
          </mesh>
          
          {/* Barrel / Detail depending on weapon type */}
          {currentWeapon === 'smg' && (
             <mesh position={[0, -0.1, 0.1]}>
               <boxGeometry args={[0.05, 0.2, 0.1]} />
               <meshStandardMaterial color="#111" />
             </mesh>
          )}
          {currentWeapon === 'rifle' && (
             <mesh position={[0, 0.05, -0.2]}>
               <boxGeometry args={[0.02, 0.05, 0.4]} />
               <meshStandardMaterial color="#555" />
             </mesh>
          )}
          {currentWeapon === 'sniper' && (
             <group>
               <mesh position={[0, 0.12, 0]}>
                  <cylinderGeometry args={[0.03, 0.04, 0.3]} rotation={[Math.PI/2, 0, 0] as any} />
                  <meshStandardMaterial color="#000" />
               </mesh>
             </group>
          )}
       </group>
    </group>
  )
}
