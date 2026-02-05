import { useStore } from '../store'
import { Billboard, Text, Sphere, Float } from '@react-three/drei'
import * as THREE from 'three'
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export const GrenadeEffects = () => {
    const activeEffects = useStore(state => state.activeEffects)

    return (
        <group>
            {activeEffects.map((fx) => (
                <group key={fx.id} position={fx.position}>
                    {fx.type === 'molotov' && <MolotovEffect />}
                    {fx.type === 'smoke' && <SmokeEffect />}
                    {fx.type === 'heGrenade' && <ExplosionEffect />}
                    {fx.type === 'flash' && <FlashVisualEffect />}
                </group>
            ))}
        </group>
    )
}

const MolotovEffect = () => {
    return (
        <group>
            {/* Burnt ground decal */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <circleGeometry args={[2.5, 32]} />
                <meshStandardMaterial color="#0a0500" transparent opacity={0.9} />
            </mesh>

            {/* Fire Light */}
            <pointLight distance={10} intensity={10} color="#ff4400" position={[0, 1, 0]} />

            {/* Fire Base */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <circleGeometry args={[2.2, 32]} />
                <meshStandardMaterial color="#ff2200" transparent opacity={0.4} emissive="#ff2200" emissiveIntensity={5} />
            </mesh>

            {/* Simulated Particles (Flames) */}
            {Array.from({ length: 25 }).map((_, i) => (
                <Float key={i} speed={2} rotationIntensity={2} floatIntensity={2} position={[(Math.random() - 0.5) * 4, Math.random() * 2, (Math.random() - 0.5) * 4]}>
                    <Sphere args={[Math.random() * 0.2 + 0.1, 8, 8]}>
                        <meshBasicMaterial color={i % 3 === 0 ? "#ff8800" : i % 3 === 1 ? "#ffcc00" : "#ff0000"} transparent opacity={0.7} />
                    </Sphere>
                </Float>
            ))}

            <Billboard position={[0, 3, 0]}>
                <Text fontSize={0.5} color="#ff3300" outlineColor="black" outlineWidth={0.05} font="https://fonts.gstatic.com/s/modak/v18/8Nbm8P3Yv6Wf-M6G-Q.woff">ALOV! 🔥</Text>
            </Billboard>
        </group>
    )
}

const SmokeEffect = () => {
    const group = useRef<THREE.Group>(null)

    useFrame(() => {
        if (group.current) {
            group.current.rotation.y += 0.005
        }
    })

    return (
        <group ref={group}>
            {/* Large central volume */}
            <Sphere args={[3, 32, 24]}>
                <meshStandardMaterial color="#888" transparent opacity={0.6} depthWrite={false} roughness={1} />
            </Sphere>

            {/* Clustered wisps */}
            {Array.from({ length: 12 }).map((_, i) => (
                <Sphere
                    key={i}
                    args={[1.5 + Math.random(), 16, 16]}
                    position={[(Math.random() - 0.5) * 4, Math.random() * 2, (Math.random() - 0.5) * 4]}
                >
                    <meshStandardMaterial color="#aaaaaa" transparent opacity={0.3} depthWrite={false} />
                </Sphere>
            ))}
        </group>
    )
}

const ExplosionEffect = () => {
    return (
        <group>
            <pointLight distance={15} intensity={50} color="#ffaa00" />

            {/* Explosion flash */}
            <Sphere args={[4, 32, 32]}>
                <meshBasicMaterial color="#ffffff" transparent opacity={0.9} />
            </Sphere>

            {/* Core heat fireball */}
            <Sphere args={[3, 16, 16]}>
                <meshStandardMaterial color="#ffaa00" emissive="#ff4400" emissiveIntensity={20} transparent opacity={0.8} />
            </Sphere>

            {/* Shockwave circle */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <circleGeometry args={[6, 32]} />
                <meshBasicMaterial color="white" transparent opacity={0.4} />
            </mesh>

            {/* Debris particles */}
            {Array.from({ length: 20 }).map((_, i) => (
                <mesh
                    key={i}
                    position={[(Math.random() - 0.5) * 2, Math.random() * 3, (Math.random() - 0.5) * 2]}
                >
                    <boxGeometry args={[0.1, 0.1, 0.1]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            ))}
        </group>
    )
}

const FlashVisualEffect = () => {
    return (
        <group>
            <pointLight distance={20} intensity={100} color="#ffffff" />
            <mesh>
                <sphereGeometry args={[2, 16, 16]} />
                <meshBasicMaterial color="white" transparent opacity={1} />
            </mesh>
        </group>
    )
}

