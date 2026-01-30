import { useSphere } from '@react-three/cannon'
import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useStore, WEAPONS } from '../store'

const SPEED = 10
const JUMP_FORCE = 5

export const Player = () => {
  const { camera, scene } = useThree()
  const [ref, api] = useSphere(() => ({ 
    mass: 1, 
    type: 'Dynamic', 
    position: [0, 2, 0], 
    args: [1],
    fixedRotation: true
  }))

  const velocity = useRef([0, 0, 0])
  useEffect(() => api.velocity.subscribe((v) => (velocity.current = v)), [api.velocity])

  const pos = useRef([0, 0, 0])
  useEffect(() => api.position.subscribe((p) => (pos.current = p)), [api.position])

  const [actions, setActions] = useState({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  })

  // Store actions
  const shootAction = useStore(state => state.shoot)
  const reloadAction = useStore(state => state.reload)
  const setScoped = useStore(state => state.setScoped)
  const currentWeapon = useStore(state => state.currentWeapon)
  const isScoped = useStore(state => state.isScoped)
  const isDead = useStore(state => state.isDead)

  // Shooting logic
  const shoot = () => {
    if (isDead) return
    
    // Check ammo and fire rate handled by store/weapon stats usually, 
    // but here we check store to consume ammo
    if (shootAction()) {
      const stats = WEAPONS[currentWeapon]
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera)
      
      const intersects = raycaster.intersectObjects(scene.children, true)
      
      // Hit detection
      const hit = intersects.find(i => i.object.userData.hittable && i.distance > 1)
      const endPoint = hit ? hit.point : raycaster.ray.at(100, new THREE.Vector3())

      if (hit && hit.object.userData.onHit) {
         hit.object.userData.onHit(stats.damage)
      }
      
      createTracer(endPoint)
    }
  }

  const createTracer = (end: THREE.Vector3) => {
    // Start from approximate gun position
    const start = new THREE.Vector3(0.3, -0.2, -0.4)
    start.applyMatrix4(camera.matrixWorld)

    const points = [start, end]
    const geometry = new THREE.BufferGeometry().setFromPoints(points)
    const material = new THREE.LineBasicMaterial({ color: 'yellow', linewidth: 2 })
    const line = new THREE.Line(geometry, material)
    
    scene.add(line)
    setTimeout(() => {
      scene.remove(line)
      geometry.dispose()
      material.dispose()
    }, 50)
  }

  useEffect(() => {
    if (isDead) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setActions((prev) => ({ ...prev, forward: true })); break
        case 'KeyS': setActions((prev) => ({ ...prev, backward: true })); break
        case 'KeyA': setActions((prev) => ({ ...prev, left: true })); break
        case 'KeyD': setActions((prev) => ({ ...prev, right: true })); break
        case 'Space': 
          if (Math.abs(velocity.current[1]) < 0.05) {
            api.velocity.set(velocity.current[0], JUMP_FORCE, velocity.current[2])
          }
          break
        case 'KeyR': reloadAction(); break
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': setActions((prev) => ({ ...prev, forward: false })); break
        case 'KeyS': setActions((prev) => ({ ...prev, backward: false })); break
        case 'KeyA': setActions((prev) => ({ ...prev, left: false })); break
        case 'KeyD': setActions((prev) => ({ ...prev, right: false })); break
      }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        if (e.button === 0) { // Left Click
           shoot()
        } else if (e.button === 2) { // Right Click
           const stats = WEAPONS[currentWeapon]
           if (stats.scope) {
             setScoped(!isScoped)
           }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('mousedown', handleMouseDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [api.velocity, currentWeapon, isScoped, isDead])

  useFrame(() => {
    if (!ref.current || isDead) return

    // Sync camera
    camera.position.copy(new THREE.Vector3(pos.current[0], pos.current[1] + 0.8, pos.current[2]))

    const direction = new THREE.Vector3()
    const frontVector = new THREE.Vector3(0, 0, Number(actions.backward) - Number(actions.forward))
    const sideVector = new THREE.Vector3(Number(actions.left) - Number(actions.right), 0, 0)

    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED)
      .applyEuler(camera.rotation)

    api.velocity.set(direction.x, velocity.current[1], direction.z)
  })

  return (
    <mesh ref={ref as any} />
  )
}
