import { useCylinder } from '@react-three/cannon'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useStore, type Team } from '../store'
import { Billboard, Text } from '@react-three/drei'

interface BotProps { name: string; position: [number, number, number]; team: Team; onDeath: (h: boolean, k: string) => void }

const BOT_SPEED = 2.5
const BOT_DAMAGE = 2
const SHOOT_INTERVAL = 1400
const BOT_HEALTH = 100

export const Bot = ({ name, position, team, onDeath }: BotProps) => {
  const { scene } = useThree()
  const [health, setHealth] = useState(BOT_HEALTH)
  const isDeadRef = useRef(false)
  const botPos = useRef(new THREE.Vector3(...position))
  const [ref, api] = useCylinder(() => ({ mass: 1, position, args: [0.5, 0.5, 1.8, 8], fixedRotation: true, type: 'Dynamic' }))

  useEffect(() => api.position.subscribe(p => botPos.current.set(...p)), [api.position])

  const damagePlayer = useStore(state => state.damagePlayer)
  const incrementKills = useStore(state => state.incrementKills)
  const isPlayerDead = useStore(state => state.isDead)
  const roundCountdown = useStore(state => state.roundCountdown)
  const activeEffects = useStore(state => state.activeEffects)
  const lastShootTime = useRef(0)
  const velocity = useRef([0, 0, 0])
  useEffect(() => api.velocity.subscribe(v => velocity.current = v), [api.velocity])

  // NEW: Bot states for grenades
  const [isFlashed, setFlashed] = useState(false)
  const flashEndTime = useRef(0)

  const handleHit = (dmg: number, head: boolean, killer: string) => {
    if (isDeadRef.current) return
    const final = head ? BOT_HEALTH : dmg
    setHealth(prev => {
      const next = prev - final
      if (next <= 0 && !isDeadRef.current) {
        isDeadRef.current = true
        if (killer === 'You') {
          incrementKills()
          useStore.getState().addMoney(300)
        }
        onDeath(head, killer)
        return 0
      }
      return next
    })
  }

  useFrame((state) => {
    if (health <= 0 || roundCountdown > 0) {
      if (roundCountdown > 0) api.velocity.set(0, 0, 0)
      return
    }

    // FLASH CHECK
    if (Date.now() < flashEndTime.current) {
      setFlashed(true)
      api.velocity.set(0, 0, 0) // Stop moving when flashed
      return
    } else if (isFlashed) {
      setFlashed(false)
    }

    const pPos = state.camera.position
    const dist = botPos.current.distanceTo(pPos)

    // SMOKE CHECK: Can bot see the player?
    const smokes = activeEffects.filter(fx => fx.type === 'smoke')
    const isPlayerInSmoke = smokes.some(s => new THREE.Vector3(...s.position).distanceTo(pPos) < 2.5)
    const isBotInSmoke = smokes.some(s => new THREE.Vector3(...s.position).distanceTo(botPos.current) < 2.5)

    // MOLOTOV DAMAGE CHECK
    const molotovs = activeEffects.filter(fx => fx.type === 'molotov')
    molotovs.forEach(m => {
      if (new THREE.Vector3(...m.position).distanceTo(botPos.current) < 2.5) {
        handleHit(0.5, false, 'Environment') // Constant damage from fire
      }
    })

    if (dist < 30 && !isPlayerDead && !isPlayerInSmoke && !isBotInSmoke) {
      const dir = new THREE.Vector3().subVectors(pPos, botPos.current)
      dir.y = 0
      dir.normalize()

      if (dist > 7) {
        api.velocity.set(dir.x * BOT_SPEED, 0, dir.z * BOT_SPEED)
      } else {
        api.velocity.set(0, 0, 0)
      }

      if (ref.current) ref.current.lookAt(pPos.x, botPos.current.y, pPos.z)

      const now = Date.now()
      if (now - lastShootTime.current > SHOOT_INTERVAL) {
        const ray = new THREE.Raycaster()
        const start = botPos.current.clone().add(new THREE.Vector3(0, 1.2, 0))
        const rayDir = new THREE.Vector3().subVectors(pPos, start).normalize()
        ray.set(start, rayDir)

        const blockableObjects: THREE.Object3D[] = []
        scene.traverse(obj => { if (obj.userData.isWall) blockableObjects.push(obj) })

        const hits = ray.intersectObjects(blockableObjects, true)
        const wallHit = hits.find(h => h.distance < dist)

        if (!wallHit) {
          const points = [start, pPos.clone()]
          const geo = new THREE.BufferGeometry().setFromPoints(points)
          const mat = new THREE.LineBasicMaterial({ color: team === 'counter-terrorists' ? '#3b82f6' : '#ef4444' })
          const line = new THREE.Line(geo, mat)
          scene.add(line)
          setTimeout(() => { scene.remove(line); geo.dispose(); mat.dispose() }, 100)

          damagePlayer(BOT_DAMAGE)
        }
        lastShootTime.current = now
      }
    } else {
      api.velocity.set(0, 0, 0)
    }
  })

  // Animation logic for legs
  const leftLegRef = useRef<THREE.Mesh>(null)
  const rightLegRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!leftLegRef.current || !rightLegRef.current) return
    const speed = Math.sqrt(velocity.current[0] ** 2 + velocity.current[2] ** 2)
    if (speed > 0.1 && !isFlashed) {
      const t = state.clock.elapsedTime * 10
      leftLegRef.current.rotation.x = Math.sin(t) * 0.5
      rightLegRef.current.rotation.x = Math.sin(t + Math.PI) * 0.5
    } else {
      leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1)
      rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1)
    }
  })

  useEffect(() => {
    // Expose flash method to the window or a global registry for Player to call
    (window as any)[`flash_bot_${name}`] = (duration: number) => {
      flashEndTime.current = Date.now() + duration
      setFlashed(true)
    }
    return () => { delete (window as any)[`flash_bot_${name}`] }
  }, [name])

  if (health <= 0) return null

  return (
    <group ref={ref as any}>
      <Billboard position={[0, 1.9, 0]}>
        <Text fontSize={0.3} color={team === 'counter-terrorists' ? '#3b82f6' : '#ef4444'} outlineWidth={0.02}>{name}</Text>
        <mesh position={[0, -0.2, 0]}>
          <planeGeometry args={[0.8 * (health / BOT_HEALTH), 0.1]} />
          <meshBasicMaterial color={health > 50 ? "green" : "red"} />
        </mesh>
        {isFlashed && (
          <mesh position={[0, 0.3, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="white" />
          </mesh>
        )}
      </Billboard>

      {/* Body */}
      <mesh
        position={[0, 0.2, 0]}
        castShadow
        userData={{ hittable: true, isBot: true, botName: name, onHit: (d: number, h: boolean, k: string) => handleHit(d, h, k) }}
      >
        <boxGeometry args={[0.6, 0.8, 0.3]} />
        <meshStandardMaterial color={team === 'counter-terrorists' ? (isFlashed ? '#fff' : '#1e40af') : (isFlashed ? '#fff' : '#991b1b')} />
      </mesh>

      {/* Head */}
      <mesh
        position={[0, 0.9, 0]}
        castShadow
        userData={{ hittable: true, isBot: true, botName: name, onHit: (d: number, h: boolean, k: string) => handleHit(d, true, k) }}
      >
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color={isFlashed ? "#fff" : "#d2a679"} />
      </mesh>

      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.15, -0.4, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color={team === 'counter-terrorists' ? '#1e3a8a' : '#7f1d1d'} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.15, -0.4, 0]}>
        <boxGeometry args={[0.2, 0.6, 0.2]} />
        <meshStandardMaterial color={team === 'counter-terrorists' ? '#1e3a8a' : '#7f1d1d'} />
      </mesh>
    </group>
  )
}
