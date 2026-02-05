import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import { Mesh, Vector3, Group } from 'three'
import { Text } from '@react-three/drei'
import { type Team } from '../store'

interface RemotePlayerProps {
    id: string
    position: [number, number, number]
    rotation: number
    name: string
    team: Team | null
    isAlive: boolean
    health: number
}

export const RemotePlayer = ({ id, position, rotation, name, team, isAlive, health }: RemotePlayerProps) => {
    const groupRef = useRef<Group>(null)

    useFrame(() => {
        if (groupRef.current) {
            // Smoothly lerp to position
            groupRef.current.position.lerp(new Vector3(...position), 0.2)
            groupRef.current.rotation.y = rotation
        }
    })

    if (!isAlive && health <= 0) return null

    const teamColor = team === 'counter-terrorists' ? '#3b82f6' : '#dc2626'

    return (
        <group ref={groupRef} position={position}>
            {/* Player Name Tag */}
            <Text
                position={[0, 2.2, 0]}
                fontSize={0.3}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {name}
            </Text>

            {/* Health Bar Background */}
            <mesh position={[0, 2.5, 0]}>
                <planeGeometry args={[1, 0.1]} />
                <meshBasicMaterial color="black" />
            </mesh>

            {/* Health Bar Fill */}
            <mesh position={[-(1 - health / 100) * 0.5, 2.5, 0.01]}>
                <planeGeometry args={[health / 100, 0.1]} />
                <meshBasicMaterial color={health > 30 ? "#4ade80" : "#f87171"} />
            </mesh>

            {/* Player Body - Contains userData with onHit for bullet hits */}
            <mesh
                castShadow
                userData={{
                    hittable: true,
                    playerId: id,
                    isBot: false,
                    onHit: () => { /* Player.tsx calls this to trigger reportHit */ }
                }}
            >
                <capsuleGeometry args={[0.4, 1, 4, 8]} />
                <meshStandardMaterial color={teamColor} />

                {/* Visual indicator for front */}
                <mesh position={[0, 0.5, 0.3]}>
                    <boxGeometry args={[0.2, 0.2, 0.2]} />
                    <meshStandardMaterial color="black" />
                </mesh>
            </mesh>
        </group>
    )
}
