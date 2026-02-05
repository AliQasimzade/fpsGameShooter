import { useSphere } from '@react-three/cannon'
import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useCallback } from 'react'
import * as THREE from 'three'
import { useStore, WEAPONS, CT_SPAWNS, T_SPAWNS } from '../store'
import type { WeaponType } from '../store'

const SPEED = 10
const JUMP_FORCE = 6
const PEAK_OFFSET = 0.8

import { useMultiplayer } from '../useMultiplayer'

export const Player = () => {
  const { camera, scene } = useThree()
  const s = useStore()
  const { reportHit, updatePosition } = useMultiplayer()

  const [ref, api] = useSphere(() => ({
    mass: 1, type: 'Dynamic', position: [0, 2, 0], args: [0.6], fixedRotation: true, material: { friction: 0 }
  }))

  const velocity = useRef([0, 0, 0])
  const pos = useRef([0, 0, 0])
  useEffect(() => api.velocity.subscribe(v => velocity.current = v), [api.velocity])
  useEffect(() => api.position.subscribe(p => pos.current = p), [api.position])

  const keys = useRef<Record<string, boolean>>({})
  const leftLegRef = useRef<THREE.Group>(null)
  const rightLegRef = useRef<THREE.Group>(null)

  const cameraRotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const targetRotation = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const headBobActive = useRef(0)

  const createTracer = useCallback((start: THREE.Vector3, end: THREE.Vector3) => {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end])
    const mat = new THREE.LineBasicMaterial({ color: 'yellow', linewidth: 4 })
    const line = new THREE.Line(geo, mat)
    scene.add(line)
    setTimeout(() => { scene.remove(line); geo.dispose(); mat.dispose() }, 60)
  }, [scene])

  const shoot = useCallback(() => {
    if (s.roundCountdown > 0 || !s.shoot() || s.isDead) return
    const weapon = s.currentItem as WeaponType
    const stats = WEAPONS[weapon]

    // Check if player is in smoke
    const smokes = s.activeEffects.filter(fx => fx.type === 'smoke')
    const inSmoke = smokes.some(sm => new THREE.Vector3(...sm.position).distanceTo(camera.position) < 2.5)
    if (inSmoke) return

    const ray = new THREE.Raycaster()
    ray.setFromCamera(new THREE.Vector2(0, 0), camera)

    // STRICT HIT DETECTION
    const allObjects: THREE.Object3D[] = []
    scene.traverse(obj => { if (obj.userData.hittable || obj.userData.isWall) allObjects.push(obj) })

    const hits = ray.intersectObjects(allObjects, true)
    // The closest hit must be our target. If it's a wall, no damage!
    const validHit = hits.find(h => h.distance > 0.4)

    if (validHit) {
      const start = camera.position.clone().add(new THREE.Vector3(0.3, -0.2, -0.5).applyQuaternion(camera.quaternion))
      createTracer(start, validHit.point)

      // Damage only if the VERY FIRST object we hit is a bot/hittable, NOT a wall
      if (validHit.object.userData.onHit && !validHit.object.userData.isWall) {
        validHit.object.userData.onHit(stats.damage, false, 'You')

        // Report to multiplayer server if it's a remote player
        if (validHit.object.userData.playerId) {
          reportHit(validHit.object.userData.playerId, stats.damage, false)
        }
      }
    } else {
      const start = camera.position.clone().add(new THREE.Vector3(0.3, -0.2, -0.5).applyQuaternion(camera.quaternion))
      createTracer(start, ray.ray.at(100, new THREE.Vector3()))
    }
  }, [camera, scene, s, createTracer])

  const throwGrenade = useCallback(() => {
    if (s.roundCountdown > 0 || s.isDead) return
    const type = s.currentItem as any
    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    const startPos = camera.position.clone().add(dir.clone().multiplyScalar(0.5))

    const projectileGeo = new THREE.SphereGeometry(0.1, 8, 8)
    const projectileMat = new THREE.MeshStandardMaterial({ color: type === 'molotov' ? 'orange' : type === 'smoke' ? 'white' : 'gray' })
    const projectile = new THREE.Mesh(projectileGeo, projectileMat)
    projectile.position.copy(startPos)
    scene.add(projectile)

    const force = 18
    const projVelocity = dir.clone().multiplyScalar(force); projVelocity.y += 5

    let elapsed = 0; let lastTime = performance.now()
    const animateProjectile = (time: number) => {
      const delta = (time - lastTime) / 1000; lastTime = time; elapsed += delta
      if (elapsed >= 2) {
        const currentPos = projectile.position.clone()
        const finalPos: [number, number, number] = [currentPos.x, currentPos.y < 0.2 ? 0.1 : currentPos.y, currentPos.z]

        if (type === 'flash') {
          s.addEffect({ type: 'flash', position: [currentPos.x, currentPos.y + 0.5, currentPos.z], startTime: Date.now(), duration: 500 })
          scene.traverse(obj => {
            if (obj.userData.isBot && obj.userData.botName) {
              const botName = obj.userData.botName
              const botPos = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld)
              if (currentPos.distanceTo(botPos) < 15) {
                const flashFunc = (window as any)[`flash_bot_${botName}`]
                if (flashFunc) flashFunc(3000)
              }
            }
          })
          // Player flash check
          const camPos = camera.position.clone()
          const distToFlash = currentPos.distanceTo(camPos)
          const flashRay = new THREE.Raycaster(); flashRay.set(currentPos, camPos.clone().sub(currentPos).normalize())
          const walls: THREE.Object3D[] = []; scene.traverse(obj => { if (obj.userData.isWall) walls.push(obj) })
          const wallHits = flashRay.intersectObjects(walls, true)
          if (!wallHits.some(h => h.distance < distToFlash - 1)) {
            const toFlash = currentPos.clone().sub(camPos).normalize(); const look = new THREE.Vector3(); camera.getWorldDirection(look)
            if (toFlash.dot(look) > 0.45) s.setFlashed(true, 3000)
            else if (distToFlash < 8) s.setFlashed(true, 800)
          }
        } else if (type === 'smoke') {
          s.addEffect({ type: 'smoke', position: finalPos, startTime: Date.now(), duration: 10000 })
        } else if (type === 'molotov') {
          s.addEffect({ type: 'molotov', position: finalPos, startTime: Date.now(), duration: 4000 })
        } else if (type === 'heGrenade') {
          s.addEffect({ type: 'heGrenade', position: finalPos, startTime: Date.now(), duration: 1000 })
          scene.traverse(obj => {
            if (obj.userData.isBot && obj.userData.onHit) {
              const botPos = new THREE.Vector3().setFromMatrixPosition(obj.matrixWorld); const dist = currentPos.distanceTo(botPos)
              if (dist < 6) obj.userData.onHit(80 * (1 - dist / 6), false, 'You')
            }
          })
        }
        scene.remove(projectile); projectileGeo.dispose(); projectileMat.dispose(); return
      }
      projVelocity.y -= 12 * delta; projectile.position.add(projVelocity.clone().multiplyScalar(delta))
      if (projectile.position.y < 0.1) { projectile.position.y = 0.1; projVelocity.set(0, 0, 0) }
      requestAnimationFrame(animateProjectile)
    }
    requestAnimationFrame(animateProjectile)
    s.useGrenade()
  }, [camera, scene, s])

  useEffect(() => {
    if (s.roundCountdown > 0) {
      const spawns = s.playerTeam === 'counter-terrorists' ? CT_SPAWNS : T_SPAWNS
      const sp = spawns[0]; api.position.set(sp[0], 2, sp[2]); api.velocity.set(0, 0, 0)
    }
  }, [s.roundCountdown, s.playerTeam, api.position, api.velocity])

  useEffect(() => {
    const handleDown = (e: KeyboardEvent) => {
      keys.current[e.code] = true
      if (e.code === 'KeyQ') s.setPeak('left'); if (e.code === 'KeyE') s.setPeak('right')
      if (e.key >= '1' && e.key <= '8') s.switchToSlot(parseInt(e.key) - 1)
      if (e.code === 'KeyR') s.reload()
    }
    const handleUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false
      if (e.code === 'KeyQ' || e.code === 'KeyE') s.setPeak('none')
    }
    const handleMouse = (e: MouseEvent) => { if (!document.pointerLockElement || s.isDead) return; if (e.button === 0) { if (s.currentSlot < 4) shoot(); else throwGrenade() } }
    const handleWheel = (e: WheelEvent) => { if (s.isDead) return; const dir = e.deltaY > 0 ? 1 : -1; let next = (s.currentSlot + dir + 8) % 8; while (!s.slots[next]) { next = (next + dir + 8) % 8; if (next === s.currentSlot) break }; s.switchToSlot(next) }
    window.addEventListener('keydown', handleDown); window.addEventListener('keyup', handleUp); window.addEventListener('mousedown', handleMouse); window.addEventListener('wheel', handleWheel)
    return () => { window.removeEventListener('keydown', handleDown); window.removeEventListener('keyup', handleUp); window.removeEventListener('mousedown', handleMouse); window.removeEventListener('wheel', handleWheel) }
  }, [s, shoot, throwGrenade])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!document.pointerLockElement || s.isDead) return
      const sensitivity = 0.002
      targetRotation.current.y -= e.movementX * sensitivity
      targetRotation.current.x -= e.movementY * sensitivity
      targetRotation.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetRotation.current.x))
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [s.isDead])

  useFrame((state) => {
    if (s.isDead) return

    // 1. Tilt & Rotation Handling
    const f = (keys.current['KeyW'] ? 1 : 0) - (keys.current['KeyS'] ? 1 : 0)
    const si = (keys.current['KeyD'] ? 1 : 0) - (keys.current['KeyA'] ? 1 : 0)

    // Integrated Strafe Tilt (Z-axis)
    targetRotation.current.z = -si * 0.015

    cameraRotation.current.x = THREE.MathUtils.lerp(cameraRotation.current.x, targetRotation.current.x, 0.25)
    cameraRotation.current.y = THREE.MathUtils.lerp(cameraRotation.current.y, targetRotation.current.y, 0.25)
    cameraRotation.current.z = THREE.MathUtils.lerp(cameraRotation.current.z, targetRotation.current.z, 0.1)
    camera.quaternion.setFromEuler(cameraRotation.current)

    // 2. Movement Logic
    const moveDir = new THREE.Vector3(si, 0, -f).applyQuaternion(camera.quaternion)
    moveDir.y = 0
    if (moveDir.lengthSq() > 0) moveDir.normalize()

    const targetSpeed = keys.current['KeyZ'] ? SPEED * 0.4 : SPEED

    if (s.roundCountdown > 0) api.velocity.set(0, velocity.current[1], 0)
    else {
      const vx = moveDir.x * targetSpeed
      const vz = moveDir.z * targetSpeed
      let vy = velocity.current[1]

      const isOnGround = Math.abs(vy) < 0.1 && pos.current[1] < 0.8
      if (keys.current['Space'] && isOnGround) {
        vy = JUMP_FORCE
      }

      api.velocity.set(vx, vy, vz)
    }

    // 3. Realistic Movement Effects (Head Bobbing)
    const speedSq = velocity.current[0] ** 2 + velocity.current[2] ** 2
    const isMoving = speedSq > 0.5
    const isCrouching = keys.current['KeyZ']
    const isJumping = Math.abs(velocity.current[1]) > 0.5

    if (isMoving && !isJumping) {
      headBobActive.current = THREE.MathUtils.lerp(headBobActive.current, 1, 0.1)
    } else {
      headBobActive.current = THREE.MathUtils.lerp(headBobActive.current, 0, 0.1)
    }

    const t = state.clock.elapsedTime * (isCrouching ? 8 : 12)
    const bobX = Math.cos(t * 0.5) * 0.04 * headBobActive.current
    const bobY = Math.sin(t) * 0.06 * headBobActive.current

    // 4. Camera Follow with Local-Space Bobbing
    const targetHeight = isCrouching ? 0.7 : 1.6
    const peak = s.peakDirection === 'left' ? -PEAK_OFFSET : s.peakDirection === 'right' ? PEAK_OFFSET : 0

    // Get camera's local right axis in world space for correct horizontal bobbing/peaking
    const sd = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion)

    const targetPos = new THREE.Vector3(
      pos.current[0] + sd.x * (peak + bobX),
      pos.current[1] + targetHeight + bobY,
      pos.current[2] + sd.z * (peak + bobX)
    )
    camera.position.lerp(targetPos, 0.4)

    // 5. Multiplayer Position Sync
    if (s.gameMode === 'host') {
      updatePosition(pos.current as [number, number, number], camera.rotation.y, s.isShooting)
    }

    // 6. Leg Animations
    if (leftLegRef.current && rightLegRef.current) {
      if (isMoving && !isJumping) {
        leftLegRef.current.position.y = isCrouching ? -0.4 : -1.2 + Math.abs(Math.sin(t)) * 0.2
        leftLegRef.current.rotation.x = Math.sin(t) * 0.6
        rightLegRef.current.position.y = isCrouching ? -0.4 : -1.2 + Math.abs(Math.sin(t + Math.PI)) * 0.2
        rightLegRef.current.rotation.x = Math.sin(t + Math.PI) * 0.6
      } else {
        leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, 0, 0.1)
        rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, 0, 0.1)
        const idleY = isCrouching ? -0.8 : -1.2
        leftLegRef.current.position.y = THREE.MathUtils.lerp(leftLegRef.current.position.y, idleY, 0.1)
        rightLegRef.current.position.y = THREE.MathUtils.lerp(rightLegRef.current.position.y, idleY, 0.1)
      }
    }
  })

  return (
    <group ref={ref as any}>
      <group rotation={[0, camera.rotation.y, 0]}>
        <group ref={leftLegRef} position={[-0.2, -1.2, 0]}>
          <mesh castShadow><boxGeometry args={[0.22, 0.7, 0.22]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
          <mesh position={[0, -0.4, 0.1]}><boxGeometry args={[0.24, 0.15, 0.35]} /><meshStandardMaterial color="#000" /></mesh>
        </group>
        <group ref={rightLegRef} position={[0.2, -1.2, 0]}>
          <mesh castShadow><boxGeometry args={[0.22, 0.7, 0.22]} /><meshStandardMaterial color="#1a1a1a" /></mesh>
          <mesh position={[0, -0.4, 0.1]}><boxGeometry args={[0.24, 0.15, 0.35]} /><meshStandardMaterial color="#000" /></mesh>
        </group>
      </group>
    </group>
  )
}
