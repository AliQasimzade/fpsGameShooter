import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useStore, WEAPONS } from '../store'
import type { WeaponType } from '../store'

export const Weapon = () => {
  const { camera } = useThree()
  const ref = useRef<THREE.Group>(null)
  const [recoil, setRecoil] = useState(false)

  const currentItem = useStore(state => state.currentItem)
  const currentSlot = useStore(state => state.currentSlot)
  const isReloading = useStore(state => state.isReloading)
  const isScoped = useStore(state => state.isScoped)
  const isCrouching = useStore(state => state.isCrouching)
  const peakDirection = useStore(state => state.peakDirection)

  // Determine if we are holding a weapon or a grenade
  const isWeapon = currentSlot < 4 && currentItem !== null
  const stats = isWeapon ? WEAPONS[currentItem as WeaponType] : null

  const localPosition = useRef(new THREE.Vector3(0.35, -0.3, -0.5))
  const localRotation = useRef(new THREE.Euler(0, 0, 0))

  useEffect(() => {
    const pc = camera as THREE.PerspectiveCamera
    if (isScoped && stats?.scope) {
      pc.fov = 30
    } else {
      pc.fov = 75
    }
    pc.updateProjectionMatrix()
  }, [isScoped, currentItem, stats, camera])

  useEffect(() => {
    if (!isWeapon || !stats) return
    const handleMouseDown = () => {
      const state = useStore.getState()
      if (state.currentSlot < 4 && !state.isReloading && state.ammo[state.currentItem as WeaponType] > 0) {
        setRecoil(true)
        setTimeout(() => setRecoil(false), stats.fireRate / 2)
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [currentItem, isWeapon, stats])

  useFrame(() => {
    if (!ref.current) return

    const basePos = {
      deagle: new THREE.Vector3(0.35, -0.3, -0.5),
      smg: new THREE.Vector3(0.3, -0.28, -0.45),
      rifle: new THREE.Vector3(0.28, -0.25, -0.5),
      sniper: new THREE.Vector3(0.25, -0.25, -0.55),
      grenade: new THREE.Vector3(0.3, -0.4, -0.4)
    }

    const targetLocalPos = isWeapon
      ? (basePos[currentItem as keyof typeof basePos] || basePos.deagle).clone()
      : basePos.grenade.clone()

    if (recoil) {
      targetLocalPos.z += 0.12
      targetLocalPos.y += 0.06
    }

    if (isReloading) {
      targetLocalPos.y -= 0.5
      targetLocalPos.z += 0.1
    }

    if (peakDirection === 'left') {
      targetLocalPos.x -= 0.15
    } else if (peakDirection === 'right') {
      targetLocalPos.x += 0.15
    }

    if (isCrouching) targetLocalPos.y += 0.05

    localPosition.current.lerp(targetLocalPos, 0.15)

    const worldPos = localPosition.current.clone().applyMatrix4(camera.matrixWorld)
    ref.current.position.copy(worldPos)
    ref.current.quaternion.copy(camera.quaternion)

    const targetRotX = recoil ? -0.08 : (isReloading ? -0.4 : 0)
    localRotation.current.x = THREE.MathUtils.lerp(localRotation.current.x, targetRotX, 0.12)
    ref.current.rotateX(localRotation.current.x)
  })

  if (isScoped && stats?.scope) return null
  if (!currentItem) return null

  return (
    <group ref={ref}>
      {isWeapon ? (
        <group>
          {currentItem === 'deagle' && <DeagleModel />}
          {currentItem === 'smg' && <SMGModel />}
          {currentItem === 'rifle' && <RifleModel />}
          {currentItem === 'sniper' && <SniperModel />}
        </group>
      ) : (
        <GrenadeModel type={currentItem as string} />
      )}
    </group>
  )
}

const DeagleModel = () => (
  <group>
    {/* Body/Slide */}
    <mesh castShadow>
      <boxGeometry args={[0.08, 0.1, 0.3]} />
      <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
    </mesh>
    {/* Grip */}
    <mesh position={[0, -0.12, 0.08]} rotation={[0.2, 0, 0]}>
      <boxGeometry args={[0.07, 0.18, 0.08]} />
      <meshStandardMaterial color="#111" roughness={0.9} />
    </mesh>
    {/* Barrel End */}
    <mesh position={[0, 0.02, -0.16]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.02, 0.02, 0.05]} />
      <meshStandardMaterial color="#000" metalness={0.9} />
    </mesh>
  </group>
)

const SMGModel = () => (
  <group>
    {/* Main Body */}
    <mesh castShadow>
      <boxGeometry args={[0.08, 0.12, 0.45]} />
      <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
    </mesh>
    {/* Magazine */}
    <mesh position={[0, -0.18, -0.05]} rotation={[0.1, 0, 0]}>
      <boxGeometry args={[0.05, 0.25, 0.06]} />
      <meshStandardMaterial color="#111" metalness={0.5} />
    </mesh>
    {/* Barrel */}
    <mesh position={[0, 0, -0.28]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.025, 0.02, 0.15]} />
      <meshStandardMaterial color="#000" metalness={0.9} />
    </mesh>
    {/* Stock */}
    <mesh position={[0, -0.02, 0.3]} rotation={[-0.1, 0, 0]}>
      <boxGeometry args={[0.06, 0.1, 0.2]} />
      <meshStandardMaterial color="#111" />
    </mesh>
  </group>
)

const RifleModel = () => (
  <group>
    {/* Metal Body */}
    <mesh castShadow>
      <boxGeometry args={[0.08, 0.12, 0.55]} />
      <meshStandardMaterial color="#222" metalness={0.7} roughness={0.3} />
    </mesh>
    {/* Wooden Handguard */}
    <mesh position={[0, -0.02, -0.15]}>
      <boxGeometry args={[0.09, 0.1, 0.25]} />
      <meshStandardMaterial color="#5d4037" roughness={0.8} />
    </mesh>
    {/* Curved Magazine */}
    <mesh position={[0, -0.2, -0.1]} rotation={[0.4, 0, 0]}>
      <boxGeometry args={[0.06, 0.3, 0.1]} />
      <meshStandardMaterial color="#111" metalness={0.4} />
    </mesh>
    {/* Barrel */}
    <mesh position={[0, 0.03, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.02, 0.02, 0.3]} />
      <meshStandardMaterial color="#000" metalness={1} />
    </mesh>
    {/* Stock (Wood) */}
    <mesh position={[0, -0.05, 0.35]} rotation={[-0.05, 0, 0]}>
      <boxGeometry args={[0.07, 0.15, 0.3]} />
      <meshStandardMaterial color="#5d4037" roughness={0.8} />
    </mesh>
  </group>
)

const SniperModel = () => (
  <group>
    {/* Body */}
    <mesh castShadow>
      <boxGeometry args={[0.09, 0.14, 0.7]} />
      <meshStandardMaterial color="#1b5e20" roughness={0.6} />
    </mesh>
    {/* Scope */}
    <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.04, 0.04, 0.35]} />
      <meshStandardMaterial color="#111" metalness={0.8} />
    </mesh>
    {/* Long Barrel */}
    <mesh position={[0, 0, -0.6]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[0.025, 0.02, 0.6]} />
      <meshStandardMaterial color="#000" metalness={1} />
    </mesh>
    {/* Bolt handle */}
    <mesh position={[0.08, 0.05, 0.1]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.01, 0.01, 0.1]} />
      <meshStandardMaterial color="#111" metalness={0.9} />
    </mesh>
  </group>
)

const GrenadeModel = ({ type }: { type: string }) => {
  const colors: Record<string, string> = {
    flash: 'white',
    smoke: 'gray',
    molotov: '#ff4400',
    heGrenade: '#2e7d32'
  }
  return (
    <group>
      {type === 'molotov' ? (
        <group>
          {/* Bottle */}
          <mesh>
            <cylinderGeometry args={[0.05, 0.05, 0.25]} />
            <meshStandardMaterial color="#8b4513" transparent opacity={0.7} />
          </mesh>
          {/* Rag */}
          <mesh position={[0, 0.15, 0]}>
            <boxGeometry args={[0.03, 0.1, 0.03]} />
            <meshStandardMaterial color="white" />
          </mesh>
        </group>
      ) : (
        <group>
          {/* Main Body */}
          <mesh castShadow>
            <cylinderGeometry args={[0.07, 0.07, 0.18, 16]} />
            <meshStandardMaterial color={colors[type] || 'gray'} metalness={0.4} />
          </mesh>
          {/* Pin/Top */}
          <mesh position={[0, 0.1, 0]}>
            <cylinderGeometry args={[0.04, 0.08, 0.05, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        </group>
      )}
    </group>
  )
}


